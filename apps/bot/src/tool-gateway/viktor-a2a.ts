import { createHash, createPublicKey, verify, type KeyObject } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
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

interface A2ADeps extends Omit<AgentTaskGatewayDeps, "lookupGrant"> {
	publicKey: KeyObject;
	audience: string;
	tenant: string;
	readBinding: () => AgentGrant | null;
	readTaskDigest: (scope: Omit<AgentTask, "task">) => Promise<string | null>;
}

function decodeJson(encoded: string): Record<string, unknown> | null {
	if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
	try {
		const decoded: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
		if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return null;
		return decoded as Record<string, unknown>;
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
	if (!parsedHeader || Object.keys(parsedHeader).sort().join(",") !== "alg,typ"
		|| parsedHeader.alg !== "EdDSA" || parsedHeader.typ !== "JWT" || !payload
		|| Object.keys(payload).sort().join(",") !== "aud,exp,iat,iss,jti,sub"
		|| payload.iss !== "twin" || payload.aud !== deps.audience
		|| typeof payload.sub !== "string" || !OWNER.test(payload.sub)
		|| typeof payload.jti !== "string" || payload.jti.length < 8 || payload.jti.length > 256
		|| typeof payload.iat !== "number" || !Number.isSafeInteger(payload.iat)
		|| typeof payload.exp !== "number" || !Number.isSafeInteger(payload.exp)) return null;
	const now = Math.floor(Date.now() / 1000);
	if (payload.iat > now + 30 || payload.exp <= now || payload.exp <= payload.iat
		|| payload.exp - payload.iat > 300) return null;
	const signed = Buffer.from(`${header}.${claims}`);
	try {
		return verify(null, signed, deps.publicKey, Buffer.from(signature, "base64url"))
			? payload.sub : null;
	} catch {
		return null;
	}
}

function context(tenant: string, ownerId: string): string {
	return createHash("sha256").update(`${tenant}\0${ownerId}`).digest("hex");
}

function taskId(contextId: string, requestId: string): string {
	return `${contextId}.${requestId}`;
}

function result(scope: Omit<AgentTask, "task">, tenant: string, ownerId: string,
	state: "working" | "completed" | "failed", receipt: AgentReceipt | null) {
	const contextId = context(tenant, ownerId);
	return {
		kind: "task", id: taskId(contextId, scope.requestId), contextId,
		status: { state }, metadata: { "tvin.owner_scope": { tenant, ownerId } },
		...(state === "completed" && receipt?.responseText.trim()
			? { artifacts: [{ artifactId: receipt.agentRunId,
				parts: [{ kind: "text", text: receipt.responseText }] }] } : {}),
	};
}

function rpc(id: string, task: ReturnType<typeof result>): Response {
	return Response.json({ jsonrpc: "2.0", id, result: task });
}

export function createViktorA2AGateway(deps: A2ADeps): { fetch: (req: Request) => Promise<Response> } {
	if (new URL(deps.audience).protocol !== "https:" || !IDENTIFIER.test(deps.tenant)
		|| deps.publicKey.asymmetricKeyType !== "ed25519") {
		throw new Error("Viktor A2A configuration invalid");
	}
	return { fetch: async (req: Request): Promise<Response> => {
		if (req.method !== "POST" || new URL(req.url).pathname !== new URL(deps.audience).pathname) {
			return Response.json({ error: "Not found" }, { status: 404 });
		}
		const ownerId = verifiedOwner(req.headers.get("authorization"), deps);
		if (!ownerId) return Response.json({ error: "Unauthorized" }, { status: 401 });
		const match = OWNER.exec(ownerId);
		const binding = deps.readBinding();
		if (!match || !binding || binding.expiresAt <= Date.now()
			|| binding.workspaceId !== deps.tenant || binding.principalId !== `tg-${match[1]}`) {
			return Response.json({ error: "Forbidden" }, { status: 403 });
		}
		let payload: unknown;
		try {
			payload = await req.json();
		} catch {
			return Response.json({ error: "Invalid JSON" }, { status: 400 });
		}
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
			return Response.json({ error: "Invalid RPC" }, { status: 400 });
		}
		const request = payload as Record<string, unknown>;
		if (request.jsonrpc !== "2.0" || typeof request.id !== "string"
			|| !IDENTIFIER.test(request.id) || !request.params || typeof request.params !== "object"
			|| Array.isArray(request.params)) {
			return Response.json({ error: "Invalid RPC" }, { status: 400 });
		}
		const params = request.params as Record<string, unknown>;
		let requestId: string;
		let messageText: string | null = null;
		if (request.method === "message/send") {
			const message = params.message;
			if (!message || typeof message !== "object" || Array.isArray(message)) {
				return Response.json({ error: "Invalid message" }, { status: 400 });
			}
			const input = message as Record<string, unknown>;
			const metadata = input.metadata as Record<string, unknown> | null;
			const scope = metadata?.["tvin.owner_scope"];
			const parts = input.parts;
			if (input.kind !== "message" || input.role !== "user" || input.messageId !== request.id
				|| !Array.isArray(parts) || parts.length !== 1 || !parts[0]
				|| typeof parts[0] !== "object" || parts[0].kind !== "text"
				|| typeof parts[0].text !== "string" || !parts[0].text.trim()
				|| new TextEncoder().encode(parts[0].text).length > 2000
				|| !metadata || Object.keys(metadata).sort().join(",") !== "tvin.owner_scope"
				|| !scope || typeof scope !== "object" || Array.isArray(scope)
				|| (scope as Record<string, unknown>).ownerId !== ownerId
				|| (scope as Record<string, unknown>).tenant !== deps.tenant) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}
			requestId = request.id;
			messageText = parts[0].text;
		} else if (request.method === "tasks/get") {
			if (typeof params.id !== "string" || !params.id.startsWith(`${context(deps.tenant, ownerId)}.`)) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}
			requestId = params.id.slice(context(deps.tenant, ownerId).length + 1);
			if (!IDENTIFIER.test(requestId)) return Response.json({ error: "Invalid task id" }, { status: 400 });
		} else {
			return Response.json({ error: "Unsupported method" }, { status: 400 });
		}
		const scoped = { workspaceId: binding.workspaceId, principalId: binding.principalId, requestId };
		if (messageText !== null) {
			try {
				if (await deps.reserve({ ...scoped, task: messageText })) {
					try {
						const receipt = await deps.run({ ...scoped, task: messageText, allowedTools: [...READ_TOOLS] });
						return rpc(request.id, result(scoped, deps.tenant, ownerId, "completed", receipt));
					} catch {
						return rpc(request.id, result(scoped, deps.tenant, ownerId, "working", null));
					}
					}
				const savedDigest = await deps.readTaskDigest(scoped);
				if (!savedDigest || savedDigest !== createHash("sha256").update(messageText).digest("hex")) {
					return Response.json({ error: "Request identity conflict" }, { status: 409 });
				}
			} catch {
				return Response.json({ error: "Reservation unavailable" }, { status: 503 });
			}
		}
		try {
			if (!await deps.readTaskDigest(scoped)) {
				return Response.json({ error: "Unknown A2A task" }, { status: 404 });
			}
			const receipt = await deps.readReceipt(scoped);
			if (receipt) return rpc(request.id, result(scoped, deps.tenant, ownerId, "completed", receipt));
			const reservation = await deps.readReservation?.(scoped);
			if (!reservation) return Response.json({ error: "Unknown task" }, { status: 404 });
			return rpc(request.id, result(scoped, deps.tenant, ownerId,
				reservation === "unknown" ? "failed" : "working", null));
		} catch {
			return Response.json({ error: "Task unavailable" }, { status: 503 });
		}
	} };
}
