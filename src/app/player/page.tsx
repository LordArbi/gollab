"use client";

import React, { useState, useEffect } from "react";
import { Activity, Calendar, CheckCircle, XCircle, TrendingUp, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { SkeletonRow, Skeleton } from "@/components/Skeleton";
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

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const sessionsRef = ref(db, "training_sessions");
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        const playerSessions = parsed.filter(
          (session: any) => session.assignedPlayers && session.assignedPlayers.includes(user.uid)
        );
        playerSessions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSessions(playerSessions as TrainingSession[]);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRSVP = async (sessionId: string, status: "attending" | "declined") => {
    if (!user) return;
    await update(ref(db, `training_sessions/${sessionId}/attendance/${user.uid}`), {
      status,
      timestamp: new Date().toISOString(),
    });
  };

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.date) >= now).slice(0, 3);
  const past = sessions.filter((s) => new Date(s.date) < now);
  const attended = past.filter((s) => s.attendance?.[user?.uid || ""]?.status === "attending").length;
  const attendanceRate = past.length > 0 ? Math.round((attended / past.length) * 100) : 0;
  const feedbackCount = sessions.filter((s) => s.feedback?.[user?.uid || ""]).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Player Dashboard</h2>
        <p className="text-gray-400 mt-2">Welcome back, {user?.email}. Ready for training?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2">Total Sessions</p>
              <p className="text-3xl font-bold text-white">{sessions.length}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2">Upcoming</p>
              <p className="text-3xl font-bold text-primary">{sessions.filter(s => new Date(s.date) >= now).length}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2">Attendance Rate</p>
              <p className="text-3xl font-bold text-green-400">{attendanceRate}%</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2">Feedbacks</p>
              <p className="text-3xl font-bold text-blue-400">{feedbackCount}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Sessions */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-white">Upcoming Sessions</h3>
            </div>
            <Link href="/player/sessions" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium">
              View all →
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <SkeletonRow count={3} className="h-20 w-full mb-3" />
            ) : upcoming.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No upcoming sessions assigned to you.</p>
            ) : (
              upcoming.map((session) => {
                const status = session.attendance?.[user!.uid]?.status;
                return (
                  <div key={session.id} className="p-4 rounded-lg bg-background border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{session.title}</p>
                      <p className="text-xs text-gray-400">{new Date(session.date).toLocaleString()} • {session.location}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {status === "attending" ? (
                        <span className="flex items-center text-xs font-semibold px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmed
                        </span>
                      ) : status === "declined" ? (
                        <span className="flex items-center text-xs font-semibold px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Declined
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleRSVP(session.id, "attending")} className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary border border-primary/50 rounded-full hover:bg-primary hover:text-black transition-colors">Accept</button>
                          <button onClick={() => handleRSVP(session.id, "declined")} className="text-xs font-semibold px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-colors">Decline</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Performance */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-white">Performance</h3>
            </div>
            <Link href="/player/stats" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium">
              Full stats →
            </Link>
          </div>

          <div className="space-y-5">
            {loading ? (
              <SkeletonRow count={2} className="h-10 w-full mb-3" />
            ) : past.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Attend sessions to build your stats!</p>
            ) : (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-green-400"/>Attendance Rate</span>
                    <span className="text-white font-bold">{attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${attendanceRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-blue-400"/>Feedback Received</span>
                    <span className="text-white font-bold">{feedbackCount} / {past.length}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${past.length > 0 ? (feedbackCount / past.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="pt-3 border-t border-border flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">{attended}</p>
                    <p className="text-xs text-gray-500">Attended</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">{past.length - attended}</p>
                    <p className="text-xs text-gray-500">Missed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-400">{sessions.filter(s => new Date(s.date) >= now).length}</p>
                    <p className="text-xs text-gray-500">Upcoming</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
