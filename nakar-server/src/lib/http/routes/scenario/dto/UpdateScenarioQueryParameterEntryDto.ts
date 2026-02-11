import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ScenarioParameterDataTypeDto } from '../../../../schema/dtos/ScenarioParameterDataTypeDto';

export class UpdateScenarioQueryParameterEntryDto {
  @ApiProperty()
  @IsString()
  public id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public identifier!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  public title!: string;

  @ApiProperty()
  @IsString()
  public defaultValue!: string;

  @ApiProperty({ enum: ScenarioParameterDataTypeDto })
  @IsEnum(ScenarioParameterDataTypeDto)
  public dataType!: ScenarioParameterDataTypeDto;

  @ApiProperty({ type: String, isArray: true })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  public allowedLabels!: string[];
}
