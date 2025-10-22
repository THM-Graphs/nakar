import { Color } from "../../src-gen";

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
  customColor: Color | null;
  clusterSize: number;
  notesCount: number;
};
