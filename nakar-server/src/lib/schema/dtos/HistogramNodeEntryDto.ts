import { ColorDto } from './ColorDto';
import { ApiProperty } from '@nestjs/swagger';

export class HistogramNodeEntryDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ isArray: true, type: String })
  public labels: string[];

  @ApiProperty()
  public degree: number;

  @ApiProperty()
  public percentage: number;

  @ApiProperty({ type: ColorDto, nullable: true })
  public customColor: ColorDto | null;

  public constructor(data: {
    id: string;
    title: string;
    labels: string[];
    degree: number;
    percentage: number;
    customColor: ColorDto | null;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.labels = data.labels;
    this.degree = data.degree;
    this.percentage = data.percentage;
    this.customColor = data.customColor;
  }
}
