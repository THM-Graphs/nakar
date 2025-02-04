import { operations } from '../../../src-gen/schema';
import { Context } from 'koa';

export type StrapiController = Record<
  keyof operations,
  (ctx: Context) => Promise<void>
>;
