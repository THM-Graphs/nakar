import { Result } from '@strapi/types/dist/modules/documents/result';
import path from 'path';
import fs from 'node:fs/promises';
import os from 'node:os';
import sanitize from 'sanitize-filename';
import { v4 } from 'uuid';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  public async getStringPayloadOfMediaFile(
    reference: Result<'plugin::upload.file'> | null,
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
  ): Promise<Result<'plugin::upload.file'>> {
    const filePath: string = path.join(os.tmpdir(), 'f.txt');
    await fs.writeFile(filePath, payload, { encoding: 'utf-8' });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const result: Result<'plugin::upload.file'>[] = await strapi
      .plugin('upload')
      .service('upload')
      ['upload']({
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
    reference: Result<'plugin::upload.file'>,
  ): Promise<Result<'plugin::upload.file'>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const result: Result<'plugin::upload.file'>[] = await strapi
      .plugin('upload')
      .service('file')
      ['deleteByIds']([reference.id]);
    return result[0];
  }
}
