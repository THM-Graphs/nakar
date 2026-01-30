import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { CreateScenarioQueryEntryDto } from './CreateScenarioQueryEntryDto';
import { Type } from 'class-transformer';

export class CreateScenarioRequestBodyDto {
  @ApiProperty()
  @IsString()
  public title!: string;

  @ApiProperty({ type: CreateScenarioQueryEntryDto, isArray: true })
  @ValidateNested()
  @IsArray()
  @Type((): typeof CreateScenarioQueryEntryDto => CreateScenarioQueryEntryDto)
  public queries!: CreateScenarioQueryEntryDto[];
}
