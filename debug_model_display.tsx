// Add this component to your app to debug the model display issue
// Save this file as components/debug-model-display.tsx

"use client"

import { useEffect, useState } from "react"
import { useHistory } from "@/context/history-context"
import { Button } from "@/components/ui/button"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from "./ui-overrides"

export function DebugModelDisplay() {
  const { history, refreshHistory } = useHistory()
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    if (history.length > 0) {
      const debugData = history.map(item => ({
        id: item.id,
        model: item.model,
        input_model: item.input.model,
        created_at: item.created_at
      }))
      setDebugInfo(JSON.stringify(debugData, null, 2))
    }
  }, [history])

  return (
    <GlassCard className="w-full">
      <GlassCardHeader>
        <GlassCardTitle>Debug Model Display</GlassCardTitle>
        <GlassCardDescription>Debugging information for model display</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-4">
          <Button onClick={refreshHistory}>Refresh History</Button>
          <div className="bg-black/20 p-4 rounded-md">
            <h3 className="text-sm font-medium text-white mb-2">History Items ({history.length})</h3>
            <pre className="text-xs text-white/80 overflow-auto max-h-[300px]">
              {debugInfo || "No history items found"}
            </pre>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  )
}
