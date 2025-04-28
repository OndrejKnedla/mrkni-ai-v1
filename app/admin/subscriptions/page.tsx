"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UserPlus, UserMinus, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react"
import { GlassCard } from "@/components/ui-overrides"

export default function AdminSubscriptionsPage() {
  const { user, loading: authLoading } = useAuth()
  const [targetUserId, setTargetUserId] = useState("")
  const [tier, setTier] = useState("premium")
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info", text: string } | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [showCreateTablesButton, setShowCreateTablesButton] = useState(false)
  const [creatingTables, setCreatingTables] = useState(false)

  useEffect(() => {
    // Check if the current environment has ADMIN_EMAILS defined
    const checkAdminAccess = async () => {
      try {
        const response = await fetch("/api/admin/check-access")
        if (response.ok) {
          const data = await response.json()
          setAdminEmails(data.adminEmails || [])
        }
      } catch (error) {
        console.error("Error checking admin access:", error)
      }
    }

    checkAdminAccess()
  }, [])

  const isAdmin = user && adminEmails.includes(user.email || "")

  const fetchUsers = async () => {
    if (!isAdmin) return

    setLoadingUsers(true)
    try {
      console.log("Fetching users from API...")
      const response = await fetch("/api/admin/list-users")
      const data = await response.json()
      console.log("API response:", data)

      if (response.ok) {
        console.log("Successfully fetched users:", data.users)
        setUsers(data.users || [])
      } else {
        console.error("Error fetching users:", data.error)
        setMessage({ type: "error", text: data.error || "Failed to fetch users" })
      }
    } catch (error) {
      console.error("Exception fetching users:", error)
      setMessage({ type: "error", text: `Exception fetching users: ${error}` })
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const handleAddSubscription = async () => {
    if (!targetUserId) {
      setMessage({ type: "error", text: "Please enter a user ID" })
      return
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetUserId.trim())) {
      setMessage({ type: "error", text: "Invalid user ID format. Please use the exact UUID format." })
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      const cleanUserId = targetUserId.trim()
      console.log("Adding subscription for user:", cleanUserId, "with tier:", tier)

      const response = await fetch("/api/admin/manage-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: cleanUserId,
          tier,
          action: "add",
        }),
      })

      const data = await response.json()
      console.log("Subscription API response:", data)

      if (response.ok) {
        console.log("Successfully added subscription")
        setMessage({ type: "success", text: data.message || "Subscription added successfully" })
        // Refresh the user list to show updated data
        fetchUsers()
      } else {
        console.error("Error adding subscription:", data.error, data.details)

        // Check if the error is related to missing tables
        if ((data.details && data.details.message && data.details.message.includes("does not exist")) ||
            (data.details && data.details.code === "TABLES_MISSING")) {
          setMessage({
            type: "info",
            text: "Database tables don't exist yet. Click the 'Create Database Tables' button below to set them up, or run the SQL script manually in the Supabase dashboard."
          })

          // Show the create tables button
          setShowCreateTablesButton(true)
        } else {
          setMessage({
            type: "error",
            text: data.error || "Failed to add subscription. See console for details."
          })
        }
      }
    } catch (error) {
      console.error("Error adding subscription:", error)
      setMessage({ type: "error", text: "An error occurred while adding the subscription" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateTables = async () => {
    setCreatingTables(true)
    setMessage(null)

    try {
      console.log("Creating database tables...")
      const response = await fetch("/api/admin/create-tables-direct", {
        method: "POST",
      })

      const data = await response.json()
      console.log("Create tables response:", data)

      if (response.ok) {
        setMessage({ type: "success", text: "Database tables created successfully. You can now add subscriptions." })
        setShowCreateTablesButton(false)
      } else {
        console.error("Error creating tables:", data.error)
        setMessage({
          type: "error",
          text: data.error || "Failed to create database tables. Please try running the SQL script manually."
        })
      }
    } catch (error) {
      console.error("Exception creating tables:", error)
      setMessage({
        type: "error",
        text: "An error occurred while creating database tables. Please try running the SQL script manually."
      })
    } finally {
      setCreatingTables(false)
    }
  }

  const handleRemoveSubscription = async () => {
    if (!targetUserId) {
      setMessage({ type: "error", text: "Please enter a user ID" })
      return
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetUserId.trim())) {
      setMessage({ type: "error", text: "Invalid user ID format. Please use the exact UUID format." })
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      const cleanUserId = targetUserId.trim()
      console.log("Removing subscription for user:", cleanUserId)

      const response = await fetch("/api/admin/manage-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: cleanUserId,
          action: "delete",
        }),
      })

      const data = await response.json()
      console.log("Subscription removal API response:", data)

      if (response.ok) {
        setMessage({ type: "success", text: data.message || "Subscription removed successfully" })
        // Refresh the user list to show updated data
        fetchUsers()
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to remove subscription. See console for details."
        })
      }
    } catch (error) {
      console.error("Error removing subscription:", error)
      setMessage({ type: "error", text: "An error occurred while removing the subscription" })
    } finally {
      setIsProcessing(false)
    }
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white">Authentication Required</CardTitle>
            <CardDescription className="text-white/70">
              Please sign in to access the admin panel.
            </CardDescription>
          </CardHeader>
        </GlassCard>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-white/70">
              You do not have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Subscription Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white">Manage Subscription</CardTitle>
            <CardDescription className="text-white/70">
              Add or remove subscription for a user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white font-medium block mb-2">User ID</label>
              <div className="relative">
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="bg-black/30 border-white/10 text-white font-mono text-sm pr-10"
                />
                {targetUserId && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    onClick={() => {
                      setTargetUserId('')
                      setMessage(null)
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                Enter the UUID of the user to manage their subscription. Make sure to use the exact ID format.
              </p>
              <div className="flex justify-between mt-1">
                <button
                  className="text-xs text-green-400 hover:text-green-300"
                  onClick={() => {
                    if (user?.id) {
                      setTargetUserId(user.id)
                      setMessage({ type: "info", text: "Your user ID has been filled in the field" })
                    }
                  }}
                >
                  Use my ID
                </button>
                <button
                  className="text-xs text-blue-400 hover:text-blue-300"
                  onClick={() => {
                    if (targetUserId) {
                      navigator.clipboard.writeText(targetUserId)
                      alert('User ID copied to clipboard!')
                    }
                  }}
                  disabled={!targetUserId}
                >
                  {targetUserId ? 'Copy ID' : 'No ID entered'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-white font-medium block mb-2">Subscription Tier</label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className="bg-black/30 border-white/10 text-white">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {message && (
              <div
                className={`p-3 rounded-md ${message.type === "success" ? "bg-green-500/20 text-green-200" :
                  message.type === "error" ? "bg-red-500/20 text-red-200" :
                  "bg-blue-500/20 text-blue-200"}`}
              >
                <div className="flex items-start">
                  {message.type === "success" && (
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  {message.type === "error" && (
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  {message.type === "info" && (
                    <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAddSubscription}
              disabled={isProcessing || !targetUserId || creatingTables}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Subscription
                </>
              )}
            </Button>

            <Button
              onClick={handleRemoveSubscription}
              disabled={isProcessing || !targetUserId || creatingTables}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove Subscription
                </>
              )}
            </Button>

            {showCreateTablesButton && (
              <Button
                onClick={handleCreateTables}
                disabled={creatingTables}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {creatingTables ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Tables...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Create Database Tables
                  </>
                )}
              </Button>
            )}

            {process.env.NODE_ENV !== 'production' && (
              <Button
                onClick={() => {
                  console.log('Current user:', user)
                  console.log('Admin emails:', adminEmails)
                  console.log('Is admin:', isAdmin)
                  console.log('Target user ID:', targetUserId)
                  console.log('Users list:', users)
                  alert('Debug info logged to console')
                }}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Debug
              </Button>
            )}
          </CardFooter>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-white">Your Information</CardTitle>
            <CardDescription className="text-white/70">
              Use this information to add a subscription to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between">
                  <span className="text-white font-medium">Your User ID:</span>
                </div>
                <div className="bg-black/30 p-2 rounded-md overflow-x-auto">
                  <code className="text-green-400 text-sm break-all">{user.id}</code>
                </div>
                <button
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1 text-left"
                  onClick={() => {
                    navigator.clipboard.writeText(user.id)
                    alert('User ID copied to clipboard!')
                  }}
                >
                  Click to copy to clipboard
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-white font-medium">Email:</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="mt-4 p-3 bg-blue-500/20 text-blue-200 rounded-md">
                <p className="text-sm mb-2">
                  <strong>How to add premium to your account:</strong>
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Copy your User ID from above (click the "Copy to clipboard" button)</li>
                  <li>Paste it in the "User ID" field on the left</li>
                  <li>Select "Premium" from the dropdown</li>
                  <li>Click "Add Subscription"</li>
                </ol>
                <p className="text-sm mt-2">
                  After adding the subscription, go to the Subscription page to verify your premium status.
                </p>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </div>

      <div className="mt-8">
        <GlassCard>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Users</CardTitle>
                <CardDescription className="text-white/70">
                  List of users in the system
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="border-white/10 bg-black/30 text-white hover:bg-white/10"
              >
                {loadingUsers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-4 text-white/70 font-medium">User ID</th>
                      <th className="text-left py-2 px-4 text-white/70 font-medium">Email</th>
                      <th className="text-left py-2 px-4 text-white/70 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/10">
                        <td className="py-2 px-4 text-white">{user.id}</td>
                        <td className="py-2 px-4 text-white">{user.email || "(No email)"}</td>
                        <td className="py-2 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-black/30 text-white hover:bg-white/10"
                            onClick={() => {
                              setTargetUserId(user.id)
                              setMessage({ type: "info", text: `Selected user ID: ${user.id}` })
                              // Scroll to the top of the page
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            Use this ID
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/70 text-center py-4">No users found</p>
            )}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
