import { useState } from 'react';
import { EmployeeDashboard } from './EmployeeDashboard';
import { TeamLogs } from './TeamLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface EmployeesModuleProps {
  userRole?: string;
}

export const EmployeesModule = ({ userRole = 'worker' }: EmployeesModuleProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const isManagerOrAdmin = ['worker', 'admin'].includes(userRole.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-6">
          <TabsList className="bg-transparent border-b-0 space-x-8 h-auto p-0 rounded-none">
            <TabsTrigger
              value="dashboard"
              className="bg-transparent border-b-2 border-b-transparent px-0 py-4 rounded-none data-[state=active]:border-b-blue-600 data-[state=active]:text-blue-600"
            >
              📝 My Daily Log
            </TabsTrigger>

            {isManagerOrAdmin && (
              <TabsTrigger
                value="team"
                className="bg-transparent border-b-2 border-b-transparent px-0 py-4 rounded-none data-[state=active]:border-b-blue-600 data-[state=active]:text-blue-600"
              >
                👥 Team Logs
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="dashboard" className="m-0">
          <EmployeeDashboard />
        </TabsContent>

        {isManagerOrAdmin && (
          <TabsContent value="team" className="m-0">
            <TeamLogs />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
