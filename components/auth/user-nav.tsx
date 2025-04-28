"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { Database, LogOut, Settings, User, Users, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function UserNav() {
  const { user, signOut } = useAuth()

  // Check if user is an admin
  const isAdmin = user?.email && (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(email => email.trim()).includes(user.email)

  if (!user) {
    return null
  }

  // Get user avatar from Google profile if available
  const avatarUrl = user.user_metadata?.avatar_url || null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden">
          {avatarUrl ? (
            <Image src={avatarUrl || "/placeholder.svg"} alt="User avatar" fill className="object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/subscription">
            <Settings className="mr-2 h-4 w-4" />
            <span>Subscription</span>
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium leading-none">Admin</p>
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/api/admin/create-tables">
                <Database className="mr-2 h-4 w-4" />
                <span>Create Tables</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                <span>Manage Users</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/interested-users">
                <Mail className="mr-2 h-4 w-4" />
                <span>Launch Registrations</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
