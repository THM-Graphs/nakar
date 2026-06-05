import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ExpandNodeLimitDto {
  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public labels!: string[];

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public relationships!: string[];
}
