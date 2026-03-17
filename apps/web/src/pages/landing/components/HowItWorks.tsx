const steps = [
	{
		num: "01",
		title: "Plug in your stack",
		desc: "Connect Slack, email, Notion, GitHub — whatever you run on. Real access, not a sandbox.",
		footer: "Done in under 2 minutes",
		visual: (
			<div
				style={{
					background: "rgba(255,255,255,0.05)",
					border: "1px solid rgba(255,255,255,0.10)",
					borderRadius: 12,
					padding: "11px 13px 13px",
					marginBottom: 20,
					fontSize: 12,
				}}
			>
				<div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
					<span
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: "rgba(255,255,255,0.2)",
							display: "inline-block",
						}}
					/>
					<span
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: "rgba(255,255,255,0.2)",
							display: "inline-block",
						}}
					/>
					<span
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							background: "rgba(255,255,255,0.2)",
							display: "inline-block",
						}}
					/>
				</div>
				<div
					style={{
						color: "rgba(255,255,255,0.4)",
						fontSize: 10,
						marginBottom: 8,
						letterSpacing: "0.1em",
						textTransform: "uppercase",
					}}
				>
					Workspace
				</div>
				{[
					{ name: "Slack", status: "Connected", dot: "#22c55e" },
					{ name: "Gmail", status: "Connected", dot: "#22c55e" },
					{ name: "Notion", status: "Connecting…", dot: "#f59e0b" },
					{ name: "GitHub", status: "—", dot: "rgba(255,255,255,0.2)" },
				].map((tool) => (
					<div
						key={tool.name}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "6px 0",
							borderBottom: "1px solid rgba(255,255,255,0.06)",
						}}
					>
						<span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{tool.name}</span>
						<span
							style={{
								display: "flex",
								alignItems: "center",
								gap: 5,
								fontSize: 11,
								color: "rgba(255,255,255,0.4)",
							}}
						>
							<span
								style={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									background: tool.dot,
									display: "inline-block",
								}}
							/>
							{tool.status}
						</span>
					</div>
				))}
			</div>
		),
	},
	{
		num: "02",
		title: "It reads everything",
		desc: "Docs, Slack history, meeting notes, code — all of it. Day one, it already knows your team, your context, your priorities.",
		footer: "Full org context, day one",
		visual: (
			<div
				style={{
					background: "rgba(255,255,255,0.05)",
					border: "1px solid rgba(255,255,255,0.10)",
					borderRadius: 12,
					padding: "11px 13px 13px",
					marginBottom: 20,
					fontSize: 12,
				}}
			>
				<div
					style={{
						color: "rgba(255,255,255,0.4)",
						fontSize: 10,
						marginBottom: 10,
						letterSpacing: "0.1em",
						textTransform: "uppercase",
					}}
				>
					Reading your workspace
				</div>
				<div style={{ marginBottom: 10 }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginBottom: 4,
						}}
					>
						<span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Documentation</span>
						<span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>72%</span>
					</div>
					<div
						style={{
							height: 4,
							background: "rgba(255,255,255,0.1)",
							borderRadius: 2,
						}}
					>
						<div
							style={{
								height: "100%",
								width: "72%",
								background: "#4da8b5",
								borderRadius: 2,
							}}
						/>
					</div>
				</div>
				{["Slack history", "Meeting notes", "Codebase"].map((item, i) => (
					<div
						key={item}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							padding: "4px 0",
							color: i === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
							fontSize: 11,
						}}
					>
						<span
							style={{
								color: i === 0 ? "#22c55e" : "rgba(255,255,255,0.2)",
							}}
						>
							✓
						</span>
						{item}
					</div>
				))}
			</div>
		),
	},
	{
		num: "03",
		title: "It gets to work",
		desc: "Assign something or let it find work itself. Executes, reports back, asks only when stuck. Repeat, every day.",
		footer: "Runs 24/7",
		visual: (
			<div
				style={{
					background: "rgba(255,255,255,0.05)",
					border: "1px solid rgba(255,255,255,0.10)",
					borderRadius: 12,
					padding: "11px 13px 13px",
					marginBottom: 20,
					fontSize: 12,
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<img
						src="/openviktor.png"
						alt="OpenViktor"
						style={{
							width: 22,
							height: 22,
							borderRadius: "50%",
							objectFit: "cover",
							flexShrink: 0,
							background: "#fff",
						}}
					/>
					<div>
						<div style={{ display: "flex", alignItems: "center", gap: 5 }}>
							<span
								style={{
									color: "rgba(255,255,255,0.9)",
									fontWeight: 600,
									fontSize: 12,
								}}
							>
								OpenViktor
							</span>
							<span
								style={{
									fontSize: 9,
									background: "#4da8b5",
									color: "#fff",
									padding: "1px 5px",
									borderRadius: 3,
									fontWeight: 600,
								}}
							>
								AI
							</span>
						</div>
						<span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>just now</span>
					</div>
				</div>
				<div
					style={{
						background: "rgba(255,255,255,0.06)",
						borderRadius: 8,
						padding: "8px 10px",
						color: "rgba(255,255,255,0.7)",
						fontSize: 11.5,
						lineHeight: 1.6,
					}}
				>
					Q1 campaign draft done. Filed in Notion and sent to Sarah.
				</div>
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 5,
						background: "rgba(58,84,38,0.3)",
						border: "1px solid rgba(58,84,38,0.5)",
						borderRadius: 20,
						padding: "3px 10px",
						alignSelf: "flex-start",
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
					<span style={{ color: "#a7c99a", fontSize: 10 }}>Next task in queue</span>
				</div>
			</div>
		),
	},
];

export default function HowItWorks() {
	return (
		<section
			id="how-it-works"
			className="py-24 px-6 relative overflow-hidden anim-section"
			style={{
				backgroundImage: "url(/bg-howitworks.jpg)",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="absolute inset-0 bg-black/40" />

			<div className="max-w-7xl mx-auto relative z-10">
				<p className="text-white/50 text-xs tracking-widest uppercase mb-4">How it works</p>
				<h2
					className="leading-[1.1] tracking-tight text-white mb-8 md:mb-16 max-w-[1000px]"
					style={{
						fontFamily: "var(--font-instrument-serif),'Instrument Serif',Georgia,serif",
						fontWeight: 400,
						fontSize: "clamp(32px,4vw,52px)",
					}}
				>
					Up and running in three steps.
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{steps.map((step) => (
						<div
							key={step.num}
							className="rounded-2xl p-6 md:p-8 flex flex-col"
							style={{
								background: "rgba(0,0,0,0.45)",
								border: "1px solid rgba(255,255,255,0.1)",
							}}
						>
							<span className="text-white/30 font-mono text-sm mb-5">{step.num}</span>
							{step.visual}
							<div className="flex flex-col gap-3">
								<h3
									className="text-xl text-white leading-snug"
									style={{
										fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
									}}
								>
									{step.title}
								</h3>
								<p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
							</div>
							<div
								className="mt-auto pt-5 text-white/30 text-xs"
								style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
							>
								{step.footer}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
