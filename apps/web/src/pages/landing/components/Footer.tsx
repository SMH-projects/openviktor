import { HumalikeLogo } from "./Navbar";

const productLinks = [
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "Use Cases", href: "/use-cases" },
	{ label: "Pricing", href: "/#pricing" },
];

const legalLinks = [
	{ label: "Terms", href: "/terms-of-service" },
	{ label: "Privacy", href: "/privacy" },
	{ label: "ISO 27001", href: "#", external: true },
	{ label: "SOC 2 Type 2", href: "#", external: true },
];

export default function Footer() {
	return (
		<footer className="border-t border-[#E5E2DC] pt-16 pb-10 px-6">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-16">
					<div className="col-span-2">
						<div className="mb-4">
							<HumalikeLogo height={20} />
						</div>
						<p className="text-[#A8A49E] text-sm leading-relaxed max-w-[280px]">
							The AI employee for any role.
						</p>
						<div className="flex items-center gap-4 mt-6">
							<a
								href="https://github.com/zggf-zggf/openviktor"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="GitHub"
								className="text-[#C8C4BD] hover:text-[#6B6863] transition-colors"
							>
								<svg
									aria-hidden="true"
									width={16}
									height={16}
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
								</svg>
								<span className="sr-only">GitHub</span>
							</a>
							<a
								href="https://x.com/humalikeai"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="X"
								className="text-[#C8C4BD] hover:text-[#6B6863] transition-colors"
							>
								<svg
									aria-hidden="true"
									width={16}
									height={16}
									viewBox="0 0 16 16"
									fill="currentColor"
								>
									<path d="M12.6 0h2.454l-5.36 6.132L16 16h-4.937l-3.867-5.07L2.771 16H.316l5.733-6.558L0 0h5.063l3.495 4.633L12.601 0zm-.86 14.376h1.36L4.323 1.39H2.865l8.875 12.986z" />
								</svg>
								<span className="sr-only">X</span>
							</a>
							<a
								href="https://discord.gg/7bZFjm9aHH"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Discord"
								className="text-[#C8C4BD] hover:text-[#6B6863] transition-colors"
							>
								<svg
									aria-hidden="true"
									width={16}
									height={16}
									viewBox="0 0 16 16"
									fill="currentColor"
								>
									<path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
								</svg>
								<span className="sr-only">Discord</span>
							</a>
						</div>
					</div>

					<div>
						<div className="text-[#111] text-xs font-semibold tracking-widest uppercase mb-4">
							Product
						</div>
						<div className="flex flex-col gap-3">
							{productLinks.map((l) => (
								<a
									key={l.label}
									href={l.href}
									className="text-[#6B6863] text-sm hover:text-[#111] transition-colors"
								>
									{l.label}
								</a>
							))}
						</div>
					</div>

					<div>
						<div className="text-[#111] text-xs font-semibold tracking-widest uppercase mb-4">
							Legal
						</div>
						<div className="flex flex-col gap-3">
							{legalLinks.map((l) => (
								<a
									key={l.label}
									href={l.href}
									className="text-[#6B6863] text-sm hover:text-[#111] transition-colors"
									{...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
								>
									{l.label}
								</a>
							))}
						</div>
					</div>

					<div className="col-span-2 md:col-span-1">
						<div className="text-[#111] text-xs font-semibold tracking-widest uppercase mb-4">
							Contact
						</div>
						<a
							href="mailto:mtk@soofte.com"
							className="text-[#6B6863] text-sm hover:text-[#111] transition-colors block mb-2"
						>
							Email us →
						</a>
						<a
							href="https://partners.dub.co/junior-so"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#6B6863] text-sm hover:text-[#111] transition-colors mt-2 block"
						>
							Partner Program
						</a>
					</div>
				</div>

				<div className="border-t border-[#E5E2DC] pt-6 text-[#C8C4BD] text-xs">
					© 2026 OpenHuma. All rights reserved.
				</div>
			</div>
		</footer>
	);
}
