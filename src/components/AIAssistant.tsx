'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  X,
  Send,
  Sparkles,
  FileText,
  ListChecks,
  FileSearch,
  PenLine,
  MessageSquare,
  Loader2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickPrompts = [
  { label: 'Summarize this document', icon: Sparkles, action: 'summarize' },
  { label: 'Extract key clauses', icon: ListChecks, action: 'clauses' },
  { label: 'Suggest signature fields', icon: PenLine, action: 'fields' },
  { label: 'Explain this document', icon: FileText, action: 'explain' },
];

export function AIAssistant() {
  const { pageParams, currentPage } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const docId = pageParams?.id as string;
  const isDocumentContext = currentPage === 'document-detail' || currentPage === 'document-editor';

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: message.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.aiChat({
        message: message.trim(),
        documentId: isDocumentContext ? docId : undefined,
        history,
      });

      if (res.success && res.data) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: res.data.response, timestamp: new Date() };
        setMessages((prev) => [...prev, assistantMsg]);
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'I apologize, but I was unable to process your request. Please try again.', timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred while processing your request. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [docId, isLoading, isDocumentContext, messages, isOpen]);

  const handleQuickAction = async (action: string) => {
    if (action === 'summarize' && docId) {
      await sendMessage('Please summarize this document for me');
    } else if (action === 'clauses' && docId) {
      await sendMessage('What are the key clauses in this document?');
    } else if (action === 'fields' && docId) {
      await sendMessage('Where should signature and form fields be placed in this document?');
    } else if (action === 'explain') {
      await sendMessage('Can you explain this document in simple terms?');
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={handleToggle}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
          >
            <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed z-50 bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden ${
              isMinimized
                ? 'bottom-6 right-6 h-12 w-64'
                : 'bottom-6 right-6 w-[380px] h-[520px]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <h3 className="text-sm font-semibold">AI Assistant</h3>
                  {isDocumentContext && docId && (
                    <p className="text-[9px] opacity-80">Viewing document context</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-3">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                      <div className="text-center py-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <h4 className="text-sm font-semibold">AI Document Assistant</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
                          I can help you understand documents, extract information, and suggest field placements.
                        </p>

                        {/* Quick actions */}
                        <div className="mt-4 space-y-1.5">
                          {quickPrompts.map((prompt) => {
                            const Icon = prompt.icon;
                            const disabled = !isDocumentContext && prompt.action !== 'explain';
                            return (
                              <Button
                                key={prompt.action}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2 h-8 text-xs"
                                onClick={() => handleQuickAction(prompt.action)}
                                disabled={disabled}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>{prompt.label}</span>
                                {disabled && <span className="ml-auto text-[9px] text-muted-foreground">Open a doc</span>}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Chat messages */}
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted border border-border'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {/* Loading */}
                    {isLoading && (
                      <div className="flex gap-2">
                        <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted border border-border rounded-lg px-3 py-2.5 flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="p-3 border-t bg-muted/30 shrink-0">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder={isDocumentContext ? "Ask about this document..." : "Ask me anything..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="h-9 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(input);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {isDocumentContext && (
                    <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
                      📄 Currently referencing document context
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
