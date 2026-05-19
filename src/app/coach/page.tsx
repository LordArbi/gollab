"use client";

import React, { useState, useEffect } from "react";
import { Activity, Calendar, Users, CheckCircle, MessageSquare, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Skeleton } from "@/components/Skeleton";
import Link from "next/link";

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  location: string;
  assignedPlayers?: string[];
  attendance?: Record<string, { status: string }>;
  feedback?: Record<string, { comment: string }>;
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionsRef = ref(db, "training_sessions");
    const unsub1 = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        all.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSessions(all as TrainingSession[]);
      } else {
        setSessions([]);
      }
    });

    const usersRef = ref(db, "users");
    const unsub2 = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        setPlayerCount(all.filter((u: any) => u.role === "player").length);
      }
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.date) >= now);
  const past = sessions.filter((s) => new Date(s.date) < now);

  // Calculate overall attendance rate across all past sessions
  let totalAssigned = 0;
  let totalAttended = 0;
  past.forEach((s) => {
    const assigned = s.assignedPlayers?.length || 0;
    totalAssigned += assigned;
    if (s.attendance) {
      totalAttended += Object.values(s.attendance).filter((a) => a.status === "attending").length;
    }
  });
  const avgAttendance = totalAssigned > 0 ? Math.round((totalAttended / totalAssigned) * 100) : 0;

  // Total feedbacks given
  let totalFeedbacks = 0;
  sessions.forEach((s) => {
    if (s.feedback) totalFeedbacks += Object.keys(s.feedback).length;
  });

  const statCards = [
    { name: "Total Players", value: loading ? "..." : playerCount, icon: Users, color: "text-primary bg-primary/10" },
    { name: "Upcoming Sessions", value: loading ? "..." : upcoming.length, icon: Calendar, color: "text-blue-400 bg-blue-400/10" },
    { name: "Avg Attendance", value: loading ? "..." : `${avgAttendance}%`, icon: TrendingUp, color: "text-green-400 bg-green-400/10" },
    { name: "Feedbacks Given", value: loading ? "..." : totalFeedbacks, icon: MessageSquare, color: "text-orange-400 bg-orange-400/10" },
  ];

  const nextThree = upcoming.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Coach Dashboard</h2>
        <p className="text-gray-400 mt-2">Welcome back, {user?.email}. Let's get the team ready.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {statCards.map((stat) =>
          loading ? (
            <Skeleton key={stat.name} className="h-28 w-full" />
          ) : (
            <div key={stat.name} className="bg-surface rounded-xl p-6 border border-border shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions Preview */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-white">Next Sessions</h3>
            </div>
            <Link href="/coach/sessions" className="text-xs text-primary hover:text-primary-hover font-medium transition-colors">
              Manage →
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)
            ) : nextThree.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No upcoming sessions. Create one!</p>
            ) : (
              nextThree.map((s) => {
                const assigned = s.assignedPlayers?.length || 0;
                const confirmed = s.attendance
                  ? Object.values(s.attendance).filter((a) => a.status === "attending").length
                  : 0;
                return (
                  <div key={s.id} className="p-4 rounded-lg bg-background border border-border flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{s.title}</p>
                      <p className="text-xs text-gray-400">{new Date(s.date).toLocaleString()} • {s.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-400">{assigned} assigned</p>
                      <p className="text-xs text-green-400 font-semibold">{confirmed} confirmed</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-white">Attendance Overview</h3>
            </div>
            <Link href="/coach/attendance" className="text-xs text-primary hover:text-primary-hover font-medium transition-colors">
              Take attendance →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : past.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No past sessions to calculate attendance.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                    Overall Attendance
                  </span>
                  <span className="text-white font-bold">{avgAttendance}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${avgAttendance}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{past.length}</p>
                  <p className="text-xs text-gray-500">Past Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{totalAttended}</p>
                  <p className="text-xs text-gray-500">Total Attended</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">{totalFeedbacks}</p>
                  <p className="text-xs text-gray-500">Feedbacks</p>
                </div>
              </div>

              {/* Recent past sessions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Sessions</p>
                {past.slice(-3).reverse().map((s) => {
                  const assigned = s.assignedPlayers?.length || 0;
                  const att = s.attendance
                    ? Object.values(s.attendance).filter((a) => a.status === "attending").length
                    : 0;
                  const rate = assigned > 0 ? Math.round((att / assigned) * 100) : 0;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-28 truncate">{s.title}</span>
                      <div className="flex-1 bg-background rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">{rate}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
