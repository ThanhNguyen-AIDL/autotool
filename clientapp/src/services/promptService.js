import API from './api';

export const getPromptList = (filter) =>
  API.get(`/api/prompts?category=${filter}`).then(res => res.data);

export const createPrompt = (formData) =>
  API.post(`/api/prompts`, formData);

export const deletePrompt = (id) =>
  API.delete(`/api/prompts/${id}`);

