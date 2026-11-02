import { Address, BigDecimal, BigInt, dataSource } from '@graphprotocol/graph-ts'

import { NativeTokenDetails } from './nativeTokenDetails'
import { StaticTokenDefinition } from './staticTokenDefinition'

export enum ChainId {
  SEPOLIA = 11155111,
}

// assemblyscript does not support string enums, hence these constants
const SEPOLIA_NETWORK_NAME = 'sepolia'
const UNICHAIN_SEPOLIA_NETWORK_NAME = 'unichain-sepolia'
const ARBITRUM_SEPOLIA_NETWORK_NAME = 'arbitrum-sepolia'
const BASE_SEPOLIA_NETWORK_NAME = 'base-sepolia'
const ARBITRUM_ONE_NETWORK_NAME = 'arbitrum-one'
const BASE_NETWORK_NAME = 'base'
const MATIC_NETWORK_NAME = 'matic'
const BSC_NETWORK_NAME = 'bsc'
const OPTIMISM_NETWORK_NAME = 'optimism'
const AVALANCHE_NETWORK_NAME = 'avalanche'
const WORLDCHAIN_MAINNET_NETWORK_NAME = 'worldchain-mainnet'
const ZORA_MAINNET_NETWORK_NAME = 'zora-mainnet'
const MAINNET_NETWORK_NAME = 'mainnet'
const BLAST_MAINNET_NETWORK_NAME = 'blast-mainnet'
const UNICHAIN_MAINNET_NETWORK_NAME = 'unichain'
const SONEIUM_MAINNET_NETWORK_NAME = 'soneium-mainnet'
const CELO_NETWORK_NAME = 'celo'
const MONAD_NETWORK_NAME = 'monad'
const XLAYER_MAINNET_NETWORK_NAME = 'xlayer-mainnet'
const MEGAETH_MAINNET_NETWORK_NAME = 'megaeth-mainnet'
const LINEA_MAINNET_NETWORK_NAME = 'linea'
const TEMPO_NETWORK_NAME = 'tempo'
const ROBINHOOD_MAINNET_NETWORK_NAME = 'robinhood-mainnet'
const INK_NETWORK_NAME = 'ink'
const ARC_MAINNET_NETWORK_NAME = 'arc-mainnet'

// Note: All token and pool addresses should be lowercased!
export class SubgraphConfig {
  // deployment address
  poolManagerAddress: string

  // rioswap: the PositionManager whose ModifyLiquidity calls carry a
  // position's token id as the salt (see mappings/positionManager.ts)
  positionManagerAddress: string

  // the address of a pool where one token is a stablecoin and the other is a
  // token that tracks the price of the native token use this to calculate the
  // price of the native token, so prefer a pool with highest liquidity
  stablecoinWrappedNativePoolId: string

  // true is stablecoin is token0, false if stablecoin is token1
  stablecoinIsToken0: boolean

  // the address of a token that tracks the price of the native token, most of
  // the time, this is a wrapped asset but could also be the native token itself
  // for some chains
  wrappedNativeAddress: string

  // the mimimum liquidity in a pool needed for it to be used to help calculate
  // token prices. for new chains, this should be initialized to ~4000 USD
  minimumNativeLocked: BigDecimal

  // list of stablecoin addresses
  stablecoinAddresses: string[]

  // a token must be in a pool with one of these tokens in order to derive a
  // price (in addition to passing the minimumEthLocked check). This is also
  // used to determine whether volume is tracked or not.
  whitelistTokens: string[]

  // token overrides are used to override RPC calls for the symbol, name, and
  // decimals for tokens. for new chains this is typically empty.
  tokenOverrides: StaticTokenDefinition[]

  // skip the creation of these pools in handlePoolCreated. for new chains this is typically empty.
  poolsToSkip: string[]

  // initialize this list of pools and token addresses on factory creation. for new chains this is typically empty.
  poolMappings: Array<Address[]>

  // native token details for the chain.
  nativeTokenDetails: NativeTokenDetails
}

// rioswap: this subgraph indexes one network, Realio testnet (chain 3300),
// which its graph-node registers as "mainnet" — the name upstream keys
// Ethereum's config on — so the config is fixed here instead of looked up
// by dataSource.network(). Uniswap v4 as deployed by rioswap-v3's
// packages/contracts/scripts/deploy-v4.ts.
const WRIO = '0x138d5acba1d348ad42cd5b93cf539eb55d7f9472'
const TUSDC = '0x5625c693e2e0bdf58e5399490b6aa28be60ddc2f'
const ADDRESS_ZERO_NATIVE = '0x0000000000000000000000000000000000000000'

export function getSubgraphConfig(): SubgraphConfig {
  return {
    poolManagerAddress: '0xd4a554f23421faf2c79c2432b2092bb1e3016258',
    positionManagerAddress: '0x38c286d406802557351ab14e352d88d7d22a7746',
    // Native RIO/tUSDC 0.3%, seeded by deploy-v4; tUSDC is currency1.
    stablecoinWrappedNativePoolId: '0x93b3e832abf4de780ef036b2885921fcd2d7f04a7bfad27198fed37891cf88f5',
    stablecoinIsToken0: false,
    wrappedNativeAddress: WRIO,
    minimumNativeLocked: BigDecimal.fromString('0'),
    stablecoinAddresses: [TUSDC],
    whitelistTokens: [
      WRIO,
      ADDRESS_ZERO_NATIVE, // native RIO
      TUSDC,
      '0x15f096e47544997904e45b9ea6e70c2575cb0215', // tETH
      '0x102e18fbeb49a5dea4a3bd37e19363d3ba3310cd', // tWBTC
    ],
    tokenOverrides: [],
    poolsToSkip: [],
    poolMappings: [],
    nativeTokenDetails: {
      symbol: 'RIO',
      name: 'Realio Network Token',
      decimals: BigInt.fromI32(18),
    },
  }
}
// Hooks that represent USD-stable <> USD-stable aggregator pools where pool price should be treated as parity.
export function getUSDStableStableHookAddresses(): string[] {
  if (dataSource.network() == TEMPO_NETWORK_NAME) {
    return ['0x7169a78a59f136876e724b648fbb339a42f46888']
  }
  return []
}

// Returns a hardcoded native token USD price for chains where native token is itself a USD stable asset.
// Returns 0 for other chains, signaling callers to derive the price normally.
export function getStaticNativePriceUSD(): BigDecimal {
  if (dataSource.network() == TEMPO_NETWORK_NAME) {
    return BigDecimal.fromString('1')
  }
  return BigDecimal.fromString('0')
}
