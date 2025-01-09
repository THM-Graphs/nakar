import { NodeDisplayConfigurationContext } from '../types/NodeDisplayConfigurationContext';
import Handlebars from 'handlebars';

export function applyNodeDisplayConfigurationContextToTemplate(
  context: NodeDisplayConfigurationContext,
  template: string,
): string {
  const c = Handlebars.compile(template);
  return c(context);
}
