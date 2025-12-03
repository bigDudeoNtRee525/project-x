'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Filter, List, Plus } from 'lucide-react';

// Mock data for demonstration
const mockTasks = [
  { id: '1', description: 'Prepare quarterly report', assignee: 'John Doe', deadline: '2025-12-15', status: 'In Progress', priority: 'High' },
  { id: '2', description: 'Update project documentation', assignee: 'Jane Smith', deadline: '2025-12-10', status: 'Pending', priority: 'Medium' },
  { id: '3', description: 'Schedule team meeting', assignee: 'You', deadline: '2025-12-05', status: 'Completed', priority: 'Low' },
  { id: '4', description: 'Review design mockups', assignee: 'Alex Johnson', deadline: '2025-12-20', status: 'Pending', priority: 'High' },
];

export default function DashboardPage() {
  const [view, setView] = useState<'table' | 'gantt'>('table');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Dashboard</h1>
          <p className="text-gray-600 mt-1">View and manage tasks extracted from meetings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>Add Meeting</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="table" className="flex items-center space-x-2">
            <List className="h-4 w-4" />
            <span>Table View</span>
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Gantt Chart</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>All tasks extracted from your meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                      <th className="text-left py-3 px-4 font-medium">Assignee</th>
                      <th className="text-left py-3 px-4 font-medium">Deadline</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTasks.map((task) => (
                      <tr key={task.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{task.description}</td>
                        <td className="py-3 px-4">{task.assignee}</td>
                        <td className="py-3 px-4">{task.deadline}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-center text-gray-500 text-sm">
                <p>Connect to backend to see real tasks extracted from your meetings</p>
                <p className="mt-1">Upload a meeting transcript to get started</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gantt Chart</CardTitle>
              <CardDescription>Visual timeline of tasks and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Gantt Chart View</h3>
                  <p className="mt-2 text-gray-600 max-w-sm">
                    This will display a Frappe Gantt chart showing tasks with start and end dates.
                    Connect to backend to load real task data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-sm text-gray-600 mt-1">Across all meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-gray-600 mt-1">Tasks needing your attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-sm text-gray-600 mt-1">Within next 7 days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}