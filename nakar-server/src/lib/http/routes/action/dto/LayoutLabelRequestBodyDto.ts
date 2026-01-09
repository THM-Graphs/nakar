/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { Type, TypeHelpOptions } from 'class-transformer';
import { LayoutSpecificationCircleDto } from './LayoutSpecificationCircleDto';
import { LayoutSpecificationForceDirectedDto } from './LayoutSpecificationForceDirectedDto';
import { match } from 'ts-pattern';
import { LayoutSpecificationDto } from './LayoutSpecificationDto';

@ApiExtraModels(
  LayoutSpecificationCircleDto,
  LayoutSpecificationForceDirectedDto,
)
export class LayoutLabelRequestBodyDto {
  @ApiProperty({ type: String })
  @IsString()
  public label!: string;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(LayoutSpecificationCircleDto) },
      { $ref: getSchemaPath(LayoutSpecificationForceDirectedDto) },
    ],
  })
  @ValidateNested()
  @Type((options: TypeHelpOptions | undefined) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    match(options?.object as LayoutLabelRequestBodyDto)
      .with(
        { layoutSpecification: { type: 'LayoutSpecificationCircleDto' } },
        () => LayoutSpecificationCircleDto,
      )
      .with(
        {
          layoutSpecification: { type: 'LayoutSpecificationForceDirectedDto' },
        },
        () => LayoutSpecificationForceDirectedDto,
      )
      .exhaustive(),
  )
  public layoutSpecification!: LayoutSpecificationDto;
}
