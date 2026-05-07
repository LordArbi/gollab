"use client";

import React, { useState, useEffect } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { CreditCard, Plus, Trash2, Edit, CheckCircle } from "lucide-react";

interface Payment {
  id: string;
  playerEmail: string;
  amount: string;
  status: "pending" | "paid";
  date: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ playerEmail: "", amount: "", status: "pending", date: "" });

  useEffect(() => {
    const paymentsRef = ref(db, 'payments');
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by date descending
        parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPayments(parsed as Payment[]);
      } else {
        setPayments([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await update(ref(db, `payments/${editingId}`), formData);
    } else {
      await push(ref(db, 'payments'), formData);
    }
    setIsModalOpen(false);
    setFormData({ playerEmail: "", amount: "", status: "pending", date: "" });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this payment record?")) {
      await remove(ref(db, `payments/${id}`));
    }
  };

  const openEdit = (payment: Payment) => {
    setFormData({ 
      playerEmail: payment.playerEmail, 
      amount: payment.amount, 
      status: payment.status, 
      date: payment.date 
    });
    setEditingId(payment.id);
    setIsModalOpen(true);
  };

  const markAsPaid = async (id: string) => {
    await update(ref(db, `payments/${id}`), { status: "paid" });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Payments</h2>
          <p className="text-gray-400 mt-2">Track and manage player academy fees.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ playerEmail: "", amount: "", status: "pending", date: new Date().toISOString().split('T')[0] });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" /> New Invoice
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-background text-gray-400 text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Player Email</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{payment.playerEmail}</td>
                  <td className="px-6 py-4">${payment.amount}</td>
                  <td className="px-6 py-4">{new Date(payment.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      payment.status === "paid" 
                        ? "bg-primary/20 text-primary border border-primary/30" 
                        : "bg-red-500/20 text-red-500 border border-red-500/30"
                    }`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end items-center space-x-3">
                    {payment.status === "pending" && (
                      <button onClick={() => markAsPaid(payment.id)} className="text-primary hover:text-primary-hover transition-colors" title="Mark as Paid">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    <button onClick={() => openEdit(payment)} className="text-gray-400 hover:text-white transition-colors" title="Edit">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(payment.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? "Edit Invoice" : "Create Invoice"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Player Email</label>
                <input required type="email" value={formData.playerEmail} onChange={e => setFormData({...formData, playerEmail: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Amount ($)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Due Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-black bg-primary rounded-lg hover:bg-primary-hover transition-colors">
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
