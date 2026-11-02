import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Reply,
  Smile,
  Trash2,
  Download,
  FileText,
  CornerUpLeft,
  Shield,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageItem = ({ message, isGroup = false }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    setReplyingTo,
    setLightboxImage,
    addReaction,
    deleteMessage
  } = useChat();

  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const currentUserId = user?._id;
  const isSender = (message.sender?._id || message.sender) === currentUserId;
  const isDeleted = message.isDeleted;

  // Check if current user is an admin or creator of this group
  const isCurrentGroupAdmin =
    isGroup &&
    ((activeConversation?.groupAdmin?._id || activeConversation?.groupAdmin) === currentUserId ||
      (activeConversation?.admins &&
        activeConversation.admins.some((a) => (a._id || a) === currentUserId)));

  // Check if message sender is a group admin
  const isSenderGroupAdmin =
    isGroup &&
    ((activeConversation?.groupAdmin?._id || activeConversation?.groupAdmin) ===
      (message.sender?._id || message.sender) ||
      (activeConversation?.admins &&
        activeConversation.admins.some(
          (a) => (a._id || a) === (message.sender?._id || message.sender)
        )));

  // System message formatting
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-3 animate-fade-in select-none">
        <span className="px-3 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/70 rounded-full border border-slate-300/40 dark:border-slate-700/50 shadow-xs">
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

  // WhatsApp-style Checkmarks
  const renderStatus = () => {
    if (!isSender || isDeleted) return null;

    const isRead = message.readBy && message.readBy.length > 1;

    if (isRead) {
      return (
        <CheckCheck
          className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400"
          title="Read"
        />
      );
    }

    return (
      <CheckCheck
        className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300"
        title="Delivered"
      />
    );
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
      className={`group relative flex gap-2.5 my-2 px-4 transition-colors ${
        isSender ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Receiver avatar in group chat */}
      {!isSender && isGroup && (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.fullName || message.sender?.username}
          size="sm"
          className="mt-1 shadow-xs flex-shrink-0"
        />
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex flex-col ${
          isSender ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name & Admin Badge in Group Chat */}
        {!isSender && isGroup && (
          <div className="flex items-center gap-1.5 ml-1 mb-1">
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
              {message.sender?.fullName || message.sender?.username}
            </span>
            {isSenderGroupAdmin && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 rounded-full border border-amber-300 dark:border-amber-800">
                Admin
              </span>
            )}
          </div>
        )}

        {/* WhatsApp-Style Modern Bubble */}
        <div
          className={`relative px-3.5 py-2.5 rounded-2xl shadow-xs transition-all text-sm leading-relaxed ${
            isDeleted
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 italic rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5'
              : isSender
              ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-xs border border-[#c5f0be] dark:border-[#004f40]'
              : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-xs'
          }`}
        >
          {/* Quoted Reply Preview */}
          {message.replyTo && !isDeleted && (
            <div
              onClick={() => scrollToReplied(message.replyTo._id || message.replyTo)}
              className={`mb-2 p-2 rounded-xl text-xs cursor-pointer border-l-4 transition-all ${
                isSender
                  ? 'bg-black/5 dark:bg-black/20 border-brand-600 dark:border-brand-400 text-slate-800 dark:text-slate-200 hover:bg-black/10'
                  : 'bg-slate-100 dark:bg-slate-750 border-brand-500 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1 font-semibold mb-0.5 text-[11px]">
                <CornerUpLeft className="w-3 h-3 text-brand-500" />
                <span>
                  {message.replyTo.sender?.fullName ||
                    message.replyTo.sender?.username ||
                    'Original message'}
                </span>
              </div>
              <p className="line-clamp-1 italic text-[11px] opacity-90">
                {message.replyTo.text ||
                  (message.replyTo.messageType === 'image' ? '📷 Photo' : '📁 Attachment')}
              </p>
            </div>
          )}

          {/* Image Message */}
          {message.messageType === 'image' && message.fileUrl && !isDeleted && (
            <div className="mb-1.5 overflow-hidden rounded-xl">
              <img
                src={message.fileUrl}
                alt="Shared attachment"
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
                  ? 'bg-white/40 dark:bg-white/10 border-black/10 dark:border-white/10 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-semibold truncate">
                  {message.fileName || 'Document'}
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
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Deleted Message Display */}
          {isDeleted ? (
            <div className="flex items-center gap-1.5">
              {message.deletedByAdmin ? (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
              <span className="text-xs">{message.text}</span>
            </div>
          ) : (
            /* Regular Message Text */
            message.text && (
              <p className="whitespace-pre-wrap break-words leading-relaxed select-text font-normal text-[13.5px]">
                {message.text}
              </p>
            )
          )}

          {/* Time & Read Receipts (Aligned nicely bottom-right) */}
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] select-none text-slate-500 dark:text-slate-400 ml-3">
            <span>{formatTime(message.createdAt)}</span>
            {renderStatus()}
          </div>
        </div>

        {/* Reactions Pill Display */}
        {Object.keys(groupedReactions).length > 0 && !isDeleted && (
          <div className="flex flex-wrap items-center gap-1 mt-1 -mb-1 select-none">
            {Object.entries(groupedReactions).map(([emoji, users]) => {
              const hasReacted = users.some(
                (u) => (u._id || u).toString() === currentUserId?.toString()
              );

              return (
                <button
                  key={emoji}
                  onClick={() => addReaction(message._id, emoji)}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border shadow-xs transition-transform active:scale-95 ${
                    hasReacted
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-300 font-bold'
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

            {/* Delete Menu with Role-Based Options */}
            <div className="relative">
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className="p-1 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Delete Options"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {showDeleteMenu && (
                <div
                  className="absolute bottom-full mb-1 right-0 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-20 animate-fade-in text-xs divide-y divide-slate-100 dark:divide-slate-750"
                  onMouseLeave={() => setShowDeleteMenu(false)}
                >
                  {/* Delete for everyone (Author of message) */}
                  {isSender && (
                    <button
                      onClick={() => {
                        deleteMessage(message._id, 'forEveryone');
                        setShowDeleteMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete for everyone</span>
                    </button>
                  )}

                  {/* Group Admin Moderation: Admin deleting another member's message */}
                  {!isSender && isCurrentGroupAdmin && (
                    <button
                      onClick={() => {
                        if (window.confirm('As a group admin, remove this message for all members?')) {
                          deleteMessage(message._id, 'forEveryone');
                          setShowDeleteMenu(false);
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-1.5 font-semibold"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Remove for everyone (Admin)</span>
                    </button>
                  )}

                  {/* Delete only for myself (Any user) */}
                  <button
                    onClick={() => {
                      deleteMessage(message._id, 'forMe');
                      setShowDeleteMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>Delete for me only</span>
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
