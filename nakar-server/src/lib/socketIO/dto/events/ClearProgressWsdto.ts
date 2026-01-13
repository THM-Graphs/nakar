import { ApiProperty } from '@nestjs/swagger';

export class ClearProgressWsdto {
  @ApiProperty({ enum: ['ClearProgressWsdto'] })
  public type: 'ClearProgressWsdto';

  public constructor(data: { type: 'ClearProgressWsdto' }) {
    this.type = data.type;
  }
}
