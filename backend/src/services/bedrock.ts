import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

const client = new BedrockRuntimeClient({ region: REGION });

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockInvokeOptions {
  system: string;
  messages: BedrockMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export async function invokeModel(options: BedrockInvokeOptions): Promise<string> {
  const { system, messages, maxTokens = 2048, temperature = 0.7, topP = 0.9 } = options;

  const payload = {
    schemaVersion: 'messages-v1',
    system: [{ text: system }],
    messages: messages.map((msg) => ({
      role: msg.role,
      content: [{ text: msg.content }],
    })),
    inferenceConfig: {
      max_new_tokens: maxTokens,
      temperature,
      top_p: topP,
    },
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  try {
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract text from Nova Lite response
    const outputText =
      responseBody.output?.message?.content?.[0]?.text ||
      responseBody.content?.[0]?.text ||
      '';

    return outputText;
  } catch (error) {
    console.error('Bedrock invocation error:', error);
    throw new Error(`Failed to invoke Bedrock model: ${(error as Error).message}`);
  }
}

export function parseJsonResponse<T>(response: string): T {
  // Try to extract JSON from the response (model may wrap it in markdown)
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                    response.match(/```\s*([\s\S]*?)\s*```/) ||
                    response.match(/(\{[\s\S]*\})/);

  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]) as T;
  }

  // Try direct parse
  return JSON.parse(response) as T;
}

export async function invokeAgent(
  system: string,
  userMessage: string,
  maxTokens?: number
): Promise<string> {
  return invokeModel({
    system,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens,
    temperature: 0.7,
  });
}
