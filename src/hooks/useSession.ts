import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useSession = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sessions').select('*');
    if (!error && data) setSessions(data);
    setLoading(false);
  };

  return { sessions, loading, fetchSessions };
};
