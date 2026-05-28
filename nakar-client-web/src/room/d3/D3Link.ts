import { D3Node } from "./D3Node.ts";
import { ColorDto } from "api-client";

export type D3Link = {
  id: string;
  source: D3Node;
  target: D3Node;
  width: number;
  type: string;
  clusterSize: number;
  isLoop: boolean;
  parallelCount: number;
  parallelIndex: number;
  customColor: ColorDto | null;
};
