"use strict";

//@ts-check

/**
 * @file test-browsers.mjs
 * @description Runs the unit tests (dialogic.spec.mjs through tests-runner.html) in real browsers with Playwright.
 * Files are served by a small static server from the repository root, nothing is loaded from the internet.
 * Usage: `npm run test:browsers -- chromium firefox` (browsers must be installed by `npx playwright install`)
 * WebKit (Safari) is not supported, it doesn't implement customized built-in elements (`<dialog is="…">`).
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { chromium, firefox, webkit } from 'playwright'

/** @type {URL} */
const ROOT_URL = new URL( '../', import.meta.url )

/** @type {string} */
const TESTS_RUNNER = 'tests-runner.html'

/** @type {number} in ms, the tests themselves take a few seconds */
const TIMEOUT = 30_000

/** @type {string} start of a console message without the URL in its text, the URL is in its location */
const RESOURCE_ERROR_PREFIX = 'Failed to load resource'

/** @type {Record<string, string>} */
const CONTENT_TYPES = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.mp3': 'audio/mpeg',
	'.png': 'image/png',
}

/** @type {Record<string, import('playwright').BrowserType>} */
const BROWSER_TYPES = { chromium, firefox, webkit }

/** @type {string} imports the spec once more, the module script runs after the spec (and all its tests) finished */
const SPEC_FINISHED_SCRIPT = 'import \'dialogicSpec\'; document.documentElement.dataset.specFinished = \'true\''

/**
 * @typedef {{ type: string, text: string }} ConsoleEntry
 * @typedef {{ browserName: string, passed: number, failed: Array<string>, errors: Array<string> }} BrowserResult
 */

/** @returns {Promise<void>} */
async function serveFile ( /** @type {import('node:http').IncomingMessage} */ request, /** @type {import('node:http').ServerResponse} */ response )
{
	const fileUrl = new URL( '.' + new URL( request.url ?? '/', 'http://localhost' ).pathname, ROOT_URL )
	if ( !fileUrl.href.startsWith( ROOT_URL.href ) ) {
		response.writeHead( 403 ).end()
		return
	}
	try {
		const content = await readFile( fileUrl )
		response.writeHead( 200, { 'Content-Type': CONTENT_TYPES[ extname( fileUrl.pathname ) ] ?? 'application/octet-stream' } )
		response.end( content )
	} catch {
		response.writeHead( 404 ).end()
	}
}

/** @returns {Promise<import('node:http').Server>} */
async function startServer ()
{
	const server = createServer( serveFile )
	await new Promise( ( resolve ) => server.listen( 0, '127.0.0.1', () => resolve( undefined ) ) )
	return server
}

/** @returns {void} */
function printConsoleMessage ( /** @type {string} */ browserName, /** @type {import('playwright').ConsoleMessage} */ message )
{
	if ( message.type() === 'endGroup' ) {
		return
	}
	const location = message.text().startsWith( RESOURCE_ERROR_PREFIX ) ? ` (${ message.location().url })` : ''
	console.log( `[${ browserName }] ${ message.text() }${ location }` )
}

/** @returns {boolean} */
function isFailedTest ( /** @type {ConsoleEntry} */ entry )
{
	return entry.type === 'error' && entry.text.startsWith( '✗' )
}

/** @returns {BrowserResult} */
function evaluateConsole ( /** @type {string} */ browserName, /** @type {Array<ConsoleEntry>} */ entries, /** @type {Array<string>} */ errors )
{
	return {
		browserName,
		passed: entries.filter( ( entry ) => entry.text.startsWith( '✓' ) ).length,
		failed: entries.filter( isFailedTest ).map( ( entry ) => entry.text ),
		errors,
	}
}

/** @returns {Promise<BrowserResult>} */
async function runInBrowser ( /** @type {string} */ browserName, /** @type {string} */ baseUrl )
{

	/** @type {Array<ConsoleEntry>} */
	const entries = []

	/** @type {Array<string>} uncaught exceptions, alerts (e.g. wrong content type) and other failures */
	const errors = []

	const browser = await BROWSER_TYPES[ browserName ].launch()
	try {
		const page = await browser.newPage()
		page.on( 'console', ( message ) =>
		{
			entries.push( { type: message.type(), text: message.text() } )
			printConsoleMessage( browserName, message )
		} )
		page.on( 'pageerror', ( error ) => errors.push( 'Uncaught ' + error.message ) )
		page.on( 'dialog', async ( dialog ) =>
		{
			errors.push( `Unexpected ${ dialog.type() }: ${ dialog.message() }` )
			await dialog.dismiss()
		} )

		await page.goto( baseUrl + TESTS_RUNNER )
		await page.addScriptTag( { type: 'module', content: SPEC_FINISHED_SCRIPT } )
		await page.waitForSelector( 'html[data-spec-finished="true"]', { state: 'attached', timeout: TIMEOUT } )
	} catch ( /** @type {any} */ error ) {
		errors.push( error.message )
	} finally {
		await browser.close()
	}
	return evaluateConsole( browserName, entries, errors )
}

/** @returns {boolean} true when everything passed */
function hasPassed ( /** @type {BrowserResult} */ result )
{
	return result.passed > 0 && result.failed.length === 0 && result.errors.length === 0
}

/** @returns {void} */
function reportResult ( /** @type {BrowserResult} */ result )
{
	console.log( `\n${ hasPassed( result ) ? '✓' : '✗' } ${ result.browserName }: ${ result.passed } passed, ${ result.failed.length } failed` )
	result.failed.forEach( ( text ) => console.error( `  ${ text }` ) )
	result.errors.forEach( ( text ) => console.error( `  ${ text }` ) )
}

const browserNames = process.argv.slice( 2 ).length ? process.argv.slice( 2 ) : [ 'chromium', 'firefox' ]
const unknownBrowsers = browserNames.filter( ( name ) => !Object.hasOwn( BROWSER_TYPES, name ) )
if ( unknownBrowsers.length ) {
	throw new Error( `Unknown browser(s): ${ unknownBrowsers.join( ', ' ) }, use ${ Object.keys( BROWSER_TYPES ).join( ', ' ) }` )
}

const server = await startServer()
const address = /** @type {import('node:net').AddressInfo} */ ( server.address() )

/** @type {Array<BrowserResult>} */
const results = []
for ( const browserName of browserNames ) { // one by one, so the console output is not mixed
	results.push( await runInBrowser( browserName, `http://127.0.0.1:${ address.port }/` ) )
}
server.close()

results.forEach( reportResult )
if ( !results.every( hasPassed ) ) {
	process.exitCode = 1
}
