import { Injectable } from '@nestjs/common';

/**
 * Placeholder vector-search service. A future implementation would query a
 * vector store (e.g. pgvector) for the nearest documents to `vector`.
 */
@Injectable()
export class VectorSearchService {
  search(_vector: number[], _topK = 5): Promise<string[]> {
    return Promise.resolve([]);
  }
}
