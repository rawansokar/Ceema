import API from "../api/api";

// ─────────────────────────────────────────
// FEED / POSTS
// ─────────────────────────────────────────

// Get all posts
export const getFeedPosts = async () => {
  try {
    const { data } = await API.get("/api/posts/");

    return data.map((post) => ({
      id: post.id,
      user: {
        id: post.user,
        name: post.user_name,
        avatar: post.user_avatar,
      },
      content: post.content,
      media_url: post.media_url,
      media_type: post.media_type,
      original_post: post.original_post,
      original_post_content: post.original_post_content,
      original_post_media_url: post.original_post_media_url,
      original_post_media_type: post.original_post_media_type,
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      is_liked: Boolean(post.is_liked),
    }));
  } catch (error) {
    console.error("getFeedPosts error:", error);
    return [];
  }
};

// Get single post (FIXED normalization)
export const getPostById = async (id) => {
  try {
    const { data } = await API.get(`/api/posts/${id}/`);

    return {
      id: data.id,
      user: {
        id: data.user,
        name: data.user_name,
      },
      content: data.content,
      media_url: data.media_url,
      media_type: data.media_type,
      original_post: data.original_post,
      original_post_content: data.original_post_content,
      created_at: data.created_at,
      likes_count: data.likes_count || 0,
      comments_count: data.comments_count || 0,
    };
  } catch (error) {
    return null;
  }
};

// Create post
export const createPost = async (content, originalPostId = null, media = null) => {
  try {
    const { data } = await API.post("/api/posts/", {
      content,
      original_post: originalPostId,
      media_url: media?.url || "",
      media_type: media?.type || "",
    });

    return {
      success: true,
      post: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to create post",
    };
  }
};

// Like post (FIXED)
export const likePost = async (postId) => {
  try {
    const { data } = await API.post(`/api/posts/${postId}/like/`);

    return {
      success: true,
      likes:
        data.likes_count ??
        data.likes ??
        0,
      liked: Boolean(data.liked),
      post: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to like post",
    };
  }
};

// Share post
export const sharePost = async (postId) => {
  try {
    const { data } = await API.post(`/api/posts/${postId}/share/`);

    return {
      success: true,
      post: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to share post",
    };
  }
};

// Comments
export const getPostComments = async (postId) => {
  try {
    const { data } = await API.get(`/api/posts/${postId}/comments/`);
    return data;
  } catch {
    return [];
  }
};

export const addComment = async (postId, content) => {
  try {
    const { data } = await API.post(`/api/posts/${postId}/comments/`, {
      content,
    });

    return {
      success: true,
      comment: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to add comment",
    };
  }
};

export const deleteComment = async (commentId) => {
  try {
    await API.delete(`/api/comments/${commentId}/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to delete comment",
    };
  }
};

// Delete post
export const deletePost = async (postId) => {
  try {
    await API.delete(`/api/posts/${postId}/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to delete post",
    };
  }
};
