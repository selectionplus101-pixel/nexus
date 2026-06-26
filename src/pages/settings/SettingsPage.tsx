import React, { useState } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

type TabType = 'profile' | 'security' | 'notifications' | 'language' | 'appearance' | 'billing';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: (user as any)?.location || '',
    // Entrepreneur-specific
    startupName: (user as any)?.startupName || '',
    industry: (user as any)?.industry || '',
    fundingNeeded: (user as any)?.fundingNeeded || '',
    pitchSummary: (user as any)?.pitchSummary || '',
    foundedYear: (user as any)?.foundedYear || '',
    teamSize: (user as any)?.teamSize || '',
    // Investor-specific
    investmentInterests: (user as any)?.investmentInterests || [],
    investmentStage: (user as any)?.investmentStage || [],
    minimumInvestment: (user as any)?.minimumInvestment || '',
    maximumInvestment: (user as any)?.maximumInvestment || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await updateProfile(user.id, profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile(user.id, { password: passwordData.newPassword });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'profile' as TabType, icon: User, label: 'Profile' },
    { id: 'security' as TabType, icon: Lock, label: 'Security' },
    { id: 'notifications' as TabType, icon: Bell, label: 'Notifications' },
    { id: 'language' as TabType, icon: Globe, label: 'Language' },
    { id: 'appearance' as TabType, icon: Palette, label: 'Appearance' },
    { id: 'billing' as TabType, icon: CreditCard, label: 'Billing' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className="mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </CardBody>
        </Card>

        {/* Main settings content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
                </CardHeader>
                <CardBody className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.name}
                      size="xl"
                    />

                    <div>
                      <Button variant="outline" size="sm" type="button">
                        Change Photo
                      </Button>
                      <p className="mt-2 text-sm text-gray-500">
                        JPG, GIF or PNG. Max size of 800K
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />

                    <Input
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />

                    <Input
                      label="Role"
                      value={user.role}
                      disabled
                    />

                    <Input
                      label="Location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    />
                  </div>

                  {/* Entrepreneur-specific fields */}
                  {user.role === 'entrepreneur' && (
                    <>
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Startup Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Startup Name"
                            value={profileData.startupName}
                            onChange={(e) => setProfileData({ ...profileData, startupName: e.target.value })}
                          />

                          <Input
                            label="Industry"
                            value={profileData.industry}
                            onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                          />

                          <Input
                            label="Funding Needed"
                            value={profileData.fundingNeeded}
                            onChange={(e) => setProfileData({ ...profileData, fundingNeeded: e.target.value })}
                          />

                          <Input
                            label="Founded Year"
                            type="number"
                            value={profileData.foundedYear}
                            onChange={(e) => setProfileData({ ...profileData, foundedYear: e.target.value })}
                          />

                          <Input
                            label="Team Size"
                            type="number"
                            value={profileData.teamSize}
                            onChange={(e) => setProfileData({ ...profileData, teamSize: e.target.value })}
                          />
                        </div>

                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pitch Summary
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={4}
                            value={profileData.pitchSummary}
                            onChange={(e) => setProfileData({ ...profileData, pitchSummary: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Investor-specific fields */}
                  {user.role === 'investor' && (
                    <>
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Investment Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Minimum Investment"
                            value={profileData.minimumInvestment}
                            onChange={(e) => setProfileData({ ...profileData, minimumInvestment: e.target.value })}
                          />

                          <Input
                            label="Maximum Investment"
                            value={profileData.maximumInvestment}
                            onChange={(e) => setProfileData({ ...profileData, maximumInvestment: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={4}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </form>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                      <Badge variant="error" className="mt-1">Not Enabled</Badge>
                    </div>
                    <Button variant="outline" type="button">Enable</Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />

                    <Input
                      label="New Password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Other tabs placeholder */}
          {activeTab !== 'profile' && activeTab !== 'security' && (
            <Card>
              <CardBody className="text-center py-12">
                <p className="text-gray-600">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings coming soon
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
