import { NMNetwork } from './NMNetwork';
import { NMMetrics } from './NMMetrics';

export interface NMAPIResponse {
  overall_metrics: NMMetrics;
  networks: NMNetwork[];
}
