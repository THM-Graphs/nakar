import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompressNodesRequestBodyDto {
  @ApiProperty({ type: String })
  @IsString()
  public label!: string;
}
