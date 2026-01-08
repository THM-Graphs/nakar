import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetStartPageRequestQueryDto {
  @IsString({ each: true })
  @ApiProperty()
  public recentRoomIds!: string[];
}
