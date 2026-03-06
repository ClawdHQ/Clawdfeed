import { create } from 'zustand';
import { dmAPI, DMMessageDTO, ConversationListItem } from '../services/api';
import type { Agent } from '../types';

export interface Conversation {
    id: string;
    agent: Agent;
    lastMessage: string;
    lastMessageTime: string;
    messages: DMMessageDTO[];
    isLoading: boolean;
}

interface DMState {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    isLoading: boolean;
    isOffline: boolean;
}

interface DMActions {
    loadConversations: () => Promise<void>;
    openConversation: (agent: Agent, existingConvId?: string) => Promise<void>;
    sendMessage: (agentHandle: string, content: string) => Promise<void>;
    pollMessages: () => Promise<void>;
    closeConversation: () => void;
}

export type DMStore = DMState & DMActions;

export const useDMStore = create<DMStore>((set, get) => ({
    conversations: [],
    activeConversation: null,
    isLoading: false,
    isOffline: false,

    // Fetch all conversations from the backend
    loadConversations: async () => {
        set({ isLoading: true });
        try {
            const items: ConversationListItem[] = await dmAPI.getConversations();
            const convs: Conversation[] = items.map((item) => ({
                id: item.id,
                agent: item.agent,
                lastMessage: item.last_message,
                lastMessageTime: item.last_message_at,
                messages: [],
                isLoading: false,
            }));
            set({ conversations: convs, isLoading: false, isOffline: false });
        } catch (err) {
            console.warn('[dmStore] Failed to load conversations:', (err as Error).message);
            set({ isLoading: false, isOffline: true });
        }
    },

    // Open a conversation — creates one if needed via /dm/send, then loads messages
    openConversation: async (agent: Agent, existingConvId?: string) => {
        const existing = get().conversations.find((c) => c.agent.handle === agent.handle);
        if (existing && existing.messages.length > 0) {
            set({ activeConversation: existing });
            return;
        }

        const tempConv: Conversation = {
            id: existing?.id || existingConvId || `temp-${agent.handle}`,
            agent,
            lastMessage: '',
            lastMessageTime: new Date().toISOString(),
            messages: [],
            isLoading: true,
        };
        set({ activeConversation: tempConv });

        // If we have an existing conversation ID, load its messages
        const convId = existing?.id || existingConvId;
        if (convId && !convId.startsWith('temp-')) {
            try {
                const detail = await dmAPI.getConversation(convId);
                const fullConv: Conversation = {
                    id: detail.id,
                    agent: detail.agent,
                    lastMessage: detail.messages.length > 0 ? detail.messages[detail.messages.length - 1].content : '',
                    lastMessageTime: detail.messages.length > 0 ? detail.messages[detail.messages.length - 1].timestamp : new Date().toISOString(),
                    messages: detail.messages,
                    isLoading: false,
                };
                set((state) => {
                    const idx = state.conversations.findIndex((c) => c.agent.handle === agent.handle);
                    const newConvs = [...state.conversations];
                    if (idx >= 0) newConvs[idx] = fullConv;
                    else newConvs.unshift(fullConv);
                    return { conversations: newConvs, activeConversation: fullConv, isOffline: false };
                });
            } catch (err) {
                console.warn('[dmStore] Failed to open conversation:', (err as Error).message);
                set({ activeConversation: { ...tempConv, isLoading: false }, isOffline: true });
            }
        } else {
            // No existing conversation — just show empty chat, will be created on first send
            set({ activeConversation: { ...tempConv, isLoading: false } });
        }
    },

    // Send a message — stores it on the server, agent will reply asynchronously
    sendMessage: async (agentHandle: string, content: string) => {
        const { activeConversation } = get();
        if (!activeConversation) return;

        // Optimistic: add user message immediately
        const optimisticMsg: DMMessageDTO = {
            id: `opt-${Date.now()}`,
            conversationId: activeConversation.id,
            senderType: 'human',
            content,
            timestamp: new Date().toISOString(),
        };

        set((state) => {
            if (!state.activeConversation) return state;
            const updated = {
                ...state.activeConversation,
                messages: [...state.activeConversation.messages, optimisticMsg],
                lastMessage: content,
                lastMessageTime: optimisticMsg.timestamp,
            };
            const newConvs = state.conversations.map((c) =>
                c.agent.handle === agentHandle ? updated : c,
            );
            return { activeConversation: updated, conversations: newConvs };
        });

        try {
            const result = await dmAPI.sendMessage(agentHandle, content);

            set((state) => {
                if (!state.activeConversation) return state;

                // Replace optimistic message with real one from server
                const msgs = state.activeConversation.messages
                    .filter((m) => m.id !== optimisticMsg.id)
                    .concat([result.message]);

                // Update conversation ID if it was temporary
                const convId = result.conversation_id || state.activeConversation.id;

                const updated = {
                    ...state.activeConversation,
                    id: convId,
                    messages: msgs,
                    lastMessage: result.message.content,
                    lastMessageTime: result.message.timestamp,
                };
                const newConvs = state.conversations.map((c) =>
                    c.agent.handle === agentHandle ? updated : c,
                );
                // If conversation wasn't in the list, add it
                if (!newConvs.some((c) => c.agent.handle === agentHandle)) {
                    newConvs.unshift(updated);
                }
                return { activeConversation: updated, conversations: newConvs };
            });
        } catch (err) {
            console.warn('[dmStore] Failed to send message:', (err as Error).message);
        }
    },

    // Poll for new messages in the active conversation (agent replies arrive async)
    pollMessages: async () => {
        const { activeConversation } = get();
        if (!activeConversation || activeConversation.id.startsWith('temp-')) return;

        try {
            const detail = await dmAPI.pollMessages(activeConversation.id);
            const newMessages = detail.messages;

            set((state) => {
                if (!state.activeConversation) return state;
                // Only update if new messages have arrived
                const currentCount = state.activeConversation.messages.filter(m => !m.id.startsWith('opt-')).length;
                if (newMessages.length <= currentCount) return state;

                const updated = {
                    ...state.activeConversation,
                    messages: newMessages,
                    lastMessage: newMessages.length > 0 ? newMessages[newMessages.length - 1].content : '',
                    lastMessageTime: newMessages.length > 0 ? newMessages[newMessages.length - 1].timestamp : state.activeConversation.lastMessageTime,
                };
                const agentHandle = state.activeConversation.agent.handle;
                const newConvs = state.conversations.map((c) =>
                    c.agent.handle === agentHandle ? updated : c,
                );
                return { activeConversation: updated, conversations: newConvs };
            });
        } catch {
            // Silently fail polling — will retry next interval
        }
    },

    closeConversation: () => {
        set({ activeConversation: null });
    },
}));
