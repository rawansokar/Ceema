import API from "../api/api";

// GET /api/news/
export const getAllNews = async () => {
  try {
    const { data } = await API.get("/api/news/");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// GET /api/news/{id}/
export const getNewsById = async (id) => {
  try {
    const { data } = await API.get(`/api/news/${id}/`);
    return data;
  } catch {
    return null;
  }
};

// GET /api/news/ filtered client-side by category
export const getNewsByCategory = async (category) => {
  try {
    const { data } = await API.get("/api/news/");
    if (!category) return Array.isArray(data) ? data : [];
    return (Array.isArray(data) ? data : []).filter(
      (n) => n.category?.toLowerCase() === category.toLowerCase()
    );
  } catch {
    return [];
  }
};

// GET /api/news/featured/
export const getFeaturedNews = async () => {
  try {
    const { data } = await API.get("/api/news/featured/");
    return data;
  } catch {
    return null;
  }
};












/// import API from "../api/api";

// // ─────────────────────────────────────────
// // NEWS SERVICE — Real API ✅
// // Base: https://ceema.onrender.com/api/news/
// // ─────────────────────────────────────────

// // GET /api/news/
// export const getAllNews = async () => {
//   try {
//     const { data } = await API.get("/api/news/");
//     return Array.isArray(data) ? data : [];
//   } catch {
//     return [];
//   }
// };

// // GET /api/news/{id}/
// export const getNewsById = async (id) => {
//   try {
//     const { data } = await API.get(`/api/news/${id}/`);
//     return data;
//   } catch {
//     return null;
//   }
// };

// // GET /api/news/?category=movies  (filter server-side if supported, else client-side)
// export const getNewsByCategory = async (category) => {
//   try {
//     const { data } = await API.get("/api/news/");
//     if (!category) return Array.isArray(data) ? data : [];
//     return (Array.isArray(data) ? data : []).filter(
//       (n) => n.category?.toLowerCase() === category.toLowerCase()
//     );
//   } catch {
//     return [];
//   }
// };

// // GET /api/news/featured/
// export const getFeaturedNews = async () => {
//   try {
//     const { data } = await API.get("/api/news/featured/");
//     return data;
//   } catch {
//     return null;
//   }
// };














// // import API from "../api/api";

// // // ─────────────────────────────────────────
// // // NEWS SERVICE
// // // ⚠️  The CEEMA API does not have a /api/news/ endpoint.
// // //
// // // This service maps to the nearest available resources:
// // //   - /api/reviews/    → movie reviews (used as "news" content)
// // //   - /api/recommendations/ → movie recommendations
// // //
// // // If the backend team adds /api/news/ later, replace the function
// // // bodies below — the exported function names stay the same so no
// // // pages need updating.
// // // ─────────────────────────────────────────

// // // Get all reviews (stand-in for news articles) — GET /api/reviews/
// // export const getAllNews = async () => {
// //   try {
// //     const { data } = await API.get("/api/reviews/");
// //     return data;
// //   } catch {
// //     return [];
// //   }
// // };

// // // Get a single review by id — GET /api/reviews/{id}/
// // export const getNewsById = async (id) => {
// //   try {
// //     const { data } = await API.get(`/api/reviews/${id}/`);
// //     return data;
// //   } catch {
// //     return null;
// //   }
// // };

// // // Filter reviews by rating (maps to "category" filter in the UI)
// // // e.g. getNewsByCategory("5") returns 5-star reviews
// // export const getNewsByCategory = async (category) => {
// //   try {
// //     const { data } = await API.get("/api/reviews/");
// //     if (!category) return data;
// //     return data.filter(
// //       (r) => String(r.rating) === String(category) ||
// //              r.comment?.toLowerCase().includes(category.toLowerCase())
// //     );
// //   } catch {
// //     return [];
// //   }
// // };

// // // Get all recommendations — GET /api/recommendations/
// // export const getRecommendations = async () => {
// //   try {
// //     const { data } = await API.get("/api/recommendations/");
// //     return data;
// //   } catch {
// //     return [];
// //   }
// // };

// // // Post a review — POST /api/reviews/
// // // Payload: { movie, rating (1-5), comment, course? }
// // export const postReview = async (movieId, rating, comment) => {
// //   try {
// //     const { data } = await API.post("/api/reviews/", {
// //       movie: movieId,
// //       rating,
// //       comment,
// //     });
// //     return { success: true, review: data };
// //   } catch (error) {
// //     return {
// //       success: false,
// //       message: error.response?.data?.detail || "Failed to submit review",
// //     };
// //   }
// // };
// // // import news from '../data/news.json'

// // // // ─────────────────────────────────────────
// // // // NEWS SERVICE
// // // // Currently using dummy data from news.json
// // // // ─────────────────────────────────────────
// // // // LATER — replace each function body with:
// // // // import axios from 'axios'
// // // // const BASE = import.meta.env.VITE_API_BASE_URL
// // // // ─────────────────────────────────────────

// // // // Get all news articles
// // // export const getAllNews = () => {
// // //   return news

// // //   // LATER:
// // //   // return axios.get(`${BASE}/news`)
// // // }

// // // // Get a single news article by id
// // // export const getNewsById = (id) => {
// // //   const article = news.find((n) => n.id === Number(id))
// // //   return article || null

// // //   // LATER:
// // //   // return axios.get(`${BASE}/news/${id}`)
// // // }

// // // // Get news by category
// // // export const getNewsByCategory = (category) => {
// // //   if (!category) return news
// // //   return news.filter(
// // //     (n) => n.category.toLowerCase() === category.toLowerCase()
// // //   )

// // //   // LATER:
// // //   // return axios.get(`${BASE}/news?category=${category}`)
// // // }
