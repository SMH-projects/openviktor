import type { PrismaClient } from "@openviktor/db";
import type { Logger } from "@openviktor/shared";

export interface UsageEntry {
	inputTokens: number;
	outputTokens: number;
	costCents: number;
	toolExecutions: number;
}

export class UsageTracker {
	constructor(
		private prisma: PrismaClient,
		private logger: Logger,
	) {}

	async record(workspaceId: string, entry: UsageEntry): Promise<void> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		try {
			await this.prisma.usageRecord.upsert({
				where: { workspaceId_date: { workspaceId, date: today } },
				update: {
					messageCount: { increment: 1 },
					tokenCount: { increment: entry.inputTokens + entry.outputTokens },
					toolExecutions: { increment: entry.toolExecutions },
					llmCostCents: { increment: Math.round(entry.costCents) },
				},
				create: {
					workspaceId,
					date: today,
					messageCount: 1,
					tokenCount: entry.inputTokens + entry.outputTokens,
					toolExecutions: entry.toolExecutions,
					llmCostCents: Math.round(entry.costCents),
				},
			});
		} catch (err) {
			this.logger.error({ err, workspaceId }, "Failed to record usage");
		}
	}
}
