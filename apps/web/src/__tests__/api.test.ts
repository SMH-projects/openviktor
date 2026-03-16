import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../lib/api";

const mockFetch = vi.fn() as unknown as typeof fetch & ReturnType<typeof vi.fn>;
global.fetch = mockFetch;

beforeEach(() => {
	mockFetch.mockReset();
	localStorage.clear();
});

function mockJsonResponse(data: unknown, status = 200) {
	mockFetch.mockResolvedValueOnce({
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? "OK" : "Error",
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(JSON.stringify(data)),
	});
}

describe("API client", () => {
	it("calls the correct URL for getHealth", async () => {
		mockJsonResponse({ status: "healthy" });
		await api.getHealth();
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/health",
			expect.objectContaining({ credentials: "include" }),
		);
	});

	it("calls the correct URL for getOverview", async () => {
		mockJsonResponse({ stats: {} });
		await api.getOverview();
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/overview",
			expect.objectContaining({ credentials: "include" }),
		);
	});

	it("includes workspace ID in X-Workspace-Id header when set", async () => {
		localStorage.setItem("ov_workspace_id", "ws-123");
		mockJsonResponse({});
		await api.getOverview();
		const headers = mockFetch.mock.calls[0][1].headers;
		expect(headers["X-Workspace-Id"]).toBe("ws-123");
	});

	it("omits X-Workspace-Id header when no workspace selected", async () => {
		mockJsonResponse({});
		await api.getOverview();
		const headers = mockFetch.mock.calls[0][1].headers;
		expect(headers["X-Workspace-Id"]).toBeUndefined();
	});

	it("throws on non-ok response", async () => {
		mockJsonResponse({ error: "Not found" }, 404);
		await expect(api.getOverview()).rejects.toThrow("API 404");
	});

	it("throws AuthError on 401 response", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			statusText: "Unauthorized",
			json: () => Promise.resolve({ error: "Unauthorized" }),
			text: () => Promise.resolve("Unauthorized"),
		});
		await expect(api.getOverview()).rejects.toThrow("Unauthorized");
		// The thrown error should be detectable as auth error
	});

	it("identifies AuthError with isAuthError", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			statusText: "Unauthorized",
			json: () => Promise.resolve({ error: "Unauthorized" }),
			text: () => Promise.resolve("Unauthorized"),
		});
		try {
			await api.getOverview();
		} catch (e) {
			expect(api.isAuthError(e)).toBe(true);
		}
	});

	it("builds query params for getRuns", async () => {
		mockJsonResponse({ data: [], total: 0, page: 1, limit: 25 });
		await api.getRuns({ page: 2, status: "COMPLETED", triggerType: "DM" });
		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).toContain("page=2");
		expect(url).toContain("status=COMPLETED");
		expect(url).toContain("triggerType=DM");
	});

	it("encodes run ID in getRunDetail", async () => {
		mockJsonResponse({});
		await api.getRunDetail("abc/123");
		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).toContain("abc%2F123");
	});

	it("sends PUT for updateModel", async () => {
		mockJsonResponse({ success: true });
		await api.updateModel("claude-opus-4-6");
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/settings/model",
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify({ model: "claude-opus-4-6" }),
			}),
		);
	});

	it("builds query params for getThreads", async () => {
		mockJsonResponse({ data: [], total: 0, page: 1, limit: 25 });
		await api.getThreads({ page: 1, status: "ACTIVE" });
		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).toContain("status=ACTIVE");
	});

	it("builds query params for getLearnings with search", async () => {
		mockJsonResponse({ data: [], total: 0, page: 1, limit: 20 });
		await api.getLearnings({ page: 1, limit: 20, search: "test" });
		const url = mockFetch.mock.calls[0][0] as string;
		expect(url).toContain("search=test");
	});
});
