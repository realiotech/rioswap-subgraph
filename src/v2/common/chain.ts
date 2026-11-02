import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

// rioswap: Realio testnet (chain 3300). Uniswap v2 as deployed by rioswap-v3's
// packages/contracts/scripts/deploy-v2.ts; upstream ships one of these files
// per network under config/<network>/chain.ts.
//
// Realio has no stablecoin/WRIO v2 pair to price the native token from, so
// the USD fields stay zero, as they do for v3 here; the app prices pairs from
// their reserves itself.

export const FACTORY_ADDRESS = '0xF1A8079aAbE5b80c7A558535d284aF0193Fc2c7E'

const WRIO = '0x138d5acba1d348ad42cd5b93cf539eb55d7f9472'

export const REFERENCE_TOKEN = WRIO
export const STABLE_TOKEN_PAIRS: string[] = []

// token where amounts should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  WRIO,
  '0x5625c693e2e0bdf58e5399490b6aa28be60ddc2f', // tUSDC
  '0x15f096e47544997904e45b9ea6e70c2575cb0215', // tETH
  '0x102e18fbeb49a5dea4a3bd37e19363d3ba3310cd', // tWBTC
]

export const STABLECOINS: string[] = ['0x5625c693e2e0bdf58e5399490b6aa28be60ddc2f'] // tUSDC

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('0')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('0')

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []

export const SKIP_TOTAL_SUPPLY: string[] = []
