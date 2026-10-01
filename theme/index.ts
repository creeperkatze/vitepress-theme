/* eslint-disable simple-import-sort/imports */

import { type Theme, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { type Component, defineComponent, h, type VNode, watchEffect } from 'vue'

import { createSiteI18n, type Messages, withStrings } from '../i18n'
import DonateButton from './components/DonateButton.vue'
import HeroLogo from './components/HeroLogo.vue'
import Showcase, { type ShowcaseItem } from './components/Showcase.vue'
import SiteFooter, { type FooterLink } from './components/SiteFooter.vue'
import StatsBar from './components/StatsBar.vue'
import type { StatsLoader } from './stats'
// Must come after the default theme so these rules win
import './style.css'

export type { Messages, Translate } from '../i18n'
export type { ShowcaseItem } from './components/Showcase.vue'
export type { FooterLink } from './components/SiteFooter.vue'
export * from './stats'
export { DonateButton, HeroLogo, Showcase, SiteFooter, StatsBar }

/**
 * Turns `import.meta.glob('<dir>/*.json', { eager: true, import: 'default' })` into messages.
 * Empty files are skipped.
 */
export function messagesFromGlob(modules: Record<string, unknown>): Record<string, Messages> {
	return withStrings(
		Object.fromEntries(
			Object.entries(modules).map(([path, messages]) => [
				path.slice(path.lastIndexOf('/') + 1, -'.json'.length),
				messages as Messages,
			]),
		),
	)
}

export interface ThemeOptions {
	/** The same messages passed to `defineSiteConfig`. */
	messages?: Record<string, Messages>
	/** Donate button target, or false to hide it. Defaults to Ko-fi. */
	donate?: string | false
	/** Logo shown above the tagline (`meta.summary`) on the home page. */
	logo?: Component
	stats?: StatsLoader
	/** Feature rows below the home features. Text comes from `meta.feature.<key>`. */
	showcase?: ShowcaseItem[]
	/** Screenshot size for the showcase, defaults to 1280 by 800. */
	showcaseImageSize?: { width: number; height: number }
	/** A second footer row of links, like a privacy policy. */
	footerLinks?: FooterLink[]
	/** Extra layout slots. These replace the built-in ones of the same name. */
	slots?: Record<string, () => VNode | VNode[]>
	enhanceApp?: Theme['enhanceApp']
}

export function createTheme(options: ThemeOptions = {}): Theme {
	const { donate = 'https://ko-fi.com/creeperkatze', logo, stats, showcase } = options
	const i18n = createSiteI18n(options.messages)

	const slots: Record<string, () => VNode | VNode[]> = {
		...(donate && { 'nav-bar-content-after': () => h(DonateButton, { link: donate }) }),
		...(logo && { 'home-hero-info-before': () => h(HeroLogo, { logo }) }),
		...(stats && { 'home-features-before': () => h(StatsBar, { load: stats }) }),
		...(showcase && {
			'home-features-after': () =>
				h(Showcase, { items: showcase, ...options.showcaseImageSize }),
		}),
		'layout-bottom': () => h(SiteFooter, { links: options.footerLinks ?? [] }),
		...options.slots,
	}

	return {
		extends: DefaultTheme,
		async enhanceApp(ctx) {
			ctx.app.use(i18n)
			await options.enhanceApp?.(ctx)
		},
		Layout: defineComponent({
			setup() {
				const { lang } = useData()
				watchEffect(() => {
					i18n.global.locale.value = lang.value
				})
				return () => h(DefaultTheme.Layout, null, slots)
			},
		}),
	}
}
