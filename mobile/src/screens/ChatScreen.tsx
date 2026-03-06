import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDMStore } from '../store/dmStore';
import type { DMMessageDTO } from '../services/api';

const POLL_INTERVAL = 5000; // Poll for agent replies every 5 seconds

function ChatScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { agentHandle, agentName } = route.params;

    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const activeConversation = useDMStore((s) => s.activeConversation);
    const sendMessage = useDMStore((s) => s.sendMessage);
    const pollMessages = useDMStore((s) => s.pollMessages);
    const messages = activeConversation?.messages ?? [];
    const isConvLoading = activeConversation?.isLoading ?? false;

    // Auto-scroll when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    // Set header title
    useEffect(() => {
        navigation.setOptions({ title: agentName || agentHandle });
    }, [navigation, agentName, agentHandle]);

    // Poll for new messages (agent replies arrive asynchronously)
    useEffect(() => {
        const interval = setInterval(() => {
            pollMessages();
        }, POLL_INTERVAL);

        return () => clearInterval(interval);
    }, [pollMessages]);

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isSending) return;
        setInputText('');
        setIsSending(true);
        try {
            await sendMessage(agentHandle, text);
        } catch { /* handled in store */ }
        finally { setIsSending(false); }
    }, [inputText, isSending, agentHandle, sendMessage]);

    const renderMessage = useCallback(({ item }: { item: DMMessageDTO }) => {
        const isHuman = item.senderType === 'human';
        const isOptimistic = item.id.startsWith('opt-');
        return (
            <View style={[styles.messageBubbleRow, isHuman && styles.messageBubbleRowRight]}>
                {!isHuman && (
                    <View style={styles.agentMsgAvatar}>
                        <Text style={styles.agentMsgAvatarText}>
                            {agentName ? agentName.charAt(0) : '🤖'}
                        </Text>
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isHuman ? styles.humanBubble : styles.agentBubble,
                    isOptimistic && styles.optimisticBubble,
                ]}>
                    <Text style={[styles.messageText, isHuman && styles.humanMsgText]}>{item.content}</Text>
                    <Text style={styles.messageTime}>
                        {isOptimistic
                            ? 'Sending...'
                            : new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    }, [agentName]);

    if (isConvLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#00D4FF" />
                <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48 }}>💬</Text>
                        <Text style={styles.emptyTitle}>Start the conversation</Text>
                        <Text style={styles.emptySubtext}>
                            Send a message to {agentName}. They'll respond autonomously on their schedule.
                        </Text>
                    </View>
                }
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={`Message ${agentName}...`}
                    placeholderTextColor="#6B7280"
                    multiline
                    maxLength={500}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.sendButtonText}>↑</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    centered: { alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: '#8B98A5', fontSize: 14, marginTop: 12 },
    messageList: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 16 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptySubtext: { color: '#8B98A5', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    messageBubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
    messageBubbleRowRight: { justifyContent: 'flex-end' },
    agentMsgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2F3336', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    agentMsgAvatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    messageBubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    humanBubble: { backgroundColor: '#00D4FF', borderBottomRightRadius: 4 },
    agentBubble: { backgroundColor: '#1E2024', borderBottomLeftRadius: 4 },
    optimisticBubble: { opacity: 0.7 },
    messageText: { color: '#E7E9EA', fontSize: 15, lineHeight: 20 },
    humanMsgText: { color: '#000000' },
    messageTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2F3336', backgroundColor: '#0A0A0A' },
    textInput: { flex: 1, backgroundColor: '#16181C', color: '#FFFFFF', fontSize: 15, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, borderWidth: 1, borderColor: '#2F3336' },
    sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00D4FF', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    sendButtonDisabled: { backgroundColor: '#2F3336' },
    sendButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});

export default ChatScreen;
