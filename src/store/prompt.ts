import { func } from './utils';

export const initPrompt = ({
	visible = false,
	message = 'Here is a Prompt',
	input = null,
	acceptText = 'accept',
	dismissText = 'dismiss',
	onaccept = func,
	ondismiss = func
} = {}) => ({
	input,
	visible,
	message,
	onaccept() {
		return new Promise((resolve, reject) => {
			if (this.input) {
				if (!this.input.value && this.input.required) {
					reject(this.input.required);
					return;
				}
			}
			try {
				resolve(onaccept(this.input?.value));
			} catch (err) {
				reject(err);
			}
		});
	},

	ondismiss() {
		return new Promise((resolve, reject) => {
			try {
				resolve(ondismiss());
			} catch (err) {
				reject(err);
			}
		});
	},
	acceptText,
	dismissText
});

export default {
	state: {
		prompt: initPrompt()
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
