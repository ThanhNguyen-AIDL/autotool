import API from './api';
 
export const postArticleSSL = (data) =>
  API.post(`/api/task/postssl`, data); 

export const signupSSLAccount = (payload = {}) =>
  API.post(`/api/task/signupssl`, payload).then(res => res.data);
