'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { ComposeEmailModal } from '@/components/ComposeEmailModal';
import { EmailTable } from '@/components/EmailTable';
import { Button } from '@/components/ui/Button';
import { authAPI, emailAPI } from '@/lib/api';
import { User, EmailJob, EmailStats } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { PenSquare, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEmails();
      fetchStats();
      
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchEmails();
        fetchStats();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getUser();
      setUser(response.data.user);
    } catch (error) {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmails = async () => {
    setIsTableLoading(true);
    try {
      if (activeTab === 'scheduled') {
        const response = await emailAPI.getScheduled();
        setScheduledEmails(response.data.jobs);
      } else {
        const response = await emailAPI.getSent();
        setSentEmails(response.data.jobs);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await emailAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const handleScheduleEmails = async (formData: FormData) => {
    try {
      const response = await emailAPI.scheduleEmails(formData);
      toast.success(response.data.message);
      fetchEmails();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error scheduling emails');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Emails</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs and Compose Button */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  activeTab === 'scheduled'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Scheduled Emails
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sent Emails
              </button>
            </div>
            <Button onClick={() => setIsComposeModalOpen(true)}>
              <PenSquare className="w-4 h-4" />
              Compose New Email
            </Button>
          </div>

          {/* Email Table */}
          <div className="p-6">
            <EmailTable
              jobs={activeTab === 'scheduled' ? scheduledEmails : sentEmails}
              type={activeTab}
              isLoading={isTableLoading}
            />
          </div>
        </div>
      </main>

      {/* Compose Modal */}
      <ComposeEmailModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        onSubmit={handleScheduleEmails}
      />
    </div>
  );
}
