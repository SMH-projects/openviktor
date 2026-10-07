import { describe, expect, it, vi } from "vitest";
import { createScopedToolAccess } from "./scoped-tools.js";
import { createToolGateway, registerWorkspaceToken, resolveWorkspaceFromToken } from "./server.js";

vi.mock("@openviktor/tools", async (importOriginal) => ({
	...await importOriginal<typeof import("@openviktor/tools")>(),
	ensureWorkspace: vi.fn(async (workspaceId: string) => `/tmp/${workspaceId}`),
}));

describe("isolated agent tool identity", () => {
	it("rejects shared or weak gateway tokens and cross-workspace rebinding", () => {
		expect(() => registerWorkspaceToken("local", "workspace-a")).toThrow();
		const access = createScopedToolAccess("workspace-a", 3001, 1000, []);
		try {
			expect(() => registerWorkspaceToken(access.token, "workspace-b")).toThrow();
			expect(resolveWorkspaceFromToken(access.token)).toBe("workspace-a");
		} finally {
			access.dispose();
		}
	});
	it("binds simultaneous owner runs to different workspaces and revokes both", () => {
		const accessA = createScopedToolAccess("workspace-a", 3001, 1000, []);
		const accessB = createScopedToolAccess("workspace-b", 3001, 1000, []);
		expect(accessA.token).not.toBe(accessB.token);
		expect(resolveWorkspaceFromToken(accessA.token)).toBe("workspace-a");
		expect(resolveWorkspaceFromToken(accessB.token)).toBe("workspace-b");
		accessA.dispose();
		expect(resolveWorkspaceFromToken(accessA.token)).toBeNull();
		expect(resolveWorkspaceFromToken(accessB.token)).toBe("workspace-b");
		accessB.dispose();
		expect(resolveWorkspaceFromToken(accessB.token)).toBeNull();
	});

	it("keeps real gateway calls in their workspace and rejects the revoked token", async () => {
		const accessA = createScopedToolAccess("workspace-a", 3001, 1000, []);
		const accessB = createScopedToolAccess("workspace-b", 3001, 1000, []);
		const execute = vi.fn(async (_role: string, _args: unknown, context: { workspaceId: string }) => ({
			output: { workspaceId: context.workspaceId },
		}));
		const gateway = createToolGateway({
			registry: { resolve: vi.fn().mockReturnValue("read_learnings"), isLocalOnly: vi.fn().mockReturnValue(false) } as never,
			backend: { execute } as never,
			logger: { info: vi.fn(), warn: vi.fn() } as never,
			defaultTimeoutMs: 1000,
		});
		const call = (token: string) => gateway.fetch(new Request("http://localhost/v1/tools/call", {
			method: "POST", headers: { authorization: `Bearer ${token}` },
			body: JSON.stringify({ role: "read_learnings", arguments: {} }),
		}));
		try {
			const [resultA, resultB] = await Promise.all([call(accessA.token), call(accessB.token)]);
			expect(await resultA.json()).toEqual({ result: { workspaceId: "workspace-a" } });
			expect(await resultB.json()).toEqual({ result: { workspaceId: "workspace-b" } });
			accessA.dispose();
			expect((await call(accessA.token)).status).toBe(403);
			expect((await call(accessB.token)).status).toBe(200);
			expect(execute).toHaveBeenCalledTimes(3);
		} finally {
			accessA.dispose();
			accessB.dispose();
		}
	});
});
