import z from 'zod';
import { MutableGraph } from '../../room/graph/MutableGraph';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: z.infer<typeof MutableGraph.schema>;
}
