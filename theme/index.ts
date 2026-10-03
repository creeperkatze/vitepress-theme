/* eslint-disable simple-import-sort/imports */

import { type Theme, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { type Component, defineComponent, h, type VNode, watchEffect } from 'vue'

import { createSiteI18n, langFromPath, type Messages } from '../i18n'
import DonateButton, { type DonatePlatform } from './components/DonateButton.vue'
import HeroLogo from './components/HeroLogo.vue'
import Showcase, { type ShowcaseItem } from './components/Showcase.vue'
import SiteFooter, { type FooterLink } from './components/SiteFooter.vue'
import StatsBar from './components/StatsBar.vue'
import type { StatsLoader } from './stats'
// Must come after the default theme so these rules win
import './style.css'

export type { Messages, Translate } from '../i18n'
export type { DonatePlatform } from './components/DonateButton.vue'
export type { ShowcaseItem } from './components/Showcase.vue'
export type { FooterLink } from './components/SiteFooter.vue'
export * from './stats'
export { DonateButton, HeroLogo, Showcase, SiteFooter, StatsBar }

// Takes `import.meta.glob('<dir>/*.json', { eager: true, import: 'default' })`
export function messagesFromGlob(modules: Record<string, unknown>): Record<string, Messages> {
	return Object.fromEntries(
		Object.entries(modules).map(([path, messages]) => [langFromPath(path), messages as Messages]),
	)
}

export interface ThemeOptions {
	messages?: Record<string, Messages>
	donate?: DonatePlatform | false
	logo?: Component
	stats?: StatsLoader
	showcase?: ShowcaseItem[]
	showcaseImageSize?: { width: number; height: number }
	showcaseFit?: 'cover' | 'contain'
	footer?: boolean
	footerLinks?: FooterLink[]
	// Replaces the built-in slots of the same name
	slots?: Record<string, () => VNode | VNode[]>
	enhanceApp?: Theme['enhanceApp']
}

export function createTheme(options: ThemeOptions = {}): Theme {
	const { donate = 'ko-fi', logo, stats, showcase } = options
	const i18n = createSiteI18n(options.messages)

	const slots: Record<string, () => VNode | VNode[]> = {
		...(donate && { 'nav-bar-content-after': () => h(DonateButton, { platform: donate }) }),
		...(logo && { 'home-hero-info-before': () => h(HeroLogo, { logo }) }),
		...(stats && { 'home-features-before': () => h(StatsBar, { load: stats }) }),
		...(showcase && {
			'home-features-after': () =>
				h(Showcase, {
					items: showcase,
					fit: options.showcaseFit,
					...options.showcaseImageSize,
				}),
		}),
		...(options.footer !== false && {
			'layout-bottom': () => h(SiteFooter, { links: options.footerLinks ?? [] }),
		}),
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
