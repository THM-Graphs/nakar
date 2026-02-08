import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UpdateScenarioPostActionTypeDto } from './UpdateScenarioPostActionTypeDto';
import { UpdateScenarioPostActionLayoutAlgorithmDto } from './UpdateScenarioPostActionLayoutAlgorithmDto';

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
}
