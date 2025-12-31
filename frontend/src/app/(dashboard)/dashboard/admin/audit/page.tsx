"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Search, Download } from 'lucide-react';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ userId: '', action: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/audit', {
        params: { page, limit: 50, ...filters }
      });
      return data;
    }
  });

  const getActionColor = (action: string) => {
    if (action.startsWith('CREATE')) return 'bg-green-500';
    if (action.startsWith('UPDATE')) return 'bg-blue-500';
    if (action.startsWith('DELETE')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">System activity and compliance tracking</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          />
          <Input
            placeholder="Action (e.g., CREATE_PATIENT)"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          />
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.map((log: any) => (
              <TableRow key={log._id}>
                <TableCell className="font-mono text-sm">
                  {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                </TableCell>
                <TableCell>
                  {log.userId?.firstName} {log.userId?.lastName}
                  <p className="text-xs text-muted-foreground">{log.userId?.email}</p>
                </TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {log.resourceType}: {log.resourceId}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {log.ipAddress}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
