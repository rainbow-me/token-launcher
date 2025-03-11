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