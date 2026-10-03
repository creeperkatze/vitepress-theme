import type { Messages } from './i18n'

export const defaultMessages: Messages = {
	nav: {
		changelog: 'Changelog',
		donate: 'Donate',
		donateLabel: 'Donate on Ko-fi',
		sponsor: 'Sponsor',
		sponsorLabel: 'Sponsor on GitHub',
	},
	theme: {
		onThisPage: 'On this page',
		returnToTop: 'Return to top',
		menu: 'Menu',
		appearance: 'Appearance',
		switchToLight: 'Switch to light theme',
		switchToDark: 'Switch to dark theme',
		changeLanguage: 'Change language',
		skipToContent: 'Skip to content',
	},
	notFound: {
		title: 'Page not found',
		quote: "This page doesn't exist, or it has moved.",
		linkText: 'Back to the home page',
	},
	stats: {
		users: '{browser} users',
	},
	footer: {
		madeBy: 'Made with {heart} by {author}',
	},
}
