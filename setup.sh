#!/usr/bin/env bash
# Countries-GraphQL-Framework — local setup
#
# Installs the runtime + GraphQL dependencies needed to run the dev server
# and issue GraphQL queries from this repo. Idempotent — safe to re-run.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

if [ -t 1 ]; then
  BOLD=$(tput bold); RED=$(tput setaf 1); GRN=$(tput setaf 2)
  CYA=$(tput setaf 6); RST=$(tput sgr0)
else
  BOLD=""; RED=""; GRN=""; CYA=""; RST=""
fi

step() { printf "\n${BOLD}${CYA}▸ %s${RST}\n" "$*"; }
ok()   { printf "  ${GRN}✓${RST} %s\n" "$*"; }
fail() { printf "  ${RED}✗${RST} %s\n" "$*" >&2; exit 1; }

# 1. Node 18+ (required for native fetch + AbortSignal.timeout)
step "Checking Node.js (>= 18 required)"
command -v node >/dev/null 2>&1 || fail "node not found. Install Node 18+ from https://nodejs.org/ (or via nvm/brew) and re-run."
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[ "$NODE_MAJOR" -ge 18 ] || fail "Node $(node -v) is too old. Need >= 18."
ok "Node $(node -v)"

# 2. npm (ships with Node, but verify)
step "Checking npm"
command -v npm >/dev/null 2>&1 || fail "npm not found. Reinstall Node from https://nodejs.org/."
ok "npm $(npm -v)"

# 3. install GraphQL dependencies into node_modules/
step "Installing GraphQL dependencies"
npm install --no-audit --no-fund
ok "Installed: graphql, graphql-request (see package.json)"

printf "\n${BOLD}${GRN}Setup complete.${RST}  Run the app with: ${BOLD}npm run dev${RST}\n\n"
