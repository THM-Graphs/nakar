import type { SMap } from '../../map/Map';

export interface CanvasEventGraphTableChanged {
  type: 'CanvasEventGraphTableChanged';
  canvasId: string;
  table: SMap<string, unknown>[];
}
