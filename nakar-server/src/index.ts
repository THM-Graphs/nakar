import { bootstrapNest, destroyNest } from './lib/application/main';

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
    strapi.log.debug(`Arguments: ${process.argv.join(' ')}`);

    // Do not start the nest application if strapi is started with maintenance flags
    const maintenanceFlags: string[] = ['transfer', 'import', 'export'];
    for (const maintenanceFlag of maintenanceFlags) {
      if (process.argv.includes(maintenanceFlag)) {
        strapi.log.info(
          `Will not bootstrap nest application, because strapi is started with ${maintenanceFlag} flag.`,
        );
        return;
      }
    }

    await bootstrapNest();
  },

  async destroy(): Promise<void> {
    await destroyNest();
  },
};
