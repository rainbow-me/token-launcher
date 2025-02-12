import { ethers } from 'ethers';
export declare const getFactoryContract: (wallet: ethers.Signer) => Promise<ethers.Contract>;
export declare const deployFactoryContract: (signer: ethers.Signer) => Promise<string>;
