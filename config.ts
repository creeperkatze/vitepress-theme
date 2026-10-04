import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import svgLoader from 'vite-svg-loader'
import { type DefaultTheme, type LocaleConfig, mergeConfig, type UserConfig } from 'vitepress'

import { createSiteI18n, langFromPath, type Messages, siteLocales, type Translate } from './i18n'

export type { Messages, Translate }

export interface SiteOptions {
	title: string
	url: string
	repo: string
	messages?: Record<string, Messages>
	version?: string
	// `prefix` is empty for the root locale and like `/de` for the others
	nav?: (t: Translate, prefix: string) => DefaultTheme.NavItem[]
	footerLinks?: (t: Translate, prefix: string) => FooterLink[]
	socialLinks?: DefaultTheme.SocialLink[]
}

export interface FooterLink {
	text: string
	link: string
}

export type ThemeConfig = DefaultTheme.Config & { version?: string; footerLinks?: FooterLink[] }

export type Config = UserConfig<ThemeConfig>

const RTL_LANGUAGES = ['ar', 'fa', 'he', 'ur']

export const vite: Config['vite'] = {
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

export function toPath(dir: string | URL): string {
	return dir instanceof URL ? fileURLToPath(dir) : dir
}

export function githubLink(repo: string): DefaultTheme.SocialLink {
	return { icon: 'github', link: `https://github.com/${repo}` }
}

export function versionMenu(
	repo: string,
	version: string | undefined,
	label: string,
): DefaultTheme.NavItem[] {
	if (!version) return []
	return [
		{ text: `v${version}`, items: [{ text: label, link: `https://github.com/${repo}/releases` }] },
	]
}

export function readMessages(dir: string | URL): Record<string, Messages> {
	const path = toPath(dir)
	return Object.fromEntries(
		readdirSync(path)
			.filter((file) => file.endsWith('.json'))
			.map((file) => [langFromPath(file), JSON.parse(readFileSync(join(path, file), 'utf8'))]),
	)
}

// `de-DE` is served from `/de`
function language(lang: string): string {
	return lang.split('-')[0].toLowerCase()
}

// For `[locale]/*.paths.mts`, one page per translated language
export function localePaths(messages: Record<string, Messages>) {
	return siteLocales(messages)
		.slice(1)
		.map((lang) => ({ params: { locale: language(lang) } }))
}

function nativeName(lang: string): string {
	const name = new Intl.DisplayNames([lang], { type: 'language' }).of(language(lang)) ?? lang
	return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1)
}

export function defineSiteConfig(options: SiteOptions, overrides: Config = {}): Config {
	const { title, url, repo, version, messages = {} } = options
	const image = `${url}/banner.png`
	const i18n = createSiteI18n(messages)

	function locale(lang: string, prefix: string): LocaleConfig<ThemeConfig>[string] {
		const t: Translate = (key, values = {}) => i18n.global.t(key, values, { locale: lang })
		const description = t('meta.summary')
		return {
			label: nativeName(lang),
			lang,
			dir: RTL_LANGUAGES.includes(language(lang)) ? 'rtl' : 'ltr',
			link: prefix || '/',
			description,
			head: [
				['meta', { property: 'og:description', content: description }],
				['meta', { name: 'twitter:description', content: description }],
			],
			themeConfig: {
				nav: [
					...(options.nav?.(t, prefix) ?? []),
					...versionMenu(repo, version, t('nav.changelog')),
				],
				footerLinks: options.footerLinks?.(t, prefix) ?? [],
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

	const [root, ...others] = siteLocales(messages)
	const rootLocale = locale(root, '')

	const base: Config = {
		title,
		description: rootLocale.description,
		cleanUrls: true,
		head: [
			['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
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
			...Object.fromEntries(
				others.map((lang) => [language(lang), locale(lang, `/${language(lang)}`)]),
			),
		},
		vite,
		themeConfig: {
			version,
			socialLinks: [githubLink(repo), ...(options.socialLinks ?? [])],
		},
	}

	return mergeConfig(base, overrides) as Config
}
