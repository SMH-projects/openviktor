import { describe, expect, it, vi } from "vitest";
import { createBenchHandler } from "./handler.js";

function makeHandler() {
	const run = vi.fn().mockResolvedValue({
		agentRunId: "run-1",
		threadId: "thread-1",
		responseText: "Done",
		messageSent: false,
		inputTokens: 10,
		outputTokens: 4,
		costCents: 0.1,
		durationMs: 250,
	});
	const getToolCalls = vi
		.fn()
		.mockResolvedValue([{ toolName: "calculator", status: "COMPLETED", durationMs: 12 }]);
	const handler = createBenchHandler({
		token: "a".repeat(64),
		workspaceId: "workspace-1",
		workspaceName: "Test",
		runner: { run } as never,
		getContext: async () => ({
			skillCatalog: [],
			integrationCatalog: [],
			activeThreads: [],
		}),
		getToolCalls,
	});
	return { handler, run, getToolCalls };
}

function request(body: unknown, token = "a".repeat(64)): Request {
	return new Request("http://localhost/bench/message", {
		method: "POST",
		headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("bench message transport", () => {
	it("rejects unauthenticated requests before invoking the agent", async () => {
		const { handler, run } = makeHandler();
		const response = await handler(request({ thread_id: "case-1", text: "Hello" }, "wrong"));
		expect(response.status).toBe(401);
		expect(run).not.toHaveBeenCalled();
	});

	it("rejects malformed thread identifiers", async () => {
		const { handler, run } = makeHandler();
		const response = await handler(request({ thread_id: "../other", text: "Hello" }));
		expect(response.status).toBe(400);
		expect(run).not.toHaveBeenCalled();
	});

	it("uses the agent runner and returns measured metadata", async () => {
		const { handler, run } = makeHandler();
		const response = await handler(request({ thread_id: "case-1", text: "Hello" }));
		expect(response.status).toBe(200);
		expect(run).toHaveBeenCalledWith(
			expect.objectContaining({
				workspaceId: "workspace-1",
				slackChannel: "__bench__",
				slackThreadTs: "case-1",
				userMessage: "Hello",
			}),
		);
		expect(await response.json()).toMatchObject({
			status: "ok",
			response_text: "Done",
			input_tokens: 10,
			output_tokens: 4,
			tool_calls: [{ name: "calculator", status: "COMPLETED" }],
		});
	});

	it("returns the message captured by the bench transport", async () => {
		const { handler, getToolCalls } = makeHandler();
		getToolCalls.mockResolvedValue([
			{
				toolName: "coworker_send_slack_message",
				status: "COMPLETED",
				durationMs: 0,
				output: { status: "sent", channel_id: "__bench__", text: "Hello from tool" },
			},
		]);
		const response = await handler(request({ thread_id: "case-2", text: "Hello" }));
		const body = (await response.json()) as { response_text: string };
		expect(body.response_text).toBe("Hello from tool");
	});
});
