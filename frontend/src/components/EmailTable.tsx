import React from 'react';
import { EmailJob } from '@/types';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, Mail } from 'lucide-react';

interface EmailTableProps {
  jobs: EmailJob[];
  type: 'scheduled' | 'sent';
  isLoading: boolean;
}

export const EmailTable: React.FC<EmailTableProps> = ({ jobs, type, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Mail className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No {type} emails</p>
        <p className="text-sm">
          {type === 'scheduled' 
            ? 'Schedule your first email campaign to get started' 
            : 'Sent emails will appear here'}
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3" />
          Scheduled
        </span>
      ),
      sent: (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Sent
        </span>
      ),
      failed: (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recipient
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {type === 'scheduled' ? 'Scheduled Time' : 'Sent Time'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {job.recipient_email}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md truncate">
                  {job.subject}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {type === 'scheduled' 
                    ? format(new Date(job.scheduled_time), 'MMM dd, yyyy HH:mm')
                    : job.sent_at ? format(new Date(job.sent_at), 'MMM dd, yyyy HH:mm') : '-'
                  }
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(job.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
