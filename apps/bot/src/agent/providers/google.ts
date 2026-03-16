import type {
	ContentBlock,
	LLMMessage,
	LLMProvider,
	LLMResponse,
	LLMToolDefinition,
	StopReason,
} from "@openviktor/shared";
import { LLMError } from "@openviktor/shared";
import { calculateCostCents } from "../pricing.js";
import { withRetry } from "../retry.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiPart {
	text?: string;
	functionCall?: { name: string; args: Record<string, unknown> };
	functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
	role: "user" | "model";
	parts: GeminiPart[];
}

interface GeminiResponse {
	candidates?: Array<{
		content: { parts: GeminiPart[]; role: string };
		finishReason: string;
	}>;
	usageMetadata?: {
		promptTokenCount?: number;
		candidatesTokenCount?: number;
		totalTokenCount?: number;
		thoughtsTokenCount?: number;
	};
	error?: { code: number; message: string; status: string };
}

function generateCallId(): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let id = "call_";
	for (let i = 0; i < 12; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
}

function extractSystemInstruction(messages: LLMMessage[]): string | undefined {
	const systemMessages = messages.filter((m) => m.role === "system");
	if (systemMessages.length === 0) return undefined;
	return systemMessages
		.map((m) => {
			if (typeof m.content === "string") return m.content;
			if (Array.isArray(m.content)) {
				return m.content
					.filter((b) => b.type === "text")
					.map((b) => (b as { text: string }).text)
					.join("\n\n");
			}
			return "";
		})
		.join("\n\n");
}

function buildToolUseIdMap(messages: LLMMessage[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const msg of messages) {
		if (msg.role !== "assistant" || typeof msg.content === "string") continue;
		for (const block of msg.content) {
			if (block.type === "tool_use") {
				map.set(block.id, block.name);
			}
		}
	}
	return map;
}

function toolResultToPart(
	block: import("@openviktor/shared").ToolResultBlock,
	toolIdToName: Map<string, string>,
): GeminiPart {
	const toolName = toolIdToName.get(block.tool_use_id) ?? "unknown";
	if (block.is_error) {
		return { functionResponse: { name: toolName, response: { error: block.content } } };
	}
	let responseObj: Record<string, unknown>;
	try {
		responseObj =
			typeof block.content === "string" ? JSON.parse(block.content) : { result: block.content };
	} catch {
		responseObj = { result: block.content };
	}
	return { functionResponse: { name: toolName, response: responseObj } };
}

function convertUserBlocks(
	content: import("@openviktor/shared").ContentBlock[],
	toolIdToName: Map<string, string>,
): GeminiPart[] {
	const parts: GeminiPart[] = [];
	for (const block of content) {
		if (block.type === "text") {
			parts.push({ text: block.text });
		} else if (block.type === "tool_result") {
			parts.push(toolResultToPart(block, toolIdToName));
		}
	}
	return parts;
}

function convertAssistantBlocks(
	content: import("@openviktor/shared").ContentBlock[],
): GeminiPart[] {
	const parts: GeminiPart[] = [];
	for (const block of content) {
		if (block.type === "text" && block.text) {
			parts.push({ text: block.text });
		} else if (block.type === "tool_use") {
			parts.push({ functionCall: { name: block.name, args: block.input } });
		}
	}
	return parts;
}

function convertMessage(msg: LLMMessage, toolIdToName: Map<string, string>): GeminiContent | null {
	if (msg.role === "system") return null;
	const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
	if (typeof msg.content === "string") {
		return { role, parts: [{ text: msg.content }] };
	}
	const parts =
		msg.role === "user"
			? convertUserBlocks(msg.content, toolIdToName)
			: convertAssistantBlocks(msg.content);
	return parts.length > 0 ? { role, parts } : null;
}

function toGeminiContents(
	messages: LLMMessage[],
	toolIdToName: Map<string, string>,
): GeminiContent[] {
	return messages.map((m) => convertMessage(m, toolIdToName)).filter(Boolean) as GeminiContent[];
}

function toGeminiFunctionDeclarations(
	tools: LLMToolDefinition[],
): Array<{ name: string; description: string; parameters?: Record<string, unknown> }> {
	return tools.map((t) => {
		const decl: { name: string; description: string; parameters?: Record<string, unknown> } = {
			name: t.name,
			description: t.description,
		};
		if (t.input_schema && Object.keys(t.input_schema).length > 0) {
			const { $schema, ...rest } = t.input_schema;
			decl.parameters = rest;
		}
		return decl;
	});
}

function resolveToolConfig(
	toolChoice?: "auto" | "any" | { type: "tool"; name: string },
): Record<string, unknown> | undefined {
	if (!toolChoice) return undefined;
	if (toolChoice === "any") {
		return { functionCallingConfig: { mode: "ANY" } };
	}
	if (typeof toolChoice === "object" && toolChoice.type === "tool") {
		return {
			functionCallingConfig: { mode: "ANY", allowedFunctionNames: [toolChoice.name] },
		};
	}
	return undefined;
}

async function geminiRequest(
	url: string,
	body: unknown,
	timeoutMs?: number,
): Promise<GeminiResponse> {
	const controller = new AbortController();
	const timeout = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		if (!res.ok) {
			const errBody = await res.text();
			let message = errBody;
			try {
				const parsed = JSON.parse(errBody);
				message = parsed.error?.message ?? errBody;
			} catch {}
			const err = mapGeminiError(res.status, message);
			Object.assign(err, { status: res.status });
			throw err;
		}

		return (await res.json()) as GeminiResponse;
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}

function mapFinishReason(reason: string, hasFunctionCalls: boolean): StopReason {
	if (hasFunctionCalls) return "tool_use";
	switch (reason) {
		case "STOP":
			return "end_turn";
		case "MAX_TOKENS":
			return "max_tokens";
		case "SAFETY":
		case "RECITATION":
		case "BLOCKLIST":
		case "PROHIBITED_CONTENT":
			return "refusal";
		default:
			return "end_turn";
	}
}

function parseResponseContent(parts: GeminiPart[]): {
	content: ContentBlock[];
	hasFunctionCalls: boolean;
} {
	const content: ContentBlock[] = [];
	let hasFunctionCalls = false;

	for (const part of parts) {
		if (part.text) {
			content.push({ type: "text", text: part.text });
		}
		if (part.functionCall) {
			hasFunctionCalls = true;
			content.push({
				type: "tool_use",
				id: generateCallId(),
				name: part.functionCall.name,
				input: part.functionCall.args ?? {},
			});
		}
	}

	return { content, hasFunctionCalls };
}

function mapGeminiError(status: number, message: string): LLMError {
	switch (status) {
		case 401:
		case 403:
			return new LLMError("Invalid Google AI API key");
		case 429:
			return new LLMError("Rate limit exceeded after retries");
		case 400:
			if (message.includes("prompt is too long") || message.includes("exceeds the maximum")) {
				return new LLMError(`Bad request: prompt is too long: ${message}`);
			}
			return new LLMError(`Bad request: ${message}`);
		case 500:
		case 503:
			return new LLMError("Google AI API is temporarily unavailable");
		default:
			return new LLMError(`Google AI API error (${status}): ${message}`);
	}
}

export class GoogleProvider implements LLMProvider {
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async chat(params: {
		model: string;
		messages: LLMMessage[];
		maxTokens?: number;
		tools?: LLMToolDefinition[];
		toolChoice?: "auto" | "any" | { type: "tool"; name: string };
		timeoutMs?: number;
	}): Promise<LLMResponse> {
		const systemInstruction = extractSystemInstruction(params.messages);
		const toolIdToName = buildToolUseIdMap(params.messages);
		const contents = toGeminiContents(params.messages, toolIdToName);

		const body: Record<string, unknown> = {
			contents,
			generationConfig: {
				maxOutputTokens: params.maxTokens ?? 8192,
			},
		};

		if (systemInstruction) {
			body.systemInstruction = { parts: [{ text: systemInstruction }] };
		}

		if (params.tools?.length) {
			body.tools = [{ functionDeclarations: toGeminiFunctionDeclarations(params.tools) }];
			body.toolConfig = resolveToolConfig(params.toolChoice);
		}

		const url = `${GEMINI_API_BASE}/models/${params.model}:generateContent?key=${this.apiKey}`;

		const response = await withRetry(() => geminiRequest(url, body, params.timeoutMs), {
			maxRetries: 2,
		});

		if (response.error) {
			throw mapGeminiError(response.error.code, response.error.message);
		}

		const candidate = response.candidates?.[0];
		if (!candidate) {
			throw new LLMError("No response candidates returned from Gemini API");
		}

		const { content, hasFunctionCalls } = parseResponseContent(candidate.content.parts);
		const stopReason = mapFinishReason(candidate.finishReason, hasFunctionCalls);

		const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
		const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

		const tokenUsage = {
			inputTokens,
			outputTokens,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0,
		};

		return {
			id: `gemini-${Date.now()}`,
			content,
			stopReason,
			model: params.model,
			inputTokens,
			outputTokens,
			cacheCreationInputTokens: 0,
			cacheReadInputTokens: 0,
			costCents: calculateCostCents(params.model, tokenUsage),
		};
	}
}
