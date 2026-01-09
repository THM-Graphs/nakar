/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { ScenarioArgumentDto } from './ScenarioArgumentDto';
import { Type } from 'class-transformer';

export class LoadScenarioRequestBodyDto {
  @ApiProperty({ type: String })
  @IsString()
  public scenarioId!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public additive!: boolean;

  @ApiProperty({ type: ScenarioArgumentDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioArgumentDto)
  public arguments!: ScenarioArgumentDto[];
}
