import { IntlMessageFormat } from 'intl-messageformat'
import { type CompileError, createI18n, type MessageCompiler, type MessageContext } from 'vue-i18n'

import { defaultMessages } from './messages.ts'

export type Messages = { [key: string]: string | Messages }

export type Translate = (key: string, values?: Record<string, unknown>) => string

export const FALLBACK_LOCALE: string = 'en-US'

const messageCompiler: MessageCompiler = (message, { locale, key, onError }) => {
	if (typeof message !== 'string') {
		onError?.(new Error(`Message ${key} is not a string`) as CompileError)
		return () => key
	}
	const formatter = new IntlMessageFormat(message, locale, undefined, { ignoreTag: true })
	return (ctx: MessageContext) => formatter.format(ctx.values) as string
}

function merge(base: Messages, override: Messages): Messages {
	const result: Messages = { ...base }
	for (const [key, value] of Object.entries(override)) {
		const existing = result[key]
		result[key] =
			typeof value === 'object' && typeof existing === 'object' ? merge(existing, value) : value
	}
	return result
}

export function createSiteI18n(messages: Record<string, Messages> = {}) {
	const merged: Record<string, Messages> = {
		...messages,
		[FALLBACK_LOCALE]: merge(defaultMessages, messages[FALLBACK_LOCALE] ?? {}),
	}
	return createI18n({
		messageCompiler,
		legacy: false,
		locale: FALLBACK_LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		messages: merged,
	})
}
