<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Stat, StatsLoader } from '../stats'

const props = defineProps<{ load: StatsLoader }>()

const { t, n, locale } = useI18n()

const stats = ref<Stat[]>([])

onMounted(async () => {
	try {
		stats.value = await props.load()
	} catch {
		// Stats are a nice-to-have, fail silently rather than showing a broken widget
	}
})

const cards = computed(() =>
	stats.value.map((stat) => ({
		label: stat.label(t),
		value: stat.format ? stat.format(stat.value, locale.value) : n(stat.value),
	})),
)
</script>

<template>
	<div v-if="cards.length" class="stats-bar">
		<div class="stats-grid">
			<article v-for="card in cards" :key="card.label" class="stat-card">
				<span class="stat-value">{{ card.value }}</span>
				<span class="stat-label">{{ card.label }}</span>
			</article>
		</div>
	</div>
</template>

<style scoped>
.stats-bar {
	position: relative;
	padding: 0 24px 16px;
}

.stats-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	max-width: 1152px;
	margin: 0 auto;
}

.stat-card {
	flex: 1 1 200px;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding: 24px;
	border-radius: 12px;
	border: 1px solid var(--vp-c-bg-soft);
	background-color: var(--vp-c-bg-soft);
}

.stat-value {
	font-size: 2.25rem;
	font-weight: 700;
	line-height: 1;
	background-image: linear-gradient(120deg, var(--vp-c-brand-1) 30%, var(--vp-c-brand-2));
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
}

.stat-label {
	margin-top: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--vp-c-text-2);
}

@media (min-width: 640px) {
	.stats-bar {
		padding: 0 48px 16px;
	}

	.stat-card {
		flex-basis: calc(33.333% - 11px);
	}
}

@media (min-width: 960px) {
	.stats-bar {
		padding: 0 64px 16px;
	}
}
</style>
