import { ApiProperty } from '@nestjs/swagger';

export class KickWsdto {
  @ApiProperty({ enum: ['KickWsdto'] })
  public type: 'KickWsdto';

  public constructor(data: { type: 'KickWsdto' }) {
    this.type = data.type;
  }
}
