import { func } from './utils';

export const initPrompt = ({
	visible = false,
	message = 'Here is a Prompt',
	acceptText = 'accept',
	dismissText = 'dismiss',
	onaccept = func,
	ondismiss = func
} = {}) => ({
	visible,
	message,
	onaccept: () =>
		new Promise((resolve, reject) => {
			try {
				resolve(onaccept());
			} catch (err) {
				reject(err);
			}
		}),

	ondismiss: () =>
		new Promise((resolve, reject) => {
			try {
				resolve(ondismiss());
			} catch (err) {
				reject(err);
			}
		}),
	acceptText,
	dismissText
});

export default {
	state: {
		prompt: initPrompt() // prompt to used when new bundle of app is avialable (service workers)
	},

	mutations: {
		updatePromptValues(state, options = {}) {
			state.prompt.update((value) => {
				for (let option in options) {
					value[option] = options[option];
					return value;
				}
			});
		}
	},

	actions: {
		async showPrompt({ commit }, options) {
			options = initPrompt({ ...options, visible: true });
			commit('prompt', options);
		},
		async hidePrompt({ commit }) {
			const options = initPrompt({ visible: false });
			commit('prompt', options);
		}
	}
};
