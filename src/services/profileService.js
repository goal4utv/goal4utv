import { supabase } from '../lib/supabase';

const CACHE_KEY = 'goal4u_profile_cache';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 Hour

export const profileService = {
  // 1. INTELLIGENT GET: Checks LocalStorage before calling database
  async getProfile(userId) {
    // Check local cache first
    const cachedString = localStorage.getItem(CACHE_KEY);
    if (cachedString) {
      const cachedData = JSON.parse(cachedString);
      // If cache is less than 1 hour old, use it!
      if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
        console.log("Loaded profile from Local Cache");
        return { data: cachedData.profile, error: null };
      }
    }

    // If no cache or expired, fetch from Supabase
    console.log("Fetching profile from Supabase Database...");
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      // Save fresh data to local cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        profile: data,
        timestamp: Date.now()
      }));
    }

    return { data, error };
  },

  // 2. UPDATE TEAMS: Saves the array of JSON teams to the database
  async updateFavoriteTeams(userId, teamsArray) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        favorite_teams: teamsArray, 
        updated_at: new Date() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (data) this._updateCache(data); // Sync cache instantly
    return { data, error };
  },

  // 3. UPDATE AVATAR: Updates DB and refreshes local cache
  async updateAvatar(userId, avatarPath) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarPath, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single();

    if (data) this._updateCache(data); // Sync cache instantly
    return { data, error };
  },

  // Helper to keep cache in sync silently
  _updateCache(newProfileData) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      profile: newProfileData,
      timestamp: Date.now()
    }));
  },

  // Clear cache on logout
  clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }
};