import { supabase } from '../lib/supabase';
import { profileService } from './profileService';

export const authService = {
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    return { data, error };
  },

  async signIn(email, password) {
    profileService.clearCache(); // Force fresh fetch on new login
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    profileService.clearCache(); // Clean up security
    return await supabase.auth.signOut();
  }
};