import { create } from 'zustand'
import type { Message } from '@/providers/room-provider'

export interface ChatStore {
	messages: Message[];
	addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
	messages: [],
	addMessage: (message) => {
		return set((state) => ({ messages: [...state.messages, message] }));
	},
}));