export interface PhysicalNode {
  readonly id: string;
  readonly radius: number;

  positionX: number;
  positionY: number;
  locked: boolean;

  velocityX: number;
  velocityY: number;
}
