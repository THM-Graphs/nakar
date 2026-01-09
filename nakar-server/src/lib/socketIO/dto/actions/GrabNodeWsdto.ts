import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GrabNodeWsdto {
  @ApiProperty({ enum: ['GrabNodeWsdto'] })
  @IsString()
  public type!: 'GrabNodeWsdto';

  @ApiProperty({ type: String })
  @IsString()
  public nodeId!: string;
}
