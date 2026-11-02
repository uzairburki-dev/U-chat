import React from 'react';
import { Search, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const SearchBar = () => {
  const { searchQuery, setSearchQuery } = useChat();

  return (
    <div className="px-4 py-2.5">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats or messages..."
          className="w-full pl-9.5 pr-8 py-2 text-xs md:text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl border border-transparent focus:border-brand-500/30 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
