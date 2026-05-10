import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Pages
import Chatbot from '../components/Chatbot/Chatbot'
import Landing from '../pages/Landing/Landing'
import Login from '../pages/Login/Login'
import Booking from '../pages/Booking/Booking'
import Register from '../pages/Register/Register'
import Profile from '../pages/Profile/Profile'
import CurrentMovies from '../pages/CurrentMovies/CurrentMovies'
import MovieDetails from '../pages/MovieDetails/MovieDetails'
import MovieSlots from '../pages/MovieSlots/MovieSlots'
import MovieLibrary from '../pages/MovieLibrary/MovieLibrary'
import Seats from '../pages/Seats/Seats'
import Payment from '../pages/Payment/Payment'
import PaymentConfirmation from '../pages/PaymentConfirmation/PaymentConfirmation'
import PointsRewards from '../pages/PointsRewards/PointsRewards'
import Feed from '../pages/Feed/Feed'
import Education from '../pages/Education/Education'
import News from '../pages/News/News'
import AdminDashboard from '../pages/AdminDashboard/AdminDashboard'
import BrowseFollowers from '../pages/BrowseFollowers/BrowseFollowers'
import TicketsHistory from '../pages/TicketsHistory/TicketsHistory'
import AdminUsers from '../pages/AdminDashboard/users/Users'
import AdminUserDetails from '../pages/AdminDashboard/users/UserDetails'
import AdminReports from '../pages/AdminDashboard/reports/Reports'


const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ─── Main ─── */}
        <Route path="/" element={<Landing />} />

        {/* ─── Auth ─── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ─── User ─── */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/points-rewards" element={<PointsRewards />} />
        <Route path="/tickets-history" element={<TicketsHistory />} />

        {/* ─── Movies ─── */}
        <Route path="/movies" element={<CurrentMovies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/slots" element={<MovieSlots />} />
        <Route path="/library" element={<MovieLibrary />} />

        {/* ─── Booking Flow ─── */}
        <Route path="/seats" element={<Seats />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-confirmation" element={<PaymentConfirmation />} />

        {/* ─── Content ─── */}
        <Route path="/feed" element={<Feed />} />
        <Route path="/education" element={<Education />} />
        <Route path="/news" element={<News />} />
        <Route path="/browse-followers" element={<BrowseFollowers />} />

        {/* ─── Admin ─── */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:id" element={<AdminUserDetails />} />
        <Route path="/admin/reports" element={<AdminReports />} />

        <Route path="/booking" element={<Booking />} />

        {/* ─── 404 Fallback ─── */}
        <Route path="*" element={<Landing />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
