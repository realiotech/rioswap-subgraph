# RioSwap Subgraph

This subgraph indexes onchain events emitted by the RioSwap v3 Factory and Pool contracts on Realio Network. It tracks pool creation, swaps, mints, burns, and fee collections, and aggregates them into protocol, pool, and token-level metrics such as volume, TVL, and fees. The indexed data is exposed as a GraphQL API that can be queried directly.

## Docs

- [Queries](docs/subgraph.md) — core entities and GraphQL query patterns
- [Deployment](docs/deploy.md) — running a graph-node and deploying to testnet/mainnet
