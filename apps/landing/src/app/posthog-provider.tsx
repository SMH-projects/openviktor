"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
		capture_pageview: false, // we capture manually below
		capture_pageleave: true,
	});
}

function PostHogPageView() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const ph = usePostHog();

	useEffect(() => {
		if (pathname && ph) {
			let url = window.origin + pathname;
			if (searchParams.toString()) {
				url = `${url}?${searchParams.toString()}`;
			}
			ph.capture("$pageview", { $current_url: url });
		}
	}, [pathname, searchParams, ph]);

	return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
		return <>{children}</>;
	}

	return (
		<PHProvider client={posthog}>
			<Suspense fallback={null}>
				<PostHogPageView />
			</Suspense>
			{children}
		</PHProvider>
	);
}
