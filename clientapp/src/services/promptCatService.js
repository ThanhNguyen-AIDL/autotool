import API from './api';

export const getPromptCategories = () =>
  API.get(`/api/promptCategory`).then(res => res.data);

export const createPromptCategory = (formData) =>
  API.post(`/api/promptCategory`, formData);

export const deleteCategory = (id) =>
  API.delete(`/api/promptCategory/${id}`);

