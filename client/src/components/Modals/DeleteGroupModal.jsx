import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const DeleteGroupModal = () => {
  const {
    activeConversation,
    deleteGroupModalOpen,
    setDeleteGroupModalOpen,
    deleteGroup
  } = useChat();

  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!deleteGroupModalOpen || !activeConversation || !activeConversation.isGroup) {
    return null;
  }

  const groupName = activeConversation.groupName;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmName.trim() !== groupName.trim() || deleting) return;

    try {
      setDeleting(true);
      setError('');
      await deleteGroup(activeConversation._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete group');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Group Permanently
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Creator action only • Irreversible
              </p>
            </div>
          </div>
          <button
            onClick={() => setDeleteGroupModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDelete} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete the group{' '}
            <strong className="text-slate-900 dark:text-slate-100">"{groupName}"</strong>? This will permanently delete the group, all member connections, and all chat history for <strong>every member</strong> in real time.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Type <strong className="text-rose-600 select-all font-mono">{groupName}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Enter exact group name..."
              className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-rose-500 focus:outline-none text-slate-800 dark:text-slate-100"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteGroupModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmName.trim() !== groupName.trim() || deleting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Delete Entire Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
