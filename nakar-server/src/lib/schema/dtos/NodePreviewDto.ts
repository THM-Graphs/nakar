import { ApiProperty } from '@nestjs/swagger';

export class NodePreviewDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public nativeId: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ isArray: true, type: 'string' })
  public labels: string[];

  public constructor(data: {
    id: string;
    nativeId: string;
    title: string;
    labels: string[];
  }) {
    this.id = data.id;
    this.nativeId = data.nativeId;
    this.title = data.title;
    this.labels = data.labels;
  }
}
