import { ColorDto } from '../../../http/dto/ColorDto';
import { ApiProperty } from '@nestjs/swagger';

export class LabelDto {
  @ApiProperty()
  public label: string;

  @ApiProperty({ type: () => ColorDto })
  public color: ColorDto;

  @ApiProperty()
  public count: number;

  @ApiProperty({ type: [String] })
  public sources: string[];

  public constructor(data: {
    label: string;
    color: ColorDto;
    count: number;
    sources: string[];
  }) {
    this.label = data.label;
    this.color = data.color;
    this.count = data.count;
    this.sources = data.sources;
  }
}
