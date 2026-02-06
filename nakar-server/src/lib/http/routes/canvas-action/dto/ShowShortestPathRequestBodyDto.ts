import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ShowShortestPathRequestBodyDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public nodeIds!: string[];
}
