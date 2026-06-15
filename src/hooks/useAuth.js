import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const startAuthListener = useAuthStore((state) => state.startAuthListener);

  useEffect(() => {
    startAuthListener();
  }, [startAuthListener]);

  return useAuthStore();
}
