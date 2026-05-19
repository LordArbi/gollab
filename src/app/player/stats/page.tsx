"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Activity, Calendar, TrendingUp, Award, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  attendance?: Record<string, { status: string }>;
  feedback?: Record<string, { comment: string; timestamp: string }>;
}

export default function PlayerStatsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const sessionsRef = ref(db, "training_sessions");
    const unsub = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        const mine = all.filter(
          (s: any) => s.assignedPlayers && s.assignedPlayers.includes(user.uid)
        );
        setSessions(mine as TrainingSession[]);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Only count past sessions for stats
  const pastSessions = sessions.filter((s) => new Date(s.date) < new Date());
  const totalAssigned = pastSessions.length;
  const attended = pastSessions.filter((s) => s.attendance?.[user!.uid]?.status === "attending").length;
  const missed = pastSessions.filter((s) => s.attendance?.[user!.uid]?.status === "declined").length;
  const noResponse = totalAssigned - attended - missed;
  const attendanceRate = totalAssigned > 0 ? Math.round((attended / totalAssigned) * 100) : 0;

  const feedbacks = sessions
    .filter((s) => s.feedback?.[user!.uid])
    .map((s) => ({
      sessionTitle: s.title,
      sessionDate: s.date,
      comment: s.feedback![user!.uid].comment,
      timestamp: s.feedback![user!.uid].timestamp,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-4xl font-bold text-white">{value}</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Performance Stats</h2>
        <p className="text-gray-400 mt-2">Your attendance record and coach feedback.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Calendar} label="Total Sessions" value={totalAssigned} color="bg-primary/10 text-primary" />
            <StatCard icon={CheckCircle} label="Attended" value={attended} color="bg-green-500/10 text-green-400" />
            <StatCard icon={XCircle} label="Missed" value={missed} color="bg-red-500/10 text-red-400" />
            <StatCard icon={TrendingUp} label="Attendance Rate" value={`${attendanceRate}%`} color="bg-blue-500/10 text-blue-400" />
          </div>

          {/* Attendance Bar */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Attendance Breakdown
            </h3>
            {totalAssigned === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No past sessions yet to calculate stats.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Attended</span>
                    <span className="text-white font-bold">{attended} / {totalAssigned}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${totalAssigned > 0 ? (attended / totalAssigned) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-red-400" /> Missed</span>
                    <span className="text-white font-bold">{missed} / {totalAssigned}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${totalAssigned > 0 ? (missed / totalAssigned) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                {noResponse > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">No Response</span>
                      <span className="text-white font-bold">{noResponse} / {totalAssigned}</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-3">
                      <div
                        className="bg-gray-500 h-3 rounded-full transition-all duration-700"
                        style={{ width: `${(noResponse / totalAssigned) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coach Feedback Section */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Coach Feedback
              {feedbacks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full font-medium">
                  {feedbacks.length}
                </span>
              )}
            </h3>
            {feedbacks.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No coach feedback yet.</p>
                <p className="text-gray-500 text-xs mt-1">Keep attending sessions to get evaluated!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb, idx) => (
                  <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-white">{fb.sessionTitle}</p>
                      <p className="text-[10px] text-gray-500 flex-shrink-0 ml-4">
                        {new Date(fb.sessionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-300 italic">"{fb.comment}"</p>
                    <p className="text-[10px] text-gray-500 mt-2">
                      Feedback given: {new Date(fb.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
