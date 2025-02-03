import { MutableGraph } from '../graph/MutableGraph';

export type RoomState = RoomStateEmpty | RoomStatePreparing | RoomStateData;

export interface RoomStateEmpty {
  type: 'empty';
}
export interface RoomStatePreparing {
  type: 'preparing';
  progress: number;
  step: string;
}
export interface RoomStateData {
  type: 'data';
  graph: MutableGraph;
}
