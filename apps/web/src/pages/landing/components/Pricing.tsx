const rows = [
	{
		feature: "Monthly cost",
		ours: "Free",
		theirs: "$5,000+/mo",
		oursPills: null,
	},
	{
		feature: "Onboarding time",
		ours: "Under 10 minutes",
		theirs: "Custom / weeks",
		oursPills: null,
	},
	{
		feature: "Working hours",
		ours: "24/7",
		theirs: "Business hours",
		oursPills: null,
	},
	{
		feature: "Source code",
		ours: "Fully open",
		theirs: "Proprietary",
		oursPills: null,
	},
	{
		feature: "Capabilities",
		ours: null,
		theirs: "Enterprise contracts required",
		oursPills: [
			"Full context, fully applied",
			"Takes initiative",
			"Parallel execution",
			"No vendor lock-in",
		],
	},
];

export default function Pricing() {
	return (
		<section id="pricing" className="py-12 md:py-24 px-6 border-t border-[#E5E2DC] anim-section">
			<div className="max-w-7xl mx-auto">
				<div className="mb-10">
					<div
						className="inline-flex items-center px-3 py-1 rounded-full mb-4 text-sm font-medium"
						style={{ border: "1px solid #1e6a8a", color: "#1e6a8a" }}
					>
						✦ Free, forever
					</div>
					<h2
						className="leading-[1.1] tracking-tight text-[#111] max-w-[1000px]"
						style={{
							fontFamily: "var(--font-instrument-serif),'Instrument Serif',Georgia,serif",
							fontWeight: 400,
							fontSize: "clamp(32px,4vw,52px)",
						}}
					>
						Open source. No pricing page needed.
					</h2>
				</div>

				<div className="overflow-x-auto">
					<div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden min-w-[340px]">
						<div className="grid grid-cols-2 md:grid-cols-3 border-b border-[#E5E2DC]">
							<div className="hidden md:block p-3 md:p-5" />
							<div
								className="p-3 md:p-5 md:border-l border-[#E5E2DC]"
								style={{ background: "#1e6a8a" }}
							>
								<span className="text-white text-xs tracking-widest uppercase font-medium">
									OpenHuma
								</span>
							</div>
							<div className="p-3 md:p-5 border-l border-[#E5E2DC]">
								<span className="text-[#A8A49E] text-xs tracking-widest uppercase">getviktor</span>
							</div>
						</div>

						{rows.map((row, i) => (
							<div
								key={row.feature}
								className={`grid grid-cols-2 md:grid-cols-3 ${i < rows.length - 1 ? "border-b border-[#E5E2DC]" : ""}`}
							>
								<div className="hidden md:block p-3 md:p-5">
									<span className="text-[#6B6863] text-sm">{row.feature}</span>
								</div>

								<div
									className="p-3 md:p-5 md:border-l border-[#E5E2DC]"
									style={{ background: "#e8f5f8" }}
								>
									{row.ours && <span className="text-[#111] text-sm font-medium">{row.ours}</span>}
									{row.oursPills && (
										<>
											<ul className="md:hidden space-y-1">
												{row.oursPills.map((p) => (
													<li
														key={p}
														className="flex items-start gap-2 text-sm text-[#111] font-medium"
													>
														<span
															className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]"
															style={{ background: "#1e6a8a" }}
														/>
														{p}
													</li>
												))}
											</ul>
											<div className="hidden md:flex flex-wrap gap-2">
												{row.oursPills.map((p) => (
													<span
														key={p}
														className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
														style={{ background: "#b3dce6", color: "#0f2038" }}
													>
														{p}
													</span>
												))}
											</div>
										</>
									)}
								</div>

								<div className="p-3 md:p-5 border-l border-[#E5E2DC]">
									<span className="text-[#6B6863] text-sm">{row.theirs}</span>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="mt-8">
					<a
						href="https://github.com/zggf-zggf/openviktor"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
						style={{ background: "#111", color: "#fff" }}
					>
						<svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
							<title>GitHub</title>
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
						</svg>
						Get started free
					</a>
				</div>
			</div>
		</section>
	);
}
