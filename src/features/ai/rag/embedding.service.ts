import { Injectable } from '@nestjs/common';

/**
 * Placeholder embedding service. Not yet wired to an embedding model/provider.
 * Returns an empty vector so RAG stays disabled until implemented.
 */
@Injectable()
export class EmbeddingService {
  embed(_text: string): Promise<number[]> {
    return Promise.resolve([]);
  }
}
