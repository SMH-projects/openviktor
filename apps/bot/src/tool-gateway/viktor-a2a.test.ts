import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createViktorA2AGateway, readViktorA2APublicKeyFile } from "./viktor-a2a.js";

const keys = generateKeyPairSync("ed25519");
const audience = "https://viktor.example.test/a2a";
const owner = "owner:tg:123";
const binding = { workspaceId: "guest-workspace-37", principalId: "tg-123", expiresAt: Date.now() + 300_000 };

function bearer(sub = owner, aud = audience, expiry = Math.floor(Date.now() / 1000) + 240) {
	const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
	const now = Math.floor(Date.now() / 1000);
	const signed = `${encode({ alg: "EdDSA", typ: "JWT" })}.${encode({ iss: "twin", sub, aud,
		iat: now, exp: expiry, jti: "one-time-id" })}`;
	return `${signed}.${sign(null, Buffer.from(signed), keys.privateKey).toString("base64url")}`;
}

function setup() {
	let savedDigest: string | null = null;
	const reserve = vi.fn().mockImplementation(async (task: { task: string }) => {
		if (savedDigest) return false;
		savedDigest = createHash("sha256").update(task.task).digest("hex");
		return true;
	});
	const run = vi.fn().mockResolvedValue({ agentRunId: "run-1", responseText: "Learnings", toolReceipt: [] });
	const readReceipt = vi.fn().mockResolvedValue(null);
	const gateway = createViktorA2AGateway({ publicKey: keys.publicKey, audience,
		tenant: "workspace-a", readBinding: () => binding, reserve, run, readReceipt,
	});
	const request = (token = bearer(), text = "Summarize learnings", method = "SendMessage", id: string | number = "req-1", messageId = "req-1") =>
		new Request(audience, { method: "POST", headers: { authorization: `Bearer ${token}` },
			body: JSON.stringify({ jsonrpc: "2.0", id, method, params: method === "GetTask"
				? { id: text }
				: { message: { role: "ROLE_USER", messageId,
					parts: [{ text }], metadata: { "tvin.owner_scope": { tenant: "workspace-a", ownerId: owner } } } } }) });
	return { gateway, request, run, reserve, readReceipt };
}

describe("Viktor owner-scoped A2A endpoint", () => {
	it("serves the official v1 AgentCard with a standard JSON-RPC interface", async () => {
		const { gateway } = setup();
		const cardResponse = await gateway.fetch(new Request("https://viktor.example.test/.well-known/agent-card.json"));
		expect(cardResponse.status).toBe(200);
		expect(await cardResponse.json()).toMatchObject({ name: "Viktor",
			url: audience, protocolVersion: "0.3",
			supportedInterfaces: expect.arrayContaining([
				{ protocolBinding: "JSONRPC", url: audience, tenant: "workspace-a", protocolVersion: "1.0" },
				{ protocolBinding: "JSONRPC", url: audience, tenant: "workspace-a", protocolVersion: "0.3" },
			]),
			securitySchemes: { ownerJwt: { scheme: { $case: "httpAuthSecurityScheme",
				value: { scheme: "Bearer", bearerFormat: "JWT" } } } },
			securityRequirements: [{ schemes: { ownerJwt: { list: [] } } }],
			skills: [{ id: "viktor.read_workspace_learnings" }] });
	});
	it("rejects verifier key symlinks and writable public keys", () => {
		const directory = mkdtempSync(join(tmpdir(), "viktor-a2a-"));
		try {
			const key = join(directory, "key.pem");
			writeFileSync(key, keys.publicKey.export({ type: "spki", format: "pem" }), { mode: 0o644 });
			expect(readViktorA2APublicKeyFile(key).asymmetricKeyType).toBe("ed25519");
			const alias = join(directory, "alias.pem");
			symlinkSync(key, alias);
			expect(() => readViktorA2APublicKeyFile(alias)).toThrow();
			chmodSync(key, 0o666);
			expect(() => readViktorA2APublicKeyFile(key)).toThrow();
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
	it("refuses anonymous, forged JWT, expired JWT and foreign owner before reserving", async () => {
		const { gateway, request, reserve } = setup();
		const anonymous = new Request(audience, { method: "POST", body: "{}" });
		expect((await gateway.fetch(anonymous)).status).toBe(401);
		expect((await gateway.fetch(request(bearer("owner:tg:456")))).status).toBe(403);
		expect((await gateway.fetch(request(bearer(owner, "https://wrong.example.test/a2a")))).status).toBe(401);
		expect((await gateway.fetch(request(bearer(owner, audience, 0)))).status).toBe(401);
		expect((await gateway.fetch(request(`${bearer()}forged`))).status).toBe(401);
		expect(reserve).not.toHaveBeenCalled();
	});

	it("refuses a forged owner scope despite a valid JWT", async () => {
		const { gateway, request, reserve } = setup();
		const original = request();
		const body = await original.json() as { params: { message: { metadata: {
			"tvin.owner_scope": { ownerId: string } } } } };
		body.params.message.metadata["tvin.owner_scope"].ownerId = "owner:tg:456";
		expect((await gateway.fetch(new Request(audience, { method: "POST",
			headers: original.headers, body: JSON.stringify(body) }))).status).toBe(403);
		expect(reserve).not.toHaveBeenCalled();
	});

	it("returns a terminal Task with the SDK artifact shape", async () => {
		const { gateway, request, run, reserve } = setup();
		const first = await gateway.fetch(request());
		expect(first.status).toBe(200);
		const task = (await first.json() as { result: { task: { id: string } } }).result.task;
		expect(task).toMatchObject({ status: { state: "TASK_STATE_COMPLETED" },
			metadata: { "tvin.owner_scope": { tenant: "workspace-a", ownerId: owner } },
			artifacts: [{ parts: [{ text: "Learnings" }] }] });
		const fetched = await gateway.fetch(request(bearer(), task.id, "GetTask"));
		expect(fetched.status).toBe(200);
		expect(await fetched.json()).toMatchObject({ result: { id: task.id, status: { state: "TASK_STATE_COMPLETED" } } });
		expect(run).toHaveBeenCalledTimes(1);
		expect(reserve).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: "guest-workspace-37",
			principalId: "tg-123" }));
	});

	it("accepts an independent numeric JSON-RPC id and stable messageId", async () => {
		const { gateway, request, run } = setup();
		const first = await gateway.fetch(request(bearer(), "Summarize learnings", "SendMessage", 42));
		expect(first.status).toBe(200);
		expect(await first.json()).toMatchObject({ jsonrpc: "2.0", id: 42,
			result: { task: { id: expect.any(String), status: { state: "TASK_STATE_COMPLETED" } } } });
			expect(run).toHaveBeenCalledTimes(1);
	});

	it("accepts legacy v0.3 JSON-RPC through the SDK compatibility transport", async () => {
		const { gateway, run } = setup();
		const response = await gateway.fetch(new Request(audience, { method: "POST",
			headers: { authorization: `Bearer ${bearer()}` },
			body: JSON.stringify({ jsonrpc: "2.0", id: "legacy-1", method: "message/send", params: {
				message: { kind: "message", role: "user", messageId: "legacy-1", parts: [{ kind: "text", text: "Summarize learnings" }],
					metadata: { "tvin.owner_scope": { tenant: "workspace-a", ownerId: owner } } },
			} }) }));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ jsonrpc: "2.0", id: "legacy-1", result: { kind: "task", status: { state: "completed" } } });
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("does not turn an uncertain still-running task into a terminal failure", async () => {
		const { gateway, request, run } = setup();
		run.mockRejectedValueOnce(new Error("transport timeout"));
		const first = await (await gateway.fetch(request())).json() as { result: { task: { id: string; status: { state: string } } } };
		expect(first.result.task.status.state).toBe("TASK_STATE_WORKING");
		const response = await gateway.fetch(request(bearer(), first.result.task.id, "GetTask"));
		expect((await response.json() as { result: { status: { state: string } } }).result.status.state).toBe("TASK_STATE_WORKING");
	});

	it("uses the SDK task lifecycle when execution fails", async () => {
		const { gateway, request, run } = setup();
		run.mockRejectedValueOnce(new Error("transport timeout"));
		const first = (await (await gateway.fetch(request())).json() as { result: { task: { status: { state: string } } } }).result.task;
		expect(first.status.state).toBe("TASK_STATE_WORKING");
		expect(run).toHaveBeenCalledTimes(1);
	});
});
