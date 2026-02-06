import { ScenarioParameterDataTypeDto } from './ScenarioParameterDataTypeDto';
import { ApiProperty } from '@nestjs/swagger';

export class ScenarioParameterDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public identifier: string;

  @ApiProperty()
  public title: string;

  @ApiProperty({ nullable: true, type: 'string' })
  public defaultValue: string | null;

  @ApiProperty({ enum: ScenarioParameterDataTypeDto })
  public dataType: ScenarioParameterDataTypeDto;

  @ApiProperty({ type: String, isArray: true })
  public allowedLabels: string[];

  public constructor(data: {
    id: string;
    identifier: string;
    title: string;
    defaultValue: string | null;
    dataType: ScenarioParameterDataTypeDto;
    allowedLabels: string[];
  }) {
    this.id = data.id;
    this.identifier = data.identifier;
    this.title = data.title;
    this.defaultValue = data.defaultValue;
    this.dataType = data.dataType;
    this.allowedLabels = data.allowedLabels;
  }
}
