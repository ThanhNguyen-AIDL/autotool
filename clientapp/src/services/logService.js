import API from './api';

export const getLogNames = () =>
  API.get(`/api/logs/`).then(res => res.data);

export const getLogsByName = (name, page = 1, limit = 100) => {
  const filename = encodeURIComponent(name);
  const params = new URLSearchParams({ file: filename, page, limit });
  return API.get(`/api/logs/view?${params.toString()}`).then(res => res.data);
};
