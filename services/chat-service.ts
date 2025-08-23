import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are a knowledgeable and friendly financial advisor chatbot. Your goal is to help users learn about:
- Stock market basics and trading
- Cryptocurrency and blockchain technology
- Financial health and personal finance
- Investment strategies and risk management
- Market analysis and research

Keep your responses concise, informative, and easy to understand. When discussing specific investments, always include appropriate disclaimers about risks and the importance of doing personal research.

Important guidelines:
1. Never provide specific investment advice or recommendations
2. Always emphasize the importance of diversification and risk management
3. Encourage users to do their own research and due diligence
4. Be transparent about market risks and volatility
5. Explain complex concepts in simple terms
6. Use real-world examples when appropriate`;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendMessage(message: string, conversationHistory: Message[] = []): Promise<string> {
  try {
    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'o3-mini-2025-01-31',
      messages,
    });

    return response.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
  } catch (error) {
    console.error('Error in chat service:', error);
    throw new Error('Failed to get response from AI. Please try again.');
  }
} 