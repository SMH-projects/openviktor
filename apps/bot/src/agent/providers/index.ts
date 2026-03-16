import type { EnvConfig, LLMProvider } from "@openviktor/shared";
import { LLMError } from "@openviktor/shared";
import { AnthropicProvider } from "./anthropic.js";
import { GoogleProvider } from "./google.js";
import { OpenAIProvider } from "./openai.js";

export type ProviderName = "anthropic" | "openai" | "google";

export function resolveProvider(model: string): ProviderName {
	if (model.startsWith("claude-")) return "anthropic";
	if (model.startsWith("gpt-")) return "openai";
	if (model.startsWith("gemini-")) return "google";
	throw new LLMError(`Unknown model: ${model} — cannot resolve provider`);
}

export function createProvider(name: ProviderName, config: EnvConfig): LLMProvider {
	switch (name) {
		case "anthropic":
			if (!config.ANTHROPIC_API_KEY) {
				throw new LLMError("ANTHROPIC_API_KEY is required to use Claude models");
			}
			return new AnthropicProvider(config.ANTHROPIC_API_KEY);
		case "openai":
			return new OpenAIProvider();
		case "google":
			if (!config.GOOGLE_AI_API_KEY) {
				throw new LLMError("GOOGLE_AI_API_KEY is required to use Gemini models");
			}
			return new GoogleProvider(config.GOOGLE_AI_API_KEY);
	}
}

export { AnthropicProvider } from "./anthropic.js";
export { GoogleProvider } from "./google.js";
export { OpenAIProvider } from "./openai.js";
