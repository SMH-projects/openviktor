import { describe, expect, it } from "vitest";
import { buildSandboxEnv } from "../sandbox-env.js";

describe("buildSandboxEnv", () => {
	it("includes only allowlisted environment variables", () => {
		const env = buildSandboxEnv("/workspace");
		const keys = Object.keys(env);

		const allowlist = [
			"PATH",
			"HOME",
			"USER",
			"LANG",
			"LC_ALL",
			"TERM",
			"TMPDIR",
			"TZ",
			"TOOL_GATEWAY_URL",
			"TOOL_TOKEN",
		];
		for (const key of keys) {
			expect(allowlist).toContain(key);
		}
	});

	it("sets HOME to the provided workspace directory", () => {
		const env = buildSandboxEnv("/my/workspace");
		expect(env.HOME).toBe("/my/workspace");
	});

	it("does not include common secret env vars from the host", () => {
		const secrets = [
			"ANTHROPIC_API_KEY",
			"GOOGLE_AI_API_KEY",
			"DATABASE_URL",
			"REDIS_URL",
			"AWS_SECRET_ACCESS_KEY",
			"OPENAI_API_KEY",
		];

		for (const key of secrets) {
			process.env[key] = "test-secret-value";
		}

		try {
			const env = buildSandboxEnv("/workspace");
			for (const key of secrets) {
				expect(env).not.toHaveProperty(key);
			}
		} finally {
			for (const key of secrets) {
				delete process.env[key];
			}
		}
	});

	it("passes through PATH from host", () => {
		const env = buildSandboxEnv("/workspace");
		expect(env.PATH).toBe(process.env.PATH);
	});

	it("provides sensible defaults for LANG and TERM", () => {
		const origLang = process.env.LANG;
		const origTerm = process.env.TERM;
		delete process.env.LANG;
		delete process.env.TERM;

		try {
			const env = buildSandboxEnv("/workspace");
			expect(env.LANG).toBe("en_US.UTF-8");
			expect(env.TERM).toBe("xterm-256color");
		} finally {
			if (origLang !== undefined) process.env.LANG = origLang;
			if (origTerm !== undefined) process.env.TERM = origTerm;
		}
	});
});
