import { ColorDto } from '../../../http/dto/ColorDto';
import { ApiProperty } from '@nestjs/swagger';

export class NodePreviewDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ isArray: true, type: 'string' })
  public labels: string[];

  @ApiProperty({ type: ColorDto, nullable: true })
  public customColor: ColorDto | null;

  public constructor(data: {
    id: string;
    title: string;
    labels: string[];
    customColor: ColorDto | null;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.labels = data.labels;
    this.customColor = data.customColor;
  }
}
