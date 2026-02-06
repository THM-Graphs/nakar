import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ScenarioParameterDataTypeDto } from '../../../../schema/dtos/ScenarioParameterDataTypeDto';

export class UpdateScenarioQueryParameterEntryDto {
  @ApiProperty()
  @IsString()
  public id!: string;

  @ApiProperty()
  @IsString()
  public identifier!: string;

  @ApiProperty()
  @IsString()
  public title!: string;

  @ApiProperty()
  @IsString()
  public defaultValue!: string;

  @ApiProperty({ enum: ScenarioParameterDataTypeDto })
  @IsEnum(ScenarioParameterDataTypeDto)
  public dataType!: ScenarioParameterDataTypeDto;
}
