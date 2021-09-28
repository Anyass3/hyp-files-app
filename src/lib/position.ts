import store from '$store';

const getLimits = (m) => {
	const l1 = (innerWidth - m) / 2;
	const l2 = (innerWidth + m) / 2;
	return { l1, l2 };
};

export default (menu, hide: (ev?) => void = (ev?) => {}) => {
	/**
	 * Positions the menu properly.
	 *
	 * @param
	 */
	const pos: { x: number; y: number } = store.g('pos').get();

	const main = document.querySelector('div#main');

	const parent = document.getElementById('files');
	let dimention = { x: 0, y: 0 };
	let menuPos = { x: 0, y: 0 };
	dimention.x = menu?.offsetWidth || 0;
	dimention.y = menu?.offsetHeight || 0;

	const parentWidth = parent?.offsetWidth || 0;
	const parentHeight = window.innerHeight;
	//X
	const limits = getLimits(parentWidth);
	if (pos.x + 3 + 200 < limits.l2) {
		menuPos.x = pos.x + 3;
	} else if (limits.l1 < pos.x - 3 - 200) {
		menuPos.x = pos.x - 3 - 200;
	}

	//Y
	if (pos.y - 5 - dimention.y > 50) {
		menuPos.y = pos.y - 5 - dimention.y;
	} else if (parentHeight > pos.y + 5 + dimention.y) {
		menuPos.y = Math.max(pos.y + 5, 50);
	}

	menu.style.left = menuPos.x + 'px';
	menu.style.top = menuPos.y + 'px';
	const hideMenu = (ev) => {
		if (ev.keyCode === 27 || ev.type !== 'keyup') {
			hide(ev);
		}
	};
	main.addEventListener('click', hideMenu);
	window.addEventListener('keyup', hideMenu);
	window.addEventListener('resize', hideMenu);
	return {
		destroy() {
			window.removeEventListener('keyup', hideMenu);
			window.removeEventListener('resize', hideMenu);
			main.removeEventListener('click', hideMenu);
		}
	};
};
