<script lang="ts">
export interface ShowcaseItem {
	/** Reads `meta.feature.<key>.title` and `meta.feature.<key>.description`. */
	key: string
	image: string
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Row {
	title: string
	details: string
	image: string
}

const props = withDefaults(
	defineProps<{ items: ShowcaseItem[]; width?: number; height?: number }>(),
	{ width: 1280, height: 800 },
)

const { t } = useI18n()

const rows = computed<Row[]>(() =>
	props.items.map(({ key, image }) => ({
		title: t(`meta.feature.${key}.title`),
		details: t(`meta.feature.${key}.description`),
		image,
	})),
)

const active = ref<Row | null>(null)

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') active.value = null
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
	<div class="showcase">
		<div class="container">
			<div class="showcase-inner">
				<article
					v-for="(row, index) in rows"
					:key="row.image"
					class="showcase-row"
					:class="{ reverse: index % 2 === 1 }"
				>
					<button type="button" class="showcase-media" :aria-label="row.title" @click="active = row">
						<img
							:src="row.image"
							:alt="row.title"
							:width="width"
							:height="height"
							:style="{ aspectRatio: `${width} / ${height}` }"
							loading="lazy"
							decoding="async"
						/>
					</button>
					<div class="showcase-text">
						<h3>{{ row.title }}</h3>
						<p>{{ row.details }}</p>
					</div>
				</article>
			</div>
		</div>
		<Teleport to="body">
			<div v-if="active" class="lightbox" @click="active = null">
				<img :src="active.image" :alt="active.title" />
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.showcase {
	position: relative;
	padding: 32px 24px 8px;
}

.container {
	max-width: 1152px;
	margin: 0 auto;
}

.showcase-inner {
	display: flex;
	flex-direction: column;
	gap: 64px;
}

.showcase-row {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24px;
}

.showcase-media {
	flex: 1 1 0;
	width: 100%;
	padding: 0;
	border: 0;
	background: none;
	cursor: zoom-in;
}

.showcase-media img {
	width: 100%;
	object-fit: cover;
	border-radius: 12px;
	background-color: var(--vp-c-bg-soft);
}

.showcase-text {
	flex: 1 1 0;
	width: 100%;
}

.showcase-text h3 {
	font-size: 1.25rem;
	font-weight: 600;
	line-height: 1.4;
	margin: 0 0 8px;
	letter-spacing: -0.01em;
}

.showcase-text p {
	font-size: 0.95rem;
	line-height: 1.6;
	color: var(--vp-c-text-2);
	margin: 0;
}

@media (min-width: 640px) {
	.showcase {
		padding-top: 48px;
		padding-left: 48px;
		padding-right: 48px;
	}
}

@media (min-width: 768px) {
	.showcase-row {
		flex-direction: row;
		align-items: center;
		gap: 48px;
	}

	.showcase-row.reverse {
		flex-direction: row-reverse;
	}
}

@media (min-width: 960px) {
	.showcase {
		padding-left: 64px;
		padding-right: 64px;
	}
}

.lightbox {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	background: rgba(0, 0, 0, 0.85);
	cursor: zoom-out;
}

.lightbox img {
	max-width: 100%;
	max-height: 100%;
	border-radius: 12px;
}
</style>
