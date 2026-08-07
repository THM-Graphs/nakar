import { ColorDto } from "api-client";

export type SVGGraphRendererNode = {
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
  customColor: ColorDto | null;
  clusterSize: number;
  notesCount: number;
  coverImageUrl: URL | null;
};
