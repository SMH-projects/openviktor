import { describe, expect, it, vi } from "vitest";
import { createToolGateway, registerDiscoveryToken, registerWorkspaceToken } from "../server.js";

describe("tool gateway discovery", () => {
	const token = "discovery-test-workspace-secret-token-123456789";
	const registry = {
		getAllDefinitions: () => [],
		getDefinitionsForWorkspace: vi.fn((workspaceId: string) => [
			{
				name: "current",
				description: workspaceId,
				input_schema: { type: "object", properties: {} },
			},
			{ name: "bash", description: "Unsafe", input_schema: {} },
		]),
	};
	const gateway = createToolGateway({
		registry: registry as never,
		backend: {} as never,
		logger: {} as never,
		defaultTimeoutMs: 1000,
	});

	it("rejects unauthenticated and invalid tokens without disclosing schemas", async () => {
		const missing = await gateway.fetch(new Request("http://localhost/v1/tools"));
		const invalid = await gateway.fetch(
			new Request("http://localhost/v1/tools", {
				headers: { Authorization: "Bearer unknown-discovery-token" },
			}),
		);
		expect(missing.status).toBe(401);
		expect(invalid.status).toBe(403);
		expect(registry.getDefinitionsForWorkspace).not.toHaveBeenCalled();
	});

	it("lists live tool definitions only in the authorized workspace", async () => {
		registerDiscoveryToken(token, "ws_test", ["current"]);
		const response = await gateway.fetch(
			new Request("http://localhost/v1/tools", {
				headers: { Authorization: `Bearer ${token}` },
			}),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			workspaceId: "ws_test",
			tools: [
				{
					name: "current",
					description: "ws_test",
					input_schema: { type: "object", properties: {} },
				},
			],
		});
		expect(registry.getDefinitionsForWorkspace).toHaveBeenCalledWith("ws_test");
	});

	it("does not expose schemas to the legacy shared local token", async () => {
		registerWorkspaceToken("local", "ws_other");
		const response = await gateway.fetch(
			new Request("http://localhost/v1/tools", {
				headers: { Authorization: "Bearer local" },
			}),
		);
		expect(response.status).toBe(403);
	});

	it("does not allow a discovery token to move to another workspace", () => {
		registerDiscoveryToken(token, "ws_test", ["current"]);
		expect(() => registerWorkspaceToken(token, "ws_other")).toThrow();
		expect(() => registerDiscoveryToken(token, "ws_other", ["current"])).toThrow();
	});

	it("denies unsafe direct tool calls made with a discovery bearer before the executor", async () => {
		registerDiscoveryToken(token, "ws_test", ["current"]);
		const response = await gateway.fetch(
			new Request("http://localhost/v1/tools/call", {
				method: "POST",
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				body: JSON.stringify({ role: "bash", arguments: {} }),
			}),
		);
		expect(response.status).toBe(403);
	});
});
