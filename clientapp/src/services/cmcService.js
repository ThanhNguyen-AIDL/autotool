import API from './api';

export const postArticleCMC = (data) =>
  API.post(`/api/task/postcmc`, data);