import axios from 'axios';

function normalizeId(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(normalizeId);
  }

  const normalized = { ...obj };

  if (normalized.id !== undefined && normalized._id === undefined) {
    normalized._id = normalized.id;
  }

  for (const key in normalized) {
    if (normalized[key] && typeof normalized[key] === 'object') {
      normalized[key] = normalizeId(normalized[key]);
    }
  }

  return normalized;
}

// base URL .env se aata hai (dev/prod alag)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // cookies bhejne ke liye
});

// Har response automatically normalize ho jati hai
axiosInstance.interceptors.response.use((response) => {
  if (response.data) {
    response.data = normalizeId(response.data);
  }
  return response;
});

export default axiosInstance;