import { useState, useEffect, useRef } from 'react'
import { IoChatbubbleEllipses, IoClose, IoSend } from 'react-icons/io5'
import { MdMovieFilter } from 'react-icons/md'
import {
  createChatbot,
  receiveAnswer,
  recommendMovies
} from '../../services/chatbotService'
import styles from './Chatbot.module.css'

// ─── Dummy fallback responses (used until API is ready) ───
const DUMMY_RESPONSES = [
  "Hi! 🎬 I'm CEEMA's movie assistant. How are you feeling today?",
  "That's great! Are you in the mood for something exciting, romantic, or maybe a comedy?",
  "I love that! Let me recommend some movies based on your mood...",
  "Based on what you told me, I think you'd enjoy **La La Land** or **Whiplash**! 🎭",
  "Would you like to book tickets for any of these movies?"
]

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatbotId, setChatbotId] = useState(null)
  const [step, setStep] = useState(0)
  const [apiReady, setApiReady] = useState(false)
  const messagesEndRef = useRef(null)

  // ─── Auto scroll to bottom ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Open chat and initialize session ───
  const handleOpen = async () => {
    setIsOpen(true)
    if (messages.length > 0) return

    // Welcome message
    addBotMessage("Hi! 🎬 I'm CEEMA's movie assistant. How are you feeling today?")

    // Try to create real API session
    try {
      const session = await createChatbot()
      setChatbotId(session.id)
      setApiReady(true)

      // load existing messages if any
      if (session.messages && session.messages.length > 0) {
        const mapped = session.messages.map((m) => ({
          id: m.id,
          text: m.content,
          sender: ['user', 'guest'].includes(m.sender) ? 'user' : 'bot',
          time: new Date(m.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        }))
        setMessages(mapped)
      }
    } catch (err) {
      // API not ready yet — use dummy mode
      setApiReady(false)
    }
  }

  // ─── Add bot message helper ───
  const addBotMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    ])
  }

  // ─── Add user message helper ───
  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text,
        sender: 'user',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    ])
  }

  // ─── Send Message ───
  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    addUserMessage(userText)
    setLoading(true)

    try {
      if (apiReady && chatbotId) {
        // ── Real API Flow ──
        // Send answer to backend
        const answerRes = await receiveAnswer(chatbotId, userText)

        // Get bot reply from messages
        const botMessages = answerRes.messages.filter((m) => !['user', 'guest'].includes(m.sender))
        if (botMessages.length > 0) {
          const lastBotMsg = botMessages[botMessages.length - 1]
          addBotMessage(lastBotMsg.content)
        }
      } else {
        // ── Dummy Mode ──
        const nextStep = step + 1
        setStep(nextStep)
        setTimeout(() => {
          const response =
            DUMMY_RESPONSES[nextStep] ||
            "I'm still learning! 🎬 Try asking me about movies or your mood."
          addBotMessage(response)
        }, 700)
      }
    } catch (err) {
      setTimeout(() => {
        addBotMessage("Sorry, I had trouble connecting. Please try again! 🎬")
      }, 700)
    } finally {
      setLoading(false)
    }
  }

  // ─── Get Movie Recommendations ───
  const handleRecommend = async () => {
    setLoading(true)
    addBotMessage("Let me find some movies for you based on your mood... 🎬")

    try {
      if (apiReady && chatbotId) {
        const res = await recommendMovies(chatbotId)
        if (Array.isArray(res) && res.length > 0) {
          const titles = res.slice(0, 4).map((movie) => movie.title).join(', ')
          setTimeout(() => addBotMessage(`Based on your mood, try: ${titles}.`), 800)
        } else if (res.messages?.length > 0) {
          const botMsgs = res.messages.filter((m) => !['user', 'guest'].includes(m.sender))
          const lastMsg = botMsgs[botMsgs.length - 1]
          setTimeout(() => addBotMessage(lastMsg.content), 800)
        } else {
          setTimeout(() => addBotMessage("Here are my top picks for you! Check the Movies page. 🎬"), 800)
        }
      } else {
        setTimeout(() => {
          addBotMessage(
            "Based on your mood, I recommend: **La La Land**, **Whiplash**, and **The Lion King**! 🍿"
          )
        }, 800)
      }
    } catch (err) {
      setTimeout(() => addBotMessage("Couldn't load recommendations right now. Try again! 🎬"), 700)
    } finally {
      setLoading(false)
    }
  }

  // ─── Handle Enter key ───
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Clear chat ───
  const handleClear = () => {
    setMessages([])
    setStep(0)
    setChatbotId(null)
    addBotMessage("Hi! 🎬 I'm CEEMA's movie assistant. How are you feeling today?")
  }

  return (
    <>
      {/* ─── Floating Button ─── */}
      <button
        className={`${styles.floatBtn} ${isOpen ? styles.floatBtnHidden : ''}`}
        onClick={handleOpen}
        title="Chat with CEEMA Assistant"
        aria-label="Open chatbot"
      >
        <IoChatbubbleEllipses size={26} />
        <span className={styles.floatLabel}>Chat</span>
      </button>

      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div className={styles.chatWindow}>

          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.botAvatar}>
                <MdMovieFilter size={18} />
              </div>
              <div className={styles.headerInfo}>
                <span className={styles.botName}>CEEMA Assistant</span>
                <span className={styles.botStatus}>
                  <span className={styles.statusDot} />
                  Online
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.recommendBtn}
                onClick={handleRecommend}
                title="Get movie recommendations"
                disabled={loading}
              >
                <MdMovieFilter size={16} />
              </button>
              <button
                className={styles.clearBtn}
                onClick={handleClear}
                title="Clear chat"
              >
                ↺
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <IoClose size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messagesArea}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageBubble} ${
                  msg.sender === 'user' ? styles.userBubble : styles.botBubble
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className={styles.bubbleAvatar}>
                    <MdMovieFilter size={12} />
                  </div>
                )}
                <div className={styles.bubbleContent}>
                  <p className={styles.bubbleText}>{msg.text}</p>
                  <span className={styles.bubbleTime}>{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className={`${styles.messageBubble} ${styles.botBubble}`}>
                <div className={styles.bubbleAvatar}>
                  <MdMovieFilter size={12} />
                </div>
                <div className={styles.bubbleContent}>
                  <div className={styles.typingIndicator}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <textarea
              className={styles.chatInput}
              placeholder="Ask me about movies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              title="Send"
            >
              <IoSend size={16} />
            </button>
          </div>

        </div>
      )}
    </>
  )
}

export default Chatbot
