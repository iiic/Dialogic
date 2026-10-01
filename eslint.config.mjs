"use strict";

//@ts-check

/**
 * @file eslint.config.mjs
 * @description ESLint configuration, rules of AGENTS.md that can be checked automatically are enforced here.
 * Run with `npm run lint:js`.
 */

import js from '@eslint/js'
import globals from 'globals'

/** @type {Array<string>} Elements that must never be used (AGENTS.md, section HTML) */
const FORBIDDEN_ELEMENTS = [
	'acronym', 'applet', 'basefont', 'bgsound', 'big', 'blink', 'center', 'comment', 'content', 'dir', 'font', 'frame',
	'frameset', 'noframes', 'hgroup', 'image', 'isindex', 'listing', 'marquee', 'noindex', 'plaintext', 'shadow',
	'strike', 'tt', 'xmp', 'spacer', 'nobr', 'multicol', 'nextid', 'noembed', 'keygen', 'menuitem', 'rb', 'rtc',
]

/** @type {Array<string>} Properties and methods of `document` that must never be used (AGENTS.md) */
const FORBIDDEN_DOCUMENT_PROPERTIES = [
	'alinkColor', 'all', 'anchors', 'applets', 'bgColor', 'cookie', 'domain', 'featurePolicy', 'fgColor', 'fullscreen',
	'lastStyleSheetSet', 'linkColor', 'preferredStyleSheetSet', 'rootElement', 'selectedStyleSheetSet',
	'styleSheetSets', 'vlinkColor', 'xmlEncoding', 'xmlVersion', 'clear', 'close', 'createEvent', 'createNSResolver',
	'createTouch', 'createTouchList', 'enableStyleSheetsForSet', 'execCommand', 'open', 'queryCommandEnabled',
	'queryCommandState', 'queryCommandSupported', 'requestStorageAccessFor', 'write', 'writeln',
]

/** @type {Array<string>} Legacy static properties of `RegExp` that must never be used (AGENTS.md) */
const FORBIDDEN_REGEXP_PROPERTIES = [ 'input', 'lastMatch', 'lastParen', 'leftContext', 'rightContext' ]

/**
 * @type {Array<string>} Methods and properties that must never be used, on any object (AGENTS.md),
 * `hasOwnProperty()` is reported by rules no-prototype-builtins and prefer-object-has-own
 */
const FORBIDDEN_PROPERTIES = [
	'getYear', 'setYear', 'toGMTString', 'createScriptProcessor', 'compile', 'caller', 'arguments', 'constructor',
	'anchor', 'big', 'blink', 'bold', 'fixed', 'fontcolor', 'fontsize', 'italics', 'link', 'substr', 'strike', 'small',
	'sub', 'sup', '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', '__proto__',
	'isPrototypeOf', 'onafterscriptexecute', 'onbeforescriptexecute', 'onbeforeunload',
]

/** @type {Array<string>} Events that must never be listened to (AGENTS.md) */
const FORBIDDEN_EVENTS = [ 'afterscriptexecute', 'beforescriptexecute', 'beforeunload' ]

/** @type {Array<string>} Global functions and objects that must never be used (AGENTS.md) */
const FORBIDDEN_GLOBALS = [
	'AudioProcessingEvent', 'DOMError', 'XSLTProcessor', 'escape', 'unescape', 'uneval', 'InternalError',
]

/** @type {string} */
const SEE_AGENTS = ', see AGENTS.md'

/** @returns {{ object: string, property: string, message: string }} */
function toDocumentRestriction ( /** @type {string} */ property )
{
	return { object: 'document', property, message: 'Forbidden' + SEE_AGENTS }
}

/** @returns {{ object: string, property: string, message: string }} */
function toRegExpRestriction ( /** @type {string} */ property )
{
	return { object: 'RegExp', property, message: 'Legacy RegExp property is forbidden' + SEE_AGENTS }
}

/** @returns {{ property: string, message: string }} */
function toPropertyRestriction ( /** @type {string} */ property )
{
	return { property, message: 'Forbidden' + SEE_AGENTS }
}

/** @returns {{ name: string, message: string }} */
function toGlobalRestriction ( /** @type {string} */ name )
{
	return { name, message: 'Forbidden' + SEE_AGENTS }
}

/** @returns {{ selector: string, message: string }} */
function toElementRestriction ( /** @type {string} */ elementName )
{
	return {
		selector: `CallExpression[callee.property.name='createElement'][arguments.0.value='${ elementName }']`,
		message: 'Element <' + elementName + '> is forbidden' + SEE_AGENTS,
	}
}

/** @returns {{ selector: string, message: string }} */
function toEventRestriction ( /** @type {string} */ eventName )
{
	return {
		selector: `CallExpression[callee.property.name='addEventListener'][arguments.0.value='${ eventName }']`,
		message: 'Event "' + eventName + '" is forbidden' + SEE_AGENTS,
	}
}

export default [
	{
		ignores: [ 'node_modules/' ],
	},
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
		},
		rules: {

			// adjustments of eslint:recommended to the code style of this project
			'no-unused-labels': 'off', // labels are used to name (document) loops
			'no-useless-assignment': 'off', // variables are initialized with a value of the annotated type
			'no-unused-vars': [ 'error', { args: 'none', caughtErrors: 'none' } ], // documented parameters may stay unused
			'no-irregular-whitespace': [ 'error', { skipComments: true } ],

			// AGENTS.md
			'eqeqeq': [ 'error', 'always' ],
			'no-var': 'error',
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-caller': 'error',
			'no-proto': 'error',
			'no-with': 'error',
			'no-prototype-builtins': 'error',
			'prefer-object-has-own': 'error',
			'radix': 'error',
			'no-restricted-globals': [
				'error',
				{ name: 'isNaN', message: 'Use Number.isNaN() instead' + SEE_AGENTS },
				...FORBIDDEN_GLOBALS.map( toGlobalRestriction ),
			],
			'no-restricted-properties': [
				'error',
				{ object: 'location', property: 'reload', message: 'Forbidden' + SEE_AGENTS },
				...FORBIDDEN_DOCUMENT_PROPERTIES.map( toDocumentRestriction ),
				...FORBIDDEN_REGEXP_PROPERTIES.map( toRegExpRestriction ),
				...FORBIDDEN_PROPERTIES.map( toPropertyRestriction ),
			],
			'no-restricted-syntax': [
				'error',
				...FORBIDDEN_ELEMENTS.map( toElementRestriction ),
				...FORBIDDEN_EVENTS.map( toEventRestriction ),
			],
		},
	},
	{
		files: [ '**/*.spec.mjs' ],
		rules: {
			'no-unused-vars': 'off', // whole test API is imported, even if some test helpers are not used yet
		},
	},
	{
		files: [ '**/*.spec.mjs', 'eslint.config.mjs', 'scripts/**' ],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
]
