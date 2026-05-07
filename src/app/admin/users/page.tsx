"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Users, Trash2, Edit, Shield, Activity, User } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "coach" | "player";
  createdAt?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "coach" | "player">("player");

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setUsers(parsed);
      } else {
        setUsers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await update(ref(db, `users/${editingUser.id}`), { role: newRole });
      setIsModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this user from the database? (Note: This does not remove their Firebase Auth account)")) {
      await remove(ref(db, `users/${id}`));
    }
  };

  const openEdit = (user: UserProfile) => {
    setEditingUser(user);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const RoleIcon = ({ role }: { role: string }) => {
    if (role === "admin") return <Shield className="h-4 w-4 text-purple-400 mr-2" />;
    if (role === "coach") return <Activity className="h-4 w-4 text-orange-400 mr-2" />;
    return <User className="h-4 w-4 text-blue-400 mr-2" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Manage Users</h2>
          <p className="text-gray-400 mt-2">View and edit roles for all registered academy members.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-background text-gray-400 text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center capitalize">
                      <RoleIcon role={user.role} />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-3">
                    <button onClick={() => openEdit(user)} className="text-gray-400 hover:text-white transition-colors">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Edit User Role</h3>
            <p className="text-sm text-gray-400 mb-6">{editingUser.email}</p>
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assign Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-black bg-primary rounded-lg hover:bg-primary-hover transition-colors">
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
