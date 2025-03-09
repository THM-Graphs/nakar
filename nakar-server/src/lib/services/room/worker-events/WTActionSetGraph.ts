import z from 'zod';
import { MutableGraph } from '../graph/MutableGraph';

export interface WTActionSetGraph {
  type: 'WTActionSetGraph';
  graph: z.infer<typeof MutableGraph.schema>;
}
