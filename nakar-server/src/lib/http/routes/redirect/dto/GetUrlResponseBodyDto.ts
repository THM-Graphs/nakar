import { ApiProperty } from '@nestjs/swagger';

export class GetUrlResponseBodyDto {
  @ApiProperty({ type: String, nullable: true })
  public url: string | null;

  public constructor(data: { url: string | null }) {
    this.url = data.url;
  }
}
