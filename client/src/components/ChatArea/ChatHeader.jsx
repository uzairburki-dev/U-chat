import React from 'react';
import {
  ChevronLeft,
  Search,
  Phone,
  Video,
  Info,
  Users,
  X,
  UserPlus,
  Trash2,
  ShieldCheck
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
    setInviteModalOpen,
    setDeleteGroupModalOpen,
    isSearchInChatOpen,
    setIsSearchInChatOpen,
    messageSearchQuery,
    setMessageSearchQuery,
    fetchMessages
  } = useChat();

  if (!activeConversation) return null;

  const currentUserId = user?._id?.toString();
  const isGroup = activeConversation.isGroup;
  const isCreator =
    isGroup &&
    (activeConversation.groupAdmin?._id || activeConversation.groupAdmin)?.toString() ===
      currentUserId;
  const isGroupAdmin =
    isCreator ||
    (isGroup &&
      activeConversation.admins &&
      activeConversation.admins.some((a) => (a._id || a)?.toString() === currentUserId));

  const otherParticipant = isGroup
    ? null
    : activeConversation.participants?.find((p) => (p._id || p) !== user?._id);

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
      return (
        <span className="text-brand-600 dark:text-brand-400 font-semibold animate-pulse">
          {names} typing...
        </span>
      );
    }

    if (isGroup) {
      const totalMembers = activeConversation.participants?.length || 0;
      return `${totalMembers} members`;
    }

    if (isOnline) {
      return <span className="text-emerald-500 font-medium">Online</span>;
    }

    return formatLastSeen(otherParticipant?.lastSeen);
  };

  const handleCallNotice = (type) => {
    alert(`${type} calling feature is simulated in this preview version.`);
  };

  return (
    <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md sticky top-0 z-20 select-none shadow-2xs">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Back button (mobile) & Profile info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => selectConversation(null)}
            className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            title="Back to chats"
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
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 transition-colors">
                  {title}
                </h2>
                {!isGroup && otherParticipant?.isEmailVerified && (
                  <ShieldCheck
                    className="w-3.5 h-3.5 text-brand-500 flex-shrink-0"
                    title="Verified User"
                  />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {getSubtitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Group Admin: Invite members shortcut */}
          {isGroupAdmin && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Invite members"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}

          {/* Group Creator: Delete group shortcut */}
          {isCreator && (
            <button
              onClick={() => setDeleteGroupModalOpen(true)}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
              title="Delete group permanently"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

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
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/90 dark:bg-slate-850/90 animate-slide-up">
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
