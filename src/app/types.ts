export interface Tour {
  id: string;
  title: string;
  description: string;
  guide: {
    name: string;
    avatar: string;
    rating: number;
    reviewCount: number;
    id?: string;
  };
  price: number;
  duration: string;
  location: string;
  category: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  maxGroupSize: number;
  image: string;
  images: string[];
  highlights: string[];
  included: string[];
  notIncluded: string[];
  schedule: {
    time: string;
    activity: string;
  }[];
  availableDates: string[];
  tags: string[];
}

export interface Booking {
  id: string;
  userId: string;
  tourId: string;
  tourTitle: string;
  tourImage: string;
  date: string;
  participants: number;
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAvatar?: string;
  guideName: string;
  guideId?: string;
  guideAvatar?: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  hasReview?: boolean;
}

export interface Review {
  id: string;
  tourId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

export interface TourFilters {
  search: string;
  category: string;
  priceRange: [number, number];
  difficulty: string;
  location: string;
}

export interface WithdrawalRequest {
  id: string;
  guideId: string;
  guideName: string;
  amount: number;
  method: 'bank_transfer' | 'momo' | 'zalopay' | 'vnpay';
  accountInfo: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    phoneNumber?: string; // For e-wallets
  };
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  notes?: string;
  adminNotes?: string;
}