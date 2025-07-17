import API from './api';

export const getLogNames = () =>
  API.get(`/api/logs/`).then(res => res.data);

export const getLogsByName = (name) =>{
    const filename = encodeURIComponent(name);
    return API.get(`/api/logs/view?file=${filename}`).then(res => res.data);
}

