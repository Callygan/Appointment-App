import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BookingPage } from './pages/BookingPage/BookingPage'
import { AdminPage } from './pages/AdminPage/AdminPage'
import { PriceListPage } from './pages/PriceListPage/PriceListPage'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #fce4f3 0%, #e8d5ff 30%, #d4eeff 65%, #e0ffe8 100%)' }} />
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/prices" element={<PriceListPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
