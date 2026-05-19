"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { CheckCircle2, XCircle, Users, ChevronRight, Award } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  ageGroup?: string;
}

interface Session {
  id: string;
  title: string;
  date: string;
  assignedPlayers?: string[];
  attendance?: Record<string, { status: string; timestamp: string }>;
}

export default function AttendancePage() {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((u: any) => u.role === "player");
        setPlayers(parsed as UserProfile[]);
      }
    });

    const sessionsRef = ref(db, "training_sessions");
    const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        parsed.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSessions(parsed as Session[]);
        if (parsed.length > 0 && !selectedSessionId) {
          setSelectedSessionId(parsed[0].id);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSessions();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  // Only show players assigned to this session
  const assignedPlayerIds = selectedSession?.assignedPlayers || [];
  const assignedPlayers = players.filter((p) => assignedPlayerIds.includes(p.id));
  const attendance = selectedSession?.attendance || {};

  const toggleAttendance = async (playerId: string, newStatus: "attending" | "declined") => {
    if (!selectedSessionId) return;
    const current = attendance[playerId]?.status;
    // Toggle off if same status
    if (current === newStatus) {
      await update(ref(db, `training_sessions/${selectedSessionId}/attendance/${playerId}`), {
        status: "pending",
        timestamp: new Date().toISOString(),
      });
    } else {
      await update(ref(db, `training_sessions/${selectedSessionId}/attendance/${playerId}`), {
        status: newStatus,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const presentCount = assignedPlayers.filter((p) => attendance[p.id]?.status === "attending").length;
  const absentCount = assignedPlayers.filter((p) => attendance[p.id]?.status === "declined").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Attendance Checklist</h2>
        <p className="text-gray-400 mt-2">Mark players present or absent for training sessions.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Session Selector */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 max-w-sm">
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Training Session</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="" disabled>Select a session...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {new Date(s.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSession && assignedPlayers.length > 0 && (
                <div className="flex gap-4 pt-6 sm:pt-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{presentCount}</p>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{absentCount}</p>
                    <p className="text-xs text-gray-500">Absent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">{assignedPlayers.length - presentCount - absentCount}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            {!selectedSessionId ? (
              <div className="py-12 text-center">
                <ChevronRight className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Select a training session above to take attendance.</p>
              </div>
            ) : assignedPlayers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No players assigned to this session.</p>
                <p className="text-gray-500 text-sm mt-1">Go to Sessions → Edit to assign players.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-background text-gray-400 text-xs uppercase border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium">Player</th>
                      <th className="px-6 py-4 font-medium">Age Group</th>
                      <th className="px-6 py-4 font-medium">RSVP (Player)</th>
                      <th className="px-6 py-4 font-medium text-right">Coach Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assignedPlayers.map((player) => {
                      const status = attendance[player.id]?.status;
                      const isPresent = status === "attending";
                      const isAbsent = status === "declined";

                      return (
                        <tr key={player.id} className={`transition-colors ${isPresent ? "bg-green-500/5 hover:bg-green-500/10" : isAbsent ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-surface-hover"}`}>
                          <td className="px-6 py-4 font-medium text-white">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                {player.email[0].toUpperCase()}
                              </div>
                              <span>{player.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {player.ageGroup ? (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{player.ageGroup}</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {status === "attending" ? (
                              <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                                <CheckCircle2 className="h-4 w-4" /> Confirmed
                              </span>
                            ) : status === "declined" ? (
                              <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                                <XCircle className="h-4 w-4" /> Declined
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">No response</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => toggleAttendance(player.id, "attending")}
                                className={`flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                  isPresent
                                    ? "bg-green-500/20 border-green-500 text-green-400"
                                    : "bg-background border-border text-gray-500 hover:border-green-500 hover:text-green-400"
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Present
                              </button>
                              <button
                                onClick={() => toggleAttendance(player.id, "declined")}
                                className={`flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                  isAbsent
                                    ? "bg-red-500/20 border-red-500 text-red-500"
                                    : "bg-background border-border text-gray-500 hover:border-red-500 hover:text-red-400"
                                }`}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary bar */}
                {assignedPlayers.length > 0 && (
                  <div className="px-6 py-4 bg-background border-t border-border flex items-center gap-4">
                    <Award className="h-4 w-4 text-gray-500" />
                    <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${assignedPlayers.length > 0 ? (presentCount / assignedPlayers.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-medium w-20 text-right">
                      {assignedPlayers.length > 0 ? Math.round((presentCount / assignedPlayers.length) * 100) : 0}% present
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
