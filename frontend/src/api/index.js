import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Attach token automatically
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('lm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const verifyOtp = (data) => API.post('/auth/verify-otp', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const getProfile = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/me', data);

// Psychometric
export const getQuestions = () => API.get('/psychometric/questions');
export const submitAssessment = (answers) => API.post('/psychometric/submit', { answers });
export const submitAssessmentV2 = (payload) => API.post('/psychometric/submit-v2', payload);

// Recommendation
export const getRecommendation = () => API.get('/recommendation/my');
export const getRoadmap = (key) => API.get(`/recommendation/roadmap/${key}`);

// Chatbot
export const sendChatMessage = (message, language = 'en', parent_mode = false) =>
    API.post('/chatbot/message', { message, language, parent_mode });

// Opportunities
export const getOpportunities = (domain = '', type = '') =>
    API.get('/opportunities', { params: { domain, type } });

export const getAIOpportunities = (stream = '', education_level = '', type = '') =>
    API.get('/opportunities/ai', { params: { stream, education_level, type } });

// Job Market Intelligence
export const getJobRoles = (tags = '') => API.get('/jobmarket/roles', { params: { tags } });
export const getJobRolesByDomain = (domain = '') => API.get('/jobmarket/roles', { params: { domain } })
export const getJobDomains = () => API.get('/jobmarket/domains');

export default API;
