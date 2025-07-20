
import React from 'react';
import { EnhancedDeepSourceDashboard } from '@/components/EnhancedDeepSourceDashboard';
import { DeepSourceDebugPanel } from '@/components/DeepSourceDebugPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DeepSource() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="debug">Debug & Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <EnhancedDeepSourceDashboard />
        </TabsContent>
        
        <TabsContent value="debug" className="mt-6">
          <DeepSourceDebugPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
