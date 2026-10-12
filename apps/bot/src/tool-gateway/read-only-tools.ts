// Keep the owner A2A surface read-only until tool definitions carry an explicit
// machine-readable annotation.
export const READ_ONLY_TOOLS = [
	"read_learnings",
	"read_skill",
	"list_skills",
	"file_read",
	"file_to_markdown",
	"glob",
	"grep",
	"view_image",
	"workspace_tree",
	"quick_ai_search",
	"resolve_library_id",
	"query_library_docs",
	"coworker_slack_history",
	"coworker_list_slack_channels",
	"coworker_list_slack_users",
	"coworker_get_slack_reactions",
] as const;
