import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LiveCanvasParameterDataType } from '../../../../live-canvas/graph/LiveCanvasParameterDataType';

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

  @ApiProperty({ enum: LiveCanvasParameterDataType })
  @IsEnum(LiveCanvasParameterDataType)
  public dataType!: LiveCanvasParameterDataType;

  @ApiProperty({ type: String, isArray: true })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  public allowedLabels!: string[];
}
