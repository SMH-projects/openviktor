import type { PrismaClient } from "@openviktor/db";
import type { Logger } from "@openviktor/shared";

const DEFAULT_MONTHLY_BUDGET_CENTS = 2000; // $20 per workspace

export interface BudgetStatus {
	allowed: boolean;
	usedCents: number;
	limitCents: number;
	remainingCents: number;
	percentUsed: number;
	resetsAt: string;
}

export class UsageLimiter {
	private globalBudgetCents: number;

	constructor(
		private prisma: PrismaClient,
		private logger: Logger,
		globalBudgetCents?: number,
	) {
		this.globalBudgetCents = globalBudgetCents ?? 0;
	}

	async canRun(workspaceId: string): Promise<BudgetStatus> {
		const limitCents = await this.getWorkspaceBudget(workspaceId);
		const usedCents = await this.getMonthlyUsage(workspaceId);
		const remainingCents = Math.max(0, limitCents - usedCents);
		const percentUsed = limitCents > 0 ? Math.round((usedCents / limitCents) * 1000) / 10 : 0;

		const now = new Date();
		const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

		let allowed = usedCents < limitCents;

		if (!allowed) {
			this.logger.info({ workspaceId, usedCents, limitCents }, "Workspace budget exceeded");
		}

		// Global budget check across all workspaces
		if (allowed && this.globalBudgetCents > 0) {
			const globalUsed = await this.getGlobalMonthlyUsage();
			if (globalUsed >= this.globalBudgetCents) {
				this.logger.warn(
					{ globalUsed, globalBudget: this.globalBudgetCents },
					"Global budget exceeded — all workspaces blocked",
				);
				allowed = false;
			}
		}

		return { allowed, usedCents, limitCents, remainingCents, percentUsed, resetsAt };
	}

	async getBudgetStatus(workspaceId: string): Promise<BudgetStatus> {
		return this.canRun(workspaceId);
	}

	private async getWorkspaceBudget(workspaceId: string): Promise<number> {
		const workspace = await this.prisma.workspace.findUnique({
			where: { id: workspaceId },
			select: { settings: true },
		});

		if (!workspace) return DEFAULT_MONTHLY_BUDGET_CENTS;

		const settings = workspace.settings as Record<string, unknown> | null;
		if (settings && typeof settings.monthlyBudgetCents === "number") {
			return settings.monthlyBudgetCents;
		}

		return DEFAULT_MONTHLY_BUDGET_CENTS;
	}

	private async getMonthlyUsage(workspaceId: string): Promise<number> {
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const result = await this.prisma.usageRecord.aggregate({
			where: {
				workspaceId,
				date: { gte: monthStart },
			},
			_sum: { llmCostCents: true },
		});

		return result._sum.llmCostCents ?? 0;
	}

	private async getGlobalMonthlyUsage(): Promise<number> {
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const result = await this.prisma.usageRecord.aggregate({
			where: { date: { gte: monthStart } },
			_sum: { llmCostCents: true },
		});

		return result._sum.llmCostCents ?? 0;
	}
}
