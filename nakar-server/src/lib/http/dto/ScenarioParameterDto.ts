import { ScenarioParameterDataTypeDto } from './ScenarioParameterDataTypeDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioParameterDto {
  @ApiProperty()
  public identifier: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ nullable: true, type: 'string' })
  public defaultValue: string | null;

  @ApiProperty({ enum: ScenarioParameterDataTypeDto })
  public dataType: ScenarioParameterDataTypeDto;

  public constructor(data: {
    identifier: string;
    title: string;
    defaultValue: string | null;
    dataType: ScenarioParameterDataTypeDto;
  }) {
    this.identifier = data.identifier;
    this.title = data.title;
    this.defaultValue = data.defaultValue;
    this.dataType = data.dataType;
  }
}
