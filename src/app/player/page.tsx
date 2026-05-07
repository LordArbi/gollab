"use client";

import React from "react";
import { Activity, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PlayerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Player Dashboard</h2>
        <p className="text-gray-400 mt-2">Welcome back, {user?.email}. Ready for training?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-white">Upcoming Sessions</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background border border-border flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white">Tactical Drill</p>
                <p className="text-xs text-gray-400">Tomorrow at 10:00 AM</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-primary/20 text-primary rounded-full">
                Attending
              </span>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white">Conditioning</p>
                <p className="text-xs text-gray-400">Friday at 4:00 PM</p>
              </div>
              <button className="text-xs font-semibold px-3 py-1.5 bg-surface-hover text-white border border-border rounded-full hover:border-primary transition-colors">
                RSVP
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-white">Performance Stats</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Attendance</span>
                <span className="text-white font-bold">92%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Drill Completion</span>
                <span className="text-white font-bold">85%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
