import React from 'react';
import { MessageSquareOff, Plus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ConversationItem } from './ConversationItem';

export const ConversationList = () => {
  const {
    conversations,
    loadingConversations,
    setNewChatModalOpen,
    searchQuery
  } = useChat();

  if (loadingConversations) {
    return (
      <div className="flex-1 p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <MessageSquareOff className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {searchQuery ? 'No conversations found' : 'No chats yet'}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">
          {searchQuery
            ? 'Try searching with a different name or start a new chat.'
            : 'Start a direct chat with your team members or create a group.'}
        </p>

        <button
          onClick={() => setNewChatModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-transparent">
      {conversations.map((conv) => (
        <ConversationItem key={conv._id} conversation={conv} />
      ))}
    </div>
  );
};
