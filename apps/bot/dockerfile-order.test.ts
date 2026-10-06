import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("runner installs OS tools after dependency installation", () => {
	const dockerfile = readFileSync(new URL("./Dockerfile", import.meta.url), "utf8");
	const runner = dockerfile.split("FROM base AS runner\n")[1];
	const dependencies = runner.indexOf("COPY --from=deps /app/node_modules ./node_modules");
	const osTools = runner.indexOf('RUN if [ "$INSTALL_OS_TOOLS" = "true" ]; then');

	expect(dependencies).toBeGreaterThanOrEqual(0);
	expect(osTools).toBeGreaterThan(dependencies);
});
