"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Calendar, Plus, Trash2, Edit, MessageSquare, CheckCircle, XCircle } from "lucide-react";

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  assignedPlayers?: string[];
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  ageGroup?: string;
}

export default function TrainingSessionsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [formData, setFormData] = useState({ title: "", date: "", location: "", description: "", assignedPlayers: [] as string[] });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Feedback & Attendance state
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [feedbackData, setFeedbackData] = useState<any>({});
  const [newFeedback, setNewFeedback] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Fetch sessions
    const sessionsRef = ref(db, 'training_sessions');
    const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          assignedPlayers: data[key].assignedPlayers || []
        }));
        parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSessions(parsed);
      } else {
        setSessions([]);
      }
    });

    // Fetch players
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setPlayers(parsed.filter(p => p.role === "player"));
      }
    });

    return () => {
      unsubscribeSessions();
      unsubscribeUsers();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    
    let sessionId = editingId;
    if (editingId) {
      updates[`training_sessions/${editingId}`] = formData;
    } else {
      sessionId = push(ref(db, 'training_sessions')).key;
      updates[`training_sessions/${sessionId}`] = formData;
      
      formData.assignedPlayers.forEach(playerId => {
        const notifId = push(ref(db, `notifications/${playerId}`)).key;
        updates[`notifications/${playerId}/${notifId}`] = {
          title: "New Training Session",
          message: `You have been assigned to ${formData.title} on ${new Date(formData.date).toLocaleString()}`,
          isRead: false,
          createdAt: new Date().toISOString(),
          sessionId: sessionId
        };
      });
    }
    
    await update(ref(db), updates);
    setIsModalOpen(false);
    setFormData({ title: "", date: "", location: "", description: "", assignedPlayers: [] });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      await remove(ref(db, `training_sessions/${id}`));
    }
  };

  const openEdit = (session: TrainingSession) => {
    setFormData({ 
      title: session.title, 
      date: session.date, 
      location: session.location, 
      description: session.description,
      assignedPlayers: session.assignedPlayers || []
    });
    setEditingId(session.id);
    setIsModalOpen(true);
  };

  const openFeedback = (session: TrainingSession) => {
    setSelectedSession(session);
    onValue(ref(db, `training_sessions/${session.id}/attendance`), (snap) => setAttendanceData(snap.val() || {}));
    onValue(ref(db, `training_sessions/${session.id}/feedback`), (snap) => {
      const fb = snap.val() || {};
      setFeedbackData(fb);
      const initialFb: any = {};
      Object.keys(fb).forEach(pid => initialFb[pid] = fb[pid].comment || "");
      setNewFeedback(initialFb);
    });
    setIsFeedbackOpen(true);
  };

  const saveFeedback = async (playerId: string) => {
    if (selectedSession && newFeedback[playerId]) {
      await update(ref(db, `training_sessions/${selectedSession.id}/feedback/${playerId}`), {
        comment: newFeedback[playerId],
        timestamp: new Date().toISOString()
      });
      alert("Feedback saved!");
    }
  };

  const handlePlayerToggle = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedPlayers: prev.assignedPlayers.includes(playerId)
        ? prev.assignedPlayers.filter(id => id !== playerId)
        : [...prev.assignedPlayers, playerId]
    }));
  };

  const getPlayerEmail = (id: string) => {
    const p = players.find(player => player.id === id);
    return p ? p.email : "Unknown Player";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Training Sessions</h2>
          <p className="text-gray-400 mt-2">Manage academy training schedules and provide feedback.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ title: "", date: "", location: "", description: "", assignedPlayers: [] });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{session.title}</h3>
                  <p className="text-sm text-gray-400">{new Date(session.date).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mb-6 flex-1">
              <p className="text-sm text-gray-300"><span className="font-semibold text-gray-500">Location:</span> {session.location}</p>
              <p className="text-sm text-gray-300 mt-1 line-clamp-2">{session.description}</p>
              <p className="text-sm text-gray-400 mt-2">
                <span className="font-semibold text-gray-500">Players:</span> {session.assignedPlayers?.length || 0} assigned
              </p>
            </div>
            <div className="flex justify-end space-x-2 border-t border-border pt-4">
              <button onClick={() => openFeedback(session)} className="p-2 text-gray-400 hover:text-primary transition-colors" title="Attendance & Feedback">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button onClick={() => openEdit(session)} className="p-2 text-gray-400 hover:text-white transition-colors" title="Edit Session">
                <Edit className="h-5 w-5" />
              </button>
              <button onClick={() => handleDelete(session.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete Session">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="col-span-full p-8 text-center bg-surface border border-border border-dashed rounded-xl">
            <p className="text-gray-400">No training sessions scheduled.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl my-8">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? "Edit Session" : "New Training Session"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Date & Time</label>
                <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Location</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assign Players</label>
                <div className="max-h-40 overflow-y-auto bg-background border border-border rounded-lg p-2 space-y-1">
                  {players.map(player => (
                    <label key={player.id} className="flex items-center space-x-3 p-2 hover:bg-surface-hover rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.assignedPlayers.includes(player.id)}
                        onChange={() => handlePlayerToggle(player.id)}
                        className="rounded border-border text-primary focus:ring-primary bg-surface"
                      />
                      <span className="text-sm text-gray-300">{player.email} <span className="text-xs text-gray-500 ml-2">{player.ageGroup || "N/A"}</span></span>
                    </label>
                  ))}
                  {players.length === 0 && <p className="text-xs text-gray-500 p-2">No players available.</p>}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-black bg-primary rounded-lg hover:bg-primary-hover transition-colors">
                  {editingId ? "Save Changes" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFeedbackOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl shadow-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Attendance & Feedback</h3>
                <p className="text-sm text-gray-400">{selectedSession.title} - {new Date(selectedSession.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setIsFeedbackOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedSession.assignedPlayers && selectedSession.assignedPlayers.length > 0 ? (
                selectedSession.assignedPlayers.map(playerId => {
                  const status = attendanceData[playerId]?.status;
                  return (
                    <div key={playerId} className="bg-background border border-border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-white">{getPlayerEmail(playerId)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center ${
                          status === 'attending' ? 'bg-green-500/20 text-green-400' :
                          status === 'declined' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {status === 'attending' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {status === 'declined' && <XCircle className="w-3 h-3 mr-1" />}
                          {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <textarea 
                          placeholder="Leave feedback for this player..."
                          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={2}
                          value={newFeedback[playerId] || ""}
                          onChange={(e) => setNewFeedback({...newFeedback, [playerId]: e.target.value})}
                        />
                        <button 
                          onClick={() => saveFeedback(playerId)}
                          className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-black transition-colors rounded-lg text-sm font-semibold h-fit"
                        >
                          Save
                        </button>
                      </div>
                      {feedbackData[playerId] && feedbackData[playerId].timestamp && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last saved: {new Date(feedbackData[playerId].timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-4">No players assigned to this session.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
