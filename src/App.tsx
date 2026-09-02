import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { ReadPage } from '@/pages/ReadPage';
import { WritePage } from '@/pages/WritePage';
import { AuthorProfilePage } from '@/pages/AuthorProfilePage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountSettingsPage } from '@/pages/AccountSettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { SellerTermsPage } from '@/pages/SellerTermsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/discover" element={<DiscoverPage />} />
                  <Route path="/read/:bookId" element={<ReadPage />} />
                  <Route path="/write" element={<WritePage />} />
                  <Route path="/authors/:authorId" element={<AuthorProfilePage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/settings" element={<AccountSettingsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/feedback" element={<FeedbackPage />} />
                  <Route path="/seller-terms" element={<SellerTermsPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
