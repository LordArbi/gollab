"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  LogOut, 
  Activity 
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { NotificationBell } from "./NotificationBell";

const adminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
];

const coachLinks = [
  { name: "Dashboard", href: "/coach", icon: LayoutDashboard },
  { name: "Sessions", href: "/coach/sessions", icon: Calendar },
  { name: "Attendance", href: "/coach/attendance", icon: Users },
];

const playerLinks = [
  { name: "Dashboard", href: "/player", icon: LayoutDashboard },
  { name: "My Sessions", href: "/player/sessions", icon: Calendar },
  { name: "Stats", href: "/player/stats", icon: Activity },
];

export default function Sidebar() {
  const { role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  let links = playerLinks;
  if (role === "admin") links = adminLinks;
  if (role === "coach") links = coachLinks;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <div className="flex flex-col w-64 h-screen bg-surface border-r border-border text-foreground">
      <div className="p-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">GolLab</h1>
          <p className="text-sm text-gray-400 mt-1">Academy Management</p>
        </div>
        <NotificationBell />
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-gray-400 hover:bg-surface-hover hover:text-white"
              }`}
            >
              <link.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary" : "text-gray-400"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
