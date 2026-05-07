"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Calendar, Plus, Trash2, Edit } from "lucide-react";

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export default function TrainingSessionsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", date: "", location: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const sessionsRef = ref(db, 'training_sessions');
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setSessions(parsed);
      } else {
        setSessions([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await update(ref(db, `training_sessions/${editingId}`), formData);
    } else {
      await push(ref(db, 'training_sessions'), formData);
    }
    setIsModalOpen(false);
    setFormData({ title: "", date: "", location: "", description: "" });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      await remove(ref(db, `training_sessions/${id}`));
    }
  };

  const openEdit = (session: TrainingSession) => {
    setFormData({ title: session.title, date: session.date, location: session.location, description: session.description });
    setEditingId(session.id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Training Sessions</h2>
          <p className="text-gray-400 mt-2">Manage all academy training schedules.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ title: "", date: "", location: "", description: "" });
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
          <div key={session.id} className="bg-surface border border-border rounded-xl p-6 shadow-sm">
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
            <div className="mb-6">
              <p className="text-sm text-gray-300"><span className="font-semibold text-gray-500">Location:</span> {session.location}</p>
              <p className="text-sm text-gray-300 mt-1 line-clamp-2">{session.description}</p>
            </div>
            <div className="flex justify-end space-x-2 border-t border-border pt-4">
              <button onClick={() => openEdit(session)} className="p-2 text-gray-400 hover:text-white transition-colors">
                <Edit className="h-5 w-5" />
              </button>
              <button onClick={() => handleDelete(session.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
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
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent rows-3"></textarea>
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
    </div>
  );
}
