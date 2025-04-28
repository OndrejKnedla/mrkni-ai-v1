"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface ModelStatus {
  id: string
  name: string
  available: boolean
  error?: string
  latestVersion?: string
  supportsTextToVideo: boolean
  supportsImageToVideo: boolean
}

interface ModelStatusResponse {
  models: ModelStatus[]
  textToVideoModels: ModelStatus[]
  imageToVideoModels: ModelStatus[]
}

export function VideoModelStatus() {
  const [status, setStatus] = useState<ModelStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkModels = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/check-video-models")
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkModels()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Video Model Status</CardTitle>
        <CardDescription>Check which video generation models are available</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Checking models...</span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            <p>Error: {error}</p>
          </div>
        )}

        {status && !loading && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Text-to-Video Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {status.models
                  .filter(model => model.supportsTextToVideo)
                  .map(model => (
                    <div key={model.id} className="flex items-center p-2 border rounded-md">
                      {model.available ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-muted-foreground">{model.id}</p>
                        {!model.available && model.error && (
                          <p className="text-xs text-red-500">{model.error}</p>
                        )}
                        {!model.available && model.latestVersion && (
                          <p className="text-xs">Latest version: {model.latestVersion.substring(0, 8)}...</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Image-to-Video Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {status.models
                  .filter(model => model.supportsImageToVideo)
                  .map(model => (
                    <div key={model.id} className="flex items-center p-2 border rounded-md">
                      {model.available ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-muted-foreground">{model.id}</p>
                        {!model.available && model.error && (
                          <p className="text-xs text-red-500">{model.error}</p>
                        )}
                        {!model.available && model.latestVersion && (
                          <p className="text-xs">Latest version: {model.latestVersion.substring(0, 8)}...</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm">
                <Badge variant={status.textToVideoModels.length > 0 ? "success" : "destructive"}>
                  {status.textToVideoModels.length} working text-to-video models
                </Badge>
                {" "}
                <Badge variant={status.imageToVideoModels.length > 0 ? "success" : "destructive"}>
                  {status.imageToVideoModels.length} working image-to-video models
                </Badge>
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={checkModels} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Refresh Status"
          )}
        </Button>

        <Button
          variant="outline"
          onClick={async () => {
            try {
              const response = await fetch('/api/fix-tables', { method: 'POST' });
              const data = await response.json();
              if (data.success) {
                alert('Database tables fixed successfully!');
                checkModels();
              } else {
                alert(`Error: ${data.error || 'Unknown error'}`);
              }
            } catch (err) {
              alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }}
        >
          Fix Database Tables
        </Button>

        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const response = await fetch('/api/test-replicate');
              const data = await response.json();
              if (data.valid) {
                alert(`Replicate API token is valid! Length: ${data.length}`);
              } else if (data.exists) {
                alert(`Replicate API token exists but is invalid. Length: ${data.length}. Error: ${data.error || 'Unknown error'}`);
              } else {
                alert('Replicate API token is not set!');
              }
            } catch (err) {
              alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }}
        >
          Test Replicate API Token
        </Button>
      </CardFooter>
    </Card>
  )
}
