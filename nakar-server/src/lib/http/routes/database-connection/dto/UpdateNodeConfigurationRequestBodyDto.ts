import { ApiProperty } from '@nestjs/swagger';
import { NodeConfigurationTypeDto } from '../../../../schema/dtos/NodeConfigurationTypeDto';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateNodeConfigurationRequestBodyDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  public id!: string;

  @ApiProperty({ enum: NodeConfigurationTypeDto })
  @IsEnum(NodeConfigurationTypeDto)
  public type!: NodeConfigurationTypeDto;

  @ApiProperty({ type: String })
  @IsString()
  public label!: string;

  @ApiProperty({ type: String })
  @IsString()
  public property!: string;

  @ApiProperty({ type: String })
  @IsString()
  public linkTemplate!: string;
}
