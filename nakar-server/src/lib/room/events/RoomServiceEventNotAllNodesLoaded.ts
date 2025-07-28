export interface RoomServiceEventNotAllNodesLoaded {
  type: 'RoomServiceEventNotAllNodesLoaded';
  roomId: string;
  loadedCount: number;
}
