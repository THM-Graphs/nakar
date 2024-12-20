import { ApiProperty } from '@nestjs/swagger';
import { GetScenarioDto } from './GetScenarioDto';
import { Type } from 'class-transformer';

export class GetScenariosDto {
  @ApiProperty({ type: GetScenarioDto, isArray: true })
  @Type(() => GetScenarioDto)
  scenarios: Array<GetScenarioDto>;

  constructor(scenarios: Array<GetScenarioDto>) {
    this.scenarios = scenarios;
  }
}
