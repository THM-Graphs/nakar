/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ExpandNodePreviewEntryDto } from './ExpandNodePreviewEntryDto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExpandNodePreviewResponseBodyDto {
  @ApiProperty({ type: [ExpandNodePreviewEntryDto] })
  @Type(() => ExpandNodePreviewEntryDto)
  public relationships: ExpandNodePreviewEntryDto[];

  @ApiProperty({ type: [ExpandNodePreviewEntryDto] })
  @Type(() => ExpandNodePreviewEntryDto)
  public labels: ExpandNodePreviewEntryDto[];

  public constructor(data: {
    relationships: ExpandNodePreviewEntryDto[];
    labels: ExpandNodePreviewEntryDto[];
  }) {
    this.relationships = data.relationships;
    this.labels = data.labels;
  }
}
