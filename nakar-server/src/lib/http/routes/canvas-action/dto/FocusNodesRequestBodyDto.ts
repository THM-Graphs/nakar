import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FocusNodesRequestBodyDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public nodes!: string[];
}
