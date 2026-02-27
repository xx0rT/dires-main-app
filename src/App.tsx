import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider } from './lib/auth-context'
import { CartProvider } from './lib/cart-context'
import { useActivityTracker } from './lib/use-activity-tracker'
import MarketingLayout from './layouts/marketing-layout'
import DashboardLayout from './layouts/dashboard-layout'
import AdminLayout from './layouts/admin-layout'
import HomePage from './pages/home-page'
import CoursesPage from './pages/courses-page'
import ShopPage from './pages/shop-page'
import CartPage from './pages/cart-page'
import ProductDetailPage from './pages/product-detail-page'
import OrderConfirmationPage from './pages/order-confirmation-page'
import ReferencesPage from './pages/references-page'
import DashboardPage from './pages/dashboard-page'
import AnalyticsPage from './pages/analytics-page'
import ApiPage from './pages/api-page'
import BillingPage from './pages/billing-page'
import IntegrationsPage from './pages/integrations-page'
import MyCoursesPage from './pages/my-courses-page'
import MyCourseDetailPage from './pages/my-course-detail-page'
import SettingsPage from './pages/settings-page'
import SubscriptionPage from './pages/subscription-page'
import InvoicesPage from './pages/invoices-page'
import ProgressPage from './pages/progress-page'
import TestResultsPage from './pages/test-results-page'
import CertificatesPage from './pages/certificates-page'
import SignInPage from './pages/sign-in-page'
import SignUpPage from './pages/sign-up-page'
import VerifyEmailPage from './pages/verify-email-page'
import ForgotPasswordPage from './pages/forgot-password-page'
import ResetPasswordPage from './pages/reset-password-page'
import CourseOverviewPage from './pages/course-overview-page'
import CoursePartPage from './pages/course-part-page'
import ScrollToTop from './components/layout/scroll-to-top'
import AdminOverviewPage from './pages/admin/admin-overview-page'
import AdminUsersPage from './pages/admin/admin-users-page'
import AdminBlogsPage from './pages/admin/admin-blogs-page'
import AdminBlogEditorPage from './pages/admin/admin-blog-editor-page'
import AdminCoursesPage from './pages/admin/admin-courses-page'
import AdminCourseEditorPage from './pages/admin/admin-course-editor-page'
import AdminInvoicesPage from './pages/admin/admin-invoices-page'
import AdminSubscriptionsPage from './pages/admin/admin-subscriptions-page'
import AdminPromoCodesPage from './pages/admin/admin-promo-codes-page'
import TeamPage from './pages/team-page'
import TeamMemberPage from './pages/team-member-page'
import BlogPage from './pages/blog-page'
import BlogPostPage from './pages/blog-post-page'

function ActivityTrackerInit() {
  useActivityTracker()
  return null
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CartProvider>
        <ScrollToTop />
        <ActivityTrackerInit />
        <Routes>
          <Route path="/" element={<MarketingLayout />}>
            <Route index element={<HomePage />} />
            <Route path="kurzy" element={<CoursesPage />} />
            <Route path="obchod" element={<ShopPage />} />
            <Route path="produkt/:productId" element={<ProductDetailPage />} />
            <Route path="kosik" element={<CartPage />} />
            <Route path="reference" element={<ReferencesPage />} />
            <Route path="tym" element={<TeamPage />} />
            <Route path="tym/:slug" element={<TeamMemberPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<BlogPostPage />} />
          </Route>
          <Route path="/potvrzeni-objednavky" element={<OrderConfirmationPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/prihlaseni" element={<SignInPage />} />
          <Route path="/registrace" element={<SignUpPage />} />
          <Route path="/overeni-emailu" element={<VerifyEmailPage />} />
          <Route path="/zapomenute-heslo" element={<ForgotPasswordPage />} />
          <Route path="/obnoveni-hesla" element={<ResetPasswordPage />} />
          <Route path="/kurz/:courseId" element={<CourseOverviewPage />} />
          <Route path="/kurz/:courseId/cast/:partNumber" element={<CoursePartPage />} />
          <Route path="/prehled" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="analytika" element={<AnalyticsPage />} />
            <Route path="api" element={<ApiPage />} />
            <Route path="fakturace" element={<BillingPage />} />
            <Route path="integrace" element={<IntegrationsPage />} />
            <Route path="moje-kurzy" element={<MyCoursesPage />} />
            <Route path="moje-kurzy/:courseId" element={<MyCourseDetailPage />} />
            <Route path="predplatne" element={<SubscriptionPage />} />
            <Route path="faktury" element={<InvoicesPage />} />
            <Route path="pokrok" element={<ProgressPage />} />
            <Route path="vysledky-testu" element={<TestResultsPage />} />
            <Route path="certifikaty" element={<CertificatesPage />} />
            <Route path="nastaveni" element={<SettingsPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="blogs" element={<AdminBlogsPage />} />
            <Route path="blogs/:id" element={<AdminBlogEditorPage />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="courses/:id" element={<AdminCourseEditorPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="promo-codes" element={<AdminPromoCodesPage />} />
            <Route path="invoices" element={<AdminInvoicesPage />} />
          </Route>
        </Routes>
        <Toaster />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
