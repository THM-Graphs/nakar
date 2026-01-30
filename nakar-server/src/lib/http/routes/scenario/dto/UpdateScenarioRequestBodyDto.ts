import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateScenarioQueryEntryDto } from './UpdateScenarioQueryEntryDto';

export class UpdateScenarioRequestBodyDto {
  @ApiProperty()
  @IsString()
  public title!: string;

  @ApiProperty({ type: UpdateScenarioQueryEntryDto, isArray: true })
  @ValidateNested()
  @IsArray()
  @Type((): typeof UpdateScenarioQueryEntryDto => UpdateScenarioQueryEntryDto)
  public queries!: UpdateScenarioQueryEntryDto[];
}
