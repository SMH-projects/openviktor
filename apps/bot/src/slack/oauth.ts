import { createHmac, randomBytes } from "node:crypto";
import type { PrismaClient } from "@openviktor/db";
import type { EnvConfig, Logger } from "@openviktor/shared";
import { encrypt } from "@openviktor/shared";
import { WebClient } from "@slack/web-api";
import type { ConnectionManager } from "./connection-manager.js";

const OAUTH_SCOPES = [
	"app_mentions:read",
	"channels:history",
	"channels:join",
	"channels:read",
	"chat:write",
	"files:read",
	"files:write",
	"groups:history",
	"groups:read",
	"im:history",
	"im:read",
	"im:write",
	"mpim:history",
	"mpim:read",
	"reactions:read",
	"reactions:write",
	"users:read",
	"team:read",
].join(",");

export interface OAuthHandlerConfig {
	config: EnvConfig;
	prisma: PrismaClient;
	connectionManager: ConnectionManager;
	logger: Logger;
}

function signSessionJwt(payload: Record<string, unknown>, secret: string): string {
	const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
	const now = Math.floor(Date.now() / 1000);
	const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + 86_400 })).toString(
		"base64url",
	);
	const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
	return `${header}.${body}.${signature}`;
}

function generateState(secret: string): string {
	const timestamp = Date.now().toString();
	const nonce = randomBytes(16).toString("hex");
	const hmac = createHmac("sha256", secret).update(`${timestamp}.${nonce}`).digest("hex");
	return `${timestamp}.${nonce}.${hmac}`;
}

function verifyState(state: string, secret: string): boolean {
	const parts = state.split(".");
	if (parts.length !== 3) return false;
	const [timestamp, nonce, hmac] = parts;

	const age = Date.now() - Number.parseInt(timestamp, 10);
	if (age > 600_000 || age < 0) return false;

	const expected = createHmac("sha256", secret).update(`${timestamp}.${nonce}`).digest("hex");
	return hmac === expected;
}

export function createOAuthHandler(deps: OAuthHandlerConfig) {
	const { config, prisma, connectionManager, logger } = deps;

	if (
		!config.SLACK_CLIENT_ID ||
		!config.SLACK_CLIENT_SECRET ||
		!config.SLACK_STATE_SECRET ||
		!config.BASE_URL ||
		!config.ENCRYPTION_KEY
	) {
		throw new Error(
			"OAuth handler requires SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_STATE_SECRET, BASE_URL, and ENCRYPTION_KEY",
		);
	}

	const clientId: string = config.SLACK_CLIENT_ID;
	const clientSecret: string = config.SLACK_CLIENT_SECRET;
	const stateSecret: string = config.SLACK_STATE_SECRET;
	const baseUrl: string = config.BASE_URL;
	const encryptionKey: string = config.ENCRYPTION_KEY;

	const redirectUri = `${baseUrl}/slack/oauth/callback`;

	async function handleInstall(_req: Request): Promise<Response> {
		const state = generateState(stateSecret);
		const authorizeUrl = new URL("https://slack.com/oauth/v2/authorize");
		authorizeUrl.searchParams.set("client_id", clientId);
		authorizeUrl.searchParams.set("scope", OAUTH_SCOPES);
		authorizeUrl.searchParams.set("redirect_uri", redirectUri);
		authorizeUrl.searchParams.set("state", state);

		return Response.redirect(authorizeUrl.toString(), 302);
	}

	async function handleCallback(req: Request): Promise<Response> {
		const url = new URL(req.url, baseUrl);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		const error = url.searchParams.get("error");

		if (error) {
			logger.warn({ error }, "OAuth install denied by user");
			return new Response(`Installation cancelled: ${error}`, { status: 400 });
		}

		if (!code || !state) {
			return new Response("Missing code or state parameter", { status: 400 });
		}

		if (!verifyState(state, stateSecret)) {
			return new Response("Invalid or expired state parameter", { status: 400 });
		}

		try {
			const slackClient = new WebClient();
			const oauthResponse = await slackClient.oauth.v2.access({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				redirect_uri: redirectUri,
			});

			if (!oauthResponse.ok || !oauthResponse.access_token || !oauthResponse.team) {
				logger.error({ response: oauthResponse }, "OAuth token exchange failed");
				return new Response("OAuth token exchange failed", { status: 500 });
			}

			const teamId = oauthResponse.team.id as string;
			const teamName = (oauthResponse.team.name as string) ?? "Unknown";
			const botUserId = oauthResponse.bot_user_id as string;
			const accessToken = oauthResponse.access_token as string;
			const refreshToken = (oauthResponse as unknown as Record<string, unknown>).refresh_token as
				| string
				| undefined;
			const installerUserId = (oauthResponse.authed_user as Record<string, unknown>)?.id as
				| string
				| undefined;

			const encryptedAccessToken = encrypt(accessToken, encryptionKey);
			const encryptedRefreshToken = refreshToken ? encrypt(refreshToken, encryptionKey) : null;

			const workspace = await prisma.workspace.upsert({
				where: { slackTeamId: teamId },
				update: {
					slackTeamName: teamName,
					slackBotToken: encryptedAccessToken,
					slackBotUserId: botUserId,
					oauthAccessToken: encryptedAccessToken,
					oauthRefreshToken: encryptedRefreshToken,
					installedBy: installerUserId,
					isActive: true,
				},
				create: {
					slackTeamId: teamId,
					slackTeamName: teamName,
					slackBotToken: encryptedAccessToken,
					slackBotUserId: botUserId,
					oauthAccessToken: encryptedAccessToken,
					oauthRefreshToken: encryptedRefreshToken,
					installedBy: installerUserId,
					isActive: true,
				},
			});

			// Register connection
			await connectionManager.connect(workspace);

			// Create installer as first member
			if (installerUserId) {
				const memberClient = new WebClient(accessToken);
				const userInfo = await memberClient.users.info({ user: installerUserId });
				const displayName = userInfo.user?.real_name ?? userInfo.user?.name ?? null;

				await prisma.member.upsert({
					where: {
						workspaceId_slackUserId: {
							workspaceId: workspace.id,
							slackUserId: installerUserId,
						},
					},
					update: { displayName },
					create: {
						workspaceId: workspace.id,
						slackUserId: installerUserId,
						displayName,
					},
				});
			}

			logger.info({ teamId, teamName, workspaceId: workspace.id }, "Workspace installed via OAuth");

			// Set session cookie and redirect to dashboard
			const jwtSecret = encryptionKey;
			const token = signSessionJwt(
				{
					sub: installerUserId ?? teamName,
					mode: "slack-oauth",
					slackUserId: installerUserId,
				},
				jwtSecret,
			);
			// Derive the web app URL from the API base URL (api.X.com → X.com)
			const webUrl = baseUrl.replace(/\/$/, "").replace(/^(https?:\/\/)api\./, "$1");
			const secure = config.NODE_ENV === "production" ? "; Secure" : "";
			const domain = new URL(baseUrl).hostname.replace(/^api\./, "");
			return new Response(null, {
				status: 302,
				headers: {
					Location: `${webUrl}/runs`,
					"Set-Cookie": `ov_session=${token}; HttpOnly; SameSite=Lax; Path=/; Domain=.${domain}; Max-Age=86400${secure}`,
				},
			});
		} catch (err) {
			logger.error({ err }, "OAuth callback failed");
			return new Response("Installation failed. Please try again.", { status: 500 });
		}
	}

	return {
		handleInstall,
		handleCallback,
	};
}
