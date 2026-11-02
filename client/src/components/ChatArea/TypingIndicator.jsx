import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const TypingIndicator = () => {
  const { typingUsers } = useChat();

  if (!typingUsers || typingUsers.length === 0) return null;

  const firstUser = typingUsers[0];
  const count = typingUsers.length;

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <Avatar
        src={firstUser.avatar}
        name={firstUser.fullName || firstUser.username}
        size="xs"
      />

      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {count === 1
            ? `${firstUser.fullName?.split(' ')[0] || firstUser.username} is typing`
            : `${count} people are typing`}
        </span>

        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 typing-dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 typing-dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 typing-dot-3" />
        </div>
      </div>
    </div>
  );
};
