import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { NavItem } from '../../types';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import CompanySwitcher from '../ui/CompanySwitcher';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      path: '/dashboard',
      icon: 'LayoutDashboard',
      roles: ['admin', 'superAdmin'],
    },
    {
      id: 'users',
      label: t('nav.userManagement'),
      path: '/users',
      icon: 'Users',
      roles: ['admin', 'superAdmin'],
    },
    {
      id: 'companies',
      label: t('nav.companyManagement'),
      path: '/companies',
      icon: 'Building',
      roles: ['superAdmin'],
    },
  ];

  const getIcon = (iconName: string, className: string = "h-5 w-5") => {
    const icons: { [key: string]: React.FC<{ className?: string }> } = {
      LayoutDashboard,
      Users,
      Building,
    };
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const filteredNavigation = navigationItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="gd-sidebar flex flex-col h-full">
      <div className="gd-sb-brand">
        <div className="gd-sb-mark">M</div>
        <div className="gd-sb-collapse">
          <span className="gd-sb-wordmark">Mobius</span>
          <span className="gd-sb-sub">Backoffice</span>
        </div>
      </div>

      <div className="gd-sb-user gd-sb-block">
        <div className="gd-sb-avatar">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div className="gd-sb-collapse min-w-0">
          <p className="gd-sb-name truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="gd-sb-role truncate">
            {user?.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
            {user?.companyName && ` · ${user.companyName}`}
          </p>
        </div>
      </div>

      <nav className="gd-sb-nav">
        {filteredNavigation.map((item) => {
          const isActive = item.path === location.pathname;
          return (
            <NavLink
              key={item.id}
              to={item.path!}
              title={item.label}
              className={`sidebar-item ${
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }`}
            >
              {getIcon(item.icon)}
              <span className="gd-sb-collapse">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {user?.role === 'superAdmin' && (
        <div className="gd-sb-foot gd-sb-switchwrap">
          <CompanySwitcher />
        </div>
      )}

      <div className="gd-sb-foot gd-sb-switchwrap">
        <LanguageSwitcher />
      </div>

      <div className="gd-sb-foot">
        <button
          onClick={handleLogout}
          title={t('nav.signOut')}
          className="sidebar-item sidebar-item-inactive gd-sb-signout w-full text-left"
        >
          <LogOut className="h-5 w-5" />
          <span className="gd-sb-collapse">{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
