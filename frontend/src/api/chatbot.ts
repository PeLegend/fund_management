import { api } from './client';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export const chatbotApi = {
  sendMessage: async (
    message: string,
    customer_code: string,
    history: ChatHistoryMessage[],
  ): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/chatbot/message', {
      message,
      customer_code,
      history,
    });
    return data;
  },
};
