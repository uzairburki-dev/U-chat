import React from 'react';
import { ShieldAlert, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyChatState } from './EmptyChatState';

export const ChatArea = () => {
  const { user } = useAuth();
  const { activeConversation, respondToMessageRequest } = useChat();

  if (!activeConversation) {
    return <EmptyChatState />;
  }

  const isPendingRequest =
    !activeConversation.isGroup && activeConversation.requestStatus === 'pending';
  const isSender =
    activeConversation.requestedBy &&
    (activeConversation.requestedBy._id || activeConversation.requestedBy).toString() ===
      user?._id?.toString();
  const isReceiver = isPendingRequest && !isSender;

  const otherParticipant = activeConversation.participants?.find(
    (p) => (p._id || p) !== user?._id
  );
  const otherName = otherParticipant?.fullName || otherParticipant?.username || 'This contact';

  return (
    <main className="flex-1 h-full flex flex-col bg-[#efeae2]/30 dark:bg-[#0b141a] relative min-w-0 overflow-hidden">
      <ChatHeader />

      {/* Message Request Privacy Banner for Receiver */}
      {isReceiver && (
        <div className="px-4 py-3 bg-white/95 dark:bg-[#1f2c34]/95 backdrop-blur-md border-b border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up z-10 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Message request from {otherName}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Accept to start a conversation. If you decline, their message will not be delivered.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => respondToMessageRequest(activeConversation._id, 'accept')}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept Request</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Decline message request from ${otherName}?`)) {
                  respondToMessageRequest(activeConversation._id, 'decline');
                }
              }}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      )}

      {/* Message Request Notice for Sender */}
      {isPendingRequest && isSender && (
        <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-850/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300 z-10 select-none">
          <Clock className="w-4 h-4 text-brand-500 animate-pulse flex-shrink-0" />
          <span>
            Message request sent to <strong>{otherName}</strong>. You can continue chatting once they accept your request.
          </span>
        </div>
      )}

      <MessageList />
      <MessageInput />
    </main>
  );
};
