import React from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Users,
  Image,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export const EmptyChatState = () => {
  const { user } = useAuth();
  const { setNewChatModalOpen, setCreateGroupModalOpen } = useChat();

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-50/60 dark:bg-slate-900/40 select-none">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        {/* Animated App Badge */}
        <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/20 ring-8 ring-brand-500/10">
          <MessageSquare className="w-12 h-12" />
        </div>

        {/* Welcome Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Welcome to ChatBoat, {user?.fullName?.split(' ')[0]}!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time conversations, group discussions, and seamless file sharing built for modern teams.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Instant Socket.IO</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Zero-latency real-time message delivery & typing status.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
              <Users className="w-4 h-4 text-brand-500" />
              <span>Group Chats</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Create and manage channels for your entire team.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
              <Image className="w-4 h-4 text-emerald-500" />
              <span>Media & Files</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Share images, documents, and media seamlessly.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>JWT & MongoDB</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Secure authentication and persistent storage.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Start a Chat</span>
          </button>

          <button
            onClick={() => setCreateGroupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Create a Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
