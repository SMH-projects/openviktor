import { useState } from "react";

const VIDEO_ID = "TlclS4wLWgY";

export default function VideoSection() {
	const [playing, setPlaying] = useState(false);

	return (
		<section className="py-20 px-6 border-t border-[#E5E2DC]">
			<div className="max-w-4xl mx-auto">
				<button
					type="button"
					className="relative w-full rounded-2xl overflow-hidden border border-[#E5E2DC] group cursor-pointer"
					style={{ aspectRatio: "16/9", background: "transparent", padding: 0 }}
					onClick={() => setPlaying(true)}
				>
					{playing ? (
						<iframe
							src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&color=white`}
							title="OpenViktor demo"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							style={{
								position: "absolute",
								inset: 0,
								width: "100%",
								height: "100%",
								border: "none",
							}}
						/>
					) : (
						<>
							<img
								src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
								alt="OpenViktor demo video"
								style={{
									position: "absolute",
									inset: 0,
									width: "100%",
									height: "100%",
									objectFit: "cover",
								}}
							/>
							<div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/30 transition-colors duration-200">
								<div
									style={{
										width: 68,
										height: 68,
										borderRadius: "50%",
										background: "rgba(255,255,255,0.92)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
										transition: "transform 0.15s ease",
									}}
									className="group-hover:scale-110"
								>
									<svg
										width={22}
										height={22}
										viewBox="0 0 24 24"
										fill="#111"
										style={{ marginLeft: 3 }}
									>
										<title>Play</title>
										<path d="M8 5v14l11-7z" />
									</svg>
								</div>
							</div>
						</>
					)}
				</button>
			</div>
		</section>
	);
}
