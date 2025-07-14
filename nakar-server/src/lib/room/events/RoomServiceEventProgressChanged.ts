export interface RoomServiceEventProgressChanged {
  type: 'RoomServiceEventProgressChanged';
  roomId: string;
  progress: number | null;
  message: string;
}
