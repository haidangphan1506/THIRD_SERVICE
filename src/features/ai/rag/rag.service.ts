import { Injectable } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorSearchService } from './vector-search.service';

/**
 * Retrieval-Augmented Generation entry point. Currently disabled — structured
 * function-calling covers the live data. When enabled, this would embed the
 * query and pull the most relevant document snippets to inject into the prompt.
 */
@Injectable()
export class RagService {
  /** Toggle on once an embedding model + vector store are configured. */
  private readonly enabled = false;

  constructor(
    private readonly embedding: EmbeddingService,
    private readonly vectorSearch: VectorSearchService,
  ) {}

  async retrieve(query: string, topK = 5): Promise<string[]> {
    if (!this.enabled) return [];
    const vector = await this.embedding.embed(query);
    return this.vectorSearch.search(vector, topK);
  }
}
