'use client';

// @ts-ignore - React hooks import issue
import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - Lucide icons import issue
import { Send, MessageSquare, Check, CheckCheck, Clock } from 'lucide-react';
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
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        const timestamp = serverTimestamp();
        // @ts-ignore - Firebase doc function
        const messageId = doc(collection(firestore, 'temp')).id; // Generate a unique ID

        const messageData: Omit<Message, 'id'> = {
            senderId: user.uid,
            receiverId: selectedConversation.id,
            content: input.trim(),
            timestamp,
            status: 'sent',
            read: false,
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
                                <CardHeader className="border-b bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={selectedConversation.profilePictureUrl} />
                                            <AvatarFallback>
                                                {selectedConversation.firstName?.[0]}{selectedConversation.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <CardTitle className="text-base">
                                                {selectedConversation.firstName} {selectedConversation.lastName}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                {isTyping ? 'typing...' : 'Online'}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <ScrollArea className="flex-1 p-6" viewportRef={scrollAreaViewport}>
                                    <div className="space-y-4">
                                        {isLoadingMessages && <div className="text-center p-8"><p className="text-muted-foreground">Loading messages...</p></div>}
                                        {!isLoadingMessages && filteredMessages.length === 0 && (
                                            <div className="text-center p-8">
                                                <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                                            </div>
                                        )}
                                        {filteredMessages.map((msg, index) => {
                                            const isSender = msg.senderId === user?.uid;
                                            const timestamp = msg.timestamp?.toDate?.() || msg.timestamp;
                                            
                                            // Format time like WhatsApp
                                            const now = new Date();
                                            const isToday = timestamp instanceof Date && timestamp.toDateString() === now.toDateString();
                                            const isYesterday = timestamp instanceof Date && 
                                                new Date(timestamp.getTime() + 86400000).toDateString() === now.toDateString();
                                            
                                            const timeString = timestamp instanceof Date 
                                                ? timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                                                : '';
                                            
                                            let dateString = '';
                                            if (timestamp instanceof Date) {
                                                if (isToday) {
                                                    dateString = 'Today';
                                                } else if (isYesterday) {
                                                    dateString = 'Yesterday';
                                                } else {
                                                    dateString = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                }
                                            }
                                            
                                            // Show date separator if this is the first message of a new day
                                            const showDateSeparator = index === 0 || (
                                                filteredMessages[index - 1]?.timestamp?.toDate?.()?.toDateString() !== timestamp?.toDateString?.()
                                            );
                                            
                                            // Check if we should group this message with the previous one
                                            const prevMsg = filteredMessages[index - 1];
                                            const shouldGroup = prevMsg && 
                                                prevMsg.senderId === msg.senderId && 
                                                !showDateSeparator &&
                                                timestamp instanceof Date && 
                                                prevMsg.timestamp?.toDate?.() &&
                                                Math.abs(timestamp.getTime() - prevMsg.timestamp.toDate().getTime()) < 60000;

                                            return (
                                                <div key={msg.id || index}>
                                                    {showDateSeparator && dateString && (
                                                        <div className="flex items-center justify-center my-4">
                                                            <Badge variant="secondary" className="px-3 py-1 text-xs font-normal">
                                                                {dateString}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'} ${shouldGroup ? 'mt-1' : 'mt-4'}`}>
                                                        {!isSender && !shouldGroup && (
                                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                                <AvatarImage src={selectedConversation.profilePictureUrl} />
                                                                <AvatarFallback>
                                                                    {selectedConversation.firstName?.[0]}{selectedConversation.lastName?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        {!isSender && shouldGroup && <div className="w-8" />}
                                                        <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                                            <div className={`group relative px-3 py-2 rounded-lg shadow-sm ${
                                                                isSender 
                                                                    ? 'bg-[#dcf8c6] text-gray-900' 
                                                                    : 'bg-white border border-gray-200 text-gray-900'
                                                            } ${!shouldGroup ? (isSender ? 'rounded-br-none' : 'rounded-bl-none') : ''}`}>
                                                                <p className="break-words text-sm leading-relaxed">{msg.content}</p>
                                                                <div className={`flex items-center gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                                                    <span className="text-[10px] text-gray-500">
                                                                        {timeString}
                                                                    </span>
                                                                    {isSender && (
                                                                        <span className="text-blue-500">
                                                                            {msg.read ? (
                                                                                <CheckCheck className="h-3 w-3" />
                                                                            ) : msg.status === 'delivered' ? (
                                                                                <CheckCheck className="h-3 w-3 text-gray-400" />
                                                                            ) : msg.status === 'sent' ? (
                                                                                <Check className="h-3 w-3 text-gray-400" />
                                                                            ) : (
                                                                                <Clock className="h-3 w-3 text-gray-400" />
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isSender && !shouldGroup && (
                                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                                <AvatarImage src={user?.photoURL || undefined} />
                                                                <AvatarFallback>
                                                                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        {isSender && shouldGroup && <div className="w-8" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            placeholder="Type a message..." 
                                            value={input} 
                                            onChange={(e) => {
                                                setInput(e.target.value);
                                                if (e.target.value.length > 0 && !isTyping) {
                                                    setIsTyping(true);
                                                }
                                                if (typingTimeoutRef.current) {
                                                    clearTimeout(typingTimeoutRef.current);
                                                }
                                                typingTimeoutRef.current = setTimeout(() => {
                                                    setIsTyping(false);
                                                }, 1000);
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            disabled={isSending}
                                            className="flex-1"
                                        />
                                        <Button 
                                            onClick={handleSendMessage} 
                                            disabled={isSending || !input.trim()}
                                            size="icon"
                                            className="flex-shrink-0"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
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
