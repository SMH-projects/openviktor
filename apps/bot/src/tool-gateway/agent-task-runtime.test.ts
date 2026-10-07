import { describe, expect, it, vi } from "vitest";
import { createAgentTaskRuntime } from "./agent-task-runtime.js";

const scope = { workspaceId: "workspace-a", principalId: "tg-123", requestId: "route-100", task: "Read learnings" };

function setup() {
	const threads = new Map<string, { id: string; metadata: Record<string, string> }>();
	const prisma = {
		thread: {
			create: vi.fn(async ({ data }: { data: { slackThreadTs: string; metadata: Record<string, string> } }) => {
				if (threads.has(data.slackThreadTs)) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
				threads.set(data.slackThreadTs, { id: "thread-1", metadata: data.metadata });
			}),
			findUnique: vi.fn(async ({ where }: { where: { workspaceId_slackChannel_slackThreadTs: {
				slackThreadTs: string } } }) => threads.get(where.workspaceId_slackChannel_slackThreadTs.slackThreadTs) ?? null),
		},
		workspace: { findUnique: vi.fn().mockResolvedValue({ slackTeamName: "Owner workspace", isActive: true }) },
		agentRun: { findFirst: vi.fn().mockResolvedValue({ id: "run-42", messages: [{ content: "Done" }],
			toolCalls: [{ toolName: "read_learnings", status: "COMPLETED" }] }) },
	};
	const runner = { run: vi.fn().mockResolvedValue({ agentRunId: "run-42", responseText: "Done" }) };
	const scoped = { token: "unique", config: { client: { call: vi.fn() }, tools: [] }, dispose: vi.fn() };
	const createAccess = vi.fn().mockReturnValue(scoped);
	return { runtime: createAgentTaskRuntime(prisma as never, runner as never, createAccess),
		prisma, runner, createAccess, scoped };
}

describe("Viktor agent durable reservation", () => {
	it("reserves owner identity atomically and cannot execute twice", async () => {
		const { runtime, prisma, runner, createAccess, scoped } = setup();
		expect(await runtime.reserve(scope)).toBe(true);
		expect(await runtime.reserve(scope)).toBe(false);
		await runtime.run({ ...scope, allowedTools: ["read_learnings"] });
		expect(prisma.thread.create).toHaveBeenCalledTimes(2);
		expect(runner.run).toHaveBeenCalledWith(expect.objectContaining({
			workspaceId: scope.workspaceId, allowedTools: ["read_learnings"],
			slackChannel: "__twin_owner__", userMessage: scope.task,
		}), undefined, scoped.config);
		expect(createAccess).toHaveBeenCalledWith("workspace-a");
		expect(scoped.dispose).toHaveBeenCalledTimes(1);
	});

	it("reads only the completed receipt for the reserved principal", async () => {
		const { runtime, runner } = setup();
		await runtime.reserve(scope);
		expect(await runtime.readReceipt({ workspaceId: scope.workspaceId,
			principalId: "tg-foreign", requestId: scope.requestId })).toBeNull();
		expect(await runtime.readReceipt(scope)).toEqual({ agentRunId: "run-42", responseText: "Done",
			toolReceipt: [{ name: "read_learnings", outcome: "COMPLETED" }] });
		expect(runner.run).not.toHaveBeenCalled();
	});
});
