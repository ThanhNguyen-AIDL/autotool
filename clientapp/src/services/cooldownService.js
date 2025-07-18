import API from './api';

/** Check if a category on a PC can run */
export const checkCooldown = (category, pcName) =>
  API.get(`/api/cooldown/check`, {
    params: { category, pcName }
  }).then(res => res.data);

/** Get all cooldown configs for a specific PC */
export const getCooldowns = (pcName) =>
  API.get('/api/cooldown', {
    params: { pcName }
  }).then(res => res.data);

/** Sync cooldowns for all categories for a given PC */
export const syncCooldowns = (pcName) =>
  API.get('/api/cooldown/sync', {
    params: { pcName }
  });

/** Update cooldown config by ID */
export const updateCooldown = (id, data) =>
  API.put(`/api/cooldown/${id}`, data).then(res => res.data);

/** Delete a cooldown config by ID */
export const deleteCooldown = (id) =>
  API.delete(`/api/cooldown/${id}`).then(res => res.data);
