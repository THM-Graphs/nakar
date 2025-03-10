import { MutableGraph } from '../graph/MutableGraph';
import z from 'zod';

export interface RSEventRoomPhysicsUpdated {
  roomId: string;
  graph: z.infer<typeof MutableGraph.schema>;
}
