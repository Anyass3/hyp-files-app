import type { AxiosInstance } from 'axios';

export const is_array = (arr: any) => {
	if (!arr) return false;
	return Array.isArray(arr) || NodeList === arr.__proto__.constructor;
};
export const is_html = (el: any, arr = true) => {
	if (!el) return false;
	const is_html = (e: any) => e.__proto__.constructor.toString().includes('HTML');
	if (arr) {
		if (!is_array(el)) el = [el];
		return is_html(el[0]);
	} else return is_html(el);
};

export const getHash = () => {
	return Math.floor(2147483648 * Math.random()).toString(36);
};

export const destroyFns = (...args: (() => void)[]) => {
	return () =>
		args.forEach((fn) => {
			if (fn) fn();
		});
};
export const truncate = (text = '', max = 20) => {
	// console.log('truncate', text);
	const len = text.length;
	const r = /(.+)\.([\w]+)$/.exec(text);

	if (r) {
		const dots = len > max ? '...' : '.';
		return r[1].slice(0, max) + dots + r[2];
	}
	text = text.slice(0, max);
	return len > max ? text + '...' : text;
};
export const doubleTap = <F extends any>(func: F, timeout = 400): F => {
	//using this for double click and tap
	//because there's none for double tap
	//only for double click which is not fired in touch screens
	// so should work for both
	let doubleTaped = 0 as any;
	return ((...args: any[]) => {
		if (doubleTaped === 0) {
			doubleTaped = 1;
			doubleTaped = setTimeout(() => (doubleTaped = 0), timeout);
		} else {
			doubleTaped = 0;
			(func as Function)(...args);
		}
	}) as F;
};
export const copyToClipboard = async (text: string) => {
	if (!text) return false;
	if (navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (error) {
			//
			console.error(error);
		}
	}
	try {
		const input = document.createElement('textarea');
		input.innerHTML = text;
		document.body.appendChild(input);
		input.select();
		const copied = document.execCommand('copy');
		document.body.removeChild(input);
		console.log(copied);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

const gb = 1073741824;

const mb = 1048576;

const kb = 1024;
export const getSize = (size: number) => {
	if (size >= gb) return (size / gb).toFixed(1) + ' GB';
	else if (size >= mb) return (size / mb).toFixed(1) + ' MB';
	else if (size >= kb) return (size / kb).toFixed(1) + ' KB';
	else return size + ' Bytes';
};

const intersectingFunc = (() => { }) as (
	node?: HTMLElement,
	entry?: IntersectionObserverEntry,
	observer?: IntersectionObserver
) => void;

export const InterObserver = (
	node: HTMLElement,
	{
		options = {},
		isIntersecting = intersectingFunc,
		notIntersecting = intersectingFunc,
		cls = '',
		unobserve = true
	} = {}
) => {
	const observer = new IntersectionObserver((entries, myObserver) => {
		entries.forEach((entry) => {
			// console.log('entry.intersectionRatio', entry.intersectionRatio);
			if (entry.isIntersecting) {
				isIntersecting(node, entry, myObserver);
				if (cls) {
					node.classList.add(cls);
				}
			} else {
				notIntersecting(node, entry, myObserver);
				if (cls) {
					node.classList.remove(cls);
				}
			}
		});
	}, options);
	if (unobserve) observer.observe(node);
	return {
		destroy() {
			observer.unobserve(node);
		}
	};
};

export const NavInterObserver = (node: HTMLElement, cls = 'nav-intersecting') => {
	const navBar = document.querySelector('#nav-md');
	const navSm = document.querySelector('#nav-sm');

	const isIntersecting = () => {
		navBar?.classList.remove(cls);
		navSm?.classList.remove(cls);
	};
	const notIntersecting = () => {
		navBar?.classList.add(cls);
		navSm?.classList.add(cls);
	};

	InterObserver(node, {
		options: { rootMargin: '-5% 0% 0% 0%' },
		isIntersecting,
		notIntersecting
	});
};

export const getDataElement = (el: HTMLElement | null): HTMLElement | null => {
	if (!el) return el;
	if (el?.dataset?.data) return el;
	return getDataElement(el?.parentElement);
}

export const axiosFetch = async (instance: AxiosInstance, path: string, ...args: any[]) => {
	console.log('axiosFetch', path);
	try {
		const res = await instance(path, ...args);
		console.log('res', res)
		return { status: res.status, ok: true, headers: res.headers, body: res.data };
	} catch (error: any) {
		return {
			status: error.response?.status ?? 404,
			ok: false,
			headers: error.response?.headers,
			body: error.response?.data
		};
	}
};

export const toQueryString = (obj = {}) => {
	const queryString = '';
	try {
		return Object.entries(obj)
			.reduce((q, arr) => `${q}&${arr.join('=')}`, queryString)
			.replace(/^&/, '?');
	} catch (_) {
		return queryString;
	}
};

/**
 * Get's exact position of event.
 *
 * @param {Object} e The event passed in
 * @return {Object} Returns the x and y position
 */
export const getPosition = (e: any) => {
	const pos = { x: 0, y: 0 };

	if (!e) e = window.event;

	// if (e.pageX || e.pageY) {
	// 	pos.x = e.pageX;
	// 	pos.y = e.pageY;
	// } else if (e.clientX || e.clientY) {
	// 	pos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	// 	pos.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	// }
	pos.x = e.clientX;
	pos.y = e.clientY;

	return pos;
};
export const clickOutside = <F extends () => void>(
	node: HTMLElement,
	[fn, { resize = false, scroll = true } = {}]: [
		fn: F,
		options?: { resize?: boolean; scroll?: boolean }
	]
) => {

	const isOutside = (e: Event) => {
		if (node && !node.contains(e.target as Node) && !e.defaultPrevented) {
			fn();
		}
	};


	document.body.addEventListener('click', isOutside, true);
	if (scroll) window.addEventListener('scroll', isOutside);
	if (resize) window.addEventListener('resize', isOutside);
	return {
		destroy() {
			if (resize) window.removeEventListener('resize', isOutside);
			document.body.removeEventListener('click', isOutside, true);
			if (scroll) window.removeEventListener('scroll', isOutside);
		}
	};
};
type PaganationFetcher = (opts: { limit: number; offset: number }, ...args: any) => void;
export class Pagination {
	limit: number;
	page: number;
	total: number;

	constructor({
		total = 0,
		limit = 100,
		page = 0
	}: {
		total: number;
		limit?: number;
		page?: number;
	}) {
		this.limit = limit;
		this.page = page;
		this.total = total;
	}
	get pages(): number {
		return Math.ceil(this.total / this.limit);
	}
	get offset(): number {
		return ((this.page || 1) - 1) * this.limit;
	}
	get has_next(): boolean {
		return this.page < this.pages;
	}
	get has_prev(): boolean {
		return this.page > 1;
	}
	get page_count(): number {
		return this.page < this.pages ? this.limit : this.total - this.limit * ((this.page || 1) - 1);
	}
	next(): void {
		if (this.has_next) {
			this.page++;
			console.log('page_count', this.page_count);
		}
	}
	prev(): void {
		if (this.has_prev) {
			this.page--;
		}
	}
}
