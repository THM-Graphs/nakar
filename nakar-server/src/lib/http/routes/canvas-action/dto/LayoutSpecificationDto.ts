import { LayoutSpecificationCircleDto } from './LayoutSpecificationCircleDto';
import { LayoutSpecificationForceDirectedDto } from './LayoutSpecificationForceDirectedDto';

export type LayoutSpecificationDto =
  | LayoutSpecificationCircleDto
  | LayoutSpecificationForceDirectedDto;
