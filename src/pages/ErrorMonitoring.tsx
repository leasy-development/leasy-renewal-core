import React from 'react';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';

export default function ErrorMonitoring() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <ErrorMonitoringDashboard />
    </div>
  );
}