import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import {
	type IntegrationApp,
	connectIntegration,
	disconnectIntegration,
	getIntegrations,
} from "../lib/api";

const PAGE_SIZE = 100;

export function IntegrationsPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [mutError, setMutError] = useState<string | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, error } =
		useInfiniteQuery({
			queryKey: ["integrations", debouncedSearch],
			queryFn: ({ pageParam }) =>
				getIntegrations({
					search: debouncedSearch || undefined,
					after: pageParam || undefined,
					limit: PAGE_SIZE,
				}),
			initialPageParam: "" as string,
			getNextPageParam: (lastPage) =>
				lastPage.hasMore && lastPage.endCursor ? lastPage.endCursor : undefined,
		});

	const connect = useMutation({
		mutationFn: (slug: string) => connectIntegration(slug),
		onSuccess: (result) => {
			window.open(result.connectUrl, "_blank");
		},
		onError: () => setMutError("Failed to connect integration"),
	});

	const disconnect = useMutation({
		mutationFn: (slug: string) => disconnectIntegration(slug),
		onSuccess: () => {
			setMutError(null);
			queryClient.invalidateQueries({ queryKey: ["integrations"] });
		},
		onError: () => setMutError("Failed to disconnect integration"),
	});

	const allApps: IntegrationApp[] = data?.pages.flatMap((p) => p.apps) ?? [];
	const connectedSlugs = new Set(data?.pages[0]?.connectedSlugs ?? []);
	const toolCounts = data?.pages[0]?.toolCounts ?? {};
	const connectedCount = connectedSlugs.size;

	// Deduplicate (connected apps appear on first page + may appear in later pages)
	const seen = new Set<string>();
	const apps = allApps.filter((a) => {
		if (seen.has(a.slug)) return false;
		seen.add(a.slug);
		return true;
	});

	// Sort: connected first
	const sorted = [...apps].sort((a, b) => {
		const aConn = connectedSlugs.has(a.slug) ? 0 : 1;
		const bConn = connectedSlugs.has(b.slug) ? 0 : 1;
		if (aConn !== bConn) return aConn - bConn;
		return a.name.localeCompare(b.name);
	});

	const loadMore = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) fetchNextPage();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{ rootMargin: "400px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [loadMore]);

	if (!data && !error) {
		return (
			<div className="space-y-6">
				<div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
				<div className="h-10 animate-pulse rounded-lg bg-slate-200" />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{["i1", "i2", "i3", "i4", "i5", "i6"].map((key) => (
						<div
							key={key}
							className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white"
						/>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		console.error("Failed to load integrations", error);
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				Failed to load integrations. Please try again.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
				{connectedCount > 0 && (
					<Badge className="bg-emerald-100 text-emerald-800">{connectedCount} connected</Badge>
				)}
			</div>

			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					placeholder="Search integrations..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
				/>
			</div>

			{mutError && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					{mutError}
				</div>
			)}

			<div className="flex items-center gap-2 text-xs text-slate-400">
				<span>
					{sorted.length} integrations{hasNextPage ? "+" : ""}
				</span>
				{isFetching && (
					<div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600" />
				)}
			</div>

			{sorted.length === 0 ? (
				<Card>
					<EmptyState
						message={search ? "No integrations match your search" : "No integrations available"}
					/>
				</Card>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{sorted.map((app) => {
							const connected = connectedSlugs.has(app.slug);
							const toolCount = toolCounts[app.slug] ?? 0;
							return (
								<Card key={app.slug} className={connected ? "ring-1 ring-emerald-200" : undefined}>
									<div className="flex items-start gap-3">
										{app.imgSrc ? (
											<img src={app.imgSrc} alt={app.name} className="h-10 w-10 rounded-lg" />
										) : (
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-400">
												{app.name.charAt(0).toUpperCase()}
											</div>
										)}
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<h3 className="truncate text-sm font-semibold text-slate-900">
													{app.name}
												</h3>
												{connected && (
													<Badge className="shrink-0 bg-emerald-100 text-emerald-800">
														Connected
													</Badge>
												)}
											</div>
											{app.description && (
												<p className="mt-1 line-clamp-2 text-xs text-slate-500">
													{app.description}
												</p>
											)}
											<div className="mt-1 flex items-center gap-2">
												{toolCount > 0 && (
													<span className="text-xs text-slate-400">{toolCount} tools</span>
												)}
												{app.categories.length > 0 && (
													<span className="text-xs text-slate-400">
														{app.categories.slice(0, 2).join(", ")}
													</span>
												)}
											</div>
										</div>
									</div>
									<div className="mt-4">
										{connected ? (
											<button
												type="button"
												onClick={() => disconnect.mutate(app.slug)}
												disabled={disconnect.isPending}
												className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
											>
												Disconnect
											</button>
										) : (
											<button
												type="button"
												onClick={() => connect.mutate(app.slug)}
												disabled={connect.isPending}
												className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
											>
												Connect
											</button>
										)}
									</div>
								</Card>
							);
						})}
					</div>
					{hasNextPage && (
						<div ref={sentinelRef} className="flex justify-center py-4">
							{isFetchingNextPage && (
								<div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600" />
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}
