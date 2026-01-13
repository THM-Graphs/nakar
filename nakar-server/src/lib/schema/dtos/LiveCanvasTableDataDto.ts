import { ApiProperty } from '@nestjs/swagger';

export class LiveCanvasTableDataDto {
  @ApiProperty({ type: 'object', isArray: true, additionalProperties: {} })
  public data: Record<string, unknown>[];

  public constructor(data: { data: Record<string, unknown>[] }) {
    this.data = data.data;
  }
}
