import API from './api';

export const getProfiles = () =>
  API.get(`/api/profiles`).then(res => res.data);

export const createProfile = (formData) =>
  API.post(`/api/profiles`, formData);

export const deleteProfile = (name) =>
  API.post(`/api/delete`, { name });

export const launchProfile = (name, url, postContent) =>
  API.post(`/api/launch`, { name, url , postContent});


export const updateProfile = (id, data) => {
  API.put(`/api/profiles/${id}`, data);
}
