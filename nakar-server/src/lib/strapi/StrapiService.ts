import { Injectable } from '@nestjs/common';
import type { Logger } from '@strapi/logger';
import type { AddressInfo } from 'node:net';
import z from 'zod';
import { createChildLogger } from '../logger/createChildLogger';

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
    const requiredPermissions: { roleType: string; action: string }[] = [
      {
        roleType: 'public',
        action: 'plugin::users-permissions.auth.callback',
      },
      {
        roleType: 'authenticated',
        action: 'plugin::users-permissions.user.me',
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
          let hasRequiredPermission: boolean = false;
          for (const permission of assigned) {
            if (
              permission.action === required.action &&
              !hasRequiredPermission
            ) {
              hasRequiredPermission = true;
            } else {
              await permissions.delete({ where: { id: permission.id } });
              hooks.onCommit((): void => {
                this._logger.info(
                  `Removed permission "${permission.action}" from Strapi role "${required.roleType}".`,
                );
              });
            }
          }
          if (!hasRequiredPermission) {
            await permissions.create({
              data: { action: required.action, role: role.id },
            });
            hooks.onCommit((): void => {
              this._logger.info(
                `Added permission "${required.action}" to Strapi role "${required.roleType}".`,
              );
            });
          }
        }
      },
    );
  }
}
