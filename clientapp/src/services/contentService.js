import API from './api';

export const getContent = (promt) =>
  API.post(`/api/content`, { promt });