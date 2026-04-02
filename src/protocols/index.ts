import { Protocol, type ProtocolAdapter } from '../types/index';
import { clanker } from './clanker';
import { liquid } from './liquid';

export const protocols: Record<Protocol, ProtocolAdapter> = {
  [Protocol.Clanker]: clanker,
  [Protocol.Liquid]: liquid,
};
