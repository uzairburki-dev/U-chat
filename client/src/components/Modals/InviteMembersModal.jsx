import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UserPlus, Search, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const InviteMembersModal = () => {
  const { user } = useAuth();
  const {
    activeConversation,
    inviteModalOpen,
    setInviteModalOpen,
    inviteToGroup
  } = useChat();

  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!inviteModalOpen || !activeConversation) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/users');
        if (res.data?.success) {
          const currentMemberIds = new Set(
            activeConversation.participants?.map((p) => (p._id || p).toString()) || []
          );
          const pendingInviteIds = new Set(
            activeConversation.groupInvitations
              ?.filter((inv) => inv.status === 'pending')
              .map((inv) => (inv.user?._id || inv.user).toString()) || []
          );

          // Exclude current members, existing pending invites, and self
          const available = res.data.data.filter((u) => {
            const uId = u._id.toString();
            return (
              uId !== user?._id?.toString() &&
              !currentMemberIds.has(uId) &&
              !pendingInviteIds.has(uId)
            );
          });
          setUsers(available);
        }
      } catch (err) {
        console.error('Error fetching users for invitation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [inviteModalOpen, activeConversation, user?._id]);

  if (!inviteModalOpen || !activeConversation) return null;

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  const handleSendInvites = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0 || inviting) return;

    try {
      setInviting(true);
      await inviteToGroup(activeConversation._id, selectedUserIds);
      setSelectedUserIds([]);
      setInviteModalOpen(false);
      alert('Invitations sent! Users will join once they accept.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invitations');
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Invite Members
              </h3>
              <p className="text-[11px] text-slate-400">
                Invited users must approve before joining
              </p>
            </div>
          </div>
          <button
            onClick={() => setInviteModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts to invite..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500/30 focus:outline-none text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/40">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-brand-500" />
              <span className="text-xs">Finding available contacts...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No contacts available to invite. All users are already members or have pending invites.
            </div>
          ) : (
            filteredUsers.map((targetUser) => {
              const isChecked = selectedUserIds.includes(targetUser._id);

              return (
                <div
                  key={targetUser._id}
                  onClick={() => toggleSelectUser(targetUser._id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-brand-50/70 dark:bg-brand-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={targetUser.avatar}
                      name={targetUser.fullName || targetUser.username}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {targetUser.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        @{targetUser.username}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedUserIds.length} user(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendInvites}
              disabled={selectedUserIds.length === 0 || inviting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {inviting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>Send Invites</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
