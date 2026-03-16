const API_BASE = "/api";

class AuthError extends Error {
	constructor() {
		super("Unauthorized");
		this.name = "AuthError";
	}
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
	const workspaceId = localStorage.getItem("ov_workspace_id");
	const headers: HeadersInit = {
		"Content-Type": "application/json",
		...(workspaceId ? { "X-Workspace-Id": workspaceId } : {}),
	};
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: { ...headers, ...init?.headers },
		credentials: "include",
	});
	if (res.status === 401) {
		throw new AuthError();
	}
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`API ${res.status}: ${body || res.statusText}`);
	}
	return res.json();
}

// ─── Types ──────────────────────────────────────────────

export interface HealthData {
	status: string;
	deploymentMode: string;
	connectedWorkspaces: number;
	database: string;
}

export interface WorkspaceItem {
	id: string;
	slackTeamName: string;
	slackTeamId: string;
	isActive: boolean;
	createdAt: string;
	settings: Record<string, unknown>;
}

export interface UsageStats {
	label: string;
	value: string;
}

export interface UsageChartDay {
	day: number;
	oneOff: number;
	scheduled: number;
}

export interface UsageThread {
	title: string;
	created: string;
	cost: number;
	inputTokens: number;
	outputTokens: number;
}

export interface UsageData {
	stats: UsageStats[];
	chartData: UsageChartDay[];
	threads: UsageThread[];
}

export interface SettingsData {
	defaultModel: string;
}

export interface TeamData {
	teamName: string;
	seatCount: number;
	members: {
		id: string;
		displayName: string;
		slackUserId: string;
		initials: string;
		createdAt: string;
	}[];
	allowBotInvite: boolean;
}

export interface IntegrationApp {
	slug: string;
	name: string;
	description: string;
	imgSrc?: string;
	categories: string[];
	provider: string;
}

export interface IntegrationsData {
	apps: IntegrationApp[];
	connectedSlugs: string[];
	toolCounts: Record<string, number>;
	hasMore?: boolean;
	endCursor?: string | null;
}

export interface TaskItem {
	id: string;
	name: string;
	schedule: string;
	description: string | null;
	enabled: boolean;
	type: string;
	createdAgo: string;
}

export interface OverviewStats {
	totalRuns: number;
	totalCost: number;
	successRate: number;
	activeThreads: number;
}

export interface DayBucket {
	date: string;
	runs: number;
	cost: number;
}

export interface ModelCost {
	model: string;
	cost: number;
	count: number;
}

export interface TriggerCount {
	trigger: string;
	count: number;
}

export interface RunSummary {
	id: string;
	status: string;
	triggerType: string;
	model: string;
	inputTokens: number;
	outputTokens: number;
	costCents: number;
	durationMs: number | null;
	createdAt: string;
	triggeredByName: string | null;
}

export interface OverviewData {
	stats: OverviewStats;
	runsByDay: DayBucket[];
	costByModel: ModelCost[];
	runsByTrigger: TriggerCount[];
	recentRuns: RunSummary[];
}

export interface RunDetail extends RunSummary {
	systemPrompt: string | null;
	errorMessage: string | null;
	startedAt: string | null;
	completedAt: string | null;
	messages: MessageItem[];
	toolCalls: ToolCallItem[];
	thread: {
		id: string;
		slackChannel: string;
		slackThreadTs: string;
		status: string;
	} | null;
}

export interface MessageItem {
	id: string;
	role: string;
	content: string;
	tokenCount: number;
	createdAt: string;
}

export interface ToolCallItem {
	id: string;
	toolName: string;
	toolType: string;
	input: unknown;
	output: unknown;
	status: string;
	durationMs: number | null;
	errorMessage: string | null;
	createdAt: string;
}

export interface Paginated<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}

export interface ToolStat {
	toolName: string;
	totalCalls: number;
	successCount: number;
	failedCount: number;
	avgDurationMs: number;
	lastUsed: string | null;
}

export interface ToolsOverview {
	stats: ToolStat[];
	totalCalls: number;
	overallSuccessRate: number;
}

export interface ThreadItem {
	id: string;
	slackChannel: string;
	slackThreadTs: string;
	status: string;
	phase: number;
	runCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface LearningItem {
	id: string;
	content: string;
	source: string;
	category: string | null;
	createdAt: string;
}

export interface SkillItem {
	id: string;
	name: string;
	content: string;
	version: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Auth ───────────────────────────────────────────────

export interface UserInfo {
	username: string;
	mode: "basic" | "slack-oauth";
	isAdmin: boolean;
	workspaceIds?: string[];
}

export function getMe(): Promise<UserInfo> {
	return fetchApi("/me");
}

export function isAuthError(error: unknown): boolean {
	return error instanceof AuthError;
}

// ─── Phase A — Existing bot endpoints ───────────────────

export function getHealth(): Promise<HealthData> {
	return fetchApi("/health");
}

export function getWorkspaces(): Promise<{ workspaces: WorkspaceItem[] }> {
	return fetchApi("/workspaces");
}

export function getUsage(): Promise<UsageData> {
	return fetchApi("/usage");
}

export function getSettings(): Promise<SettingsData> {
	return fetchApi("/settings");
}

export function updateModel(model: string): Promise<{ success: boolean }> {
	return fetchApi("/settings/model", {
		method: "PUT",
		body: JSON.stringify({ model }),
	});
}

export function getTeam(): Promise<TeamData> {
	return fetchApi("/team");
}

export function getIntegrations(opts?: {
	search?: string;
	after?: string;
	limit?: number;
}): Promise<IntegrationsData> {
	const params = new URLSearchParams();
	if (opts?.search) params.set("search", opts.search);
	if (opts?.after) params.set("after", opts.after);
	if (opts?.limit) params.set("limit", String(opts.limit));
	const qs = params.toString();
	return fetchApi(`/integrations${qs ? `?${qs}` : ""}`);
}

export function connectIntegration(appSlug: string): Promise<{ connectUrl: string }> {
	return fetchApi("/integrations/connect", {
		method: "POST",
		body: JSON.stringify({ appSlug }),
	});
}

export function disconnectIntegration(appSlug: string): Promise<{ success: boolean }> {
	return fetchApi("/integrations/disconnect", {
		method: "POST",
		body: JSON.stringify({ appSlug }),
	});
}

export function getTasks(): Promise<{ tasks: TaskItem[] }> {
	return fetchApi("/tasks");
}

// ─── Phase B — New bot endpoints ────────────────────────

export function getOverview(): Promise<OverviewData> {
	return fetchApi("/overview");
}

export function getRuns(params: {
	page?: number;
	limit?: number;
	status?: string;
	triggerType?: string;
	model?: string;
}): Promise<Paginated<RunSummary>> {
	const sp = new URLSearchParams();
	if (params.page) sp.set("page", String(params.page));
	if (params.limit) sp.set("limit", String(params.limit));
	if (params.status) sp.set("status", params.status);
	if (params.triggerType) sp.set("triggerType", params.triggerType);
	if (params.model) sp.set("model", params.model);
	return fetchApi(`/runs?${sp}`);
}

export function getRunDetail(id: string): Promise<RunDetail> {
	return fetchApi(`/runs/${encodeURIComponent(id)}`);
}

export function getToolsStats(): Promise<ToolsOverview> {
	return fetchApi("/tools/stats");
}

export function getThreads(params: {
	page?: number;
	limit?: number;
	status?: string;
}): Promise<Paginated<ThreadItem>> {
	const sp = new URLSearchParams();
	if (params.page) sp.set("page", String(params.page));
	if (params.limit) sp.set("limit", String(params.limit));
	if (params.status) sp.set("status", params.status);
	return fetchApi(`/threads?${sp}`);
}

export function getLearnings(params: {
	page?: number;
	limit?: number;
	search?: string;
}): Promise<Paginated<LearningItem>> {
	const sp = new URLSearchParams();
	if (params.page) sp.set("page", String(params.page));
	if (params.limit) sp.set("limit", String(params.limit));
	if (params.search) sp.set("search", params.search);
	return fetchApi(`/learnings?${sp}`);
}

export function getSkills(params: {
	page?: number;
	limit?: number;
}): Promise<Paginated<SkillItem>> {
	const sp = new URLSearchParams();
	if (params.page) sp.set("page", String(params.page));
	if (params.limit) sp.set("limit", String(params.limit));
	return fetchApi(`/skills?${sp}`);
}
