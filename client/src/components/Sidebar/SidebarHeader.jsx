import React from 'react';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  UserPlus,
  Users,
  Settings,
  LogOut,
  Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, accentThemes } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const SidebarHeader = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, accent, setAccent, currentAccent } = useTheme();
  const { soundEnabled, setSoundEnabled } = useSocket();
  const { setNewChatModalOpen, setCreateGroupModalOpen, setProfileModalOpen } = useChat();

  const [showPaletteMenu, setShowPaletteMenu] = React.useState(false);

  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* User profile summary */}
        <div
          onClick={() => setProfileModalOpen(true)}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 pr-2"
          title="Click to view & edit your profile"
        >
          <div className="relative">
            <Avatar
              src={user?.avatar}
              name={user?.fullName || user?.username}
              size="md"
              status={user?.status || 'online'}
              showStatus={true}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-500 transition-colors">
                {user?.fullName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.customStatus || `@${user?.username}`}
            </p>
          </div>
        </div>

        {/* Quick action controls */}
        <div className="flex items-center gap-1">
          {/* New Direct Chat */}
          <button
            onClick={() => setNewChatModalOpen(true)}
            title="Start new direct chat"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* New Group */}
          <button
            onClick={() => setCreateGroupModalOpen(true)}
            title="Create group"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Theme Palette dropdown toggle */}
          <div className="relative">
            <button
              onClick={() => setShowPaletteMenu(!showPaletteMenu)}
              title="Theme accent color"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <Palette className="w-4 h-4" />
            </button>

            {showPaletteMenu && (
              <div
                className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in"
                onMouseLeave={() => setShowPaletteMenu(false)}
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Accent Color
                </div>
                {Object.entries(accentThemes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setAccent(key);
                      setShowPaletteMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      accent === key ? 'font-bold bg-slate-50 dark:bg-slate-750' : ''
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Profile Settings */}
          <button
            onClick={() => setProfileModalOpen(true)}
            title="Profile settings"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
