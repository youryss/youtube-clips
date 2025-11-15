import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome,
  FiList,
  FiFilm,
  FiSettings,
  FiLogOut,
  FiX,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Jobs', href: '/jobs', icon: FiList },
    { name: 'Clips', href: '/clips', icon: FiFilm },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with logo and close button */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <FiFilm className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900">Viral Clipper</span>
            </Link>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-colors duration-base
                        ${
                          active
                            ? 'bg-primary-50 text-primary-600 font-medium'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }
                      `}
                      onClick={() => {
                        // Close sidebar on mobile when navigating
                        if (window.innerWidth < 1024) {
                          onToggle();
                        }
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-neutral-200">
            {user && (
              <div className="mb-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors duration-base"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

