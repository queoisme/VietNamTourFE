import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Review } from '../types';

export interface Booking {
  id: string;
  userId: string; // User ID của người đặt tour
  tourId: string;
  tourTitle: string;
  tourImage: string;
  guideName: string;
  guideId?: string;
  guideAvatar?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAvatar?: string;
  specialRequests?: string;
  date: string;
  participants: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  hasReview?: boolean;
}

interface CustomerContextType {
  bookings: Booking[];
  wishlist: string[]; // Array of tour IDs
  reviews: Review[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'hasReview'>) => Booking | null;
  cancelBooking: (bookingId: string) => void;
  toggleWishlist: (tourId: string) => boolean;
  isInWishlist: (tourId: string) => boolean;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  updateReview: (reviewId: string, data: Partial<Review>) => void;
  deleteReview: (reviewId: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Load data from localStorage when user changes
  useEffect(() => {
    if (user) {
      // Load user-specific bookings from global bookings
      const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const tours = JSON.parse(localStorage.getItem('tours') || '[]');
      const userTours = JSON.parse(localStorage.getItem('userTours') || '[]');
      
      // Combine all tours from both sources
      const allTours = [...tours, ...userTours];
      
      // Migration: Update bookings with missing tourTitle
      const updatedAllBookings = allBookings.map((booking: Booking) => {
        if (!booking.tourTitle || booking.tourTitle === '') {
          const tour = allTours.find((t: any) => t.id === booking.tourId);
          if (tour) {
            console.log('CustomerContext: Updating booking with tourTitle:', tour.title);
            return {
              ...booking,
              tourTitle: tour.title,
              tourImage: booking.tourImage || tour.image,
            };
          }
        }
        return booking;
      });
      
      // Save if there were changes
      const hasChanges = updatedAllBookings.some((b: Booking, index: number) => 
        b.tourTitle !== allBookings[index]?.tourTitle
      );
      
      if (hasChanges) {
        localStorage.setItem('bookings', JSON.stringify(updatedAllBookings));
        console.log('✅ CustomerContext: Updated bookings with missing tour titles');
      }
      
      const userBookings = updatedAllBookings.filter((b: any) => b.userId === user.id);
      setBookings(userBookings);
      
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      const savedReviews = localStorage.getItem(`reviews_${user.id}`);

      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      if (savedReviews) setReviews(JSON.parse(savedReviews));
    } else {
      setBookings([]);
      setWishlist([]);
      setReviews([]);
    }

    // Listen for booking updates
    const handleBookingUpdate = () => {
      if (user) {
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const userBookings = allBookings.filter((b: any) => b.userId === user.id);
        setBookings(userBookings);
      }
    };

    window.addEventListener('bookingsUpdated', handleBookingUpdate);
    return () => window.removeEventListener('bookingsUpdated', handleBookingUpdate);
  }, [user]);

  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'hasReview'>) => {
    if (!user) return null;

    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      hasReview: false,
    };

    // Save to global bookings
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    allBookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(allBookings));
    
    // Update local state
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    
    // Dispatch event
    window.dispatchEvent(new Event('bookingsUpdated'));
    
    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    if (!user) return;

    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const updatedAllBookings = allBookings.map((b: Booking) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    localStorage.setItem('bookings', JSON.stringify(updatedAllBookings));
    
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    );
    setBookings(updatedBookings);
    
    // Dispatch event
    window.dispatchEvent(new Event('bookingsUpdated'));
  };

  const toggleWishlist = (tourId: string): boolean => {
    if (!user) return false;

    const isCurrentlyInWishlist = wishlist.includes(tourId);
    const updatedWishlist = isCurrentlyInWishlist
      ? wishlist.filter((id) => id !== tourId)
      : [...wishlist, tourId];

    setWishlist(updatedWishlist);
    localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
    
    return !isCurrentlyInWishlist; // Return true if added, false if removed
  };

  const isInWishlist = (tourId: string): boolean => {
    return wishlist.includes(tourId);
  };

  const addReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    if (!user) return;

    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${user.id}`, JSON.stringify(updatedReviews));
  };

  const updateReview = (reviewId: string, data: Partial<Review>) => {
    if (!user) return;

    const updatedReviews = reviews.map((r) =>
      r.id === reviewId ? { ...r, ...data } : r
    );
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${user.id}`, JSON.stringify(updatedReviews));
  };

  const deleteReview = (reviewId: string) => {
    if (!user) return;

    const updatedReviews = reviews.filter((r) => r.id !== reviewId);
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${user.id}`, JSON.stringify(updatedReviews));
  };

  return (
    <CustomerContext.Provider
      value={{
        bookings,
        wishlist,
        reviews,
        addBooking,
        cancelBooking,
        toggleWishlist,
        isInWishlist,
        addReview,
        updateReview,
        deleteReview,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}