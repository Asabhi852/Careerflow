'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Archive, Pin, MoreVertical, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversations } from '@/hooks/useConversations';
import type { Conversation, UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
    selectedConversation: UserProfile | null;
    onSelectConversation: (conversation: UserProfile) => void;
    conversations: Conversation[];
}

export function ConversationList({ selectedConversation, onSelectConversation, conversations }: ConversationListProps) {
    const { searchQuery, setSearchQuery, toggleArchiveConversation, togglePinConversation } = useConversations();
    const [showArchived, setShowArchived] = useState(false);

    const handleConversationClick = async (conversation: Conversation) => {
        // TODO: Fetch the participant profile and call onSelectConversation
        // For now, we'll just pass a basic profile object
        const participantProfile: UserProfile = {
            id: conversation.participantId,
            firstName: conversation.participantName.split(' ')[0],
            lastName: conversation.participantName.split(' ').slice(1).join(' '),
            email: '', // This should be fetched from the profile
            profilePictureUrl: conversation.participantProfilePicture,
        };

        onSelectConversation(participantProfile);
    };

    const formatLastMessageTime = (timestamp: any) => {
        if (!timestamp) return '';

        try {
            if (timestamp.seconds) {
                return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true });
            }
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (error) {
            return '';
        }
    };

    const displayConversations = showArchived
        ? conversations.filter(c => c.isArchived)
        : conversations.filter(c => !c.isArchived);

    return (
        <div className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                    Conversations
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowArchived(!showArchived)}
                    >
                        {showArchived ? 'Show Active' : 'Show Archived'}
                    </Button>
                </CardTitle>
                <CardDescription>
                    {showArchived ? 'Your archived chats.' : 'Your recent chats.'}
                </CardDescription>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-2 overflow-hidden">
                <div className="space-y-2 h-full overflow-y-auto">
                    {displayConversations.length === 0 && !conversations.some(c => c.isArchived) ? (
                        <div className="text-center p-8">
                            <MessageSquare size={48} className="text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No conversations yet</h3>
                            <p className="text-muted-foreground">Start a conversation with someone to see it here.</p>
                        </div>
                    ) : (
                        displayConversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`relative group cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors ${
                                    selectedConversation?.id === conversation.participantId ? 'bg-muted' : ''
                                }`}
                                onClick={() => handleConversationClick(conversation)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={conversation.participantProfilePicture} />
                                            <AvatarFallback>
                                                {conversation.participantName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conversation.isPinned && (
                                            <Pin className="absolute -top-1 -right-1 h-4 w-4 text-primary bg-background rounded-full p-0.5" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold truncate">
                                                {conversation.participantName}
                                            </p>
                                            {conversation.isArchived && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Archived
                                                </Badge>
                                            )}
                                        </div>

                                        {conversation.lastMessage && (
                                            <p className="text-sm text-muted-foreground truncate mt-1">
                                                {conversation.lastMessage}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-muted-foreground">
                                                {formatLastMessageTime(conversation.lastMessageTimestamp)}
                                            </span>

                                            {conversation.unreadCount && conversation.unreadCount > 0 && (
                                                <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                                    {conversation.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons - visible on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleArchiveConversation(conversation.id);
                                            }}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Archive className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePinConversation(conversation.id);
                                            }}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Pin className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {displayConversations.length === 0 && conversations.some(c => c.isArchived) && showArchived && (
                        <div className="text-center p-8">
                            <Archive size={48} className="text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No archived conversations</h3>
                            <p className="text-muted-foreground">Your archived chats will appear here.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </div>
    );
}
