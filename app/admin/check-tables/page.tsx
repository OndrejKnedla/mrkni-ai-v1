'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckTablesPage() {
  const [tableStatus, setTableStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createResult, setCreateResult] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkTables();
  }, []);

  const checkTables = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/check-tables');
      const data = await response.json();
      setTableStatus(data);
    } catch (error) {
      console.error('Error checking tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createMissingTables = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/create-missing-tables', {
        method: 'POST',
      });
      const data = await response.json();
      setCreateResult(data);
      // Refresh table status after creating tables
      await checkTables();
    } catch (error) {
      console.error('Error creating tables:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Tables Status</h1>
      
      <div className="mb-6">
        <Button onClick={checkTables} disabled={isLoading}>
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </Button>
        <Button onClick={createMissingTables} disabled={isCreating} className="ml-4">
          {isCreating ? 'Creating...' : 'Create Missing Tables'}
        </Button>
      </div>
      
      {tableStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(tableStatus).map(([tableName, status]: [string, any]) => (
            <Card key={tableName}>
              <CardHeader>
                <CardTitle>{tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                <CardDescription>
                  {status.exists ? 'Table exists' : 'Table does not exist'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status.error && (
                  <div className="text-red-500">
                    <p>Error: {status.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {createResult && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Create Tables Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(createResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
