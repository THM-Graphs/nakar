import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ExpandNodeLimitDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public labels!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public relationships!: string[];
}
