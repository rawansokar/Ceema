import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  getFeedPosts,
  likePost,
  createPost,
  deletePost,
  addComment,
  deleteComment,
  getPostComments,
  sharePost
} from '../../services/feedService'
import { followUser, unfollowUser } from '../../services/authService'
import Layout from '../../components/Layout/Layout'
import styles from './Feed.module.css'
import {
  FaHeart,
  FaComment,
  FaShare,
  FaTrash,
  FaUserPlus,
  FaImage,
  FaVideo,
  FaCompass
} from 'react-icons/fa'


// Sidebar trending topics
const TRENDING = [
  { id: 1, tag: '#Bershama', posts: '2.3k posts' },
  { id: 2, tag: '#LaLaLand', posts: '1.8k posts' },
  { id: 3, tag: '#Whiplash', posts: '1.2k posts' },
  { id: 4, tag: '#EgyptianCinema', posts: '980 posts' },
  { id: 5, tag: '#Marvel', posts: '4.5k posts' },
]

// Sidebar suggested users
const SUGGESTED = [
  {
    id: 1,
    name: 'Nour Khalid',
    avatar: 'https://i.pravatar.cc/40?img=20'
  },
  {
    id: 2,
    name: 'Youssef Salem',
    avatar: 'https://i.pravatar.cc/40?img=22'
  },
  {
    id: 3,
    name: 'Layla Hassan',
    avatar: 'https://i.pravatar.cc/40?img=47'
  },
]

const Feed = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [likedPosts, setLikedPosts] = useState([])
  const [postError, setPostError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [commentText, setCommentText] = useState({})
  const [showComments, setShowComments] = useState({})
  const [postComments, setPostComments] = useState({})

  const [mediaPreview, setMediaPreview] = useState(null)
  const [followedUsers, setFollowedUsers] = useState([])

  // ─── Load posts ───
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)

      const data = await getFeedPosts()

      const formatted = data.map((p) => ({
        id: p.id,

        user: {
          id: p.user?.id || p.user,
          name: p.user?.name || p.user_name,
          username: `@user${p.user?.id || p.user}`,
          avatar: p.user?.avatar || `https://i.pravatar.cc/40?img=${p.user?.id || p.user || 10}`
        },

        content: p.content,
        media: p.media_url ? { url: p.media_url, type: p.media_type } : null,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        time: new Date(p.created_at).toLocaleString(),

        original_post: p.original_post || null,
        original_post_content: p.original_post_content || null,
        original_post_media: p.original_post_media_url
          ? { url: p.original_post_media_url, type: p.original_post_media_type }
          : null,
        shared: Boolean(p.original_post),
        shared_post: p.original_post
          ? {
              id: p.original_post,
              user: { name: 'Original post', username: '' },
              content: p.original_post_content || '',
              media: p.original_post_media_url
                ? { url: p.original_post_media_url, type: p.original_post_media_type }
                : null,
              time: '',
            }
          : null,
        liked: Boolean(p.is_liked),
      }))

      setPosts(formatted)
      setLikedPosts(formatted.filter((post) => post.liked).map((post) => post.id))
      setLoading(false)
    }

    loadPosts()

    const stored = localStorage.getItem('ceema_user')

    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  // ─── Like ───
  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    const result = await likePost(postId)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: result.likes }
          : p
      )
    )

    setLikedPosts((prev) =>
      result.liked
        ? [...new Set([...prev, postId])]
        : prev.filter((id) => id !== postId)
    )
  }

  // ─── Share ───
  const handleShare = async (post) => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    const result = await sharePost(post.id)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    const p = result.post
    const sharedPost = {
      id: p.id,

      user: {
        id: user?.id,
        name: user?.name || user?.username,
        username: `@${user?.username || 'user'}`,
        avatar:
          user?.avatar ||
          'https://i.pravatar.cc/40?img=10'
      },

      content: '',
      media: null,
      likes: 0,
      comments: 0,
      time: new Date(p.created_at).toLocaleString(),

      shared: true,

      shared_post: {
        id: post.id,
        user: post.user,
        content: post.content,
        media: post.media,
        time: post.time
      }
    }

    setPosts((prev) => [sharedPost, ...prev])

    toast.success('Post shared!')
  }

  // ─── Delete ───
  const handleDelete = async (postId) => {
    const result = await deletePost(postId)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    setPosts((prev) =>
      prev.filter((p) => p.id !== postId)
    )

    toast.success('Post deleted')
  }

  // ─── Toggle comments ───
  const toggleComments = async (postId) => {
    const willOpen = !showComments[postId]
    setShowComments((prev) => ({
      ...prev,
      [postId]: willOpen
    }))
    if (willOpen && !postComments[postId]) {
      const comments = await getPostComments(postId)
      setPostComments((prev) => ({
        ...prev,
        [postId]: comments.map((comment) => ({
          id: comment.id,
          userId: comment.user,
          user: comment.user_name,
          text: comment.content,
        })),
      }))
    }
  }

  // ─── Add comment ───
  const handleComment = async (postId) => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    const text = commentText[postId]

    if (!text?.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    const result = await addComment(postId, text)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    const newComment = {
      id: result.comment.id,
      userId: result.comment.user,
      user: result.comment.user_name || user?.name || user?.username,
      text: result.comment.content,
    }

    setPostComments((prev) => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        newComment
      ]
    }))

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments + 1 }
          : p
      )
    )

    setCommentText({
      ...commentText,
      [postId]: ''
    })

    toast.success('Comment added')
  }

  const handleMediaUpload = (e) => {
    const file = e.target.files[0]

    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null
    const maxSize = type === 'video' ? 8 * 1024 * 1024 : 4 * 1024 * 1024
    if (!type || file.size > maxSize) {
      toast.error(type === 'video' ? 'Videos must be 8 MB or smaller' : 'Choose an image up to 4 MB or a video up to 8 MB')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setMediaPreview({ url: reader.result, type })
    reader.onerror = () => toast.error('Could not read that file')
    reader.readAsDataURL(file)
  }

  // ─── Create post ───
  const handlePost = async () => {
    if (!user) {
      toast.error('Please login to post')
      return
    }

    if (!newPost.trim() && !mediaPreview) {
      setPostError('Add text, an image, or a video')
      return
    }

    setSubmitting(true)
    setPostError('')

    const result = await createPost(newPost.trim(), null, mediaPreview)

    if (!result.success) {
      toast.error(result.message)
      setSubmitting(false)
      return
    }

    const p = result.post

    const newPostObj = {
      id: p.id,

      user: {
        id: user.id,
        name: user.name || user.username,
        username: `@${user.username || 'user'}`,
        avatar:
          user.avatar ||
          `https://i.pravatar.cc/40?img=${user.id || 10}`
      },

      content: p.content,
      media: p.media_url ? { url: p.media_url, type: p.media_type } : mediaPreview,
      likes: p.likes_count || 0,
      comments: p.comments_count || 0,
      time: 'Just now'
    }

    setPosts((prev) => [newPostObj, ...prev])

    setNewPost('')
    setMediaPreview(null)
    setSubmitting(false)

    toast.success('Post created!')
  }

  const handleFollow = async (userId) => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    const isFollowing = followedUsers.includes(userId)
    const result = isFollowing ? await unfollowUser(userId) : await followUser(userId)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    setFollowedUsers((prev) =>
      isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
    toast.success(isFollowing ? 'Unfollowed user' : 'Following user')
  }

  const handleDeleteComment = async (postId, commentId) => {
    const result = await deleteComment(commentId)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    setPostComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((comment) => comment.id !== commentId),
    }))
    setPosts((prev) =>
      prev.map((post) => post.id === postId
        ? { ...post, comments: Math.max(0, post.comments - 1) }
        : post)
    )
    toast.success('Comment deleted')
  }

  return (
    <Layout>
      <div className={styles.feedPage}>
        <div className={styles.inner}>

          {/* ─── Feed ─── */}
          <div className={styles.feedMain}>

            <h1 className={styles.pageTitle}>
              Community Feed
            </h1>

            {/* ─── Create Post ─── */}
            {user && (
              <div className={styles.newPostBox}>

                <img
                  src={
                    user.profile?.avatar_url ||
                    'https://i.pravatar.cc/40?img=10'
                  }
                  className={styles.newPostAvatar}
                  alt=""
                />

                <div className={styles.newPostRight}>

                  <textarea
                    className={styles.newPostInput}
                    placeholder="Share your thoughts about a movie..."
                    value={newPost}
                    onChange={(e) =>
                      setNewPost(e.target.value)
                    }
                    rows={3}
                  />

                  {/* Character Counter INSIDE */}
                  <div className={styles.counterInside}>
                    {newPost.length}/500
                  </div>

                  {mediaPreview && (
                    <div className={styles.mediaPreview}>
                      {mediaPreview.type === 'video' ? (
                        <video src={mediaPreview.url} className={styles.postVideo} controls />
                      ) : (
                        <img src={mediaPreview.url} className={styles.postImage} alt="Post preview" />
                      )}
                      <button type="button" className={styles.removeMediaBtn} onClick={() => setMediaPreview(null)}>
                        Remove
                      </button>
                    </div>
                  )}

                  {postError && (
                    <span className={styles.errorMsg}>
                      {postError}
                    </span>
                  )}

                  <div className={styles.newPostFooter}>

                    {/* Same Style Button */}
                    <label
                      className={styles.actionBtn}
                    >
                      <FaImage />
                      <span>Add Photo</span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                        hidden
                        onChange={handleMediaUpload}
                      />
                    </label>

                    <span className={styles.mediaHint}><FaVideo /> Short videos up to 8 MB</span>

                    <button
                      className={styles.postBtn}
                      onClick={handlePost}
                      disabled={submitting}
                    >
                      {submitting
                        ? 'Posting...'
                        : 'Post'}
                    </button>

                  </div>
                </div>
              </div>
            )}

            {/* ─── Loading ─── */}
            {loading ? (
              <p style={{ color: '#fff' }}>
                Loading posts...
              </p>
            ) : (
              <div className={styles.postsList}>

                {posts.map((post) => (

                  <div
                    key={post.id}
                    className={styles.postCard}
                  >

                    <div className={styles.postHeader}>

                      <img
                        src={post.user.avatar}
                        className={styles.postAvatar}
                        alt=""
                      />

                      <div className={styles.postUserInfo}>
                        <span>{post.user.name}</span>
                        <span>{post.user.username}</span>
                      </div>

                      <span className={styles.postTime}>
                        {post.time}
                      </span>

                    </div>

                    {/* Shared Post Style */}
                    {post.shared ? (
                      <div className={styles.sharedWrapper}>

                        <p className={styles.sharedText}>
                          Shared a post
                        </p>

                        <div className={styles.sharedPostCard}>

                          <div className={styles.postHeader}>

                            <img
                              src={post.shared_post.user.avatar || 'https://i.pravatar.cc/40?img=10'}
                              className={styles.postAvatar}
                              alt=""
                            />

                            <div className={styles.postUserInfo}>
                              <span>
                                {post.shared_post.user.name}
                              </span>

                              <span>
                                {post.shared_post.user.username}
                              </span>
                            </div>

                          </div>

                          <p className={styles.postContent}>
                            {post.shared_post.content}
                          </p>

                          {post.shared_post.media && (
                            post.shared_post.media.type === 'video' ? (
                              <video src={post.shared_post.media.url} className={styles.postVideo} controls />
                            ) : (
                              <img src={post.shared_post.media.url} className={styles.postImage} alt="" />
                            )
                          )}

                        </div>

                      </div>
                    ) : (
                      <>
                        <p className={styles.postContent}>
                          {post.content}
                        </p>

                        {post.media && (
                          post.media.type === 'video' ? (
                            <video src={post.media.url} className={styles.postVideo} controls preload="metadata" />
                          ) : (
                            <img src={post.media.url} className={styles.postImage} alt="" />
                          )
                        )}
                      </>
                    )}

                    {/* ─── Actions ─── */}
                    <div className={styles.postActions}>

                      <button
                        className={`${styles.actionBtn} ${likedPosts.includes(post.id) ? styles.actionLiked : ''}`}
                        onClick={() =>
                          handleLike(post.id)
                        }
                      >
                        <FaHeart />
                        <span>{post.likes}</span>
                      </button>

                      <button
                        className={styles.actionBtn}
                        onClick={() =>
                          toggleComments(post.id)
                        }
                      >
                        <FaComment />
                        <span>{post.comments}</span>
                      </button>

                      <button
                        className={styles.actionBtn}
                        onClick={() =>
                          handleShare(post)
                        }
                      >
                        <FaShare />
                        <span>Share</span>
                      </button>

                      {user?.id === post.user.id && (
                        <button
                          className={styles.actionBtn}
                          onClick={() =>
                            handleDelete(post.id)
                          }
                        >
                          <FaTrash />
                          <span>Delete</span>
                        </button>
                      )}

                    </div>

                    {/* ─── Comments ─── */}
                    {showComments[post.id] && (

                      <div className={styles.commentSection}>

                        {(postComments[post.id] || []).map((c) => (
                          <div
                            key={c.id}
                            className={styles.singleComment}
                          >
                            <strong>{c.user}</strong>
                            <p>{c.text}</p>
                            {(user?.id === c.userId || user?.role === 'admin') && (
                              <button
                                type="button"
                                className={styles.deleteCommentBtn}
                                onClick={() => handleDeleteComment(post.id, c.id)}
                                aria-label="Delete comment"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        ))}

                        <div className={styles.commentBox}>

                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={
                              commentText[post.id] || ''
                            }
                            onChange={(e) =>
                              setCommentText({
                                ...commentText,
                                [post.id]:
                                  e.target.value
                              })
                            }
                            className={styles.commentInput}
                          />

                          <button
                            className={styles.postBtn}
                            onClick={() =>
                              handleComment(post.id)
                            }
                          >
                            Comment
                          </button>

                        </div>

                      </div>
                    )}

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* ─── Sidebar ─── */}
          <aside className={styles.sidebar}>

            {/* Trending */}
            <div className={styles.sidebarCard}>

              <h3>Trending</h3>

              {TRENDING.map((t) => (
                <div
                  key={t.id}
                  className={styles.trendingItem}
                >
                  <span>{t.tag}</span>
                  <small>{t.posts}</small>
                </div>
              ))}

            </div>

            {/* Suggested */}
            <div className={styles.sidebarCard}>

              <h3>Suggested</h3>

              {SUGGESTED.map((u) => (

                <div
                  key={u.id}
                  className={styles.suggestedUser}
                >

                  <div className={styles.suggestedLeft}>

                    <img
                      src={u.avatar}
                      className={styles.suggestedAvatar}
                    />

                    <div>
                      <p>{u.name}</p>
                    </div>

                  </div>

                  {/* <button
                    className={styles.followBtn}
                    onClick={() =>
                      toast.success(
                        `You followed ${u.name}`
                      )
                    }
                  >
                    <FaUserPlus />
                    Follow
                  </button> */}

                <button
                  className={styles.followBtn}
                  onClick={() => handleFollow(u.id)}
                >
                  <FaUserPlus />
                  {followedUsers.includes(u.id) ? 'Following' : 'Follow'}
                </button>

                </div>
              ))}

              {/* Browse More */}
              {/* <button
                className={styles.postBtn}
                onClick={() =>
                  toast.info(
                    'Browse more users and communities'
                  )
                }
              >
                <FaCompass />
                <span> Browse More</span>
              </button> */}

              <button
                className={styles.postBtn}
                onClick={() => navigate('/browse-followers')}
              >
                <FaCompass />
                <span> Browse More</span>
              </button>

            </div>

          </aside>

        </div>
      </div>
    </Layout>
  )
}

export default Feed
