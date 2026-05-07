"use client";

import React from "react";
import { Users, UserCheck, Activity, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { name: "Total Users", value: "248", icon: Users, change: "+12%", changeType: "positive" },
    { name: "Active Players", value: "186", icon: UserCheck, change: "+4%", changeType: "positive" },
    { name: "Coaches", value: "12", icon: Activity, change: "0%", changeType: "neutral" },
    { name: "Monthly Revenue", value: "$12,450", icon: DollarSign, change: "+18%", changeType: "positive" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <p className="text-gray-400 mt-2">Welcome back, Admin. Here is what is happening at GolLab today.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-surface rounded-xl p-6 border border-border shadow-sm hover:border-primary/50 transition-colors duration-300"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">{stat.name}</p>
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === "positive" ? "text-primary" : "text-gray-500"
                }`}
              >
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-4">Recent Registrations</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    U{i}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">New Player {i}</p>
                    <p className="text-xs text-gray-400">Registered 2 hours ago</p>
                  </div>
                </div>
                <button className="text-xs text-primary hover:text-white transition-colors">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-4">Pending Payments</h3>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Invoice #00{i}</p>
                    <p className="text-xs text-gray-400">Player {i} - Overdue</p>
                  </div>
                </div>
                <button className="text-xs text-white bg-primary hover:bg-primary-hover px-3 py-1.5 rounded transition-colors text-black font-semibold">
                  Send Reminder
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
