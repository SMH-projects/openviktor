import Image from "next/image";

function KnowledgeBaseVisual() {
	const items = [
		{ name: "Notion", count: "324 pages", dot: "#e11d48" },
		{ name: "Slack", count: "6 months", dot: "#4A154B" },
		{ name: "Google Drive", count: "89 files", dot: "#1a73e8" },
		{ name: "GitHub", count: "12 repos", dot: "#111" },
		{ name: "HubSpot", count: "1,847 contacts", dot: "#ff7a59" },
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
					Knowledge Base
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
				<span style={{ fontSize: 11, color: "#1e6a8a", fontWeight: 600 }}>
					Ready to work on day one.
				</span>
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
					#general
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
							<span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>M</span>
						</div>
						<div>
							<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
								<span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Maya</span>
								<span style={{ fontSize: 11, color: "#A8A49E" }}>9:03 AM</span>
							</div>
							<p
								style={{
									margin: "2px 0 0",
									fontSize: 13,
									color: "#1D1C1D",
									lineHeight: 1.5,
								}}
							>
								Can someone put together a deck on our Q3 performance for the board?
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
						<div
							style={{
								width: 28,
								height: 28,
								borderRadius: 6,
								background: "linear-gradient(135deg,#a78bfa,#ec4899)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
								outline: "2px solid #1e6a8a",
								outlineOffset: 1,
							}}
						>
							<span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>R</span>
						</div>
						<div>
							<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
								<span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Rin</span>
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
								<span style={{ fontSize: 11, color: "#A8A49E" }}>9:03 AM</span>
							</div>
							<p
								style={{
									margin: "2px 0 0",
									fontSize: 13,
									color: "#1D1C1D",
									lineHeight: 1.5,
								}}
							>
								On it — I&apos;ll have a draft ready in 10 minutes. I&apos;ll pull the numbers from
								HubSpot and the Oct board summary from Notion.
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
			source: "Slack #pricing",
			time: "3 months ago",
			snippet: "Decided to move to seat-based at $2k/mo",
		},
		{
			source: "Meeting",
			time: "Oct 12",
			snippet: "Maya's analysis showed 3x better retention",
		},
		{
			source: "Notion",
			time: "Sep 5",
			snippet: "Q3 pricing review doc",
		},
		{
			source: "Email",
			time: "Nov 3",
			snippet: "Confirmed rollout to all new accounts",
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
					pricing strategy
				</span>
			</div>
			{results.map((r, i) => (
				<div
					key={i}
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

function MeetingVisual() {
	return (
		<div
			style={{
				background: "#fff",
				border: "1px solid #E5E2DC",
				borderRadius: 14,
				overflow: "hidden",
				boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
				width: "100%",
				maxWidth: 380,
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 2,
					padding: 2,
					background: "#111",
				}}
			>
				{[
					{
						name: "Rin",
						initials: "R",
						grad: "linear-gradient(135deg,#a78bfa,#ec4899)",
						isAI: true,
					},
					{
						name: "Maya",
						initials: "M",
						grad: "linear-gradient(135deg,#818cf8,#6366f1)",
					},
					{
						name: "Liam",
						initials: "L",
						grad: "linear-gradient(135deg,#fb923c,#f59e0b)",
					},
					{
						name: "Alex",
						initials: "A",
						grad: "linear-gradient(135deg,#34d399,#059669)",
					},
				].map((p) => (
					<div
						key={p.name}
						style={{
							aspectRatio: "4/3",
							background: "#1a1a2e",
							borderRadius: 4,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							position: "relative",
						}}
					>
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: "50%",
								background: p.grad,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.initials}</span>
						</div>
						<span
							style={{
								color: "rgba(255,255,255,0.6)",
								fontSize: 10,
								marginTop: 4,
							}}
						>
							{p.name}
						</span>
						{p.isAI && (
							<span
								style={{
									position: "absolute",
									top: 5,
									left: 5,
									fontSize: 8,
									background: "#1e6a8a",
									color: "#fff",
									padding: "1px 4px",
									borderRadius: 3,
									fontWeight: 700,
								}}
							>
								AI
							</span>
						)}
					</div>
				))}
			</div>
			<div style={{ padding: "8px 10px", borderTop: "2px solid #1e6a8a" }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 5,
						marginBottom: 6,
					}}
				>
					<span
						style={{
							width: 6,
							height: 6,
							borderRadius: "50%",
							background: "#ef4444",
							display: "inline-block",
							animation: "blink-rec 1s ease-in-out infinite",
						}}
					/>
					<span
						style={{
							fontSize: 10,
							fontWeight: 700,
							color: "#111",
							letterSpacing: "0.05em",
						}}
					>
						Rin&apos;s Notes · Live
					</span>
				</div>
				{["Q4 target: $2M ARR", "Launch: March 15", "Action: Maya sends proposal to Acme"].map(
					(note, i) => (
						<div
							key={i}
							style={{
								display: "flex",
								gap: 5,
								alignItems: "flex-start",
								marginBottom: 3,
								animation: "msgAppear 8s ease infinite",
								animationDelay: `${i * 0.6}s`,
							}}
						>
							<span style={{ color: "#1e6a8a", fontSize: 11, marginTop: 1 }}>•</span>
							<span style={{ fontSize: 11, color: "#1D1C1D", lineHeight: 1.4 }}>{note}</span>
						</div>
					),
				)}
			</div>
		</div>
	);
}

const bentoItems = [
	{
		title: "Ready on day one.",
		desc: 'Viktor reads your documentation, Slack history, code, and meeting notes before they start. No two-week ramp. No "can you explain the context?"',
		bg: "/bg-feature-1.jpg",
		reversed: false,
		Visual: KnowledgeBaseVisual,
	},
	{
		title: "Acts before being asked.",
		desc: "Viktor doesn't wait for a prompt. They monitor what's happening, identify what matters, and surface it. A draft is already attached.",
		bg: "/bg-feature-2.jpg",
		reversed: true,
		Visual: SlackVisual,
	},
	{
		title: "Understands your organization.",
		desc: "Viktor remembers context from three months ago, decisions made in side channels, commitments others forgot. The kind of institutional memory that usually gets lost between handoffs, threads, and time zones.",
		bg: "/bg-feature-3.jpg",
		reversed: false,
		Visual: OrgMemoryVisual,
	},
	{
		title: "Joins your meetings.",
		desc: "Viktor attends calls, takes real-time notes, captures action items, and sends follow-ups. Without being asked. Without missing anything.",
		bg: "/bg-feature-4.jpg",
		reversed: true,
		Visual: MeetingVisual,
	},
];

export default function WhatViktorDoes() {
	return (
		<section className="py-12 md:py-24 px-6 border-t border-[#E5E2DC]">
			<div className="max-w-7xl mx-auto">
				<p className="text-[#A8A49E] text-xs tracking-widest uppercase mb-4">What Viktor does</p>
				<h2
					className="leading-[1.1] tracking-tight text-[#111] mb-8 md:mb-16 max-w-[1000px]"
					style={{
						fontFamily: "var(--font-instrument-serif),'Instrument Serif',Georgia,serif",
						fontWeight: 400,
						fontSize: "clamp(32px,4vw,52px)",
					}}
				>
					Everything a great hire does.
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
