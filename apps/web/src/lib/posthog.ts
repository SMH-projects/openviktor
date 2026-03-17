import posthog from "posthog-js";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const posthogHost = (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com";

export function initPostHog() {
	if (!posthogKey) return;

	posthog.init(posthogKey, {
		api_host: posthogHost,
		capture_pageview: false, // we capture manually on route change
		capture_pageleave: true,
	});
}

export function capturePageView(url: string) {
	if (!posthogKey) return;
	posthog.capture("$pageview", { $current_url: url });
}

export { posthog };
