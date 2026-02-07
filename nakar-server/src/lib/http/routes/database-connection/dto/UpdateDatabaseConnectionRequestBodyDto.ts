import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDatabaseConnectionRequestBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  public title!: string;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @MinLength(1)
  @IsOptional()
  public username!: string | null;

  @ApiProperty({ nullable: true, type: String })
  @IsString()
  @IsOptional()
  public password!: string | null;

  @ApiProperty()
  @IsString()
  public database!: string;

  @ApiProperty()
  @IsString()
  public connectionUrl!: string;

  @ApiProperty()
  @IsString()
  public browserUrl!: string;

  @ApiProperty()
  @IsBoolean()
  public credentialStoreConsent!: boolean;
}
