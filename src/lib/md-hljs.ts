import Markdown, { highlightCode, setHljs, getLang, setLang } from 'markdown-hljs';
import hljs from 'highlight.js';
import { browser } from '$app/env';
import _ from 'lodash';

setHljs(hljs);

const langs = [
	{ language: 'plaintext', aliases: ['gitignore', 'README'] },
	{ language: 'ini', aliases: ['Pipfile', 'flake8'] },
	{ language: 'python', aliases: ['mako'] },
	{ language: 'yaml', aliases: ['Procfile', 'def'] }
];
for (let lang of langs) {
	setLang(lang);
}
if (browser) {
	window['lang'] = getLang;
	window['hljs'] = highlightCode;
}

const extractLang = (ctype: string, path: string) => {
	const ext = _.last(_.last(path.split('/')).split('.'));
	return getLang(
		[
			ext,
			ctype.replace(/[a-z]+\//, ''),
			ext.endsWith('ignore')
				? 'plaintext'
				: ext.includes('bash')
				? 'bash'
				: ext.replace('_history', '').replace('_', '-')
		],
		{
			getMatch: true,
			error: false
		}
	);
};
//@ts-ignore
export { highlightCode, getLang, Markdown, extractLang };
