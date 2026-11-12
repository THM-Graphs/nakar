import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { FlipCanvasAxisDto } from './FlipCanvasAxisDto';

export class FlipCanvasRequestBodyDto {
  @ApiProperty({ enum: ['x', 'y'] })
  @IsIn(['x', 'y'])
  public axis!: FlipCanvasAxisDto;
}
