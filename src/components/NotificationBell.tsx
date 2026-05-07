"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const notifRef = ref(db, `notifications/${user.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(parsed);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    if (!user) return;
    await update(ref(db, `notifications/${user.uid}/${id}`), { isRead: true });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const updates: any = {};
    notifications.forEach(n => {
      if (!n.isRead) {
        updates[`notifications/${user.uid}/${n.id}/isRead`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-surface-hover"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-border last:border-0 hover:bg-surface-hover transition-colors cursor-pointer ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-semibold ${!notif.isRead ? "text-white" : "text-gray-300"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5 ml-2"></span>}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
