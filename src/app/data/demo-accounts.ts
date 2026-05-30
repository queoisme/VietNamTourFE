/**
 * Demo accounts for testing
 * 
 * Guide Account:
 * Email: guide@demo.com
 * Password: 123456
 * 
 * Verified Guide Account (with tours):
 * Email: nguyen.minh.tuan@gmail.com
 * Password: 123456
 * 
 * Customer Account:
 * Email: customer@demo.com
 * Password: 123456
 * 
 * Admin Account:
 * Email: admin@demo.com
 * Password: admin123
 */

export const DEMO_ACCOUNTS = {
  guide: {
    email: 'guide@demo.com',
    password: '123456',
    name: 'Nguyễn Văn Hướng',
    role: 'guide' as const,
  },
  verifiedGuide: {
    email: 'nguyen.minh.tuan@gmail.com',
    password: '123456',
    name: 'Nguyễn Minh Tuấn',
    role: 'guide' as const,
  },
  customer: {
    email: 'customer@demo.com',
    password: '123456',
    name: 'Trần Thị Khách',
    role: 'customer' as const,
  },
  admin: {
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin Hệ Thống',
    role: 'admin' as const,
  },
};

// Initialize demo accounts in localStorage if not exists
export function initializeDemoAccounts() {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Check if demo accounts already exist
  const guideExists = users.some((u: any) => u.email === DEMO_ACCOUNTS.guide.email);
  const verifiedGuideExists = users.some((u: any) => u.email === DEMO_ACCOUNTS.verifiedGuide.email);
  const customerExists = users.some((u: any) => u.email === DEMO_ACCOUNTS.customer.email);
  const adminExists = users.some((u: any) => u.email === DEMO_ACCOUNTS.admin.email);
  
  if (!guideExists) {
    users.push({
      id: 'demo-guide-1',
      ...DEMO_ACCOUNTS.guide,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guide@demo.com',
      bio: 'Hướng dẫn viên chuyên nghiệp với 5 năm kinh nghiệm',
      phone: '0901234567',
      languages: ['Tiếng Việt', 'English'],
      experience: 5,
      certifications: ['Chứng chỉ HDV Quốc gia'],
      status: 'active',
      createdAt: '2025-01-01T00:00:00.000Z',
      isVerified: false, // Guide chưa verify - cần đăng ký
    });
  }
  
  if (!verifiedGuideExists) {
    users.push({
      id: 'guide-1',
      ...DEMO_ACCOUNTS.verifiedGuide,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      bio: 'Hướng dẫn viên du lịch chuyên nghiệp với hơn 8 năm kinh nghiệm. Chuyên về các tour thiên nhiên, văn hóa và phiêu lưu tại Việt Nam.',
      phone: '0912345678',
      languages: ['Tiếng Việt', 'English', '中文'],
      experience: 8,
      certifications: ['Chứng chỉ HDV Quốc gia', 'Chứng chỉ Cứu hộ khẩn cấp', 'Chứng chỉ Lái xuồng kayak'],
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      isVerified: true, // Guide đã verify - có thể tạo tour
    });
  }
  
  if (!customerExists) {
    users.push({
      id: 'demo-customer-1',
      ...DEMO_ACCOUNTS.customer,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer@demo.com',
      bio: 'Yêu thích du lịch và khám phá',
      phone: '0907654321',
      languages: ['Tiếng Việt'],
      experience: 0,
      certifications: [],
      status: 'active',
      createdAt: '2025-01-15T00:00:00.000Z',
    });
  }
  
  if (!adminExists) {
    users.push({
      id: 'demo-admin-1',
      ...DEMO_ACCOUNTS.admin,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@demo.com',
      bio: 'Quản trị viên hệ thống',
      phone: '0909999999',
      languages: ['Tiếng Việt', 'English'],
      experience: 0,
      certifications: [],
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  }
  
  localStorage.setItem('users', JSON.stringify(users));
  
  // Initialize tours for verified guide
  initializeVerifiedGuideTours();
}

// Clear all bookings for customer demo account
export function clearCustomerDemoBookings() {
  const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
  const filteredBookings = bookings.filter((booking: any) => booking.userId !== 'demo-customer-1');
  localStorage.setItem('bookings', JSON.stringify(filteredBookings));
}

// Initialize tours for verified guide
export function initializeVerifiedGuideTours() {
  const userTours = JSON.parse(localStorage.getItem('userTours') || '[]');
  
  // Check if tours already exist for this guide
  const hasGuideTours = userTours.some((t: any) => t.guide?.name === 'Nguyễn Minh Tuấn');
  
  if (!hasGuideTours) {
    // Add 3 sample tours for the verified guide
    const newTours = [
      {
        id: 'user-tour-1',
        title: 'Trekking Sapa - Chinh Phục Fansipan',
        description: 'Hành trình chinh phục "Nóc nhà Đông Dương" - đỉnh Fansipan cao 3143m. Trải nghiệm trekking qua ruộng bậc thang, thăm bản làng dân tộc thiểu số và ngắm bình minh trên đnh núi.',
        guide: {
          name: 'Nguyễn Minh Tuấn',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
          rating: 4.9,
          reviewCount: 127,
          id: 'guide-1',
        },
        price: 2500000,
        duration: '3 ngày 2 đêm',
        location: 'Lào Cai',
        category: 'Phiêu lưu',
        difficulty: 'challenging' as const,
        maxGroupSize: 8,
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200',
        images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200'],
        highlights: [
          'Chinh phục đỉnh Fansipan 3143m',
          'Trekking qua ruộng bậc thang tuyệt đẹp',
          'Thăm bản làng dân tộc H\'Mông, Dao',
          'Ngắm bình minh trên đỉnh núi',
          'Trải nghiệm văn hóa địa phương',
        ],
        included: [
          'Xe đưa đón từ Hà Nội',
          'Homestay 2 đêm',
          'Các bữa ăn theo chương trình',
          'Hướng dẫn viên chuyên nghiệp',
          'Vé tham quan',
          'Bảo hiểm du lịch',
        ],
        notIncluded: [
          'Chi phí cá nhân',
          'Vé cáp treo Fansipan (650.000đ)',
          'Tip hướng dẫn viên',
        ],
        schedule: [
          { time: '06:00', activity: 'Xe đón tại Hà Nội' },
          { time: '12:00', activity: 'Đến Sapa, ăn trưa' },
          { time: '14:00', activity: 'Trekking qua bản Cát Cát' },
          { time: '18:00', activity: 'Nghỉ tại homestay' },
        ],
        availableDates: ['2026-04-01', '2026-04-15', '2026-05-01', '2026-05-15', '2026-06-01'],
        tags: ['Trekking', 'Núi cao', 'Phiêu lưu', 'Văn hóa'],
      },
      {
        id: 'user-tour-2',
        title: 'Hội An - Trải Nghiệm Văn Hóa & Làng Nghề',
        description: 'Khám phá phố cổ Hội An - Di sản văn hóa thế giới UNESCO. Tham quan làng gốm Thanh Hà, làng rau Trà Quế, và thưởng thức ẩm thực đặc sản Hội An.',
        guide: {
          name: 'Nguyễn Minh Tuấn',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
          rating: 4.9,
          reviewCount: 127,
          id: 'guide-1',
        },
        price: 800000,
        duration: '1 ngày',
        location: 'Quảng Nam',
        category: 'Văn hóa',
        difficulty: 'easy' as const,
        maxGroupSize: 15,
        image: 'https://images.unsplash.com/photo-1583652921512-9d5f2b9e33e3?w=1200',
        images: ['https://images.unsplash.com/photo-1583652921512-9d5f2b9e33e3?w=1200'],
        highlights: [
          'Tham quan phố cổ Hội An',
          'Làm gốm tại làng Thanh Hà',
          'Trải nghiệm trồng rau tại Trà Quế',
          'Thưởng thức ẩm thực đặc sản',
          'Thả đèn lồng trên sông Hoài',
        ],
        included: [
          'Xe đưa đón từ Đà Nẵng',
          'Bữa trưa đặc sản Hội An',
          'Vé tham quan các điểm',
          'Hướng dẫn viên tiếng Việt',
          'Bảo hiểm du lịch',
        ],
        notIncluded: [
          'Chi phí cá nhân',
          'Đồ uống',
          'Mua sắm quà lưu niệm',
        ],
        schedule: [
          { time: '08:00', activity: 'Đón tại khách sạn Đà Nẵng' },
          { time: '09:00', activity: 'Tham quan phố cổ Hội An' },
          { time: '11:00', activity: 'Làm gốm tại Thanh Hà' },
          { time: '12:30', activity: 'Ăn trưa đặc sản' },
          { time: '14:00', activity: 'Trồng rau tại Trà Quế' },
          { time: '16:00', activity: 'Thả đèn lồng' },
          { time: '17:30', activity: 'Trở về Đà Nẵng' },
        ],
        availableDates: ['2026-03-20', '2026-03-27', '2026-04-03', '2026-04-10', '2026-04-17'],
        tags: ['Văn hóa', 'Ẩm thực', 'Làng nghề', 'Phố cổ'],
      },
      {
        id: 'user-tour-3',
        title: 'Phú Quốc - Lặn Biển & Khám Phá Đảo Ngọc',
        description: 'Trải nghiệm lặn biển ngắm san hô tại Phú Quốc, tham quan vườn tiêu, làng chài, và thưởng thức hải sản tươi sống. Nghỉ dưỡng tại resort 4 sao.',
        guide: {
          name: 'Nguyễn Minh Tuấn',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
          rating: 4.9,
          reviewCount: 127,
          id: 'guide-1',
        },
        price: 3200000,
        duration: '3 ngày 2 đêm',
        location: 'Kiên Giang',
        category: 'Biển đảo',
        difficulty: 'easy' as const,
        maxGroupSize: 12,
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
        images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200'],
        highlights: [
          'Lặn biển ngắm san hô tại Hòn Thơm',
          'Tham quan vườn tiêu lớn nhất Việt Nam',
          'Câu cá và BBQ hải sản tươi sống',
          'Thăm làng chài Hàm Ninh',
          'Ngắm hoàng hôn tại bãi Sao',
        ],
        included: [
          'Vé máy bay khứ hồi',
          'Resort 4 sao 2 đêm',
          'Các bữa ăn theo chương trình',
          'Thiết bị lặn biển',
          'Xe đưa đón',
          'Hướng dẫn viên',
          'Bảo hiểm du lịch',
        ],
        notIncluded: [
          'Chi phí cá nhân',
          'Massage & Spa',
          'Đồ uống có cồn',
        ],
        schedule: [
          { time: '10:00', activity: 'Bay từ TP.HCM đến Phú Quốc' },
          { time: '12:00', activity: 'Nhận phòng resort, ăn trưa' },
          { time: '14:00', activity: 'Tham quan vườn tiêu' },
          { time: '16:30', activity: 'Tắm biển bãi Sao' },
          { time: '18:00', activity: 'Ngắm hoàng hôn' },
        ],
        availableDates: ['2026-04-05', '2026-04-12', '2026-04-19', '2026-04-26', '2026-05-03'],
        tags: ['Biển', 'Lặn biển', 'San hô', 'Resort', 'Hải sản'],
      },
    ];
    
    userTours.push(...newTours);
    localStorage.setItem('userTours', JSON.stringify(userTours));
  }
}