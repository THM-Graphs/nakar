import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FocusRelationshipTypeRequestBodyDto {
  @ApiProperty()
  @IsString()
  public relationshipType!: string;
}
