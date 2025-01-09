import { LoginCredentials } from '../types/LoginCredentials';
import { NoLoginDataError } from '../errors/NoLoginDataError';
import { DBDatabase } from '../../documents/types/DBDatabase';

export function createLoginCredentials(database: DBDatabase): LoginCredentials {
  if (database.url == null) {
    throw new NoLoginDataError('url');
  }
  if (database.username == null) {
    throw new NoLoginDataError('username');
  }
  if (database.password == null) {
    throw new NoLoginDataError('password');
  }
  return {
    url: database.url,
    username: database.username,
    password: database.password,
  };
}
