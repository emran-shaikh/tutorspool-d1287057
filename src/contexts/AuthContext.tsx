import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';

// Environment check for conditional logging
const isDev = import.meta.env.DEV;

export type UserRole = 'student' | 'tutor' | 'admin';

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Ensure uid is always set from the document ID
        setUserProfile({ ...data, uid } as UserProfile);
      } else {
        if (isDev) console.warn("No user profile found for uid:", uid);
        setUserProfile(null);
      }
    } catch (error) {
      if (isDev) console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Use setTimeout to avoid potential deadlocks
        setTimeout(() => {
          fetchUserProfile(firebaseUser.uid).finally(() => {
            setLoading(false);
          });
        }, 0);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      const newUserProfile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        fullName,
        role,
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newUserProfile,
        createdAt: newUserProfile.createdAt.toISOString()
      });
      setUserProfile(newUserProfile);

      // Fire-and-forget welcome email
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'welcome',
            to: email,
            name: fullName,
          },
        });
      } catch (err) {
        if (isDev) console.error('Failed to trigger welcome email:', err);
      }
    } catch (error) {
      if (isDev) console.error("SignUp error:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!result.user.emailVerified) {
        await signOut(auth);
        throw { code: 'auth/email-not-verified', message: 'email-not-verified' };
      }
    } catch (error) {
      if (isDev) console.error("Sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};