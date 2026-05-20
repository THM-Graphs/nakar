import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FocusRelationshipTypeRequestBodyDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  public relationshipTypes!: string[];
}
