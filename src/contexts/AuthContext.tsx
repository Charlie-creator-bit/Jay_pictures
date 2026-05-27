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
          console.warn("Error fetching users document in AuthContext:", error);
        }
        const ADMIN_EMAILS = [
          "charlesadu3112@gmail.com",
          "admin@jaypictures.com"
        ];
        
        const userEmail = currentUser.email?.toLowerCase();
        const isAdminEmail = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;

        if (isAdminEmail) {
          setRole("admin");
          if (!currentUser.isAnonymous) {
            try {
              await setDoc(doc(db, "users", currentUser.uid), {
                fullName: currentUser.displayName || "Owner / Admin",
                email: currentUser.email || "",
                role: "admin",
                createdAt: serverTimestamp(),
              }, { merge: true });
            } catch (err) {
              console.warn("Failed syncing admin role in Firestore:", err);
            }
          }
        } else {
          setRole("client");
          // If Firestore says admin but their email is not an authorized Admin email, demote them!
          if (userDoc && userDoc.exists() && userDoc.data().role === "admin") {
            try {
              await setDoc(doc(db, "users", currentUser.uid), { role: "client" }, { merge: true });
            } catch (err) {
              console.warn("Demoting unauthorized admin in database:", err);
            }
          } else if (!currentUser.isAnonymous && (!userDoc || !userDoc.exists())) {
            // Provision as a client
            try {
              await setDoc(doc(db, "users", currentUser.uid), {
                fullName: currentUser.displayName || currentUser.email?.split("@")[0] || "Client Patron",
                email: currentUser.email || "",
                role: "client",
                createdAt: serverTimestamp(),
              });
            } catch (createErr) {
              console.error("Failed to auto-provision client user record:", createErr);
            }
          }
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
