const credentials = [
	"2x medalist at the Polish Informatics Olympiad",
	"2x medalist at IOAI",
	"2x dev on HFT",
	"2x gaming pro",
	"Air Space Special Forces",
];

export default function LogosBar() {
	return (
		<section className="py-12 px-6 border-t border-[#E5E2DC]">
			<div className="max-w-7xl mx-auto">
				<p className="text-center text-[#C8C4BD] text-xs tracking-widest uppercase mb-8">
					Built by HUMALIKE.AI team
				</p>
				<div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
					{credentials.map((item, i) => (
						<span key={item} className="flex items-center gap-2 select-none">
							{i > 0 && <span className="text-[#d6eaef] text-xs">·</span>}
							<span
								className="text-[#9095a5] text-sm"
								style={{
									fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
								}}
							>
								{item}
							</span>
						</span>
					))}
				</div>
			</div>
		</section>
	);
}
