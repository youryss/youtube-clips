"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Film, Settings, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Jobs", href: "/jobs", icon: ListTodo },
  { name: "Clips", href: "/clips", icon: Film },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform bg-sidebar shadow-lg transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with logo and close button */}
          <div className="flex items-center justify-between border-b border-sidebar-border p-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Film className="size-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">
                Viral Clipper
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onToggle}
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav>
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                          active
                            ? "bg-sidebar-accent font-medium text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onToggle();
                          }
                        }}
                      >
                        <Icon className="size-5" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="border-t border-sidebar-border p-4">
            {user && (
              <div className="mb-4 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={logout}
            >
              <LogOut className="size-5" />
              Log Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
