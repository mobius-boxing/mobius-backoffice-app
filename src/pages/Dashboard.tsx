import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building, UserCheck, UserX, RefreshCw } from 'lucide-react';
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
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      show: true,
    },
    {
      title: t('dashboard.activeUsers'),
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      show: true,
    },
    {
      title: t('dashboard.inactiveUsers'),
      value: stats.inactiveUsers,
      icon: UserX,
      color: 'bg-gradient-to-br from-rose-500 to-rose-600',
      lightBg: 'bg-rose-50',
      show: true,
    },
    {
      title: t('dashboard.totalCompanies'),
      value: stats.totalCompanies,
      icon: Building,
      color: 'bg-gradient-to-br from-violet-500 to-violet-600',
      lightBg: 'bg-violet-50',
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
            <p className="mt-2 text-primary-100 text-lg">
              {t('dashboard.welcome', { name: user?.firstName })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats.lastUpdated && (
              <span className="text-sm text-primary-200">
                {t('dashboard.lastUpdated')}: {formatLastUpdated(stats.lastUpdated)}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{t('dashboard.refresh')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards
          .filter((card) => card.show)
          .map((card) => (
            <div
              key={card.title}
              className="group bg-white overflow-hidden shadow-md hover:shadow-xl rounded-2xl border border-secondary-100 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-500 mb-2">
                      {card.title}
                    </p>
                    <p className="text-4xl font-bold text-secondary-900 tracking-tight">
                      {card.value}
                    </p>
                  </div>
                  <div className={`${card.color} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
              <div className={`h-1.5 ${card.color}`} />
            </div>
          ))}
      </div>

      <div className="border-t border-secondary-200" />

      <div className="bg-white shadow-md rounded-2xl border border-secondary-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-secondary-100 bg-secondary-50/50">
          <h2 className="text-xl font-semibold text-secondary-900">
            {t('dashboard.quickActions')}
          </h2>
          <p className="mt-1 text-sm text-secondary-500">
            {t('dashboard.quickActionsDesc')}
          </p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <a
              href="/users"
              className="group relative rounded-xl border-2 border-secondary-200 bg-white p-6 hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-secondary-900 group-hover:text-primary-700 transition-colors">
                    {t('dashboard.manageUsers')}
                  </h3>
                  <p className="mt-1 text-sm text-secondary-500">
                    {t('dashboard.manageUsersDesc')}
                  </p>
                </div>
                <div className="flex-shrink-0 text-secondary-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>

            {user?.role === 'superAdmin' && (
              <a
                href="/companies"
                className="group relative rounded-xl border-2 border-secondary-200 bg-white p-6 hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-secondary-900 group-hover:text-primary-700 transition-colors">
                      {t('dashboard.manageCompanies')}
                    </h3>
                    <p className="mt-1 text-sm text-secondary-500">
                      {t('dashboard.manageCompaniesDesc')}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-secondary-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
