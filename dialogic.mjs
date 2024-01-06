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
			icon: '', // will be displayed as 96x96 px by default
			image: null,
			lang: '',
			renotify: false,
			requireInteraction: true,
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
		snippetAttributes: {
			dialog: {
				open: false, // create dialog opened by default
				role: 'alertdialog',
			},
			innerWrapper: {
				role: 'document',
				tabIndex: 0,
			},
			icon: {
				alt: 'Dialog icon',
				decoding: 'sync',
				crossOrigin: 'anonymous',
				fetchPriority: 'high',
				width: 96, // html attribute… it means it's in px without unit
				height: 96, // html attribute… it means it's in px without unit
				loading: 'eager',
				className: 'icon',
			},
			title: {
				className: 'title',
			},
			description: {
				className: 'description',
			},
			closer: {
				className: 'closer',
				title: 'close this popup',
			},
			closerDataset: { // data- preffix
			},
		},
		texts: {
			closerTextContent: 'x',
		},
		typeConfirm: {
			yes: 'yes',
			no: 'no',
		},
		CSSStyleSheets: [
			{ href: 'css/dialogic.css', title: 'CSS styles for Dialogic script' /*, integrity: 'sha256-Ovtq2BR6TO/fv2khbLYu9yWRdkPjNVeVffIOEhh4LWY=' */ }
		],
		modulesImportPath: 'https://iiic.dev/js/modules',
		autoRemoveDialogElementOnClose: true,
		autoCloseAfter: 6000, // in ms
		showDialogWaitingBeforeShow: 5, // in ms
		autoRun: true,
	};

	/** @type {HTMLElement|null} */
	#dialogElement = null;

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

		/** @param dialogElement */
		Object.defineProperty( this, 'dialogElement', {
			get: function ()
			{
				return this.#dialogElement;
			},
			set: function ( /** @type {HTMLElement} */ dialogElement )
			{
				if ( dialogElement && 'nodeType' in dialogElement && dialogElement.nodeType === Node.ELEMENT_NODE ) {
					this.#dialogElement = dialogElement;
				} else {
					throw new Error( 'Not a valid HTMLElement' );
				}
			},
			configurable: false,
			enumerable: false,
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

	static async addCSSStyleSheets ( /** @type {Array} */ CSSStyleSheets = [] )
	{

		/** @type {Set} */
		const existingStyleSheets = new Set();

		[ ...document.styleSheets ].forEach( ( /** @type {CSSStyleSheet} */ css ) =>
		{
			if ( css.disabled === false ) {
				existingStyleSheets.add( css.href );
			}
		} );

		return Promise.all( CSSStyleSheets.map( async ( /** @type {Object} */ assignment ) =>
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

}

export class Dialogic extends DialogicInternal
{

	/** @type {Number|null} */
	#runningTimeout = null;

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

		Dialogic.list = this;
		if ( this.settings.autoRun ) {
			this.run();
		}
	}

	addEventListener (
		/** @type {String} */ type = '',
		/** @type {Function} */ listener = Function,
		/** @type {Object} */ options = {},
		/** @type {Boolean} */ useCapture = false
	)
	{
		if ( options && Object.keys( options ).length !== 0 ) {
			this.dialogElement.addEventListener( type, listener, options, useCapture );
		} else {
			this.dialogElement.addEventListener( type, listener, useCapture );
		}
	}

	show ()
	{
		// console.log( 'Dialogic show' );
		if ( this.onshow ) {
			this.onshow();
		}
		this.dialogElement.dispatchEvent( new Event( 'show' ) );
		this.dialogElement.show();
	}

	close ()
	{
		console.log( 'Dialogic close' );
		if ( this.#runningTimeout ) {
			clearTimeout( this.#runningTimeout );
		}
		if ( this.onclose ) {
			this.onclose();
		}

		/** @type {Number} */
		const index = Dialogic.list.indexOf( this );

		if ( index > -1 ) {
			Dialogic.list.splice( index, 1 );
		}
		this.dialogElement.close();
	}

	click ()
	{
		// console.log( 'Dialogic click' );
		if ( this.onclick ) {
			this.onclick();
		}
	}

	error ()
	{
		// console.log( 'Dialogic error' );
		if ( this.onerror ) {
			this.onerror();
		}
		this.dialogElement.error();
	}

	checkRequirements ()
	{
		if ( !this.settings ) {
			throw new Error( 'Settings object is missing' );
		}
	}

	async addCSSStyleSheets ()
	{
		return DialogicInternal.addCSSStyleSheets( this.settings.CSSStyleSheets );
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
		const iconElement = this.icon ? document.createElement( 'IMG' ) : null;

		this.dialogElement = dialogElement;
		Object.assign( dialogElement, { ...{ id: dialogId }, ...this.settings.snippetAttributes.dialog } );
		dialogElement.setAttribute( 'aria-labelledby', titleElementId );
		dialogElement.setAttribute( 'aria-describedby', descriptionElementId );
		Object.assign( innerWrapperElement, this.settings.snippetAttributes.innerWrapper );
		innerWrapperElement.addEventListener( 'click', this.click.bind( this ), {
			capture: false,
			once: false,
			passive: true,
		} );
		if ( iconElement ) {
			Object.assign( iconElement, { ...{ src: this.icon }, ...this.settings.snippetAttributes.icon } );
		}
		titleElement.appendChild( document.createTextNode( this.title ) );
		Object.assign( titleElement, { ...{ id: titleElementId }, ...this.settings.snippetAttributes.title } );
		if ( this.body ) {
			descriptionElement.appendChild( document.createTextNode( this.body ) );
		} else if ( this.htmlBody ) {
			descriptionElement.insertAdjacentHTML( 'beforeend', this.htmlBody );
		}
		Object.assign( descriptionElement, { ...{ id: descriptionElementId }, ...this.settings.snippetAttributes.description } );
		closerElement.appendChild( document.createTextNode( this.settings.texts.closerTextContent ) );
		Object.assign( closerElement, this.settings.snippetAttributes.closer );
		if ( this.settings.snippetAttributes.closerDataset && this.settings.snippetAttributes.closerDataset.length ) {
			for ( const [ key, value ] of Object.entries( this.settings.snippetAttributes.closerDataset ) ) {
				closerElement.dataset[ key ] = value;
			}
		} else {
			closerElement.addEventListener( 'click', this.close.bind( this ), {
				capture: false,
				once: true,
				passive: true,
			} );
		}
		closerElement.addEventListener( 'click', function ( /** @type {PointerEvent} */ event )
		{
			event.stopPropagation();
		}, {
			capture: false,
			once: false,
			passive: false,
		} );
		dialogElement.appendChild( innerWrapperElement );
		if ( iconElement ) {
			innerWrapperElement.appendChild( iconElement );
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
			'sha256-+MupuRrWLEIV9umMAgx9nqCJUfikCsACr9hgHXstC30='
		).then( ( /** @type {Module} */ hashCode ) =>
		{
			return new hashCode.append( String );
		} );
	}

	appendRemoveDialogElementOnCloseListener ()
	{
		if ( this.settings.autoRemoveDialogElementOnClose ) {
			this.addEventListener( 'close', ( /** @type {Event} event */ ) =>
			{
				this.rootElement.removeChild( this.dialogElement );
			}, {
				capture: false,
				once: true,
				passive: true,
			} );
		}
	}

	appendShowNextDialogAfterCloseListener ()
	{
		this.addEventListener( 'close', ( /** @type {Event} event */ ) =>
		{
			this.showDialogsFromQueue();
		}, {
			capture: false,
			once: true,
			passive: true,
		} );
	}

	showDialogsFromQueue ()
	{
		setTimeout( () =>
		{

			/** @type {Boolean} */
			let isSomeDialogShown = false;

			Dialogic.list.forEach( ( /** @type {Dialogic} */ dialog ) =>
			{
				if ( dialog.dialogElement.open ) {
					isSomeDialogShown = true;
				}
			} );
			if ( !isSomeDialogShown ) {

				/** @type {Array} */
				const reversedList = Dialogic.list.reverse();

				if ( reversedList.length ) {
					reversedList[ 0 ].show();
				}
			}
		}, this.settings.showDialogWaitingBeforeShow );
	}

	appendRequireInteractionListener ()
	{
		if ( !this.requireInteraction ) {
			this.#runningTimeout = setTimeout( () =>
			{
				this.close();
			}, this.settings.autoCloseAfter );
		}
	}

	async run ()
	{
		this.checkRequirements();
		await this.loadExternalFunctions();
		await this.addCSSStyleSheets();
		await this.createDialogSnippet();
		this.appendRemoveDialogElementOnCloseListener();
		this.appendRequireInteractionListener();
		this.appendShowNextDialogAfterCloseListener();
		this.showDialogsFromQueue();
	}

}

// Private properties
Object.defineProperty( Dialogic, 'maxActions', { /// @todo : sloučit defineProperty do defineProperties
	get: function ()
	{
		return 2;
	},
	set: function () { },
	enumerable: true,
	configurable: false
} );

Object.defineProperty( Dialogic, '_list', {
	value: [],
	writable: true,
	enumerable: false,
	configurable: false,
} );

Object.defineProperty( Dialogic, 'list', {
	get: function ()
	{
		return this._list;
	},
	set: function ( listItem = Dialogic )
	{
		if ( listItem.constructor.name === 'Dialogic' ) {
			this._list.push( listItem );
		}
	},
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
