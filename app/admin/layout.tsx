"use client"

import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Database, Users, CreditCard, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if the current user is an admin
    const checkAdminStatus = async () => {
      if (!user) {
        router.push("/")
        return
      }

      // Check if user email is in the admin list
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(email => email.trim())
      if (user.email && adminEmails.includes(user.email)) {
        setIsAdmin(true)
      } else {
        router.push("/")
      }
    }

    if (!loading) {
      checkAdminStatus()
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="mt-4 text-white drop-shadow-md">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white drop-shadow-md mb-4">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/10">
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/10">
            <Link href="/admin/credits">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Credits
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/10">
            <Link href="/admin/interested-users">
              <Clock className="mr-2 h-4 w-4" />
              Launch Registrations
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/10">
            <Link href="/api/admin/create-tables">
              <Database className="mr-2 h-4 w-4" />
              Create Tables
            </Link>
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}
