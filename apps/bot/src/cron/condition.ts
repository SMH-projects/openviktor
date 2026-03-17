import type { PrismaClient } from "@openviktor/db";
import type { Logger } from "@openviktor/shared";
import type { ToolBackend } from "@openviktor/tools";
import { ensureWorkspace } from "@openviktor/tools";

const CONDITION_TIMEOUT_MS = 5_000;

export interface ConditionContext {
	workspaceId: string;
	cronJobId: string;
	lastRunAt: Date | null;
}

export interface ConditionHelpers {
	hasNewSlackMessages: (opts?: { since?: Date }) => Promise<boolean>;
	isWithinBudget: (opts: { maxMonthlyCents: number }) => Promise<boolean>;
	hasActiveThreads: () => Promise<boolean>;
}

export function createConditionHelpers(
	prisma: PrismaClient,
	ctx: ConditionContext,
): ConditionHelpers {
	return {
		async hasNewSlackMessages(opts) {
			const since = opts?.since ?? ctx.lastRunAt ?? new Date(Date.now() - 3 * 60 * 60 * 1000);
			const recentMessages = await prisma.message.findFirst({
				where: {
					agentRun: { workspaceId: ctx.workspaceId },
					role: "user",
					createdAt: { gt: since },
				},
			});
			return recentMessages !== null;
		},

		async isWithinBudget(opts) {
			const startOfMonth = new Date();
			startOfMonth.setUTCDate(1);
			startOfMonth.setUTCHours(0, 0, 0, 0);

			const result = await prisma.agentRun.aggregate({
				where: {
					workspaceId: ctx.workspaceId,
					createdAt: { gte: startOfMonth },
					status: "COMPLETED",
				},
				_sum: { costCents: true },
			});
			const totalSpent = result._sum.costCents ?? 0;
			return totalSpent < opts.maxMonthlyCents;
		},

		async hasActiveThreads() {
			const activeThread = await prisma.thread.findFirst({
				where: {
					workspaceId: ctx.workspaceId,
					status: "ACTIVE",
				},
			});
			return activeThread !== null;
		},
	};
}

interface PreComputedHelperData {
	hasNewSlackMessages: boolean;
	monthlySpendCents: number;
	hasActiveThreads: boolean;
}

async function preComputeHelperData(
	prisma: PrismaClient,
	ctx: ConditionContext,
): Promise<PreComputedHelperData> {
	const since = ctx.lastRunAt ?? new Date(Date.now() - 3 * 60 * 60 * 1000);
	const startOfMonth = new Date();
	startOfMonth.setUTCDate(1);
	startOfMonth.setUTCHours(0, 0, 0, 0);

	const [recentMessage, monthlyAggregate, activeThread] = await Promise.all([
		prisma.message.findFirst({
			where: {
				agentRun: { workspaceId: ctx.workspaceId },
				role: "user",
				createdAt: { gt: since },
			},
		}),
		prisma.agentRun.aggregate({
			where: {
				workspaceId: ctx.workspaceId,
				createdAt: { gte: startOfMonth },
				status: "COMPLETED",
			},
			_sum: { costCents: true },
		}),
		prisma.thread.findFirst({
			where: { workspaceId: ctx.workspaceId, status: "ACTIVE" },
		}),
	]);

	return {
		hasNewSlackMessages: recentMessage !== null,
		monthlySpendCents: monthlyAggregate._sum.costCents ?? 0,
		hasActiveThreads: activeThread !== null,
	};
}

/**
 * Evaluates a condition script via the tool backend (Modal or Local).
 *
 * Helper data is pre-computed in the main process (with DB access),
 * then embedded in a self-contained bun script that is executed via
 * the bash tool through the configured backend — identical isolation
 * to normal agent tool calls.
 */
export async function evaluateCondition(
	script: string,
	ctx: ConditionContext,
	prisma: PrismaClient,
	logger: Logger,
	backend: ToolBackend,
): Promise<boolean> {
	try {
		const helperData = await preComputeHelperData(prisma, ctx);
		const workspaceDir = await ensureWorkspace(ctx.workspaceId);

		const sandboxedCtx = {
			workspaceId: ctx.workspaceId,
			cronJobId: ctx.cronJobId,
			lastRunAt: ctx.lastRunAt?.toISOString() ?? null,
		};

		// Build a self-contained script with pre-computed data embedded.
		// Uses a heredoc with a randomized delimiter to prevent injection.
		const rand = Math.random().toString(36).slice(2) + Date.now().toString(36);
		const delim = `__COND_EOF_${rand}__`;
		const tmpFile = `/tmp/_cond_eval_${ctx.cronJobId}_${Date.now()}.js`;
		const command = [
			`cat > ${tmpFile} << '${delim}'`,
			`const d = ${JSON.stringify(helperData)};`,
			`const ctx = ${JSON.stringify(sandboxedCtx)};`,
			"const helpers = {",
			"  hasNewSlackMessages: async () => d.hasNewSlackMessages,",
			"  isWithinBudget: async (opts) => d.monthlySpendCents < ((opts && opts.maxMonthlyCents !== undefined) ? opts.maxMonthlyCents : Infinity),",
			"  hasActiveThreads: async () => d.hasActiveThreads,",
			"};",
			`(async () => { ${script} })()`,
			"  .then(r => process.stdout.write(JSON.stringify({ result: !!r })))",
			"  .catch(e => process.stdout.write(JSON.stringify({ error: String(e) })));",
			delim,
			`bun ${tmpFile}; rm -f ${tmpFile}`,
		].join("\n");

		const toolCtx = { workspaceId: ctx.workspaceId, workspaceDir, timeoutMs: CONDITION_TIMEOUT_MS };
		const result = await backend.execute(
			"bash",
			{ command, timeout_ms: CONDITION_TIMEOUT_MS },
			toolCtx,
		);

		if (result.error) {
			logger.warn(
				{ cronJobId: ctx.cronJobId, error: result.error },
				"Condition script failed in sandbox",
			);
			return false;
		}

		const output = result.output as { stdout?: string } | null;
		const stdout = output?.stdout ?? "";
		try {
			const parsed = JSON.parse(stdout);
			if (parsed.error) {
				logger.warn(
					{ cronJobId: ctx.cronJobId, error: parsed.error },
					"Condition script threw an error",
				);
				return false;
			}
			return Boolean(parsed.result);
		} catch {
			return false;
		}
	} catch (error) {
		logger.warn(
			{ cronJobId: ctx.cronJobId, err: error },
			"Condition script failed, defaulting to skip",
		);
		return false;
	}
}
