import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UpdateScenarioPostActionTypeDto } from './UpdateScenarioPostActionTypeDto';
import { UpdateScenarioPostActionLayoutAlgorithmDto } from './UpdateScenarioPostActionLayoutAlgorithmDto';
import { Type } from 'class-transformer';
import { UpdateScenarioPostActionColorPresetDto } from './UpdateScenarioPostActionColorPresetDto';

export class UpdateScenarioPostActionEntryDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  public id!: string;

  @ApiProperty({ enum: UpdateScenarioPostActionTypeDto })
  @IsEnum(UpdateScenarioPostActionTypeDto)
  public type!: UpdateScenarioPostActionTypeDto;

  @ApiProperty({ type: String })
  @IsString()
  public label!: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  public circleRadius!: number;

  @ApiProperty({ enum: UpdateScenarioPostActionLayoutAlgorithmDto })
  @IsEnum(UpdateScenarioPostActionLayoutAlgorithmDto)
  public layoutAlgorithm!: UpdateScenarioPostActionLayoutAlgorithmDto;

  @ApiProperty({ type: String })
  @IsString()
  public relationshipType!: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  public factor!: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  public width!: number;

  @ApiProperty({
    type: UpdateScenarioPostActionColorPresetDto,
  })
  @ValidateNested()
  @Type(
    (): typeof UpdateScenarioPostActionColorPresetDto =>
      UpdateScenarioPostActionColorPresetDto,
  )
  public color!: UpdateScenarioPostActionColorPresetDto;

  @ApiProperty({ type: Number })
  @IsNumber()
  public radius!: number;

  @ApiProperty({ type: String })
  @IsString()
  public property!: string;
}
