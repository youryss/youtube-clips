"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Bell, Settings, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search:", searchQuery);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: Menu button and search */}
        <div className="flex flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="size-5" />
          </Button>

          <form onSubmit={handleSearch} className="max-w-md flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dashboard..."
              leftIcon={<Search className="size-4" />}
              className="bg-muted"
            />
          </form>
        </div>

        {/* Right: Actions and user menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="size-5" />
            </Link>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <User className="size-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
