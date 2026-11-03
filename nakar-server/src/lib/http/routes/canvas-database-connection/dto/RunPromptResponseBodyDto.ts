import { ApiProperty } from '@nestjs/swagger';

export class RunPromptResponseBodyDto {
  @ApiProperty({ type: String })
  public query!: string;
}
