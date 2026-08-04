# RioSwap V3 subgraph

Indexes Uniswap V3-style pools on the Realio chain (Factory `PoolCreated` → per-pool
`Swap`/`Mint`/`Burn`/`Collect`). Two subgraph variants live in `src/`:

- `src/v3` — full pool/swap/tick data, manifest: `v3-subgraph.testnet.yaml`
- `src/v3-tokens` — token-centric interval data, manifest:
  `v3-tokens-subgraph.testnet.template.yaml` (needs its `{{network}}`/`{{factory}}`/
  `{{startblock}}` placeholders rendered before use)

## Required setup: `src/common/chain.ts`

Every mapping file (`factory.ts`, `mint.ts`, `swap.ts`, `pricing.ts`, ...) imports
network config from `src/common/chain.ts`. **This file is not committed with default
values** — it must exist with real addresses before `codegen`/`build` will compile.
It exports:

- `FACTORY_ADDRESS` — must match the `address` used in the manifest's `Factory`
  data source, or the `Factory` entity ID won't line up with the real contract.
- `WHITELIST_TOKENS` — token allow-list. In `src/v3/mappings/factory.ts` and
  `src/v3-tokens/mappings/factory.ts`, `handlePoolCreated` skips indexing entirely
  (no `Pool`/`Token` entities, no `Pool` template) unless **both** `token0` and
  `token1` are in this list. It's also the whitelist used for TVL/pricing
  (`whitelistPools`).
- `REFERENCE_TOKEN`, `STABLE_TOKEN_POOL`, `STABLE_COINS` — drive
  `getEthPriceInUSD()` in `src/common/pricing.ts`. Keep these in sync with
  whatever `WHITELIST_TOKENS` actually contains for the current deployment.
- `POOL_MAPINGS`, `SKIP_POOLS`, `MATURE_MARKET`, `TVL_MULTIPLIER_THRESHOLD`,
  `MINIMUM_NATIVE_LOCKED`, `ROLL_DELETE_*` — see usages in `src/common/backfill.ts`
  and `src/v3-tokens/mappings/*.ts`.

## Local graph-node

Run a local graph-node + IPFS + Postgres stack (standard graph-node
`docker/docker-compose.yml`, e.g. from a checkout of
[graphprotocol/graph-node](https://github.com/graphprotocol/graph-node)):

```yaml
services:
  graph-node:
    image: graphprotocol/graph-node
    ports:
      - '8000:8000' # GraphQL HTTP
      - '8001:8001' # GraphQL WS
      - '8020:8020' # JSON-RPC admin (create/deploy)
      - '8030:8030' # indexing status API
      - '8040:8040' # metrics
    depends_on: [ipfs, postgres]
    environment:
      postgres_host: postgres
      postgres_user: graph-node
      postgres_pass: let-me-in
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'mainnet:<REALIO_RPC_URL>' # one provider per network alias only
      GRAPH_LOG: info
  ipfs:
    image: ipfs/kubo:v0.17.0
    ports: ['5001:5001']
    volumes: ['./data/ipfs:/data/ipfs']
  postgres:
    image: postgres
    ports: ['5432:5432']
    environment:
      POSTGRES_USER: graph-node
      POSTGRES_PASSWORD: let-me-in
      POSTGRES_DB: graph-node
    volumes: ['./data/postgres:/var/lib/postgresql/data']
```

```bash
docker compose up -d
```

Notes:

- **Don't mix RPC providers under the same network alias.** If `./data/postgres`
  already has chain state from a *different* chain sharing the `mainnet` alias
  (e.g. leftover from indexing real Ethereum), graph-node will refuse to advance
  the block ingestor (`Provider went backwards` warning, looping forever) and
  admin RPC calls will hang and eventually `ECONNRESET`. Fix: stop the stack,
  wipe `./data/postgres` and `./data/ipfs`, and start fresh so the chain's stored
  head matches the actual RPC.
- **Give graph-node ~40s after startup** before calling `create`/`deploy`. It
  tries to fetch the chain genesis block on boot (30s timeout before falling
  back), and the JSON-RPC admin server (`:8020`) only starts listening after
  that. Calling it too early also produces `ECONNRESET`. Wait for
  `Starting JSON-RPC admin server` in `docker logs <graph-node-container>`.

## Create and deploy

`v3-subgraph.testnet.yaml` is deployed as-is (not templated) — before deploying,
hand-edit its `network`/`address`/`startBlock` to match the target chain/factory.

```bash
npm install
npm run codegen && npm run build
```

- `npm run create-testnet` / `npm run deploy-testnet` / `npm run create-mainnet`
  / `npm run deploy-mainnet` target `http://graph-node:8020/` — the
  docker-compose **internal network alias**. These only resolve when run from a
  container on the same docker network (this is what `docker/start` +
  `docker/testnet.Dockerfile` / `docker/mainnet.Dockerfile` do).
- Running from your host machine directly (outside that docker network), use
  `localhost` instead, since `graph-node` won't resolve (`ENOTFOUND`):

  ```bash
  npx graph create --node http://localhost:8020/ v3-testnet-subgraph
  npx graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001/ \
    --version-label v.0.0.1 v3-testnet-subgraph v3-subgraph.testnet.yaml
  ```

Check indexing progress:

```bash
curl -s -X POST http://localhost:8030/graphql -H 'Content-Type: application/json' \
  --data '{"query":"{ indexingStatuses { synced health fatalError { message } chains { chainHeadBlock { number } latestBlock { number } } } }"}'
```

## Real deployments (staging/prod)

Pushing to `stage`/`main` triggers `.github/workflows/testnet.yaml` /
`mainnet.yaml`: builds `docker/testnet.Dockerfile` / `mainnet.Dockerfile` (which
run `npm run codegen && npm run build` then `create-*`/`deploy-*` against the
in-cluster `graph-node:8020` alias) and updates the `realiotech/gitops` manifests.
Manual `npm run deploy-testnet`/`deploy-mainnet` from a laptop against a public
domain generally won't work — graph-node's admin RPC (`:8020`) and IPFS `add`
are intentionally not exposed to the public internet; only the GraphQL query
endpoint is.

- We should run mainnet/testnet node on separate servers.
