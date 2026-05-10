import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { register } from '../../services/authService'
import Layout from '../../components/Layout/Layout'
import styles from './Register.module.css'

const Register = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // ─── Validation ───
  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  // ─── Handle Input ───
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // clear error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // ─── Handle Submit ───
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    // 🔥 IMPORTANT: pass required backend fields
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      18,                 // age (default)
      "general",          // preferred_genres
      "any"               // mood_preference
    )

    setLoading(false)

    if (result.success) {
      toast.success('Account created! Please login 🎬')
      navigate('/login')
    } else {
      toast.error(result.message)
      setErrors({ general: result.message })
    }
  }

  return (
    <Layout showBack={true}>
      <div className={styles.registerPage}>
        <div className={styles.registerCard}>

          {/* ─── Title ─── */}
          <h1 className={styles.title}>Register</h1>

          {/* ─── General Error ─── */}
          {errors.general && (
            <div className={styles.generalError}>
              {errors.general}
            </div>
          )}

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>

            {/* Name */}
            <div className={styles.formRow}>
              <label className={styles.label}>Name</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Your Full Name"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <span className={styles.errorMsg}>{errors.name}</span>
                )}
              </div>
            </div>

            {/* Email */}
            <div className={styles.formRow}>
              <label className={styles.label}>Email</label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Your Email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className={styles.errorMsg}>{errors.email}</span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className={styles.formRow}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a Password"
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <span className={styles.errorMsg}>{errors.password}</span>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.formRow}>
              <label className={styles.label}>Confirm Password</label>
              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Your Password"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <span className={styles.errorMsg}>{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={styles.registerBtn}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

          </form>

          {/* ─── Login Link ─── */}
          <p className={styles.loginLink}>
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>

        </div>
      </div>
    </Layout>
  )
}

export default Register
// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { register } from '../../services/authService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Register.module.css'

// const Register = () => {
//   const navigate = useNavigate()

//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   })

//   const [errors, setErrors] = useState({})
//   const [loading, setLoading] = useState(false)

//   const validate = () => {
//     const newErrors = {}

//     if (!formData.name.trim()) {
//       newErrors.name = 'Full name is required'
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required'
//     }

//     if (!formData.password.trim()) {
//       newErrors.password = 'Password is required'
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match'
//     }

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

//     const result = await register(
//       formData.name,
//       formData.email,
//       formData.password
//     )

//     setLoading(false)

//     if (result.success) {
//       toast.success('Account created! Please login 🎬')
//       navigate('/login')
//     } else {
//       toast.error(result.message)
//       setErrors({ general: result.message })
//     }
//   }

//   return (
//     <Layout showBack={true}>
//       <div className={styles.registerPage}>
//         <div className={styles.registerCard}>

//           <h1 className={styles.title}>Register</h1>

//           {errors.general && (
//             <div className={styles.generalError}>
//               {errors.general}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className={styles.form}>

//             <div className={styles.formRow}>
//               <label className={styles.label}>Name</label>
//               <div className={styles.inputWrapper}>
//                 <input
//                   type="text"
//                   name="name"
//                   className={styles.input}
//                   value={formData.name}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className={styles.formRow}>
//               <label className={styles.label}>Email</label>
//               <div className={styles.inputWrapper}>
//                 <input
//                   type="email"
//                   name="email"
//                   className={styles.input}
//                   value={formData.email}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className={styles.formRow}>
//               <label className={styles.label}>Password</label>
//               <input
//                 type="password"
//                 name="password"
//                 className={styles.input}
//                 value={formData.password}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className={styles.formRow}>
//               <label className={styles.label}>Confirm Password</label>
//               <input
//                 type="password"
//                 name="confirmPassword"
//                 className={styles.input}
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//               />
//             </div>

//             <button type="submit" className={styles.registerBtn}>
//               {loading ? 'Creating...' : 'Create Account'}
//             </button>

//           </form>

//           <p className={styles.loginLink}>
//             Already have an account? <Link to="/login">Login</Link>
//           </p>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Register
// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { FaUser, FaEnvelope, FaLock, FaCheckCircle } from 'react-icons/fa'
// import { register } from '../../services/authService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Register.module.css'

// const Register = () => {
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
//   const [errors, setErrors] = useState({})
//   const [loading, setLoading] = useState(false)

//   const validate = () => {
//     const e = {}
//     if (!formData.name.trim()) e.name = 'Full name is required'
//     else if (formData.name.trim().length < 3) e.name = 'Name must be at least 3 characters'
//     if (!formData.email.trim()) e.email = 'Email is required'
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email address'
//     if (!formData.password.trim()) e.password = 'Password is required'
//     else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters'
//     else if (!/(?=.*[A-Z])/.test(formData.password)) e.password = 'Must contain at least one uppercase letter'
//     else if (!/(?=.*[0-9])/.test(formData.password)) e.password = 'Must contain at least one number'
//     if (!formData.confirmPassword.trim()) e.confirmPassword = 'Please confirm your password'
//     else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match'
//     return e
//   }

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData(prev => ({ ...prev, [name]: value }))
//     if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
//   }

//   // ── Real async submit ──
//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     const validationErrors = validate()
//     if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }

//     setLoading(true)
//     const result = await register(formData.name, formData.email, formData.password)
//     setLoading(false)

//     if (result.success) {
//       toast.success('Account created! Welcome to CEEMA')
//       navigate('/login')
//     } else {
//       toast.error(result.message)
//       setErrors({ general: result.message })
//     }
//   }

//   return (
//     <Layout showBack={true}>
//       <div className={styles.registerPage}>
//         <div className={styles.registerCard}>

//           <h1 className={styles.title}>Register</h1>

//           {errors.general && <div className={styles.generalError}>{errors.general}</div>}

//           <form onSubmit={handleSubmit} className={styles.form} noValidate>

//             {/* Name */}
//             <div className={styles.formRow}>
//               <label className={styles.label}><FaUser style={{ marginRight: 6 }} />Name</label>
//               <div className={styles.inputWrapper}>
//                 <input type="text" name="name" placeholder="Enter Your Full Name"
//                   className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
//                   value={formData.name} onChange={handleChange} />
//                 {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
//               </div>
//             </div>

//             {/* Email */}
//             <div className={styles.formRow}>
//               <label className={styles.label}><FaEnvelope style={{ marginRight: 6 }} />Email</label>
//               <div className={styles.inputWrapper}>
//                 <input type="email" name="email" placeholder="Enter Your Email"
//                   className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
//                   value={formData.email} onChange={handleChange} />
//                 {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
//               </div>
//             </div>

//             {/* Password */}
//             <div className={styles.formRow}>
//               <label className={styles.label}><FaLock style={{ marginRight: 6 }} />Password</label>
//               <div className={styles.inputWrapper}>
//                 <input type="password" name="password" placeholder="Create a Password"
//                   className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
//                   value={formData.password} onChange={handleChange} />
//                 {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
//               </div>
//             </div>

//             {/* Confirm Password */}
//             <div className={styles.formRow}>
//               <label className={styles.label}><FaCheckCircle style={{ marginRight: 6 }} />Confirm</label>
//               <div className={styles.inputWrapper}>
//                 <input type="password" name="confirmPassword" placeholder="Confirm Your Password"
//                   className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
//                   value={formData.confirmPassword} onChange={handleChange} />
//                 {errors.confirmPassword && <span className={styles.errorMsg}>{errors.confirmPassword}</span>}
//               </div>
//             </div>

//             <button type="submit" className={styles.registerBtn} disabled={loading}>
//               {loading ? 'Creating Account...' : 'Create Account'}
//             </button>
//           </form>

//           <p className={styles.loginLink}>
//             Already have an account? <Link to="/login">Login</Link>
//           </p>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Register

// //const Register = () => <div>Register</div>; export default Register;

// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { toast } from 'react-toastify'
// import { register } from '../../services/authService'
// import Layout from '../../components/Layout/Layout'
// import styles from './Register.module.css'

// const Register = () => {
//   const navigate = useNavigate()

//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   })

//   const [errors, setErrors] = useState({})
//   const [loading, setLoading] = useState(false)

//   // ─── Validation ───
//   const validate = () => {
//     const newErrors = {}

//     if (!formData.name.trim()) {
//       newErrors.name = 'Full name is required'
//     } else if (formData.name.trim().length < 3) {
//       newErrors.name = 'Name must be at least 3 characters'
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required'
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = 'Enter a valid email address'
//     }

//     if (!formData.password.trim()) {
//       newErrors.password = 'Password is required'
//     } else if (formData.password.length < 6) {
//       newErrors.password = 'Password must be at least 6 characters'
//     } else if (!/(?=.*[A-Z])/.test(formData.password)) {
//       newErrors.password = 'Password must contain at least one uppercase letter'
//     } else if (!/(?=.*[0-9])/.test(formData.password)) {
//       newErrors.password = 'Password must contain at least one number'
//     }

//     if (!formData.confirmPassword.trim()) {
//       newErrors.confirmPassword = 'Please confirm your password'
//     } else if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match'
//     }

//     return newErrors
//   }

//   // ─── Handle Input Change ───
//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: '' }))
//     }
//   }

//   // ─── Handle Submit ───
//   const handleSubmit = (e) => {
//     e.preventDefault()
//     const validationErrors = validate()
//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors)
//       return
//     }

//     setLoading(true)

//     setTimeout(() => {
//       const result = register(formData.name, formData.email, formData.password)
//       setLoading(false)

//       if (result.success) {
//         localStorage.setItem('ceema_user', JSON.stringify(result.user))
//         toast.success('Account created! Welcome to CEEMA 🎬')
//         navigate('/')
//       } else {
//         toast.error(result.message)
//         setErrors({ general: result.message })
//       }
//     }, 800)
//   }

//   return (
//     <Layout showBack={true}>
//       <div className={styles.registerPage}>
//         <div className={styles.registerCard}>

//           {/* ─── Title ─── */}
//           <h1 className={styles.title}>Register</h1>

//           {/* ─── General Error ─── */}
//           {errors.general && (
//             <div className={styles.generalError}>
//               {errors.general}
//             </div>
//           )}

//           {/* ─── Form ─── */}
//           <form onSubmit={handleSubmit} className={styles.form} noValidate>

//             {/* Name */}
//             <div className={styles.formRow}>
//               <label className={styles.label}>Name</label>
//               <div className={styles.inputWrapper}>
//                 <input
//                   type="text"
//                   name="name"
//                   placeholder="Enter Your Full Name"
//                   className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
//                   value={formData.name}
//                   onChange={handleChange}
//                 />
//                 {errors.name && (
//                   <span className={styles.errorMsg}>{errors.name}</span>
//                 )}
//               </div>
//             </div>

//             {/* Email */}
//             <div className={styles.formRow}>
//               <label className={styles.label}>Email</label>
//               <div className={styles.inputWrapper}>
//                 <input
//                   type="email"
//                   name="email"
//                   placeholder="Enter Your Email"
//                   className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
//                   value={formData.email}
//                   onChange={handleChange}
//                 />
//                 {errors.email && (
//                   <span className={styles.errorMsg}>{errors.email}</span>
//                 )}
//               </div>
//             </div>

//             {/* Password */}
//             <div className={styles.formRow}>
//               <label className={styles.label}>Password</label>
//               <div className={styles.inputWrapper}>
//                 <input
//                   type="password"
//                   name="password"
//                   placeholder="Create a Password"
//                   className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
//                   value={formData.password}
//                   onChange={handleChange}
//                 />
//                 {errors.password && (
//                   <span className={styles.errorMsg}>{errors.password}</span>
//                 )}
//               </div>
//             </div>

//             {/* Confirm Password */}
//             <div className={styles.formRow}>
//               <label className={styles.label}>Confirm Password</label>
//               <div className={styles.inputWrapper}>
//                 <input
//                   type="password"
//                   name="confirmPassword"
//                   placeholder="Confirm Your Password"
//                   className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                 />
//                 {errors.confirmPassword && (
//                   <span className={styles.errorMsg}>{errors.confirmPassword}</span>
//                 )}
//               </div>
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               className={styles.registerBtn}
//               disabled={loading}
//             >
//               {loading ? 'Creating Account...' : 'Create Account'}
//             </button>

//           </form>

//           {/* ─── Login Link ─── */}
//           <p className={styles.loginLink}>
//             Already have an account?{' '}
//             <Link to="/login">Login</Link>
//           </p>

//         </div>
//       </div>
//     </Layout>
//   )
// }

// export default Register

