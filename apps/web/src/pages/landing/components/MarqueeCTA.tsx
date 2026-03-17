const row1 = [
	"Its own email and Slack handle",
	"Live on day one",
	"Runs inside your existing stack",
	"One hire, every role",
	"Never drops context",
	"2-minute setup, no IT ticket",
	"Working before your team logs in",
	"24/7, no time zones, no holidays",
];

const row2 = [
	"Sends real emails from its own inbox",
	"Knows every meeting and doc",
	"Catches problems before you do",
	"Listed in your team directory",
	"Opens tickets on its own",
	"Pulls data, builds reports",
	"Handles follow-ups without reminders",
	"Replies in Slack instantly",
];

const row3 = [
	"Grow output without adding headcount",
	"Zero knowledge lost at handoff",
	"Kills repetitive work permanently",
	"Ship more with fewer people",
	"Ops that run themselves",
	"Your team does only the work that matters",
	"Full context, always",
	"Gets faster the longer it runs",
];

function MarqueeRow({
	items,
	direction,
	duration,
}: {
	items: string[];
	direction: "left" | "right";
	duration: number;
}) {
	const anim =
		direction === "left"
			? `marqueeLeft ${duration}s linear infinite`
			: `marqueeRight ${duration}s linear infinite`;

	const doubled = [
		...items.map((item) => ({ item, half: "a" })),
		...items.map((item) => ({ item, half: "b" })),
	];

	return (
		<div className="flex overflow-hidden">
			<div className="flex gap-8 whitespace-nowrap" style={{ animation: anim }}>
				{doubled.map(({ item, half }) => (
					<span key={`${item}-${half}`} className="flex items-center gap-2 text-white/40 text-sm">
						<span
							className="inline-block shrink-0"
							style={{
								width: 4,
								height: 4,
								borderRadius: "50%",
								background: "rgba(255,255,255,0.25)",
							}}
						/>
						{item}
					</span>
				))}
			</div>
		</div>
	);
}

export default function MarqueeCTA() {
	return (
		<section className="pt-24 pb-16 overflow-hidden anim-section" style={{ background: "#0f2038" }}>
			<div className="max-w-7xl mx-auto px-6 text-center mb-16">
				<h3
					className="leading-[1.08] tracking-tight text-white mb-10 max-w-4xl mx-auto"
					style={{
						fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
						fontWeight: 600,
						fontSize: "clamp(22px,2.5vw,32px)",
					}}
				>
					Work will never feel the same.
				</h3>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<a
						href="/hire"
						className="inline-flex items-center px-8 py-4 rounded-full text-sm font-medium shrink-0 hover:opacity-80 transition-opacity"
						style={{ background: "#fff", color: "#111" }}
					>
						Open a Position
					</a>
				</div>
			</div>

			<div className="space-y-3">
				<MarqueeRow items={row1} direction="left" duration={50} />
				<MarqueeRow items={row2} direction="right" duration={65} />
				<MarqueeRow items={row3} direction="left" duration={55} />
			</div>
		</section>
	);
}
