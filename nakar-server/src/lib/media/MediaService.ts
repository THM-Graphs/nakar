import type { Modules, Core, Data } from '@strapi/types';
import path from 'path';
import fs from 'node:fs/promises';
import os from 'node:os';
import sanitize from 'sanitize-filename';
import { v4 } from 'uuid';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  private readonly _uploadPlugin: Core.Plugin = strapi.plugin('upload');

  public async getStringPayloadOfMediaFile(
    reference: Modules.Documents.Result<'plugin::upload.file'> | null,
  ): Promise<string> {
    if (reference == null) {
      throw new Error('Cannot read stringpayload: No media reference given.');
    }
    if (reference.url == null) {
      throw new Error(
        `Media ${reference.documentId} has no url. Cannot read string payload.`,
      );
    }
    const filePath: string = path.join(
      strapi.dirs.static.public,
      reference.url,
    );
    const buffer: string = await fs.readFile(filePath, { encoding: 'utf-8' });
    return buffer;
  }

  public async saveJSONFile(
    payload: string,
    name: string | null,
  ): Promise<Modules.Documents.Result<'plugin::upload.file'>> {
    const filePath: string = path.join(os.tmpdir(), 'f.txt');
    await fs.writeFile(filePath, payload, { encoding: 'utf-8' });

    const service: Core.Service = this._uploadPlugin.service('upload');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const uploadFunction: (
      params: Record<string, unknown>,
    ) => Promise<Modules.Documents.Result<'plugin::upload.file'>[]> =
      service['upload'];

    const result: Modules.Documents.Result<'plugin::upload.file'>[] =
      await uploadFunction({
        data: {},
        files: {
          filepath: filePath,
          originalFilename: sanitize(name ?? v4()),
          mimetype: 'application/json',
          size: payload.length,
        },
      });
    await fs.rm(filePath);
    return result[0];
  }

  public async deleteFile(
    reference: Modules.Documents.Result<'plugin::upload.file'>,
  ): Promise<Modules.Documents.Result<'plugin::upload.file'>> {
    const service: Core.Service = this._uploadPlugin.service('file');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const deleteByIds: (
      ids: Data.ID[],
    ) => Promise<Modules.Documents.Result<'plugin::upload.file'>[]> =
      service['deleteByIds'];

    const result: Modules.Documents.Result<'plugin::upload.file'>[] =
      await deleteByIds([reference.id]);
    return result[0];
  }
}
