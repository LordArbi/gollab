"use client";

import React, { useState, useEffect } from "react";
import { Users, UserCheck, Activity, DollarSign } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { Skeleton } from "@/components/Skeleton";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [coachCount, setCoachCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingPaymentsList, setPendingPaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub1 = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        setUserCount(all.length);
        setPlayerCount(all.filter((u: any) => u.role === "player").length);
        setCoachCount(all.filter((u: any) => u.role === "coach").length);
        // Recent = last 3 by createdAt
        const sorted = [...all].sort((a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setRecentUsers(sorted.slice(0, 3));
      }
    });

    const paymentsRef = ref(db, "payments");
    const unsub2 = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        const pending = all.filter((p: any) => p.status === "pending" || p.status === "overdue");
        setPendingPayments(pending.length);
        setPendingPaymentsList(pending.slice(0, 3));
      } else {
        setPendingPayments(0);
        setPendingPaymentsList([]);
      }
      setLoading(false);
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const stats = [
    { name: "Total Users", value: loading ? "..." : userCount, icon: Users, color: "text-primary bg-primary/10" },
    { name: "Active Players", value: loading ? "..." : playerCount, icon: UserCheck, color: "text-green-400 bg-green-400/10" },
    { name: "Coaches", value: loading ? "..." : coachCount, icon: Activity, color: "text-orange-400 bg-orange-400/10" },
    { name: "Pending Payments", value: loading ? "..." : pendingPayments, icon: DollarSign, color: "text-red-400 bg-red-400/10" },
  ];

  const roleColor = (role: string) => {
    if (role === "admin") return "bg-purple-500/20 text-purple-400";
    if (role === "coach") return "bg-orange-500/20 text-orange-400";
    return "bg-blue-500/20 text-blue-400";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <p className="text-gray-400 mt-2">Welcome back, Admin. Here is what is happening at GolLab today.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) =>
          loading ? (
            <Skeleton key={stat.name} className="h-28 w-full" />
          ) : (
            <div
              key={stat.name}
              className="bg-surface rounded-xl p-6 border border-border shadow-sm hover:border-primary/50 transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Registrations */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {loading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)
            ) : recentUsers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No users registered yet.</p>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
                      {u.email?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[160px]">{u.email}</p>
                      <p className="text-xs text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Unknown date"}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${roleColor(u.role)}`}>
                    {u.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-4">Pending Payments</h3>
          <div className="space-y-3">
            {loading ? (
              [1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)
            ) : pendingPaymentsList.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-green-400 font-medium text-sm">All payments are up to date! ✓</p>
              </div>
            ) : (
              pendingPaymentsList.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[160px]">{p.playerEmail}</p>
                      <p className="text-xs text-gray-400">${p.amount} — Due {p.date ? new Date(p.date).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    p.status === "overdue" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
