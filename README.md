<p align="center">
  <img src="docs/assets/banner.jpg" alt="OpenViktor — Hire your AI employee. For any role." width="100%"/>
</p>

<p align="center">
  <a href="https://github.com/zggf-zggf/openviktor/actions/workflows/ci.yml"><img src="https://github.com/zggf-zggf/openviktor/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/zggf-zggf/openviktor?color=1e6a8a" alt="MIT License"></a>
  <a href="https://github.com/zggf-zggf/openviktor/issues"><img src="https://img.shields.io/github/issues/zggf-zggf/openviktor?color=4da8b5" alt="Issues"></a>
  <a href="https://github.com/zggf-zggf/openviktor/stargazers"><img src="https://img.shields.io/github/stars/zggf-zggf/openviktor?style=flat&color=1e6a8a" alt="Stars"></a>
  <img src="https://img.shields.io/badge/runtime-Bun-5bbcd6" alt="Bun">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript Strict">
  <img src="https://img.shields.io/badge/self--hosted-Docker%20Compose-2496ed?logo=docker&logoColor=white" alt="Docker Compose">
</p>

<p align="center">
  <strong>An autonomous AI agent that joins your Slack workspace as a team member.</strong><br/>
  Open-source. Self-hosted. Extensible. MIT-licensed.<br/><br/>
  <a href="https://matijacniacki.com/blog/openviktor">Read the story behind OpenViktor</a> · <a href="docs/self-hosting.md">Self-Hosting Guide</a> · <a href="https://github.com/zggf-zggf/openviktor/issues">Report a Bug</a>
</p>

---

## What is OpenViktor?

OpenViktor is a fully autonomous AI teammate that lives in Slack. It reads messages, runs tools, learns from your team, and takes action — without leaving the chat. Think of it as hiring an AI employee that actually integrates into how your team already works.

Built as an open-source alternative to [getviktor.com](https://getviktor.com).

## Features

**Agent Runtime** — Multi-provider LLM engine (Claude, GPT, Gemini) with automatic retries, cost tracking, and usage limits per workspace.

**20+ Built-in Tools** — File operations, bash execution, browser automation, git, grep, AI-powered search, Slack admin, image generation, and more. Every tool is sandboxed with a permission system.

**Persistent Memory** — Learns from your team's conversations. Accumulates knowledge over time and recalls it when relevant.

**Proactive Behaviors** — Scheduled heartbeats, workflow discovery, channel introductions, and onboarding DMs for new workspaces. It doesn't just respond — it initiates.

**Integrations** — Connects to GitHub, Linear, and 2,000+ apps via Pipedream. Add custom API integrations through natural language.

**Admin Dashboard** — Full management UI: monitor runs, inspect threads, manage tools, track usage and costs, configure integrations.

**Multi-Workspace** — OAuth-based workspace connections with per-workspace isolation, usage limits, and cost controls.

**Self-Hosted** — Runs entirely on your infrastructure. Docker Compose, PostgreSQL, Redis. No data leaves your network.

## Quick Start

```bash
git clone https://github.com/zggf-zggf/openviktor.git
cd openviktor
./scripts/setup.sh
```

The setup script handles dependencies, database, and config. You'll need:

- [Bun](https://bun.sh) >= 1.2
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- A [Slack app](https://api.slack.com/apps) with Socket Mode
- An [Anthropic API key](https://console.anthropic.com/)

<details>
<summary><strong>Manual setup</strong></summary>

```bash
bun install
cp docker/.env.example .env
# Edit .env with your credentials
docker compose -f docker/docker-compose.yml up -d
bun run db:generate
bun run db:migrate
bun run dev
```

</details>

> For production deployment, see the [Self-Hosting Guide](docs/self-hosting.md).

## Architecture

```
openviktor/
├── apps/
│   ├── bot/              # Slack bot + agent runtime
│   ├── web/              # Admin dashboard (React + Vite)
│   └── landing/          # Landing page (Next.js)
├── packages/
│   ├── db/               # PostgreSQL schema (Prisma)
│   ├── shared/           # Types, config, logger, errors
│   ├── tools/            # Tool registry + executors
│   └── integrations/     # External service clients
└── docker/               # Docker Compose for self-hosting
```

| Component | Technology |
|-----------|-----------|
| Runtime | **Bun** |
| Language | **TypeScript** (strict) |
| Database | **PostgreSQL 16** + Prisma |
| Cache | **Redis 7** |
| LLM | **Claude** / GPT / Gemini |
| Slack | **Bolt SDK** (Socket Mode) |
| Build | **Turborepo** |
| Lint/Format | **Biome** |
| Test | **Vitest** |
| Deploy | **Docker Compose** |

## Development

```bash
bun install                                          # Install dependencies
docker compose -f docker/docker-compose.yml up -d    # Start PostgreSQL + Redis
bun run db:generate                                  # Generate Prisma client
bun run db:migrate                                   # Run migrations
bun run dev                                          # Start all services
bun run test                                         # Run tests
bun run lint                                         # Lint with Biome
bun run typecheck                                    # TypeScript strict check
```

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — use it however you want.
