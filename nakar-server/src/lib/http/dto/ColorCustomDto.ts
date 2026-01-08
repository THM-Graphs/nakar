import { ApiProperty } from '@nestjs/swagger';

export class ColorCustomDto {
  @ApiProperty()
  public backgroundColor: string;

  @ApiProperty()
  public textColor: string;

  public constructor(data: { backgroundColor: string; textColor: string }) {
    this.backgroundColor = data.backgroundColor;
    this.textColor = data.textColor;
  }
}
