import { LaunchTokenParams } from '../types';
export declare const predictTokenAddress: (params: Omit<LaunchTokenParams, 'amountIn' | 'initialTick'>) => Promise<string>;
