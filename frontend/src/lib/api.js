import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.error("REACT_APP_BACKEND_URL is not configured; API calls will fail.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cognivio_token");
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (payload) => api.post("/api/auth/login", payload),
  register: (payload) => api.post("/api/auth/register", payload),
  me: () => api.get("/api/auth/me"),
};

export const teacherApi = {
  list: () => api.get("/api/teachers"),
  create: (payload) => api.post("/api/teachers", payload),
  get: (id) => api.get(`/api/teachers/${id}`),
  getPeerRecommendations: (id) =>
    api.get(`/api/teachers/${id}/peer-recommendations`),
};

export const videoApi = {
  upload: (formData) =>
    api.post("/api/videos/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (params) => api.get("/api/videos", { params }),
  status: (videoId) => api.get(`/api/videos/${videoId}/status`),
  detail: (videoId) => api.get(`/api/videos/${videoId}`),
};

export const assessmentApi = {
  list: (params) => api.get("/api/assessments", { params }),
  get: (id) => api.get(`/api/assessments/${id}`),
  roster: (params) => api.get("/api/roster", { params }),
  seedDemoData: () => api.post("/api/seed-demo-data"),
  teacherDashboard: (teacherId, params) =>
    api.get(`/api/teachers/${teacherId}/dashboard`, { params }),
  teacherSummaryInsights: (teacherId) =>
    api.get(`/api/teachers/${teacherId}/summary-insights`),
  teacherSummaryReflection: (teacherId) =>
    api.get(`/api/teachers/${teacherId}/summary-reflection`),
  saveTeacherSummaryReflection: (teacherId, payload) =>
    api.post(`/api/teachers/${teacherId}/summary-reflection`, payload),
};

export const scheduleApi = {
  list: (params) => api.get("/api/schedules", { params }),
  create: (payload) => api.post("/api/schedules", payload),
  update: (id, payload) => api.patch(`/api/schedules/${id}`, payload),
};

export const observationApi = {
  create: (payload) => api.post("/api/observations", payload),
  listForTeacher: (teacherId) =>
    api.get(`/api/teachers/${teacherId}/observations`),
  listForVideo: (videoId) =>
    api.get(`/api/videos/${videoId}/observations`),
  update: (id, payload) => api.patch(`/api/observations/${id}`, payload),
};

export default api;

