import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	Brain,
	Calendar,
	DollarSign,
	ExternalLink,
	Github,
	LayoutDashboard,
	MessageSquare,
	Plug,
	Settings,
	Shield,
	Wrench,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getMe, getWorkspaces, isAuthError } from "../../lib/api";
import { cn } from "../../lib/utils";

const adminNavigation = [
	{ name: "Status", href: "/dashboard", icon: Shield },
	{ name: "Overview", href: "/overview", icon: LayoutDashboard },
	{ name: "Agent Runs", href: "/runs", icon: Activity },
	{ name: "Tools", href: "/tools", icon: Wrench },
	{ name: "Threads", href: "/threads", icon: MessageSquare },
	{ name: "Knowledge", href: "/knowledge", icon: Brain },
	{ name: "Usage", href: "/usage", icon: DollarSign },
	{ name: "Tasks", href: "/tasks", icon: Calendar },
	{ name: "Integrations", href: "/integrations", icon: Plug },
	{ name: "Settings", href: "/settings", icon: Settings },
];

const userNavigation = [
	{ name: "Agent Runs", href: "/runs", icon: Activity },
	{ name: "Threads", href: "/threads", icon: MessageSquare },
	{ name: "Knowledge", href: "/knowledge", icon: Brain },
	{ name: "Usage", href: "/usage", icon: DollarSign },
	{ name: "Tasks", href: "/tasks", icon: Calendar },
	{ name: "Integrations", href: "/integrations", icon: Plug },
];

export function AppLayout() {
	const navigate = useNavigate();
	const { data, error } = useQuery({
		queryKey: ["workspaces"],
		queryFn: getWorkspaces,
		retry: false,
	});

	const { data: me } = useQuery({
		queryKey: ["me"],
		queryFn: getMe,
		retry: false,
	});

	useEffect(() => {
		if (error && isAuthError(error)) {
			navigate("/");
		}
	}, [error, navigate]);

	useEffect(() => {
		if (data?.workspaces?.length && !localStorage.getItem("ov_workspace_id")) {
			localStorage.setItem("ov_workspace_id", data.workspaces[0].id);
		}
	}, [data]);

	const location = useLocation();
	const isAdmin = me?.isAdmin ?? false;
	const navigation = isAdmin ? adminNavigation : userNavigation;

	const adminOnlyPaths = ["/dashboard", "/overview", "/settings", "/settings/team"];
	if (me && !isAdmin && adminOnlyPaths.includes(location.pathname)) {
		return <Navigate to="/runs" replace />;
	}

	return (
		<div className="flex h-screen">
			<aside className="flex w-60 flex-col border-r border-[#d6eaef] bg-[#f7fbfd]">
				<a href="/" className="flex h-14 items-center gap-2.5 border-b border-[#d6eaef] px-4">
					<img src="/openviktor.png" alt="OpenViktor" className="h-7 w-7" />
					<span
						className="text-base font-bold tracking-[0.1em] text-[#111]"
						style={{ fontFamily: "'Manrope', sans-serif" }}
					>
						OPENVIKTOR
					</span>
				</a>
				<nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
					{navigation.map((item) => (
						<NavLink
							key={item.href}
							to={item.href}
							end={item.href === "/dashboard"}
							className={({ isActive }) =>
								cn(
									"flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-[#e8f5f8] text-[#1e6a8a]"
										: "text-[#6b7080] hover:bg-[#eef7fa] hover:text-[#111]",
								)
							}
						>
							<item.icon className="h-4 w-4" />
							{item.name}
						</NavLink>
					))}
				</nav>
				<div className="border-t border-[#d6eaef] px-4 py-3">
					<div className="flex items-center justify-between">
						<a
							href="https://github.com/zggf-zggf/openviktor"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-xs text-[#9095a5] hover:text-[#1e6a8a] transition-colors"
						>
							<Github className="h-3.5 w-3.5" />
							<span>GitHub</span>
							<ExternalLink className="h-2.5 w-2.5" />
						</a>
						<a href="/" className="text-xs text-[#9095a5] hover:text-[#1e6a8a] transition-colors">
							openviktor.com
						</a>
					</div>
				</div>
			</aside>
			<main className="flex-1 overflow-y-auto bg-[#fafcfd] p-6">
				<Outlet />
			</main>
		</div>
	);
}
