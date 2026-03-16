const quotes = [
	{
		body: "We hired a Viktor as our SDR and she had her first qualified meeting booked within 48 hours. No ramping, no training. She just read our docs and started working.",
		name: "Marcus T.",
		role: "Head of Sales",
		company: "Veritas Labs",
		initials: "MT",
		grad: "linear-gradient(135deg,#818cf8,#6366f1)",
	},
	{
		body: "The org memory is unlike anything I've seen. Viktor remembers a pricing conversation we had in Slack three months ago and referenced it in a client proposal without being told.",
		name: "Priya S.",
		role: "COO",
		company: "Orbit Systems",
		initials: "PS",
		grad: "linear-gradient(135deg,#f472b6,#ec4899)",
	},
	{
		body: "We replaced two contractor roles overnight. Viktor attends every standup, files all the tickets, and sends follow-ups. My team barely noticed the switch.",
		name: "Jordan K.",
		role: "Engineering Lead",
		company: "Nexus Studio",
		initials: "JK",
		grad: "linear-gradient(135deg,#34d399,#059669)",
	},
];

export default function Testimonials() {
	return (
		<section className="py-12 md:py-24 px-6 border-t border-[#E5E2DC] anim-section">
			<div className="max-w-7xl mx-auto">
				<p className="text-[#A8A49E] text-xs tracking-widest uppercase mb-4">What teams say</p>
				<h2
					className="leading-[1.1] tracking-tight text-[#111] mb-12"
					style={{
						fontFamily: "var(--font-instrument-serif),'Instrument Serif',Georgia,serif",
						fontWeight: 400,
						fontSize: "clamp(32px,4vw,52px)",
					}}
				>
					They hired once.
					<br />
					Now they can&apos;t imagine working without them.
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{quotes.map((q) => (
						<div
							key={q.name}
							className="bg-white border border-[#E5E2DC] rounded-2xl p-7 flex flex-col gap-5"
							style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
						>
							<svg width={22} height={18} viewBox="0 0 22 18" fill="none">
								<path
									d="M0 18V10.8C0 4.68 3.36.72 10.08 0l1.44 2.16C7.68 3.12 5.76 5.28 5.52 8.4H9.6V18H0zm12.24 0V10.8C12.24 4.68 15.6.72 22.32 0l1.44 2.16c-3.84.96-5.76 3.12-6 6.24H21.84V18H12.24z"
									fill="#E5E2DC"
								/>
							</svg>

							<p className="text-[#111] text-sm leading-relaxed flex-1">{q.body}</p>

							<div className="flex items-center gap-3 pt-4 border-t border-[#F5F3EF]">
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: "50%",
										background: q.grad,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
									}}
								>
									<span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{q.initials}</span>
								</div>
								<div>
									<div className="text-sm font-semibold text-[#111]">{q.name}</div>
									<div className="text-xs text-[#A8A49E]">
										{q.role} · {q.company}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
