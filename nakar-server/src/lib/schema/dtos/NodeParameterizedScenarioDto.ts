import { ApiProperty } from '@nestjs/swagger';

export class NodeParameterizedScenarioDto {
  @ApiProperty()
  public id: string;

  public constructor(data: { id: string }) {
    this.id = data.id;
  }
}
