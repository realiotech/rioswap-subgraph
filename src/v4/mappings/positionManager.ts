// rioswap: tracks PositionManager NFTs so wallets can list their v4
// positions; upstream's PositionManager mapping isn't vendored.

import { BigInt, Bytes } from '@graphprotocol/graph-ts'

import { Transfer } from '../../../generated/PositionManager/PositionManager'
import { ModifyLiquidity as ModifyLiquidityEvent } from '../../../generated/PoolManager/PoolManager'
import { V4Position } from '../../../generated/schema'
import { SubgraphConfig } from '../utils/chains'
import { ZERO_BI } from '../utils/constants'

export function handleTransfer(event: Transfer): void {
  const id = event.params.id.toString()
  let position = V4Position.load(id)
  if (position === null) {
    position = new V4Position(id)
    position.tokenId = event.params.id
    position.liquidity = ZERO_BI
    position.createdAtTimestamp = event.block.timestamp
  }
  position.owner = event.params.to
  position.save()
}

/**
 * PositionManager modifies liquidity with the token id as the salt; the
 * mint's Transfer comes earlier in the same transaction.
 */
export function updatePositionLiquidity(event: ModifyLiquidityEvent, config: SubgraphConfig): void {
  if (event.params.sender.toHexString() != config.positionManagerAddress) return
  // salt is big-endian; fromUnsignedBytes reads little-endian
  const tokenId = BigInt.fromUnsignedBytes(Bytes.fromUint8Array(event.params.salt.slice(0).reverse()))
  const position = V4Position.load(tokenId.toString())
  if (position === null) return
  position.pool = event.params.id.toHexString()
  position.tickLower = BigInt.fromI32(event.params.tickLower)
  position.tickUpper = BigInt.fromI32(event.params.tickUpper)
  position.liquidity = position.liquidity.plus(event.params.liquidityDelta)
  position.save()
}
