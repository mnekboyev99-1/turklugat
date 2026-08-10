import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Login yo'q versiyasi — to'g'ridan-to'g'ri kirish
const defaultUser = {
  displayName: 'Foydalanuvchi',
  photoURL: null,
  uid: 'local-user',
  isGuest: true
};

export function AuthProvider({ children }) {
  const [currentUser] = useState(defaultUser);

  function logout() {
    // Hozircha logout ishlamaydi (login yo'q)
  }

  const value = {
    currentUser,
    loginWithGoogle: null,
    loginAsGuest: null,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
