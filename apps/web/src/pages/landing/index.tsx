import "./landing.css";
import AnimObserver from "./components/AnimObserver";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import LogosBar from "./components/LogosBar";
import MarqueeCTA from "./components/MarqueeCTA";
import Navbar from "./components/Navbar";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import VideoSection from "./components/VideoSection";
import WhatViktorDoes from "./components/WhatViktorDoes";

export function LandingPage() {
	return (
		<div className="landing-page min-h-screen bg-[#faf9f6]">
			<AnimObserver />
			<Navbar />
			<Hero />
			<LogosBar />
			<VideoSection />
			<HowItWorks />
			<WhatViktorDoes />
			<Pricing />
			<Testimonials />
			<MarqueeCTA />
			<Footer />
		</div>
	);
}
