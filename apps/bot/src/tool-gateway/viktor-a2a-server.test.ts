import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { READ_ONLY_TOOLS } from "./read-only-tools.js";
import { createViktorA2AServer } from "./viktor-a2a-server.js";

const keys = generateKeyPairSync("ed25519");
const audience = "https://viktor.example.test/a2a";
const binding = { workspaceId: "ws-1", principalId: "tg-8405041969" };

function token(sub: string, over: Record<string, unknown> = {}) {
	const enc = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
	const now = Math.floor(Date.now() / 1000);
	const signed = `${enc({ alg: "EdDSA", typ: "JWT" })}.${enc({
		iss: "twin",
		sub,
		aud: audience,
		iat: now,
		exp: now + 240,
		jti: "jti-12345678",
		scope: "twin:agent",
		...over,
	})}`;
	return `${signed}.${sign(null, Buffer.from(signed), keys.privateKey).toString("base64url")}`;
}

function setup(
	run = vi.fn().mockResolvedValue({ agentRunId: "run-1", responseText: "Готово", toolReceipt: [] }),
) {
	const reserve = vi.fn().mockResolvedValue(true);
	const server = createViktorA2AServer({
		publicKey: keys.publicKey,
		audience,
		tenant: "korobka_front3",
		readBinding: () => binding,
		reserve,
		run,
	});
	const rpc = (method: string, params: unknown, auth: string | null) =>
		server.fetch(
			new Request(audience, {
				method: "POST",
				headers: auth ? { authorization: `Bearer ${auth}` } : {},
				body: JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }),
			}),
		);
	const send = (auth: string | null, text = "что в обучении?") =>
		rpc(
			"message/send",
			{
				message: {
					kind: "message",
					role: "user",
					messageId: `m-${Math.random().toString(36).slice(2)}`,
					parts: [{ kind: "text", text }],
					metadata: { "tvin.owner_scope": { tenant: "korobka_front3", ownerId: "x" } },
				},
			},
			auth,
		);
	return { server, rpc, send, run, reserve };
}

async function untilDone(rpc: ReturnType<typeof setup>["rpc"], auth: string, id: string) {
	for (let i = 0; i < 50; i++) {
		const body = (await (await rpc("tasks/get", { id }, auth)).json()) as {
			result: { status: { state: string } };
		};
		if (body.result.status.state !== "working") return body.result;
		await new Promise((r) => setTimeout(r, 20));
	}
	throw new Error("task did not finish");
}

describe("Viktor A2A on official SDK", () => {
	it.each(["owner:tg:8003118142", "owner:tg:8405041969", "owner:tg:1"])(
		"box task for any owner (%s) completes in the bound workspace",
		async (owner) => {
			const { send, rpc, run } = setup();
			const auth = token(owner);
			const res = await send(auth);
			expect(res.status).toBe(200);
			const { result } = (await res.json()) as {
				result: { id: string; metadata: Record<string, unknown> };
			};
			expect(result.metadata["tvin.owner_scope"]).toEqual({
				tenant: "korobka_front3",
				ownerId: owner,
			});
			const done = (await untilDone(rpc, auth, result.id)) as {
				status: { state: string };
				artifacts: Array<{ parts: Array<{ text: string }> }>;
			};
			expect(done.status.state).toBe("completed");
			expect(done.artifacts[0].parts[0].text).toBe("Готово");
			expect(run).toHaveBeenCalledWith(
				expect.objectContaining({
					workspaceId: "ws-1",
					principalId: "tg-8405041969",
					allowedTools: [...READ_ONLY_TOOLS],
				}),
			);
		},
	);

	it("rejects missing, forged, wrong-audience and wrong-scope tokens with 401 before running anything", async () => {
		const { send, run } = setup();
		expect((await send(null)).status).toBe(401);
		expect((await send(`${token("owner:tg:1").slice(0, -4)}AAAA`)).status).toBe(401);
		expect((await send(token("owner:tg:1", { aud: "https://other.test/a2a" }))).status).toBe(401);
		expect((await send(token("owner:tg:1", { scope: "other" }))).status).toBe(401);
		expect(run).not.toHaveBeenCalled();
	});

	it("reports a failed run as a failed task with the reason", async () => {
		const { send, rpc } = setup(vi.fn().mockRejectedValue(new Error("provider down")));
		const auth = token("owner:tg:5");
		const { result } = (await (await send(auth)).json()) as { result: { id: string } };
		const done = (await untilDone(rpc, auth, result.id)) as { status: { state: string } };
		expect(done.status.state).toBe("failed");
	});

	it("publishes the agent card with the box bearer scheme", async () => {
		const { server } = setup();
		const card = (await (
			await server.fetch(new Request("https://viktor.example.test/.well-known/agent-card.json"))
		).json()) as { securitySchemes: Record<string, unknown> };
		expect(JSON.stringify(card.securitySchemes)).toContain("earer");
	});

	it("card is in A2A 0.3 JSON form the box client (a2a-sdk 0.3) parses", async () => {
		const { server } = setup();
		const card = (await (
			await server.fetch(new Request("https://viktor.example.test/.well-known/agent-card.json"))
		).json()) as Record<string, unknown>;
		expect(card.protocolVersion).toBe("0.3.0");
		expect(card.url).toBe(audience);
		expect(card.securitySchemes).toEqual({
			boxToken: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
		});
		expect(card.security).toEqual([{ boxToken: [] }]);
		expect(JSON.stringify(card)).not.toContain("$case");
	});
});
