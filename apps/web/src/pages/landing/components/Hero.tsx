import { useState } from "react";

function generateCloudCols(count: number) {
	const cols: { chars: string[]; opacity: number }[] = [];
	let seed = 42;
	const rand = () => {
		seed = (seed * 1664525 + 1013904223) & 0xffffffff;
		return (seed >>> 0) / 0xffffffff;
	};
	for (let i = 0; i < count; i++) {
		const rows = 28;
		const OS = "open source. ";
		const offset = (i * 3) % OS.length;
		const chars: string[] = [];
		for (let j = 0; j < rows; j++) chars.push(OS[(offset + j) % OS.length]);
		cols.push({ chars, opacity: 0.18 + (i % 5) * 0.12 });
	}
	void rand;
	return cols;
}

const leftCols = generateCloudCols(24);
const rightCols = generateCloudCols(24);

function CloudCols({ cols }: { cols: ReturnType<typeof generateCloudCols> }) {
	return (
		<div className="hero-cloud-scroll">
			<div style={{ display: "flex" }}>
				{[
					...cols.map((col, i) => ({ col, id: `a-${i}` })),
					...cols.map((col, i) => ({ col, id: `b-${i}` })),
				].map(({ col, id }) => (
					<span
						key={id}
						className="hero-cloud-col"
						style={{
							fontFamily: "monospace",
							fontSize: 11,
							lineHeight: 1.55,
							color: "#5bbcd6",
							opacity: col.opacity,
							width: 14,
							display: "inline-block",
							textAlign: "center",
							whiteSpace: "pre",
						}}
					>
						{col.chars.join("\n")}
					</span>
				))}
			</div>
		</div>
	);
}

const tabs = [
	{
		key: "identity",
		label: "Hire in 60 Seconds",
		desc: "Gets its own identity, joins your tools, and starts working",
	},
	{
		key: "memory",
		label: "Org Memory",
		desc: "Remembers your team's context",
	},
	{
		key: "driven",
		label: "Self-Driven",
		desc: "Finds work and acts on its own",
	},
];

function IdentityPanel() {
	return (
		<div
			className="hero-panel"
			style={{
				border: "1px solid #E5E2DC",
				borderRadius: 12,
				overflow: "hidden",
				boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
				background: "#fff",
				fontFamily: "-apple-system,'Helvetica Neue',sans-serif",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				style={{
					background: "#F5F5F5",
					borderBottom: "1px solid #E8E8E8",
					padding: "9px 14px",
					display: "flex",
					alignItems: "center",
					gap: 10,
					flexShrink: 0,
				}}
			>
				<div style={{ display: "flex", gap: 5 }}>
					<span
						style={{
							width: 11,
							height: 11,
							borderRadius: "50%",
							background: "#FF5F56",
							display: "inline-block",
						}}
					/>
					<span
						style={{
							width: 11,
							height: 11,
							borderRadius: "50%",
							background: "#FFBD2E",
							display: "inline-block",
						}}
					/>
					<span
						style={{
							width: 11,
							height: 11,
							borderRadius: "50%",
							background: "#27C93F",
							display: "inline-block",
						}}
					/>
				</div>
				<span
					style={{
						flex: 1,
						textAlign: "center",
						fontSize: 11.5,
						color: "#8C8C8C",
						fontWeight: 500,
						marginRight: 44,
					}}
				>
					Mail · OpenViktor
				</span>
			</div>

			<div
				style={{
					padding: "9px 16px 14px",
					borderBottom: "1px solid #EBEBEB",
					flexShrink: 0,
					animation: "msgIn 0.45s ease both",
					animationDelay: "0.2s",
				}}
			>
				<div
					style={{
						fontSize: 15,
						fontWeight: 600,
						color: "#1D1C1D",
						marginBottom: 12,
					}}
				>
					Your Q2 growth goals. Worth a quick chat?
				</div>
				<div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
					<img
						src="/openviktor.png"
						alt="OpenViktor"
						style={{
							width: 36,
							height: 36,
							borderRadius: "50%",
							objectFit: "cover",
							flexShrink: 0,
							background: "#fff",
						}}
					/>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								display: "flex",
								alignItems: "baseline",
								gap: 6,
								flexWrap: "wrap",
							}}
						>
							<span style={{ fontSize: 13.5, fontWeight: 600, color: "#1D1C1D" }}>OpenViktor</span>
							<span style={{ fontSize: 12, color: "#A8A49E" }}>&lt;openviktor@soofte.com&gt;</span>
							<span style={{ fontSize: 11, color: "#A8A49E", marginLeft: "auto" }}>
								Today, 8:47 AM
							</span>
						</div>
						<div style={{ fontSize: 12, color: "#A8A49E", marginTop: 2 }}>
							To: david@brightcorp.com
						</div>
					</div>
				</div>
			</div>

			<div
				style={{
					padding: "14px 16px 10px",
					flex: 1,
					fontSize: 13.5,
					color: "#1D1C1D",
					lineHeight: 1.75,
				}}
			>
				{[
					{ delay: "0.6s", content: "Hi David," },
					{
						delay: "0.9s",
						content:
							"I noticed BrightCorp posted 4 ops and SDR roles this month. Congrats on the growth.",
					},
					{
						delay: "1.3s",
						content: (
							<span key="b">
								We help scaling teams replace that hiring with AI employees that start on day one.
								Based on your stack, I put together a quick breakdown of where we could free up{" "}
								<strong>~20 hrs/week</strong> before Q2 ends.
							</span>
						),
					},
					{
						delay: "1.8s",
						content: "Worth a 15-minute call? I have Thursday 2pm or Friday morning open.",
					},
				].map((p) => (
					<p
						key={p.delay}
						style={{
							margin: "0 0 10px",
							animation: "msgIn 0.45s ease both",
							animationDelay: p.delay,
						}}
					>
						{p.content}
					</p>
				))}
				<div
					style={{
						borderTop: "1px solid #EBEBEB",
						paddingTop: 12,
						fontSize: 12,
						animation: "msgIn 0.45s ease both",
						animationDelay: "2.3s",
					}}
				>
					<div style={{ fontWeight: 600, color: "#1D1C1D" }}>OpenViktor</div>
					<div style={{ color: "#A8A49E" }}>AI Employee · OpenViktor</div>
					<div style={{ color: "#1e6a8a" }}>openviktor@soofte.com</div>
				</div>
			</div>
			<div
				style={{
					padding: "10px 16px",
					borderTop: "1px solid #EBEBEB",
					flexShrink: 0,
					animation: "msgIn 0.45s ease both",
					animationDelay: "2.8s",
				}}
			>
				<div
					style={{
						border: "1px solid #E5E2DC",
						borderRadius: 8,
						padding: "9px 12px",
						display: "flex",
						alignItems: "center",
						gap: 8,
						background: "#FAFAF8",
					}}
				>
					<span style={{ fontSize: 12.5, color: "#C8C4BD", flex: 1 }}>Reply to David…</span>
					<div style={{ display: "flex", gap: 6 }}>
						<span
							style={{
								fontSize: 11,
								color: "#6B6863",
								background: "#F0EDE8",
								borderRadius: 6,
								padding: "3px 9px",
								cursor: "pointer",
							}}
						>
							Forward
						</span>
						<span
							style={{
								fontSize: 11,
								color: "#fff",
								background: "#1e6a8a",
								borderRadius: 6,
								padding: "3px 9px",
								cursor: "pointer",
							}}
						>
							Reply
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function MemoryPanel() {
	const results = [
		{
			source: "Slack #pricing",
			time: "3 months ago",
			snippet: "Decided to move to seat-based at $2k/mo",
		},
		{
			source: "Meeting notes",
			time: "Oct 12",
			snippet: "Maya's analysis showed 3x better retention",
		},
		{
			source: "Notion",
			time: "Sep 5",
			snippet: "Q3 pricing review doc — full breakdown",
		},
		{
			source: "Email thread",
			time: "Nov 3",
			snippet: "Confirmed rollout to all new accounts",
		},
		{
			source: "Slack #growth",
			time: "2 months ago",
			snippet: "Enterprise tier added following board feedback",
		},
		{
			source: "Notion",
			time: "Dec 1",
			snippet: "2026 pricing roadmap — stakeholder draft v2",
		},
	];
	return (
		<div
			className="hero-panel"
			style={{
				background: "#fff",
				border: "1px solid #E5E2DC",
				borderRadius: 12,
				overflow: "hidden",
				boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				style={{
					background: "#F5F5F5",
					borderBottom: "1px solid #E8E8E8",
					padding: "9px 14px",
					display: "flex",
					alignItems: "center",
					gap: 10,
					flexShrink: 0,
				}}
			>
				<div style={{ display: "flex", gap: 5 }}>
					{["#FF5F56", "#FFBD2E", "#27C93F"].map((c) => (
						<span
							key={c}
							style={{
								width: 11,
								height: 11,
								borderRadius: "50%",
								background: c,
								display: "inline-block",
							}}
						/>
					))}
				</div>
				<span
					style={{
						flex: 1,
						textAlign: "center",
						fontSize: 11.5,
						color: "#8C8C8C",
						fontWeight: 500,
						marginRight: 44,
					}}
				>
					Org Memory
				</span>
			</div>
			<div
				style={{
					padding: "10px 14px",
					borderBottom: "1px solid #E5E2DC",
					display: "flex",
					alignItems: "center",
					gap: 8,
					background: "#fff",
				}}
			>
				<svg width={14} height={14} viewBox="0 0 14 14" fill="none">
					<title>Search</title>
					<circle cx="6" cy="6" r="4" stroke="#A8A49E" strokeWidth="1.3" />
					<path d="M9.5 9.5l2.5 2.5" stroke="#A8A49E" strokeWidth="1.3" strokeLinecap="round" />
				</svg>
				<span style={{ fontSize: 12, color: "#111", fontWeight: 500 }}>pricing strategy</span>
				<span style={{ marginLeft: "auto", fontSize: 10, color: "#A8A49E" }}>4 results</span>
			</div>
			<div style={{ flex: 1, overflowY: "auto" }}>
				{results.map((r, i) => (
					<div
						key={`${r.source}-${r.time}`}
						style={{
							padding: "13px 14px",
							borderBottom: "1px solid #F5F3EF",
							animation: "memRowAppear 7s ease infinite",
							animationDelay: `${i * 0.35}s`,
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: 3,
							}}
						>
							<span style={{ fontSize: 11, fontWeight: 600, color: "#1e6a8a" }}>{r.source}</span>
							<span style={{ fontSize: 10, color: "#A8A49E" }}>{r.time}</span>
						</div>
						<p
							style={{
								margin: 0,
								fontSize: 12.5,
								color: "#1D1C1D",
								lineHeight: 1.5,
							}}
						>
							{r.snippet}
						</p>
					</div>
				))}
			</div>
			<div
				style={{
					padding: "8px 14px",
					background: "#e8f5f8",
					display: "flex",
					alignItems: "center",
					gap: 6,
					flexShrink: 0,
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
					Searching across Slack, Notion, email, and meetings.
				</span>
			</div>
		</div>
	);
}

function SelfDrivenPanel() {
	const tasks = [
		{ label: "Draft Q2 board update", status: "Done", done: true, active: false },
		{ label: "Summarize last week's standups", status: "Done", done: true, active: false },
		{
			label: "Follow up with Acme contract",
			status: "In progress",
			done: false,
			active: true,
		},
		{
			label: "Flag overdue invoices from HubSpot",
			status: "Queued",
			done: false,
			active: false,
		},
		{
			label: "Prepare competitor analysis",
			status: "Queued",
			done: false,
			active: false,
		},
		{
			label: "Draft onboarding doc for new hire",
			status: "Queued",
			done: false,
			active: false,
		},
	];
	return (
		<div
			className="hero-panel"
			style={{
				background: "#fff",
				border: "1px solid #E5E2DC",
				borderRadius: 12,
				overflow: "hidden",
				boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				style={{
					background: "#F5F5F5",
					borderBottom: "1px solid #E8E8E8",
					padding: "9px 14px",
					display: "flex",
					alignItems: "center",
					gap: 10,
					flexShrink: 0,
				}}
			>
				<div style={{ display: "flex", gap: 5 }}>
					{["#FF5F56", "#FFBD2E", "#27C93F"].map((c) => (
						<span
							key={c}
							style={{
								width: 11,
								height: 11,
								borderRadius: "50%",
								background: c,
								display: "inline-block",
							}}
						/>
					))}
				</div>
				<span
					style={{
						flex: 1,
						textAlign: "center",
						fontSize: 11.5,
						color: "#8C8C8C",
						fontWeight: 500,
						marginRight: 44,
					}}
				>
					OpenViktor Task Queue
				</span>
			</div>
			<div
				style={{
					padding: "12px 14px",
					borderBottom: "1px solid #E5E2DC",
					display: "flex",
					alignItems: "center",
					gap: 10,
					flexShrink: 0,
				}}
			>
				<img
					src="/openviktor.png"
					alt="OpenViktor"
					style={{
						width: 32,
						height: 32,
						borderRadius: "50%",
						objectFit: "cover",
						background: "#fff",
					}}
				/>
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
						<span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>OpenViktor</span>
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
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							marginTop: 1,
						}}
					>
						<span
							style={{
								width: 5,
								height: 5,
								borderRadius: "50%",
								background: "#22c55e",
								display: "inline-block",
								animation: "pulse-dot 1.5s ease-in-out infinite",
							}}
						/>
						<span style={{ fontSize: 10, color: "#6B6863" }}>Active now</span>
					</div>
				</div>
				<div style={{ marginLeft: "auto", fontSize: 10, color: "#A8A49E" }}>Self-assigned</div>
			</div>
			<div style={{ flex: 1 }}>
				{tasks.map((t, i) => (
					<div
						key={t.label}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: "12px 14px",
							borderBottom: "1px solid #F5F3EF",
							animation: "msgIn 0.4s ease both",
							animationDelay: `${0.3 + i * 0.15}s`,
						}}
					>
						<span
							style={{
								width: 14,
								height: 14,
								borderRadius: "50%",
								flexShrink: 0,
								background: t.done ? "#1e6a8a" : t.active ? "#e8f5f8" : "transparent",
								border: t.done ? "none" : t.active ? "2px solid #1e6a8a" : "1.5px solid #E5E2DC",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{t.done && (
								<svg width={8} height={8} viewBox="0 0 8 8" fill="none">
									<title>Done</title>
									<path
										d="M1.5 4l2 2 3-3"
										stroke="#fff"
										strokeWidth="1.4"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							)}
						</span>
						<span
							style={{
								flex: 1,
								fontSize: 12.5,
								color: t.done ? "#A8A49E" : "#111",
								textDecoration: t.done ? "line-through" : "none",
							}}
						>
							{t.label}
						</span>
						<span
							style={{
								fontSize: 10,
								color: t.done ? "#A8A49E" : t.active ? "#1e6a8a" : "#C8C4BD",
								fontWeight: t.active ? 600 : 400,
							}}
						>
							{t.status}
						</span>
					</div>
				))}
			</div>
			<div
				style={{
					padding: "8px 14px",
					background: "#e8f5f8",
					display: "flex",
					alignItems: "center",
					gap: 6,
					flexShrink: 0,
				}}
			>
				<span
					style={{
						width: 6,
						height: 6,
						borderRadius: "50%",
						background: "#22c55e",
						display: "inline-block",
						animation: "pulse-dot 1.5s ease-in-out infinite",
					}}
				/>
				<span style={{ fontSize: 11, color: "#1e6a8a", fontWeight: 600 }}>
					3 tasks found without being asked.
				</span>
			</div>
		</div>
	);
}

export default function Hero() {
	const [activeTab, setActiveTab] = useState(0);

	return (
		<section
			className="min-h-screen pt-24 md:pt-36 pb-16 px-6 relative overflow-hidden"
			style={{ background: "#e5f4f8" }}
		>
			<style>{`
        @media (max-width: 767px) {
          .hero-cloud-right { display: none !important; }
          .hero-cloud-left  { height: 160px !important; }
          .hero-cloud-col:nth-child(n+13) { display: none !important; }
          .hero-panel-inner {
            position: absolute;
            top: 0;
            left: -16.67%;
            width: 133.33%;
            transform: scale(0.75);
            transform-origin: top center;
          }
        }
        .hero-panel { height: 100%; }
      `}</style>

			<div
				className="hero-cloud hero-cloud-left"
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					height: 442,
					overflow: "hidden",
					pointerEvents: "none",
					zIndex: 0,
					userSelect: "none",
					WebkitMaskImage:
						"linear-gradient(to bottom right, black 0%, rgba(0,0,0,0.5) 40%, transparent 72%)",
					maskImage:
						"linear-gradient(to bottom right, black 0%, rgba(0,0,0,0.5) 40%, transparent 72%)",
				}}
			>
				<CloudCols cols={leftCols} />
			</div>

			<div
				className="hero-cloud hero-cloud-right"
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					height: 442,
					overflow: "hidden",
					pointerEvents: "none",
					zIndex: 0,
					userSelect: "none",
					WebkitMaskImage:
						"linear-gradient(to bottom left, black 0%, rgba(0,0,0,0.5) 40%, transparent 72%)",
					maskImage:
						"linear-gradient(to bottom left, black 0%, rgba(0,0,0,0.5) 40%, transparent 72%)",
				}}
			>
				<CloudCols cols={rightCols} />
			</div>

			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "50%",
					pointerEvents: "none",
					zIndex: 0,
				}}
			>
				<img
					src="/images/hero-bg.png"
					alt=""
					aria-hidden
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "top center",
					}}
				/>
			</div>

			<div className="max-w-7xl mx-auto" style={{ position: "relative", zIndex: 1 }}>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-20 items-stretch">
					<div>
						<a
							href="https://github.com/zggf-zggf/openviktor/"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-6 hover:border-[#1e6a8a] hover:text-[#1e6a8a] transition-colors"
							style={{
								borderColor: "#d6eaef",
								color: "#6B6863",
								background: "#fff",
							}}
						>
							<svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
								<title>GitHub</title>
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
							</svg>
							Open source · Free forever
						</a>

						<h1
							className="leading-[1.0] tracking-tight text-[#111] mb-7"
							style={{
								fontFamily: "var(--font-instrument-serif), 'Instrument Serif', Georgia, serif",
								fontWeight: 400,
								fontSize: "clamp(36px, 5vw, 58px)",
							}}
						>
							Hire your AI employee.
							<br />
							For any role.
						</h1>

						<a
							href="/hire"
							className="inline-flex items-center px-8 py-3.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity mb-3 md:mb-9"
							style={{ background: "#111", color: "#fff" }}
						>
							Hire Now
						</a>

						<div className="hidden md:block border border-[#E5E2DC] rounded-2xl overflow-hidden">
							{tabs.map((tab, i) => (
								<button
									type="button"
									key={tab.key}
									onClick={() => setActiveTab(i)}
									className={`w-full px-5 py-4 cursor-pointer transition-colors text-left ${
										i < tabs.length - 1 ? "border-b border-[#E5E2DC]" : ""
									} ${activeTab === i ? "bg-[#F7F7F5]" : "bg-white hover:bg-[#FAFAF8]"}`}
								>
									<div className="flex items-center gap-3">
										<span
											className="text-xs leading-none"
											style={{
												color: activeTab === i ? "#1e6a8a" : "#C8C4BD",
											}}
										>
											{activeTab === i ? "●" : "○"}
										</span>
										<span
											className="text-sm font-medium"
											style={{
												color: activeTab === i ? "#111" : "#6B6863",
											}}
										>
											{tab.label}
										</span>
									</div>
									<p className="mt-1.5 ml-[21px] text-sm text-[#6B6863] leading-relaxed">
										{tab.desc}
									</p>
								</button>
							))}
						</div>
					</div>

					<div className="w-full relative h-[360px] md:h-full">
						<div
							style={{
								position: "absolute",
								top: "50%",
								left: "50%",
								transform: "translate(-50%, -50%)",
								width: 480,
								height: 480,
								borderRadius: "50%",
								background: "rgba(77,168,181,0.18)",
								filter: "blur(70px)",
								pointerEvents: "none",
								zIndex: 0,
							}}
						/>
						<div
							className="absolute inset-0 md:relative md:inset-auto overflow-hidden md:overflow-visible md:h-full"
							style={{ zIndex: 1 }}
						>
							<div className="hero-panel-inner w-full h-full">
								{activeTab === 0 && <IdentityPanel />}
								{activeTab === 1 && <MemoryPanel />}
								{activeTab === 2 && <SelfDrivenPanel />}
							</div>
						</div>
					</div>
				</div>

				<div className="flex gap-2 mt-5 md:hidden">
					{tabs.map((tab, i) => (
						<button
							type="button"
							key={tab.key}
							onClick={() => setActiveTab(i)}
							className="flex-1 py-2 rounded-full text-xs font-medium transition-colors border"
							style={{
								background: activeTab === i ? "#1e6a8a" : "#fff",
								color: activeTab === i ? "#fff" : "#6B6863",
								borderColor: activeTab === i ? "#1e6a8a" : "#E5E2DC",
							}}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>
		</section>
	);
}
