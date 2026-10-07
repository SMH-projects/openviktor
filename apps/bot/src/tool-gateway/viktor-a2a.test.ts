import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createViktorA2AGateway, readViktorA2APublicKeyFile } from "./viktor-a2a.js";

const keys = generateKeyPairSync("ed25519");
const audience = "https://viktor.example.test/a2a";
const owner = "owner:tg:123";
const binding = { workspaceId: "workspace-a", principalId: "tg-123", expiresAt: Date.now() + 300_000 };

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
		readTaskDigest: async () => savedDigest,
		readReservation: async () => "pending" });
	const request = (token = bearer(), text = "Summarize learnings", method = "message/send", id = "req-1") =>
		new Request(audience, { method: "POST", headers: { authorization: `Bearer ${token}` },
			body: JSON.stringify({ jsonrpc: "2.0", id, method, params: method === "tasks/get"
				? { id: text }
				: { message: { kind: "message", role: "user", messageId: id,
					parts: [{ kind: "text", text }], metadata: {
						"tvin.owner_scope": { tenant: "workspace-a", ownerId: owner },
					} } } }) });
	return { gateway, request, run, reserve, readReceipt };
}

describe("Viktor owner-scoped A2A endpoint", () => {
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

	it("returns terminal Task with artifact, and never executes duplicate messageId", async () => {
		const { gateway, request, run } = setup();
		const first = await gateway.fetch(request());
		expect(first.status).toBe(200);
		const task = (await first.json() as { result: { id: string } }).result;
		expect(task).toMatchObject({ kind: "task", status: { state: "completed" },
			metadata: { "tvin.owner_scope": { tenant: "workspace-a", ownerId: owner } },
			artifacts: [{ parts: [{ kind: "text", text: "Learnings" }] }] });
		expect((await gateway.fetch(request(bearer(), task.id, "tasks/get"))).status).toBe(200);
		expect((await gateway.fetch(request())).status).toBe(200);
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("rejects the same request ID with different text without replaying the model", async () => {
		const { gateway, request, run } = setup();
		expect((await gateway.fetch(request())).status).toBe(200);
		expect((await gateway.fetch(request(bearer(), "Replace prior task"))).status).toBe(409);
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("keeps a task pending after unknown outcome instead of re-running", async () => {
		const { gateway, request, run } = setup();
		run.mockRejectedValueOnce(new Error("transport timeout"));
		const first = (await (await gateway.fetch(request())).json() as { result: { status: { state: string } } }).result;
		expect(first.status.state).toBe("working");
		expect((await (await gateway.fetch(request())).json() as { result: { status: { state: string } } }).result.status.state).toBe("working");
		expect(run).toHaveBeenCalledTimes(1);
	});
});
