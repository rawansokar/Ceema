import Navbar from '../Navbar/Navbar'
import Footer from '../Footer/Footer'
import styles from './Layout.module.css'

// showBack = true adds the ← back arrow in the navbar
// used on detail/inner pages like MovieDetails, Payment, Seats etc.

const Layout = ({ children, showBack = false }) => {
  return (
    <div className={styles.layout}>
      <Navbar showBack={showBack} />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
