function KnowledgeBaseVisual() {
	const items = [
		{ name: "Linear", count: "312 tickets", dot: "#5e6ad2" },
		{ name: "Slack", count: "4 months", dot: "#4A154B" },
		{ name: "Notion", count: "61 pages", dot: "#e11d48" },
		{ name: "GitHub", count: "5 repos", dot: "#111" },
		{ name: "Stripe", count: "1,204 events", dot: "#635bff" },
	];
	return (
		<div
			style={{
				background: "#fff",
				border: "1px solid #E5E2DC",
				borderRadius: 14,
				overflow: "hidden",
				boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
				width: "100%",
				maxWidth: 360,
			}}
		>
			<div style={{ padding: "12px 14px", borderBottom: "1px solid #E5E2DC" }}>
				<div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
					{["#FF5F56", "#FFBD2E", "#27C93F"].map((c) => (
						<span
							key={c}
							style={{
								width: 10,
								height: 10,
								borderRadius: "50%",
								background: c,
								display: "inline-block",
							}}
						/>
					))}
				</div>
				<div
					style={{
						fontSize: 11,
						color: "#A8A49E",
						letterSpacing: "0.08em",
						textTransform: "uppercase",
					}}
				>
					Workspace ingested
				</div>
			</div>
			{items.map((item) => (
				<div
					key={item.name}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "9px 14px",
						borderBottom: "1px solid #F5F3EF",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<span
							style={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								background: item.dot,
								display: "inline-block",
							}}
						/>
						<span style={{ fontSize: 13, color: "#111", fontWeight: 500 }}>{item.name}</span>
					</div>
					<span style={{ fontSize: 12, color: "#A8A49E" }}>{item.count}</span>
				</div>
			))}
			<div
				style={{
					padding: "10px 14px",
					background: "#e8f5f8",
					display: "flex",
					alignItems: "center",
					gap: 6,
				}}
			>
				<span
					style={{
						width: 6,
						height: 6,
						borderRadius: "50%",
						background: "#1e6a8a",
						display: "inline-block",
					}}
				/>
				<span style={{ fontSize: 11, color: "#1e6a8a", fontWeight: 600 }}>Online. Ready.</span>
			</div>
		</div>
	);
}

function SlackVisual() {
	return (
		<div
			style={{
				background: "#fff",
				border: "1px solid #E5E2DC",
				borderRadius: 14,
				overflow: "hidden",
				boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
				width: "100%",
				maxWidth: 360,
			}}
		>
			<div
				style={{
					background: "#1D0F2E",
					padding: "8px 12px",
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<div
					style={{
						width: 10,
						height: 10,
						borderRadius: "50%",
						background: "#fff",
						opacity: 0.15,
					}}
				/>
				<span
					style={{
						color: "rgba(255,255,255,0.7)",
						fontSize: 12,
						fontWeight: 600,
					}}
				>
					#engineering
				</span>
			</div>
			<div
				style={{
					padding: "10px 12px",
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				<div>
					<div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
						<div
							style={{
								width: 28,
								height: 28,
								borderRadius: 6,
								background: "linear-gradient(135deg,#818cf8,#6366f1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>A</span>
						</div>
						<div>
							<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
								<span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Alex</span>
								<span style={{ fontSize: 11, color: "#A8A49E" }}>8:51 AM</span>
							</div>
							<p
								style={{
									margin: "2px 0 0",
									fontSize: 13,
									color: "#1D1C1D",
									lineHeight: 1.5,
								}}
							>
								Anyone know why the Stripe webhooks failed last night?
							</p>
						</div>
					</div>
				</div>
				<div
					style={{
						animation: "msgAppear 6s ease infinite",
						animationDelay: "0.5s",
					}}
				>
					<div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
						<img
							src="/openviktor.png"
							alt="OpenViktor"
							style={{
								width: 28,
								height: 28,
								borderRadius: 6,
								objectFit: "cover",
								flexShrink: 0,
								background: "#fff",
							}}
						/>
						<div>
							<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
								<span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>OpenViktor</span>
								<span
									style={{
										fontSize: 9,
										background: "#1e6a8a",
										color: "#fff",
										padding: "1px 5px",
										borderRadius: 3,
										fontWeight: 700,
									}}
								>
									AI
								</span>
								<span style={{ fontSize: 11, color: "#A8A49E" }}>8:51 AM</span>
							</div>
							<p
								style={{
									margin: "2px 0 0",
									fontSize: 13,
									color: "#1D1C1D",
									lineHeight: 1.5,
								}}
							>
								3 failures, same customer ID. Timeout on retry #2. Filed a bug in Linear and flagged
								the billing team.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function OrgMemoryVisual() {
	const results = [
		{
			source: "Slack #product",
			time: "2 months ago",
			snippet: "Agreed to push launch to April 7th",
		},
		{
			source: "Meeting notes",
			time: "Jan 18",
			snippet: "Stakeholder sign-off needed before dev freeze",
		},
		{
			source: "Notion",
			time: "Feb 2",
			snippet: "Go-to-market doc — draft v3",
		},
		{
			source: "Email",
			time: "Mar 2",
			snippet: "Legal cleared the T&Cs, ready to ship",
		},
	];
	return (
		<div
			style={{
				background: "#fff",
				border: "1px solid #E5E2DC",
				borderRadius: 14,
				overflow: "hidden",
				boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
				width: "100%",
				maxWidth: 360,
			}}
		>
			<div
				style={{
					padding: "10px 12px",
					borderBottom: "1px solid #E5E2DC",
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<svg width={14} height={14} viewBox="0 0 14 14" fill="none">
					<title>Search</title>
					<circle cx="6" cy="6" r="4" stroke="#A8A49E" strokeWidth="1.3" />
					<path d="M9.5 9.5l2.5 2.5" stroke="#A8A49E" strokeWidth="1.3" strokeLinecap="round" />
				</svg>
				<span style={{ fontSize: 12, color: "#A8A49E" }}>Search org memory…</span>
				<span
					style={{
						marginLeft: "auto",
						fontSize: 11,
						color: "#1e6a8a",
						fontWeight: 600,
					}}
				>
					launch timeline
				</span>
			</div>
			{results.map((r, i) => (
				<div
					key={r.source}
					style={{
						padding: "8px 12px",
						borderBottom: "1px solid #F5F3EF",
						animation: "memRowAppear 7s ease infinite",
						animationDelay: `${i * 0.3}s`,
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginBottom: 2,
						}}
					>
						<span style={{ fontSize: 11, fontWeight: 600, color: "#1e6a8a" }}>{r.source}</span>
						<span style={{ fontSize: 10, color: "#A8A49E" }}>{r.time}</span>
					</div>
					<p
						style={{
							margin: 0,
							fontSize: 12,
							color: "#6B6863",
							lineHeight: 1.4,
						}}
					>
						{r.snippet}
					</p>
				</div>
			))}
		</div>
	);
}

const bentoItems = [
	{
		title: "No onboarding needed.",
		desc: "Reads your docs, Slack history, code, and notes before its first day. Shows up knowing the context. No hand-holding.",
		bg: "/222.png",
		reversed: false,
		Visual: KnowledgeBaseVisual,
	},
	{
		title: "Moves without being asked.",
		desc: "Doesn't wait for a prompt. Monitors what's happening, spots what needs doing, and ships it. Draft already attached.",
		bg: "/333.png",
		reversed: true,
		Visual: SlackVisual,
	},
	{
		title: "Remembers everything.",
		desc: "That pricing call three months ago. The side-channel decision nobody wrote down. The commitment buried in a thread. It keeps it all — and uses it.",
		bg: "/444.png",
		reversed: false,
		Visual: OrgMemoryVisual,
	},
];

export default function WhatViktorDoes() {
	return (
		<section className="py-12 md:py-24 px-6 border-t border-[#E5E2DC]">
			<div className="max-w-7xl mx-auto">
				<p className="text-[#A8A49E] text-xs tracking-widest uppercase mb-4">What it does</p>
				<h2
					className="leading-[1.1] tracking-tight text-[#111] mb-8 md:mb-16 max-w-[1000px]"
					style={{
						fontFamily: "var(--font-instrument-serif),'Instrument Serif',Georgia,serif",
						fontWeight: 400,
						fontSize: "clamp(32px,4vw,52px)",
					}}
				>
					Does the work.
					<br />
					Every day.
				</h2>

				<div className="space-y-4">
					{bentoItems.map((item) => {
						const textCol = (
							<div className="p-6 md:p-10 flex flex-col justify-center">
								<h3
									className="text-[#111] leading-snug mb-4"
									style={{
										fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
										fontWeight: 600,
										fontSize: "clamp(22px,2.5vw,32px)",
									}}
								>
									{item.title}
								</h3>
								<p className="text-[#6B6863] text-base leading-relaxed">{item.desc}</p>
							</div>
						);

						const imageCol = (
							<div className="min-h-[300px] md:min-h-[380px] relative flex items-center justify-center p-6 md:p-10 overflow-hidden">
								<div
									className="absolute inset-0 bg-cover bg-center"
									style={{ backgroundImage: `url(${item.bg})` }}
								/>
								<div className="relative z-10 w-full flex justify-center">
									<item.Visual />
								</div>
							</div>
						);

						return (
							<div
								key={item.title}
								className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
							>
								{item.reversed ? (
									<>
										<div className="md:order-2">{textCol}</div>
										<div className="md:order-1">{imageCol}</div>
									</>
								) : (
									<>
										{textCol}
										{imageCol}
									</>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
