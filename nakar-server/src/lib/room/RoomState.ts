import { MutableGraph } from '../graph/MutableGraph';

export type RoomState =
  | { type: 'empty' }
  | { type: 'preparing'; progress: number; step: string }
  | { type: 'data'; graph: MutableGraph };
