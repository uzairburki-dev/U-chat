import React from 'react';

const sizeClasses = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl'
};

const statusSizeClasses = {
  xs: 'w-2 h-2 bottom-0 right-0 ring-1',
  sm: 'w-2.5 h-2.5 bottom-0 right-0 ring-1.5',
  md: 'w-3 h-3 bottom-0.5 right-0.5 ring-2',
  lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 ring-2',
  xl: 'w-4 h-4 bottom-1 right-1 ring-2'
};

const statusColorClasses = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  busy: 'bg-rose-500',
  offline: 'bg-slate-400 dark:bg-slate-500'
};

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  status = null,
  showStatus = false,
  className = ''
}) => {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const getGradientByName = (str) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-emerald-400 to-teal-600',
      'from-amber-400 to-orange-500',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-blue-600'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-2xl object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}

      <div
        className={`${sizeClasses[size] || sizeClasses.md} ${src ? 'hidden' : 'flex'} items-center justify-center rounded-2xl bg-gradient-to-tr ${getGradientByName(
          name
        )} text-white font-semibold shadow-sm select-none`}
      >
        {getInitials(name)}
      </div>

      {showStatus && status && (
        <span
          title={`Status: ${status}`}
          className={`absolute ${statusSizeClasses[size] || statusSizeClasses.md} ${
            statusColorClasses[status] || statusColorClasses.offline
          } rounded-full ring-white dark:ring-slate-900`}
        />
      )}
    </div>
  );
};
