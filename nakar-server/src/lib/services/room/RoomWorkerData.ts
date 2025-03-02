import { z } from 'zod';
import { MutableGraph } from './graph/MutableGraph';

export interface RoomWorkerData {
  roomId: string;
  graph: z.infer<typeof MutableGraph.schema>;
}
