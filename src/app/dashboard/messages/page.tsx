'use client';

// @ts-ignore - React hooks import issue
import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// @ts-ignore - Lucide icons import issue
import { Send, User, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, useDoc } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { Message, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { notifyNewMessage } from '@/lib/notifications';
// @ts-ignore - Next.js navigation import issue
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/ConversationList';
import { useConversations } from '@/hooks/useConversations';

function MessagesPageContent() {
    const { user } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const [selectedConversation, setSelectedConversation] = useState<UserProfile | null>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Use the new conversations hook
    const { conversations } = useConversations();

    // Get userId from URL params (when coming from candidate profile)
    const targetUserId = searchParams?.get('userId');

    // Fetch the target user's profile if userId is provided
    const targetUserRef = useMemoFirebase(() => {
        if (!firestore || !targetUserId) return null;
        return doc(firestore, 'public_profiles', targetUserId);
    }, [firestore, targetUserId]);

    const { data: targetUserProfile } = useDoc<UserProfile>(targetUserRef);

    // Auto-select conversation when coming from candidate profile
    useEffect(() => {
        if (targetUserProfile && !selectedConversation) {
            setSelectedConversation(targetUserProfile);
        }
    }, [targetUserProfile, selectedConversation]);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !user || !selectedConversation) return null;
        return query(
            collection(firestore, 'users', user.uid, 'messages'),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, user, selectedConversation]);

    const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);

    const filteredMessages = useMemo(() => {
        if (!messages || !selectedConversation || !user) return [];
        return messages.filter(msg =>
            (msg.senderId === user.uid && msg.receiverId === selectedConversation.id) ||
            (msg.senderId === selectedConversation.id && msg.receiverId === user.uid)
        );
    }, [messages, selectedConversation, user]);

    const scrollAreaViewport = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        if(scrollAreaViewport.current) {
            scrollAreaViewport.current.scrollTo({ top: scrollAreaViewport.current.scrollHeight, behavior: 'smooth' });
        }
    }
    useEffect(scrollToBottom, [filteredMessages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !user || !firestore || !selectedConversation) return;

        setIsSending(true);

        const timestamp = serverTimestamp();
        // @ts-ignore - Firebase doc function
        const messageId = doc(collection(firestore, 'temp')).id; // Generate a unique ID

        const messageData: Omit<Message, 'id'> = {
            senderId: user.uid,
            receiverId: selectedConversation.id,
            content: input.trim(),
            timestamp,
        };

        // @ts-ignore - Firebase doc function
        const senderRef = doc(firestore, 'users', user.uid, 'messages', messageId);
        // @ts-ignore - Firebase doc function
        const receiverRef = doc(firestore, 'users', selectedConversation.id, 'messages', messageId);

        try {
            // Save the message to both sender and receiver
            setDocumentNonBlocking(senderRef, messageData, {});
            setDocumentNonBlocking(receiverRef, messageData, {});
            
            // Create a conversation ID for the notification
            const conversationId = [user.uid, selectedConversation.id].sort().join('-');
            
            // Notify the receiver about the new message (only if sending to someone else)
            if (selectedConversation.id !== user.uid) {
                await notifyNewMessage(firestore, selectedConversation.id, {
                    senderId: user.uid,
                    senderName: `${user.displayName || user.email || 'Someone'}`,
                    conversationId: conversationId,
                    messagePreview: input.trim().substring(0, 50),
                });
            }
            
            setInput('');
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="grid gap-6">
            <h1 className="font-headline text-3xl font-bold tracking-tight">Messages</h1>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 h-[75vh]">
                    <div className="col-span-1 border-r">
                        <ConversationList
                            selectedConversation={selectedConversation}
                            onSelectConversation={setSelectedConversation}
                            conversations={conversations}
                        />
                    </div>
                    <div className="col-span-2 flex flex-col">
                        {selectedConversation ? (
                            <>
                                <CardHeader className="border-b">
                                    <CardTitle>{selectedConversation.firstName} {selectedConversation.lastName}</CardTitle>
                                </CardHeader>
                                <ScrollArea className="flex-1 p-6" viewportRef={scrollAreaViewport}>
                                    <div className="space-y-4">
                                        {isLoadingMessages && <div className="text-center p-8"><p className="text-muted-foreground">Loading messages...</p></div>}
                                        {filteredMessages.map((msg, index) => (
                                            <div key={index} className={`flex items-end gap-2 ${msg.senderId === user?.uid ? 'justify-end' : ''}`}>
                                                {msg.senderId !== user?.uid && <Avatar className="h-8 w-8"><AvatarImage src={selectedConversation.profilePictureUrl} /></Avatar>}
                                                <div className={`max-w-xs p-3 rounded-lg ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    <p>{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t flex items-center gap-2">
                                    <Input placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()} disabled={isSending} />
                                    <Button onClick={handleSendMessage} disabled={isSending || !input.trim()}><Send className="w-4 h-4" /></Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <MessageSquare size={48} className="text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">Select a conversation</h3>
                                <p className="text-muted-foreground">Choose someone from the list to start chatting.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MessagesPageContent />
        </Suspense>
    );
}
