import { ApiProperty } from '@nestjs/swagger';

export class ColorCustomDto {
  @ApiProperty({ enum: ['ColorCustomDto'] })
  public type: 'ColorCustomDto';

  @ApiProperty()
  public backgroundColor: string;

  @ApiProperty()
  public textColor: string;

  public constructor(data: { backgroundColor: string; textColor: string }) {
    this.type = 'ColorCustomDto';
    this.backgroundColor = data.backgroundColor;
    this.textColor = data.textColor;
  }
}
