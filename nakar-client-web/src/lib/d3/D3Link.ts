import { Edge } from "../../../src-gen";
import { D3Node } from "./D3Node.ts";

export type D3Link = {
  id: string;
  source: D3Node;
  target: D3Node;
  native: Edge;
};
