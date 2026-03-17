import { describe, expect, it, vi } from "vitest";
import { type ConditionContext, createConditionHelpers, evaluateCondition } from "../condition.js";

vi.mock("@openviktor/tools", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@openviktor/tools")>();
	return { ...actual, ensureWorkspace: async () => "/tmp" };
});

function createMockLogger() {
	return {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		fatal: vi.fn(),
		trace: vi.fn(),
		child: vi.fn().mockReturnThis(),
		level: "info" as const,
		// biome-ignore lint/suspicious/noExplicitAny: test mock
	} as any;
}

function createMockContext(overrides: Partial<ConditionContext> = {}): ConditionContext {
	return {
		workspaceId: "ws-1",
		cronJobId: "cron-1",
		lastRunAt: new Date("2026-03-13T08:00:00Z"),
		...overrides,
	};
}

function createMockPrismaForEval() {
	return {
		message: { findFirst: vi.fn().mockResolvedValue(null) },
		agentRun: { aggregate: vi.fn().mockResolvedValue({ _sum: { costCents: 0 } }) },
		thread: { findFirst: vi.fn().mockResolvedValue(null) },
		// biome-ignore lint/suspicious/noExplicitAny: test mock
	} as any;
}

/**
 * Creates a mock backend that executes the bash command locally
 * by spawning a real shell process — matching how LocalToolBackend works.
 */
function createMockBackend() {
	return {
		execute: vi.fn().mockImplementation(async (_tool: string, args: Record<string, unknown>) => {
			const { spawn } = await import("node:child_process");
			const command = args.command as string;
			return new Promise((resolve) => {
				const child = spawn("bash", ["-c", command], {
					timeout: 5_000,
					stdio: ["ignore", "pipe", "pipe"],
				});
				let stdout = "";
				let stderr = "";
				child.stdout.on("data", (d: Buffer) => {
					stdout += d.toString();
				});
				child.stderr.on("data", (d: Buffer) => {
					stderr += d.toString();
				});
				// biome-ignore lint/suspicious/noExplicitAny: Bun's ChildProcessByStdio lacks EventEmitter.on()
				(child as any).on("close", (code: number | null) => {
					resolve({
						output: { exit_code: code ?? 0, stdout, stderr },
						durationMs: 0,
					});
				});
				// biome-ignore lint/suspicious/noExplicitAny: Bun's ChildProcessByStdio lacks EventEmitter.on()
				(child as any).on("error", (err: Error) => {
					resolve({ output: null, durationMs: 0, error: err.message });
				});
			});
		}),
		// biome-ignore lint/suspicious/noExplicitAny: test mock
	} as any;
}

describe("evaluateCondition", () => {
	it("returns true for a truthy script", async () => {
		const result = await evaluateCondition(
			"return true;",
			createMockContext(),
			createMockPrismaForEval(),
			createMockLogger(),
			createMockBackend(),
		);
		expect(result).toBe(true);
	});

	it("returns false for a falsy script", async () => {
		const result = await evaluateCondition(
			"return false;",
			createMockContext(),
			createMockPrismaForEval(),
			createMockLogger(),
			createMockBackend(),
		);
		expect(result).toBe(false);
	});

	it("has access to ctx with safe fields only", async () => {
		const result = await evaluateCondition(
			'return ctx.workspaceId === "ws-1" && ctx.prisma === undefined;',
			createMockContext(),
			createMockPrismaForEval(),
			createMockLogger(),
			createMockBackend(),
		);
		expect(result).toBe(true);
	});

	it("has access to helpers", async () => {
		const result = await evaluateCondition(
			"return typeof helpers.hasNewSlackMessages === 'function';",
			createMockContext(),
			createMockPrismaForEval(),
			createMockLogger(),
			createMockBackend(),
		);
		expect(result).toBe(true);
	});

	it("returns false and logs warning on error", async () => {
		const logger = createMockLogger();
		const result = await evaluateCondition(
			"throw new Error('test error');",
			createMockContext(),
			createMockPrismaForEval(),
			logger,
			createMockBackend(),
		);
		expect(result).toBe(false);
		expect(logger.warn).toHaveBeenCalled();
	});

	it("returns false on timeout", async () => {
		const logger = createMockLogger();
		const result = await evaluateCondition(
			"return new Promise(() => {});",
			createMockContext(),
			createMockPrismaForEval(),
			logger,
			createMockBackend(),
		);
		expect(result).toBe(false);
	}, 10_000);

	it("coerces non-boolean returns", async () => {
		const result = await evaluateCondition(
			"return 1;",
			createMockContext(),
			createMockPrismaForEval(),
			createMockLogger(),
			createMockBackend(),
		);
		expect(result).toBe(true);

		const result2 = await evaluateCondition(
			"return 0;",
			createMockContext(),
			createMockPrismaForEval(),
			createMockLogger(),
			createMockBackend(),
		);
		expect(result2).toBe(false);
	});

	it("helpers reflect pre-computed data", async () => {
		const mockPrisma = createMockPrismaForEval();
		mockPrisma.message.findFirst.mockResolvedValue({ id: "msg-1" });
		mockPrisma.agentRun.aggregate.mockResolvedValue({ _sum: { costCents: 50 } });

		const result = await evaluateCondition(
			"return await helpers.hasNewSlackMessages() && await helpers.isWithinBudget({ maxMonthlyCents: 100 });",
			createMockContext(),
			mockPrisma,
			createMockLogger(),
			createMockBackend(),
		);
		expect(result).toBe(true);
	});

	it("executes through the backend", async () => {
		const backend = createMockBackend();
		await evaluateCondition(
			"return true;",
			createMockContext(),
			createMockPrismaForEval(),
			createMockLogger(),
			backend,
		);
		expect(backend.execute).toHaveBeenCalledWith(
			"bash",
			expect.objectContaining({ command: expect.any(String) }),
			expect.objectContaining({ workspaceId: "ws-1" }),
		);
	});
});

describe("createConditionHelpers", () => {
	it("hasNewSlackMessages queries messages since lastRunAt", async () => {
		const mockPrisma = {
			message: {
				findFirst: vi.fn().mockResolvedValue({ id: "msg-1" }),
			},
			// biome-ignore lint/suspicious/noExplicitAny: test mock
		} as any;

		const ctx = createMockContext();
		const helpers = createConditionHelpers(mockPrisma, ctx);
		const result = await helpers.hasNewSlackMessages();

		expect(result).toBe(true);
		expect(mockPrisma.message.findFirst).toHaveBeenCalledWith({
			where: {
				agentRun: { workspaceId: "ws-1" },
				role: "user",
				createdAt: { gt: ctx.lastRunAt },
			},
		});
	});

	it("hasNewSlackMessages returns false when no messages", async () => {
		const mockPrisma = {
			message: {
				findFirst: vi.fn().mockResolvedValue(null),
			},
			// biome-ignore lint/suspicious/noExplicitAny: test mock
		} as any;

		const helpers = createConditionHelpers(mockPrisma, createMockContext());
		const result = await helpers.hasNewSlackMessages();
		expect(result).toBe(false);
	});

	it("isWithinBudget returns true when under budget", async () => {
		const mockPrisma = {
			agentRun: {
				aggregate: vi.fn().mockResolvedValue({ _sum: { costCents: 50 } }),
			},
			// biome-ignore lint/suspicious/noExplicitAny: test mock
		} as any;

		const helpers = createConditionHelpers(mockPrisma, createMockContext());
		const result = await helpers.isWithinBudget({ maxMonthlyCents: 100 });
		expect(result).toBe(true);
	});

	it("isWithinBudget returns false when over budget", async () => {
		const mockPrisma = {
			agentRun: {
				aggregate: vi.fn().mockResolvedValue({ _sum: { costCents: 150 } }),
			},
			// biome-ignore lint/suspicious/noExplicitAny: test mock
		} as any;

		const helpers = createConditionHelpers(mockPrisma, createMockContext());
		const result = await helpers.isWithinBudget({ maxMonthlyCents: 100 });
		expect(result).toBe(false);
	});

	it("hasActiveThreads returns true when threads exist", async () => {
		const mockPrisma = {
			thread: {
				findFirst: vi.fn().mockResolvedValue({ id: "thread-1" }),
			},
			// biome-ignore lint/suspicious/noExplicitAny: test mock
		} as any;

		const helpers = createConditionHelpers(mockPrisma, createMockContext());
		const result = await helpers.hasActiveThreads();
		expect(result).toBe(true);
	});
});
