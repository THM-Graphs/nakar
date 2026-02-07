import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { ScenarioParameterDataTypeDto } from '../../../../schema/dtos/ScenarioParameterDataTypeDto';

export class UpdateScenarioQueryParameterEntryDto {
  @ApiProperty()
  @IsString()
  public id!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  public identifier!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  public title!: string;

  @ApiProperty()
  @IsString()
  public defaultValue!: string;

  @ApiProperty({ enum: ScenarioParameterDataTypeDto })
  @IsEnum(ScenarioParameterDataTypeDto)
  public dataType!: ScenarioParameterDataTypeDto;

  @ApiProperty()
  @IsString()
  public allowedLabels!: string;
}
