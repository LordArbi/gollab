"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { CheckCircle2, XCircle, Users } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface Session {
  id: string;
  title: string;
  date: string;
}

export default function AttendancePage() {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch players
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter((u: any) => u.role === "player");
        setPlayers(parsed);
      }
    });

    // Fetch sessions
    const sessionsRef = ref(db, 'training_sessions');
    const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setSessions(parsed);
        if (parsed.length > 0 && !selectedSessionId) {
          setSelectedSessionId(parsed[0].id);
        }
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSessions();
    };
  }, []);

  useEffect(() => {
    // Fetch attendance for selected session
    if (selectedSessionId) {
      const attendanceRef = ref(db, `attendance/${selectedSessionId}`);
      const unsubscribe = onValue(attendanceRef, (snapshot) => {
        setAttendance(snapshot.val() || {});
      });
      return () => unsubscribe();
    } else {
      setAttendance({});
    }
  }, [selectedSessionId]);

  const toggleAttendance = async (playerId: string, isPresent: boolean) => {
    if (!selectedSessionId) return;
    const playerAttendanceRef = ref(db, `attendance/${selectedSessionId}/${playerId}`);
    await set(playerAttendanceRef, isPresent);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Attendance Checklist</h2>
        <p className="text-gray-400 mt-2">Mark players present or absent for training sessions.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-6 max-w-sm">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Training Session</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="" disabled>Select a session...</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.title} - {new Date(s.date).toLocaleDateString()}</option>
            ))}
          </select>
        </div>

        {selectedSessionId ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-background text-gray-400 text-xs uppercase border-y border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Player</th>
                  <th className="px-6 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {players.map((player) => {
                  const isPresent = attendance[player.id];
                  return (
                    <tr key={player.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center">
                        <Users className="h-5 w-5 text-gray-500 mr-3" />
                        {player.email}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleAttendance(player.id, true)}
                            className={`flex items-center px-3 py-1.5 rounded-lg border transition-colors ${
                              isPresent === true
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-background border-border text-gray-500 hover:text-white"
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Present
                          </button>
                          <button
                            onClick={() => toggleAttendance(player.id, false)}
                            className={`flex items-center px-3 py-1.5 rounded-lg border transition-colors ${
                              isPresent === false
                                ? "bg-red-500/20 border-red-500 text-red-500"
                                : "bg-background border-border text-gray-500 hover:text-white"
                            }`}
                          >
                            <XCircle className="h-4 w-4 mr-1.5" /> Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {players.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                      No players registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center border border-dashed border-border rounded-lg bg-background">
            <p className="text-gray-400">Please select or create a training session first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
