import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinCanvasWsdto {
  @ApiProperty({ enum: ['JoinCanvasWsdto'] })
  @IsString()
  public type!: 'JoinCanvasWsdto';

  @ApiProperty({ type: String })
  @IsString()
  public canvasId!: string;
}
