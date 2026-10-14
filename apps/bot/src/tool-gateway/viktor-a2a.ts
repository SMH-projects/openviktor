import { createPublicKey, verify, type KeyObject } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import {
	AgentEvent,
	DefaultRequestHandler,
	InMemoryTaskStore,
	JsonRpcTransportHandler,
	ServerCallContext,
	type AgentExecutor,
	type RequestContext,
	type ExecutionEventBus,
} from "@a2a-js/sdk/server";
import { Role, TaskState, type AgentCard } from "@a2a-js/sdk";
import type { AgentGrant, AgentReceipt, AgentTask, AgentTaskGatewayDeps } from "./agent-task.js";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;
const OWNER = /^owner:tg:([1-9][0-9]*)$/;
const READ_TOOLS = ["read_learnings"];

export function readViktorA2APublicKeyFile(path: string): KeyObject {
	if (!isAbsolute(path)) throw new Error("Viktor A2A verifier path must be absolute");
	const stat = lstatSync(path);
	if (!stat.isFile() || (stat.uid !== 0 && stat.uid !== process.getuid?.())
		|| (stat.mode & 0o022) !== 0 || stat.size > 4096) {
		throw new Error("Viktor A2A verifier permissions invalid");
	}
	const key = createPublicKey(readFileSync(path));
	if (key.asymmetricKeyType !== "ed25519") throw new Error("Viktor A2A verifier algorithm invalid");
	return key;
}

interface A2ADeps extends Omit<AgentTaskGatewayDeps, "lookupGrant" | "readReservation"> {
	publicKey: KeyObject;
	audience: string;
	tenant: string;
	readBinding: () => AgentGrant | null;
}

function decodeJson(encoded: string): Record<string, unknown> | null {
	if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
	try {
		const decoded: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
		return decoded && typeof decoded === "object" && !Array.isArray(decoded)
			? decoded as Record<string, unknown> : null;
	} catch {
		return null;
	}
}

function verifiedOwner(auth: string | null, deps: A2ADeps): string | null {
	if (!auth?.startsWith("Bearer ") || auth.length > 4096) return null;
	const parts = auth.slice(7).split(".");
	if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return null;
	const [header, claims, signature] = parts;
	const parsedHeader = decodeJson(header);
	const payload = decodeJson(claims);
	if (!parsedHeader || parsedHeader.alg !== "EdDSA" || parsedHeader.typ !== "JWT" || !payload
		|| payload.iss !== "twin" || payload.aud !== deps.audience
		|| typeof payload.sub !== "string" || !OWNER.test(payload.sub)
		|| typeof payload.jti !== "string" || payload.jti.length < 8 || payload.jti.length > 256
		|| typeof payload.iat !== "number" || !Number.isSafeInteger(payload.iat)
		|| typeof payload.exp !== "number" || !Number.isSafeInteger(payload.exp)) return null;
	const now = Math.floor(Date.now() / 1000);
	if (payload.iat > now + 30 || payload.exp <= now || payload.exp <= payload.iat
		|| payload.exp - payload.iat > 300) return null;
	try {
		return verify(null, Buffer.from(`${header}.${claims}`), deps.publicKey,
			Buffer.from(signature, "base64url")) ? payload.sub : null;
	} catch {
		return null;
	}
}

function messageText(requestContext: RequestContext): string | null {
	const text = requestContext.userMessage.parts
		.map((part) => part.content?.$case === "text" ? part.content.value : "")
		.join("").trim();
	return text || null;
}

function ownerFromContext(requestContext: RequestContext): string | null {
	const ownerId = requestContext.context.state.get("ownerId");
	return typeof ownerId === "string" && OWNER.test(ownerId) ? ownerId : null;
}

function createCard(audience: string, tenant: string): AgentCard {
	return {
		name: "Viktor",
		description: "Owner-scoped read-only workspace learnings",
		supportedInterfaces: [{ protocolBinding: "JSONRPC", url: audience, tenant, protocolVersion: "1.0" }],
		provider: { organization: "SMH-projects", url: "https://github.com/SMH-projects/openviktor" },
		version: "1.0.0",
		capabilities: { streaming: false, pushNotifications: false, extensions: [] },
		securitySchemes: { ownerJwt: { scheme: { $case: "httpAuthSecurityScheme", value: {
			description: "Twin owner JWT", scheme: "Bearer", bearerFormat: "JWT",
		} } } },
		securityRequirements: [{ schemes: { ownerJwt: { list: [] } } }],
		defaultInputModes: ["text/plain"], defaultOutputModes: ["text/plain"],
		skills: [{ id: "viktor.read_workspace_learnings", name: "Read workspace learnings",
			description: "Answer read-only questions from workspace learnings.", tags: ["learnings"], examples: [],
			inputModes: ["text/plain"], outputModes: ["text/plain"], securityRequirements: [{ schemes: { ownerJwt: { list: [] } } }] }],
		signatures: [],
	};
}

function createExecutor(deps: A2ADeps): AgentExecutor {
	return {
		execute: async (requestContext, eventBus) => {
			const ownerId = ownerFromContext(requestContext);
			if (!ownerId) throw new Error("Owner context unavailable");
			const text = messageText(requestContext);
			if (!text || requestContext.userMessage.role !== Role.ROLE_USER) throw new Error("Invalid owner message");
			const scope = { workspaceId: deps.readBinding()?.workspaceId ?? "", principalId: deps.readBinding()?.principalId ?? "",
				requestId: requestContext.userMessage.messageId };
			if (!scope.workspaceId || !scope.principalId || scope.principalId !== ownerId.replace("owner:tg:", "tg-")) {
				throw new Error("Owner binding unavailable");
			}
			const taskId = requestContext.taskId;
			const context = requestContext.contextId;
			const metadata = { "tvin.owner_scope": { tenant: deps.tenant, ownerId } };
			const publishStatus = (state: TaskState) => eventBus.publish(AgentEvent.statusUpdate({ taskId, contextId: context,
				status: { state, message: undefined, timestamp: new Date().toISOString() }, metadata }));
			const accepted = await deps.reserve({ ...scope, task: text });
			eventBus.publish(AgentEvent.task({ id: taskId, contextId: context, status: {
				state: TaskState.TASK_STATE_WORKING, message: undefined, timestamp: new Date().toISOString(),
			}, history: [requestContext.userMessage], artifacts: [], metadata }));
			if (!accepted) {
				const receipt = await deps.readReceipt(scope);
				if (!receipt) throw new Error("Task unavailable");
				publishReceipt(eventBus, taskId, context, metadata, receipt);
				return;
			}
			try {
				const receipt = await deps.run({ ...scope, task: text, allowedTools: [...READ_TOOLS] });
				publishReceipt(eventBus, taskId, context, metadata, receipt);
			} catch {
				publishStatus(TaskState.TASK_STATE_WORKING);
			}
		},
		cancelTask: async (taskId, eventBus) => {
			eventBus.publish(AgentEvent.statusUpdate({ taskId, contextId: "",
				status: { state: TaskState.TASK_STATE_CANCELED, message: undefined, timestamp: new Date().toISOString() }, metadata: undefined }));
		},
	};
}

function publishReceipt(eventBus: ExecutionEventBus, taskId: string, contextIdValue: string,
	metadata: Record<string, unknown>, receipt: AgentReceipt): void {
	eventBus.publish(AgentEvent.artifactUpdate({ taskId, contextId: contextIdValue, append: false, lastChunk: true,
		metadata, artifact: { artifactId: receipt.agentRunId, name: "response", description: "Viktor response",
			parts: [{ content: { $case: "text", value: receipt.responseText }, metadata: undefined, filename: "", mediaType: "text/plain" }],
			metadata: undefined, extensions: [] } }));
	eventBus.publish(AgentEvent.statusUpdate({ taskId, contextId: contextIdValue,
		status: { state: TaskState.TASK_STATE_COMPLETED, message: undefined, timestamp: new Date().toISOString() }, metadata }));
}

export function createViktorA2AGateway(deps: A2ADeps): { fetch: (req: Request) => Promise<Response> } {
	if (new URL(deps.audience).protocol !== "https:" || !IDENTIFIER.test(deps.tenant)
		|| deps.publicKey.asymmetricKeyType !== "ed25519") throw new Error("Viktor A2A configuration invalid");
	const card = createCard(deps.audience, deps.tenant);
	const handler = new DefaultRequestHandler(card, new InMemoryTaskStore(), createExecutor(deps));
	const transport = new JsonRpcTransportHandler(handler);
	return { fetch: async (req) => {
		const url = new URL(req.url);
		if (req.method === "GET" && url.pathname === "/.well-known/agent-card.json") return Response.json(await handler.getAgentCard());
		if (req.method !== "POST" || url.pathname !== new URL(deps.audience).pathname) return Response.json({ error: "Not found" }, { status: 404 });
		const ownerId = verifiedOwner(req.headers.get("authorization"), deps);
		if (!ownerId) return Response.json({ error: "Unauthorized" }, { status: 401 });
		const binding = deps.readBinding();
		if (!binding || binding.principalId !== ownerId.replace("owner:tg:", "tg-") || binding.expiresAt <= Date.now()) {
			return Response.json({ error: "Forbidden" }, { status: 403 });
		}
		let body: unknown;
		try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
		const message = (body as { params?: { message?: { metadata?: Record<string, unknown> } } }).params?.message;
		const ownerScope = message?.metadata?.["tvin.owner_scope"];
		if (ownerScope !== undefined && (!ownerScope || typeof ownerScope !== "object"
			|| (ownerScope as Record<string, unknown>).tenant !== deps.tenant
			|| (ownerScope as Record<string, unknown>).ownerId !== ownerId)) {
			return Response.json({ error: "Forbidden" }, { status: 403 });
		}
		const context = new ServerCallContext({ tenant: deps.tenant, requestedVersion: "1.0", state: new Map([["ownerId", ownerId]]) });
		const result = await transport.handle(body as Record<string, unknown>, context);
		const response = result instanceof Object && Symbol.asyncIterator in result
			? await (async () => { let last: unknown; for await (const item of result) last = item; return last; })()
			: result;
		return Response.json(response);
	}};
}
