import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const NewChatModal = () => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const {
    newChatModalOpen,
    setNewChatModalOpen,
    openDirectChatWithUser
  } = useChat();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!newChatModalOpen) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const url = searchTerm
          ? `/api/users/search?q=${encodeURIComponent(searchTerm)}`
          : '/api/users';
        const res = await axios.get(url);
        if (res.data?.success) {
          setUsers(res.data.data.filter((u) => u._id !== user?._id));
        }
      } catch (err) {
        console.error('Error fetching users for new chat:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 200);
    return () => clearTimeout(debounce);
  }, [newChatModalOpen, searchTerm, user?._id]);

  if (!newChatModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                New Conversation
              </h3>
              <p className="text-[11px] text-slate-400">
                First-time chats create a message request
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewChatModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, username or email..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500/30 focus:outline-none text-slate-800 dark:text-slate-100"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/40">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-brand-500" />
              <span className="text-xs">Finding contacts...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No users found matching your search.
            </div>
          ) : (
            users.map((targetUser) => {
              const isOnline = isUserOnline(targetUser._id) || targetUser.status === 'online';

              return (
                <div
                  key={targetUser._id}
                  onClick={() => openDirectChatWithUser(targetUser)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={targetUser.avatar}
                      name={targetUser.fullName || targetUser.username}
                      size="md"
                      status={isOnline ? 'online' : 'offline'}
                      showStatus={true}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                        {targetUser.fullName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        @{targetUser.username} {targetUser.bio ? `• ${targetUser.bio}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    Chat
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
