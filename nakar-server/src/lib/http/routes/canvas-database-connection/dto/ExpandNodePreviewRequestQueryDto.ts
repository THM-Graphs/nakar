import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExpandNodePreviewRequestQueryDto {
  @ApiProperty()
  @IsString()
  public nodeId!: string;
}
