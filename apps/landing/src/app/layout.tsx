import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./posthog-provider";

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
	metadataBase: new URL("https://openviktor.com"),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Your AI employee | OPENVIKTOR",
		description:
			"AI employees with their own identity, learn from every teammate, understand your organization and take initiatives.",
		images: [{ url: "/og.jpg", width: 1600, height: 840 }],
		type: "website",
		url: "https://openviktor.com",
	},
	twitter: {
		card: "summary_large_image",
		title: "Your AI employee | OPENVIKTOR",
		description:
			"AI employees with their own identity, learn from every teammate, understand your organization and take initiatives.",
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Organization",
			name: "OpenViktor",
			url: "https://openviktor.com",
			logo: "https://openviktor.com/openv.png",
			description:
				"Open-source AI employee platform for Slack. AI teammates that learn, understand, and take initiative.",
			sameAs: [
				"https://github.com/zggf-zggf/openviktor/",
				"https://x.com/humalikeai",
				"https://discord.gg/7bZFjm9aHH",
			],
			parentOrganization: {
				"@type": "Organization",
				name: "HUMALIKE",
				url: "https://www.humalike.ai/",
			},
		},
		{
			"@type": "WebSite",
			name: "OpenViktor",
			url: "https://openviktor.com",
		},
		{
			"@type": "SoftwareApplication",
			name: "OpenViktor",
			applicationCategory: "BusinessApplication",
			operatingSystem: "Web",
			description:
				"Open-source AI employee for Slack. Hire an AI teammate that gets its own identity, learns from every conversation, understands your organization, and takes initiative.",
			url: "https://openviktor.com",
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "USD",
				description: "Free and open-source, self-hostable",
			},
		},
	],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body
				className={`${manrope.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground`}
			>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
				<PostHogProvider>{children}</PostHogProvider>
			</body>
		</html>
	);
}
