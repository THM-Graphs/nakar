import { SchemaLayoutSpecification } from '../../../../src-gen/schema';

export interface NodeDisplayConfigurationDBDTO {
  readonly targetLabel: string | null;
  readonly displayText: string | null;
  readonly radius: string | null;
  readonly backgroundColor: string | null;
  readonly compress: boolean | null;
  readonly layoutSpecification: SchemaLayoutSpecification | null;
}
