import React, { useState } from 'react';
import {
  X,
  User,
  Users,
  Image as ImageIcon,
  FileText,
  Download,
  Bell,
  BellOff,
  LogOut,
  Trash2,
  Mail,
  Calendar,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const ChatDetailsSidebar = () => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const {
    activeConversation,
    messages,
    showRightSidebar,
    setShowRightSidebar,
    setLightboxImage,
    leaveGroup,
    deleteConversation
  } = useChat();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'media' | 'files'
  const [muted, setMuted] = useState(false);

  if (!showRightSidebar || !activeConversation) return null;

  const isGroup = activeConversation.isGroup;
  const otherParticipant = isGroup
    ? null
    : activeConversation.participants?.find((p) => p._id !== user?._id);

  const title = isGroup ? activeConversation.groupName : otherParticipant?.fullName || 'User';
  const avatarSrc = isGroup ? activeConversation.groupAvatar : otherParticipant?.avatar;
  const isOnline = isGroup
    ? false
    : isUserOnline(otherParticipant?._id) || otherParticipant?.status === 'online';

  // Filter shared media (images)
  const sharedMedia = messages.filter(
    (m) => m.messageType === 'image' && m.fileUrl && !m.isDeleted
  );

  // Filter shared files
  const sharedFiles = messages.filter(
    (m) => m.messageType === 'file' && m.fileUrl && !m.isDeleted
  );

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-30 w-full sm:w-80 md:w-88 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {isGroup ? 'Group Information' : 'Contact Details'}
        </h3>
        <button
          onClick={() => setShowRightSidebar(false)}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
            activeTab === 'media'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Media ({sharedMedia.length})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
            activeTab === 'files'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Files ({sharedFiles.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Profile Card */}
            <div className="flex flex-col items-center text-center space-y-2">
              <Avatar
                src={avatarSrc}
                name={title}
                size="xl"
                status={isOnline ? 'online' : 'offline'}
                showStatus={!isGroup}
              />
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isGroup ? `${activeConversation.participants?.length || 0} members` : `@${otherParticipant?.username}`}
                </p>
              </div>

              {/* Status/Bio */}
              <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-750 text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  About & Status
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {isGroup
                    ? activeConversation.groupDescription || 'No description provided.'
                    : otherParticipant?.bio || 'Hey there! I am using ChatBoat.'}
                </p>
                {otherParticipant?.customStatus && (
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                    ✨ {otherParticipant.customStatus}
                  </p>
                )}
              </div>
            </div>

            {/* If Group: Members List */}
            {isGroup && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Group Members ({activeConversation.participants?.length || 0})
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeConversation.participants?.map((member) => {
                    const isAdmin = activeConversation.groupAdmin?._id === member._id || activeConversation.groupAdmin === member._id;
                    const isMemOnline = isUserOnline(member._id) || member.status === 'online';

                    return (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={member.avatar}
                            name={member.fullName || member.username}
                            size="sm"
                            status={isMemOnline ? 'online' : 'offline'}
                            showStatus={true}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {member.fullName} {member._id === user?._id ? '(You)' : ''}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              @{member.username}
                            </p>
                          </div>
                        </div>

                        {isAdmin && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-full border border-amber-200 dark:border-amber-800/40">
                            Admin
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Settings & Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setMuted(!muted)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {muted ? <BellOff className="w-4 h-4 text-amber-500" /> : <Bell className="w-4 h-4 text-slate-500" />}
                  <span>{muted ? 'Muted Notifications' : 'Mute Notifications'}</span>
                </div>
                <span className="text-[10px] text-slate-400">{muted ? 'On' : 'Off'}</span>
              </button>

              {isGroup ? (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to leave this group?')) {
                      leaveGroup(activeConversation._id);
                      setShowRightSidebar(false);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-rose-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Leave Group</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm('Delete this conversation history?')) {
                      deleteConversation(activeConversation._id);
                      setShowRightSidebar(false);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Conversation</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div>
            {sharedMedia.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No shared photos yet
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {sharedMedia.map((m) => (
                  <img
                    key={m._id}
                    src={m.fileUrl}
                    alt="Media"
                    onClick={() => setLightboxImage(m.fileUrl)}
                    className="w-full h-20 object-cover rounded-xl cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-2">
            {sharedFiles.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No shared documents yet
              </div>
            ) : (
              sharedFiles.map((f) => (
                <div
                  key={f._id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-brand-500/10 text-brand-500 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {f.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(f.fileSize)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={f.fileUrl}
                    download={f.fileName || true}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
