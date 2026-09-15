import React, { useLayoutEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  Smartphone,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { NavItem } from '../../types';
import { COMPANY_PERMISSION_NAV, COMPANY_PERMISSION_NAV_ORDER } from '../../config/companyPermissionNav';
import LanguageSwitcher from '../ui/LanguageSwitcher';

/**
 * Surviving remounts: every page renders its own <Layout>, and the routes are
 * flat rather than nested under a layout route, so navigating unmounts this
 * Sidebar and mounts a fresh one. The new <nav> is a new DOM node, so its
 * scrollTop starts at 0 and the rail jumps back to the top on every click.
 * Module scope (not state) deliberately: the value has to outlive the
 * component instance, and writing it must not trigger a re-render on scroll.
 */
let navScrollTop = 0;

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { has } = usePermissions();
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);

  // Restore before paint so the rail never flashes at the top.
  useLayoutEffect(() => {
    const el = navRef.current;
    if (el) el.scrollTop = navScrollTop;
  }, []);

  const { t } = useTranslation();

  const isSuperAdmin = user?.role === 'superAdmin';
  // Dashboard shows company-wide user stats — visible to superAdmin and to
  // whoever holds full `users.edit` (the Admin role, or the pre-roleId
  // legacy-admin fallback in utils/rbac.ts), same reach as before this was a
  // permission code check rather than a `role` string comparison.
  const canSeeDashboard = isSuperAdmin || has('users.edit');

  const permissionNavItems: NavItem[] = COMPANY_PERMISSION_NAV_ORDER.map((id) => {
    const entry = COMPANY_PERMISSION_NAV[id];
    return {
      id,
      label: t(entry.labelKey),
      path: entry.path,
      icon: entry.icon,
      visible: has(entry.code, { allowReadOnly: entry.allowReadOnly }),
    };
  });

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      path: '/dashboard',
      icon: 'LayoutDashboard',
      visible: canSeeDashboard,
    },
    ...permissionNavItems,
    {
      id: 'companies',
      label: t('nav.companyManagement'),
      path: '/companies',
      icon: 'Building',
      visible: isSuperAdmin,
    },
  ];

  const getIcon = (iconName: string, className: string = "h-5 w-5") => {
    const icons: { [key: string]: React.FC<{ className?: string }> } = {
      LayoutDashboard,
      Users,
      ShieldCheck,
      Building,
      Smartphone,
    };
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const filteredNavigation = navigationItems.filter((item) => item.visible);

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
            {user?.role === 'superAdmin' ? 'Super Admin' : user?.roleName || 'Admin'}
            {user?.companyName && ` · ${user.companyName}`}
          </p>
        </div>
      </div>

      <nav
        ref={navRef}
        onScroll={(e) => {
          navScrollTop = e.currentTarget.scrollTop;
        }}
        className="gd-sb-nav"
      >
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
