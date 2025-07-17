export type D3Node = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  radius: number;
  locked: boolean;
  labels: string[];
  title: string;
  customBackgroundColor: string | null;
  customTitleColor: string | null;
  compressedCount: number;
};
