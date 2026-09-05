import { Injectable } from '@nestjs/common';
import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { CLAUDE_MODELS } from './agents.config';

@Injectable()
export class AgentsService {
  constructor() {}

  async run(prompt: string, options?: Options): Promise<SDKMessage[]> {
    const messages: SDKMessage[] = [];

    const result = query({
      prompt,
      options: {
        model: CLAUDE_MODELS.sonnet,
        ...options,
      },
    });

    for await (const message of result) {
      messages.push(message);
    }

    return messages;
  }
}
