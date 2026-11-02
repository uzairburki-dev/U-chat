import React from 'react';
import { Check, CheckCheck, Image, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const ConversationItem = ({ conversation }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { activeConversation, selectConversation } = useChat();

  const isGroup = conversation.isGroup;
  const currentUserId = user?._id;

  // For 1-to-1, determine the other participant
  const otherParticipant = isGroup
    ? null
    : conversation.participants?.find((p) => p._id !== currentUserId) || {
        fullName: 'Unknown User',
        username: 'unknown',
        status: 'offline'
      };

  const title = isGroup ? conversation.groupName : otherParticipant?.fullName || 'User';
  const avatarSrc = isGroup ? conversation.groupAvatar : otherParticipant?.avatar;

  const isOnline = isGroup
    ? false
    : isUserOnline(otherParticipant?._id) || otherParticipant?.status === 'online';

  const isSelected = activeConversation?._id === conversation._id;

  // Unread count
  const unreadCount =
    conversation.unreadCounts && conversation.unreadCounts[currentUserId]
      ? conversation.unreadCounts[currentUserId]
      : 0;

  // Last message snippet & status
  const lastMsg = conversation.lastMessage;
  const isSender = lastMsg?.sender?._id === currentUserId || lastMsg?.sender === currentUserId;

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderLastMessageContent = () => {
    if (!lastMsg) {
      return (
        <span className="italic text-slate-400 dark:text-slate-500">
          {isGroup ? 'Group created' : 'No messages yet'}
        </span>
      );
    }

    if (lastMsg.isDeleted) {
      return <span className="italic text-slate-400">This message was deleted</span>;
    }

    if (lastMsg.messageType === 'image') {
      return (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <Image className="w-3.5 h-3.5 text-brand-500" />
          <span>Photo</span>
        </span>
      );
    }

    if (lastMsg.messageType === 'file') {
      return (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <FileText className="w-3.5 h-3.5 text-brand-500" />
          <span>{lastMsg.fileName || 'Attachment'}</span>
        </span>
      );
    }

    return lastMsg.text;
  };

  // Read receipts ticks for last message
  const renderReadReceipts = () => {
    if (!lastMsg || !isSender || lastMsg.isDeleted) return null;

    const isRead = lastMsg.readBy && lastMsg.readBy.length > 1;

    if (isRead) {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
    }

    return <CheckCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
  };

  return (
    <div
      onClick={() => selectConversation(conversation)}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800/40 relative ${
        isSelected
          ? 'bg-brand-50 dark:bg-slate-800/90 border-l-4 border-l-brand-600'
          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={avatarSrc}
          name={title}
          size="md"
          status={isOnline ? 'online' : 'offline'}
          showStatus={!isGroup}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3
              className={`text-sm font-semibold truncate ${
                isSelected
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {title}
            </h3>
            {!isGroup && conversation.requestStatus === 'pending' && (
              <span className="px-1.5 py-0.2 text-[9px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 rounded-full border border-amber-300 dark:border-amber-800 flex-shrink-0">
                Request Sent
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
            {formatTime(lastMsg?.createdAt || conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
            {renderReadReceipts()}
            <span className="truncate">{renderLastMessageContent()}</span>
          </div>

          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[19px] h-[19px] px-1.5 text-[10px] font-bold text-white bg-brand-500 rounded-full shadow-sm animate-pulse-slow">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
