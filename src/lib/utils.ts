export const is_array = (arr) => {
	if (!arr) return false;
	//@ts-ignore
	return Array.isArray(arr) || NodeList === arr.__proto__.constructor;
};
export const is_html = (el, arr = true) => {
	if (!el) return false;
	const is_html = (e) => e.__proto__.constructor.toString().includes('HTML');
	if (arr) {
		if (!is_array(el)) el = [el];
		return is_html(el[0]);
	} else return is_html(el);
};

export const debounce = (fn: CallableFunction, delay = 5000) => {
	let timeout;
	return (...args) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn(...args);
		}, delay);
	};
};

export const throttle = (fn: CallableFunction, delay = 5000) => {
	let record = 0;
	return (...args) => {
		const now = new Date().getTime();
		if (now - record < delay) return;
		record = now;
		return fn(...args);
	};
};

export const getHash = () => {
	return Math.floor(2147483648 * Math.random()).toString(36);
};

export const destroyFns = (...args) => {
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
export const doubleTap = (func, timeout = 400) => {
	//using this for double click and tap
	//because there's none for double tap
	//only for double click which is not fired in touch screens
	// so should work for both
	let doubleTaped = 0 as any;
	return (...args) => {
		if (doubleTaped === 0) {
			doubleTaped = 1;
			doubleTaped = setTimeout(() => (doubleTaped = 0), timeout);
		} else {
			doubleTaped = 0;
			func(...args);
		}
	};
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

const intersectingFunc = (node, entry, observer) => {};

export const InterObserver = (
	node,
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

export const NavInterObserver = (node, cls = 'nav-intersecting') => {
	const navBar = document.querySelector('#nav-md');
	const navSm = document.querySelector('#nav-sm');

	const isIntersecting = (...args) => {
		navBar.classList.remove(cls);
		navSm.classList.remove(cls);
	};
	const notIntersecting = (...args) => {
		navBar.classList.add(cls);
		navSm.classList.add(cls);
	};

	InterObserver(node, {
		options: { rootMargin: '-5% 0% 0% 0%' },
		isIntersecting,
		notIntersecting
	});
};

export const accordion = (node) => {
	if (screen.availWidth < 768) {
		const accordionNode = document.querySelector(node.dataset.target);
		accordionNode.style.display = 'block !important';
		accordionNode.style.maxHeight = '0';
		accordionNode.style.overflow = 'hidden';
		accordionNode.style.transition = 'max-height 0.3s ease-in-out';
		node.addEventListener('click', () => {
			const accordionNode = document.querySelector(node.dataset.target);
			if (!accordionNode.classList.contains('show')) {
				accordionNode.style.maxHeight = '50rem';
				accordionNode.classList.add('show');
				node.dataset.accordion = 'active';
			} else {
				accordionNode.style.maxHeight = '0';
				accordionNode.classList.remove('show');
				node.dataset.accordion = 'not-active';
			}
		});
	}
};

export const axiosFetch = async (instance, path: string, ...args) => {
	// console.log('axiosFetch', path);
	try {
		const res = await instance(path, ...args);
		return { status: res.status, ok: true, headers: res.headers, body: res.data };
	} catch (error) {
		return {
			status: error.response.status,
			ok: false,
			headers: error.response.headers,
			body: error.response.data
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
export const getPosition = (e) => {
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
	node,
	[fn, { resize = false, scroll = true } = {}]: [
		fn: F,
		options?: { resize?: boolean; scroll?: boolean }
	]
) => {
	const isOutside = (ev) => {
		const el = ev.path?.find((el) => el === node);
		if (!el) {
			fn();
		}
	};

	document.body.addEventListener('click', isOutside);
	if (scroll) window.addEventListener('scroll', isOutside);
	if (resize) window.addEventListener('resize', isOutside);
	return {
		destroy() {
			if (resize) window.removeEventListener('resize', isOutside);
			document.body.removeEventListener('click', isOutside);
			if (scroll) window.removeEventListener('scroll', isOutside);
		}
	};
};
type PaganationFetcher = (opts: { limit: number; offset: number }, ...args) => void;
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

export const gotoExtenal = (href) => {};

export const Q = ($q: string | Node, __query__: HTMLBaseElement | Document = document) => {
	const clean = (q, m = false) => {
		if (is_array(q)) q = q.toString();
		else if (typeof q !== 'string') return q;
		let all = false;
		if (q[0] === '*') {
			q = q.slice(1);
			all = true;
		}
		q = q.split(',').reduce((arr, q) => {
			return [...arr, q.trim()];
		}, []);
		q = q.length === 1 ? q[0] : q;
		return m ? [q, all] : q;
	};
	let html;
	let many = is_array($q);
	if (is_html($q)) {
		//@ts-ignore
		html = $q;
	} else {
		let queryer,
			[query, all] = clean($q, true);
		queryer = (q) => (all ? __query__.querySelectorAll(q) : __query__.querySelector(q));
		//if query is list it will query the list items
		many = all;
		if (is_array(query)) {
			html = query.reduce((arr, q) => {
				if (all) return [...arr, ...queryer(q)];
				return [...arr, queryer(q)];
			}, []);
			many = true;
		} else html = queryer(query);
	}
	//@ts-ignore
	const arr: Array<any> = Array.from(many ? html : [html]);
	return {
		html,
		arr,

		index(e: Node) {
			const index = this.arr.indexOf(e);
			return index >= 0 ? index : new Error('cannot find index of arg');
		},
		addClass(cls: Array<string> | string) {
			return this.$run((e, c) => {
				if (c.trim()) e.classList.add(c);
			}, cls);
		},
		hasClass(cls, { someClass = false, someEl = false } = {}) {
			const check = (e, cl) => e.classList.contains(cl);
			return this.$runBool(check, cls, { someArr: someClass, someEl });
		},
		rmClass(cls: Array<string> | string) {
			return this.$run((e: HTMLElement, c: string) => {
				if (c.trim()) e.classList.remove(c);
			}, cls);
		},
		run(func: Function) {
			this.arr.forEach(func);
			return this;
		},
		$run(func: Function, arr) {
			arr = clean(arr);
			if (!is_array(arr)) arr = [arr];
			arr.forEach((i) => this.run((e) => func(e, i)));
			return this;
		},
		$runBool(func: Function, arr, { someArr = false, someEl = false } = {}) {
			// returns a boolean
			if (!is_array(arr)) arr = [arr];
			const to_run = (i) =>
				someEl ? this.arr.some((e) => func(e, i)) : this.arr.every((e) => func(e, i));
			return someArr ? arr.some(to_run) : arr.every(to_run);
		},
		//some-events
		on(events: Array<string> | string, func: Function) {
			return this.$run((e, event: string) => {
				e.addEventListener(event, func);
			}, events);
		},
		off(events: Array<string> | string, func: Function) {
			return this.$run((e, event: string) => {
				e.removeEventListener(event, func);
			}, events);
		},
		click(func: Function) {
			return this.on('click', func);
		},
		css(prop, value, imp = false) {
			return this.run((e) => {
				e.style.setProperty(prop, value, imp ? 'important' : '');
			});
		},
		rmCss(props) {
			return this.$run((e, prop) => {
				e.style.removeProperty(prop);
			}, props);
		}
	};
};
