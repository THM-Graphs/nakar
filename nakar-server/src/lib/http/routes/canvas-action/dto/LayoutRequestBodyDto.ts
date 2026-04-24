/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiExtraModels, ApiProperty, refs } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type, TypeHelpOptions } from 'class-transformer';
import { LayoutSpecificationCircleDto } from './LayoutSpecificationCircleDto';
import { LayoutSpecificationForceDirectedDto } from './LayoutSpecificationForceDirectedDto';
import { match } from 'ts-pattern';
import { LayoutSpecificationDto } from './LayoutSpecificationDto';
import { LayoutSpecificationHierarchyDto } from './LayoutSpecificationHierarchyDto';

@ApiExtraModels(
  LayoutSpecificationCircleDto,
  LayoutSpecificationForceDirectedDto,
  LayoutSpecificationHierarchyDto,
)
export class LayoutRequestBodyDto {
  @ApiProperty({
    oneOf: refs(
      LayoutSpecificationCircleDto,
      LayoutSpecificationForceDirectedDto,
      LayoutSpecificationHierarchyDto,
    ),
  })
  @ValidateNested()
  @Type((options: TypeHelpOptions | undefined) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    match(options?.object as LayoutRequestBodyDto)
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
      .with(
        {
          layoutSpecification: { type: 'LayoutSpecificationHierarchyDto' },
        },
        () => LayoutSpecificationHierarchyDto,
      )
      .exhaustive(),
  )
  public layoutSpecification!: LayoutSpecificationDto;
}
