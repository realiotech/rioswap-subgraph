# RioSwap v3 Subgraph Queries

Explore key entities and practical GraphQL query patterns for the RioSwap v3 subgraph.

The RioSwap v3 subgraph indexes onchain events from the Factory and Pool contracts on Realio Network and exposes them as a GraphQL API via [The Graph](https://thegraph.com/). You can use it to query protocol metrics, pool state, swaps, token data, and liquidity position activity.

The full schema is available at [`src/v3/schema.graphql`](../src/v3/schema.graphql) in this repository.

## Endpoint
The testnet subgraph is deployed at:

```text
https://graph-node.realiostage.network/subgraphs/name/v3-testnet-subgraph
```

Query it directly with `curl`:

```bash
curl -X POST \
  https://graph-node.realiostage.network/subgraphs/name/v3-testnet-subgraph \
  -H "Content-Type: application/json" \
  -d '{"query": "{ factory(id: \"0x46fa600414d466b12b7d87baab822f8cfc6564b5\") { poolCount txCount totalVolumeUSD totalValueLockedUSD } }"}'
```

## Core Entities

| Entity                           | Description                                                                |
| -------------------------------- | -------------------------------------------------------------------------- |
| **Factory**                      | Protocol-level aggregates such as total volume, TVL, and transaction count |
| **Pool**                         | Per-pool state including liquidity, price, tick, volume, and fee tier      |
| **Token**                        | Token metadata and aggregates across all pools containing the token        |
| **Swap**                         | Individual swap events with token amounts, sender, and timestamp           |
| **Mint / Burn**                  | Liquidity provision and removal events per pool                            |
| **Collect**                      | Fee collection events per pool                                             |
| **Tick**                         | Per-tick liquidity data within a pool                                      |
| **PoolDayData / PoolHourData**   | Time-series snapshots for pool metrics                                     |
| **TokenDayData / TokenHourData** | Time-series snapshots for token metrics                                    |
| **UniswapDayData**               | Protocol-wide daily snapshot (volume, fees, TVL, tx count)                 |

## Common Query Patterns
## Protocol-wide metrics
Query `factory` to retrieve aggregate protocol data. The factory contract address on Realio Network testnet is `0x46fa600414d466b12b7d87baab822f8cfc6564b5` (see [`v3-subgraph.testnet.yaml`](../v3-subgraph.testnet.yaml)):

```graphql
{
  factory(id: "0x46fa600414d466b12b7d87baab822f8cfc6564b5") {
    poolCount
    txCount
    totalVolumeUSD
    totalValueLockedUSD
  }
}
```

## Pool state
Query a specific pool by pool address:

```graphql
{
  pool(id: "0x...") {
    token0 { symbol }
    token1 { symbol }
    feeTier
    liquidity
    sqrtPrice
    tick
    totalValueLockedUSD
  }
}
```

## Recent swaps
Query swap events ordered by timestamp:

```graphql
{
  swaps(
    first: 20
    orderBy: timestamp
    orderDirection: desc
    where: { pool: "0x..." }
  ) {
    sender
    amount0
    amount1
    amountUSD
    timestamp
  }
}
```

## Token data
Query aggregate token metrics:

```graphql
{
  token(id: "0x...") {
    symbol
    name
    decimals
    volumeUSD
    totalValueLockedUSD
    poolCount
  }
}
```

## Mints and burns
Query liquidity mint and burn events for a pool:

```graphql
{
  mints(
    first: 20
    orderBy: timestamp
    orderDirection: desc
    where: { pool: "0x..." }
  ) {
    owner
    amount
    amount0
    amount1
    amountUSD
    tickLower
    tickUpper
    timestamp
  }
  burns(
    first: 20
    orderBy: timestamp
    orderDirection: desc
    where: { pool: "0x..." }
  ) {
    owner
    amount
    amount0
    amount1
    amountUSD
    tickLower
    tickUpper
    timestamp
  }
}
```

## Fee collections
Query collect events for a pool:

```graphql
{
  collects(
    first: 20
    orderBy: timestamp
    orderDirection: desc
    where: { pool: "0x..." }
  ) {
    owner
    amount0
    amount1
    amountUSD
    tickLower
    tickUpper
    timestamp
  }
}
```

## Tick data
Query tick liquidity data for a pool:

```graphql
{
  ticks(
    first: 100
    orderBy: tickIdx
    orderDirection: asc
    where: { pool: "0x..." }
  ) {
    tickIdx
    liquidityGross
    liquidityNet
    price0
    price1
  }
}
```

## Pool day / hour data
Query historical pool snapshots:

```graphql
{
  poolDayDatas(
    first: 30
    orderBy: date
    orderDirection: desc
    where: { pool: "0x..." }
  ) {
    date
    tvlUSD
    volumeUSD
    txCount
    open
    high
    low
    close
  }
}
```

## Token day / hour data
Query historical token snapshots:

```graphql
{
  tokenDayDatas(
    first: 30
    orderBy: date
    orderDirection: desc
    where: { token: "0x..." }
  ) {
    date
    priceUSD
    volumeUSD
    totalValueLockedUSD
    open
    high
    low
    close
  }
}
```

## Protocol daily data
Query protocol-wide daily snapshots:

```graphql
{
  uniswapDayDatas(
    first: 30
    orderBy: date
    orderDirection: desc
  ) {
    date
    volumeUSD
    feesUSD
    tvlUSD
    txCount
  }
}
```

## Pagination
The Graph returns up to 1000 entities per request. Use `first` and `skip` to iterate through large result sets:

```graphql
{
  pools(first: 1000, skip: 0, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    totalValueLockedUSD
  }
}
```

Increase `skip` by 1000 for each subsequent request until fewer than 1000 results are returned.

## Historical Data
Query historical state at a specific block:

```graphql
{
  factory(
    id: "0x46fa600414d466b12b7d87baab822f8cfc6564b5"
    block: { number: 4789189 }
  ) {
    poolCount
    totalVolumeUSD
    totalValueLockedUSD
  }
}
```

For trend analysis, query daily or hourly entities such as `PoolDayData` and `TokenDayData`.

## Deployment
For instructions on running a graph-node and deploying this subgraph to testnet or mainnet, see the [README](../README.md).
