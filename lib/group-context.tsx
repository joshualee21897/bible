import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import type { Group } from './groups';
import { supabase } from './supabase';

type GroupContextValue = {
  group: Group | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const GroupContext = createContext<GroupContextValue>({
  group: null,
  loading: true,
  error: null,
  refresh: () => {},
});

export function GroupProvider({ groupId, children }: PropsWithChildren<{ groupId: string }>) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setGroup(data);
          setError(null);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  return <GroupContext.Provider value={{ group, loading, error, refresh }}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  return useContext(GroupContext);
}
