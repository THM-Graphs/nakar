import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export type FlipCanvasAxis = 'x' | 'y';

export class FlipCanvasRequestBodyDto {
  @ApiProperty({ enum: ['x', 'y'] })
  @IsIn(['x', 'y'])
  public axis!: FlipCanvasAxis;
}
