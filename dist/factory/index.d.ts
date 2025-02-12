import { ethers } from 'ethers';
import { LaunchTokenParams } from '../types';
export declare const createRainbowTokenFactory: (factoryAddress: string) => {
    launchRainbowSuperTokenAndBuy(params: LaunchTokenParams): Promise<ethers.TransactionResponse>;
    predictTokenAddress(params: Omit<LaunchTokenParams, 'amountIn' | 'initialTick'>): Promise<string>;
};
export type RainbowTokenFactory = ReturnType<typeof createRainbowTokenFactory>;
export * from './launchToken';
export * from './predictAddress';
