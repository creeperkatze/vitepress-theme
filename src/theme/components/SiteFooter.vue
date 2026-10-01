<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { FALLBACK_LOCALE } from '../../i18n.ts'
import HeartIcon from '../icons/heart.svg?component'

const { t, te } = useI18n()

const notAffiliated = computed(() =>
	te('footer.notAffiliated') || te('footer.notAffiliated', FALLBACK_LOCALE)
		? t('footer.notAffiliated')
		: null,
)
</script>

<template>
	<footer class="site-footer">
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
				<template v-if="notAffiliated"> · {{ notAffiliated }}</template>
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
