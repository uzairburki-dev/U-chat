import React from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyChatState } from './EmptyChatState';

export const ChatArea = () => {
  const { activeConversation } = useChat();

  if (!activeConversation) {
    return <EmptyChatState />;
  }

  return (
    <main className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-[#0b0f19] relative min-w-0 overflow-hidden">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </main>
  );
};
