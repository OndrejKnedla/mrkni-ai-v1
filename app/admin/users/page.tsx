"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { Loader2, UserCheck, UserX } from "lucide-react"
import { GlassCard } from "@/components/ui-overrides"

interface User {
  id: string
  email: string
  created_at: string
  subscription?: {
    tier: string
    status: string
  }
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [processingUser, setProcessingUser] = useState<string | null>(null)

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
      const response = await fetch("/api/admin/list-users")
      
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async (userId: string, tier: string) => {
    try {
      setProcessingUser(userId)
      
      const response = await fetch("/api/admin/manage-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: userId,
          tier,
          action: "add",
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update subscription")
      }
      
      // Refresh the user list
      await fetchUsers()
    } catch (error) {
      console.error("Error managing subscription:", error)
      alert("Failed to update subscription. See console for details.")
    } finally {
      setProcessingUser(null)
    }
  }

  const handleRemoveSubscription = async (userId: string) => {
    try {
      setProcessingUser(userId)
      
      const response = await fetch("/api/admin/manage-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: userId,
          action: "delete",
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to remove subscription")
      }
      
      // Refresh the user list
      await fetchUsers()
    } catch (error) {
      console.error("Error removing subscription:", error)
      alert("Failed to remove subscription. See console for details.")
    } finally {
      setProcessingUser(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-white drop-shadow-md">Loading users...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-white/70">You do not have permission to access this page.</CardDescription>
          </CardHeader>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white drop-shadow-md">User Management</h1>
        <p className="text-white/70 mt-2">Manage user subscriptions</p>
      </div>

      <div className="grid gap-6 max-w-6xl mx-auto">
        {users.map((user) => (
          <GlassCard key={user.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">{user.email}</CardTitle>
                  <CardDescription className="text-white/70">
                    ID: {user.id} • Created: {new Date(user.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    user.subscription?.tier === "premium"
                      ? "bg-green-600 text-white"
                      : user.subscription?.tier === "basic"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}>
                    {user.subscription?.tier || "free"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-600/20 hover:bg-green-600/30 text-white"
                  onClick={() => handleManageSubscription(user.id, "premium")}
                  disabled={processingUser === user.id || user.subscription?.tier === "premium"}
                >
                  {processingUser === user.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-4 w-4" />
                  )}
                  Set Premium
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-white"
                  onClick={() => handleManageSubscription(user.id, "basic")}
                  disabled={processingUser === user.id || user.subscription?.tier === "basic"}
                >
                  {processingUser === user.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-4 w-4" />
                  )}
                  Set Basic
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-600/20 hover:bg-red-600/30 text-white"
                  onClick={() => handleRemoveSubscription(user.id)}
                  disabled={processingUser === user.id || (!user.subscription || user.subscription.tier === "free")}
                >
                  {processingUser === user.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="mr-2 h-4 w-4" />
                  )}
                  Remove Subscription
                </Button>
              </div>
            </CardContent>
          </GlassCard>
        ))}

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/70">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}
