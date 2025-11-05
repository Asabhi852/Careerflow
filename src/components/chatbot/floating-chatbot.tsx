'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, MessageCircle, Send, Bot, User as UserIcon, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { multilingualQueryResolution } from '@/ai/flows/multilingual-query-resolution';
import { useUser } from '@/firebase';
import { LanguageSelector } from './language-selector';
import { useI18n } from '@/i18n/I18nProvider';

interface Message {
  id: string;
  sequence: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export function FloatingChatbot() {
  const { user } = useUser();
  const { language, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageCounterRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update welcome message when language changes
  useEffect(() => {
    if (!isMounted) return;
    
    messageCounterRef.current = 0;
    const welcomeMessage: Message = {
      id: `msg-${messageCounterRef.current}`,
      sequence: messageCounterRef.current++,
      sender: 'bot',
      text: t('chatbot_welcome'),
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [language, isMounted, t]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Update unread count when minimized
  useEffect(() => {
    if (isMinimized || !isOpen) {
      const lastBotMessage = messages[messages.length - 1];
      if (lastBotMessage?.sender === 'bot' && messages.length > 1) {
        setUnreadCount((prev) => prev + 1);
      }
    } else {
      setUnreadCount(0);
    }
  }, [messages, isMinimized, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${messageCounterRef.current}`,
      sequence: messageCounterRef.current++,
      sender: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const userData = user ? `User ID: ${user.uid}, Email: ${user.email}` : undefined;

      const result = await multilingualQueryResolution({
        query: currentInput,
        language: language,
        userData,
      });

      if (result && result.answer) {
        const botMessage: Message = {
          id: `msg-${messageCounterRef.current}`,
          sequence: messageCounterRef.current++,
          sender: 'bot',
          text: result.answer,
          timestamp: new Date()
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Chatbot error:', error);

      const errorMessage: Message = {
        id: `msg-${messageCounterRef.current}`,
        sequence: messageCounterRef.current++,
        sender: 'bot',
        text: "I'm sorry, I'm having trouble right now. Please try again in a moment.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleChat}
            size="lg"
            className="rounded-full h-16 w-16 shadow-2xl hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 relative group"
          >
            <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Chat with AI Assistant
            </span>
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-300 transform",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
        )}>
          <Card className="w-full h-full shadow-2xl border-2 border-blue-100 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b-0 cursor-pointer" onClick={minimizeChat}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="relative">
                    <Bot className="h-5 w-5" />
                    <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-400 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <div className="font-semibold">AI Career Assistant</div>
                    <div className="text-xs text-blue-100 font-normal">
                      {isLoading ? t('chatbot_typing', 'Typing...') : t('chatbot_online', 'Online now')}
                    </div>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <LanguageSelector />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      minimizeChat();
                    }}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    title={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeChat();
                    }}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Chat Content - Hidden when minimized */}
            {!isMinimized && (
              <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4 min-h-full">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2 animate-in slide-in-from-bottom-2",
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.sender === 'bot' && (
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm flex-shrink-0">
                              <AvatarFallback className="bg-transparent">
                                <Bot size={14} />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={cn(
                              "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                              message.sender === 'user'
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-bl-sm'
                            )}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{message.text}</p>
                            <p className={cn(
                              "text-xs mt-1",
                              message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                            )}>
                              {(() => {
                                const date = message.timestamp;
                                const hours = date.getHours();
                                const minutes = date.getMinutes().toString().padStart(2, '0');
                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                const displayHours = hours % 12 || 12;
                                return `${displayHours}:${minutes} ${ampm}`;
                              })()}
                            </p>
                          </div>

                          {message.sender === 'user' && (
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-sm flex-shrink-0">
                              <AvatarFallback className="bg-transparent">
                                <UserIcon size={14} />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex gap-2">
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                            <AvatarFallback className="bg-transparent">
                              <Bot size={14} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-600">{t('chatbot_typing', 'Typing')}</span>
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {messages.length === 1 && (
                        <div className="text-center py-4">
                          <div className="grid grid-cols-1 gap-2">
                            {['Resume help', 'Interview tips', 'Job search'].map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                onClick={() => setInput(suggestion)}
                                className="text-xs rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>

                {/* Input Area */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('chatbot_placeholder', 'Type your message...')}
                      disabled={isLoading}
                      className="flex-1 rounded-full bg-gray-50 dark:bg-gray-900/60 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 text-sm shadow-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !input.trim()}
                      size="sm"
                      className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
