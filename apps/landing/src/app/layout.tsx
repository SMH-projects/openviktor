import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
	subsets: ["latin"],
	variable: "--font-manrope",
	display: "swap",
});

const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	weight: "400",
	style: ["normal", "italic"],
	variable: "--font-instrument-serif",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Your AI employee | OPENVIKTOR",
	description:
		"AI employees with their own identity, learn from every teammate, understand your organization and take initiatives.",
	icons: {
		icon: "/openv.png",
		shortcut: "/openv.png",
		apple: "/openv.png",
	},
	openGraph: {
		title: "Your AI employee | OPENVIKTOR",
		description:
			"AI employees with their own identity, learn from every teammate, understand your organization and take initiatives.",
		images: [{ url: "/og.jpg", width: 1600, height: 840 }],
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Your AI employee | OPENVIKTOR",
		description:
			"AI employees with their own identity, learn from every teammate, understand your organization and take initiatives.",
	},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body
				className={`${manrope.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground`}
			>
				{children}
			</body>
		</html>
	);
}
