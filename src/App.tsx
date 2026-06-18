import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BookingPage } from './pages/BookingPage'
import { AdminPage } from './pages/AdminPage'
import { PriceListPage } from './pages/PriceListPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
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
