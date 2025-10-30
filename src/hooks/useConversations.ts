'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import type { Conversation, ConversationWithParticipant, Message, UserProfile } from '@/lib/types';

export function useConversations() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch user's messages and build conversation list
    useEffect(() => {
        if (!user || !firestore) {
            setIsLoading(false);
            return;
        }

        const fetchConversations = async () => {
            try {
                setIsLoading(true);

                // Get user's messages
                const messagesQuery = query(
                    collection(firestore, 'users', user.uid, 'messages'),
                    orderBy('timestamp', 'desc'),
                    limit(100)
                );

                const messagesSnapshot = await getDocs(messagesQuery);
                const messagesMap = new Map<string, Message[]>();

                // Group messages by conversation partner
                messagesSnapshot.docs.forEach(doc => {
                    const message = { id: doc.id, ...doc.data() } as Message;

                    // Determine the other participant
                    const otherUserId = message.senderId === user.uid ? message.receiverId : message.senderId;
                    const conversationId = otherUserId;

                    if (!messagesMap.has(conversationId)) {
                        messagesMap.set(conversationId, []);
                    }
                    messagesMap.get(conversationId)!.push(message);
                });

                // Build conversation objects
                const conversationList: Conversation[] = [];

                for (const [participantId, messages] of messagesMap.entries()) {
                    // Get participant profile
                    const participantDoc = await getDocs(query(
                        collection(firestore, 'public_profiles'),
                        where('id', '==', participantId),
                        limit(1)
                    ));

                    if (!participantDoc.empty) {
                        const participantData = participantDoc.docs[0].data() as UserProfile;

                        // Sort messages by timestamp
                        const sortedMessages = messages.sort((a, b) =>
                            (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
                        );

                        const lastMessage = sortedMessages[sortedMessages.length - 1];

                        conversationList.push({
                            id: participantId,
                            participantId,
                            participantName: `${participantData.firstName} ${participantData.lastName}`,
                            participantProfilePicture: participantData.profilePictureUrl,
                            lastMessage: lastMessage.content,
                            lastMessageTimestamp: lastMessage.timestamp,
                            isArchived: false, // Default to false, should be stored in user preferences
                            isPinned: false, // Default to false, should be stored in user preferences
                            unreadCount: 0, // Calculate based on messages not seen by user
                        });
                    }
                }

                setConversations(conversationList);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [user, firestore]);

    // Filter conversations based on search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;

        const query = searchQuery.toLowerCase();
        return conversations.filter(conversation =>
            conversation.participantName.toLowerCase().includes(query)
        );
    }, [conversations, searchQuery]);

    // Separate pinned and archived conversations
    const conversationsMemo = useMemo(() => {
        const pinned = filteredConversations.filter(c => c.isPinned && !c.isArchived);
        const regular = filteredConversations.filter(c => !c.isPinned && !c.isArchived);
        const archived = filteredConversations.filter(c => c.isArchived);

        return { pinnedConversations: pinned, regularConversations: regular, archivedConversations: archived };
    }, [filteredConversations]);

    const { pinnedConversations, regularConversations, archivedConversations } = conversationsMemo;

    // Archive/unarchive conversation
    const toggleArchiveConversation = async (conversationId: string) => {
        if (!user) return;

        setConversations(prev =>
            prev.map(conv =>
                conv.id === conversationId
                    ? { ...conv, isArchived: !conv.isArchived }
                    : conv
            )
        );

        // TODO: Update in user's preferences collection
    };

    // Pin/unpin conversation
    const togglePinConversation = async (conversationId: string) => {
        if (!user) return;

        setConversations(prev =>
            prev.map(conv =>
                conv.id === conversationId
                    ? { ...conv, isPinned: !conv.isPinned }
                    : conv
            )
        );

        // TODO: Update in user's preferences collection
    };

    return {
        conversations: filteredConversations,
        pinnedConversations,
        regularConversations,
        archivedConversations,
        isLoading,
        searchQuery,
        setSearchQuery,
        toggleArchiveConversation,
        togglePinConversation,
    };
}
