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
      lightBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      show: true,
    },
    {
      title: t('dashboard.activeUsers'),
      value: stats.activeUsers,
      icon: UserCheck,
      lightBg: 'bg-green-50',
      iconColor: 'text-green-600',
      show: true,
    },
    {
      title: t('dashboard.inactiveUsers'),
      value: stats.inactiveUsers,
      icon: UserX,
      lightBg: 'bg-red-50',
      iconColor: 'text-red-600',
      show: true,
    },
    {
      title: t('dashboard.totalCompanies'),
      value: stats.totalCompanies,
      icon: Building,
      lightBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      show: user?.role === 'superAdmin',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary-900">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-secondary-500">
            {t('dashboard.welcome', { name: user?.firstName })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats.lastUpdated && (
            <span className="text-sm text-secondary-500">
              {t('dashboard.lastUpdated')}: {formatLastUpdated(stats.lastUpdated)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('dashboard.refresh')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards
          .filter((card) => card.show)
          .map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-secondary-200 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
                  {card.title}
                </p>
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${card.lightBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-secondary-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-secondary-200 bg-secondary-50/60">
          <h2 className="text-base font-semibold tracking-tight text-secondary-900">
            {t('dashboard.quickActions')}
          </h2>
          <p className="mt-1 text-sm text-secondary-500">
            {t('dashboard.quickActionsDesc')}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="/users"
              className="group flex items-center gap-4 rounded-xl border border-secondary-200 bg-white p-5 hover:border-primary-300 hover:bg-primary-50/40 transition-colors duration-150"
            >
              <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-secondary-900 group-hover:text-primary-700 transition-colors">
                  {t('dashboard.manageUsers')}
                </h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  {t('dashboard.manageUsersDesc')}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-secondary-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150" />
            </a>

            {user?.role === 'superAdmin' && (
              <a
                href="/companies"
                className="group flex items-center gap-4 rounded-xl border border-secondary-200 bg-white p-5 hover:border-primary-300 hover:bg-primary-50/40 transition-colors duration-150"
              >
                <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
                  <Building className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-secondary-900 group-hover:text-primary-700 transition-colors">
                    {t('dashboard.manageCompanies')}
                  </h3>
                  <p className="mt-0.5 text-sm text-secondary-500">
                    {t('dashboard.manageCompaniesDesc')}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-secondary-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
