import { ApplicationService } from '../application/ApplicationService';
import { LoggerService } from '../logger/LoggerService';
import { GetMediaDBDTO } from '../database/dto/GetMediaDBDTO';
import { FileStream } from '../fs/FileStream';
import { ConfigService } from '../config/ConfigService';
import path from 'path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { v4 } from 'uuid';
import sanitize from 'sanitize-filename';

export class MediaService implements ApplicationService {
  public constructor(
    private readonly _logger: LoggerService,
    private readonly _configService: ConfigService,
  ) {}

  public bootstrap(): void | Promise<void> {
    /* */
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public getFileStream(
    targetFileNameWithoutExtension: string,
    media: GetMediaDBDTO,
  ): FileStream | null {
    if (media.hash == null) {
      this._logger.warn(this, `Hash of media ${media.documentId} is null.`);
      return null;
    }
    if (media.ext == null) {
      this._logger.warn(
        this,
        `File extension of media ${media.documentId} is null.`,
      );
      return null;
    }
    const filePath: string = `${strapi.dirs.static.public}/uploads/${media.hash}${media.ext}`;
    return new FileStream(
      filePath,
      '',
      `${targetFileNameWithoutExtension}${media.ext}`,
    );
  }

  public getPublicUrlOfMedia(media: GetMediaDBDTO): string | null {
    if (media.url == null) {
      return null;
    }
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    return host + media.url;
  }

  public async getStringPayloadOfMediaFile(
    reference: GetMediaDBDTO | null,
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

  public async saveStringFile(
    payload: string,
    name: string | null,
  ): Promise<GetMediaDBDTO> {
    try {
      const filePath: string = path.join(os.tmpdir(), 'f.txt');
      await fs.writeFile(filePath, payload, { encoding: 'utf-8' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
      const result: GetMediaDBDTO[] = await strapi
        .plugin('upload')
        .service('upload')
        ['upload']({
          data: {},
          files: {
            filepath: filePath,
            originalFilename: `Graph Json ${sanitize(name ?? v4())}`,
            mimetype: 'application/json',
            size: payload.length,
          },
        });
      await fs.rm(filePath);
      return result[0];
    } catch (error) {
      this._logger.error(this, error);
      throw error;
    }
  }

  public async deleteFile(reference: GetMediaDBDTO): Promise<GetMediaDBDTO> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const result: GetMediaDBDTO[] = await strapi
      .plugin('upload')
      .service('file')
      ['deleteByIds']([reference.id]);
    return result[0];
  }
}
