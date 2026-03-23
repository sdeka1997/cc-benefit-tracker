import { useEffect, useState, useRef } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from '../firebase';
import type { CreditCard, UserData, UserSettings } from '../types/index';

const stripUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = stripUndefined(value);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

const DEFAULT_SETTINGS: UserSettings = {
  showGlobalExpiryDate: false
};

export const useCloudSync = (
  localCards: CreditCard[], 
  setLocalCards: (cards: CreditCard[]) => void
) => {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<'loading' | 'synced' | 'error' | 'idle'>('idle');
  const isInitialLoad = useRef(true);
  const processedCloudJson = useRef<string>("");

  // 1. Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setSyncStatus('idle');
        isInitialLoad.current = true;
        processedCloudJson.current = "";
      }
    });
    return unsubscribe;
  }, []);

  // 2. Sync with Cloud when User Logged In
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    
    const fetchInitialData = async () => {
      setSyncStatus('loading');
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as UserData;
          const cloudCards = cloudData.cards || [];
          const cloudSettings = cloudData.settings || DEFAULT_SETTINGS;
          
          const cloudJson = JSON.stringify({ cards: cloudCards, settings: cloudSettings });
          processedCloudJson.current = cloudJson;
          
          setLocalCards(cloudCards);
          setSettings(cloudSettings);
        } else {
          // New user, push local data if any
          if (localCards.length > 0) {
            const initialData: UserData = {
              cards: localCards,
              settings: DEFAULT_SETTINGS,
              lastUpdated: new Date().toISOString()
            };
            await setDoc(userDocRef, stripUndefined(initialData));
          }
        }
        setSyncStatus('synced');
        isInitialLoad.current = false;
      } catch (err) {
        console.error("Initial fetch failed:", err);
        setSyncStatus('error');
      }
    };

    fetchInitialData();

    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (isInitialLoad.current) return;
      if (doc.exists()) {
        const cloudData = doc.data() as UserData;
        const cloudCards = cloudData.cards || [];
        const cloudSettings = cloudData.settings || DEFAULT_SETTINGS;
        const cloudJson = JSON.stringify({ cards: cloudCards, settings: cloudSettings });
        
        if (cloudJson !== processedCloudJson.current) {
          processedCloudJson.current = cloudJson;
          setLocalCards(cloudCards);
          setSettings(cloudSettings);
        }
      }
    });

    return unsubscribe;
  }, [user]);

  // 3. Push to Cloud when local changes
  useEffect(() => {
    if (!user || isInitialLoad.current) return;

    const currentStateJson = JSON.stringify({ cards: localCards, settings });
    if (currentStateJson === processedCloudJson.current) {
      setSyncStatus('synced');
      return;
    }

    const pushData = async () => {
      setSyncStatus('loading');
      try {
        const dataToPush: UserData = {
          cards: localCards,
          settings,
          lastUpdated: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), stripUndefined(dataToPush), { merge: true });
        processedCloudJson.current = currentStateJson;
        setSyncStatus('synced');
      } catch (err) {
        console.error("Cloud push failed:", err);
        setSyncStatus('error');
      }
    };

    const timeout = setTimeout(pushData, 1000);
    return () => clearTimeout(timeout);
  }, [localCards, settings, user]);

  const loginWithGoogle = async () => {
    setSyncStatus('loading');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
      setSyncStatus('error');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return { user, settings, syncStatus, loginWithGoogle, logout, updateSettings };
};
