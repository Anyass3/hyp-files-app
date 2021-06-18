import { browser } from '$app/env';
import axios from 'axios';
import { axiosFetch } from './utils';

export const axiosInstance = axios.create({
	baseURL: '/_api'
});
export const api = {
	get: (path: string, ...args) => axiosFetch(axiosInstance.get, path, ...args),
	post: (path: string, ...args) => axiosFetch(axiosInstance.post, path, ...args)
};
if (browser) window['api'] = api;
