"use strict";

//@ts-check

/**
 * @file check-integrity.mjs
 * @description Checks that Subresource Integrity hashes in HTML files (import maps and `integrity` attributes) match
 * the content of the local files they point to. Remote URLs and empty hashes are skipped, so the check works offline.
 * The hash in `Dialogic.DEFAULT_SETTINGS` (dialogic.mjs) is verified by a unit test in dialogic.spec.mjs.
 * Usage: `npm run check:integrity` (node_modules must be installed, tests-runner.html points into it)
 */

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/** @type {URL} */
const ROOT_URL = new URL( '../', import.meta.url )

/** @type {Array<string>} ordered from the weakest, browsers compare only hashes of the strongest algorithm present */
const ALGORITHMS = [ 'sha256', 'sha384', 'sha512' ]

/** @type {Array<string>} */
const ATTRIBUTE_SEPARATORS = [ ' ', '\t', '\n', '\r' ]

/** @type {boolean} */
const IS_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true'

/**
 * @typedef {{ url: string, integrity: string, line: number }} IntegrityReference
 * @typedef {{ file: string, line: number, message: string }} IntegrityError
 */

/** @returns {Array<string>} paths (relative to the repository root) of all tracked HTML files */
function listHtmlFiles ()
{
	return execFileSync( 'git', [ 'ls-files', '-z', '--', '*.html' ], { cwd: ROOT_URL, encoding: 'utf8' } )
		.split( '\0' )
		.filter( Boolean )
}

/** @returns {number} */
function getLineNumber ( /** @type {string} */ text, /** @type {number} */ index )
{
	return text.slice( 0, index ).split( '\n' ).length
}

/** @returns {Array<number>} positions of all occurrences of `searched` in `text` */
function findAllIndexes ( /** @type {string} */ text, /** @type {string} */ searched )
{

	/** @type {Array<number>} */
	const indexes = []

	let index = text.indexOf( searched )
	while ( index !== -1 ) {
		indexes.push( index )
		index = text.indexOf( searched, index + searched.length )
	}
	return indexes
}

/** @returns {string} value of the attribute in the source code of the tag, or an empty string */
function getAttributeValue ( /** @type {string} */ tag, /** @type {string} */ attributeName )
{
	for ( const separator of ATTRIBUTE_SEPARATORS ) {
		const start = tag.indexOf( separator + attributeName + '="' )
		if ( start !== -1 ) {
			const valueStart = start + separator.length + attributeName.length + 2
			return tag.slice( valueStart, tag.indexOf( '"', valueStart ) )
		}
	}
	return ''
}

/** @returns {Array<IntegrityReference>} entries of the `integrity` object of the import map starting at `typeIndex` */
function parseImportmap ( /** @type {string} */ html, /** @type {number} */ typeIndex )
{
	const contentStart = html.indexOf( '>', typeIndex ) + 1
	const content = html.slice( contentStart, html.indexOf( '</script>', contentStart ) )
	const integrityStart = contentStart + content.indexOf( '"integrity"' )

	/** @type {{ integrity?: Record<string, string> }} */
	const importmap = JSON.parse( content )

	return Object.entries( importmap.integrity ?? {} ).map( ( [ url, integrity ] ) => ( {
		url,
		integrity,
		line: getLineNumber( html, html.indexOf( JSON.stringify( url ), integrityStart ) ),
	} ) )
}

/** @returns {IntegrityReference} element (`<link>`, `<script>`) with the `integrity` attribute starting at `index` */
function parseIntegrityAttribute ( /** @type {string} */ html, /** @type {number} */ index )
{
	const tag = html.slice( html.lastIndexOf( '<', index ), html.indexOf( '>', index ) + 1 )
	return {
		url: getAttributeValue( tag, 'src' ) || getAttributeValue( tag, 'href' ),
		integrity: getAttributeValue( tag, 'integrity' ),
		line: getLineNumber( html, index ),
	}
}

/** @returns {Array<IntegrityReference>} all references in import maps and `integrity` attributes (commented out too) */
function findReferences ( /** @type {string} */ html )
{
	const importmaps = findAllIndexes( html, 'type="importmap"' )
	const attributes = findAllIndexes( html, 'integrity="' )
		.filter( ( index ) => ATTRIBUTE_SEPARATORS.includes( html.charAt( index - 1 ) ) ) // not data-integrity="…"

	return [
		...importmaps.flatMap( ( index ) => parseImportmap( html, index ) ),
		...attributes.map( ( index ) => parseIntegrityAttribute( html, index ) ),
	]
}

/** @returns {Array<{ algorithm: string, hash: string }>} parsed metadata, e.g. "sha256-abc… sha384-def…" */
function parseIntegrity ( /** @type {string} */ integrity )
{
	return integrity.split( ' ' ).filter( Boolean ).map( ( token ) => ( {
		algorithm: token.slice( 0, token.indexOf( '-' ) ).toLowerCase(),
		hash: token.slice( token.indexOf( '-' ) + 1 ).split( '?' )[ 0 ],
	} ) )
}

/** @returns {Promise<string>} error message, or an empty string when the reference is valid (or can't be checked) */
async function verifyReference ( /** @type {string} */ htmlFile, /** @type {IntegrityReference} */ reference )
{
	if ( !reference.url ) {
		return `element with integrity "${ reference.integrity }" has no src or href attribute`
	}

	const fileUrl = new URL( reference.url, new URL( htmlFile, ROOT_URL ) )
	if ( !reference.integrity.trim() || fileUrl.protocol !== 'file:' ) {
		return '' // nothing to compare with, or a remote resource (not available offline)
	}
	fileUrl.search = ''
	fileUrl.hash = ''

	/** @type {Buffer} */
	let content
	try {
		content = await readFile( fileUrl )
	} catch {
		return `${ reference.url }: file ${ fileURLToPath( fileUrl ) } does not exist (did you run "npm ci"?)`
	}

	const hashes = parseIntegrity( reference.integrity )
	const algorithmIndexes = hashes.map( ( { algorithm } ) => ALGORITHMS.indexOf( algorithm ) )
	if ( algorithmIndexes.includes( -1 ) ) {
		return `${ reference.url }: unsupported hash algorithm in "${ reference.integrity }", use one of ${ ALGORITHMS.join( ', ' ) }`
	}

	const strongestAlgorithm = ALGORITHMS[ Math.max( ...algorithmIndexes ) ]
	const actualHash = createHash( strongestAlgorithm ).update( content ).digest( 'base64' )
	const hasMatch = hashes.some( ( { algorithm, hash } ) => algorithm === strongestAlgorithm && hash === actualHash )

	return hasMatch
		? ''
		: `${ reference.url }: integrity "${ reference.integrity }" doesn't match the file, its hash is "${ strongestAlgorithm }-${ actualHash }"`
}

/** @returns {Promise<Array<IntegrityError>>} */
async function checkHtmlFile ( /** @type {string} */ htmlFile )
{
	const references = findReferences( await readFile( new URL( htmlFile, ROOT_URL ), 'utf8' ) )
	const messages = await Promise.all( references.map( ( reference ) => verifyReference( htmlFile, reference ) ) )

	console.log( `${ htmlFile }: ${ references.length } integrity reference(s)` )
	return references
		.map( ( reference, index ) => ( { file: htmlFile, line: reference.line, message: messages[ index ] } ) )
		.filter( ( error ) => error.message )
}

/** @returns {void} */
function reportError ( /** @type {IntegrityError} */ error )
{
	if ( IS_GITHUB_ACTIONS ) { // annotation shown directly in the changed file of a pull request
		console.log( `::error file=${ error.file },line=${ error.line },title=Subresource Integrity::${ error.message.split( '%' ).join( '%25' ) }` )
	}
	console.error( `✗ ${ error.file }:${ error.line } ${ error.message }` )
}

const errors = ( await Promise.all( listHtmlFiles().map( checkHtmlFile ) ) ).flat()
errors.forEach( reportError )

if ( errors.length ) {
	console.error( `\n${ errors.length } integrity hash(es) don't match the files, update them to the hashes printed above` )
	process.exitCode = 1
} else {
	console.log( '✓ all integrity hashes of local files match' )
}
