import { AgentsRole, ContentBlock } from 'src/features/agents/agents.enum';
import { AgentMessage } from 'src/features/agents/agents.types';

export class AgentsBuilder {
  static userText(text: string): AgentMessage {
    return { role: AgentsRole.USER, content: text };
  }

  static assistantBlocks(content: ContentBlock[]): AgentMessage {
    return { role: AgentsRole.ASSISTANT, content };
  }

  static toolResult(toolUseId: string, result: unknown, isError = false): AgentMessage {
    return {
      role: AgentsRole.USER,
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: typeof result === 'string' ? result : JSON.stringify(result),
          is_error: isError,
        },
      ],
    };
  }
}
