import { Protocol, type ProtocolAdapter } from '../types/index';
import { clanker } from './clanker';

export const protocols: Record<Protocol, ProtocolAdapter> = {
  [Protocol.Clanker]: clanker,
};
