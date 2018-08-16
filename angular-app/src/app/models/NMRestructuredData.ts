import {NMRestructuredNode} from './NMRestructuredNode';
import {NMRestructuredLink} from './NMRestructuredLink';

/*export interface NMRestructuredData {
  nodes: Array<any>;
  links: Array<any>;
}*/

export interface NMRestructuredData {
  nodes: Array<{id:string}>;
  links: Array<{source:string, target:string}>;
}
