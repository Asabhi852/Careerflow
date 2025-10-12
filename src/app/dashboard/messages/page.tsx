'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { Message, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// This would typically come from a more sophisticated source,
// like recent contacts or a user search.
// For this demo, we'll fetch a few public profiles to message.
function useConversationStarters() {
    const firestore = useFirestore();
    const profilesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'public_profiles'));
    }, [firestore]);
    const { data: profiles } = useCollection<UserProfile>(profilesQuery);
    return profiles;
}

export default function MessagesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const conversationStarters = useConversationStarters();
    const [selectedConversation, setSelectedConversation] = useState<UserProfile | null>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

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
        const messageId = doc(collection(firestore, 'temp')).id; // Generate a unique ID

        const messageData: Omit<Message, 'id'> = {
            senderId: user.uid,
            receiverId: selectedConversation.id,
            content: input.trim(),
            timestamp,
        };
        
        const senderRef = doc(firestore, 'users', user.uid, 'messages', messageId);
        const receiverRef = doc(firestore, 'users', selectedConversation.id, 'messages', messageId);

        try {
            setDocumentNonBlocking(senderRef, messageData, {});
            setDocumentNonBlocking(receiverRef, messageData, {});
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
                        <CardHeader>
                            <CardTitle>Conversations</CardTitle>
                            <CardDescription>Your recent chats.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2">
                            <div className="space-y-2">
                                {conversationStarters?.filter(p => p.id !== user?.uid).map(convo => (
                                    <Button key={convo.id} variant={selectedConversation?.id === convo.id ? "secondary" : "ghost"} className="w-full justify-start h-auto p-2" onClick={() => setSelectedConversation(convo)}>
                                        <Avatar className="h-10 w-10 mr-3">
                                            {convo.profilePictureUrl && <AvatarImage src={convo.profilePictureUrl} />}
                                            <AvatarFallback>{convo.firstName?.charAt(0)}{convo.lastName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="font-semibold">{convo.firstName} {convo.lastName}</p>
                                        </div>
                                    </Button>
                                ))}
                                {!conversationStarters && (
                                    <div className="p-2 space-y-2">
                                        <Skeleton className="h-14 w-full" />
                                        <Skeleton className="h-14 w-full" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
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
