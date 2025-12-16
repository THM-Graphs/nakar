export interface CanvasEventProgressChanged {
  type: 'CanvasEventProgressChanged';
  canvasId: string;
  progress: number | null;
  message: string;
}
