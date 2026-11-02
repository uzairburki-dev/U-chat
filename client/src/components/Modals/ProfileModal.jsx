import React, { useState, useRef } from 'react';
import axios from 'axios';
import { X, Camera, Check, User, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
];

export const ProfileModal = () => {
  const { user, updateProfile } = useAuth();
  const { profileModalOpen, setProfileModalOpen } = useChat();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [status, setStatus] = useState(user?.status || 'online');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  if (!profileModalOpen) return null;

  const handleAvatarFile = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setAvatar(res.data.data.fileUrl);
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim(),
        customStatus: customStatus.trim(),
        status,
        avatar
      });
      setProfileModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              My Profile & Status
            </h3>
          </div>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Avatar Area */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative group">
              <Avatar
                src={avatar}
                name={fullName || user?.username}
                size="xl"
                status={status}
                showStatus={true}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-2xl bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-semibold">Change</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => handleAvatarFile(e.target.files[0])}
              className="hidden"
            />

            <span className="text-[11px] text-slate-400">
              Click photo to upload or pick a preset below:
            </span>

            {/* Presets */}
            <div className="flex items-center gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt="Preset"
                  onClick={() => setAvatar(preset)}
                  className={`w-7 h-7 rounded-full object-cover cursor-pointer ring-2 transition-transform hover:scale-110 ${
                    avatar === preset ? 'ring-brand-500 scale-105' : 'ring-transparent opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={`@${user?.username}`}
              disabled
              className="w-full px-3.5 py-2 text-xs bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 rounded-xl border border-slate-200/50 dark:border-slate-700/50 cursor-not-allowed"
            />
          </div>

          {/* Custom Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Status Message
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-500" />
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="e.g. In a meeting 📅, Coding 🚀"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Status Radio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Presence Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                { id: 'away', label: 'Away', color: 'bg-amber-500' },
                { id: 'busy', label: 'Busy', color: 'bg-rose-500' },
                { id: 'offline', label: 'Invisible', color: 'bg-slate-400' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs border transition-all ${
                    status === s.id
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              About / Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself..."
              className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/20 active:scale-95 transition-all"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
