import { useRef, useState } from "react";

export default function VideoSection() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [playing, setPlaying] = useState(false);

	const handlePlay = () => {
		if (videoRef.current) {
			videoRef.current.play();
			setPlaying(true);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			handlePlay();
		}
	};

	return (
		<section className="py-20 px-6 border-t border-[#E5E2DC]">
			<div className="max-w-4xl mx-auto">
				<button
					type="button"
					className="relative w-full rounded-2xl overflow-hidden border border-[#E5E2DC] group cursor-pointer"
					style={{ aspectRatio: "16/9", background: "transparent", padding: 0 }}
					onClick={handlePlay}
					onKeyDown={handleKeyDown}
				>
					{!playing && (
						<img
							src="/images/launch-cover.jpg"
							alt="Viktor launch video"
							className="absolute inset-0 w-full h-full object-cover"
						/>
					)}

					<video
						ref={videoRef}
						src="https://storage.googleapis.com/viktor-web/videos/introducing_viktor.mp4"
						poster="/images/launch-cover.jpg"
						playsInline
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							display: "block",
						}}
					>
						<track kind="captions" />
					</video>

					{!playing && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/25 transition-colors duration-200">
							<div
								style={{
									width: 64,
									height: 64,
									borderRadius: "50%",
									background: "rgba(255,255,255,0.92)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
								}}
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
					)}
				</button>
			</div>
		</section>
	);
}
