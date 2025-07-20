import API from './api';

export const getPromptList = (filter, owner) =>
  API.get(`/api/prompts?category=${filter}&owner=${owner}`).then(res => res.data);

export const createPrompt = (formData) =>
  API.post(`/api/prompts`, formData);

export const deletePrompt = (id) =>
  API.delete(`/api/prompts/${id}`);

