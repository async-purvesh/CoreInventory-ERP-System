import client from './client'

export const loginApi        = (data) => client.post('/auth/login', data)
export const registerApi     = (data) => client.post('/auth/register', data)
export const getMeApi        = ()     => client.get('/auth/me')
export const updateMeApi     = (data) => client.put('/auth/me', data)
