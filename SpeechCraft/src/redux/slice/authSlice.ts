import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Your custom user profile data (from your database)
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  created_at: string;
  is_email_verified: boolean;
}

// Combined user state with both Supabase auth and your profile
interface User {
  profile: UserProfile | null;
  auth: SupabaseUser | null;
}

export interface UserState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if auth state has been loaded from Supabase
}

const initialState: UserState = {
  isAuthenticated: false,
  user: null,
  session: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Initialize auth state from Supabase session
    initializeAuth(state, action: PayloadAction<{ session: Session | null; user?: UserProfile | null }>) {
      const { session, user } = action.payload;
      state.session = session;
      state.isAuthenticated = !!session;
      if (session && user) {
        state.user = {
          auth: session.user,
          profile: user
        };
      }
      state.isInitialized = true;
      state.isLoading = false;
    },
    
    // Login with both Supabase session and profile data
    login(state, action: PayloadAction<{ session: Session; profile?: UserProfile }>) {
      const { session, profile } = action.payload;
      state.isAuthenticated = true;
      state.session = session;
      state.user = {
        auth: session.user,
        profile: profile || null
      };
      state.isLoading = false;
      state.error = null;
    },

    // Update just the profile data
    updateProfile(state, action: PayloadAction<UserProfile>) {
      if (state.user) {
        state.user.profile = action.payload;
      }
    },

    // Logout and clear all auth data
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.session = null;
      state.isLoading = false;
      state.error = null;
    },

    // Set loading state
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    // Set error state
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Clear error
    clearError(state) {
      state.error = null;
    },

    // Update session (for token refresh)
    updateSession(state, action: PayloadAction<Session>) {
      state.session = action.payload;
      if (state.user) {
        state.user.auth = action.payload.user;
      }
    },
  },
});

export const { 
  initializeAuth,
  login, 
  updateProfile,
  logout, 
  setLoading, 
  setError, 
  clearError,
  updateSession
} = authSlice.actions;

export default authSlice.reducer;