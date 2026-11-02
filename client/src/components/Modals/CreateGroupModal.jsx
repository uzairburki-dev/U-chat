import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Users, Search, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const CreateGroupModal = () => {
  const { user } = useAuth();
  const { createGroupModalOpen, setCreateGroupModalOpen, createGroup } = useChat();

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!createGroupModalOpen) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await axios.get('/api/users');
        if (res.data?.success) {
          setUsers(res.data.data.filter((u) => u._id !== user?._id));
        }
      } catch (err) {
        console.error('Failed to fetch users for group:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [createGroupModalOpen, user?._id]);

  if (!createGroupModalOpen) return null;

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0 || submitting) return;

    try {
      setSubmitting(true);
      await createGroup({
        groupName: groupName.trim(),
        groupDescription: groupDescription.trim(),
        participantIds: selectedUserIds
      });
      setGroupName('');
      setGroupDescription('');
      setSelectedUserIds([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating group');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Create New Group
              </h3>
              <p className="text-[11px] text-slate-400">
                Members receive an invite and must accept to join
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateGroupModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Design & Engineering Team"
              required
              className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Members Selection */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Members ({selectedUserIds.length} selected) *
              </label>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter members..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800/40">
              {loadingUsers ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-brand-500" />
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No other users available to add.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u._id);

                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleSelectUser(u._id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-brand-50/70 dark:bg-brand-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={u.avatar}
                          name={u.fullName || u.username}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {u.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            @{u.username}
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
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateGroupModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || selectedUserIds.length === 0 || submitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all ${
                !groupName.trim() || selectedUserIds.length === 0 || submitting
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20 active:scale-95'
              }`}
            >
              {submitting ? 'Creating...' : 'Create Group & Send Invites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
