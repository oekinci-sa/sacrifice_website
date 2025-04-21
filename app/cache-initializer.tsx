"use client";

import { useEffect } from 'react';

export default function CacheInitializer() {
  useEffect(() => {
    // Client-side'da API'yi çağırarak sunucu önbelleğini başlat
    fetch('/api/_init')
      .then(res => res.json())
      .then(data => console.log('Server cache status:', data))
      .catch(err => console.error('Failed to initialize server cache:', err))
  }, []);

  // This component doesn't render anything
  return null;
} 