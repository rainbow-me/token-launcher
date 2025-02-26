import { Wallet } from '@ethersproject/wallet'
import { getRainbowSuperTokenFactory } from './getRainbowSuperTokenFactory'
import { SDKConfig } from '../types'
interface FeeConfig {
  creatorLPFeeBps: number
  protocolBaseBps: number
  creatorBaseBps: number
  airdropBps: number
  hasAirdrop: boolean
  feeToken: string
  creator: string
}

interface PoolConfig {
  poolFee: number    // The fee tier for the Uniswap V3 pool
  tickSpacing: number // The corresponding tick spacing
}

// Standard Uniswap V3 fee tier to tick spacing mapping
const FEE_TO_TICK_SPACING: { [fee: number]: number } = {
  100: 1,    // 0.01%
  500: 10,   // 0.05%
  3000: 60,  // 0.3%
  10000: 200 // 1%
}

export async function getFactoryConfig(wallet: Wallet, config: SDKConfig): Promise<FeeConfig> {
  const factory = await getRainbowSuperTokenFactory(wallet, config)
  const factoryConfig = await factory.defaultFeeConfig()
  return {
    creatorLPFeeBps: factoryConfig.creatorLPFeeBps,
    protocolBaseBps: factoryConfig.protocolBaseBps,
    creatorBaseBps: factoryConfig.creatorBaseBps,
    airdropBps: factoryConfig.airdropBps,
    hasAirdrop: factoryConfig.hasAirdrop,
    feeToken: factoryConfig.feeToken,
    creator: factoryConfig.creator
  }
}

export async function getPoolConfig(wallet: Wallet, config: SDKConfig): Promise<PoolConfig> {
  const factory = await getRainbowSuperTokenFactory(wallet, config);
  const factoryConfig = await factory.defaultFeeConfig()
  
  // Calculate pool fee based on fee config
  const poolFee = factoryConfig.protocolBaseBps * 100 // Convert basis points to fee units
  
  // Get corresponding tick spacing
  const tickSpacing = FEE_TO_TICK_SPACING[poolFee]
  if (!tickSpacing) {
    throw new Error(`Unsupported fee amount: ${poolFee}`)
  }

  return {
    poolFee,
    tickSpacing
  }
}