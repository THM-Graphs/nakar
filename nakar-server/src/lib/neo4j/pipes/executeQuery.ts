import neo4j, {
  auth,
  driver as createDriver,
  Driver,
  QueryResult,
  RecordShape,
  Session,
} from 'neo4j-driver';
import { LoginCredentials } from '../types/LoginCredentials';
import { GraphElements } from '../types/GraphElements';
import { collectGraphElementsFromQueryResult } from './collectGraphElementsFromQueryResult';

export async function executeQuery(
  credentials: LoginCredentials,
  query: string,
  parameters?: Record<string, unknown>,
): Promise<GraphElements> {
  const driver: Driver = createDriver(
    credentials.url,
    auth.basic(credentials.username, credentials.password),
  );
  try {
    const session: Session = driver.session({
      defaultAccessMode: neo4j.session.READ,
    });
    try {
      const result: QueryResult = await session.run<
        RecordShape<string, string>
      >(query, parameters);

      return collectGraphElementsFromQueryResult(result);
    } catch (error) {
      await session.close();
      throw error;
    }
  } catch (error) {
    await driver.close();
    throw error;
  }
}
