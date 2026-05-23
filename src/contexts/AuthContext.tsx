import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";


interface AuthContextType {
  user: User | null;
  role: "admin" | "client" | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "client" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        let userDoc = null;
        try {
          userDoc = await getDoc(doc(db, "users", currentUser.uid));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
        if (userDoc && userDoc.exists()) {
          setRole(userDoc.data().role as "admin" | "client");
        } else if (!currentUser.isAnonymous) {
          // If they signed in (e.g., via Google, external, or manual register) but no user doc exists in Firestore,
          // dynamically provision their site admin document as only system administrators maintain registered sessions.
          try {
            await setDoc(doc(db, "users", currentUser.uid), {
              fullName: currentUser.displayName || currentUser.email?.split("@")[0] || "Administrator",
              email: currentUser.email || "",
              role: "admin",
              createdAt: serverTimestamp(),
            });
            setRole("admin");
          } catch (createErr) {
            console.error("Failed to auto-provision user record:", createErr);
            setRole("client");
          }
        } else {
          // Fallback to client role for anonymous sessions
          setRole("client");
        }
      } else {
        setRole(null);
        // Automatically invoke seamless anonymous guest authentication in background
        try {
          const { signInAnonymously } = await import("firebase/auth");
          await signInAnonymously(auth);
        } catch (signinErr) {
          console.warn("Silent guest session authentication bypassed:", signinErr);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
