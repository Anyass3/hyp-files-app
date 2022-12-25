import Markdown, { highlightCode, setHljs, getLang, setLang } from 'markdown-hljs';
import hljs from 'highlight.js';
import _ from 'lodash-es';

setHljs(hljs);

const langs = [
	{ language: 'ini', aliases: ['Pipfile', 'flake8'] },
	{ language: 'python', aliases: ['mako'] },
	{ language: 'yaml', aliases: ['Procfile', 'def'] }
];
for (const lang of langs) {
	setLang(lang);
}

const extractLang = (ctype: string, path: string) => {
	const ext = _.last(_.last(path.split('/'))?.split('.')) || '';
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
	) as unknown as string;
};

export { highlightCode, getLang, Markdown, extractLang };
