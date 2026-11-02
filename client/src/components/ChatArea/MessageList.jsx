import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, MessageCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';

export const MessageList = () => {
  const { messages, activeConversation, loadingMessages } = useChat();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group messages by date
  const groupedMessages = [];
  let currentDate = null;

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({
        type: 'date_header',
        dateStr: msg.createdAt,
        id: `header-${msgDate}`
      });
    }
    groupedMessages.push(msg);
  });

  if (loadingMessages) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 space-y-3">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading conversation history...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2 py-4 relative chat-pattern-light dark:chat-pattern-dark"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-slate-800/80 flex items-center justify-center text-brand-500 mb-3 shadow-inner">
            <MessageCircle className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Say Hello! 👋
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            No messages here yet. Send a friendly greeting or share a file to get the conversation started!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {groupedMessages.map((item) => {
            if (item.type === 'date_header') {
              return (
                <div
                  key={item.id}
                  className="sticky top-2 z-10 flex justify-center my-3 select-none"
                >
                  <span className="px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-xs border border-slate-200/60 dark:border-slate-700/60">
                    {formatDateHeader(item.dateStr)}
                  </span>
                </div>
              );
            }

            return (
              <MessageItem
                key={item._id}
                message={item}
                isGroup={activeConversation?.isGroup}
              />
            );
          })}

          <TypingIndicator />
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Floating Scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-24 right-8 md:right-12 p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-600 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 z-20"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
