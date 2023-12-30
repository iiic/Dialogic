import { importWithIntegrity } from '/modules/importWithIntegrity.mjs';

//https://github.com/wootzapp/wootz-browser/blob/11f9323feb5ef4ab7dc420d7c3e9dbe372d868b3/js/web_notification.js#L18

const DialogicInternal = class
{

	/** private (
	 * enumerable: false,
	 * not showing in Object.keys,
	 * not showing in Object.getOwnPropertyDescriptors,
	 * not showing in Object.getOwnPropertyNames
	 * …
	 * )
	 */
	#settings = {
		defaultOptions: {
			actions: [],
			badge: '',
			body: '',
			htmlBody: '',
			data: null,
			dir: 'auto',
			icon: '', // will be displayed as 96x96 px
			image: null,
			lang: '',
			renotify: false,
			requireInteraction: false,
			silent: false,
			tag: '',
			timestamp: Date.now(),
			vibrate: [],
			type: Dialogic.ALERT,
		},
		rootElementId: 'dialogic-canvas',
		resultSnippetElements: {
			dialog: 'DIALOG',
			innerWrapper: 'DIV',
			title: 'H3',
			description: 'P',
			closer: 'BUTTON',
		},
		snippetIdPrefixes: {
			dialog: 'dialogic-',
			title: 'dialogic-title-',
			description: 'dialogic-description-',
		},
		texts: {
			closerTextContent: 'x',
			closerTitle: 'close this popup',
			iconAlt: 'dialog icon',
		},
		typeConfirm: {
			yes: 'yes',
			no: 'no',
		},
		dataAttributes: {},
		CSSStyleSheets: [
			{ href: 'css/dialogic.css', title: 'CSS styles for Dialogic script' /*, integrity: 'sha256-Ovtq2BR6TO/fv2khbLYu9yWRdkPjNVeVffIOEhh4LWY=' */ }
		],
		modulesImportPath: 'https://iiic.dev/js/modules',
		autoRemoveDialogElementOnClose: true, /// @todo
		autoRun: true,
	};

	constructor ()
	{

		/** @param settings */
		Object.defineProperty( this, 'settings', {
			get: function ()
			{
				return this.#settings;
			},
			set: function ( /** @type {Object} */ newSettings )
			{
				this.#settings = DialogicInternal.#deepAssign( this.#settings, newSettings );
			},
			enumerable: true,
			configurable: true
		} );

	}

	static #deepAssign ( /** @type {Array} */ ...args )
	{
		let currentLevel = {};
		args.forEach( ( /** @type {Object} */ source ) =>
		{
			if ( source instanceof Array ) {
				currentLevel = source;
			} else if ( source !== null ) {
				Object.entries( source ).forEach( ( [ /** @type {String} */ key, value ] ) =>
				{
					if ( value instanceof Object && key in currentLevel ) {
						value = DialogicInternal.#deepAssign( currentLevel[ key ], value );
					}
					currentLevel = { ...currentLevel, [ key ]: value };
				} );
			}
		} );
		return currentLevel;
	}

}

export class Dialogic extends DialogicInternal
{
	constructor ( /** @type {String} */ title = '', /** @type {Object} */ options = {} )
	{
		super();
		if ( arguments.length === 0 ) {
			throw new TypeError( 'Failed to construct \'Dialogic\': 1 argument required, but only 0 present.' );
		}

		/** @type {HTMLScriptElement | null} */
		const settingsElement = document.getElementById( 'dialogic-settings' );

		this.settings = settingsElement ? JSON.parse( settingsElement.text ) : null;

		/** @type {Object} */
		const defaultOptions = this.settings.defaultOptions;

		/** @type {Object} */
		options = options === null ? defaultOptions : { ...defaultOptions, ...options };

		/** @param title */
		Object.defineProperty( this, 'title', {
			value: title,
			writable: false,
			enumerable: true,
			configurable: true,
		} );

		this.onclick = null;
		this.onclose = null;
		this.onerror = null;
		this.onshow = null;

		if ( options !== null ) {

			/** @type {Array} */
			const keys = Object.keys( defaultOptions );

			keys.forEach( ( /** @type {String} */ key ) =>
			{
				Object.defineProperty( this, key, {
					value: options[ key ],
					writable: false,
					enumerable: true,
					configurable: true
				} );
			} );
		}

		/** @param rootElement */
		Object.defineProperty( this, 'rootElement', {
			get: function ()
			{

				/** @type {HTMLElement|null} */
				const foundRootElement = this.settings.rootElementId ? document.getElementById( this.settings.rootElementId ) : null;

				return foundRootElement ? foundRootElement : document.body;
			},
			set: function () { },
			configurable: false,
			enumerable: false,
		} );

		if ( this.settings.autoRun ) {
			this.run();
		}
	}

	close ()
	{
		const event = new Event( 'close' );
		this.dispatchEvent( event );
		if ( this.onclose !== null ) {
			this.onclose( event );
		}
	}

	async checkRequirements ()
	{
		if ( !this.settings ) {
			throw new Error( 'Settings object is missing' );
		}
	}

	async addCSSStyleSheets ()
	{

		/** @type {Set} */
		const existingStyleSheets = new Set();

		[ ...document.styleSheets ].forEach( ( /** @type {CSSStyleSheet} */ css ) =>
		{
			if ( css.disabled === false ) {
				existingStyleSheets.add( css.href );
			}
		} );

		return Promise.all( this.settings.CSSStyleSheets.map( async ( /** @type {Object} */ assignment ) =>
		{

			/** @type {URL} */
			let url = URL;

			if ( assignment.href.startsWith( 'https://', 0 ) || assignment.href.startsWith( 'http://', 0 ) ) {
				url = new URL( assignment.href );
			} else {
				url = new URL( assignment.href, window.location.protocol + '//' + window.location.host );
			}
			if ( !existingStyleSheets.has( url.href ) ) {
				return fetch( url.href, {
					method: 'HEAD',
					credentials: 'omit',
					cache: 'force-cache',
					referrerPolicy: 'no-referrer',
					redirect: 'manual',
					mode: 'cors'
				} ).then( function ( /** @type {Response} */ response )
				{
					if ( response.ok && response.status === 200 ) {
						return url.href;
					} else {
						throw new Error( 'Bad path to css stylesheet' );
					}
				} ).then( function ( /** @type {String} */ linkHref )
				{

					/** @type {HTMLLinkElement} */
					const link = document.createElement( 'LINK' );

					link.href = linkHref;
					link.rel = 'stylesheet';
					link.crossOrigin = 'anonymous';
					if ( assignment.title ) {
						link.title = assignment.title;
					}
					if ( assignment.integrity ) {
						link.integrity = assignment.integrity;
					}
					document.head.appendChild( link );
				} ).catch( function ( /** @type {Error|Response} */ error )
				{
					return Promise.reject( error );
				} );
			}
		} ) );
	}

	async createDialogSnippet ()
	{

		/** @type {HTMLDialogElement} */
		const dialogElement = document.createElement( this.settings.resultSnippetElements.dialog );

		/** @type {HTMLElement} */
		const innerWrapperElement = document.createElement( this.settings.resultSnippetElements.innerWrapper );

		/** @type {HTMLHeadingElement} */
		const titleElement = document.createElement( this.settings.resultSnippetElements.title );

		/** @type {HTMLElement} */
		const descriptionElement = document.createElement( this.settings.resultSnippetElements.description );

		/** @type {HTMLElement} */
		const closerElement = document.createElement( this.settings.resultSnippetElements.closer );

		/** @type {String} */
		const dialogId = this.tag ? this.tag : this.settings.snippetIdPrefixes.dialog + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const titleElementId = this.settings.snippetIdPrefixes.title + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const descriptionElementId = this.settings.snippetIdPrefixes.description + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {HTMLImageElement|null} */
		const imageElement = this.icon ? document.createElement( 'IMG' ) : null;

		dialogElement.open = true; // create dialog opened by default
		dialogElement.id = dialogId;
		dialogElement.role = 'alertdialog';
		dialogElement.setAttribute( 'aria-labelledby', titleElementId );
		dialogElement.setAttribute( 'aria-describedby', descriptionElementId );
		innerWrapperElement.role = 'document';
		innerWrapperElement.tabIndex = 0;
		if ( imageElement ) {
			imageElement.src = this.icon;
			imageElement.alt = this.settings.texts.iconAlt ? this.settings.texts.iconAlt : '';
			imageElement.decoding = 'sync';
			imageElement.crossOrigin = 'anonymous';
			imageElement.fetchPriority = 'high';
			imageElement.width = 96;
			imageElement.height = 96;
			imageElement.loading = 'eager';
			imageElement.className = 'icon';
		}
		titleElement.appendChild( document.createTextNode( this.title ) );
		titleElement.id = titleElementId;
		titleElement.className = 'title';
		if ( this.body ) {
			descriptionElement.appendChild( document.createTextNode( this.body ) );
		} else if ( this.htmlBody ) {
			descriptionElement.insertAdjacentHTML( 'beforeend', this.htmlBody );
		}
		descriptionElement.id = descriptionElementId;
		descriptionElement.className = 'description';
		closerElement.className = 'closer';
		closerElement.appendChild( document.createTextNode( this.settings.texts.closerTextContent ) );
		if ( this.settings.texts.closerTitle ) {
			closerElement.title = this.settings.texts.closerTitle;
		}
		if ( this.settings.dataAttributes.closer ) {
			closerElement.setAttribute( this.settings.dataAttributes.closer.name, this.settings.dataAttributes.closer.value );
		} else {
			closerElement.addEventListener( 'click', ( /** @type {PointerEvent} */ event ) =>
			{

				/** @type {HTMLElement} */
				let dialogElement = event.target;

				while ( dialogElement.nodeName !== this.settings.resultSnippetElements.dialog.toUpperCase() ) {
					dialogElement = dialogElement.parentElement;
				}
				dialogElement.close();
			}, {
				capture: false,
				once: false,
				passive: true,
			} );
		}

		dialogElement.appendChild( innerWrapperElement );
		if ( imageElement ) {
			innerWrapperElement.appendChild( imageElement );
		}
		innerWrapperElement.appendChild( titleElement );
		innerWrapperElement.appendChild( descriptionElement );
		dialogElement.appendChild( closerElement );
		this.rootElement.appendChild( dialogElement );
	}

	async loadExternalFunctions ()
	{
		if ( 'hashCode' in String.prototype ) {
			return;
		}
		return importWithIntegrity(
			this.settings.modulesImportPath + '/string/hashCode.mjs',
			'sha256-wujpULOI6urz9Qust0pbGs0BBeNwwfuxyg6lPGPioNA='
		).then( ( /** @type {Module} */ hashCode ) =>
		{
			return new hashCode.append( String );
		} );
	}

	async run ()
	{
		await this.checkRequirements();
		await this.loadExternalFunctions();
		await this.addCSSStyleSheets();
		await this.createDialogSnippet();
	}

}

// Private properties
Object.defineProperty( Dialogic, 'maxActions', {
	get: function ()
	{
		return 2;
	},
	set: function () { },
	enumerable: true,
	configurable: false
} );

Object.defineProperty( Dialogic, 'ALERT', {
	get: function ()
	{
		return 0;
	},
	set: function () { },
	enumerable: true,
	configurable: false
} );

Object.defineProperty( Dialogic, 'CONFIRM', {
	get: function ()
	{
		return 1;
	},
	set: function () { },
	enumerable: true,
	configurable: false
} );

window.Dialogic = Dialogic;
