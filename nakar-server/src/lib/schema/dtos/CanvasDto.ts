import { ApiProperty } from '@nestjs/swagger';

export class CanvasDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  public constructor(data: { id: string; title: string }) {
    this.id = data.id;
    this.title = data.title;
  }
}
