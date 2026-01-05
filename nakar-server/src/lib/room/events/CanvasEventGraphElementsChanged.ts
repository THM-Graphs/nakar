import type { LiveCanvasData } from '../graph/LiveCanvasData';

export interface CanvasEventGraphElementsChanged {
  type: 'CanvasEventGraphElementsChanged';
  canvasId: string;
  graph: LiveCanvasData;
  nodesAdded: number;
  edgesAdded: number;
}
