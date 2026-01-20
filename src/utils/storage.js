// handles saving + loading the user's profile info (nickname, color, avatar)
// using AsyncStorage because this is simple local data that should persist between app launches
// kept in utils so any screen (SignIn, ProfileSetup, Game, etc.) can access the same prefs easily

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'userPrefs';

export async function saveUserPrefs(name, color, avatarUri) {
  try {
    // save everything as one JSON object so it's easy to load later
    const payload = JSON.stringify({ name, color, avatarUri });
    await AsyncStorage.setItem(KEY, payload);
  } catch (e) {
    console.warn('Failed to save prefs', e);
  }
}

export async function loadUserPrefs() {
  try {
    // fetch the saved profile… if nothing saved yet, return null
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to fetch prefs', e);
    return null;
  }
}

export async function removeUserPrefs() {
  try {
    // clear everything (used if we ever add logout)
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn('Failed to clear prefs', e);
  }
}
