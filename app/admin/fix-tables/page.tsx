'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function FixTablesPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fixTables = async () => {
    setIsFixing(true);
    try {
      const response = await fetch('/api/fix-tables', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error fixing tables:', error);
      setResult({ error: 'Failed to fix tables' });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Fix Database Tables</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fix Image Generation Tables</CardTitle>
          <CardDescription>
            This will modify the image_generations and generated_images tables to accept string IDs instead of UUIDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This fix is necessary because Replicate returns string IDs that are not in UUID format, but our database is expecting UUIDs.
          </p>
          <Button onClick={fixTables} disabled={isFixing}>
            {isFixing ? 'Fixing...' : 'Fix Tables'}
          </Button>
        </CardContent>
        {result && (
          <CardFooter>
            <pre className="bg-gray-100 p-4 rounded overflow-auto w-full">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
