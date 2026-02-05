import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRoomRequestBodyDto {
  @ApiProperty()
  @IsString()
  public projectId!: string;
}
