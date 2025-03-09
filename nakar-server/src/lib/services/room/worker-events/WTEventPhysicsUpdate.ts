import z from 'zod';
import { MutableGraph } from '../graph/MutableGraph';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: z.infer<typeof MutableGraph.schema>;
}
