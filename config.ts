import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import svgLoader from 'vite-svg-loader'
import { type DefaultTheme, type LocaleConfig, mergeConfig, type UserConfig } from 'vitepress'

import { createSiteI18n, FALLBACK_LOCALE, type Messages, type Translate, withStrings } from './i18n'

export type { Messages, Translate }

export interface SiteLocale {
	lang: string
	/** Defaults to the language's own name, like `Deutsch`. */
	label?: string
	/** URL prefix, defaults to `/de/` for `de-DE`. The first locale is the root and ignores it. */
	link?: string
}

export interface SiteOptions {
	title: string
	url: string
	/** GitHub repository as `owner/name`. */
	repo: string
	messages?: Record<string, Messages>
	/** Defaults to every language in `messages`, with `en-US` as the root. */
	locales?: SiteLocale[]
	/** Shows a version menu linking to the changelog. */
	version?: string
	/** Social preview image, defaults to `/banner.png`. */
	image?: string
	favicon?: string
	/** Project nav items, placed before the version menu. */
	nav?: (t: Translate, link: string) => DefaultTheme.NavItem[]
	/** Extra social links, placed after GitHub. */
	socialLinks?: DefaultTheme.SocialLink[]
}

export type ThemeConfig = DefaultTheme.Config & { version?: string }

type Config = UserConfig<ThemeConfig>

const RTL_LANGUAGES = ['ar', 'fa', 'he', 'ur']

const vite: Config['vite'] = {
	plugins: [svgLoader()],
	define: {
		__VUE_I18N_FULL_INSTALL__: true,
		__VUE_I18N_LEGACY_API__: false,
		__INTLIFY_PROD_DEVTOOLS__: false,
	},
	ssr: {
		noExternal: ['vue-i18n'],
	},
}

/** Reads every `<lang>.json` in a folder, keyed by `<lang>`. Empty files are skipped. */
export function readMessages(dir: string | URL): Record<string, Messages> {
	const path = dir instanceof URL ? fileURLToPath(dir) : dir
	return withStrings(
		Object.fromEntries(
			readdirSync(path)
				.filter((file) => file.endsWith('.json'))
				.map((file) => [
					file.slice(0, -'.json'.length),
					JSON.parse(readFileSync(join(path, file), 'utf8')) as Messages,
				]),
		),
	)
}

function nativeName(lang: string): string {
	const base = lang.split('-')[0]
	const name = new Intl.DisplayNames([lang], { type: 'language' }).of(base) ?? lang
	return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1)
}

export function defineSiteConfig(options: SiteOptions, overrides: Config = {}): Config {
	const {
		title,
		url,
		repo,
		messages = {},
		image = `${url}/banner.png`,
		favicon = '/favicon.png',
	} = options
	const i18n = createSiteI18n(messages)
	const locales = options.locales ?? [
		{ lang: FALLBACK_LOCALE },
		...Object.keys(messages)
			.filter((lang) => lang !== FALLBACK_LOCALE)
			.sort()
			.map((lang) => ({ lang })),
	]

	function locale({
		lang,
		label = nativeName(lang),
		link = '/',
	}: SiteLocale): LocaleConfig<ThemeConfig>[string] {
		const t: Translate = (key, values = {}) => i18n.global.t(key, values, { locale: lang })
		const description = t('meta.summary')
		return {
			label,
			lang,
			dir: RTL_LANGUAGES.includes(lang.split('-')[0]) ? 'rtl' : 'ltr',
			link,
			description,
			head: [
				['meta', { property: 'og:description', content: description }],
				['meta', { name: 'twitter:description', content: description }],
			],
			themeConfig: {
				nav: [
					...(options.nav?.(t, link) ?? []),
					...(options.version
						? [
								{
									text: `v${options.version}`,
									items: [
										{
											text: t('nav.changelog'),
											link: `https://github.com/${repo}/releases`,
										},
									],
								},
							]
						: []),
				],
				outline: { label: t('theme.onThisPage') },
				returnToTopLabel: t('theme.returnToTop'),
				sidebarMenuLabel: t('theme.menu'),
				darkModeSwitchLabel: t('theme.appearance'),
				lightModeSwitchTitle: t('theme.switchToLight'),
				darkModeSwitchTitle: t('theme.switchToDark'),
				langMenuLabel: t('theme.changeLanguage'),
				skipToContentLabel: t('theme.skipToContent'),
				notFound: {
					title: t('notFound.title'),
					quote: t('notFound.quote'),
					linkLabel: t('notFound.linkText'),
					linkText: t('notFound.linkText'),
				},
			},
		}
	}

	const [root, ...others] = locales
	const rest = others.map((l) => ({
		...l,
		link: l.link ?? `/${l.lang.split('-')[0].toLowerCase()}/`,
	}))
	const keyOf = (link: string) => link.replace(/^\/|\/$/g, '')
	const rootLocale = locale({ ...root, link: '/' })

	const base: Config = {
		title,
		description: rootLocale.description,
		cleanUrls: true,
		head: [
			[
				'link',
				{
					rel: 'icon',
					type: favicon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
					href: favicon,
				},
			],
			['meta', { property: 'og:type', content: 'website' }],
			['meta', { property: 'og:url', content: url }],
			['meta', { property: 'og:title', content: title }],
			['meta', { property: 'og:image', content: image }],
			['meta', { name: 'twitter:card', content: 'summary_large_image' }],
			['meta', { name: 'twitter:title', content: title }],
			['meta', { name: 'twitter:image', content: image }],
		],
		locales: {
			root: rootLocale,
			...Object.fromEntries(rest.map((l) => [keyOf(l.link), locale(l)])),
		},
		rewrites: Object.fromEntries(rest.map((l) => [`${l.lang}/:rest*`, `${keyOf(l.link)}/:rest*`])),
		vite,
		themeConfig: {
			version: options.version,
			socialLinks: [
				{ icon: 'github', link: `https://github.com/${repo}` },
				...(options.socialLinks ?? []),
			],
		},
	}

	return mergeConfig(base, overrides) as Config
}

export interface DocsOptions {
	/** Package name, used as the title and for the npm link. */
	name: string
	description: string
	/** GitHub repository as `owner/name`. */
	repo: string
	/** Shows a version menu linking to the changelog. */
	version?: string
	/** Guide pages in sidebar order. The nav links to the first one. */
	guide: DefaultTheme.SidebarItem[]
	/** The folder TypeDoc writes the API reference to. */
	api: string | URL
	/** Extra nav items, placed before the version menu. */
	nav?: DefaultTheme.NavItem[]
}

// TypeDoc folders in sidebar order. Only the first one starts expanded.
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
	const root = dir instanceof URL ? fileURLToPath(dir) : dir
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

function normalizeBase(base: string): string {
	const withLeadingSlash = base.startsWith('/') ? base : `/${base}`
	return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

/** Config for API client docs: a guide, a TypeDoc reference, and links to GitHub and npm. */
export function defineDocsConfig(options: DocsOptions, overrides: Config = {}): Config {
	const { name, repo, version } = options
	const guide = [{ text: 'Guide', items: options.guide }]
	const api = apiSidebar(options.api)

	const base: Config = {
		title: name,
		description: options.description,
		base: normalizeBase(process.env.WEBSITE_BASE || '/'),
		cleanUrls: true,
		vite,
		themeConfig: {
			nav: [
				{ text: 'Guide', link: options.guide[0]?.link ?? '/guide/' },
				{ text: 'API', link: '/api/' },
				...(options.nav ?? []),
				...(version
					? [
							{
								text: `v${version}`,
								items: [{ text: 'Changelog', link: `https://github.com/${repo}/releases` }],
							},
						]
					: []),
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
				{ icon: 'github', link: `https://github.com/${repo}` },
				{ icon: 'npm', link: `https://www.npmjs.com/package/${name}` },
			],
			search: {
				provider: 'local',
			},
		},
	}

	return mergeConfig(base, overrides) as Config
}
