import { createHash } from 'crypto';

export class MD5Hash {
  public static create(input: string): string {
    return createHash('md5').update(input, 'utf8').digest('hex');
  }
}
