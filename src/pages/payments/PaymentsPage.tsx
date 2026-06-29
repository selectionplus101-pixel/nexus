import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { paymentsApi, usersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  receiver?: {
    name: string;
    email: string;
  };
  transactionId: string;
  balanceBefore: number;
  balanceAfter: number;
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [statistics, setStatistics] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    transactionCount: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchWalletData();
    fetchUsers();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const [balanceData, historyData] = await Promise.all([
        paymentsApi.getBalance(),
        paymentsApi.getHistory({ limit: 50 }),
      ]);

      setBalance(balanceData.balance);
      setStatistics(balanceData.statistics);
      setTransactions(historyData.transactions);
    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await usersApi.getAll({});
      // Filter out current user
      setUsers(allUsers.filter((u: any) => u._id !== user?._id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const openModal = (type: 'deposit' | 'withdraw' | 'transfer') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handlePaymentAction = async (amount: number, receiverId?: string, description?: string) => {
    if (modalType === 'deposit') {
      await paymentsApi.deposit(amount, 'mock_payment', description);
    } else if (modalType === 'withdraw') {
      await paymentsApi.withdraw(amount, 'mock_bank', description);
    } else if (modalType === 'transfer' && receiverId) {
      await paymentsApi.transfer(amount, receiverId, description);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={16} className="text-green-600" />;
      case 'withdraw':
        return <ArrowUpRight size={16} className="text-red-600" />;
      case 'transfer':
        return <Send size={16} className="text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} />;
      case 'pending':
        return <Clock size={14} />;
      case 'failed':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const filteredTransactions = transactions
    .filter((txn) =>
      txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((txn) => selectedType === 'all' || txn.type === selectedType);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet & Payments</h1>
          <p className="text-gray-600">Manage your funds and transactions</p>
        </div>

        <div className="flex gap-2">
          <Button
            leftIcon={<ArrowDownLeft size={18} />}
            onClick={() => openModal('deposit')}
            className="bg-green-600 hover:bg-green-700"
          >
            Deposit
          </Button>
          <Button
            leftIcon={<ArrowUpRight size={18} />}
            onClick={() => openModal('withdraw')}
            variant="outline"
          >
            Withdraw
          </Button>
          <Button
            leftIcon={<Send size={18} />}
            onClick={() => openModal('transfer')}
            variant="outline"
          >
            Transfer
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <CardBody className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={24} />
                <p className="text-primary-100">Available Balance</p>
              </div>
              <p className="text-4xl font-bold">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-primary-100 text-sm mt-2">
                {statistics.transactionCount} transactions total
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-primary-100 mb-1">This Month</p>
                <p className="text-2xl font-semibold">
                  ${((statistics.totalDeposits - statistics.totalWithdrawals - statistics.totalTransfers) / 1).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-3">
                <ArrowDownLeft size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deposits</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${statistics.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg mr-3">
                <ArrowUpRight size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Withdrawals</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${statistics.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-3">
                <Send size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transfers</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${statistics.totalTransfers.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </CardHeader>
        <CardBody>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-2/3">
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startAdornment={<Search size={18} />}
                fullWidth
              />
            </div>

            <div className="w-full md:w-1/3 flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdraw">Withdrawals</option>
                <option value="transfer">Transfers</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
                <Wallet size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
              <p className="text-gray-600 mt-2">
                {searchQuery || selectedType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Make your first transaction to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((txn) => (
                <div
                  key={txn._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(txn.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {txn.type}
                        </p>
                        <Badge
                          variant={getStatusColor(txn.status)}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(txn.status)}
                          {txn.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {txn.description || 'No description'}
                      </p>
                      {txn.receiver && (
                        <p className="text-xs text-gray-500 mt-1">
                          To: {txn.receiver.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(txn.createdAt).toLocaleString()} • {txn.transactionId}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        txn.type === 'deposit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {txn.type === 'deposit' ? '+' : '-'}$
                      {txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Balance: ${txn.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        currentBalance={balance}
        onSuccess={fetchWalletData}
        onPaymentAction={handlePaymentAction}
        users={users}
      />
    </div>
  );
};
