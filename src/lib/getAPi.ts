import { browser } from '$app/environment';
import { PUBLIC_API_PORT } from '$env/static/public';
import axios from 'axios';
import { axiosFetch } from './utils';


let API = import.meta.env.VITE_API_URL;
export const port = import.meta.env.API_PORT || PUBLIC_API_PORT || 3788;
if (browser) {
	if (!API) API = `${window.location.protocol}//${window.location.hostname}:${port}`;
}
console.log('API', API, port);
export { API };
export const axiosInstance = axios.create({
	baseURL: API
});
export const api = {
	get: (path: string, ...args: any[]) => axiosFetch(axiosInstance.get, path, ...args),
	post: (path: string, ...args: any[]) => axiosFetch(axiosInstance.post, path, ...args)
};
// if (browser) window['api'] = api;
