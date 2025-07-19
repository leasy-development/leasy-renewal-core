import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import GlobalDuplicateDetection from '@/components/admin/GlobalDuplicateDetection';

export default function AdminDuplicates() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <GlobalDuplicateDetection />
      </div>
    </DashboardLayout>
  );
}