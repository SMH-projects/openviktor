import Link from "next/link";

const row1 = [
	"Own email, Slack, and name",
	"Ready on day one",
	"Works in your existing tools",
	"One hire, any role",
	"Never forgets a decision",
	"Onboards in minutes, not months",
	"Active before your team wakes up",
	"24/7 across every time zone",
];

const row2 = [
	"Sends emails from its own inbox",
	"Remembers every meeting and doc",
	"Flags issues before they escalate",
	"Joins your team directory",
	"Files tickets without being asked",
	"Pulls reports automatically",
	"Follows up so you don't have to",
	"Answers Slack in seconds",
];

const row3 = [
	"Scale without growing headcount",
	"Institutional memory that sticks",
	"Replace repetitive work entirely",
	"Ship with a smaller team",
	"Run ops on autopilot",
	"Free your team for high-impact work",
	"No context lost between conversations",
	"Compound productivity every week",
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

	const doubled = [...items, ...items];

	return (
		<div className="flex overflow-hidden">
			<div className="flex gap-8 whitespace-nowrap" style={{ animation: anim }}>
				{doubled.map((item, i) => (
					<span key={i} className="flex items-center gap-2 text-white/40 text-sm">
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
					<Link
						href="/hire"
						className="inline-flex items-center px-8 py-4 rounded-full text-sm font-medium shrink-0 hover:opacity-80 transition-opacity"
						style={{ background: "#fff", color: "#111" }}
					>
						Open a Position
					</Link>
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
