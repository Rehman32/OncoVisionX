"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface AuditLog {
  _id: string;
  action: string;
  resource: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  ipAddress: string;
  status: 'success' | 'failed';
  createdAt: string;
}

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/audit-logs', {
          params: { limit: 50 },
        });
        return response.data.data;
      } catch {
        return [];
      }
    },
  });

  const sampleLogs: AuditLog[] = [
    {
      _id: '1',
      action: 'LOGIN',
      resource: 'auth',
      user: { firstName: 'Admin', lastName: 'User', email: 'admin@example.com' },
      ipAddress: '192.168.1.1',
      status: 'success',
      createdAt: new Date().toISOString(),
    },
    {
      _id: '2',
      action: 'CREATE_USER',
      resource: 'user',
      user: { firstName: 'Admin', lastName: 'User', email: 'admin@example.com' },
      ipAddress: '192.168.1.1',
      status: 'success',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: '3',
      action: 'UPDATE_PATIENT',
      resource: 'patient',
      user: { firstName: 'Admin', lastName: 'User', email: 'admin@example.com' },
      ipAddress: '192.168.1.1',
      status: 'success',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const logs = data || sampleLogs;

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      LOGIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      CREATE_USER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      UPDATE_PATIENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      DELETE_PATIENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return actionColors[action] || 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">System Audit Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete record of all system activities for security and compliance
          </p>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button variant="outline" disabled>
                Filter by Date
              </Button>
              <Button variant="outline" disabled>
                Filter by Action
              </Button>
              <Button variant="outline" className="ml-auto" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              All user actions and system events are logged for security and compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log: AuditLog) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <Badge className={getActionBadge(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {log.resource}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <p className="font-medium">
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{log.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}