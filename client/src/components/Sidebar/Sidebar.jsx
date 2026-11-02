import React from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SearchBar } from './SearchBar';
import { ConversationTabs } from './ConversationTabs';
import { OnlineUsersBar } from './OnlineUsersBar';
import { ConversationList } from './ConversationList';

export const Sidebar = () => {
  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10 select-none">
      <SidebarHeader />
      <SearchBar />
      <ConversationTabs />
      <OnlineUsersBar />
      <ConversationList />
    </aside>
  );
};
