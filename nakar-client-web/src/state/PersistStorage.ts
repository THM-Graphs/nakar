export interface PersistStorage {
  hideLabels: boolean | null;
  hiddenUserCursors: string[] | null;
  userTheme: string | null;
  selectedCanvasTab: string | null;
  leftPanel: string | null;
  rightPanel: string | null;
  colorSchema: string | null;
  canvasZoom: number | null;
  canvasTransformX: number | null;
  canvasTransformY: number | null;
  jwt: string | null;
  myRooms: string[] | null;
  canvasMode: string | null;
}
