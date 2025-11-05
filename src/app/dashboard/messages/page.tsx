'use client';

// @ts-ignore - React hooks import issue
import { useState, useRef, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - Lucide icons import issue
import { Send, MessageSquare, Check, CheckCheck, Clock, ArrowDown, MoreVertical, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, useDoc } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { collection, query, orderBy, serverTimestamp, doc, Timestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Message, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { notifyNewMessage } from '@/lib/notifications';
import { toast } from '@/hooks/use-toast';
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
    const [showClearChatDialog, setShowClearChatDialog] = useState(false);
    const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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
        
        // Filter messages for this conversation
        const conversationMessages = messages.filter(msg =>
            msg.id && // Must have an ID
            ((msg.senderId === user.uid && msg.receiverId === selectedConversation.id) ||
            (msg.senderId === selectedConversation.id && msg.receiverId === user.uid))
        );
        
        // Deduplicate messages by ID (in case of duplicates in database)
        const uniqueMessages = Array.from(
            new Map(conversationMessages.map(msg => [msg.id, msg])).values()
        );
        
        // Debug: Log messages for troubleshooting (only in development)
        if (process.env.NODE_ENV === 'development' && uniqueMessages.length > 0) {
            console.log('Messages before sort:', uniqueMessages.map(m => ({
                id: m.id?.substring(0, 8),
                content: m.content?.substring(0, 20),
                timestamp: m.timestamp
            })));
        }
        
        // Sort messages by timestamp to ensure proper sequential order
        // Handle both Firestore Timestamp and Date objects
        const sortedMessages = uniqueMessages.sort((a, b) => {
            // Helper function to extract timestamp in milliseconds
            const getTimestamp = (msg: Message): number => {
                if (!msg.timestamp) return 0;
                
                // Firestore Timestamp with toDate method
                if (typeof msg.timestamp.toDate === 'function') {
                    try {
                        return msg.timestamp.toDate().getTime();
                    } catch (e) {
                        console.warn('Failed to convert timestamp:', e);
                    }
                }
                
                // Firestore Timestamp with seconds property
                if (typeof msg.timestamp.seconds === 'number') {
                    return msg.timestamp.seconds * 1000 + (msg.timestamp.nanoseconds || 0) / 1000000;
                }
                
                // JavaScript Date object
                if (msg.timestamp instanceof Date) {
                    return msg.timestamp.getTime();
                }
                
                // Date string or number
                try {
                    const parsed = new Date(msg.timestamp as any).getTime();
                    if (!isNaN(parsed)) return parsed;
                } catch (e) {
                    // Ignore parse errors
                }
                
                return 0;
            };
            
            const aTime = getTimestamp(a);
            const bTime = getTimestamp(b);
            
            // If both have valid timestamps, sort by time
            if (aTime && bTime && aTime !== bTime) {
                return aTime - bTime;
            }
            
            // If timestamps are identical or both missing, use message ID for stable sort
            if (aTime === bTime) {
                return (a.id || '').localeCompare(b.id || '');
            }
            
            // Messages without timestamps go to the end
            if (!aTime && bTime) return 1;
            if (aTime && !bTime) return -1;
            
            return 0;
        });
        
        // Debug: Log sorted messages (only in development)
        if (process.env.NODE_ENV === 'development' && sortedMessages.length > 0) {
            console.log('Messages after sort:', sortedMessages.map(m => ({
                id: m.id?.substring(0, 8),
                content: m.content?.substring(0, 20),
                timestamp: m.timestamp,
                extractedTime: (() => {
                    if (m.timestamp?.toDate) return m.timestamp.toDate().toISOString();
                    if (m.timestamp?.seconds) return new Date(m.timestamp.seconds * 1000).toISOString();
                    return 'unknown';
                })()
            })));
        }
        
        return sortedMessages;
    }, [messages, selectedConversation, user]);

    // Auto-mark messages as read when viewing conversation
    useEffect(() => {
        if (!user || !firestore || !selectedConversation || !filteredMessages) return;

        const unreadMessages = filteredMessages.filter(
            msg => msg.receiverId === user.uid && !msg.read && msg.id
        );

        if (unreadMessages.length > 0) {
            // Mark messages as read after a short delay
            const timer = setTimeout(async () => {
                try {
                    const updatePromises = unreadMessages.map(async (msg) => {
                        const messageRef = doc(firestore, 'users', user.uid, 'messages', msg.id);
                        await setDocumentNonBlocking(messageRef, { read: true }, { merge: true });
                    });
                    await Promise.all(updatePromises);
                    console.log(`Marked ${unreadMessages.length} messages as read`);
                } catch (error) {
                    console.error('Error marking messages as read:', error);
                }
            }, 1000); // 1 second delay

            return () => clearTimeout(timer);
        }
    }, [filteredMessages, selectedConversation, user, firestore]);

    const scrollAreaViewport = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Improved scroll to bottom function with better reliability
    const scrollToBottom = useCallback((force = false) => {
        if (!scrollAreaViewport.current || (!shouldAutoScroll && !force)) return;

        const viewport = scrollAreaViewport.current;
        const scrollHeight = viewport.scrollHeight;
        const clientHeight = viewport.clientHeight;
        const scrollTop = viewport.scrollTop;

        // Check if user is near bottom (within 100px)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        if (force || isNearBottom) {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
                viewport.scrollTo({
                    top: scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    }, [shouldAutoScroll]);

    const [showScrollButton, setShowScrollButton] = useState(false);

    // Handle scroll events to detect user scrolling and show/hide scroll button
    const handleScroll = useCallback(() => {
        if (!scrollAreaViewport.current) return;

        const viewport = scrollAreaViewport.current;
        const scrollHeight = viewport.scrollHeight;
        const clientHeight = viewport.clientHeight;
        const scrollTop = viewport.scrollTop;

        // If user scrolls up more than 100px from bottom, disable auto-scroll and show button
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const shouldShowButton = distanceFromBottom > 150; // Show button if more than 150px from bottom

        setShouldAutoScroll(distanceFromBottom < 100);
        setShowScrollButton(shouldShowButton);
    }, []);

    // Auto-scroll when messages change or conversation changes
    useEffect(() => {
        if (filteredMessages.length > 0) {
            // Small delay to ensure DOM is updated
            const timeoutId = setTimeout(() => scrollToBottom(), 100);
            return () => clearTimeout(timeoutId);
        }
    }, [filteredMessages.length, selectedConversation, scrollToBottom]);

    // Add scroll event listener
    useEffect(() => {
        const viewport = scrollAreaViewport.current;
        if (viewport) {
            viewport.addEventListener('scroll', handleScroll, { passive: true });
            return () => viewport.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    // Clear all messages in the current conversation
    const handleClearChat = async () => {
        if (!user || !firestore || !selectedConversation) return;

        setIsDeleting(true);
        try {
            const batch = writeBatch(firestore);
            
            // Delete all messages for this conversation from user's messages
            filteredMessages.forEach((msg) => {
                const messageRef = doc(firestore, 'users', user.uid, 'messages', msg.id);
                batch.delete(messageRef);
            });

            await batch.commit();
            
            toast({
                title: 'Chat cleared',
                description: 'All messages in this conversation have been deleted.',
            });
            
            setShowClearChatDialog(false);
        } catch (error) {
            console.error('Error clearing chat:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to clear chat. Please try again.',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Delete a single message
    const handleDeleteMessage = async () => {
        if (!user || !firestore || !messageToDelete) return;

        setIsDeleting(true);
        try {
            // Delete message from user's messages collection
            const messageRef = doc(firestore, 'users', user.uid, 'messages', messageToDelete.id);
            await deleteDoc(messageRef);
            
            toast({
                title: 'Message deleted',
                description: 'The message has been removed.',
            });
            
            setShowDeleteMessageDialog(false);
            setMessageToDelete(null);
        } catch (error) {
            console.error('Error deleting message:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete message. Please try again.',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !user || !firestore || !selectedConversation) return;

        setIsSending(true);
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // @ts-ignore - Firebase doc function
        const messageId = doc(collection(firestore, 'temp')).id; // Generate a unique ID
        
        // Use current timestamp for immediate and consistent ordering
        const now = Timestamp.now();
        const messageData: Omit<Message, 'id'> = {
            senderId: user.uid,
            receiverId: selectedConversation.id,
            content: input.trim(),
            timestamp: now,
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

            // Force scroll to bottom after sending message
            setTimeout(() => scrollToBottom(true), 200);
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
                                    <div className="flex items-center justify-between gap-3">
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => setShowClearChatDialog(true)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Clear Chat
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <ScrollArea className="flex-1 p-4 md:p-6 relative" viewportRef={scrollAreaViewport}>
                                    <div className="space-y-2 min-h-0 pb-4">
                                        {isLoadingMessages && <div className="text-center p-8"><p className="text-muted-foreground">Loading messages...</p></div>}
                                        {!isLoadingMessages && filteredMessages.length === 0 && (
                                            <div className="text-center p-8">
                                                <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {filteredMessages.map((msg, index) => {
                                            const isSender = msg.senderId === user?.uid;
                                            const timestamp = msg.timestamp?.toDate?.() || msg.timestamp;
                                            
                                            // Format time like WhatsApp
                                            const now = new Date();
                                            const isToday = timestamp instanceof Date && timestamp.toDateString() === now.toDateString();
                                            const isYesterday = timestamp instanceof Date && 
                                                new Date(timestamp.getTime() + 86400000).toDateString() === now.toDateString();
                                            
                                            let timeString = '';
                                            if (timestamp instanceof Date) {
                                                const hours = timestamp.getHours();
                                                const minutes = timestamp.getMinutes().toString().padStart(2, '0');
                                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                                const displayHours = hours % 12 || 12;
                                                timeString = `${displayHours}:${minutes} ${ampm}`;
                                            }
                                            
                                            let dateString = '';
                                            if (timestamp instanceof Date) {
                                                if (isToday) {
                                                    dateString = 'Today';
                                                } else if (isYesterday) {
                                                    dateString = 'Yesterday';
                                                } else {
                                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    const month = monthNames[timestamp.getMonth()];
                                                    const day = timestamp.getDate();
                                                    const year = timestamp.getFullYear();
                                                    dateString = `${month} ${day}, ${year}`;
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
                                                <div key={msg.id}>
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
                                                        <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                                                            <div className="relative group/message">
                                                                <div className={`px-3 py-2 rounded-lg shadow-sm ${
                                                                    isSender 
                                                                        ? 'bg-[#dcf8c6] text-gray-900' 
                                                                        : 'bg-white border border-gray-200 text-gray-900'
                                                                } ${!shouldGroup ? (isSender ? 'rounded-br-none' : 'rounded-bl-none') : ''}`}>
                                                                    <p className="break-words text-sm leading-relaxed whitespace-pre-wrap overflow-wrap-break-word" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                                                        {msg.content}
                                                                    </p>
                                                                <div className={`flex items-center gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                                        {timeString}
                                                                    </span>
                                                                    {isSender && (
                                                                        <span className="text-blue-500 flex-shrink-0">
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
                                                            {/* Delete button - appears on hover */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`absolute ${isSender ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/message:opacity-100 transition-opacity`}
                                                                onClick={() => {
                                                                    setMessageToDelete(msg);
                                                                    setShowDeleteMessageDialog(true);
                                                                }}
                                                                title="Delete message"
                                                            >
                                                                <Trash2 className="h-3 w-3 text-destructive" />
                                                            </Button>
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
                                        {/* Invisible element to scroll to */}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Floating scroll to bottom button */}
                                    {showScrollButton && (
                                        <Button
                                            onClick={() => scrollToBottom(true)}
                                            size="sm"
                                            className="absolute bottom-6 right-6 rounded-full shadow-lg z-10 bg-primary hover:bg-primary/90"
                                            title="Scroll to bottom"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    )}
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

            {/* Clear Chat Confirmation Dialog */}
            <AlertDialog open={showClearChatDialog} onOpenChange={setShowClearChatDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear this chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete all messages in this conversation from your view. This action cannot be undone.
                            The other person will still be able to see the messages.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearChat}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Clearing...' : 'Clear Chat'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Message Confirmation Dialog */}
            <AlertDialog open={showDeleteMessageDialog} onOpenChange={setShowDeleteMessageDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the message from your view. This action cannot be undone.
                            The other person will still be able to see the message.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMessage}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Message'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
