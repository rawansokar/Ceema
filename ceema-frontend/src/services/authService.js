import API from "../api/api";

export const login = async (email, password) => {
  try {
    const { data } = await API.post("/api/auth/login/", { email, password });

    // Store JWT tokens
    localStorage.setItem("ceema_access", data.access);
    localStorage.setItem("ceema_refresh", data.refresh);
    // Store user object (matches your existing ceema_user key)
    localStorage.setItem("ceema_user", JSON.stringify(data.user));

    return { success: true, user: data.user };
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.non_field_errors?.[0] ||
      "Invalid email or password";
    return { success: false, message };
  }
};

export const register = async (
  name,
  email,
  password,
  age = 18,
  preferred_genres = "general",
  mood_preference = "any"
) => {
  try {
    const { data } = await API.post("/api/auth/register/", {
      name,
      email,
      password,
      age,
      preferred_genres,
      mood_preference,
    });

    localStorage.setItem("ceema_access", data.access);
    localStorage.setItem("ceema_refresh", data.refresh);
    localStorage.setItem("ceema_user", JSON.stringify(data.user));

    return { success: true, user: data.user };

  } catch (error) {
    console.log("FULL ERROR:", error);
    console.log("RESPONSE DATA:", error.response?.data);

    return {
      success: false,
      message: JSON.stringify(error.response?.data) || "Registration failed",
    };
  }
};

export const logout = async () => {
  try {
    await API.post("/api/auth/logout/");
  } catch {
  } finally {
    localStorage.removeItem("ceema_access");
    localStorage.removeItem("ceema_refresh");
    localStorage.removeItem("ceema_user");
  }
};

// Get user by id — GET /api/users/{id}/
export const getUserById = async (id) => {
  try {
    const { data } = await API.get(`/api/users/${id}/`);
    return data;
  } catch {
    return null;
  }
};

// Get user profile — GET /api/users/{id}/profile/
export const getUserProfile = async (id) => {
  try {
    const { data } = await API.get(`/api/users/${id}/profile/`);
    return data;
  } catch {
    return null;
  }
};

// Update user — PATCH /api/users/{id}/
// Accepts: { name, email, age, preferred_genres, mood_preference }
export const updateUser = async (id, updates) => {
  try {
    const { data } = await API.patch(`/api/users/${id}/`, updates);
    // Sync updated user back to localStorage
    const stored = JSON.parse(localStorage.getItem("ceema_user") || "{}");
    localStorage.setItem("ceema_user", JSON.stringify({ ...stored, ...data }));
    return { success: true, user: data };
  } catch (error) {
    return { success: false, message: error.response?.data?.detail || "Update failed" };
  }
};

export const getUserFollowers = async (id) => {
  try {
    const { data } = await API.get(`/api/users/${id}/followers/`);
    return data;
  } catch {
    return [];
  }
};

export const getUserFollowing = async (id) => {
  try {
    const { data } = await API.get(`/api/users/${id}/following/`);
    return data;
  } catch {
    return [];
  }
};

export const followUser = async (id) => {
  try {
    const { data } = await API.post(`/api/users/${id}/follow/`);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.response?.data?.detail || "Follow failed" };
  }
};

export const unfollowUser = async (id) => {
  try {
    const { data } = await API.post(`/api/users/${id}/unfollow/`);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.response?.data?.detail || "Unfollow failed" };
  }
};

export const updateUserProfile = async (id, updates) => {
  try {
    const { data } = await API.patch(`/api/users/${id}/profile/`, updates);
    const stored = JSON.parse(localStorage.getItem("ceema_user") || "{}");
    const updated = {
      ...stored,
      profile: {
        ...(stored.profile || {}),
        ...data,
      },
    };
    localStorage.setItem("ceema_user", JSON.stringify(updated));
    return { success: true, profile: data, user: updated };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Profile update failed",
    };
  }
};

// Helper — get the currently logged-in user from localStorage
export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("ceema_user")) || null;
  } catch {
    return null;
  }
};

// Helper — is anyone logged in?
export const isAuthenticated = () => {
  return !!localStorage.getItem("ceema_access");
};














