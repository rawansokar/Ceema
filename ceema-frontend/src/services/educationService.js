import API from "../api/api";

// ─────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────

export const getAllCourses = async () => {
  try {
    const { data } = await API.get("/api/courses/");
    return data;
  } catch (error) {
    console.error("getAllCourses error:", error);
    return [];
  }
};

export const getCourseById = async (id) => {
  try {
    const { data } = await API.get(`/api/courses/${id}/`);
    return data;
  } catch {
    return null;
  }
};

export const createCourse = async (payload) => {
  try {
    const { data } = await API.post("/api/courses/", payload);
    return { success: true, course: data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to create course",
    };
  }
};

export const enrollCourse = async (id) => {
  try {
    const { data } = await API.post(`/api/courses/${id}/enroll/`);
    return { success: true, course: data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Enroll failed",
    };
  }
};

export const unenrollCourse = async (id) => {
  try {
    const { data } = await API.post(`/api/courses/${id}/unenroll/`);
    return { success: true, course: data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || "Unenroll failed",
    };
  }
};




// import API from "../api/api";

// // ───────────────
// // COURSES
// // ───────────────

// export const getAllCourses = async () => {
//   try {
//     const { data } = await API.get("/api/courses/");
//     return data;
//   } catch {
//     return [];
//   }
// };

// export const getCourseById = async (id) => {
//   try {
//     const { data } = await API.get(`/api/courses/${id}/`);
//     return data;
//   } catch {
//     return null;
//   }
// };

// export const enrollCourse = async (courseId) => {
//   try {
//     const { data } = await API.post(`/api/courses/${courseId}/enroll/`);
//     return { success: true, course: data };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.detail || "Enrollment failed",
//     };
//   }
// };

// export const unenrollCourse = async (courseId) => {
//   try {
//     const { data } = await API.post(`/api/courses/${courseId}/unenroll/`);
//     return { success: true, course: data };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.detail || "Unenroll failed",
//     };
//   }
// };