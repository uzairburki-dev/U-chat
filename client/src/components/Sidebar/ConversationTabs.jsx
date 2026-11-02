import React from 'react';
import { MessageSquare, User, Users, Radio } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';

export const ConversationTabs = () => {
  const { activeTab, setActiveTab, allConversations } = useChat();
  const { currentAccent } = useTheme();

  const totalUnread = allConversations.reduce((sum, c) => {
    return sum; // unread logic can be computed or filtered
  }, 0);

  const tabs = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'direct', label: 'Direct', icon: User },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'online', label: 'Online', icon: Radio }
  ];

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500' : ''}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
