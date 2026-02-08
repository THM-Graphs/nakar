import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateScenarioQueryEntryDto } from './UpdateScenarioQueryEntryDto';
import { UpdateScenarioQueryParameterEntryDto } from './UpdateScenarioQueryParameterEntryDto';
import { UpdateScenarioPostActionEntryDto } from './UpdateScenarioPostActionEntryDto';

export class UpdateScenarioRequestBodyDto {
  @ApiProperty()
  @IsString()
  public title!: string;

  @ApiProperty({ type: UpdateScenarioQueryEntryDto, isArray: true })
  @ValidateNested()
  @IsArray()
  @Type((): typeof UpdateScenarioQueryEntryDto => UpdateScenarioQueryEntryDto)
  public queries!: UpdateScenarioQueryEntryDto[];

  @ApiProperty({ type: UpdateScenarioQueryParameterEntryDto, isArray: true })
  @ValidateNested()
  @IsArray()
  @Type(
    (): typeof UpdateScenarioQueryParameterEntryDto =>
      UpdateScenarioQueryParameterEntryDto,
  )
  public parameters!: UpdateScenarioQueryParameterEntryDto[];

  @ApiProperty({ type: UpdateScenarioPostActionEntryDto, isArray: true })
  @ValidateNested()
  @IsArray()
  @Type(
    (): typeof UpdateScenarioPostActionEntryDto =>
      UpdateScenarioPostActionEntryDto,
  )
  public postScenarioActions!: UpdateScenarioPostActionEntryDto[];
}
