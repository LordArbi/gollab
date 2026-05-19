"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { CreditCard, Plus, Trash2, Edit, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

interface Payment {
  id: string;
  playerEmail: string;
  playerId?: string;
  amount: string;
  status: "pending" | "paid" | "overdue";
  date: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    playerEmail: "",
    playerId: "",
    amount: "",
    status: "pending" as "pending" | "paid" | "overdue",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const paymentsRef = ref(db, "payments");
    const unsub1 = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        parsed.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPayments(parsed as Payment[]);
      } else {
        setPayments([]);
      }
      setLoading(false);
    });

    const usersRef = ref(db, "users");
    const unsub2 = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        setPlayers(all.filter((u: any) => u.role === "player") as UserProfile[]);
      }
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const sendPaymentNotification = async (
    playerId: string,
    playerEmail: string,
    status: string,
    amount: string
  ) => {
    if (!playerId) return;
    const notifRef = push(ref(db, `notifications/${playerId}`));
    const messages: Record<string, string> = {
      paid: `Your payment of $${amount} has been marked as PAID. Thank you!`,
      overdue: `Your payment of $${amount} is OVERDUE. Please contact the academy.`,
      pending: `You have a pending payment of $${amount} due soon.`,
    };
    await update(notifRef, {
      title: `Payment Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: messages[status] || `Your payment status has been updated to ${status}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find the player UID from email
    const matchedPlayer = players.find(
      (p) => p.email.toLowerCase() === formData.playerEmail.toLowerCase()
    );

    const payload = {
      playerEmail: formData.playerEmail,
      playerId: matchedPlayer?.id || "",
      amount: formData.amount,
      status: formData.status,
      date: formData.date,
    };

    if (editingPayment) {
      await update(ref(db, `payments/${editingPayment.id}`), payload);
      // Notify if status changed
      if (editingPayment.status !== formData.status && (matchedPlayer?.id || editingPayment.playerId)) {
        await sendPaymentNotification(
          matchedPlayer?.id || editingPayment.playerId || "",
          formData.playerEmail,
          formData.status,
          formData.amount
        );
      }
    } else {
      await push(ref(db, "payments"), payload);
      // Notify on creation
      if (matchedPlayer?.id) {
        await sendPaymentNotification(matchedPlayer.id, formData.playerEmail, formData.status, formData.amount);
      }
    }

    closeModal();
  };

  const markAsPaid = async (payment: Payment) => {
    if (payment.status === "paid") return;
    await update(ref(db, `payments/${payment.id}`), { status: "paid" });
    if (payment.playerId) {
      await sendPaymentNotification(payment.playerId, payment.playerEmail, "paid", payment.amount);
    }
  };

  const markAsOverdue = async (payment: Payment) => {
    if (payment.status === "overdue") return;
    await update(ref(db, `payments/${payment.id}`), { status: "overdue" });
    if (payment.playerId) {
      await sendPaymentNotification(payment.playerId, payment.playerEmail, "overdue", payment.amount);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this payment record?")) {
      await remove(ref(db, `payments/${id}`));
    }
  };

  const openEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      playerEmail: payment.playerEmail,
      playerId: payment.playerId || "",
      amount: payment.amount,
      status: payment.status,
      date: payment.date,
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingPayment(null);
    setFormData({
      playerEmail: "",
      playerId: "",
      amount: "",
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
  };

  const statusConfig = {
    paid: { label: "Paid", icon: CheckCircle, classes: "bg-green-500/20 text-green-400 border-green-500/30" },
    pending: { label: "Pending", icon: Clock, classes: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    overdue: { label: "Overdue", icon: AlertCircle, classes: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const totalPending = payments.filter((p) => p.status !== "paid").reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Payments</h2>
          <p className="text-gray-400 mt-2">Track and manage player academy fees.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" /> New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Total Invoices</p>
              <p className="text-3xl font-bold text-white">{payments.length}</p>
            </div>
            <div className="bg-surface border border-green-500/20 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Collected</p>
              <p className="text-3xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="bg-surface border border-red-500/20 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Outstanding</p>
              <p className="text-3xl font-bold text-red-400">${totalPending.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-background text-gray-400 text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Player</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full mb-2" />)}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No payment records found. Create your first invoice.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const cfg = statusConfig[payment.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={payment.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase flex-shrink-0">
                            {payment.playerEmail?.[0] || "?"}
                          </div>
                          <span className="font-medium text-white">{payment.playerEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">${parseFloat(payment.amount || "0").toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-400">{payment.date ? new Date(payment.date).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.classes}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-2">
                          {payment.status !== "paid" && (
                            <button
                              onClick={() => markAsPaid(payment)}
                              className="text-xs px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500 hover:text-white transition-colors font-medium"
                              title="Mark as Paid"
                            >
                              ✓ Paid
                            </button>
                          )}
                          {payment.status === "pending" && (
                            <button
                              onClick={() => markAsOverdue(payment)}
                              className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium"
                              title="Mark as Overdue"
                            >
                              Overdue
                            </button>
                          )}
                          <button onClick={() => openEdit(payment)} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(payment.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-5">
              {editingPayment ? "Edit Invoice" : "Create Invoice"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Player Email</label>
                {players.length > 0 ? (
                  <select
                    required
                    value={formData.playerEmail}
                    onChange={(e) => setFormData({ ...formData, playerEmail: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select player…</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.email}>{p.email}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type="email"
                    value={formData.playerEmail}
                    onChange={(e) => setFormData({ ...formData, playerEmail: e.target.value })}
                    placeholder="player@example.com"
                    className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-black bg-primary rounded-lg hover:bg-primary-hover transition-colors">
                  {editingPayment ? "Save Changes" : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
