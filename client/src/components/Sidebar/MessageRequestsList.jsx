import React from 'react';
import { UserCheck, Check, X, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const MessageRequestsList = () => {
  const { user } = useAuth();
  const {
    messageRequests,
    loadingRequests,
    respondToMessageRequest,
    selectConversation,
    activeConversation
  } = useChat();

  if (loadingRequests) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
        <span className="text-xs">Loading message requests...</span>
      </div>
    );
  }

  if (messageRequests.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          No Message Requests
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          When someone you haven't chatted with sends you a message for the first time, their request will appear here for your approval.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
      <div className="flex items-center gap-2 px-1 mb-2">
        <ShieldAlert className="w-4 h-4 text-brand-500" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Pending Approval ({messageRequests.length})
        </span>
      </div>

      {messageRequests.map((conv) => {
        const sender = conv.participants?.find((p) => (p._id || p) !== user?._id);
        const isSelected = activeConversation?._id === conv._id;

        return (
          <div
            key={conv._id}
            onClick={() => selectConversation(conv)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 shadow-xs'
                : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar
                src={sender?.avatar}
                name={sender?.fullName || sender?.username || 'User'}
                size="md"
                status={sender?.status || 'offline'}
                showStatus={true}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {sender?.fullName || 'User'}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {conv.lastMessage?.createdAt
                      ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Just now'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 truncate mb-1">
                  @{sender?.username} • {sender?.bio || 'Hey there!'}
                </p>

                {conv.lastMessage?.text && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2 italic mb-2">
                    "{conv.lastMessage.text}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      respondToMessageRequest(conv._id, 'accept');
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Decline this message request? Their message will not be delivered.')) {
                        respondToMessageRequest(conv._id, 'decline');
                      }
                    }}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
