import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./components/layout/app-layout";
import { capturePageView } from "./lib/posthog";
import { CompliancePage } from "./pages/compliance";
import { HealthPage } from "./pages/health";
import { IntegrationsPage } from "./pages/integrations";
import { KnowledgePage } from "./pages/knowledge";
import { LandingPage } from "./pages/landing";
import { OverviewPage } from "./pages/overview";
import { RunDetailPage } from "./pages/run-detail";
import { RunsPage } from "./pages/runs";
import { SettingsPage } from "./pages/settings";
import { TasksPage } from "./pages/tasks";
import { TeamPage } from "./pages/team";
import { ThreadsPage } from "./pages/threads";
import { ToolsPage } from "./pages/tools";
import { UsagePage } from "./pages/usage";

export function App() {
	const location = useLocation();

	useEffect(() => {
		capturePageView(window.origin + location.pathname + location.search);
	}, [location]);

	return (
		<Routes>
			<Route index element={<LandingPage />} />
			<Route path="/welcome" element={<LandingPage />} />
			<Route path="/compliance" element={<CompliancePage />} />
			<Route
				path="/login"
				Component={() => {
					window.location.href = "/slack/oauth/install";
					return null;
				}}
			/>
			<Route element={<AppLayout />}>
				<Route path="dashboard" element={<HealthPage />} />
				<Route path="overview" element={<OverviewPage />} />
				<Route path="runs" element={<RunsPage />} />
				<Route path="runs/:id" element={<RunDetailPage />} />
				<Route path="tools" element={<ToolsPage />} />
				<Route path="threads" element={<ThreadsPage />} />
				<Route path="knowledge" element={<KnowledgePage />} />
				<Route path="usage" element={<UsagePage />} />
				<Route path="tasks" element={<TasksPage />} />
				<Route path="integrations" element={<IntegrationsPage />} />
				<Route path="settings" element={<SettingsPage />} />
				<Route path="settings/team" element={<TeamPage />} />
			</Route>
		</Routes>
	);
}
