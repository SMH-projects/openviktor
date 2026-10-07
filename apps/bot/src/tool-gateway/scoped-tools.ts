import { randomBytes } from "node:crypto";
import { ToolGatewayClient } from "@openviktor/tools";
import type { LLMToolDefinition } from "@openviktor/shared";
import type { ToolConfig } from "../agent/runner.js";
import { registerWorkspaceToken, revokeWorkspaceToken } from "./server.js";

export function createScopedToolAccess(workspaceId: string, port: number, timeoutMs: number,
	tools: LLMToolDefinition[]): { token: string; config: ToolConfig; dispose: () => void } {
	const token = randomBytes(32).toString("hex");
	registerWorkspaceToken(token, workspaceId);
	return { token,
		config: { client: new ToolGatewayClient({ baseUrl: `http://localhost:${port}`,
			token, timeoutMs }), tools },
		dispose: () => revokeWorkspaceToken(token) };
}
