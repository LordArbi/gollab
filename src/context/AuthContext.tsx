"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, getIdToken } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { ref, get, child } from "firebase/database";
import Cookies from "js-cookie";

type Role = "admin" | "coach" | "player" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get JWT token and store in cookie for middleware
        const token = await getIdToken(currentUser);
        Cookies.set("authToken", token, { expires: 7 });

        // Fetch user role from Realtime Database
        try {
          const dbRef = ref(db);
          const snapshot = await get(child(dbRef, `users/${currentUser.uid}`));
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const userRole = userData.role as Role;
            setRole(userRole);
            Cookies.set("userRole", userRole || "player", { expires: 7 });
          } else {
            // Default role or handle missing user doc
            setRole("player");
            Cookies.set("userRole", "player", { expires: 7 });
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
          Cookies.remove("userRole");
        }
      } else {
        setUser(null);
        setRole(null);
        Cookies.remove("authToken");
        Cookies.remove("userRole");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
