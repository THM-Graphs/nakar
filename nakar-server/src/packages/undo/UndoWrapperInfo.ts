export interface UndoWrapperInfo {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
  undoAction: string | null;
  redoAction: string | null;
}
