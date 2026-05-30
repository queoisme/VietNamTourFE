import { useState, useEffect } from 'react';
import { mockTours } from '../data/mock-tours';
import { Tour } from '../types';

/**
 * Hook to get all tours (mock tours + user created tours from localStorage)
 */
export function useTours() {
  const [allTours, setAllTours] = useState<Tour[]>([]);

  const loadTours = () => {
    // Get user created tours from localStorage
    const userTours = JSON.parse(localStorage.getItem('userTours') || '[]') as Tour[];
    
    console.log('🔄 useTours: Loading tours...', {
      mockToursCount: mockTours.length,
      userToursCount: userTours.length,
      userTours: userTours,
    });
    
    // Combine mock tours with user created tours
    const combined = [...mockTours, ...userTours];
    
    console.log('✅ useTours: Total tours:', combined.length);
    
    setAllTours(combined);
  };

  useEffect(() => {
    loadTours();

    // Listen for storage changes (when tours are added/updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userTours') {
        loadTours();
      }
    };

    // Listen for custom event (for same-window updates)
    const handleToursUpdate = () => {
      loadTours();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('toursUpdated', handleToursUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('toursUpdated', handleToursUpdate);
    };
  }, []);

  const refreshTours = () => {
    loadTours();
  };

  return { tours: allTours, refreshTours };
}