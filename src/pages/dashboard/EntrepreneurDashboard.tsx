import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';
import { useAuth } from '../../context/AuthContext';
import { Investor, CollaborationRequest } from '../../types';
import { usersApi, dashboardApi, collaborationApi } from '../../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalMeetings: number;
  upcomingMeetings: number;
  pendingInvitations: number;
  totalConnections: number;
  unreadMessages: number;
  totalInvestors: number;
  recentActivity: number;
  profileViews: number;
}

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recommendedInvestors, setRecommendedInvestors] = useState<Investor[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const data = await dashboardApi.getEntrepreneurStats();
        setStats(data);
      } catch (error: any) {
        toast.error('Failed to load dashboard statistics');
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch investors from backend
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setIsLoading(true);
        const data = await usersApi.getAll({ role: 'investor' });
        setRecommendedInvestors(data.slice(0, 3)); // Show first 3 as recommended
      } catch (error: any) {
        toast.error('Failed to load investors');
        console.error('Error fetching investors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  // Fetch collaboration requests from backend
  useEffect(() => {
    const fetchCollaborationRequests = async () => {
      try {
        setIsLoadingRequests(true);
        const data = await collaborationApi.getAll();
        setCollaborationRequests(data);
      } catch (error: any) {
        toast.error('Failed to load collaboration requests');
        console.error('Error fetching collaboration requests:', error);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchCollaborationRequests();
  }, []);

  if (!user) return null;

  const pendingRequests = collaborationRequests.filter(req => req.status === 'pending');

  // Handle collaboration request status updates
  const handleRequestStatusUpdate = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await collaborationApi.updateStatus(requestId, status);

      // Update local state
      setCollaborationRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status } : req
        )
      );

      if (status === 'accepted') {
        toast.success('Collaboration request accepted');
      } else {
        toast.success('Collaboration request declined');
      }
    } catch (error: any) {
      toast.error('Failed to update collaboration request');
      console.error('Error updating collaboration request:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        
        <Link to="/investors">
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            Find Investors
          </Button>
        </Link>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Invitations</p>
                <h3 className="text-xl font-semibold text-primary-900">
                  {isLoadingStats ? '...' : stats?.pendingInvitations || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {isLoadingStats ? '...' : stats?.totalConnections || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {isLoadingStats ? '...' : stats?.upcomingMeetings || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Total Meetings</p>
                <h3 className="text-xl font-semibold text-success-900">
                  {isLoadingStats ? '...' : stats?.totalMeetings || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collaboration requests */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
              <Badge variant="primary">{pendingRequests.length} pending</Badge>
            </CardHeader>
            
            <CardBody>
              {isLoadingRequests ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading collaboration requests...</p>
                </div>
              ) : collaborationRequests.length > 0 ? (
                <div className="space-y-4">
                  {collaborationRequests.map(request => (
                    <CollaborationRequestCard
                      key={request.id}
                      request={request}
                      onStatusUpdate={handleRequestStatusUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No collaboration requests yet</p>
                  <p className="text-sm text-gray-500 mt-1">When investors are interested in your startup, their requests will appear here</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Recommended investors */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </CardHeader>
            
            <CardBody className="space-y-4">
              {recommendedInvestors.map(investor => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  showActions={false}
                />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};