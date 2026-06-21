import type { LayoutSpecificationCircleDto } from './LayoutSpecificationCircleDto';
import type { LayoutSpecificationForceDirectedDto } from './LayoutSpecificationForceDirectedDto';
import type { LayoutSpecificationHierarchyDto } from './LayoutSpecificationHierarchyDto';

export type LayoutSpecificationDto =
  | LayoutSpecificationCircleDto
  | LayoutSpecificationHierarchyDto
  | LayoutSpecificationForceDirectedDto;
