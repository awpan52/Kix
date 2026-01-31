import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt?: string;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Create profile from auth user if not in Firestore
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            });
          }
        } catch {
          // If Firestore fails, use auth user data
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setError(null);
    setLoading(true);

    try {
      // Create user in Firebase Auth
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name in Auth
      await updateProfile(newUser, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: newUser.uid,
        email: newUser.email,
        displayName,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfile);
      setUserProfile(userProfile);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);

    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearError = () => setError(null);

  // Check if current user is an admin
  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        isAdmin,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to get user-friendly error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const errorCode = (error as { code?: string }).code;

    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
  return 'An unexpected error occurred.';
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
