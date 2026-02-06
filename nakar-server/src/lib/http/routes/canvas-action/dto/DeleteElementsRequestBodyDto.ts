import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteElementsRequestBodyDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public nodes!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public edges!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public labels!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public edgeTypes!: string[];
}
