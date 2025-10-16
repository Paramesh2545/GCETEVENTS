import React, { useState, useEffect } from 'react';
import { User, Club } from '../types';
import { phonepeAccountService, PhonePeAccount } from '../services/phonepeAccountService';
import { eventRegistrationService } from '../services/eventRegistrationService';

interface PaymentDashboardProps {
  user: User;
  clubs: Club[];
}

interface PaymentStats {
  totalRevenue: number;
  totalEvents: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
}

interface PaymentTransaction {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  paymentMethod: string;
  transactionId: string;
  timestamp: string;
  clubId: string;
  clubName: string;
}

const PaymentDashboard: React.FC<PaymentDashboardProps> = ({ user, clubs }) => {
  const [accounts, setAccounts] = useState<PhonePeAccount[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalEvents: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [user.id, selectedClub, selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load user's accounts
      const userAccounts = await phonepeAccountService.getUserAccounts(user.id!);
      setAccounts(userAccounts);

      // Load transactions (mock data for now)
      const mockTransactions = generateMockTransactions();
      setTransactions(mockTransactions);

      // Calculate stats
      const calculatedStats = calculateStats(mockTransactions);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTransactions = (): PaymentTransaction[] => {
    const events = ['Code-a-thon 2024', 'Tech Fest', 'Hackathon', 'Workshop', 'Seminar'];
    const clubs = ['Tech Club', 'Coding Club', 'Innovation Club'];
    const statuses: ('success' | 'failed' | 'pending')[] = ['success', 'success', 'success', 'failed', 'pending'];
    const methods = ['UPI', 'Card', 'Net Banking'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: `txn_${i + 1}`,
      eventId: `event_${i + 1}`,
      eventName: events[i % events.length],
      userId: `user_${i + 1}`,
      userName: `User ${i + 1}`,
      amount: Math.floor(Math.random() * 1000) + 100,
      status: statuses[i % statuses.length],
      paymentMethod: methods[i % methods.length],
      transactionId: `TXN${Date.now()}${i}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      clubId: `club_${(i % clubs.length) + 1}`,
      clubName: clubs[i % clubs.length]
    }));
  };

  const calculateStats = (transactions: PaymentTransaction[]): PaymentStats => {
    const successful = transactions.filter(t => t.status === 'success');
    const failed = transactions.filter(t => t.status === 'failed');
    const pending = transactions.filter(t => t.status === 'pending');
    
    const totalRevenue = successful.reduce((sum, t) => sum + t.amount, 0);
    const thisMonth = new Date();
    const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
    
    const thisMonthTransactions = successful.filter(t => 
      new Date(t.timestamp) >= new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    );
    const lastMonthTransactions = successful.filter(t => 
      new Date(t.timestamp) >= lastMonth && 
      new Date(t.timestamp) < new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    );

    return {
      totalRevenue,
      totalEvents: new Set(transactions.map(t => t.eventId)).size,
      successfulPayments: successful.length,
      failedPayments: failed.length,
      pendingPayments: pending.length,
      thisMonthRevenue: thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0),
      lastMonthRevenue: lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0)
    };
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedClub !== 'all') {
      return transaction.clubId === selectedClub;
    }
    return true;
  });

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-white mt-4">Loading payment dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Dashboard</h1>
          <p className="text-gray-400">Track your earnings and payment analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.thisMonthRevenue)}</p>
                <p className="text-xs text-gray-400">
                  vs {formatCurrency(stats.lastMonthRevenue)} last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Successful Payments</p>
                <p className="text-2xl font-bold text-white">{stats.successfulPayments}</p>
                <p className="text-xs text-green-400">
                  {((stats.successfulPayments / (stats.successfulPayments + stats.failedPayments)) * 100).toFixed(1)}% success rate
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                <p className="text-xs text-gray-400">Events with payments</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Clubs</option>
            {clubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredTransactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{transaction.eventName}</div>
                        <div className="text-sm text-gray-400">{transaction.clubName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{transaction.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{formatCurrency(transaction.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'success' 
                          ? 'bg-green-500/20 text-green-400' 
                          : transaction.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{transaction.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{formatDate(transaction.timestamp)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Account Status */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">PhonePe Account Status</h3>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No PhonePe Accounts</h4>
              <p className="text-gray-400 mb-4">You need to configure a PhonePe account to receive payments.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => {
                const club = clubs.find(c => c.id === account.clubId);
                return (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{account.accountName}</h4>
                        <p className="text-gray-400 text-sm">{club?.name || 'Unknown Club'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        account.environment === 'production' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {account.environment === 'production' ? 'Production' : 'Sandbox'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
