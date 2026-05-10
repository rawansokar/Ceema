import { ToastContainer } from 'react-toastify'
import AppRouter from './routes/AppRouter'
import Chatbot from './components/Chatbot/Chatbot'
import axios from "axios"

const App = () => {
  return (
    <>
      <AppRouter />
      <Chatbot />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </>
  )
}

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000, // 10 seconds
});


export default App
