import type { MutableGraph } from '../graph/MutableGraph';

export interface CanvasEventGraphElementsChanged {
  type: 'CanvasEventGraphElementsChanged';
  canvasId: string;
  graph: MutableGraph;
  nodesAdded: number;
  edgesAdded: number;
}
