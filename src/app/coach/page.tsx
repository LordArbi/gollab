"use client";

import React from "react";
import { Activity, Calendar, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function CoachDashboard() {
  const { user } = useAuth();

  const stats = [
    { name: "Total Players", value: "42", icon: Users },
    { name: "Upcoming Sessions", value: "5", icon: Calendar },
    { name: "Avg Attendance", value: "88%", icon: Activity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Coach Dashboard</h2>
        <p className="text-gray-400 mt-2">Welcome back, Coach. Let's get the team ready.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-surface rounded-xl p-6 border border-border shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">{stat.name}</p>
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
