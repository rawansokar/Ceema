import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { login } from '../../services/authService'

import Layout from '../../components/Layout/Layout'

import { FcGoogle } from 'react-icons/fc'
import { FaFacebookF } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

import styles from './Login.module.css'

const Login = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email required'
    }

    if (!formData.password) {
      newErrors.password = 'Password required'
    }

    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    const result = await login(
      formData.email,
      formData.password
    )

    setLoading(false)

    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}`)
      navigate('/')
    } else {
      toast.error(result.message)
      setErrors({ general: result.message })
    }
  }

  return (
    <Layout showBack={true}>
      <div className={styles.loginPage}>

        <div className={styles.loginCard}>

          <h1 className={styles.title}>Login</h1>

          {errors.general && (
            <div className={styles.generalError}>
              {errors.general}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={styles.form}
          >

            <div className={styles.formRow}>

              <label>Email</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className={styles.input}
                value={formData.email}
                onChange={handleChange}
              />

            </div>

            <div className={styles.formRow}>

              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                className={styles.input}
                value={formData.password}
                onChange={handleChange}
              />

            </div>

            <button
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>

          </form>

          <div className={styles.socialSection}>

            <p className={styles.orText}>
              Or continue with
            </p>

            <div className={styles.socialIcons}>

              <button
                type="button"
                className={styles.socialBtn}
              >
                <FcGoogle size={20} />
              </button>

              <button
                type="button"
                className={styles.socialBtn}
              >
                <FaFacebookF size={18} />
              </button>

              <button
                type="button"
                className={styles.socialBtn}
              >
                <MdEmail size={20} />
              </button>

            </div>

          </div>

          <p className={styles.registerLink}>
            Don’t have an account?{' '}
            <Link to="/register">
              Register
            </Link>
          </p>

        </div>

      </div>
    </Layout>
  )
}

export default Login



// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { login } from '../../services/authService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Login.module.css'

// const Login = () => {
//   const navigate = useNavigate()

//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   })

//   const [errors, setErrors] = useState({})
//   const [loading, setLoading] = useState(false)

//   const validate = () => {
//     const newErrors = {}

//     if (!formData.email) newErrors.email = 'Email required'
//     if (!formData.password) newErrors.password = 'Password required'

//     return newErrors
//   }

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     const validationErrors = validate()
//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors)
//       return
//     }

//     setLoading(true)

//     const result = await login(
//       formData.email,
//       formData.password
//     )

//     setLoading(false)

//     if (result.success) {
//       toast.success(`Welcome back, ${result.user.name}`)
//       navigate('/')
//     } else {
//       toast.error(result.message)
//       setErrors({ general: result.message })
//     }
//   }

//   return (
//     <Layout showBack={true}>
//       <div className={styles.loginPage}>
//         <div className={styles.loginCard}>

//           <h1 className={styles.title}>Login</h1>

//           {errors.general && (
//             <div className={styles.generalError}>
//               {errors.general}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className={styles.form}>

//             <div className={styles.formRow}>
//               <label>Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 className={styles.input}
//                 value={formData.email}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className={styles.formRow}>
//               <label>Password</label>
//               <input
//                 type="password"
//                 name="password"
//                 className={styles.input}
//                 value={formData.password}
//                 onChange={handleChange}
//               />
//             </div>

//             <button className={styles.loginBtn}>
//               {loading ? 'Logging in...' : 'LOGIN'}
//             </button>

//           </form>

//           <p className={styles.registerLink}>
//             Don’t have an account? <Link to="/register">Register</Link>
//           </p>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Login
