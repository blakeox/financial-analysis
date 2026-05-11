import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from './Button';
import { cardVariants, cn, inputClasses, textColors } from '../lib/classNames';

// SVG Icons as components to avoid external dependencies
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const BotIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VSCodeChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

export function VSCodeChatPanel({
  isOpen,
  onToggle,
  onSendMessage,
  messages,
  isLoading = false,
  className = "",
}: VSCodeChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const mobileShellClasses =
    cn(cardVariants.rail, 'fixed inset-0 z-50 rounded-none border-0 p-0 md:hidden');
  const desktopShellClasses =
    cn(cardVariants.rail, 'fixed top-0 right-0 z-40 hidden h-full w-96 rounded-none border-y-0 border-r-0 p-0 shadow-2xl md:block');
  const headerClasses =
    'flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/90';
  const emptyStateClasses = cn('mt-8 text-center', textColors.muted);

  if (!isOpen) return null;

  return (
    <div className={className}>
      {/* Mobile overlay (full screen on small screens) */}
      <div className={mobileShellClasses}>
        {/* Mobile Header */}
        <div className={headerClasses}>
          <div className="flex items-center space-x-2">
            <BotIcon className="w-5 h-5 text-violet-500" />
            <h2 className={cn('font-semibold', textColors.primary)}>AI Assistant</h2>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl px-0"
            aria-label="Close chat"
          >
            <XIcon />
          </Button>
        </div>

        {/* Mobile Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{height: 'calc(100vh - 140px)'}}>
          {messages.length === 0 ? (
            <div className={emptyStateClasses}>
              <BotIcon className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p>Start a conversation with the AI assistant</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 dark:bg-slate-300">
                      <BotIcon className="w-4 h-4 text-white dark:text-slate-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={cn('text-sm font-medium', textColors.primary)}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className={cn('text-xs', textColors.muted)}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className={cn('whitespace-pre-wrap text-sm', textColors.secondary)}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 dark:bg-slate-300">
                <BotIcon className="w-4 h-4 text-white dark:text-slate-900" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={cn('text-sm font-medium', textColors.primary)}>Assistant</span>
                </div>
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{animationDelay: '0.1s'}}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Input */}
        <div className={cn(cardVariants.subtle, 'rounded-none border-x-0 border-b-0 p-4')}>
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className={cn(inputClasses, 'flex-1 resize-none rounded-xl py-2')}
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="rounded-xl"
              title="Send message"
            >
              <SendIcon />
            </Button>
          </form>
        </div>
      </div>

      {/* Desktop sidebar (right side on medium+ screens) */}
      <div className={desktopShellClasses}>
        {/* Desktop Header */}
        <div className={headerClasses}>
          <div className="flex items-center space-x-2">
            <BotIcon className="w-5 h-5 text-violet-500" />
            <h2 className={cn('font-semibold', textColors.primary)}>AI Assistant</h2>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl px-0"
            aria-label="Close chat"
          >
            <XIcon />
          </Button>
        </div>

        {/* Desktop Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{height: 'calc(100vh - 140px)'}}>
          {messages.length === 0 ? (
            <div className={emptyStateClasses}>
              <BotIcon className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">Start a conversation with the AI assistant</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white">
                      <UserIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 dark:bg-slate-300">
                      <BotIcon className="w-3.5 h-3.5 text-white dark:text-slate-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={cn('text-xs font-medium', textColors.primary)}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className={cn('text-xs', textColors.muted)}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className={cn('whitespace-pre-wrap text-xs', textColors.secondary)}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex space-x-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 dark:bg-slate-300">
                <BotIcon className="w-3.5 h-3.5 text-white dark:text-slate-900" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={cn('text-xs font-medium', textColors.primary)}>Assistant</span>
                </div>
                <div className="flex space-x-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{animationDelay: '0.1s'}}></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Desktop Input */}
        <div className={cn(cardVariants.subtle, 'absolute right-0 bottom-0 left-0 rounded-none border-x-0 border-b-0 p-4')}>
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className={cn(inputClasses, 'flex-1 resize-none rounded-xl py-2')}
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="rounded-xl"
              title="Send message"
            >
              <SendIcon />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
