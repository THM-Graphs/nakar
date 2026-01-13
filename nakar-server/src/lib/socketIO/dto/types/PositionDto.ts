import { ApiProperty } from '@nestjs/swagger';

export class PositionDto {
  @ApiProperty()
  public x: number;

  @ApiProperty()
  public y: number;

  public constructor(data: { x: number; y: number }) {
    this.x = data.x;
    this.y = data.y;
  }
}
