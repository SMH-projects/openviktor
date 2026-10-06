import type { Logger } from "@openviktor/shared";
import type { ToolBackend, ToolExecutionContext, ToolRegistry } from "@openviktor/tools";
import { ensureWorkspace } from "@openviktor/tools";

interface GatewayRequest {
	role: string;
	arguments: Record<string, unknown>;
}

interface GatewayDeps {
	registry: ToolRegistry;
	backend: ToolBackend;
	logger: Logger;
	defaultTimeoutMs: number;
}

const TOKEN_WORKSPACE_MAP = new Map<string, string>();
const DISCOVERY_WORKSPACE_MAP = new Map<string, string>();
const DISCOVERY_TOOL_ALLOWLIST = new Map<string, ReadonlySet<string>>();

export function registerWorkspaceToken(token: string, workspaceId: string): void {
	const discoveryWorkspace = DISCOVERY_WORKSPACE_MAP.get(token);
	if (discoveryWorkspace && discoveryWorkspace !== workspaceId) {
		throw new Error("A discovery token cannot change workspaces");
	}
	TOKEN_WORKSPACE_MAP.set(token, workspaceId);
}

export function registerDiscoveryToken(
	token: string,
	workspaceId: string,
	allowedTools: string[],
): void {
	if (
		!/^[\x21-\x7e]{32,}$/.test(token) ||
		!workspaceId ||
		token === "local" ||
		!allowedTools.length ||
		allowedTools.some((name) => !name.trim())
	) {
		throw new Error("A dedicated workspace discovery token is required");
	}
	const existing = DISCOVERY_WORKSPACE_MAP.get(token) ?? TOKEN_WORKSPACE_MAP.get(token);
	if (existing && existing !== workspaceId) {
		throw new Error("A discovery token cannot change workspaces");
	}
	const priorTools = DISCOVERY_TOOL_ALLOWLIST.get(token);
	if (
		priorTools &&
		(priorTools.size !== new Set(allowedTools).size ||
			allowedTools.some((name) => !priorTools.has(name)))
	) {
		throw new Error("A discovery token cannot change its allowed tools");
	}
	DISCOVERY_WORKSPACE_MAP.set(token, workspaceId);
	DISCOVERY_TOOL_ALLOWLIST.set(token, new Set(allowedTools));
	registerWorkspaceToken(token, workspaceId);
}

export function resolveWorkspaceFromToken(token: string): string | null {
	return TOKEN_WORKSPACE_MAP.get(token) ?? null;
}

function validateAuth(req: Request, discovery = false): string | Response {
	const authHeader = req.headers.get("authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const token = authHeader.slice(7);
	const workspaceId = discovery
		? DISCOVERY_WORKSPACE_MAP.get(token)
		: resolveWorkspaceFromToken(token);
	if (!workspaceId) {
		return Response.json({ error: "Invalid token" }, { status: 403 });
	}
	return workspaceId;
}

async function parseBody(req: Request): Promise<GatewayRequest | Response> {
	try {
		const body = (await req.json()) as Record<string, unknown>;
		if (
			body.arguments !== undefined &&
			(typeof body.arguments !== "object" ||
				body.arguments === null ||
				Array.isArray(body.arguments))
		) {
			return Response.json(
				{ error: "Invalid 'arguments' field: must be an object" },
				{ status: 400 },
			);
		}
		return body as unknown as GatewayRequest;
	} catch {
		return Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}
}

export function createToolGateway(deps: GatewayDeps): {
	fetch: (req: Request) => Promise<Response>;
} {
	const { registry, backend, logger, defaultTimeoutMs } = deps;

	async function handleToolCall(workspaceId: string, body: GatewayRequest): Promise<Response> {
		if (!body.role || typeof body.role !== "string") {
			return Response.json({ error: "Missing or invalid 'role' field" }, { status: 400 });
		}

		const resolvedKey = registry.resolve(body.role, workspaceId);
		if (!resolvedKey) {
			return Response.json({ error: `Unknown tool: ${body.role}` }, { status: 404 });
		}

		const workspaceDir = await ensureWorkspace(workspaceId);
		const ctx: ToolExecutionContext = { workspaceId, workspaceDir, timeoutMs: defaultTimeoutMs };

		logger.info({ tool: body.role, workspaceId }, "Tool call started");
		const start = Date.now();
		const useLocal = registry.isLocalOnly(resolvedKey);
		const result = useLocal
			? await registry.execute(resolvedKey, body.arguments ?? {}, ctx)
			: await backend.execute(body.role, body.arguments ?? {}, ctx);
		const durationMs = Date.now() - start;

		if (result.error) {
			logger.warn(
				{ tool: body.role, workspaceId, durationMs, error: result.error, args: body.arguments },
				"Tool call failed",
			);
			return Response.json({ error: result.error });
		}

		logger.info({ tool: body.role, workspaceId, durationMs }, "Tool call completed");
		return Response.json({ result: result.output });
	}

	return {
		fetch: async (req: Request): Promise<Response> => {
			const url = new URL(req.url, "http://localhost");

			if (req.method === "GET" && url.pathname === "/health") {
				return Response.json({ status: "ok", tools: registry.getAllDefinitions().length });
			}

			if (
				!(
					(req.method === "POST" && url.pathname === "/v1/tools/call") ||
					(req.method === "GET" && url.pathname === "/v1/tools")
				)
			) {
				return Response.json({ error: "Not found" }, { status: 404 });
			}

			const authResult = validateAuth(req, req.method === "GET");
			if (authResult instanceof Response) return authResult;
			const allowed = DISCOVERY_TOOL_ALLOWLIST.get(
				req.headers.get("authorization")?.slice(7) ?? "",
			);

			if (req.method === "GET" && url.pathname === "/v1/tools") {
				return Response.json({
					workspaceId: authResult,
					tools: registry
						.getDefinitionsForWorkspace(authResult)
						.filter((tool) => allowed?.has("*") || allowed?.has(tool.name)),
				});
			}

			const bodyResult = await parseBody(req);
			if (bodyResult instanceof Response) return bodyResult;
			if (allowed && !allowed.has("*") && !allowed.has(bodyResult.role)) {
				return Response.json({ error: "Tool not allowed for this token" }, { status: 403 });
			}

			return handleToolCall(authResult, bodyResult);
		},
	};
}
