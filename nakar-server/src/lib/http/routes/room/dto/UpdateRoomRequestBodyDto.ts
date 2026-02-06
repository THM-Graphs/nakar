import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { RoomVisibilityDto } from '../../../../schema/dtos/RoomVisibilityDto';

export class UpdateRoomRequestBodyDto {
  @ApiProperty()
  @IsString()
  public title!: string;

  @ApiProperty({ enum: RoomVisibilityDto })
  @IsEnum(RoomVisibilityDto)
  public visibility!: RoomVisibilityDto;
}
