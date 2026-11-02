import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Reply,
  Smile,
  Trash2,
  Download,
  FileText,
  MoreVertical,
  CornerUpLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageItem = ({ message, isGroup = false }) => {
  const { user } = useAuth();
  const { setReplyingTo, setLightboxImage, addReaction, deleteMessage } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const currentUserId = user?._id;
  const isSender = message.sender?._id === currentUserId || message.sender === currentUserId;
  const isDeleted = message.isDeleted;

  // System message formatting
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <span className="px-3 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/60 rounded-full border border-slate-300/40 dark:border-slate-700/40">
          {message.text}
        </span>
      </div>
    );
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Checkmarks
  const renderStatus = () => {
    if (!isSender || isDeleted) return null;

    const isRead = message.readBy && message.readBy.length > 1;

    if (isRead) {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-400" title="Read" />;
    }

    return <CheckCheck className="w-3.5 h-3.5 text-white/70 dark:text-white/60" title="Delivered" />;
  };

  // Group reactions by emoji: { '👍': [user1, user2], '❤️': [user3] }
  const groupedReactions = {};
  if (message.reactions && message.reactions.length > 0) {
    message.reactions.forEach((r) => {
      if (!groupedReactions[r.emoji]) {
        groupedReactions[r.emoji] = [];
      }
      groupedReactions[r.emoji].push(r.user);
    });
  }

  const scrollToReplied = (targetId) => {
    const el = document.getElementById(`message-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-brand-500/10', 'rounded-xl');
      setTimeout(() => el.classList.remove('bg-brand-500/10'), 2000);
    }
  };

  return (
    <div
      id={`message-${message._id}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
        setShowDeleteMenu(false);
      }}
      className={`group relative flex gap-2.5 my-1.5 px-4 transition-colors ${
        isSender ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Receiver avatar in group chat */}
      {!isSender && isGroup && (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.fullName || message.sender?.username}
          size="xs"
          className="mt-1"
        />
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] flex flex-col ${
          isSender ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name in Group Chat */}
        {!isSender && isGroup && (
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 ml-1 mb-0.5">
            {message.sender?.fullName || message.sender?.username}
          </span>
        )}

        {/* Bubble Box */}
        <div
          className={`relative p-3 rounded-2xl shadow-sm transition-all text-sm ${
            isDeleted
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic rounded-2xl border border-slate-200/50 dark:border-slate-700/50'
              : isSender
              ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-xs shadow-brand-500/10'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/70 dark:border-slate-700/70'
          }`}
        >
          {/* Quoted Reply Preview */}
          {message.replyTo && !isDeleted && (
            <div
              onClick={() => scrollToReplied(message.replyTo._id || message.replyTo)}
              className={`mb-2 p-2 rounded-xl text-xs cursor-pointer border-l-4 transition-all ${
                isSender
                  ? 'bg-black/15 border-white text-white/90 hover:bg-black/20'
                  : 'bg-slate-100 dark:bg-slate-700/50 border-brand-500 text-slate-700 dark:text-slate-300 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-1 font-semibold mb-0.5">
                <CornerUpLeft className="w-3 h-3" />
                <span>
                  {message.replyTo.sender?.fullName ||
                    message.replyTo.sender?.username ||
                    'Replying to message'}
                </span>
              </div>
              <p className="line-clamp-1 italic text-[11px] opacity-90">
                {message.replyTo.text || (message.replyTo.messageType === 'image' ? '📷 Photo' : '📁 Attachment')}
              </p>
            </div>
          )}

          {/* Image Message */}
          {message.messageType === 'image' && message.fileUrl && !isDeleted && (
            <div className="mb-1.5 overflow-hidden rounded-xl">
              <img
                src={message.fileUrl}
                alt="Shared file"
                onClick={() => setLightboxImage(message.fileUrl)}
                className="max-h-80 w-auto rounded-xl object-cover cursor-zoom-in hover:scale-[1.01] transition-transform"
                loading="lazy"
              />
            </div>
          )}

          {/* Document / File Message */}
          {message.messageType === 'file' && message.fileUrl && !isDeleted && (
            <div
              className={`flex items-center gap-3 p-2.5 mb-1.5 rounded-xl border ${
                isSender
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-slate-50 dark:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-semibold truncate">
                  {message.fileName || 'Attachment'}
                </p>
                <p className="text-[10px] opacity-75">
                  {formatFileSize(message.fileSize)}
                </p>
              </div>
              <a
                href={message.fileUrl}
                download={message.fileName || true}
                target="_blank"
                rel="noreferrer"
                className={`p-1.5 rounded-lg transition-colors ${
                  isSender
                    ? 'hover:bg-white/20 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                }`}
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Message Text */}
          {message.text && (
            <p className="whitespace-pre-wrap break-words leading-relaxed select-text">
              {message.text}
            </p>
          )}

          {/* Time & Read Receipts */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
              isSender ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <span>{formatTime(message.createdAt)}</span>
            {renderStatus()}
          </div>
        </div>

        {/* Reactions Pill Display */}
        {Object.keys(groupedReactions).length > 0 && !isDeleted && (
          <div className="flex flex-wrap items-center gap-1 mt-1 -mb-1 select-none">
            {Object.entries(groupedReactions).map(([emoji, users]) => {
              const hasReacted = users.some(
                (u) => (u._id || u).toString() === currentUserId.toString()
              );

              return (
                <button
                  key={emoji}
                  onClick={() => addReaction(message._id, emoji)}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border shadow-xs transition-transform active:scale-95 ${
                    hasReacted
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                  title={`${users.length} reaction(s)`}
                >
                  <span>{emoji}</span>
                  {users.length > 1 && (
                    <span className="text-[10px] font-semibold">{users.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Hover Quick Action Bar */}
        {showActions && !isDeleted && (
          <div
            className={`absolute top-0 -translate-y-1/2 flex items-center gap-0.5 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 animate-fade-in ${
              isSender ? 'right-0' : 'left-0'
            }`}
          >
            {/* Quick Emoji Reaction button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="React"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>

              {showEmojiPicker && (
                <div
                  className="absolute bottom-full mb-1 left-0 flex items-center gap-1 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 animate-fade-in"
                  onMouseLeave={() => setShowEmojiPicker(false)}
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        addReaction(message._id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1 hover:scale-125 transition-transform text-base"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply */}
            <button
              onClick={() => setReplyingTo(message)}
              className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            {/* Delete Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className="p-1 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Options"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {showDeleteMenu && (
                <div
                  className="absolute bottom-full mb-1 right-0 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-20 animate-fade-in text-xs"
                  onMouseLeave={() => setShowDeleteMenu(false)}
                >
                  {isSender && (
                    <button
                      onClick={() => {
                        deleteMessage(message._id, 'forEveryone');
                        setShowDeleteMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Delete for everyone
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deleteMessage(message._id, 'forMe');
                      setShowDeleteMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Delete for me
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
