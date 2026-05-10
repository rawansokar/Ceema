import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ceema.onrender.com";

// ─────────────────────────────────────────
// MAIN AXIOS INSTANCE
// ─────────────────────────────────────────

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────
// REQUEST INTERCEPTOR (ADD TOKEN)
// ─────────────────────────────────────────

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ceema_access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────
// REFRESH SYSTEM
// ─────────────────────────────────────────

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });

  failedQueue = [];
};

// ─────────────────────────────────────────
// RESPONSE INTERCEPTOR
// ─────────────────────────────────────────

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const requestURL = originalRequest?.url || "";

    // Skip auth endpoints
    const isAuthRoute =
      requestURL.includes("/api/auth/login/") ||
      requestURL.includes("/api/auth/register/") ||
      requestURL.includes("/api/auth/refresh/");

    // ───────────────────────────────
    // HANDLE 401
    // ───────────────────────────────

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      // queue requests if refreshing already
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("ceema_refresh");

      if (!refreshToken) {
        logoutUser();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = data?.access;

        if (!newAccessToken) {
          throw new Error("No access token returned");
        }

        // save token
        localStorage.setItem("ceema_access", newAccessToken);

        // update header
        API.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return API(originalRequest);
      } catch (err) {
        console.error("Refresh token failed:", err);
        processQueue(err, null);
        logoutUser();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// LOGOUT HELPER
// ─────────────────────────────────────────

const logoutUser = () => {
  localStorage.removeItem("ceema_access");
  localStorage.removeItem("ceema_refresh");
  localStorage.removeItem("ceema_user");
};

// ─────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────

export default API;




// import axios from "axios";



// const API = axios.create({
//   baseURL: "https://ceema.onrender.com",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });


// API.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("ceema_access");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ─────────────────────────────────────────
// // RESPONSE INTERCEPTOR
// // Auto refresh expired access token
// // ─────────────────────────────────────────

// let isRefreshing = false;
// let failedQueue = [];

// // Process queued requests after refresh
// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });

//   failedQueue = [];
// };

// API.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     const originalRequest = error.config;

//     // Safe URL check
//     const requestURL = originalRequest?.url || "";

//     // Skip auth endpoints
//     const isAuthRoute =
//       requestURL.includes("/api/auth/login/") ||
//       requestURL.includes("/api/auth/register/") ||
//       requestURL.includes("/api/auth/refresh/");

//     // ─────────────────────────────────────
//     // Handle 401 Unauthorized
//     // ─────────────────────────────────────

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !isAuthRoute
//     ) {
//       // If refresh already happening
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             return API(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       const refreshToken = localStorage.getItem("ceema_refresh");

//       // No refresh token → logout
//       if (!refreshToken) {
//         localStorage.removeItem("ceema_access");
//         localStorage.removeItem("ceema_refresh");
//         localStorage.removeItem("ceema_user");

//         isRefreshing = false;

//         return Promise.reject(error);
//       }

//       try {
//         // Refresh token request
//         const { data } = await axios.post(
//           "https://ceema.onrender.com/api/auth/refresh/",
//           {
//             refresh: refreshToken,
//           }
//         );

//         // Backend should return access token
//         const newAccessToken = data.access;

//         // Safety check
//         if (!newAccessToken) {
//           throw new Error("No access token returned from refresh endpoint");
//         }

//         // Save new access token
//         localStorage.setItem("ceema_access", newAccessToken);

//         // Update axios default header
//         API.defaults.headers.common.Authorization =
//           `Bearer ${newAccessToken}`;

//         // Process queued requests
//         processQueue(null, newAccessToken);

//         // Retry original request
//         originalRequest.headers.Authorization =
//           `Bearer ${newAccessToken}`;

//         return API(originalRequest);

//       } catch (refreshError) {
//         console.error("REFRESH TOKEN ERROR:", refreshError);

//         processQueue(refreshError, null);

//         // Logout on refresh failure
//         localStorage.removeItem("ceema_access");
//         localStorage.removeItem("ceema_refresh");
//         localStorage.removeItem("ceema_user");

//         return Promise.reject(refreshError);

//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );



// export default API;
