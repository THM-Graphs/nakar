import { createHash } from 'crypto';

export class IdHash {
  public static create(input: string): string {
    return createHash('sha256').update(input, 'utf8').digest('hex');
  }
}
