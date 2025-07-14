import { PhysicalPosition } from './PhysicalPosition';

export interface PhysicalNode {
  readonly id: string;
  readonly position: PhysicalPosition;
  readonly radius: number;
  locked: boolean;

  velocityX: number;
  velocityY: number;
}
