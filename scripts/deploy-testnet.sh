#!/usr/bin/env bash
# Builds the Realio testnet subgraph (v2 + v3 + v4) and deploys it to a
# graph-node, without CI. The node must know Realio testnet as `mainnet`
# (the manifest's network) through an RPC that keeps history back to block
# 4,789,189, e.g. ethereum=mainnet:https://realio-testnet-json.rpc.decentrio.ventures
#
#   scripts/deploy-testnet.sh            # deploy
#   scripts/deploy-testnet.sh --wait     # deploy, then wait until it's synced
#
# Environment (defaults suit a graph-node on this machine):
#   GRAPH_NODE     admin endpoint        http://localhost:8020
#   GRAPH_IPFS     its IPFS              http://localhost:5001
#   GRAPH_STATUS   index status endpoint http://localhost:8030/graphql
#   GRAPH_QUERY    query endpoint        http://localhost:8000
#   SUBGRAPH_NAME  name to deploy under  v3-testnet-subgraph
#   VERSION_LABEL  version label         the commit's short hash
set -euo pipefail

cd "$(dirname "$0")/.."

GRAPH_NODE="${GRAPH_NODE:-http://localhost:8020}"
GRAPH_IPFS="${GRAPH_IPFS:-http://localhost:5001}"
GRAPH_STATUS="${GRAPH_STATUS:-http://localhost:8030/graphql}"
GRAPH_QUERY="${GRAPH_QUERY:-http://localhost:8000}"
SUBGRAPH_NAME="${SUBGRAPH_NAME:-v3-testnet-subgraph}"
VERSION_LABEL="${VERSION_LABEL:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)}"
MANIFEST=v3-subgraph.testnet.yaml

echo "==> deploying $SUBGRAPH_NAME ($VERSION_LABEL) to $GRAPH_NODE"

[ -d node_modules ] || npm ci

npx graph codegen "$MANIFEST"
npx graph build "$MANIFEST"

# Creating a name that already exists fails; a redeploy just adds a version.
if ! out=$(npx graph create --node "$GRAPH_NODE" "$SUBGRAPH_NAME" 2>&1); then
  if echo "$out" | grep -qi "already exists"; then
    echo "==> $SUBGRAPH_NAME already exists, deploying a new version"
  else
    echo "$out" >&2
    exit 1
  fi
fi

out=$(npx graph deploy --node "$GRAPH_NODE" --ipfs "$GRAPH_IPFS" --version-label "$VERSION_LABEL" "$SUBGRAPH_NAME" "$MANIFEST" 2>&1) || {
  echo "$out" >&2
  exit 1
}
echo "$out" | grep -E "Build completed|Deployed" || true
DEPLOYMENT=$(echo "$out" | sed -n 's/.*Build completed: \(Qm[1-9A-HJ-NP-Za-km-z]*\).*/\1/p' | tail -1)

echo "==> query endpoint: $GRAPH_QUERY/subgraphs/name/$SUBGRAPH_NAME"
[ "${1:-}" = "--wait" ] || exit 0
[ -n "$DEPLOYMENT" ] || { echo "couldn't read the deployment id to wait on" >&2; exit 1; }

# It indexes from scratch (v3 from block 4,789,189): wait for it to reach
# the chain head, or stop at a fatal error.
query="{\"query\":\"{indexingStatuses(subgraphs:[\\\"$DEPLOYMENT\\\"]){health synced fatalError{message} chains{latestBlock{number} chainHeadBlock{number}}}}\"}"
while :; do
  status=$(curl -s -X POST -H 'content-type: application/json' --data "$query" "$GRAPH_STATUS")
  latest=$(echo "$status" | sed -n 's/.*"latestBlock":{"number":"\([0-9]*\)".*/\1/p')
  head=$(echo "$status" | sed -n 's/.*"chainHeadBlock":{"number":"\([0-9]*\)".*/\1/p')
  echo "    $(date +%H:%M:%S) block ${latest:-?} / ${head:-?}"
  if echo "$status" | grep -q '"health":"failed"'; then
    echo "==> indexing failed: $status" >&2
    exit 1
  fi
  if echo "$status" | grep -q '"synced":true'; then
    echo "==> synced"
    break
  fi
  sleep 30
done

# The three versions answer: v3 pools, the v2 pair, the v4 pools.
curl -s -X POST -H 'content-type: application/json' \
  --data '{"query":"{ _meta { block { number } hasIndexingErrors } pools(first: 1) { id } pairs { id } v4Pools { id } }"}' \
  "$GRAPH_QUERY/subgraphs/name/$SUBGRAPH_NAME"
echo
