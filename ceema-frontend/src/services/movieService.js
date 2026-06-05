import API from "../api/api";

const placeholderPoster = "https://placehold.co/220x330/1a1a1a/cc0000?text=CEEMA";
const placeholderBackdrop = "https://placehold.co/1200x500/101010/cc0000?text=CEEMA";

export const normalizeMovie = (movie) => ({
  ...movie,
  poster: movie.poster || movie.poster_url || movie.image_url || placeholderPoster,
  backdrop:
    movie.backdrop_url ||
    movie.wide_poster_url ||
    movie.poster_url ||
    movie.image_url ||
    placeholderBackdrop,
  year: movie.release_year,
  titleAr: movie.title_ar || "",
  genre: Array.isArray(movie.genre)
    ? movie.genre
    : movie.genre
      ? String(movie.genre).split(",").map((g) => g.trim())
      : [],
});

const normalizeList = (movies) => (Array.isArray(movies) ? movies.map(normalizeMovie) : []);

export const getAllMovies = async (params = {}) => {
  try {
    const { data } = await API.get("/api/movies/", { params });
    return normalizeList(data);
  } catch (error) {
    console.error("Get movies error:", error);
    return [];
  }
};

export const getMovieById = async (id) => {
  try {
    const { data } = await API.get(`/api/movies/${id}/`);
    return normalizeMovie(data);
  } catch (error) {
    console.error("Get movie error:", error);
    return null;
  }
};

export const getMovieShowtimes = async (id) => {
  try {
    const { data } = await API.get("/api/showtimes/", { params: { movie: id } });
    return data;
  } catch (error) {
    console.error("Get movie showtimes error:", error);
    return [];
  }
};

export const getFeaturedMovie = async () => {
  try {
    const { data } = await API.get("/api/movies/featured/");
    return data?.[0] ? normalizeMovie(data[0]) : null;
  } catch (error) {
    console.error("Featured movie error:", error);
    const fallback = await getAllMovies({ featured: true });
    return fallback[0] || null;
  }
};

export const getCurrentMovies = async () => getNowPlayingMovies();

export const getMovieLibrary = async (params = {}) => {
  const movies = await getAllMovies({ ...params, in_cinemas: false });
  return movies.length ? movies : (await getAllMovies(params)).filter((m) => !m.is_in_cinemas);
};

export const searchMovies = async (query) => {
  try {
    const { data } = await API.get("/api/movies/search/", {
      params: { q: query },
    });
    return normalizeList(data);
  } catch (error) {
    console.error("Search movies error:", error);
    return [];
  }
};

export const searchMoviesAPI = searchMovies;

export const filterMovies = async ({ genre, rating, search, language, year } = {}) => {
  try {
    const params = {};
    if (genre && genre !== "All") params.genre = genre;
    if (language && language !== "All") params.language = language;
    if (year && year !== "All") params.year = year;
    if (rating) params.min_rating = rating;
    if (search) params.q = search;
    return getAllMovies(params);
  } catch (error) {
    console.error("Filter movies error:", error);
    return [];
  }
};

export const getAllShowtimes = async (params = {}) => {
  try {
    const { data } = await API.get("/api/showtimes/", { params });
    return data;
  } catch (error) {
    console.error("Get showtimes error:", error);
    return [];
  }
};

export const getShowtimeById = async (id) => {
  try {
    const { data } = await API.get(`/api/showtimes/${id}/`);
    return data;
  } catch (error) {
    console.error("Get showtime error:", error);
    return null;
  }
};

export const getHighestGrossingEgyptianMovies = async () => {
  try {
    const { data } = await API.get("/api/movies/highest-grossing-egyptian/");
    return normalizeList(data);
  } catch (error) {
    console.error("Get highest grossing Egyptian movies error:", error);
    return [];
  }
};

export const getHighestGrossingEgyptianMovie = async () => {
  const movies = await getHighestGrossingEgyptianMovies();
  return movies[0] || null;
};

export const getMoviesInCinemas = async () => {
  try {
    const { data } = await API.get("/api/movies/in-cinemas/");
    return normalizeList(data);
  } catch (error) {
    console.error("Get movies in cinemas error:", error);
    return [];
  }
};

export const getNowPlayingMovies = async () => {
  try {
    const { data } = await API.get("/api/movies/now-playing/");
    return normalizeList(data);
  } catch (error) {
    console.error("Now playing error:", error);
    return [];
  }
};

export const getMovieFilters = async () => {
  try {
    const { data } = await API.get("/api/movies/filters/");
    return data;
  } catch (error) {
    console.error("Get movie filters error:", error);
    return { genres: [], languages: [], years: [], cities: [] };
  }
};
