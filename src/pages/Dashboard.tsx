import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building, UserCheck, UserX, RefreshCw, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, companiesApi } from '../services/api';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalCompanies: number;
  lastUpdated: Date | null;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalCompanies: 0,
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const usersResponse = await usersApi.getUsers();
      const users = usersResponse.data || [];

      const dashboardStats: DashboardStats = {
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        inactiveUsers: users.filter((u: any) => !u.isActive).length,
        totalCompanies: 0,
        lastUpdated: new Date(),
      };

      if (user?.role === 'superAdmin') {
        const companiesResponse = await companiesApi.getCompanies();
        dashboardStats.totalCompanies = companiesResponse.data?.length || 0;
      }

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchStats(true);
  };

  const statCards = [
    {
      title: t('dashboard.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      tone: 'gd-tone-brand',
      show: true,
    },
    {
      title: t('dashboard.activeUsers'),
      value: stats.activeUsers,
      icon: UserCheck,
      tone: 'gd-tone-positive',
      show: true,
    },
    {
      title: t('dashboard.inactiveUsers'),
      value: stats.inactiveUsers,
      icon: UserX,
      tone: 'gd-tone-negative',
      show: true,
    },
    {
      title: t('dashboard.totalCompanies'),
      value: stats.totalCompanies,
      icon: Building,
      tone: 'gd-tone-neutral',
      show: user?.role === 'superAdmin',
    },
  ];

  if (loading) {
    return (
      <div className="gd max-w-7xl mx-auto" aria-busy="true">
        <div className="gd-head">
          <div>
            <div className="gd-skel" style={{ width: '9rem', height: '0.75rem' }} />
            <div className="gd-skel" style={{ width: '22rem', maxWidth: '80vw', height: '2.75rem', marginTop: '1.25rem' }} />
          </div>
          <div className="gd-skel" style={{ width: '9rem', height: '2.75rem', borderRadius: '9999px' }} />
        </div>
        <div className="gd-kpis">
          {statCards
            .filter((card) => card.show)
            .map((card) => (
              <div key={card.title} className="gd-skel gd-skel--card" />
            ))}
        </div>
        <div className="gd-skel" style={{ height: '9rem', borderRadius: '1.125rem' }} />
      </div>
    );
  }

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeShare = stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;
  const inactiveShare = stats.totalUsers > 0 ? (stats.inactiveUsers / stats.totalUsers) * 100 : 0;

  return (
    <div className="gd max-w-7xl mx-auto">
      <header className="gd-head enter-up" style={{ '--stagger': '0ms' } as React.CSSProperties}>
        <div>
          <span className="gd-eyebrow gd-head__eyebrow">{t('dashboard.title')}</span>
          <h1 className="gd-title">
            {t('dashboard.welcome', { name: user?.firstName })}
          </h1>
        </div>
        <div className="gd-head__aside">
          {stats.lastUpdated && (
            <span className="gd-stamp">
              <span className="gd-stamp__label">{t('dashboard.lastUpdated')}</span>
              <span className="gd-stamp__value">{formatLastUpdated(stats.lastUpdated)}</span>
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="gd-btn"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('dashboard.refresh')}</span>
          </button>
        </div>
      </header>

      <div className="gd-kpis enter-up" style={{ '--stagger': '90ms' } as React.CSSProperties}>
        {statCards
          .filter((card) => card.show)
          .map((card) => (
            <div
              key={card.title}
              className={`gd-kpi ${card.tone}`}
            >
              <p className="gd-kpi__label">{card.title}</p>
              <p className="gd-kpi__value">{card.value}</p>
              <card.icon className="gd-kpi__icon" aria-hidden="true" />
            </div>
          ))}
      </div>

      {stats.totalUsers > 0 && (
        <section
          className="gd-split enter-up"
          style={{ '--stagger': '170ms' } as React.CSSProperties}
        >
          <div className="gd-split__bar">
            <span className="gd-split__seg is-positive" style={{ width: `${activeShare}%` }} />
            <span className="gd-split__seg is-negative" style={{ width: `${inactiveShare}%` }} />
          </div>
          <div className="gd-split__legend">
            <span className="gd-legend">
              <span className="gd-legend__dot is-positive" aria-hidden="true" />
              <span className="gd-legend__label">{t('dashboard.activeUsers')}</span>
              <span className="gd-legend__pct">{Math.round(activeShare)}%</span>
            </span>
            <span className="gd-legend">
              <span className="gd-legend__dot is-negative" aria-hidden="true" />
              <span className="gd-legend__label">{t('dashboard.inactiveUsers')}</span>
              <span className="gd-legend__pct">{Math.round(inactiveShare)}%</span>
            </span>
          </div>
        </section>
      )}

      <section className="enter-up" style={{ '--stagger': '250ms' } as React.CSSProperties}>
        <div className="gd-panel__head">
          <h2 className="gd-panel__title">{t('dashboard.quickActions')}</h2>
          <p className="gd-panel__desc">{t('dashboard.quickActionsDesc')}</p>
        </div>
        <div className="gd-actions">
          <a href="/users" className="gd-action">
            <span className="gd-action__index">01</span>
            <span className="gd-action__icon">
              <Users className="h-5 w-5" />
            </span>
            <div className="gd-action__body">
              <h3 className="gd-action__title">{t('dashboard.manageUsers')}</h3>
              <p className="gd-action__desc">{t('dashboard.manageUsersDesc')}</p>
            </div>
            <ChevronRight className="h-5 w-5 gd-action__chevron" />
          </a>

          {user?.role === 'superAdmin' && (
            <a href="/companies" className="gd-action">
              <span className="gd-action__index">02</span>
              <span className="gd-action__icon">
                <Building className="h-5 w-5" />
              </span>
              <div className="gd-action__body">
                <h3 className="gd-action__title">{t('dashboard.manageCompanies')}</h3>
                <p className="gd-action__desc">{t('dashboard.manageCompaniesDesc')}</p>
              </div>
              <ChevronRight className="h-5 w-5 gd-action__chevron" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
