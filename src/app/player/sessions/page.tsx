"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Calendar, MapPin, CheckCircle, XCircle, Clock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { SkeletonCard } from "@/components/Skeleton";

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  assignedPlayers?: string[];
  attendance?: Record<string, { status: string; timestamp: string }>;
  feedback?: Record<string, { comment: string; timestamp: string }>;
}

export default function PlayerSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        mine.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSessions(mine as TrainingSession[]);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleRSVP = async (sessionId: string, status: "attending" | "declined") => {
    if (!user) return;
    await update(ref(db, `training_sessions/${sessionId}/attendance/${user.uid}`), {
      status,
      timestamp: new Date().toISOString(),
    });
  };

  const upcoming = sessions.filter((s) => new Date(s.date) >= new Date());
  const past = sessions.filter((s) => new Date(s.date) < new Date());

  const SessionCard = ({ session }: { session: TrainingSession }) => {
    const myAttendance = session.attendance?.[user!.uid]?.status;
    const myFeedback = session.feedback?.[user!.uid];
    const isPast = new Date(session.date) < new Date();
    const isExpanded = expandedId === session.id;

    return (
      <div className={`bg-surface border rounded-xl overflow-hidden transition-all duration-300 ${isPast ? "border-border opacity-75" : "border-border hover:border-primary/40"}`}>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl flex-shrink-0 ${isPast ? "bg-gray-500/10" : "bg-primary/10"}`}>
                <Calendar className={`h-6 w-6 ${isPast ? "text-gray-500" : "text-primary"}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{session.title}</h3>
                <div className="flex items-center space-x-1 mt-1 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(session.date).toLocaleString("sq-AL", { dateStyle: "full", timeStyle: "short" })}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1 text-xs text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{session.location}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!isPast && (
                <>
                  {myAttendance === "attending" ? (
                    <span className="flex items-center text-xs font-semibold px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmed
                    </span>
                  ) : myAttendance === "declined" ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-xs font-semibold px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Declined
                      </span>
                      <button
                        onClick={() => handleRSVP(session.id, "attending")}
                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary hover:text-black transition-colors font-semibold"
                      >
                        Change to Accept
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRSVP(session.id, "attending")}
                        className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary border border-primary/50 rounded-full hover:bg-primary hover:text-black transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRSVP(session.id, "declined")}
                        className="text-xs font-semibold px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </>
              )}
              {isPast && myAttendance && (
                <span className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  myAttendance === "attending"
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>
                  {myAttendance === "attending" ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                  {myAttendance === "attending" ? "Attended" : "Missed"}
                </span>
              )}
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border bg-background/50 p-5 space-y-4">
            {session.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Session Notes</p>
                <p className="text-sm text-gray-300">{session.description}</p>
              </div>
            )}

            {myFeedback && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Coach Feedback</p>
                </div>
                <p className="text-sm text-gray-200 italic">"{myFeedback.comment}"</p>
                <p className="text-[10px] text-gray-500 mt-2">
                  {new Date(myFeedback.timestamp).toLocaleString()}
                </p>
              </div>
            )}
            {!myFeedback && isPast && (
              <p className="text-xs text-gray-500 italic">No coach feedback for this session yet.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">My Sessions</h2>
        <p className="text-gray-400 mt-2">All training sessions you've been assigned to.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-xl">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No sessions assigned to you yet.</p>
          <p className="text-gray-500 text-sm mt-1">Your coach will assign you to upcoming training sessions.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block"></span>
                Upcoming ({upcoming.length})
              </h3>
              <div className="space-y-4">
                {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Past Sessions ({past.length})</h3>
              <div className="space-y-4">
                {past.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
