import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Profile {
  display_name: string;
  email:        string;
  theme:        string;
  language:     string;
  notif_copy:   boolean;
  notif_new:    boolean;
}

const defaults: Profile = {
  display_name: 'Admin',
  email:        '',
  theme:        'dark',
  language:     'en',
  notif_copy:   true,
  notif_new:    false,
};

interface ProfileContextType {
  profile:       Profile;
  loading:       boolean;
  saving:        boolean;
  error:         string;
  updateProfile: (p: Partial<Profile>) => void;
  saveProfile:   () => Promise<boolean>;
  refetch:       () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile:       defaults,
  loading:       false,
  saving:        false,
  error:         '',
  updateProfile: () => {},
  saveProfile:   async () => false,
  refetch:       () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaults);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const token = localStorage.getItem('token');

  const fetchProfile = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setProfile({
          display_name: data.display_name || 'Admin',
          email:        data.email        || '',
          theme:        data.theme        || 'dark',
          language:     data.language     || 'en',
          notif_copy:   Boolean(data.notif_copy),
          notif_new:    Boolean(data.notif_new),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, [token]);

  const updateProfile = (partial: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...partial }));
  };

  const saveProfile = async (): Promise<boolean> => {
    if (!token) return false;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(profile),
      });
      setSaving(false);
      if (res.ok) return true;
      const d = await res.json();
      setError(d.message || 'Failed to save.');
      return false;
    } catch {
      setSaving(false);
      setError('Network error. Try again.');
      return false;
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, saving, error, updateProfile, saveProfile, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

