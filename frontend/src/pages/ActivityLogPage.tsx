import React from 'react';
import { ActivityLogTab } from '@/components/features/admin/ActivityLogTab';

export const ActivityLogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          View activity history and changes
        </p>
      </div>
      <ActivityLogTab />
    </div>
  );
};
