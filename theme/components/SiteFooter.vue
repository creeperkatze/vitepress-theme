<script setup lang="ts">
import { useData } from 'vitepress'
import { useSidebar } from 'vitepress/theme'
import { useI18n } from 'vue-i18n'

import type { ThemeConfig } from '../../config'
import { FALLBACK_LOCALE } from '../../i18n'
import HeartIcon from '../icons/heart.svg?component'

const { t, te } = useI18n()
const { hasSidebar } = useSidebar()
const { theme } = useData<ThemeConfig>()
</script>

<template>
	<footer class="site-footer" :class="{ 'has-sidebar': hasSidebar }">
		<div class="footer-inner">
			<p class="footer-text">
				<i18n-t keypath="footer.madeBy" scope="global">
					<template #heart><HeartIcon class="heart-icon" /></template>
					<template #author>
						<a
							href="https://github.com/creeperkatze"
							target="_blank"
							rel="noopener noreferrer"
							class="footer-link"
							>Creeperkatze</a
						>
					</template>
				</i18n-t>
				<template v-if="te('footer.notAffiliated', FALLBACK_LOCALE)">
					· {{ t('footer.notAffiliated') }}
				</template>
			</p>
			<p v-if="theme.footerLinks?.length" class="footer-text">
				<template v-for="(item, index) in theme.footerLinks" :key="item.link">
					<template v-if="index"> · </template>
					<a :href="item.link" class="footer-link">{{ item.text }}</a>
				</template>
			</p>
		</div>
	</footer>
</template>

<style scoped>
.site-footer {
	position: relative;
	z-index: var(--vp-z-index-footer);
	border-top: 1px solid var(--vp-c-gutter);
	background-color: var(--vp-c-bg);
	padding: 32px 24px;
}

/* Keeps clear of the fixed sidebar */
@media (min-width: 960px) {
	.site-footer.has-sidebar {
		padding-left: calc(var(--vp-sidebar-width) + 24px);
	}
}

@media (min-width: 1440px) {
	.site-footer.has-sidebar {
		padding-right: calc((100vw - var(--vp-layout-max-width)) / 2 + 24px);
		padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width) + 24px);
	}
}

.footer-inner {
	max-width: var(--vp-layout-max-width);
	margin: 0 auto;
	text-align: center;
}

.footer-text {
	font-size: 14px;
	line-height: 24px;
	font-weight: 500;
	color: var(--vp-c-text-2);
}

.heart-icon {
	display: inline-block;
	height: 14px;
	width: 14px;
	vertical-align: middle;
	transform: translateY(-1px);
	color: var(--vp-c-text-2);
}

.footer-link {
	color: var(--vp-c-text-1) !important;
	text-decoration: underline;
	text-decoration-thickness: 1px;
	text-underline-offset: 2px;
}

.footer-link:hover {
	opacity: 0.8;
}
</style>
