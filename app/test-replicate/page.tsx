"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function TestReplicatePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("A butterfly landing on a flower, close-up shot")
  const [modelId, setModelId] = useState("stability-ai/stable-video-diffusion")
  const [version, setVersion] = useState("3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438")

  const testReplicateAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      // Test the API token
      const tokenResponse = await fetch('/api/test-replicate')
      const tokenData = await tokenResponse.json()
      
      if (!tokenData.valid) {
        setError(`Replicate API token is invalid: ${tokenData.error || 'Unknown error'}`)
        setLoading(false)
        return
      }
      
      // Test generating a video
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          version,
          prompt,
          num_frames: 16,
          fps: 8,
          width: 512,
          height: 320,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(`API Error: ${data.error || response.statusText}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Test Replicate API</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Video Generation</CardTitle>
            <CardDescription>Test the Replicate API by generating a video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-id">Model ID</Label>
              <Input 
                id="model-id" 
                value={modelId} 
                onChange={(e) => setModelId(e.target.value)} 
                placeholder="e.g., stability-ai/stable-video-diffusion"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input 
                id="version" 
                value={version} 
                onChange={(e) => setVersion(e.target.value)} 
                placeholder="Model version ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea 
                id="prompt" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Enter a prompt for the video"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={testReplicateAPI} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test API"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <XCircle className="mr-2 h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-destructive/10 p-4 rounded-md text-destructive whitespace-pre-wrap">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}
        
        {result && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center text-green-500">
                <CheckCircle className="mr-2 h-5 w-5" />
                Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Prediction ID</h3>
                  <p className="text-sm">{result.id}</p>
                </div>
                
                {result.urls?.get && (
                  <div>
                    <h3 className="font-medium">Status URL</h3>
                    <p className="text-sm break-all">
                      <a href={result.urls.get} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {result.urls.get}
                      </a>
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium">Full Response</h3>
                  <pre className="bg-muted p-4 rounded-md text-xs whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
