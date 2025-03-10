import { z } from 'zod';
import { MutableGraph } from '../room/graph/MutableGraph';

export interface RoomWorkerData {
  roomId: string;
  graph: z.infer<typeof MutableGraph.schema>;
}
