import svgLoader from 'vite-svg-loader'
import { type DefaultTheme, type LocaleConfig, mergeConfig, type UserConfig } from 'vitepress'

import { createSiteI18n, type Messages, type Translate } from './i18n'

export type { Messages, Translate }

export interface SiteLocale {
	lang: string
	label: string
	/** URL prefix, defaults to `/de/` for `de-DE`. The first locale is the root and ignores it. */
	link?: string
}

export interface SiteOptions {
	title: string
	url: string
	/** GitHub repository as `owner/name`. */
	repo: string
	messages?: Record<string, Messages>
	locales?: SiteLocale[]
	/** Shows a version menu linking to the changelog. */
	version?: string
	/** Crowdin project slug. Shows a translate link. */
	crowdin?: string
	/** Social preview image, defaults to `/banner.png`. */
	image?: string
	favicon?: string
	/** Project nav items, placed before the translate link and version menu. */
	nav?: (t: Translate, link: string) => DefaultTheme.NavItem[]
	/** Extra social links, placed after GitHub. */
	socialLinks?: DefaultTheme.SocialLink[]
}

export type ThemeConfig = DefaultTheme.Config & { version?: string }

type Config = UserConfig<ThemeConfig>

export function defineSiteConfig(options: SiteOptions, overrides: Config = {}): Config {
	const {
		title,
		url,
		repo,
		locales = [{ lang: 'en-US', label: 'English' }],
		image = `${url}/banner.png`,
		favicon = '/favicon.png',
	} = options
	const i18n = createSiteI18n(options.messages)

	function locale({ lang, label, link = '/' }: SiteLocale): LocaleConfig<ThemeConfig>[string] {
		const t: Translate = (key, values = {}) => i18n.global.t(key, values, { locale: lang })
		const description = t('meta.summary')
		return {
			label,
			lang,
			link,
			description,
			head: [
				['meta', { property: 'og:description', content: description }],
				['meta', { name: 'twitter:description', content: description }],
			],
			themeConfig: {
				nav: [
					...(options.nav?.(t, link) ?? []),
					...(options.crowdin
						? [
								{
									text: t('nav.translate'),
									link: `https://crowdin.com/project/${options.crowdin}`,
									target: '_blank',
								},
							]
						: []),
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
	const rest = others.map((l) => ({ ...l, link: l.link ?? `/${l.lang.split('-')[0].toLowerCase()}/` }))
	const keyOf = (link: string) => link.replace(/^\/|\/$/g, '')
	const rootLocale = locale({ ...root, link: '/' })

	const base: Config = {
		title,
		description: rootLocale.description,
		cleanUrls: true,
		head: [
			['link', { rel: 'icon', type: favicon.endsWith('.svg') ? 'image/svg+xml' : 'image/png', href: favicon }],
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
		vite: {
			plugins: [svgLoader()],
			define: {
				__VUE_I18N_FULL_INSTALL__: true,
				__VUE_I18N_LEGACY_API__: false,
				__INTLIFY_PROD_DEVTOOLS__: false,
			},
			ssr: {
				noExternal: ['vue-i18n'],
			},
		},
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
