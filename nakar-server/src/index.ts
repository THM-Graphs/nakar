import { NakarApplication } from './lib/application/NakarApplication';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  // register(/* { strapi }: { strapi: Core.Strapi } */) {},
  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap(): Promise<void> {
    await NakarApplication.shared.bootstrap();
  },

  async destroy(): Promise<void> {
    await NakarApplication.shared.destroy();
  },
};
