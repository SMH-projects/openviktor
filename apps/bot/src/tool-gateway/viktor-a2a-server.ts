import { type KeyObject, createPublicKey, verify } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { type AgentCard, Role, type Task, TaskState } from "@a2a-js/sdk";
import { LegacyJsonRpcTransportHandler } from "@a2a-js/sdk/compat/v0_3/server";
import {
	AgentEvent,
	type AgentExecutor,
	DefaultRequestHandler,
	InMemoryTaskStore,
	JsonRpcTransportHandler,
	type RequestContext,
	ServerCallContext,
} from "@a2a-js/sdk/server";
import type { AgentGrant, AgentTaskGatewayDeps } from "./agent-task.js";

/**
 * A2A server for Viktor on the official @a2a-js/sdk.
 *
 * Authorization is service-level: the caller proves it is the box (Ed25519 JWT signed with
 * the box key, iss=twin, scope=twin:agent). The human owner from the JWT `sub` is NOT matched
 * against the workspace binding; it is only recorded in task metadata for accounting.
 * The agent always runs in the workspace from the box binding.
 */

const OWNER = /^owner:tg:[1-9][0-9]*$/;
const SKILL = "viktor.full_agent_task";

export function readViktorA2APublicKeyFile(path: string): KeyObject {
	if (!isAbsolute(path)) throw new Error("Viktor A2A verifier path must be absolute");
	const stat = lstatSync(path);
	if (
		!stat.isFile() ||
		(stat.uid !== 0 && stat.uid !== process.getuid?.()) ||
		(stat.mode & 0o022) !== 0 ||
		stat.size > 4096
	) {
		throw new Error("Viktor A2A verifier permissions invalid");
	}
	const key = createPublicKey(readFileSync(path));
	if (key.asymmetricKeyType !== "ed25519") throw new Error("Viktor A2A verifier algorithm invalid");
	return key;
}

export interface ViktorA2ADeps extends Pick<AgentTaskGatewayDeps, "reserve" | "run"> {
	publicKey: KeyObject;
	audience: string;
	tenant: string;
	readBinding: () => Pick<AgentGrant, "workspaceId" | "principalId"> | null;
}

function decodePart(value: string): Record<string, unknown> | null {
	if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
	try {
		const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

/** Returns the owner label (for metadata only) if the box token is valid, else null. */
function verifyBoxToken(header: string | null, deps: ViktorA2ADeps): string | null {
	if (!header?.startsWith("Bearer ") || header.length > 4096) return null;
	const parts = header.slice(7).split(".");
	if (parts.length !== 3) return null;
	const [h, c, s] = parts;
	const jwtHeader = decodePart(h);
	const claims = decodePart(c);
	if (
		!jwtHeader ||
		jwtHeader.alg !== "EdDSA" ||
		jwtHeader.typ !== "JWT" ||
		!claims ||
		claims.iss !== "twin" ||
		claims.aud !== deps.audience ||
		claims.scope !== "twin:agent" ||
		typeof claims.sub !== "string" ||
		!OWNER.test(claims.sub) ||
		typeof claims.iat !== "number" ||
		typeof claims.exp !== "number"
	)
		return null;
	const now = Math.floor(Date.now() / 1000);
	if (
		claims.iat > now + 30 ||
		claims.exp <= now ||
		claims.exp <= claims.iat ||
		claims.exp - claims.iat > 300
	)
		return null;
	try {
		return verify(null, Buffer.from(`${h}.${c}`), deps.publicKey, Buffer.from(s, "base64url"))
			? claims.sub
			: null;
	} catch {
		return null;
	}
}

function textOf(context: RequestContext): string {
	return context.userMessage.parts
		.map((part) => (part.content?.$case === "text" ? part.content.value : ""))
		.join("")
		.trim();
}

function status(state: TaskState, text?: string, messageId?: string) {
	return {
		state,
		timestamp: new Date().toISOString(),
		message:
			text && messageId
				? {
						messageId,
						contextId: "",
						taskId: "",
						role: Role.ROLE_AGENT,
						parts: [
							{
								content: { $case: "text" as const, value: text },
								metadata: undefined,
								filename: "",
								mediaType: "text/plain",
							},
						],
						metadata: undefined,
						extensions: [],
						referenceTaskIds: [],
					}
				: undefined,
	};
}

function createCard(deps: ViktorA2ADeps): AgentCard {
	const bearer = { schemes: { boxToken: { list: [] as string[] } } };
	return {
		name: "Viktor",
		description: "Workspace agent, called by the box as a service",
		supportedInterfaces: [
			{
				protocolBinding: "JSONRPC",
				url: deps.audience,
				tenant: deps.tenant,
				protocolVersion: "1.0",
			},
		],
		provider: { organization: "SMH-projects", url: "https://github.com/SMH-projects/openviktor" },
		version: "1.0.0",
		capabilities: { streaming: false, pushNotifications: false, extensions: [] },
		securitySchemes: {
			boxToken: {
				scheme: {
					$case: "httpAuthSecurityScheme",
					value: { description: "Box service token", scheme: "Bearer", bearerFormat: "JWT" },
				},
			},
		},
		securityRequirements: [bearer],
		defaultInputModes: ["text/plain"],
		defaultOutputModes: ["text/plain"],
		skills: [
			{
				id: SKILL,
				name: "Full agent task",
				description: "Run a task through Viktor's native agent and workspace tools",
				tags: ["agent", "workspace"],
				examples: [],
				inputModes: ["text/plain"],
				outputModes: ["text/plain"],
				securityRequirements: [bearer],
			},
		],
		signatures: [],
	};
}

/**
 * Public card in A2A 0.3 JSON form: this is what the box client (official a2a-sdk 0.3 resolver in the
 * twin) parses. The SDK's own card object is the internal protobuf shape ($case wrappers, no top-level
 * url/security) and is rejected by that client, so Viktor would never be offered to the owner.
 */
export function createLegacyCard(deps: ViktorA2ADeps) {
	return {
		protocolVersion: "0.3.0",
		name: "Viktor",
		description: "Workspace agent, called by the box as a service",
		url: deps.audience,
		preferredTransport: "JSONRPC",
		version: "1.0.0",
		provider: { organization: "SMH-projects", url: "https://github.com/SMH-projects/openviktor" },
		capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
		securitySchemes: { boxToken: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
		security: [{ boxToken: [] }],
		defaultInputModes: ["text/plain"],
		defaultOutputModes: ["text/plain"],
		skills: [
			{
				id: SKILL,
				name: "Full agent task",
				description: "Run a task through Viktor's native agent and workspace tools",
				tags: ["agent", "workspace"],
			},
		],
	};
}

function createExecutor(deps: ViktorA2ADeps): AgentExecutor {
	return {
		execute: async (context, events) => {
			const ownerId = context.context.state.get("ownerId");
			const text = textOf(context);
			const binding = deps.readBinding();
			if (
				typeof ownerId !== "string" ||
				!text ||
				context.userMessage.role !== Role.ROLE_USER ||
				!binding
			) {
				throw new Error("Invalid task");
			}
			const metadata = { "tvin.owner_scope": { tenant: deps.tenant, ownerId } };
			const base = { taskId: context.taskId, contextId: context.contextId, metadata };
			const task: Task = {
				id: context.taskId,
				contextId: context.contextId,
				status: status(TaskState.TASK_STATE_WORKING),
				history: [context.userMessage],
				artifacts: [],
				metadata,
			};
			events.publish(AgentEvent.task(task));
			const scope = {
				workspaceId: binding.workspaceId,
				principalId: binding.principalId,
				requestId: context.taskId,
			};
			try {
				await deps.reserve({ ...scope, task: text });
				const receipt = await deps.run({
					...scope,
					task: text,
				});
				events.publish(
					AgentEvent.artifactUpdate({
						...base,
						append: false,
						lastChunk: true,
						artifact: {
							artifactId: receipt.agentRunId,
							name: "response",
							description: "Viktor response",
							parts: [
								{
									content: { $case: "text", value: receipt.responseText },
									metadata: undefined,
									filename: "",
									mediaType: "text/plain",
								},
							],
							metadata,
							extensions: [],
						},
					}),
				);
				events.publish(
					AgentEvent.statusUpdate({ ...base, status: status(TaskState.TASK_STATE_COMPLETED) }),
				);
			} catch (error) {
				const reason =
					error instanceof Error && error.message ? error.message : "Agent execution failed";
				events.publish(
					AgentEvent.statusUpdate({
						...base,
						status: status(TaskState.TASK_STATE_FAILED, reason, `${context.taskId}-failure`),
					}),
				);
			}
		},
		cancelTask: async (taskId, events) => {
			events.publish(
				AgentEvent.statusUpdate({
					taskId,
					contextId: "",
					status: status(TaskState.TASK_STATE_CANCELED),
					metadata: undefined,
				}),
			);
		},
	};
}

export function createViktorA2AServer(deps: ViktorA2ADeps): {
	fetch: (req: Request) => Promise<Response>;
} {
	if (
		new URL(deps.audience).protocol !== "https:" ||
		deps.publicKey.asymmetricKeyType !== "ed25519"
	) {
		throw new Error("Viktor A2A configuration invalid");
	}
	const handler = new DefaultRequestHandler(
		createCard(deps),
		new InMemoryTaskStore(),
		createExecutor(deps),
	);
	const v1 = new JsonRpcTransportHandler(handler);
	const legacy = new LegacyJsonRpcTransportHandler(handler);
	const path = new URL(deps.audience).pathname;
	return {
		fetch: async (req) => {
			const url = new URL(req.url);
			if (req.method === "GET" && url.pathname === "/.well-known/agent-card.json") {
				return Response.json(createLegacyCard(deps));
			}
			if (req.method !== "POST" || url.pathname !== path) {
				return Response.json({ error: "Not found" }, { status: 404 });
			}
			const ownerId = verifyBoxToken(req.headers.get("authorization"), deps);
			if (!ownerId) return Response.json({ error: "Unauthorized" }, { status: 401 });
			let body: Record<string, unknown>;
			try {
				body = (await req.json()) as Record<string, unknown>;
			} catch {
				return Response.json({ error: "Invalid JSON" }, { status: 400 });
			}
			if (!body || typeof body !== "object" || Array.isArray(body)) {
				return Response.json({ error: "Invalid RPC" }, { status: 400 });
			}
			const context = new ServerCallContext({
				tenant: deps.tenant,
				requestedVersion: "1.0",
				state: new Map([["ownerId", ownerId]]),
			});
			const isLegacy = ["message/send", "message/stream", "tasks/get", "tasks/cancel"].includes(
				String(body.method),
			);
			const result = await (isLegacy ? legacy : v1).handle(body, context);
			if (result instanceof Object && Symbol.asyncIterator in result) {
				let last: unknown;
				for await (const item of result as AsyncIterable<unknown>) last = item;
				return Response.json(last);
			}
			return Response.json(result);
		},
	};
}
