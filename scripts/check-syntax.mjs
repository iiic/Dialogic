"use strict";

//@ts-check

/**
 * @file check-syntax.mjs
 * @description Syntax check of all tracked JavaScript files (parsed by `node --check`, nothing is executed)
 * and JSON files (parsed by `JSON.parse()`).
 * Usage: `npm run check:syntax`
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

/** @type {URL} */
const ROOT_URL = new URL( '../', import.meta.url )

/** @type {Array<string>} */
const JAVASCRIPT_FILES = [ '*.js', '*.mjs', '*.cjs' ]

/** @type {Array<string>} JSON files, including configuration files without the .json extension */
const JSON_FILES = [ '*.json', '.htmlhintrc' ]

/** @returns {Array<string>} paths (relative to the repository root) of tracked files matching the patterns */
function listFiles ( /** @type {Array<string>} */ patterns )
{
	return execFileSync( 'git', [ 'ls-files', '-z', '--', ...patterns ], { cwd: ROOT_URL, encoding: 'utf8' } )
		.split( '\0' )
		.filter( Boolean )
}

/** @returns {string} error message, or an empty string when the syntax is valid */
function checkJavascriptFile ( /** @type {string} */ file )
{
	const result = spawnSync( process.execPath, [ '--check', file ], { cwd: ROOT_URL, encoding: 'utf8' } )
	return result.status === 0 ? '' : result.stderr.trim()
}

/** @returns {Promise<string>} error message, or an empty string when the syntax is valid */
async function checkJsonFile ( /** @type {string} */ file )
{
	try {
		JSON.parse( await readFile( new URL( file, ROOT_URL ), 'utf8' ) )
		return ''
	} catch ( /** @type {any} */ error ) {
		return `${ file }: ${ error.message }`
	}
}

const javascriptFiles = listFiles( JAVASCRIPT_FILES )
const jsonFiles = listFiles( JSON_FILES )
const errors = [
	...javascriptFiles.map( checkJavascriptFile ),
	...await Promise.all( jsonFiles.map( checkJsonFile ) ),
].filter( Boolean )

errors.forEach( ( error ) => console.error( `✗ ${ error }\n` ) )
console.log( `${ javascriptFiles.length } JavaScript and ${ jsonFiles.length } JSON files checked, ${ errors.length } error(s)` )

if ( errors.length ) {
	process.exitCode = 1
}
