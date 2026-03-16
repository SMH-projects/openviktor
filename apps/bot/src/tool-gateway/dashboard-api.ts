import type { PrismaClient } from "@openviktor/db";
import type { PipedreamClient } from "@openviktor/integrations";
import type { EnvConfig, Logger } from "@openviktor/shared";
import type { IntegrationWatcher } from "../integrations/watcher.js";
import type { AuthContext } from "../middleware/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import type { ConnectionManager } from "../slack/connection-manager.js";
import type { UsageLimiter } from "../usage/limiter.js";

interface DashboardApiDeps {
	config: EnvConfig;
	prisma: PrismaClient;
	connectionManager?: ConnectionManager;
	pdClient?: PipedreamClient;
	integrationWatcher?: IntegrationWatcher;
	disconnectApp?: (workspaceId: string, appSlug: string) => Promise<{ removed: string[] }>;
	usageLimiter?: UsageLimiter;
	logger: Logger;
}

const SCHEDULED_TRIGGER_TYPES = ["CRON", "HEARTBEAT", "DISCOVERY"];
const VALID_RUN_STATUSES = ["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"];
const VALID_TRIGGER_TYPES = [
	"MENTION",
	"DM",
	"CRON",
	"HEARTBEAT",
	"DISCOVERY",
	"ONBOARDING",
	"MANUAL",
	"SPAWN",
];
const VALID_THREAD_STATUSES = ["ACTIVE", "WAITING", "COMPLETED", "STALE"];

function formatCost(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

function formatTokens(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M tokens`;
	if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k tokens`;
	return `${count} tokens`;
}

function formatRelativeTime(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const diffMin = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);
	const diffWeeks = Math.floor(diffDays / 7);

	if (diffMin < 1) return "just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return diffDays === 1 ? "yesterday" : `${diffDays}d ago`;
	if (diffWeeks < 4) return `${diffWeeks}w ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.map((p) => p[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function createDashboardApi(deps: DashboardApiDeps) {
	const {
		config,
		prisma,
		connectionManager,
		pdClient,
		integrationWatcher,
		disconnectApp,
		usageLimiter,
		logger,
	} = deps;
	const auth = createAuthMiddleware({ config, prisma, logger });

	async function getWorkspace(workspaceId?: string | null) {
		if (!workspaceId) {
			throw new Error("Workspace ID is required. Pass X-Workspace-Id header.");
		}
		const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
		if (!workspace) throw new Error("Workspace not found");
		return workspace;
	}

	async function handleWorkspaces(authCtx: AuthContext): Promise<Response> {
		const where: Record<string, unknown> = { isActive: true };
		if (authCtx.mode === "slack-oauth" && authCtx.workspaceIds) {
			where.id = { in: authCtx.workspaceIds };
		}

		const workspaces = await prisma.workspace.findMany({
			where,
			select: {
				id: true,
				slackTeamName: true,
				slackTeamId: true,
				isActive: true,
				createdAt: true,
				settings: true,
			},
			orderBy: { createdAt: "asc" },
		});

		return Response.json({ workspaces });
	}

	async function handleWorkspace(workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		return Response.json({
			id: workspace.id,
			slackTeamName: workspace.slackTeamName,
			settings: workspace.settings,
		});
	}

	async function handleIntegrations(url: URL, workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const search = url.searchParams.get("search") ?? "";
		const after = url.searchParams.get("after") ?? undefined;
		const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 100));

		const [accounts, toolDefs] = await Promise.all([
			prisma.integrationAccount.findMany({
				where: { workspaceId: workspace.id, status: "ACTIVE" },
				select: { appSlug: true, appName: true, provider: true },
			}),
			prisma.toolDefinition.findMany({
				where: { workspaceId: workspace.id, name: { startsWith: "mcp_pd_" } },
				select: { name: true },
			}),
		]);

		const connectedSlugs = accounts.map((a) => a.appSlug);

		const toolCounts: Record<string, number> = {};
		for (const tool of toolDefs) {
			const match = tool.name.match(/^mcp_pd_([^_]+(?:_[^_]+)*?)_[^_]+$/);
			if (match) {
				const slug = match[1];
				toolCounts[slug] = (toolCounts[slug] ?? 0) + 1;
			}
		}

		type AppInfo = {
			slug: string;
			name: string;
			description: string;
			imgSrc?: string;
			categories: string[];
			provider: string;
		};

		// Fetch one page from Pipedream (cursor-based pagination)
		let apps: AppInfo[] = [];
		let endCursor: string | null = null;
		let hasMore = false;
		if (pdClient) {
			const result = await pdClient.listApps({
				hasActions: true,
				limit,
				after,
				...(search ? { q: search } : {}),
			});
			apps = result.data.map((app) => ({
				slug: app.name_slug,
				name: app.name,
				description: app.description ?? "",
				imgSrc: app.img_src,
				categories: app.categories ?? [],
				provider: "pipedream",
			}));
			endCursor = result.page_info.end_cursor;
			hasMore = result.data.length === limit && endCursor !== null;
		}

		// Add connected apps not in current page (always show at top on first page)
		if (!after) {
			const appSlugs = new Set(apps.map((a) => a.slug));
			for (const account of accounts) {
				if (!appSlugs.has(account.appSlug)) {
					apps.unshift({
						slug: account.appSlug,
						name: account.appName,
						description: "",
						categories: [],
						provider: account.provider,
					});
				}
			}
		}

		return Response.json({ apps, connectedSlugs, toolCounts, hasMore, endCursor });
	}

	async function handleConnect(req: Request, workspaceId: string | null): Promise<Response> {
		if (!pdClient) {
			return Response.json({ error: "Pipedream not configured" }, { status: 503 });
		}

		const { appSlug } = (await req.json()) as { appSlug: string };
		if (!appSlug) {
			return Response.json({ error: "appSlug is required" }, { status: 400 });
		}

		const workspace = await getWorkspace(workspaceId);
		const externalUserId = `workspace_${workspace.id}`;
		const token = await pdClient.createConnectToken(externalUserId);
		const separator = token.connect_link_url.includes("?") ? "&" : "?";
		const connectUrl = `${token.connect_link_url}${separator}app=${appSlug}`;

		integrationWatcher?.watch(workspace.id, appSlug);

		return Response.json({ connectUrl });
	}

	async function handleDisconnect(req: Request, workspaceId: string | null): Promise<Response> {
		const { appSlug } = (await req.json()) as { appSlug: string };
		if (!appSlug) {
			return Response.json({ error: "appSlug is required" }, { status: 400 });
		}

		const workspace = await getWorkspace(workspaceId);

		if (disconnectApp) {
			await disconnectApp(workspace.id, appSlug);
		} else {
			await prisma.integrationAccount.updateMany({
				where: { workspaceId: workspace.id, appSlug, status: "ACTIVE" },
				data: { status: "REVOKED" },
			});
			await prisma.toolDefinition.deleteMany({
				where: { workspaceId: workspace.id, name: { startsWith: `mcp_pd_${appSlug}_` } },
			});
		}

		return Response.json({ success: true });
	}

	async function handleUsage(workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrow = new Date(todayStart.getTime() + 86_400_000);

		const [monthRuns, todayRuns, threadRows] = await Promise.all([
			prisma.agentRun.findMany({
				where: { workspaceId: workspace.id, createdAt: { gte: monthStart } },
				select: {
					costCents: true,
					inputTokens: true,
					outputTokens: true,
					triggerType: true,
					createdAt: true,
				},
			}),
			prisma.agentRun.findMany({
				where: { workspaceId: workspace.id, createdAt: { gte: todayStart, lt: tomorrow } },
				select: { costCents: true },
			}),
			prisma.agentRun.findMany({
				where: {
					workspaceId: workspace.id,
					createdAt: { gte: monthStart },
					threadId: { not: null },
				},
				select: {
					costCents: true,
					inputTokens: true,
					outputTokens: true,
					thread: {
						select: { id: true, title: true, slackChannel: true, createdAt: true },
					},
				},
			}),
		]);

		const totalCost = monthRuns.reduce((sum, r) => sum + r.costCents, 0);
		const todayCost = todayRuns.reduce((sum, r) => sum + r.costCents, 0);
		const totalInputTokens = monthRuns.reduce((sum, r) => sum + r.inputTokens, 0);
		const totalOutputTokens = monthRuns.reduce((sum, r) => sum + r.outputTokens, 0);
		const daysElapsed = Math.max(
			1,
			Math.floor((now.getTime() - monthStart.getTime()) / 86_400_000) + 1,
		);
		const avgPerDay = totalCost / daysElapsed;

		const stats = [
			{ label: "Total Cost", value: formatCost(totalCost) },
			{ label: "Today", value: formatCost(todayCost) },
			{ label: "Avg / Day", value: formatCost(avgPerDay) },
			{ label: "Tokens", value: formatTokens(totalInputTokens + totalOutputTokens) },
		];

		const dailyMap = new Map<number, { oneOff: number; scheduled: number }>();
		for (const run of monthRuns) {
			const day = run.createdAt.getDate();
			const entry = dailyMap.get(day) ?? { oneOff: 0, scheduled: 0 };
			if (SCHEDULED_TRIGGER_TYPES.includes(run.triggerType)) {
				entry.scheduled += run.costCents / 100;
			} else {
				entry.oneOff += run.costCents / 100;
			}
			dailyMap.set(day, entry);
		}
		const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
		const chartData = Array.from({ length: Math.min(now.getDate(), daysInMonth) }, (_, i) => {
			const day = i + 1;
			const entry = dailyMap.get(day) ?? { oneOff: 0, scheduled: 0 };
			return { day, oneOff: entry.oneOff, scheduled: entry.scheduled };
		});

		const threadCostMap = new Map<
			string,
			{
				title: string;
				createdAt: Date;
				total: number;
				inputTokens: number;
				outputTokens: number;
			}
		>();
		for (const run of threadRows) {
			if (!run.thread) continue;
			const { id, title, slackChannel, createdAt } = run.thread;
			const displayTitle = title ?? `Slack: ${slackChannel}`;
			const existing = threadCostMap.get(id);
			if (existing) {
				existing.total += run.costCents;
				existing.inputTokens += run.inputTokens;
				existing.outputTokens += run.outputTokens;
			} else {
				threadCostMap.set(id, {
					title: displayTitle,
					createdAt,
					total: run.costCents,
					inputTokens: run.inputTokens,
					outputTokens: run.outputTokens,
				});
			}
		}
		const threads = Array.from(threadCostMap.values())
			.sort((a, b) => b.total - a.total)
			.slice(0, 10)
			.map((t) => ({
				title: t.title,
				created: t.createdAt.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				}),
				cost: t.total,
				inputTokens: t.inputTokens,
				outputTokens: t.outputTokens,
			}));

		let budget: Record<string, unknown> | undefined;
		if (usageLimiter) {
			const status = await usageLimiter.getBudgetStatus(workspace.id);
			budget = {
				limitCents: status.limitCents,
				usedCents: status.usedCents,
				remainingCents: status.remainingCents,
				percentUsed: status.percentUsed,
				resetsAt: status.resetsAt,
			};
		}

		return Response.json({ stats, chartData, threads, budget });
	}

	async function handleGetBudget(workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const settings = (workspace.settings as Record<string, unknown>) ?? {};
		const budgetCents =
			typeof settings.monthlyBudgetCents === "number" ? settings.monthlyBudgetCents : 2000;
		return Response.json({ monthlyBudgetCents: budgetCents });
	}

	async function handleUpdateBudget(req: Request, workspaceId: string | null): Promise<Response> {
		const { monthlyBudgetCents } = (await req.json()) as { monthlyBudgetCents: number };
		if (typeof monthlyBudgetCents !== "number" || monthlyBudgetCents < 0) {
			return Response.json(
				{ error: "monthlyBudgetCents must be a non-negative number" },
				{ status: 400 },
			);
		}
		const workspace = await getWorkspace(workspaceId);
		const settings = (workspace.settings as Record<string, unknown>) ?? {};
		await prisma.workspace.update({
			where: { id: workspace.id },
			data: { settings: { ...settings, monthlyBudgetCents } },
		});
		return Response.json({ success: true });
	}

	async function handleTasks(workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const cronJobs = await prisma.cronJob.findMany({
			where: { workspaceId: workspace.id },
			orderBy: { createdAt: "desc" },
		});

		const tasks = cronJobs.map((job) => ({
			id: job.id,
			name: job.name,
			schedule: job.schedule,
			description: job.description,
			enabled: job.enabled,
			type: job.type,
			createdAgo: formatRelativeTime(job.createdAt),
		}));

		return Response.json({ tasks });
	}

	async function handleTeam(workspaceId: string | null): Promise<Response> {
		const workspace = await prisma.workspace.findFirst({
			where: workspaceId ? { id: workspaceId } : { isActive: true },
			include: { members: true },
		});
		if (!workspace) {
			return Response.json({ error: "No workspace found" }, { status: 404 });
		}

		const settings = workspace.settings as Record<string, unknown>;
		const members = workspace.members.map((m) => ({
			id: m.id,
			displayName: m.displayName ?? m.slackUserId,
			slackUserId: m.slackUserId,
			initials: getInitials(m.displayName ?? m.slackUserId),
			createdAt: m.createdAt.toISOString(),
		}));

		return Response.json({
			teamName: workspace.slackTeamName,
			seatCount: workspace.members.length,
			members,
			allowBotInvite: settings.allowBotInvite !== false,
		});
	}

	async function handleGetSettings(workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const settings = workspace.settings as Record<string, unknown>;
		return Response.json({
			defaultModel: (settings.defaultModel as string) ?? "claude-opus-4-6",
		});
	}

	async function handleUpdateModel(req: Request, workspaceId: string | null): Promise<Response> {
		const { model } = (await req.json()) as { model: string };
		if (!model) {
			return Response.json({ error: "model is required" }, { status: 400 });
		}
		const workspace = await getWorkspace(workspaceId);
		const settings = (workspace.settings as Record<string, unknown>) ?? {};
		await prisma.workspace.update({
			where: { id: workspace.id },
			data: { settings: { ...settings, defaultModel: model } },
		});
		return Response.json({ success: true });
	}

	async function handleOverview(workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

		const [allRuns, activeThreads] = await Promise.all([
			prisma.agentRun.findMany({
				where: { workspaceId: workspace.id, createdAt: { gte: thirtyDaysAgo } },
				select: {
					id: true,
					status: true,
					model: true,
					triggerType: true,
					costCents: true,
					inputTokens: true,
					outputTokens: true,
					durationMs: true,
					createdAt: true,
					member: { select: { displayName: true } },
				},
				orderBy: { createdAt: "desc" },
			}),
			prisma.thread.count({
				where: { workspaceId: workspace.id, status: "ACTIVE" },
			}),
		]);

		const totalRuns = allRuns.length;
		const completedRuns = allRuns.filter((r) => r.status === "COMPLETED").length;
		const totalCost = allRuns.reduce((sum, r) => sum + r.costCents, 0);
		const successRate = totalRuns > 0 ? completedRuns / totalRuns : 0;

		const runsByDayMap = new Map<string, { runs: number; cost: number }>();
		for (const run of allRuns) {
			const d = run.createdAt;
			const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			const entry = runsByDayMap.get(day) ?? { runs: 0, cost: 0 };
			entry.runs++;
			entry.cost += run.costCents;
			runsByDayMap.set(day, entry);
		}
		const runsByDay = Array.from(runsByDayMap.entries())
			.map(([date, v]) => ({ date, runs: v.runs, cost: v.cost }))
			.sort((a, b) => a.date.localeCompare(b.date));

		const costByModelMap = new Map<string, { cost: number; count: number }>();
		for (const run of allRuns) {
			const entry = costByModelMap.get(run.model) ?? { cost: 0, count: 0 };
			entry.cost += run.costCents;
			entry.count++;
			costByModelMap.set(run.model, entry);
		}
		const costByModel = Array.from(costByModelMap.entries())
			.map(([model, v]) => ({ model, cost: v.cost, count: v.count }))
			.sort((a, b) => b.cost - a.cost);

		const runsByTriggerMap = new Map<string, number>();
		for (const run of allRuns) {
			runsByTriggerMap.set(run.triggerType, (runsByTriggerMap.get(run.triggerType) ?? 0) + 1);
		}
		const runsByTrigger = Array.from(runsByTriggerMap.entries())
			.map(([trigger, count]) => ({ trigger, count }))
			.sort((a, b) => b.count - a.count);

		const recentRuns = allRuns.slice(0, 10).map((r) => ({
			id: r.id,
			status: r.status,
			model: r.model,
			triggerType: r.triggerType,
			costCents: r.costCents,
			inputTokens: r.inputTokens,
			outputTokens: r.outputTokens,
			durationMs: r.durationMs,
			createdAt: r.createdAt.toISOString(),
			triggeredByName: r.member?.displayName ?? null,
		}));

		return Response.json({
			stats: {
				totalRuns,
				totalCost,
				successRate: Math.round(successRate * 1000) / 10,
				activeThreads,
			},
			runsByDay,
			costByModel,
			runsByTrigger,
			recentRuns,
		});
	}

	async function handleRuns(url: URL, workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
		const limit = Math.min(
			100,
			Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 25)),
		);
		const status = url.searchParams.get("status");
		const triggerType = url.searchParams.get("triggerType");
		const model = url.searchParams.get("model");

		const where: Record<string, unknown> = { workspaceId: workspace.id };
		if (status) {
			if (!VALID_RUN_STATUSES.includes(status))
				return Response.json({ error: `Invalid status: ${status}` }, { status: 400 });
			where.status = status;
		}
		if (triggerType) {
			if (!VALID_TRIGGER_TYPES.includes(triggerType))
				return Response.json({ error: `Invalid triggerType: ${triggerType}` }, { status: 400 });
			where.triggerType = triggerType;
		}
		if (model) where.model = model;

		const [data, total] = await Promise.all([
			prisma.agentRun.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					status: true,
					model: true,
					triggerType: true,
					costCents: true,
					inputTokens: true,
					outputTokens: true,
					durationMs: true,
					errorMessage: true,
					createdAt: true,
					completedAt: true,
					member: { select: { displayName: true } },
				},
			}),
			prisma.agentRun.count({ where }),
		]);

		const runs = data.map((r) => ({
			id: r.id,
			status: r.status,
			model: r.model,
			triggerType: r.triggerType,
			costCents: r.costCents,
			inputTokens: r.inputTokens,
			outputTokens: r.outputTokens,
			durationMs: r.durationMs,
			errorMessage: r.errorMessage,
			createdAt: r.createdAt.toISOString(),
			completedAt: r.completedAt?.toISOString() ?? null,
			triggeredByName: r.member?.displayName ?? null,
		}));

		return Response.json({ data: runs, total, page, limit });
	}

	async function handleRunDetail(runId: string, workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const run = await prisma.agentRun.findFirst({
			where: { id: runId, workspaceId: workspace.id },
			include: {
				messages: { orderBy: { createdAt: "asc" } },
				toolCalls: { orderBy: { createdAt: "asc" } },
				thread: true,
				member: { select: { displayName: true, slackUserId: true } },
			},
		});

		if (!run) {
			return Response.json({ error: "Run not found" }, { status: 404 });
		}

		return Response.json({
			id: run.id,
			status: run.status,
			model: run.model,
			triggerType: run.triggerType,
			costCents: run.costCents,
			inputTokens: run.inputTokens,
			outputTokens: run.outputTokens,
			durationMs: run.durationMs,
			errorMessage: run.errorMessage,
			createdAt: run.createdAt.toISOString(),
			startedAt: run.startedAt?.toISOString() ?? null,
			completedAt: run.completedAt?.toISOString() ?? null,
			member: run.member
				? { displayName: run.member.displayName, slackUserId: run.member.slackUserId }
				: null,
			thread: run.thread
				? {
						id: run.thread.id,
						title: run.thread.title,
						slackChannel: run.thread.slackChannel,
						status: run.thread.status,
					}
				: null,
			messages: run.messages.map((m) => ({
				id: m.id,
				role: m.role,
				content: m.content,
				tokenCount: m.tokenCount,
				createdAt: m.createdAt.toISOString(),
			})),
			toolCalls: run.toolCalls.map((tc) => ({
				id: tc.id,
				toolName: tc.toolName,
				toolType: tc.toolType,
				input: tc.input,
				output: tc.output,
				status: tc.status,
				durationMs: tc.durationMs,
				errorMessage: tc.errorMessage,
				createdAt: tc.createdAt.toISOString(),
			})),
		});
	}

	async function handleThreads(url: URL, workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
		const limit = Math.min(
			100,
			Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 25)),
		);
		const status = url.searchParams.get("status");

		const where: Record<string, unknown> = { workspaceId: workspace.id };
		if (status) {
			if (!VALID_THREAD_STATUSES.includes(status))
				return Response.json({ error: `Invalid status: ${status}` }, { status: 400 });
			where.status = status;
		}

		const [data, total] = await Promise.all([
			prisma.thread.findMany({
				where,
				orderBy: { updatedAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					title: true,
					slackChannel: true,
					slackThreadTs: true,
					status: true,
					phase: true,
					createdAt: true,
					updatedAt: true,
					_count: { select: { agentRuns: true } },
				},
			}),
			prisma.thread.count({ where }),
		]);

		const threads = data.map((t) => ({
			id: t.id,
			title: t.title,
			slackChannel: t.slackChannel,
			slackThreadTs: t.slackThreadTs,
			status: t.status,
			phase: t.phase,
			runCount: t._count.agentRuns,
			createdAt: t.createdAt.toISOString(),
			updatedAt: t.updatedAt.toISOString(),
		}));

		return Response.json({ data: threads, total, page, limit });
	}

	async function handleToolsStats(workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const toolCalls = await prisma.toolCall.findMany({
			where: {
				agentRun: { workspaceId: workspace.id },
				createdAt: { gte: new Date(Date.now() - 90 * 86_400_000) },
			},
			select: {
				toolName: true,
				status: true,
				durationMs: true,
				createdAt: true,
			},
		});

		const statsMap = new Map<
			string,
			{
				totalCalls: number;
				successCount: number;
				failedCount: number;
				totalDurationMs: number;
				durCount: number;
				lastUsed: Date;
			}
		>();

		for (const tc of toolCalls) {
			const entry = statsMap.get(tc.toolName) ?? {
				totalCalls: 0,
				successCount: 0,
				failedCount: 0,
				totalDurationMs: 0,
				durCount: 0,
				lastUsed: tc.createdAt,
			};
			entry.totalCalls++;
			if (tc.status === "COMPLETED") entry.successCount++;
			if (tc.status === "FAILED") entry.failedCount++;
			if (tc.durationMs != null) {
				entry.totalDurationMs += tc.durationMs;
				entry.durCount++;
			}
			if (tc.createdAt > entry.lastUsed) entry.lastUsed = tc.createdAt;
			statsMap.set(tc.toolName, entry);
		}

		const stats = Array.from(statsMap.entries())
			.map(([toolName, s]) => ({
				toolName,
				totalCalls: s.totalCalls,
				successCount: s.successCount,
				failedCount: s.failedCount,
				avgDurationMs: s.durCount > 0 ? Math.round(s.totalDurationMs / s.durCount) : null,
				lastUsed: s.lastUsed.toISOString(),
			}))
			.sort((a, b) => b.totalCalls - a.totalCalls);

		const totalCalls = toolCalls.length;
		const successTotal = toolCalls.filter((tc) => tc.status === "COMPLETED").length;
		const overallSuccessRate =
			totalCalls > 0 ? Math.round((successTotal / totalCalls) * 1000) / 10 : 0;

		return Response.json({ stats, totalCalls, overallSuccessRate });
	}

	async function handleLearnings(url: URL, workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
		const limit = Math.min(
			100,
			Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 25)),
		);
		const search = url.searchParams.get("search");

		const where: Record<string, unknown> = { workspaceId: workspace.id };
		if (search) {
			where.OR = [
				{ content: { contains: search, mode: "insensitive" } },
				{ source: { contains: search, mode: "insensitive" } },
				{ category: { contains: search, mode: "insensitive" } },
			];
		}

		const [data, total] = await Promise.all([
			prisma.learning.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					content: true,
					source: true,
					category: true,
					createdAt: true,
				},
			}),
			prisma.learning.count({ where }),
		]);

		const learnings = data.map((l) => ({
			id: l.id,
			content: l.content,
			source: l.source,
			category: l.category,
			createdAt: l.createdAt.toISOString(),
		}));

		return Response.json({ data: learnings, total, page, limit });
	}

	async function handleSkills(url: URL, workspaceId: string | null): Promise<Response> {
		const workspace = await getWorkspace(workspaceId);
		const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
		const limit = Math.min(
			100,
			Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 25)),
		);

		const where = { workspaceId: workspace.id };

		const [data, total] = await Promise.all([
			prisma.skill.findMany({
				where,
				orderBy: { updatedAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					name: true,
					content: true,
					description: true,
					category: true,
					version: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
			prisma.skill.count({ where }),
		]);

		const skills = data.map((s) => ({
			id: s.id,
			name: s.name,
			content: s.content,
			description: s.description,
			category: s.category,
			version: s.version,
			createdAt: s.createdAt.toISOString(),
			updatedAt: s.updatedAt.toISOString(),
		}));

		return Response.json({ data: skills, total, page, limit });
	}

	async function handleHealth(): Promise<Response> {
		let dbOk = false;
		try {
			await prisma.$queryRaw`SELECT 1`;
			dbOk = true;
		} catch {
			/* noop */
		}

		return Response.json({
			status: dbOk ? "healthy" : "degraded",
			deploymentMode: config.DEPLOYMENT_MODE,
			connectedWorkspaces: connectionManager?.connectedCount ?? 0,
			database: dbOk ? "connected" : "disconnected",
		});
	}

	return {
		fetch: async (req: Request): Promise<Response> => {
			const url = new URL(req.url, "http://localhost");
			const { pathname } = url;

			try {
				// Public endpoints (no auth required)
				if (req.method === "GET" && pathname === "/api/health") {
					return await handleHealth();
				}
				if (req.method === "POST" && pathname === "/api/auth/login") {
					return await auth.handleLogin(req);
				}

				// Authenticate all other /api/* routes
				const authCtx = await auth.authenticate(req);
				if (!authCtx) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				if (req.method === "GET" && pathname === "/api/me") {
					return Response.json({
						username: authCtx.username,
						mode: authCtx.mode,
						isAdmin: authCtx.mode === "basic",
						workspaceIds: authCtx.workspaceIds,
					});
				}

				const workspaceId = auth.resolveWorkspaceId(req, authCtx);

				if (req.method === "GET" && pathname === "/api/workspaces")
					return await handleWorkspaces(authCtx);
				if (req.method === "GET" && pathname === "/api/workspace")
					return await handleWorkspace(workspaceId);
				if (req.method === "GET" && pathname === "/api/integrations")
					return await handleIntegrations(url, workspaceId);
				if (req.method === "POST" && pathname === "/api/integrations/connect")
					return await handleConnect(req, workspaceId);
				if (req.method === "POST" && pathname === "/api/integrations/disconnect")
					return await handleDisconnect(req, workspaceId);
				if (req.method === "GET" && pathname === "/api/usage")
					return await handleUsage(workspaceId);
				if (req.method === "GET" && pathname === "/api/tasks")
					return await handleTasks(workspaceId);
				if (req.method === "GET" && pathname === "/api/team") return await handleTeam(workspaceId);
				if (req.method === "GET" && pathname === "/api/settings")
					return await handleGetSettings(workspaceId);
				if (req.method === "PUT" && pathname === "/api/settings/model")
					return await handleUpdateModel(req, workspaceId);
				if (req.method === "GET" && pathname === "/api/settings/budget")
					return await handleGetBudget(workspaceId);
				if (req.method === "PUT" && pathname === "/api/settings/budget")
					return await handleUpdateBudget(req, workspaceId);

				const runsIdMatch = pathname.match(/^\/api\/runs\/([^/]+)$/);

				if (req.method === "GET" && pathname === "/api/overview")
					return await handleOverview(workspaceId);
				if (req.method === "GET" && pathname === "/api/runs" && !runsIdMatch)
					return await handleRuns(url, workspaceId);
				if (req.method === "GET" && runsIdMatch)
					return await handleRunDetail(decodeURIComponent(runsIdMatch[1]), workspaceId);
				if (req.method === "GET" && pathname === "/api/threads")
					return await handleThreads(url, workspaceId);
				if (req.method === "GET" && pathname === "/api/tools/stats")
					return await handleToolsStats(workspaceId);
				if (req.method === "GET" && pathname === "/api/learnings")
					return await handleLearnings(url, workspaceId);
				if (req.method === "GET" && pathname === "/api/skills")
					return await handleSkills(url, workspaceId);

				return Response.json({ error: "Not found" }, { status: 404 });
			} catch (err) {
				logger.error({ err, pathname }, "Dashboard API error");
				const message = err instanceof Error ? err.message : "Internal server error";
				return Response.json({ error: message }, { status: 500 });
			}
		},
	};
}
