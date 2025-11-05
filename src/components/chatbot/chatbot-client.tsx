'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User as UserIcon, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { multilingualQueryResolution, type MultilingualQueryResolutionInput } from '@/ai/flows/multilingual-query-resolution';
import { useUser } from '@/firebase';

// TypeScript interfaces for Speech Recognition API
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

interface Message {
  id: string;
  sequence: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export function ChatbotClient() {
  const { user } = useUser();
  const { language } = require('../../i18n/I18nProvider').useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const scrollAreaViewport = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageCounterRef = useRef(0);

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Check for speech recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognitionAPI);
    }

    // Add welcome message
    const welcomes: Record<string, string> = {
      en: "👋 Hello! I'm your AI Career Assistant. I can help you with:\n\n• Job search strategies and tips\n• Resume writing and optimization\n• Interview preparation\n• Career planning and advice\n• Skill development recommendations\n\nWhat would you like to know?",
      hi: '👋 नमस्ते! मैं आपका एआई करियर असिस्टेंट हूँ. मैं आपकी मदद कर सकता हूँ:\n\n• नौकरी खोज रणनीतियाँ और टिप्स\n• रिज़्यूमे लिखना और सुधार\n• इंटरव्यू तैयारी\n• करियर प्लानिंग और सलाह\n• कौशल विकास सुझाव\n\nआप क्या जानना चाहेंगे?',
      te: '👋 హలో! నేను మీ AI కెరీర్ అసిస్టెంట్. నేను మీకు సహాయం చేయగలను:\n\n• ఉద్యోగ శోధన వ్యూహాలు మరియు చిట్కాలు\n• రిజ్యూమ్ రాయడం మరియు మెరుగుదల\n• ఇంటర్వ్యూ సిద్ధత\n• కెరీర్ ప్లానింగ్ మరియు సలహాలు\n• నైపుణ్య అభివృద్ధి సూచనలు\n\nమీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?',
      ta: '👋 வணக்கம்! நான் உங்கள் AI தொழில் உதவியாளர். நான் உதவ முடியும்:\n\n• வேலை தேடல் யுக்திகள் மற்றும் குறிப்புகள்\n• ரெச்யூமே எழுத்து மற்றும் மேம்பாடு\n• நேர்காணல் தயாரிப்பு\n• தொழில் திட்டமிடம் மற்றும் ஆலோசனை\n• திறன் மேம்பாட்டு பரிந்துரைகள்\n\nநீங்கள் என்னத் தெரிந்து கொள்ள விரும்புகிறீர்கள்?',
    };
    messageCounterRef.current = 0;
    const welcomeMessage: Message = {
      id: `msg-${messageCounterRef.current}`,
      sequence: messageCounterRef.current++,
      sender: 'bot',
      text: welcomes[language] || welcomes.en,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isClient || !speechSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      
      // Auto-focus input after speech recognition
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        addBotMessage("I didn't hear anything. Please try again.");
      } else if (event.error === 'not-allowed') {
        addBotMessage("Please allow microphone access to use voice input.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isClient, speechSupported]);

  // Helper function to add bot message
  const addBotMessage = (text: string) => {
    const botMessage: Message = {
      id: `msg-${messageCounterRef.current}`,
      sequence: messageCounterRef.current++,
      sender: 'bot',
      text,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  // Toggle voice input
  const toggleListening = () => {
    if (!isClient || !speechSupported || !recognitionRef.current) {
      addBotMessage("Sorry, speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        addBotMessage("Error starting voice input. Please try again.");
        setIsListening(false);
      }
    }
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if (!isClient || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (!isClient || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Send message to AI
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
      // Get user profile data for context
      const userData = user ? `User ID: ${user.uid}, Email: ${user.email}` : undefined;

      const request: MultilingualQueryResolutionInput = {
        query: currentInput,
        language: language,
        userData,
      };

      const result = await multilingualQueryResolution(request);

      if (result && result.answer) {
        const botMessage: Message = {
          id: `msg-${messageCounterRef.current}`,
          sequence: messageCounterRef.current++,
          sender: 'bot',
          text: result.answer,
          timestamp: new Date()
        };

        setMessages((prev) => [...prev, botMessage]);

        // Optionally speak the response
        if (isSpeaking) {
          speakText(result.answer);
        }
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Chatbot error:', error);

      const errorMessage: Message = {
        id: `msg-${messageCounterRef.current}`,
        sequence: messageCounterRef.current++,
        sender: 'bot',
        text: "I'm sorry, I'm experiencing technical difficulties right now. Please try again in a moment. If the problem persists, you can try rephrasing your question or contact support.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      
      // Focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Loading skeleton for SSR
  if (!isClient) {
    return (
      <div className="container max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200" style={{ height: '80vh' }}>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-4 w-32 bg-blue-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-16 bg-blue-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center" style={{ height: 'calc(80vh - 160px)' }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto">
      {/* Professional Chat Container */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200" style={{ height: '80vh' }}>
        {/* Enhanced Chat Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-2 border-white shadow-md">
                <AvatarFallback className="bg-transparent">
                  <Bot size={20} />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">AI Career Assistant</h3>
                <p className="text-xs text-gray-600">
                  {isLoading ? 'Typing...' : 'Online • Ready to help'}
                </p>
              </div>
            </div>

            {/* Voice toggle button */}
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <Button
                variant="ghost"
                size="sm"
                onClick={isSpeaking ? stopSpeaking : undefined}
                className={isSpeaking ? 'text-blue-600' : 'text-gray-500'}
                title={isSpeaking ? 'Voice enabled' : 'Voice disabled'}
              >
                {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 bg-gradient-to-b from-gray-50 to-white p-6" style={{ height: 'calc(80vh - 160px)' }}>
          <ScrollArea className="h-full pr-4" viewportRef={scrollAreaViewport}>
            <div className="space-y-4 min-h-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex items-start gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {message.sender === 'bot' ? (
                      <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm flex-shrink-0">
                        <AvatarFallback className="bg-transparent">
                          <Bot size={16} />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-sm flex-shrink-0">
                        <AvatarFallback className="bg-transparent">
                          <UserIcon size={16} />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{message.text}</p>
                      
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {(() => {
                          const date = message.timestamp;
                          const hours = date.getHours();
                          const minutes = date.getMinutes().toString().padStart(2, '0');
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          const displayHours = hours % 12 || 12;
                          return `${displayHours}:${minutes} ${ampm}`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />

              {isLoading && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                      <AvatarFallback className="bg-transparent">
                        <Bot size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">AI is thinking</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Input Area */}
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                disabled={isLoading || isListening}
                className="bg-gray-50 dark:bg-gray-900/60 border-gray-300 dark:border-gray-700 rounded-full px-5 py-3 pr-14 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-600 transition-all shadow-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoFocus
              />
              {speechSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full ${
                    isListening ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-6 py-3 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>

          {isListening && (
            <div className="mt-3 text-center animate-in fade-in duration-200">
              <p className="text-sm text-blue-600 flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
                🎤 Listening... Speak now
              </p>
            </div>
          )}

          {/* Quick action suggestions */}
          {messages.length === 1 && !isLoading && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                'Help me write a resume',
                'Interview tips',
                'Job search strategies',
                'Career advice'
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(suggestion)}
                  className="rounded-full text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
