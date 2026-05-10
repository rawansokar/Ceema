import { Link } from 'react-router-dom'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>

        {/* ─── About Us ─── */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>About Us</h4>
          <ul className={styles.colLinks}>
            <li><Link to="#">Contact us</Link></li>
            <li><Link to="#">Careers</Link></li>
          </ul>
        </div>

        {/* ─── Community ─── */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Community</h4>
          <ul className={styles.colLinks}>
            <li><Link to="/feed">User Reviews</Link></li>
            <li><Link to="/points-rewards">Points/Loyalty System</Link></li>
            <li><Link to="/feed">Networking</Link></li>
          </ul>
        </div>

        {/* ─── Privacy Policy ─── */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Privacy Policy</h4>
          <ul className={styles.colLinks}>
            <li><Link to="#">Terms</Link></li>
            <li><Link to="#">Copyright</Link></li>
          </ul>
        </div>

        {/* ─── Follow Us ─── */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Follow Us</h4>
          <div className={styles.socialIcons}>
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="X"><FaXTwitter /></a>
          </div>
        </div>

      </div>

      {/* ─── Bottom Bar ─── */}
      <div className={styles.footerBottom}>
        <p>© 2026 CEEMA. All rights reserved.</p>
      </div>

    </footer>
  )
}

export default Footer
