'use client';
// @ts-ignore - React hooks import issue
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { multilingualQueryResolution, type MultilingualQueryResolutionInput } from '@/ai/flows/multilingual-query-resolution';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// @ts-ignore - Lucide icons import issue
import { Bot, Loader2, Send, User as UserIcon, Mic, MicOff, Volume2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export function ChatbotInterface() {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const scrollAreaViewport = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        if(scrollAreaViewport.current) {
            scrollAreaViewport.current.scrollTo({ top: scrollAreaViewport.current.scrollHeight, behavior: 'smooth' });
        }
    }

    useEffect(scrollToBottom, [messages]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                    setIsListening(false);
                };

                recognitionRef.current.onerror = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        
        const userMessage: Message = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const userData = user ? JSON.stringify({ email: user.email, displayName: user.displayName }) : undefined;
            const request: MultilingualQueryResolutionInput = {
                query: input,
                userData,
            };

            const result = await multilingualQueryResolution(request);
            const botMessage: Message = { sender: 'bot', text: result.answer };
            setMessages((prev) => [...prev, botMessage]);
            
            // Auto-speak bot response
            speakText(result.answer);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot /> How can I help you today?</CardTitle>
                    <CardDescription>Ask me anything about job searching, profile tips, or career advice.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[50vh] pr-4" viewportRef={scrollAreaViewport}>
                        <div className="space-y-6">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                                    {message.sender === 'bot' && (
                                        <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                                            <AvatarFallback><Bot size={20} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="text-sm">{message.text}</p>
                                    </div>
                                     {message.sender === 'user' && (
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback><UserIcon size={20} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                                        <AvatarFallback><Bot size={20} /></AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="mt-6 space-y-2">
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                                placeholder="Ask about jobs, interviews, or career advice..."
                                disabled={isLoading || isListening}
                            />
                            <Button
                                variant={isListening ? 'destructive' : 'outline'}
                                size="icon"
                                onClick={toggleListening}
                                disabled={isLoading}
                                title={isListening ? 'Stop listening' : 'Start voice input'}
                            >
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={isSpeaking ? stopSpeaking : () => {}}
                                disabled={!isSpeaking}
                                title={isSpeaking ? 'Stop speaking' : 'Voice output'}
                            >
                                <Volume2 className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                                <Send className="w-4 h-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                        {isListening && (
                            <p className="text-sm text-muted-foreground text-center animate-pulse">
                                Listening... Speak now
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
