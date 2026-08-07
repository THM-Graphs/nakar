import { SVGGraphRendererNode } from "./SVGGraphRendererNode.ts";
import { ColorDto } from "api-client";

export type SVGGraphRendererLink = {
  id: string;
  source: SVGGraphRendererNode;
  target: SVGGraphRendererNode;
  width: number;
  type: string;
  clusterSize: number;
  isLoop: boolean;
  parallelCount: number;
  parallelIndex: number;
  customColor: ColorDto | null;
};
