"use strict";

//@ts-check

/**
 * @file stylelint.config.mjs
 * @description Stylelint configuration, rules of AGENTS.md that can be checked automatically are enforced here.
 * Run with `npm run lint:css`.
 */

/** @type {import('stylelint').Config} */
const config = {
	extends: [ 'stylelint-config-recommended' ],
	rules: {
		'no-descending-specificity': null, // checks only the order of rules, not if a declaration is really overridden

		// AGENTS.md, use `!important` and `*` as little as possible (a disable comment explains the exception)
		'declaration-no-important': true,
		'selector-max-universal': 1,

		// AGENTS.md, keep selectors as short as possible
		'selector-max-compound-selectors': 3,
	},
}

export default config
