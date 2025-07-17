import API from './api';

export const checkCooldown = (key) =>
  API.get(`/api/cooldown/${key}`).then(res => res.data);