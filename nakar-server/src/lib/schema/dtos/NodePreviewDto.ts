import { ColorDto } from './ColorDto';
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
    titel: string;
    labels: string[];
    customColor: ColorDto;
  }) {
    this.id = data.id;
    this.title = data.titel;
    this.labels = data.labels;
    this.customColor = data.customColor;
  }
}
