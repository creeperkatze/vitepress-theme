<script lang="ts">
export type DonatePlatform = 'ko-fi' | 'github'
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import HeartIcon from '../icons/heart.svg?component'

const props = defineProps<{ platform: DonatePlatform }>()

const platforms = {
	'ko-fi': { link: 'https://ko-fi.com/creeperkatze', text: 'nav.donate', label: 'nav.donateLabel' },
	github: {
		link: 'https://github.com/sponsors/creeperkatze',
		text: 'nav.sponsor',
		label: 'nav.sponsorLabel',
	},
}

const platform = computed(() => platforms[props.platform])

const { t } = useI18n()
</script>

<template>
	<a
		:href="platform.link"
		target="_blank"
		rel="noopener noreferrer"
		class="donate-button"
		:aria-label="t(platform.label)"
	>
		<HeartIcon class="heart-icon" />
		{{ t(platform.text) }}
	</a>
</template>

<style scoped>
.donate-button {
	margin-left: 16px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 12px;
	border-radius: 9999px;
	background-color: var(--vp-c-brand-bg);
	font-size: 13px;
	font-weight: 500;
	color: #fff !important;
	text-decoration: none !important;
	transition: opacity 0.15s;
}

.donate-button:hover {
	opacity: 0.8;
}

.heart-icon {
	height: 16px;
	width: 16px;
	flex-shrink: 0;
}
</style>
