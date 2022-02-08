<script lang="ts">
	import { API } from '$lib/getAPi';
	export let content: string;
	export let codeStyle = '';
	export let storage: string;
	export let dkey: string;
	export let dir: string;
	import _ from 'lodash-es';
	let shadowroot;
	$: style = codeStyle
		? `<link rel="stylesheet" href=${codeStyle} />
		<style>
		img {
			max-width: 100%;
			height: auto;
		}
		</style>
	`
		: '';

	const shadow = (node) => {
		correctPaths();
		shadowroot = node.attachShadow({ mode: 'open' });
	};
	const correctPaths = async () => {
		content = content.replace(/'/g, '"');
		const ancorsRe = /<a[\w\s"'-=]+href="(?!(http)|(\/view\/text-)|#|")/g;
		await new Promise((resolve) => {
			//@ts-ignore
			const ancors: Array<string> = _.toArray(new Set(content.match(ancorsRe)));
			if (ancors.length)
				ancors.forEach((ancor, idx) => {
					const newAncor = ancor + `/view/text-${storage}?dkey=${dkey}&path=${dir}&path=`;
					content = content.replace(
						new RegExp(_.escapeRegExp(ancor) + '(?!(http)|(/view/text-)|#|")', 'g'),
						newAncor
					);
					if (ancors.length === idx + 1) resolve('');
				});
			else resolve('');
		});

		const apiPrefix = API + `/file?storage=${storage}&dkey=${dkey}&path=${dir}&path=`;
		content = content.replace(/url\((?!http)/g, 'url(' + apiPrefix);
		content = content.replace(/src="(?!(http)|(\/view\/text-)|#|")/g, 'src="' + apiPrefix);
		content = content.replace(/href="(?!(http)|(\/view\/text-)|#|")/g, 'href="' + apiPrefix);
	};

	$: if (shadowroot) {
		shadowroot.innerHTML = style + content;
	}
</script>

<div class=" h-full" use:shadow />
