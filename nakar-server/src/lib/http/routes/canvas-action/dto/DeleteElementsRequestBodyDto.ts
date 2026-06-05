import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteElementsRequestBodyDto {
  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public nodes!: string[];

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public edges!: string[];

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public labels!: string[];

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public edgeTypes!: string[];
}
