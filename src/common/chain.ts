import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

const WETH = '0x4200000000000000000000000000000000000006'.toLowerCase()
const USDCE = '0xF1815bd50389c46847f0Bda824eC8da914045D14'.toLowerCase()
const USDT0 = '0x0200C29006150606B650577BBE7B6248F58470c1'.toLowerCase()
const WETH_USDCE_POOL = '0xd5aa1bd330a94332f071da5bb3651ec372ea6926'.toLowerCase()

const TUSDC = '0x5625c693E2E0BdF58E5399490B6AA28be60ddc2F'.toLowerCase()
const TWBTC = '0x102E18fbeb49A5DEa4A3bD37E19363d3ba3310cD'.toLowerCase()
const IUSDC = '0xb6e487C2864E8b075a5871d3AcaD7a7129F32c5c'.toLowerCase()
const DSTRX = '0x9b81cFe34C25131DaE2248c5e508829a3b52518b'.toLowerCase()
const TSEC = '0xc11b69BEf1fafa4917902Ca7BCf578B9919e8896'.toLowerCase()
const TFRAC = '0x4Bf2E94ae209B9B181B6F8Bc586036649577776A'.toLowerCase()
const TETH = '0x15f096e47544997904E45B9EA6E70c2575cB0215'.toLowerCase()

export const FACTORY_ADDRESS = '0x46FA600414d466b12B7D87BAAb822F8cFc6564b5'

export const REFERENCE_TOKEN = WETH
export const STABLE_TOKEN_POOL = WETH_USDCE_POOL

export const TVL_MULTIPLIER_THRESHOLD = '1'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
// also used as the pool-creation allow-list: PoolCreated events where token0 or
// token1 is not in this list are skipped (not indexed) in factory.ts
export const WHITELIST_TOKENS: string[] = [TUSDC, TWBTC, IUSDC, DSTRX, TSEC, TFRAC, TETH]

export const STABLE_COINS: string[] = [USDCE, USDT0]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
