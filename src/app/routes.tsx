import { createBrowserRouter } from 'react-router'
import { RootLayout } from './components/RootLayout'
import { Layout } from './components/Layout'
import { AdminLayout } from './components/AdminLayout'
import { Home } from './pages/Home'
import { Tours } from './pages/Tours'
import { TourDetail } from './pages/TourDetail'
import { GuideDashboard } from './pages/GuideDashboard'
import { BookingConfirmation } from './pages/BookingConfirmation'
import { MomoPayment } from './pages/MomoPayment'
import { VNPayPayment } from './pages/VNPayPayment'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { GuideProfile } from './pages/GuideProfile'
import { CreateTour } from './pages/CreateTour'
import { EditTour } from './pages/EditTour'
import { MyBookings } from './pages/MyBookings'
import { CustomerProfile } from './pages/CustomerProfile'
import { MyWishlist } from './pages/MyWishlist'
import { MyReviews } from './pages/MyReviews'
import { SubscriptionPlans } from './pages/SubscriptionPlans'
import { GuideApplication } from './pages/GuideApplication'
import { AdminUsers } from './pages/AdminUsers'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminTours } from './pages/AdminTours'
import { AdminReports } from './pages/AdminReports'
import { AdminSubscriptions } from './pages/AdminSubscriptions'
import { AdminBoostPlans } from './pages/AdminBoostPlans'
import { AdminWithdrawals } from './pages/AdminWithdrawals'
import { AdminApplications } from './pages/admin/AdminApplications'
import { Chat } from './pages/Chat'
import { BoostPage } from './pages/BoostPage'
import { SelectTourToBoost } from './pages/SelectTourToBoost'
import { NotFound } from './pages/NotFound'
import { AuthCallback } from './pages/AuthCallback'
import { ComingSoon } from './pages/ComingSoon'
import { PaymentSuccess } from './pages/PaymentSuccess'
import { PaymentFailed } from './pages/PaymentFailed'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SupportChat } from './pages/SupportChat'
import { AdminSupport } from './pages/AdminSupport'
import { AdminHomeCategories } from './pages/AdminHomeCategories'
import { Notifications } from './pages/Notifications'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, Component: Home },
          { path: 'tours', Component: Tours },
          { path: 'tours/:id', Component: TourDetail },
          { path: 'accommodations', Component: ComingSoon },
          { path: 'my-bookings', Component: MyBookings },
          { path: 'my-profile', Component: CustomerProfile },
          { path: 'my-wishlist', Component: MyWishlist },
          { path: 'my-reviews', Component: MyReviews },
          { path: 'subscription', Component: SubscriptionPlans },
          { path: 'guide-application', Component: GuideApplication },
          { path: 'chat', Component: Chat },
          { path: 'chat/:id', Component: Chat },
          { path: 'support', Component: SupportChat },
          { path: 'notifications', Component: Notifications },
          {
            path: 'guide',
            element: (
              <ProtectedRoute requireGuide>
                <GuideDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'profile',
            element: (
              <ProtectedRoute requireGuide>
                <GuideProfile />
              </ProtectedRoute>
            ),
          },
          {
            path: 'create-tour',
            element: (
              <ProtectedRoute requireGuide>
                <CreateTour />
              </ProtectedRoute>
            ),
          },
          {
            path: 'edit-tour/:id',
            element: (
              <ProtectedRoute requireGuide>
                <EditTour />
              </ProtectedRoute>
            ),
          },
          {
            path: 'boost',
            element: (
              <ProtectedRoute requireGuide>
                <BoostPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'select-tour-to-boost',
            element: (
              <ProtectedRoute requireGuide>
                <SelectTourToBoost />
              </ProtectedRoute>
            ),
          },
          { path: 'booking-confirmation/:id', Component: BookingConfirmation },
          { path: 'payment/success', Component: PaymentSuccess },
          { path: 'payment/failed', Component: PaymentFailed },
          { path: 'payment/vnpay/:id', Component: VNPayPayment },
          { path: 'payment/:id', Component: MomoPayment },
          { path: '*', Component: NotFound },
        ],
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'tours', element: <AdminTours /> },
          { path: 'reports', element: <AdminReports /> },
          { path: 'subscriptions', element: <AdminSubscriptions /> },
          { path: 'boost-plans', element: <AdminBoostPlans /> },
          { path: 'withdrawals', element: <AdminWithdrawals /> },
          { path: 'applications', element: <AdminApplications /> },
          { path: 'support', element: <AdminSupport /> },
          { path: 'home-categories', element: <AdminHomeCategories /> },
        ],
      },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'forgot-password', Component: ForgotPassword },
      { path: 'reset-password', Component: ResetPassword },
      { path: 'admin/login', Component: AdminLogin },
      { path: 'auth/callback', Component: AuthCallback },
    ],
  },
])
