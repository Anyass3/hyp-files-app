import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';

export const debounced = (store, timeout = 100) => {
	let initialised = false;
	return derived(store, ($value, set) => {
		if (!initialised) {
			set($value);
			initialised = true;
			return;
		}
		const timeoutId = setTimeout(() => {
			set($value);
		}, timeout);

		return () => {
			clearTimeout(timeoutId);
		};
	});
};

export const debouncedStore = (initial_value, delay = 1000) => {
	const store = writable(initial_value);
	let timeout;
	let initialised = false;
	const { set: setValue, ...methods } = store;

	return {
		...methods,
		set($value) {
			if (timeout) clearTimeout(timeout);
			if (!initialised) {
				setValue($value);
				initialised = true;
				return;
			}
			timeout = setTimeout(() => {
				setValue($value);
				clearTimeout(timeout);
			}, delay);
		}
	};
};

export const hash = () => Math.floor(2147483648 * Math.random()).toString(36);

export const func = (...args) => null;

export const arrayRemove = (array: Array<any>, item) => {
	const temp = new Set(array);
	temp.delete(item);
	array = Array.from(temp);
	temp.clear();
	return array;
};
export function timedelta(date_string) {
	const round = (t, dsc) => `${Math.floor(t)} ${dsc} ago`;
	let text = 'just now';
	const now = new Date();
	const datetime = new Date(date_string);
	const seconds = (now.getTime() - datetime.getTime()) / 1000; //in seconds

	if (seconds <= -1) {
		return;
	}

	const mins = seconds / 60;
	const hrs = mins / 60;
	const days = hrs / 24;
	const weeks = days / 7;
	if (weeks >= 4) {
		text = `${datetime.getDate()}`;
		const months = weeks / 4;
		const years = months / 12;
		if (months > 1 && months < 13) {
			text = round(months, 'months');
		} else {
			let dsc = 'year';
			if (years >= 2) {
				dsc = 'years';
			}
			text = round(years, dsc);
		}
	} else if (weeks >= 2) {
		text = round(weeks, 'weeks');
	} else if (days >= 2) {
		text = round(days, 'days');
	} else if (hrs >= 2) {
		text = round(hrs, 'hours');
	} else if (mins >= 2) {
		text = round(mins, 'minutes');
	}
	return text;
}
