import { ApiProperty } from '@nestjs/swagger';

export class GetUrlResponseBodyDto {
  @ApiProperty()
  public url: string;

  public constructor(data: { url: string }) {
    this.url = data.url;
  }
}
