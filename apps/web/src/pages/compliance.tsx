import { HumalikeLogo } from "./landing/components/Navbar";

export function CompliancePage() {
	return (
		<div className="min-h-screen bg-[#faf9f6]">
			<nav className="border-b border-[#E5E2DC] px-6 h-[60px] flex items-center">
				<HumalikeLogo height={20} />
			</nav>

			<main className="max-w-2xl mx-auto px-6 py-20">
				<h1
					className="text-3xl font-bold text-[#111] mb-4"
					style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)" }}
				>
					Security & Compliance
				</h1>

				<p className="text-[#6B6863] text-lg leading-relaxed mb-10">
					We take security seriously. OpenViktor is actively working toward industry-standard
					certifications to ensure your data is protected.
				</p>

				<div className="space-y-8">
					<div className="border border-[#E5E2DC] rounded-xl p-6 bg-white">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 rounded-full bg-[#f0eeeb] flex items-center justify-center">
								<svg
									width={20}
									height={20}
									viewBox="0 0 24 24"
									fill="none"
									stroke="#111"
									strokeWidth={2}
								>
									<title>Shield</title>
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
								</svg>
							</div>
							<h2 className="text-lg font-semibold text-[#111]">ISO 27001</h2>
						</div>
						<p className="text-[#6B6863] text-sm leading-relaxed">
							We are committed to achieving ISO 27001 certification. Our information security
							management practices are being aligned with ISO 27001 standards to provide you with
							the highest level of data protection.
						</p>
						<span className="inline-block mt-4 text-xs font-medium text-[#A8A49E] bg-[#f0eeeb] px-3 py-1 rounded-full">
							In progress
						</span>
					</div>

					<div className="border border-[#E5E2DC] rounded-xl p-6 bg-white">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-10 h-10 rounded-full bg-[#f0eeeb] flex items-center justify-center">
								<svg
									width={20}
									height={20}
									viewBox="0 0 24 24"
									fill="none"
									stroke="#111"
									strokeWidth={2}
								>
									<title>Lock</title>
									<rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</div>
							<h2 className="text-lg font-semibold text-[#111]">SOC 2 Type 2</h2>
						</div>
						<p className="text-[#6B6863] text-sm leading-relaxed">
							We are working toward SOC 2 Type 2 compliance. Our systems and processes are being
							designed to meet the Trust Services Criteria for security, availability, and
							confidentiality.
						</p>
						<span className="inline-block mt-4 text-xs font-medium text-[#A8A49E] bg-[#f0eeeb] px-3 py-1 rounded-full">
							In progress
						</span>
					</div>
				</div>

				<p className="text-[#A8A49E] text-sm mt-10">
					Have questions about our security practices?{" "}
					<a href="mailto:mtk@soofte.com" className="text-[#111] hover:underline">
						Get in touch
					</a>
				</p>
			</main>
		</div>
	);
}
