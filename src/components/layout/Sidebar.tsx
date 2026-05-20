import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  LogOut,
  Store,
  Package,
  Scroll,
  ChevronDown,
  ChevronRight,
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

  // Store group: superAdmins always; company admins only with the 'store' module.
  // SuperAdmin user.modules is [] by design, so the role check carries them.
  const canSeeStore =
    user?.role === 'superAdmin' || (user?.modules?.includes('store') ?? false);

  // Auto-expand the Store group when on a /store/* route.
  const [storeOpen, setStoreOpen] = useState(
    location.pathname.startsWith('/store')
  );

  const storeChildren: NavItem[] = [
    { id: 'store-boxes', label: t('nav.store.boxes'), path: '/store/boxes', icon: 'Package', roles: ['admin', 'superAdmin'] },
    { id: 'store-rolls', label: t('nav.store.rolls'), path: '/store/rolls', icon: 'Scroll', roles: ['admin', 'superAdmin'] },
    { id: 'store-users', label: t('nav.store.users'), path: '/store/users', icon: 'Users', roles: ['admin', 'superAdmin'] },
  ];

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
      Store,
      Package,
      Scroll,
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
    <div className="flex flex-col w-64 bg-white border-r border-secondary-200 h-full">
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-secondary-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold shadow-sm">
          M
        </div>
        <div className="leading-tight">
          <span className="block text-sm font-bold tracking-tight text-secondary-900">Mobius</span>
          <span className="block text-xs font-medium text-secondary-500">Backoffice</span>
        </div>
      </div>

      <div className="p-4 border-b border-secondary-200 bg-secondary-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-secondary-500 capitalize">
              {user?.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
              {user?.companyName && ` - ${user.companyName}`}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = item.path === location.pathname;
          return (
            <NavLink
              key={item.id}
              to={item.path!}
              className={`sidebar-item ${
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }`}
            >
              {getIcon(item.icon)}
              <span className="ml-3">{item.label}</span>
            </NavLink>
          );
        })}

        {canSeeStore && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setStoreOpen((o) => !o)}
              aria-expanded={storeOpen}
              aria-controls="store-subnav"
              className={`sidebar-item w-full text-left ${
                location.pathname.startsWith('/store')
                  ? 'sidebar-item-active'
                  : 'sidebar-item-inactive'
              }`}
            >
              <Store className="h-5 w-5" />
              <span className="ml-3 flex-1">{t('nav.store.title')}</span>
              {storeOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {storeOpen && (
              <div
                id="store-subnav"
                className="mt-1 ml-4 space-y-1 border-l border-secondary-200 pl-3"
              >
                {storeChildren.map((child) => {
                  const isActive = child.path === location.pathname;
                  return (
                    <NavLink
                      key={child.id}
                      to={child.path!}
                      className={`sidebar-item ${
                        isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                      }`}
                    >
                      {getIcon(child.icon, 'h-4 w-4')}
                      <span className="ml-3">{child.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {user?.role === 'superAdmin' && (
        <div className="px-4 py-4 border-t border-secondary-200">
          <CompanySwitcher />
        </div>
      )}

      <div className="px-4 py-4 border-t border-secondary-200">
        <LanguageSwitcher />
      </div>

      <div className="p-4 border-t border-secondary-200">
        <button
          onClick={handleLogout}
          className="sidebar-item sidebar-item-inactive w-full text-left"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
