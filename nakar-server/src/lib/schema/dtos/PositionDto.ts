import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class PositionDto {
  @ApiProperty()
  @IsNumber()
  public x!: number;

  @ApiProperty()
  @IsNumber()
  public y!: number;

  public constructor(data?: { x: number; y: number }) {
    if (data) {
      this.x = data.x;
      this.y = data.y;
    }
  }
}
