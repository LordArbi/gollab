"use client";

import React, { useState, useEffect } from "react";
import { Activity, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { SkeletonRow } from "@/components/Skeleton";

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  assignedPlayers?: string[];
  attendance?: any;
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const sessionsRef = ref(db, 'training_sessions');
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        const playerSessions = parsed.filter(session => 
          session.assignedPlayers && session.assignedPlayers.includes(user.uid)
        );
        playerSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSessions(playerSessions);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRSVP = async (sessionId: string, status: 'attending' | 'declined') => {
    if (!user) return;
    await update(ref(db, `training_sessions/${sessionId}/attendance/${user.uid}`), {
      status,
      timestamp: new Date().toISOString()
    });
  };

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
            {loading ? (
              <SkeletonRow count={3} className="h-20 w-full mb-3" />
            ) : sessions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No upcoming sessions assigned to you.</p>
            ) : (
              sessions.map(session => {
                const status = session.attendance?.[user!.uid]?.status;
                
                return (
                  <div key={session.id} className="p-4 rounded-lg bg-background border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">{session.title}</p>
                      <p className="text-xs text-gray-400">{new Date(session.date).toLocaleString()} • {session.location}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {status === 'attending' ? (
                        <span className="flex items-center text-xs font-semibold px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full">
                          <CheckCircle className="w-4 h-4 mr-1" /> Attending
                        </span>
                      ) : status === 'declined' ? (
                        <span className="flex items-center text-xs font-semibold px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full">
                          <XCircle className="w-4 h-4 mr-1" /> Declined
                        </span>
                      ) : (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleRSVP(session.id, 'attending')}
                            className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary border border-primary/50 rounded-full hover:bg-primary hover:text-black transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleRSVP(session.id, 'declined')}
                            className="text-xs font-semibold px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
