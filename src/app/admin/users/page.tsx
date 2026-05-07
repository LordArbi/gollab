"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, remove, update, push } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Users, Trash2, Edit, Shield, Activity, User, Filter } from "lucide-react";
import { SkeletonRow } from "@/components/Skeleton";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "coach" | "player";
  createdAt?: string;
  ageGroup?: string;
  paymentStatus?: "paid" | "pending" | "overdue";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "coach" | "player">("player");
  const [newAgeGroup, setNewAgeGroup] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState<"paid" | "pending" | "overdue">("pending");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

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
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updates: any = {};
      updates[`users/${editingUser.id}/role`] = newRole;

      if (newRole === "player") {
        updates[`users/${editingUser.id}/ageGroup`] = newAgeGroup;
        updates[`users/${editingUser.id}/paymentStatus`] = newPaymentStatus;
        
        // Check if payment status actually changed to notify the player
        if (newPaymentStatus !== editingUser.paymentStatus) {
          const notifId = push(ref(db, `notifications/${editingUser.id}`)).key;
          updates[`notifications/${editingUser.id}/${notifId}`] = {
            title: "Payment Status Updated",
            message: `Your payment status has been updated to: ${newPaymentStatus.toUpperCase()}`,
            isRead: false,
            createdAt: new Date().toISOString()
          };
        }
      }
      
      // Now update everything
      await update(ref(db), updates);
      
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
    setNewAgeGroup(user.ageGroup || "");
    setNewPaymentStatus(user.paymentStatus || "pending");
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    if (ageGroupFilter !== "all" && user.ageGroup !== ageGroupFilter) return false;
    if (paymentStatusFilter !== "all" && user.paymentStatus !== paymentStatusFilter) return false;
    return true;
  });

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-2 text-gray-400">
          <Filter className="h-5 w-5" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <select 
            value={ageGroupFilter} 
            onChange={e => setAgeGroupFilter(e.target.value)} 
            className="bg-background border border-border rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="all">All Age Groups</option>
            <option value="U10">U10</option>
            <option value="U12">U12</option>
            <option value="U14">U14</option>
            <option value="U16">U16</option>
            <option value="U18">U18</option>
            <option value="Senior">Senior</option>
          </select>
          <select 
            value={paymentStatusFilter} 
            onChange={e => setPaymentStatusFilter(e.target.value)} 
            className="bg-background border border-border rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-background text-gray-400 text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <SkeletonRow count={4} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center capitalize">
                        <RoleIcon role={user.role} />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "player" ? (
                        <div className="flex flex-col space-y-1">
                          {user.ageGroup && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full w-max">{user.ageGroup}</span>}
                          {user.paymentStatus && (
                            <span className={`text-xs px-2 py-0.5 rounded-full w-max ${
                              user.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                              user.paymentStatus === 'overdue' ? 'bg-red-500/20 text-red-400' :
                              'bg-orange-500/20 text-orange-400'
                            }`}>
                              {user.paymentStatus}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
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
                ))
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

              {newRole === "player" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Age Group</label>
                    <select
                      value={newAgeGroup}
                      onChange={(e) => setNewAgeGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Age Group</option>
                      <option value="U10">U10</option>
                      <option value="U12">U12</option>
                      <option value="U14">U14</option>
                      <option value="U16">U16</option>
                      <option value="U18">U18</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </>
              )}

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
