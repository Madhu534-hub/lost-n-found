import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load available users and default to Student Alex
  useEffect(() => {
    const initAuth = async () => {
      try {
        const users = await api.getUsers();
        setAllUsers(users);
        
        const savedUserId = localStorage.getItem('traceit_user_id');
        const matchedUser = users.find(u => u.id === savedUserId);
        
        if (matchedUser) {
          setCurrentUser(matchedUser);
        } else if (users.length > 0) {
          // Default to Alex Chen (demo student with active lost report)
          const defaultUser = users.find(u => u.id === 'user-alex') || users[0];
          setCurrentUser(defaultUser);
          localStorage.setItem('traceit_user_id', defaultUser.id);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const switchUser = (userId) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('traceit_user_id', target.id);
    }
  };

  const login = async (email) => {
    const res = await api.login({ email });
    if (res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('traceit_user_id', res.user.id);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = async (name, email, role) => {
    const res = await api.register({ name, email, role });
    if (res.user) {
      setAllUsers(prev => [...prev, res.user]);
      setCurrentUser(res.user);
      localStorage.setItem('traceit_user_id', res.user.id);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        loading,
        switchUser,
        login,
        register,
        isAdmin: currentUser?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
