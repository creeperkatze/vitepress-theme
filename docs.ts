import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { type DefaultTheme, mergeConfig } from 'vitepress'

import { type Config, githubLink, toPath, versionMenu, vite } from './config'

export interface DocsOptions {
	name: string
	description: string
	repo: string
	version?: string
	guide: DefaultTheme.SidebarItem[]
	// The folder TypeDoc writes to
	api: string | URL
	nav?: DefaultTheme.NavItem[]
}

const API_SECTIONS = [
	'classes',
	'interfaces',
	'type-aliases',
	'enumerations',
	'functions',
	'variables',
]

function titleFromSlug(slug: string): string {
	return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function apiSidebar(dir: string | URL): DefaultTheme.SidebarItem[] {
	const root = toPath(dir)
	const sections = API_SECTIONS.filter((section) => existsSync(join(root, section))).map(
		(section, index) => ({
			text: titleFromSlug(section),
			collapsed: index > 0,
			items: readdirSync(join(root, section))
				.filter((file) => file.endsWith('.md'))
				.sort((a, b) => a.localeCompare(b))
				.map((file) => {
					const slug = file.slice(0, -'.md'.length)
					return { text: titleFromSlug(slug), link: `/api/${section}/${slug}` }
				}),
		}),
	)
	return [{ text: 'API Reference', items: [{ text: 'Overview', link: '/api/' }] }, ...sections]
}

export function defineDocsConfig(options: DocsOptions, overrides: Config = {}): Config {
	const { name, repo, version } = options
	const guide = [{ text: 'Guide', items: options.guide }]
	const api = apiSidebar(options.api)

	const base: Config = {
		title: name,
		description: options.description,
		base: `/${process.env.WEBSITE_BASE ?? ''}/`.replace(/\/+/g, '/'),
		cleanUrls: true,
		vite,
		themeConfig: {
			nav: [
				{ text: 'Guide', link: options.guide[0]?.link ?? '/guide/' },
				{ text: 'API', link: '/api/' },
				...(options.nav ?? []),
				...versionMenu(repo, version, 'Changelog'),
			],
			sidebar: {
				'/guide/': guide,
				'/api/': api,
				'/': [...guide, ...api],
			},
			lastUpdated: {},
			editLink: {
				pattern: `https://github.com/${repo}/edit/main/website/:path`,
			},
			socialLinks: [
				githubLink(repo),
				{ icon: 'npm', link: `https://www.npmjs.com/package/${name}` },
			],
			search: {
				provider: 'local',
			},
		},
	}

	return mergeConfig(base, overrides) as Config
}
