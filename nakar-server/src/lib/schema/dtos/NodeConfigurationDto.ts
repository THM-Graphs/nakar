import { NodeConfigurationTypeDto } from './NodeConfigurationTypeDto';
import { ApiProperty } from '@nestjs/swagger';

export class NodeConfigurationDto {
  @ApiProperty({ type: String })
  public id: string;

  @ApiProperty({ enum: NodeConfigurationTypeDto })
  public type: NodeConfigurationTypeDto;

  @ApiProperty({ type: String })
  public label: string;

  @ApiProperty({ type: String })
  public property: string;

  @ApiProperty({ type: String })
  public linkTemplate: string;

  @ApiProperty({ type: Boolean })
  public urlEncode: boolean;

  public constructor(data: {
    id: string;
    type: NodeConfigurationTypeDto;
    label: string;
    property: string;
    linkTemplate: string;
    urlEncode: boolean;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.label = data.label;
    this.property = data.property;
    this.linkTemplate = data.linkTemplate;
    this.urlEncode = data.urlEncode;
  }
}
