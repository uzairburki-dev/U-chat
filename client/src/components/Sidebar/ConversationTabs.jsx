import React from 'react';
import { MessageSquare, User, Users, Radio, UserCheck, MailPlus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ConversationTabs = () => {
  const { activeTab, setActiveTab, messageRequests, groupInvitations } = useChat();

  const tabs = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'direct', label: 'Direct', icon: User },
    { id: 'groups', label: 'Groups', icon: Users },
    {
      id: 'requests',
      label: 'Requests',
      icon: UserCheck,
      badge: messageRequests.length
    },
    {
      id: 'invitations',
      label: 'Invites',
      icon: MailPlus,
      badge: groupInvitations.length
    },
    { id: 'online', label: 'Online', icon: Radio }
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500' : ''}`} />
            <span>{tab.label}</span>

            {/* Badge for pending requests or invitations */}
            {tab.badge > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
