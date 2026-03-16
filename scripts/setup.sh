#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== OpenViktor Setup ==="
echo ""

# ─── Prerequisites ──────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo "Error: $1 is required but not installed."
    echo "Install it from: $2"
    exit 1
  fi
}

if ! command -v "bun" &> /dev/null; then
  echo "bun is not installed. Installing..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  if ! command -v "bun" &> /dev/null; then
    echo "Error: bun installation failed."
    echo "Install it manually from: https://bun.sh"
    exit 1
  fi
  echo "bun installed successfully ($(bun --version))"
fi
check_cmd "docker" "https://docs.docker.com/get-docker/"

echo "Prerequisites OK"
echo ""

# ─── .env ───────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f "docker/.env.example" ]; then
    cp docker/.env.example .env
    echo "Created .env from docker/.env.example"
    echo "Please edit .env with your Slack and Anthropic credentials."
    echo ""
  fi
fi

# Export all vars from .env so Prisma and other tools can find them
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

# ─── Dependencies ───────────────────────────────────────
echo "Installing dependencies..."
bun install

# ─── Docker ─────────────────────────────────────────────
echo ""
echo "Starting PostgreSQL and Redis..."
docker compose -f docker/docker-compose.yml up -d

echo "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U openviktor &> /dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Error: PostgreSQL failed to start within 30 seconds"
    exit 1
  fi
  sleep 1
done

# ─── Database ───────────────────────────────────────────
echo ""
echo "Generating Prisma client..."
bun run db:generate

echo "Running database migrations..."
bun run db:migrate

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Slack and Anthropic credentials"
echo "  2. Run: ./scripts/dev.sh"
echo "  3. Invite @OpenViktor to a Slack channel and mention it"
echo ""
