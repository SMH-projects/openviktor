import { useEffect, useState } from "react";

function HumalikeLogo({ height = 28 }: { height?: number }) {
	return (
		<a href="/" className="flex items-center gap-1.5">
			<img
				src="/openviktor.png"
				alt="Humalike"
				className="object-contain"
				style={{ width: height, height: height }}
			/>
			<span
				style={{
					fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
					fontWeight: 700,
					fontSize: height * 0.85,
					letterSpacing: "0.07em",
					color: "#111",
					lineHeight: 1,
				}}
			>
				OPENVIKTOR
			</span>
		</a>
	);
}

export { HumalikeLogo };

export default function Navbar() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 10);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav
			className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
			style={{
				background: scrolled ? "#fff" : "transparent",
				boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,0.06)" : "none",
			}}
		>
			<div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
				<div className="flex items-center gap-8">
					<HumalikeLogo height={20} />

					<div className="hidden md:flex items-center gap-6">
						<a
							href="#how-it-works"
							className="text-sm text-[#6B6863] hover:text-[#111] transition-colors"
						>
							How it works
						</a>
						<a
							href="#pricing"
							className="text-sm text-[#6B6863] hover:text-[#111] transition-colors"
						>
							Pricing
						</a>
						<a
							href="https://www.humalike.ai/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-[#6B6863] hover:text-[#111] transition-colors"
						>
							HUMALIKE
						</a>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<a
						href="/login"
						className="text-sm text-[#6B6863] hover:text-[#111] transition-colors hidden sm:block"
					>
						Sign in
					</a>
					<a
						href="https://github.com/zggf-zggf/openviktor/"
						target="_blank"
						rel="noopener noreferrer"
						className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium hover:border-[#111] hover:text-[#111] transition-colors"
						style={{ borderColor: "#d6eaef", color: "#6B6863" }}
					>
						<svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
							<title>GitHub</title>
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
						</svg>
						Star
					</a>
					<a
						href="/hire"
						className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
						style={{ background: "#111", color: "#fff" }}
					>
						Hire now. Free
					</a>

					<button
						type="button"
						className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] bg-transparent border-none cursor-pointer p-0"
						aria-label="Menu"
						onClick={() => setMobileOpen(!mobileOpen)}
					>
						<span
							className={`block w-5 h-[1.5px] bg-[#111] transition-all duration-200 origin-center ${mobileOpen ? "rotate-45 translate-y-[6.5px]" : ""}`}
						/>
						<span
							className={`block w-5 h-[1.5px] bg-[#111] transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`}
						/>
						<span
							className={`block w-5 h-[1.5px] bg-[#111] transition-all duration-200 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`}
						/>
					</button>
				</div>
			</div>

			{mobileOpen && (
				<div
					className="md:hidden border-t border-[#d6eaef] px-6 py-5 flex flex-col gap-4"
					style={{ background: "#e5f4f8" }}
				>
					{[
						{ label: "How it works", href: "#how-it-works" },
						{ label: "Pricing", href: "#pricing" },
						{ label: "HUMALIKE", href: "https://www.humalike.ai/", external: true },
					].map((l) => (
						<a
							key={l.label}
							href={l.href}
							className="text-sm text-[#6B6863] hover:text-[#111] transition-colors"
							onClick={() => setMobileOpen(false)}
							{...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
						>
							{l.label}
						</a>
					))}
					<div className="flex gap-3 pt-2 border-t border-[#d6eaef]">
						<a href="/login" className="text-sm text-[#6B6863] hover:text-[#111]">
							Sign in
						</a>
						<a
							href="/hire"
							className="inline-flex items-center px-4 py-2 rounded-full bg-[#111] text-white text-sm font-medium hover:bg-[#333] transition-colors"
						>
							Hire now. Free
						</a>
					</div>
				</div>
			)}
		</nav>
	);
}
