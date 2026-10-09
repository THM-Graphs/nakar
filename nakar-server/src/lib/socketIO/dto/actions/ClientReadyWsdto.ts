import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ClientReadyWsdto {
  @ApiProperty({ enum: ['ClientReadyWsdto'] })
  @IsString()
  public type!: 'ClientReadyWsdto';
}
