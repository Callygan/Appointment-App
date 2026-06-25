import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { BookingPage } from './pages/BookingPage/BookingPage'
import { AdminPage } from './pages/AdminPage/AdminPage'
import { PriceListPage } from './pages/PriceListPage/PriceListPage'
import { TermsPage } from './pages/TermsPage/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage/PrivacyPage'
import { ContactPage } from './pages/ContactPage/ContactPage'
import { MyAppointmentPage } from './pages/MyAppointmentPage/MyAppointmentPage'
import { AboutPage } from './pages/AboutPage/AboutPage'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'
import { Footer } from './components/Footer/Footer'
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage'
import { Header } from './components/Header/Header'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Programare',
  '/prices': 'Price List',
  '/contact': 'Contact',
  '/programarea-mea': 'Programarea mea',
  '/despre': 'Despre',
  '/termeni-si-conditii': 'Termeni și condiții',
  '/politica-de-confidentialitate': 'Politica de confidențialitate',
  '/admin': 'Dashboard',
}

function AppContent() {
  const location = useLocation()
  const hideFooter = location.pathname.startsWith('/admin')
  const hideHeader = location.pathname.startsWith('/admin')

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname]
    document.title = pageTitle ? `${pageTitle} - Nail Bar` : 'Nail Bar'
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #fce4f3 0%, #e8d5ff 30%, #d4eeff 65%, #e0ffe8 100%)' }} />
      {!hideHeader && <Header />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/prices" element={<PriceListPage />} />
          <Route path="/termeni-si-conditii" element={<TermsPage />} />
          <Route path="/politica-de-confidentialitate" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/programarea-mea" element={<MyAppointmentPage />} />
          <Route path="/despre" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
