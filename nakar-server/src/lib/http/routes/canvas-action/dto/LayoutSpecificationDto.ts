import { LayoutSpecificationCircleDto } from './LayoutSpecificationCircleDto';
import { LayoutSpecificationForceDirectedDto } from './LayoutSpecificationForceDirectedDto';
import { LayoutSpecificationHierarchyDto } from './LayoutSpecificationHierarchyDto';

export type LayoutSpecificationDto =
  | LayoutSpecificationCircleDto
  | LayoutSpecificationHierarchyDto
  | LayoutSpecificationForceDirectedDto;
