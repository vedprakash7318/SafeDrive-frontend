import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Tag,
  Package,
  CreditCard,
  User,
  Bell
} from 'lucide-react';

export default function UserNavbar({
  unreadCount = 0,
  activeTagsCount = 0,
  ordersCount = 0
}) {
  const location = useLocation();

  const navItems = [
    {
      label: 'Protected Tags',
      path: '/dashboard',
      icon: Tag,
      badge: activeTagsCount > 0 ? activeTagsCount : null
    },
    {
      label: 'My Orders',
      path: '/orders',
      icon: Package,
      badge: ordersCount > 0 ? ordersCount : null
    },
    {
      label: 'Transactions',
      path: '/transactions',
      icon: CreditCard
    },
    {
      label: 'My Profile',
      path: '/profile',
      icon: User
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: 'bg-rose-500 text-white'
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-20 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const IconElem = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  isActive
                    ? 'bg-[#F36F21] text-white shadow-md shadow-[#F36F21]/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <IconElem className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white text-[#F36F21]' : (item.badgeColor || 'bg-slate-200 text-slate-800')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
