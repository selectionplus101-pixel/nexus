import React, { useState } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar, Plus, X, Eye } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Deal {
  id: number;
  startup: {
    name: string;
    logo: string;
    industry: string;
  };
  amount: string;
  equity: string;
  status: 'Due Diligence' | 'Term Sheet' | 'Negotiation' | 'Closed' | 'Passed';
  stage: string;
  lastActivity: string;
}

export const DealsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: 1,
      startup: {
        name: 'TechWave AI',
        logo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
        industry: 'FinTech'
      },
      amount: '$1.5M',
      equity: '15%',
      status: 'Due Diligence',
      stage: 'Series A',
      lastActivity: '2024-02-15'
    },
    {
      id: 2,
      startup: {
        name: 'GreenLife Solutions',
        logo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        industry: 'CleanTech'
      },
      amount: '$2M',
      equity: '20%',
      status: 'Term Sheet',
      stage: 'Seed',
      lastActivity: '2024-02-10'
    },
    {
      id: 3,
      startup: {
        name: 'HealthPulse',
        logo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        industry: 'HealthTech'
      },
      amount: '$800K',
      equity: '12%',
      status: 'Negotiation',
      stage: 'Pre-seed',
      lastActivity: '2024-02-05'
    }
  ]);

  const [newDeal, setNewDeal] = useState({
    startupName: '',
    industry: '',
    amount: '',
    equity: '',
    stage: '',
    status: 'Due Diligence' as Deal['status']
  });

  const statuses: Deal['status'][] = ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'];

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Due Diligence':
        return 'primary';
      case 'Term Sheet':
        return 'secondary';
      case 'Negotiation':
        return 'accent';
      case 'Closed':
        return 'success';
      case 'Passed':
        return 'error';
      default:
        return 'gray';
    }
  };

  const handleAddDeal = () => {
    if (!newDeal.startupName || !newDeal.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    const deal: Deal = {
      id: Date.now(),
      startup: {
        name: newDeal.startupName,
        logo: 'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg',
        industry: newDeal.industry || 'Other'
      },
      amount: newDeal.amount,
      equity: newDeal.equity || '10%',
      status: newDeal.status,
      stage: newDeal.stage || 'Seed',
      lastActivity: new Date().toISOString().split('T')[0]
    };

    setDeals(prev => [deal, ...prev]);
    setIsModalOpen(false);
    setNewDeal({
      startupName: '',
      industry: '',
      amount: '',
      equity: '',
      stage: '',
      status: 'Due Diligence'
    });
    toast.success('Deal added successfully');
  };

  const handleStatusUpdate = (dealId: number, newStatus: Deal['status']) => {
    setDeals(prev =>
      prev.map(deal =>
        deal.id === dealId ? { ...deal, status: newStatus, lastActivity: new Date().toISOString().split('T')[0] } : deal
      )
    );
    toast.success(`Deal status updated to ${newStatus}`);
  };

  const filteredDeals = deals
    .filter(deal =>
      deal.startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.startup.industry.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(deal =>
      selectedStatus.length === 0 || selectedStatus.includes(deal.status)
    );

  const totalInvestment = deals
    .filter(d => d.status === 'Closed')
    .reduce((acc, deal) => {
      const amount = parseFloat(deal.amount.replace(/[$MK,]/g, ''));
      const multiplier = deal.amount.includes('M') ? 1000000 : deal.amount.includes('K') ? 1000 : 1;
      return acc + (amount * multiplier);
    }, 0);

  const activeDeals = deals.filter(d => ['Due Diligence', 'Term Sheet', 'Negotiation'].includes(d.status)).length;
  const closedThisMonth = deals.filter(d => d.status === 'Closed' && new Date(d.lastActivity).getMonth() === new Date().getMonth()).length;

  if (user?.role !== 'investor') {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-600">Deal management is only available for investors</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">Track and manage your investment pipeline</p>
        </div>

        <Button leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Add Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${(totalInvestment / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-lg font-semibold text-gray-900">{activeDeals}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deals</p>
                <p className="text-lg font-semibold text-gray-900">{deals.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg mr-3">
                <Calendar size={20} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Closed This Month</p>
                <p className="text-lg font-semibold text-gray-900">{closedThisMonth}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search deals by startup name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>

        <div className="w-full md:w-1/3 flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-gray-500" />
          {statuses.map(status => (
            <Badge
              key={status}
              variant={selectedStatus.includes(status) ? getStatusColor(status) : 'gray'}
              className="cursor-pointer"
              onClick={() => toggleStatus(status)}
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>

      {/* Deals table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            All Deals ({filteredDeals.length})
          </h2>
        </CardHeader>
        <CardBody>
          {filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
                <DollarSign size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No deals found</h3>
              <p className="text-gray-600 mt-2">
                {searchQuery || selectedStatus.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Add your first deal to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Startup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeals.map(deal => (
                    <tr key={deal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={deal.startup.logo}
                            alt={deal.startup.name}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {deal.startup.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {deal.startup.industry}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.equity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={deal.status}
                          onChange={(e) => handleStatusUpdate(deal.id, e.target.value as Deal['status'])}
                          className="text-sm border-0 bg-transparent cursor-pointer font-medium"
                          style={{ color: `var(--${getStatusColor(deal.status)}-600)` }}
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.stage}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(deal.lastActivity).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => toast.info('Deal details coming soon')}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsModalOpen(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Deal</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Startup Name *"
                    value={newDeal.startupName}
                    onChange={(e) => setNewDeal({ ...newDeal, startupName: e.target.value })}
                    required
                    fullWidth
                  />

                  <Input
                    label="Industry"
                    value={newDeal.industry}
                    onChange={(e) => setNewDeal({ ...newDeal, industry: e.target.value })}
                    fullWidth
                  />

                  <Input
                    label="Investment Amount *"
                    placeholder="e.g., $1.5M or $500K"
                    value={newDeal.amount}
                    onChange={(e) => setNewDeal({ ...newDeal, amount: e.target.value })}
                    required
                    fullWidth
                  />

                  <Input
                    label="Equity %"
                    placeholder="e.g., 15%"
                    value={newDeal.equity}
                    onChange={(e) => setNewDeal({ ...newDeal, equity: e.target.value })}
                    fullWidth
                  />

                  <Input
                    label="Stage"
                    placeholder="e.g., Seed, Series A"
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                    fullWidth
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newDeal.status}
                      onChange={(e) => setNewDeal({ ...newDeal, status: e.target.value as Deal['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddDeal}>
                      Add Deal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
