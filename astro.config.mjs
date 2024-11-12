// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Chinmina',
			social: {
				github: 'https://github.com/chinmina/chinmina-bridge',
			},
			sidebar: [
				{
					label: 'Introduction',
					link: 'introduction',
				},
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Private keys with KMS', slug: 'guides/kms' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
