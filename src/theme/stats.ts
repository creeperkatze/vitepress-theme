import type { Translate } from '../i18n.ts'

export interface Stat {
	label: (t: Translate) => string
	value: number
	/** Defaults to the locale's number format. */
	format?: (value: number, locale: string) => string
}

export type StatsLoader = () => Promise<Stat[]>

/** Reads the value from a shields.io JSON endpoint. Returns null on any failure. */
export async function shieldsValue(url: string): Promise<number | null> {
	try {
		const res = await fetch(url)
		if (!res.ok) return null
		const data = (await res.json()) as { value?: string }
		const value = Number(data.value)
		return Number.isFinite(value) ? value : null
	} catch {
		return null
	}
}

export interface BrowserStoreIds {
	chrome?: string
	firefox?: string
	edge?: string
}

/** User counts from the Chrome, Firefox and Edge add-on stores. */
export function browserStoreStats({ chrome, firefox, edge }: BrowserStoreIds): StatsLoader {
	const sources: [string, string | undefined, (id: string) => string][] = [
		['Chrome', chrome, (id) => `https://img.shields.io/chrome-web-store/users/${id}.json`],
		['Firefox', firefox, (id) => `https://img.shields.io/amo/users/${id}.json`],
		[
			'Edge',
			edge,
			(id) =>
				`https://img.shields.io/badge/dynamic/json.json?label=users&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2F${id}`,
		],
	]

	return async () => {
		const results = await Promise.all(
			sources.map(async ([browser, id, url]) => {
				if (!id) return null
				const value = await shieldsValue(url(id))
				if (value === null) return null
				return { label: (t: Translate) => t('stats.users', { browser }), value }
			}),
		)
		return results.filter((stat) => stat !== null)
	}
}
