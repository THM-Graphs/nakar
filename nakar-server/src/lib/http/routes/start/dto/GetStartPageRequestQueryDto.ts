import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetStartPageRequestQueryDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ type: 'string', nullable: true })
  public recentRoomIds!: string | null;
}
