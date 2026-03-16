import { Cpu } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";

export function LoginPage() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await login(username, password);
			navigate("/dashboard");
		} catch (err) {
			if (err instanceof Error && err.message.includes("401")) {
				setError("Invalid credentials");
			} else {
				setError("Login failed. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-slate-50">
			<div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
				<div className="mb-6 flex items-center justify-center gap-2">
					<Cpu className="h-8 w-8 text-primary-600" />
					<span className="text-2xl font-bold tracking-tight">OpenViktor</span>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="username" className="block text-sm font-medium text-slate-700">
							Username
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
						/>
					</div>
					<div>
						<label htmlFor="password" className="block text-sm font-medium text-slate-700">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
						/>
					</div>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
