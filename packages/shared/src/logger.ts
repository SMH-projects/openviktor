import pino from "pino";

const bsToken = process.env.BETTERSTACK_SOURCE_TOKEN;
const bsHost = process.env.BETTERSTACK_INGESTING_HOST || "s2301999.eu-fsn-3.betterstackdata.com";

const buffer: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flushToBetterStack() {
	if (!bsToken || buffer.length === 0) return;
	const batch = buffer.splice(0);
	timer = null;
	fetch(`https://${bsHost}`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${bsToken}` },
		body: `[${batch.join(",")}]`,
	}).catch(() => {});
}

function sendLog(level: string, name: string, obj: Record<string, unknown>, msg: string) {
	buffer.push(JSON.stringify({ ...obj, message: msg, level, name, dt: new Date().toISOString() }));
	if (!timer) timer = setTimeout(flushToBetterStack, 1000);
	if (buffer.length >= 50) flushToBetterStack();
}

export function createLogger(name: string, level = "info") {
	const log = pino({
		name,
		level,
		transport:
			process.env.NODE_ENV === "development"
				? { target: "pino-pretty", options: { colorize: true } }
				: undefined,
	});

	if (!bsToken || process.env.NODE_ENV === "development") return log;

	for (const method of ["trace", "debug", "info", "warn", "error", "fatal"] as const) {
		const orig = log[method].bind(log);
		// biome-ignore lint/suspicious/noExplicitAny: pino's LogFn overloads are complex
		(log as any)[method] = (...args: unknown[]) => {
			(orig as CallableFunction)(...args);
			const obj =
				typeof args[0] === "object" && args[0] !== null ? (args[0] as Record<string, unknown>) : {};
			const msg =
				typeof args[0] === "string" ? args[0] : typeof args[1] === "string" ? args[1] : "";
			sendLog(method, name, obj, msg);
		};
	}

	return log;
}

export const logger = createLogger("openviktor", process.env.LOG_LEVEL ?? "info");

export type Logger = pino.Logger;
