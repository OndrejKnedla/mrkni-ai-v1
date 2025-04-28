'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestApiPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset over mountains',
          model: 'flux-schnell',
          width: 512,
          height: 512,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          scheduler: 'DPMSolverMultistep',
          num_images: 1
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error generating image:', error);
      setResult({ error: 'Failed to generate image' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test Generate Image API</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Image</CardTitle>
          <CardDescription>
            Test the generate-image API route
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateImage} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Image'}
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
