import { ApiProperty } from '@nestjs/swagger';

export class GetVersionResponseBodyDto {
  @ApiProperty()
  public version: string;

  public constructor(data: { version: string }) {
    this.version = data.version;
  }
}
