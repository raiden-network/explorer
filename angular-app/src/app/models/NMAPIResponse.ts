import { NMNetwork } from './NMNetwork';

export interface NMAPIResponse {
  result: { [key: string]: NMNetwork | number };
}
