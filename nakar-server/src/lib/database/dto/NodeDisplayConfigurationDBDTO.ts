import { LayoutAlgorithm } from '../../tools/LayoutAlgorithm';

export interface NodeDisplayConfigurationDBDTO {
  readonly targetLabel: string | null;
  readonly displayText: string | null;
  readonly radius: string | null;
  readonly backgroundColor: string | null;
  readonly compress: boolean | null;
  readonly circleLayoutDistance: number | null;
  readonly layoutAlgorithm: LayoutAlgorithm | null;
}
