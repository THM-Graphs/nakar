import type { SMap } from '../../tools/Map';

export interface CanvasEventGraphTableChanged {
  type: 'CanvasEventGraphTableChanged';
  canvasId: string;
  table: SMap<string, unknown>[];
}
