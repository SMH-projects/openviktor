"use client";

import { useEffect } from "react";

export default function AnimObserver() {
	useEffect(() => {
		const els = document.querySelectorAll<HTMLElement>(".anim-section");
		const observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						e.target.classList.add("in-view");
					}
				}
			},
			{ threshold: 0.08 },
		);
		for (const el of els) observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return null;
}
