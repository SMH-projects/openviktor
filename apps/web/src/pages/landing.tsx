const API_BASE = import.meta.env.VITE_API_URL || "";

export function LandingPage() {
	return (
		<div
			style={{
				minHeight: "100vh",
				background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
				color: "#e0e0e0",
				fontFamily: "system-ui, -apple-system, sans-serif",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<header
				style={{
					padding: "24px 40px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>OpenViktor</div>
				<a
					href="/login"
					style={{
						color: "#a0a0b0",
						textDecoration: "none",
						fontSize: "14px",
					}}
				>
					Dashboard
				</a>
			</header>

			<main
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "0 24px",
					textAlign: "center",
					maxWidth: "640px",
					margin: "0 auto",
				}}
			>
				<h1
					style={{
						fontSize: "48px",
						fontWeight: 700,
						color: "#fff",
						lineHeight: 1.2,
						marginBottom: "16px",
					}}
				>
					AI assistant for your Slack workspace
				</h1>

				<p
					style={{
						fontSize: "18px",
						color: "#a0a0b0",
						lineHeight: 1.6,
						marginBottom: "40px",
					}}
				>
					Viktor runs tasks, answers questions, manages integrations, and automates workflows —
					right from Slack. Free to use.
				</p>

				<a
					href={`${API_BASE}/slack/oauth/install`}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "12px",
						padding: "16px 32px",
						background: "#4A154B",
						color: "#fff",
						fontSize: "18px",
						fontWeight: 600,
						borderRadius: "8px",
						textDecoration: "none",
						transition: "opacity 0.2s",
					}}
					onMouseEnter={(e) => {
						(e.target as HTMLElement).style.opacity = "0.9";
					}}
					onMouseLeave={(e) => {
						(e.target as HTMLElement).style.opacity = "1";
					}}
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="currentColor"
						role="img"
						aria-label="Slack logo"
					>
						<title>Slack</title>
						<path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
					</svg>
					Add to Slack
				</a>

				<div
					style={{
						marginTop: "64px",
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
						gap: "24px",
						width: "100%",
					}}
				>
					{[
						["Run tasks", "Execute code, manage files, search the web"],
						["Integrations", "Connect GitHub, Linear, and 2000+ apps"],
						["Memory", "Learns your team's context over time"],
						["Free tier", "Get started with $20/month in usage"],
					].map(([title, desc]) => (
						<div
							key={title}
							style={{
								padding: "20px",
								background: "rgba(255,255,255,0.04)",
								borderRadius: "8px",
								border: "1px solid rgba(255,255,255,0.08)",
							}}
						>
							<div
								style={{
									fontSize: "15px",
									fontWeight: 600,
									color: "#fff",
									marginBottom: "6px",
								}}
							>
								{title}
							</div>
							<div style={{ fontSize: "13px", color: "#808090" }}>{desc}</div>
						</div>
					))}
				</div>
			</main>

			<footer
				style={{
					padding: "24px 40px",
					textAlign: "center",
					fontSize: "13px",
					color: "#606070",
				}}
			>
				<a
					href="https://github.com/zggf-zggf/openviktor"
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: "#808090", textDecoration: "none" }}
				>
					GitHub
				</a>
				{" · "}
				Open source under MIT
			</footer>
		</div>
	);
}
