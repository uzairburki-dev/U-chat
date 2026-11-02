import React from 'react';
import {
  ChevronLeft,
  Search,
  Phone,
  Video,
  Info,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const ChatHeader = () => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const {
    activeConversation,
    selectConversation,
    typingUsers,
    showRightSidebar,
    setShowRightSidebar,
    isSearchInChatOpen,
    setIsSearchInChatOpen,
    messageSearchQuery,
    setMessageSearchQuery,
    fetchMessages
  } = useChat();

  if (!activeConversation) return null;

  const isGroup = activeConversation.isGroup;
  const otherParticipant = isGroup
    ? null
    : activeConversation.participants?.find((p) => p._id !== user?._id);

  const title = isGroup ? activeConversation.groupName : otherParticipant?.fullName || 'User';
  const avatarSrc = isGroup ? activeConversation.groupAvatar : otherParticipant?.avatar;

  const isOnline = isGroup
    ? false
    : isUserOnline(otherParticipant?._id) || otherParticipant?.status === 'online';

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'Offline';
    const date = new Date(dateStr);
    return `Last seen ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getSubtitle = () => {
    if (typingUsers.length > 0) {
      const names = typingUsers.map((u) => u.fullName?.split(' ')[0] || u.username).join(', ');
      return <span className="text-brand-600 dark:text-brand-400 font-medium animate-pulse">{names} typing...</span>;
    }

    if (isGroup) {
      const totalMembers = activeConversation.participants?.length || 0;
      return `${totalMembers} members`;
    }

    if (isOnline) {
      return <span className="text-emerald-500 font-medium">Active now</span>;
    }

    return formatLastSeen(otherParticipant?.lastSeen);
  };

  const handleCallNotice = (type) => {
    alert(`${type} calling feature is simulated in this preview version.`);
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Back button (mobile) & Profile info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => selectConversation(null)}
            className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            title="Back to conversations"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
            title="Click to view details"
          >
            <Avatar
              src={avatarSrc}
              name={title}
              size="md"
              status={isOnline ? 'online' : 'offline'}
              showStatus={!isGroup}
            />

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 transition-colors">
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {getSubtitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Search in chat */}
          <button
            onClick={() => setIsSearchInChatOpen(!isSearchInChatOpen)}
            className={`p-2 rounded-xl transition-all ${
              isSearchInChatOpen
                ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Voice call */}
          <button
            onClick={() => handleCallNotice('Audio')}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Start voice call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video call */}
          <button
            onClick={() => handleCallNotice('Video')}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Start video call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Details sidebar toggle */}
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`p-2 rounded-xl transition-all ${
              showRightSidebar
                ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Chat info & shared media"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Search in Chat Dropdown */}
      {isSearchInChatOpen && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/80 dark:bg-slate-850/80 animate-slide-up">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={messageSearchQuery}
            onChange={(e) => {
              setMessageSearchQuery(e.target.value);
              fetchMessages(activeConversation._id, e.target.value);
            }}
            placeholder="Search text in this chat..."
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
            autoFocus
          />
          {messageSearchQuery && (
            <button
              onClick={() => {
                setMessageSearchQuery('');
                fetchMessages(activeConversation._id, '');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
