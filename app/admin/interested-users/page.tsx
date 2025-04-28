"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, Download, Mail } from "lucide-react"
import { GlassCard } from "@/components/ui-overrides"

interface InterestedUser {
  id: string
  email: string
  name: string | null
  created_at: string
  notified: boolean
}

export default function AdminInterestedUsersPage() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<InterestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is an admin
  const isAdmin = user?.email && (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(email => email.trim()).includes(user.email)

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading, isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/interested-users")
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
      } else {
        setError(data.error || "Failed to fetch users")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (users.length === 0) return

    // Create CSV content
    const headers = ["Email", "Name", "Registration Date"]
    const csvContent = [
      headers.join(","),
      ...users.map(user => [
        user.email,
        user.name || "",
        new Date(user.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `interested-users-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-white drop-shadow-md">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-white">Unauthorized</CardTitle>
            <CardDescription className="text-white/70">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">Interested Users</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            disabled={loading}
            className="bg-black/20 border-white/10 text-white hover:bg-white/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={downloadCSV}
            disabled={loading || users.length === 0}
            className="bg-black/20 border-white/10 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            <span className="ml-2">Export CSV</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-200 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <GlassCard>
        <CardHeader>
          <CardTitle className="text-white">Registered Users</CardTitle>
          <CardDescription className="text-white/70">
            {users.length} users have registered to be notified
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-white/70">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70">No users have registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">{user.email}</td>
                      <td className="py-3 px-4 text-white">{user.name || "-"}</td>
                      <td className="py-3 px-4 text-white/70">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-white/70 text-sm">
            Use this list to notify users when the application launches
          </div>
        </CardFooter>
      </GlassCard>
    </div>
  )
}
