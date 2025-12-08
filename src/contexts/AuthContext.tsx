import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
      console.log("Fetching user profile for:", uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("User profile found:", data);
        setUserProfile(data as UserProfile);
      } else {
        console.log("No user profile found in Firestore for:", uid);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid || "No user");
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
    console.log("Starting signup process...");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase auth user created:", userCredential.user.uid);
      
      const newUserProfile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        fullName,
        role,
        createdAt: new Date()
      };
      
      console.log("Saving user profile to Firestore...");
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newUserProfile,
        createdAt: newUserProfile.createdAt.toISOString()
      });
      console.log("User profile saved to Firestore successfully");
      setUserProfile(newUserProfile);
    } catch (error) {
      console.error("SignUp error in AuthContext:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("Starting sign in process...");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful");
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("Logging out...");
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