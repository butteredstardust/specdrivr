import { executeQuery } from '@/lib/db-helpers';

export abstract class BaseRepository {
  protected async execQuery<T>(operation: () => Promise<T>): Promise<T> {
    const result = await executeQuery(operation);

    if (!result.success) {
      throw result.error;
    }

    return result.data;
  }
}
