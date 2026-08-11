import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const guestUser = {
  displayName: 'Mehmon Foydalanuvchi',
  photoURL: null,
  uid: 'guest-user',
  isGuest: true
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Email and Password Registration
  function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Email and Password Login
  function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Login
  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  // Guest Login
  function loginAsGuest() {
    localStorage.setItem('turk_vocab_is_guest', 'true');
    setCurrentUser(guestUser);
  }

  // Logout
  function logout() {
    if (currentUser?.isGuest) {
      localStorage.removeItem('turk_vocab_is_guest');
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  }

  useEffect(() => {
    // If user was a guest, restore guest session instantly
    if (localStorage.getItem('turk_vocab_is_guest') === 'true') {
      setCurrentUser(guestUser);
      setLoading(false);
      return; // We skip Firebase auth check for guests to keep it fast
    }

    // If not using Firebase (keys missing), this might fail, so we wrap it
    let unsubscribe = () => {};
    try {
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!currentUser?.isGuest) {
            setCurrentUser(user);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.warn("Firebase Auth error (Check your .env keys):", error);
      setLoading(false);
    }
    
    return unsubscribe;
  }, []); // Remove dependency on currentUser?.isGuest to prevent re-running on guest logout/login in a way that messes up state

  const value = {
    currentUser,
    loginWithGoogle,
    loginAsGuest,
    registerWithEmail,
    loginWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
