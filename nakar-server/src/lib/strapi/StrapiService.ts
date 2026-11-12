import { Injectable } from '@nestjs/common';
import type { Logger } from '@strapi/logger';
import type { AddressInfo } from 'node:net';
import z from 'zod';
import { createChildLogger } from '../logger/createChildLogger';
import { SSet } from '../../packages/set/Set';

@Injectable()
export class StrapiService {
  private readonly _logger: Logger = createChildLogger(this);

  public get strapiUrl(): string {
    return `http://localhost:${this.getStrapiPort().toString()}`;
  }

  public getStrapiPort(): number {
    const address: AddressInfo | string | null =
      strapi.server.httpServer.address();
    if (address == null || typeof address === 'string') {
      throw new Error('Strapi HTTP server is not listening on a TCP port.');
    }
    return address.port;
  }

  public async setupStrapiPermissions(): Promise<void> {
    const requiredPermissions: { roleType: string; actions: string[] }[] = [
      {
        roleType: 'public',
        actions: [
          'plugin::users-permissions.auth.callback',
          'plugin::users-permissions.auth.register',
        ],
      },
      {
        roleType: 'authenticated',
        actions: ['plugin::users-permissions.user.me'],
      },
    ];

    await strapi.db.transaction(
      async (hooks: {
        onCommit(callback: () => void): void;
      }): Promise<void> => {
        const roles: ReturnType<typeof strapi.db.query> = strapi.db.query(
          'plugin::users-permissions.role',
        );
        const permissions: ReturnType<typeof strapi.db.query> = strapi.db.query(
          'plugin::users-permissions.permission',
        );

        for (const required of requiredPermissions) {
          const role: { id: number } | null = z
            .object({ id: z.number() })
            .nullable()
            .parse(
              await roles.findOne({
                select: ['id'],
                where: { type: required.roleType },
              }),
            );
          if (role === null) {
            throw new Error(
              `Strapi role "${required.roleType}" was not found.`,
            );
          }

          const assigned: { id: number; action: string }[] = z
            .array(z.object({ id: z.number(), action: z.string() }))
            .parse(
              await permissions.findMany({
                select: ['id', 'action'],
                where: { role: { id: role.id } },
                orderBy: { id: 'asc' },
              }),
            );
          const missingActions: SSet<string> = new SSet<string>(
            required.actions,
          );
          for (const permission of assigned) {
            if (!missingActions.delete(permission.action)) {
              await permissions.delete({ where: { id: permission.id } });
              hooks.onCommit((): void => {
                this._logger.info(
                  `Removed permission "${permission.action}" from Strapi role "${required.roleType}".`,
                );
              });
            }
          }
          for (const action of missingActions) {
            await permissions.create({
              data: { action, role: role.id },
            });
            hooks.onCommit((): void => {
              this._logger.info(
                `Added permission "${action}" to Strapi role "${required.roleType}".`,
              );
            });
          }
        }

        const store: ReturnType<typeof strapi.store> = strapi.store({
          type: 'plugin',
          name: 'users-permissions',
        });
        const settings: Record<string, unknown> = z
          .record(z.string(), z.unknown())
          .parse(await store.get({ key: 'advanced' }));
        if (
          settings['allow_register'] !== true ||
          settings['email_confirmation'] !== false ||
          settings['default_role'] !== 'authenticated'
        ) {
          settings['allow_register'] = true;
          settings['email_confirmation'] = false;
          settings['default_role'] = 'authenticated';
          await store.set({
            key: 'advanced',
            value: settings,
          });
        }
      },
    );
  }
}
