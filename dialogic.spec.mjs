if ( typeof process !== 'undefined' && process.versions?.node ) { // If this is an npm console command
	const { JSDOM } = await import( 'jsdom' );
	const { default: cssEscape } = await import( 'css.escape' );
	const dom = new JSDOM( '<!doctype html><html><head></head><body></body></html>', {
		url: 'http://localhost/'
	} );
	const browserGlobals = [
		'window',
		'document',
		'HTMLElement',
		'HTMLDialogElement',
		'HTMLScriptElement',
		'Element',
		'customElements',
		'Event',
		'EventTarget',
		'Node',
		'PointerEvent',
		'CustomEvent',
		'Audio',
		'navigator'
	];
	const globalObject = /** @type {Record<string, unknown>} */ ( globalThis );
	const windowObject = /** @type {Record<string, unknown>} */ ( dom.window );
	for ( const globalName of browserGlobals ) {
		Object.defineProperty( globalObject, globalName, {
			configurable: true,
			writable: true,
			value: windowObject[ globalName ],
		} );
	}
	Object.defineProperty( globalThis, 'CSS', {
		configurable: true,
		writable: true,
		value: /** @type {typeof CSS} */ ( { escape: cssEscape } ),
	} );
	Object.defineProperty( dom.window, 'CSS', {
		configurable: true,
		writable: true,
		value: globalThis.CSS,
	} );
	/** @type {WeakMap<Blob, string>} */
	const blobSources = new WeakMap();
	class TestBlob extends Blob
	{
		constructor ( /** @type {Array<string|Blob|ArrayBuffer>} */ parts = [], /** @type {BlobPropertyBag} */ options = {} )
		{
			super( parts, options );
			blobSources.set( this, typeof parts[ 0 ] === 'string' ? parts[ 0 ] : '' );
		}
	}
	Object.defineProperty( globalThis, 'Blob', {
		configurable: true,
		writable: true,
		value: TestBlob,
	} );
	Object.defineProperty( URL, 'createObjectURL', {
		configurable: true,
		writable: true,
		value: ( /** @type {Blob} */ blob ) => 'data:text/javascript;base64,' + Buffer.from( blobSources.get( blob ) ?? '' ).toString( 'base64' ),
	} );
	if ( typeof dom.window.HTMLDialogElement.prototype.show !== 'function' ) {
		dom.window.HTMLDialogElement.prototype.show = function ()
		{
			this.setAttribute( 'open', '' );
		};
		dom.window.HTMLDialogElement.prototype.close = function ()
		{
			this.removeAttribute( 'open' );
		};
	}
	dom.window.Audio.prototype.play = () => Promise.resolve();
	dom.window.Audio.prototype.pause = () => { };

	const cookies = new Map();
	const cookieStore = {
		onchange: null,
		async get ( /** @type {string | {name: string}} */ name )
		{
			const value = cookies.get( typeof name === 'string' ? name : name.name );
			return value ? { name: value.name, value: value.value } : null;
		},
		async getAll ()
		{
			return [ ...cookies.values() ];
		},
		async set ( /** @type {{name: string, value: string}} */ cookie )
		{
			cookies.set( cookie.name, cookie );
		},
		async delete ( /** @type {string | {name: string}} */ cookie )
		{
			cookies.delete( typeof cookie === 'string' ? cookie : cookie.name );
		},
		addEventListener () { },
		removeEventListener () { },
		dispatchEvent () { return true; }
	};
	globalThis.cookieStore = /** @type {typeof globalThis.cookieStore} */ ( /** @type {unknown} */ ( cookieStore ) );
	Object.defineProperty( dom.window, 'cookieStore', {
		configurable: true,
		value: cookieStore,
		writable: true,
	} );
	dom.window.matchMedia = ( query ) => ( {
		media: query,
		matches: false,
		onchange: null,
		addListener () { },
		removeListener () { },
		addEventListener () { },
		removeEventListener () { },
		dispatchEvent () { return true; }
	} );
}

const { Dialogic } = /** @type {typeof import('./dialogic.mjs')} */ ( await import( './dialogic.mjs?v=0.2&settings=' + JSON.stringify( {
	autoRun: false,
} ) ) );
const { applySettings, clearSettings, group, groupClosed, it, assert, toThrow, beforeEach, afterEach, not, toBeNullOr, equal, toBeDefined, toBeInstanceOf } = /** @type {typeof import('./modules/ictest.mjs')} */ ( await import( './modules/ictest.mjs?v=0.2&settings=' + JSON.stringify( {
	settings: {
		a: true,
	},
} ) ) );

const JSON_SETTINGS_ID = 'dialogic-settings';

/** @type {Record<string, string>} Subresource Integrity algorithm names and their Web Crypto names */
const INTEGRITY_ALGORITHMS = {
	sha256: 'SHA-256',
	sha384: 'SHA-384',
	sha512: 'SHA-512',
}

/** @returns {Promise<Uint8Array>} content of the file, `fetch()` doesn't support file: URLs in Node.js */
async function readResource ( /** @type {string} */ href )
{
	if ( href.startsWith( 'file:' ) ) {
		const { readFile } = await import( 'node:fs/promises' )
		return readFile( new URL( href ) )
	}
	const response = await fetch( href )
	return new Uint8Array( await response.arrayBuffer() )
}

/** @returns {Promise<string>} Subresource Integrity metadata of the content, e.g. sha256-… */
async function computeIntegrity ( /** @type {string} */ algorithm, /** @type {Uint8Array} */ content )
{
	const digest = await crypto.subtle.digest( INTEGRITY_ALGORITHMS[ algorithm ], content )
	return algorithm + '-' + btoa( String.fromCharCode( ...new Uint8Array( digest ) ) )
}

await group( 'Static tests', async () =>
{

	await it( 'Dialogic should have DEFAULT_SETTINGS defined as Object', async () =>
	{
		assert( Dialogic.DEFAULT_SETTINGS ).toBeDefined();
		assert( Dialogic.DEFAULT_SETTINGS ).toBeInstanceOf( Object );
	} );

	await groupClosed( 'Dialogic.DEFAULT_SETTINGS should be read only', async () =>
	{

		await it( 'Property DEFAULT_SETTINGS should be read only', async () =>
		{
			assert( Dialogic ).hasReadOnlyProperty( 'DEFAULT_SETTINGS' );
		} );

		await it( 'Try to set new value and read if it\'s not set', async () =>
		{
			const propertyName = 'bad value should not be saved';
			Dialogic.DEFAULT_SETTINGS.rootElementId = propertyName;
			assert( Dialogic.DEFAULT_SETTINGS.rootElementId ).not.equal( propertyName );
		} );

	} );

	await it( 'Dialogic.SETTINGS_URL_PARAMETER parameter should be present and read only', async () =>
	{
		assert( Dialogic.SETTINGS_URL_PARAMETER ).toBeDefined();
		assert( Dialogic ).hasReadOnlyProperty( 'SETTINGS_URL_PARAMETER' );
		assert( Dialogic.SETTINGS_URL_PARAMETER ).toBeInstanceOf( String );
	} );

	await it( 'Dialogic should be registered in customElements', async () =>
	{
		assert( customElements.get( 'dialogic-item' ) ).equal( Dialogic );
	} );

	await it( 'Default CSS and audio should be resolved relative to the module, not to the page', async () =>
	{
		const moduleDirectory = new URL( './', import.meta.url ).href;
		assert( Dialogic.DEFAULT_SETTINGS.CSSStyleSheets[ 0 ].href ).equal( moduleDirectory + 'css/dialogic.css' );
		assert( Dialogic.DEFAULT_SETTINGS.preloadFiles[ 0 ].href ).equal( moduleDirectory + 'css/dialogic.css' );
		assert( Dialogic.DEFAULT_SETTINGS.dialogShowAudio ).equal( moduleDirectory + 'media/bell.mp3' );
	} );

	await it( 'Integrity hashes of default preloaded files should match the files', async () =>
	{
		for ( const resource of Dialogic.DEFAULT_SETTINGS.preloadFiles ) {
			if ( resource.integrity ) {
				const algorithm = resource.integrity.slice( 0, resource.integrity.indexOf( '-' ) )
				const actualIntegrity = await computeIntegrity( algorithm, await readResource( resource.href ) )
				assert( resource.integrity ).equal( actualIntegrity, 'Integrity of ' + resource.href + ' should be ' + actualIntegrity )
			}
		}
	} )

	await it( 'It\'s possible to add new static property, and new property should not be readonly', async () =>
	{
		const propertyName = 'nonExistingProperty';
		const dialogicWithExtras = /** @type {typeof Dialogic & Record<string, unknown>} */ ( Dialogic );
		dialogicWithExtras[ propertyName ] = propertyName;
		assert( Dialogic ).not.hasReadOnlyProperty( propertyName );
		assert( dialogicWithExtras[ propertyName ] ).equal( propertyName );
	} );

} );

await group( 'Dynamic tests', async () =>
{

	await it( 'Dialog without any parameters shout throw error', async () =>
	{
		assert( () => new Dialogic() ).toThrow();
	} );

	await groupClosed( 'Dialog.prototype.settings can be changed', async () =>
	{
		const d = new Dialogic( 'some string' );

		await it( 'settings property should not be read only', async () =>
		{
			assert( d ).not.hasReadOnlyProperty( 'settings' );
		} );

		await it( 'Try to set new value and read if it\'s set', async () =>
		{
			const propertyName = 'new testing value';
			const originalValue = d.settings.rootElementId;
			d.settings.rootElementId = propertyName;
			assert( d.settings.rootElementId ).equal( propertyName );
			assert( d.settings.rootElementId ).not.equal( originalValue );
			d.settings.rootElementId = originalValue;
		} );

	} );

	await it( 'It\'s possible to add new dynamic property, and new property should not be readonly', async () =>
	{
		const d = new Dialogic( 'some string' );
		const propertyName = 'nonExistingProperty';
		const dialogicWithExtras = /** @type {typeof Dialogic.prototype & Record<string, unknown>} */ ( d );
		dialogicWithExtras[ propertyName ] = propertyName;
		assert( dialogicWithExtras ).not.hasReadOnlyProperty( propertyName );
		assert( dialogicWithExtras[ propertyName ] ).equal( propertyName );
	} );

	await it( 'Dialogic.settings should NOT exists, Dialogic.prototype.settings should', async () =>
	{
		// @ts-ignore
		assert( Dialogic.settings ).not.toBeDefined();
		const d = new Dialogic( 'some string' );
		assert( d.settings ).toBeDefined();
	} );

	await it( 'Test of auto close without autoRun', async () =>
	{
		const d = new Dialogic( 'title', { requireInteraction: false } );
		d.settings.autoCloseAfter = 1000;
		d.createDialogSnippet();
		d.show();
		assert( d.open ).equal( true );
		await new Promise( ( resolve ) => setTimeout( resolve, 1100 ) );
		assert( d.open ).equal( false );
		d.close();
	} );

	await it( 'Test of auto close with autoRun', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: 1000,
			autoRun: true
		} );
		const d = new Dialogic( 'title', { requireInteraction: false } );
		assert( d.open ).equal( true );
		await new Promise( ( resolve ) => setTimeout( resolve, 1100 ) );
		assert( d.open ).equal( false );
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: Dialogic.DEFAULT_SETTINGS.autoCloseAfter,
			autoRun: false
		} );
		d.close();
	} );

	await it( 'Test of NOT auto close', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: 1,
			autoRun: true
		} );
		const d = new Dialogic( 'title', { requireInteraction: true } );
		assert( d.open ).equal( true );
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
		assert( d.open ).equal( true );
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: Dialogic.DEFAULT_SETTINGS.autoCloseAfter,
			autoRun: false
		} );
		d.close();
	} );

	await it( 'Dialogic options should have all properties of Notification options', async () =>
	{
		const notificationOptionNames = [
			'actions', 'badge', 'body', 'data', 'dir', 'icon', 'image', 'lang',
			'renotify', 'requireInteraction', 'silent', 'tag', 'timestamp', 'vibrate'
		];
		const optionValues = {
			actions: [],
			badge: 'badge',
			body: 'body',
			data: { key: 'val' },
			dir: 'ltr',
			icon: 'icon',
			image: 'image',
			lang: 'en',
			renotify: true,
			requireInteraction: true,
			silent: true,
			tag: 'tag',
			timestamp: 1234567890,
			vibrate: [ 100, 200 ]
		};
		const d = new Dialogic( 'title', optionValues );
		for ( const prop of notificationOptionNames ) {
			if ( JSON.stringify( d[ prop ] ) !== JSON.stringify( optionValues[ prop ] ) ) {
				throw new Error( 'Property ' + prop + ' mismatch: expected ' + JSON.stringify( optionValues[ prop ] ) + ', got ' + JSON.stringify( d[ prop ] ) );
			}
		}
	} );

	await it( 'htmlBody should translate HTML string to elements in body', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );
		const d = new Dialogic( 'title', {
			htmlBody: 'content <strong>even with tags</strong><br>line breaks and generally <h4>any HTML</h4>, there are no restrictions'
		} );
		d.createDialogSnippet();
		const description = d.querySelector( 'p[itemprop="abstract"]' );
		assert( description ).toBeDefined();
		assert( description.querySelector( 'strong' ) ).toBeDefined();
		assert( description.querySelector( 'strong' ).textContent ).equal( 'even with tags' );
		assert( description.querySelector( 'br' ) ).toBeDefined();
		assert( description.querySelector( 'h4' ) ).toBeDefined();
		assert( description.querySelector( 'h4' ).textContent ).equal( 'any HTML' );
		d.close();
	} );

	await it( 'Second Dialogic should show immediately after first is closed', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: 5000,
			autoRun: true
		} );
		const d1 = new Dialogic( 'first', { requireInteraction: false } );
		assert( d1.open ).equal( true );
		const d2 = new Dialogic( 'second', { requireInteraction: false } );
		assert( d2.open ).equal( false );
		d1.close();
		assert( d1.open ).equal( false );
		assert( d2.open ).equal( true );
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: Dialogic.DEFAULT_SETTINGS.autoCloseAfter,
			autoRun: false
		} );
		d2.close();
	} );

	await it( 'renotify should control replacement timing and sound', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: 6000,
			autoRun: true
		} );

		const d1 = new Dialogic( 'first', {
			tag: 'renotify-test'
		} );
		assert( d1.open ).equal( true );

		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

		const d2 = new Dialogic( 'second', {
			tag: 'renotify-test',
			renotify: false,
			requireInteraction: false
		} );
		assert( d1.open ).equal( false );
		assert( d2.open ).equal( true );

		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

		const d3 = new Dialogic( 'last', {
			tag: 'renotify-test',
			renotify: true,
			requireInteraction: false
		} );
		assert( d2.open ).equal( true );
		assert( d3.open ).equal( false );

		d2.close();
		assert( d2.open ).equal( false );
		assert( d3.open ).equal( true );

		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );
		d3.close();
	} );

	await it( 'Two requireInteraction Dialogics should display simultaneously', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: 5000,
			autoRun: true
		} );
		const d1 = new Dialogic( 'first', { requireInteraction: true } );
		assert( d1.open ).equal( true );
		const d2 = new Dialogic( 'second', { requireInteraction: true } );
		assert( d2.open ).equal( true );
		applySettings( JSON_SETTINGS_ID, {
			autoCloseAfter: Dialogic.DEFAULT_SETTINGS.autoCloseAfter,
			autoRun: false
		} );
		d1.close();
		d2.close();
	} );

	await it( 'Dialogic with same tag should replace previous one', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: true
		} );
		const d1 = new Dialogic( 'first', { tag: 'unique-tag' } );
		assert( d1.open ).equal( true );
		const d2 = new Dialogic( 'second', { tag: 'unique-tag' } );
		assert( d1.open ).equal( false );
		assert( d2.open ).equal( true );
		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );
		d2.close();
	} );

	await it( 'Event listeners should fire for click, close, error and show', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );

		/** @type {Array.<string>} */
		const eventsFired = [];

		const d = new Dialogic( 'title', {
			body: 'this dialog is with listeners',
			requireInteraction: true
		} );
		d.addEventListener( 'click', () => eventsFired.push( 'click' ) );
		d.addEventListener( 'close', () => eventsFired.push( 'close' ) );
		d.addEventListener( 'error', () => eventsFired.push( 'error' ) );
		d.addEventListener( 'show', () => eventsFired.push( 'show' ) );

		d.show();
		assert( eventsFired.includes( 'show' ) ).equal( true );

		d.dispatchEvent( new Event( 'click' ) );
		assert( eventsFired.includes( 'click' ) ).equal( true );

		d.error();
		assert( eventsFired.includes( 'error' ) ).equal( true );

		d.close();
		assert( eventsFired.includes( 'close' ) ).equal( true );
	} );

	await it( 'on-properties should overwrite existing handlers, addEventListener should append', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );

		/** @type {Array.<string>} */
		const eventsFired = [];

		const d = new Dialogic( 'title', {
			body: 'this dialog is with listeners',
			requireInteraction: true
		} );

		// First add listeners via addEventListener
		d.addEventListener( 'show', () => eventsFired.push( 'show' ) );
		d.addEventListener( 'close', () => eventsFired.push( 'close' ) );

		// Now overwrite with on-properties
		d.onclick = () => eventsFired.push( 'click' );
		d.onclose = () => eventsFired.push( 'close-onproperty' );
		d.onerror = () => eventsFired.push( 'error' );
		d.onshow = () => eventsFired.push( 'show-onproperty' );

		d.show();
		// addEventListener show fires, then onshow fires
		assert( eventsFired.includes( 'show' ) ).equal( true );
		assert( eventsFired.includes( 'show-onproperty' ) ).equal( true );

		d.dispatchEvent( new Event( 'click' ) );
		assert( eventsFired.includes( 'click' ) ).equal( true );

		d.error();
		assert( eventsFired.includes( 'error' ) ).equal( true );

		d.close();
		// addEventListener close fires, then onclose fires
		assert( eventsFired.includes( 'close' ) ).equal( true );
		assert( eventsFired.includes( 'close-onproperty' ) ).equal( true );
	} );

	await it( 'Confirm dialog should trigger onclick on yes and onclose on no', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: true
		} );

		// Test Yes button
		/** @type {Array.<string>} */
		const eventsFromYes = [];
		const d1 = new Dialogic( 'question', {
			type: Dialogic.DIALOG_TYPES.CONFIRM,
			body: 'agree?',
			requireInteraction: true
		} );
		d1.onclick = () => eventsFromYes.push( 'click' );
		d1.onclose = () => eventsFromYes.push( 'close' );

		const confirmYes = d1.querySelector( '.confirm-yes' );
		assert( confirmYes ).toBeDefined();

		confirmYes.dispatchEvent( new Event( 'click', { bubbles: true } ) );
		assert( eventsFromYes.includes( 'click' ) ).equal( true );
		assert( eventsFromYes.includes( 'close' ) ).equal( false );

		// Test No button
		/** @type {Array.<string>} */
		const eventsFromNo = [];
		const d2 = new Dialogic( 'question', {
			type: Dialogic.DIALOG_TYPES.CONFIRM,
			body: 'agree?',
			requireInteraction: true
		} );
		d2.onclick = () => eventsFromNo.push( 'click' );
		d2.onclose = () => eventsFromNo.push( 'close' );

		const confirmNo = d2.querySelector( '.confirm-no' );
		assert( confirmNo ).toBeDefined();

		confirmNo.dispatchEvent( new Event( 'click', { bubbles: true } ) );
		assert( eventsFromNo.includes( 'close' ) ).equal( true );
		assert( eventsFromNo.includes( 'click' ) ).equal( false );

		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );
	} );

	await it( 'Dialogic should store data as structured clone', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );

		const originalData = {
			url: 'https://example.com/review/12345',
			status: 'open',
		};
		const d = new Dialogic( 'New review activity', {
			body: 'Your code submission has received 3 new review comments.',
			data: originalData
		} );

		assert( d.data ).toBeDefined();
		assert( d.data.url ).equal( 'https://example.com/review/12345' );
		assert( d.data.status ).equal( 'open' );

		// data should be a clone, not the same reference
		assert( d.data === originalData ).equal( false );

		// modifying original data should not affect dialog's data
		originalData.status = 'closed';
		assert( d.data.status ).equal( 'open' );

		// data should be read-only
		assert( d ).hasReadOnlyProperty( 'data' );
	} );

	await it( 'Dialogic with timestamp should display immediately with time element', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: true
		} );

		/** @type {Number} */
		const plus30min = Math.floor( Date.now() + 30 + 60 * 1000 );
		const d = new Dialogic( 'title', {
			body: 'Dialog with timestamp',
			timestamp: plus30min
		} );
		assert( d.open ).equal( true );

		/** @type {HTMLTimeElement|null} */
		const timeElement = d.querySelector( '[itemprop="datePosted"]' );
		assert( timeElement ).toBeDefined();

		if ( timeElement ) {
			assert( timeElement.getAttribute( 'title' ) ).equal( 'created at' );
			assert( timeElement.getAttribute( 'itemprop' ) ).equal( 'datePosted' );
			assert( timeElement.getAttribute( 'class' ) ).equal( 'dt-published' );
			assert( timeElement.getAttribute( 'datetime' ) ).equal( new Date( plus30min ).toISOString() );
		}

		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );
		d.close();
	} );

	await it( 'Dialogic with actions should render buttons and fire actionclick events', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: true
		} );

		/** @type {Array.<string>} */
		const actionEvents = [];

		const d = new Dialogic( 'title', {
			body: 'some body text',
			actions: [
				{
					action: 'accept',
					title: '✓ Accept',
					icon: '/images/accept-icon.png',
					navigate: 'https://example.com/accept',
				},
				{
					action: 'decline',
					title: '✕ Decline',
					icon: '/images/decline-icon.png',
					navigate: 'https://example.com/decline',
				}
			],
			requireInteraction: true
		} );
		d.addEventListener( 'actionclick', ( /** @type {CustomEvent} */ event ) =>
		{
			actionEvents.push( event.detail.action );
		} );

		assert( d.open ).equal( true );

		/** @type {NodeListOf<HTMLElement>} */
		const actionButtons = d.querySelectorAll( 'button[data-action]' );
		assert( actionButtons.length ).equal( 2 );

		assert( actionButtons[ 0 ].getAttribute( 'data-action' ) ).equal( 'accept' );
		assert( actionButtons[ 0 ].getAttribute( 'title' ) ).equal( '✓ Accept' );
		assert( actionButtons[ 0 ].querySelector( 'img' ) ).toBeDefined();
		assert( actionButtons[ 0 ].querySelector( 'img' ).getAttribute( 'src' ) ).equal( '/images/accept-icon.png' );

		assert( actionButtons[ 1 ].getAttribute( 'data-action' ) ).equal( 'decline' );
		assert( actionButtons[ 1 ].getAttribute( 'title' ) ).equal( '✕ Decline' );
		assert( actionButtons[ 1 ].querySelector( 'img' ) ).toBeDefined();
		assert( actionButtons[ 1 ].querySelector( 'img' ).getAttribute( 'src' ) ).equal( '/images/decline-icon.png' );

		actionButtons[ 0 ].dispatchEvent( new Event( 'click', { bubbles: true } ) );
		assert( actionEvents.includes( 'accept' ) ).equal( true );
		assert( d.open ).equal( false );

		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );
	} );

	await it( 'Dialogic with badge should render image with max 96x96 dimensions', async () =>
	{
		applySettings( JSON_SETTINGS_ID, {
			autoRun: true
		} );

		const d = new Dialogic( 'title', {
			body: 'body text',
			badge: '/images/badge-icon.png'
		} );
		assert( d.open ).equal( true );

		/** @type {HTMLImageElement|null} */
		const badgeElement = d.querySelector( 'img[ src="/images/badge-icon.png" ]' );
		assert( badgeElement ).toBeDefined();

		if ( badgeElement ) {
			assert( badgeElement.getAttribute( 'src' ) ).equal( '/images/badge-icon.png' );
			assert( badgeElement.getAttribute( 'width' ) ).equal( '96' );
			assert( badgeElement.getAttribute( 'height' ) ).equal( '96' );
		}

		applySettings( JSON_SETTINGS_ID, {
			autoRun: false
		} );
		d.close();
	} );

	// 		beforeEach( () =>
	// 		{
	// 			document.head.insertAdjacentHTML(
	// 				"beforeend",
	// 				`<link data-ictest-style="true" rel="stylesheet" href="./example-css/switch.css" crossorigin="anonymous">
	// <link data-ictest="true" rel="stylesheet" href="./example-css/light.css" fetchpriority="high" crossorigin="anonymous">
	// <link data-ictest="true" rel="stylesheet" href="./example-css/dark.css" title="Dark style" media="(prefers-color-scheme: dark)" crossorigin="anonymous">
	// <link data-ictest="true" rel="alternate stylesheet" href="./example-css/light.css" title="Light style" crossorigin="anonymous">
	// <link data-ictest="true" rel="alternate stylesheet" href="./example-css/alternate.css" title="Alternate style" fetchpriority="low" crossorigin="anonymous">`
	// 			);
	// 		} );

	// 		afterEach( () =>
	// 		{
	// 			document.head.querySelectorAll( '[data-ictest="true"]' ).forEach( link => link.remove() );
	// 		} );

	// 		await it( 'result of StyleSwitch should be some HTMLElement or null', async () =>
	// 		{
	// 			const ss = new StyleSwitch();
	// 			const result = await ss.run();
	// 			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
	// 		} );

	// 		await it( 'Create select as result element', async () =>
	// 		{
	// 			const ss = newa StyleSwitch();
	// 			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.SELECT;
	// 			const result = await ss.run();
	// 			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
	// 			if ( result ) {
	// 				const possibleSelect = result.querySelector( 'select' );
	// 				assert( possibleSelect ).toBeInstanceOf( HTMLSelectElement );
	// 			}
	// 		} );

	// 		await it( 'Request for switch output element, but with more than 2 stylesheets in document… so result should be Select', async () =>
	// 		{
	// 			const ss = new StyleSwitch();
	// 			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.SWITCH;
	// 			const result = await ss.run();
	// 			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
	// 			if ( result ) {
	// 				const possibleSelect = result.querySelector( 'select' );
	// 				assert( possibleSelect ).toBeInstanceOf( HTMLSelectElement );
	// 			}
	// 		} );

	// 		await it( 'Create radios list as result element', async () =>
	// 		{
	// 			const ss = new StyleSwitch();
	// 			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.RADIOS;
	// 			const result = await ss.run();
	// 			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
	// 			if ( result ) {
	// 				const possibleSelect = result.querySelector( 'ul[role=radiogroup]' );
	// 				assert( possibleSelect ).toBeInstanceOf( HTMLUListElement );
	// 			}
	// 		} );

	// 	} );

	// 	await group( 'Two possible StyleSheets in document and output element switch', async () =>
	// 	{

	// 		beforeEach( () =>
	// 		{
	// 			document.head.insertAdjacentHTML(
	// 				"beforeend",
	// 				`<link data-ictest-style="true" rel="stylesheet" href="./example-css/switch.css" crossorigin="anonymous">
	// <link data-ictest="true" rel="stylesheet" href="./example-css/light.css" fetchpriority="high" crossorigin="anonymous">
	// <link data-ictest="true" rel="stylesheet" href="./example-css/dark.css" title="Dark style" media="(prefers-color-scheme: dark)" crossorigin="anonymous">
	// <link data-ictest="true" rel="alternate stylesheet" href="./example-css/light.css" title="Light style" crossorigin="anonymous">`
	// 			);
	// 		} );

	// 		afterEach( () =>
	// 		{
	// 			document.head.querySelectorAll( '[data-ictest="true"]' ).forEach( link => link.remove() );
	// 		} );

	// 		await it( 'Request for switch output element', async () =>
	// 		{
	// 			const ss = new StyleSwitch();
	// 			ss.settings.resultSnippetAppearance.outputFormat = StyleSwitch.OUTPUT_FORMATS.SWITCH;
	// 			const result = await ss.run();
	// 			assert( result ).toBeNullOr.toBeInstanceOf( HTMLElement );
	// 			if ( result ) {
	// 				const possibleSelect = result.querySelector( 'input[type=checkbox][role=switch]' );
	// 				assert( possibleSelect ).toBeInstanceOf( HTMLInputElement );
	// 			}
	// 		} );

	// 	} );

} );
