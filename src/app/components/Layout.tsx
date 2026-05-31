import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'motion/react';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { getConversations } from '@/api/conversations'
import { trackPageView } from '@/api/analytics';
import { NotificationBell } from './NotificationBell';
import { AnimatedPage } from './AnimatedPage';
import { cn } from './ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isGuide, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const skipPrefixes = ['/admin', '/login', '/register', '/forgot-password', '/reset-password', '/auth']
    if (!skipPrefixes.some((p) => location.pathname.startsWith(p))) {
      trackPageView(location.pathname).catch((e) => console.warn('[Analytics] page-view failed:', e))
    }
  }, [location.pathname])

  const { data: chatUnreadCount = 0 } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: async () => {
      const res = await getConversations({ size: 100 });
      return res.items.reduce((sum, c) => sum + c.unreadCount, 0);
    },
    enabled: isAuthenticated && !isAdmin,
    refetchInterval: 30000,
  });

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/tours', label: 'Khám phá Tour' },
    { href: '/accommodations', label: 'Khách sạn & Nhà hàng' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const NavContent = () => (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className={`transition-colors hover:text-orange-600 ${
            isActive(link.href) ? 'text-orange-600 font-medium' : 'text-gray-700'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={cn(
        'sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-shadow duration-200',
        scrolled && 'shadow-sm'
      )}>
        <div className="container mx-auto px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link to="/" className="font-bold text-xl text-gray-900 hover:text-orange-600 transition-colors">
            VietNamTours
          </Link>

          {/* Desktop Navigation — truly centered */}
          <nav className="hidden md:flex items-center gap-6">
            <NavContent />
          </nav>

          <div className="flex items-center gap-1 justify-end">
            {isAuthenticated && !isAdmin && (
              <>
                <Link to="/chat">
                  <Button variant="ghost" size="sm" className="relative hidden md:flex px-2" title="Tin nhắn">
                    <MessageCircle className="size-5" />
                    {chatUnreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 flex size-4 items-center justify-center p-0 text-[10px] bg-red-600 text-white">
                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <NotificationBell />
              </>
            )}

            {isAuthenticated ? (
              isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 text-sm font-medium rounded-full pl-1 pr-3 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="size-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="flex size-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-semibold shrink-0">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {user?.name}
                      <ChevronDown className="size-3.5 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="cursor-pointer">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users" className="cursor-pointer">Quản lý người dùng</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}>
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isGuide ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 text-sm font-medium rounded-full pl-1 pr-3 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="size-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="flex size-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-semibold shrink-0">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {user?.name}
                      <ChevronDown className="size-3.5 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/guide" className="cursor-pointer">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">Hồ sơ</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/support" className="cursor-pointer">Hỗ trợ</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}>
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 text-sm font-medium rounded-full pl-1 pr-3 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="size-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="flex size-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-semibold shrink-0">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {user?.name}
                      <ChevronDown className="size-3.5 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/my-profile" className="cursor-pointer">Hồ sơ của tôi</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-bookings" className="cursor-pointer">Lịch sử đặt tour</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-wishlist" className="cursor-pointer">Tour yêu thích</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-reviews" className="cursor-pointer">Đánh giá của tôi</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/support" className="cursor-pointer">Hỗ trợ</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}>
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            ) : (
              <Link to="/login" className="hidden md:flex">
                <Button size="sm" className="text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 shadow-sm">
                  Đăng nhập
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden inline-flex items-center justify-center rounded-md h-9 w-9 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  ☰
                </button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  <NavContent />
                  <div className="border-t pt-4 flex flex-col gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => navigate('/tours')}>
                      Tìm kiếm
                    </Button>
                    {isAuthenticated ? (
                      <>
                        {isAdmin ? (
                          <>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/dashboard')}>
                              Dashboard
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/users')}>
                              Quản lý người dùng
                            </Button>
                          </>
                        ) : isGuide ? (
                          <>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/guide')}>
                              Dashboard
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/profile')}>
                              Hồ sơ
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/chat')}>
                              Tin nhắn
                              {chatUnreadCount > 0 && (
                                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{chatUnreadCount}</span>
                              )}
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/notifications')}>
                              Thông báo
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/my-profile')}>
                              Hồ sơ của tôi
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/my-bookings')}>
                              Lịch sử đặt tour
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/my-wishlist')}>
                              Tour yêu thích
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/my-reviews')}>
                              Đánh giá của tôi
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/chat')}>
                              Tin nhắn
                              {chatUnreadCount > 0 && (
                                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{chatUnreadCount}</span>
                              )}
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => navigate('/notifications')}>
                              Thông báo
                            </Button>
                          </>
                        )}
                        <Button variant="outline" className="justify-start" onClick={() => { logout(); navigate('/'); }}>
                          Đăng xuất
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="justify-start" onClick={() => navigate('/login')}>
                        Đăng nhập
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content with page transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <AnimatedPage key={location.pathname}>
            <Outlet />
          </AnimatedPage>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold mb-4">VietNamTours</div>
              <p className="text-sm text-gray-600">Nền tảng đặt tour du lịch trải nghiệm hàng đầu Việt Nam</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Về chúng tôi</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-orange-600">Đội ngũ</a></li>
                <li><a href="#" className="hover:text-orange-600">Tuyển dụng</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-orange-600">Chính sách hoàn hủy</a></li>
                <li><a href="#" className="hover:text-orange-600">Điều khoản sử dụng</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Email: info@VietNamTours.vn</li>
                <li>Hotline: 1900 xxxx</li>
                <li>Địa chỉ: Hà Nội, Việt Nam</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            © 2026 VietNamTours. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
