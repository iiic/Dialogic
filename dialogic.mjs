import { importWithIntegrity } from '/modules/importWithIntegrity.mjs';

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
			confirmYes: 'BUTTON',
			confirmNo: 'BUTTON',
		},
		snippetIdPrefixes: {
			dialog: 'dialogic-',
			title: 'dialogic-title-',
			description: 'dialogic-description-',
		},
		snippetAttributes: {
			dialog: {
				open: false,
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
			confirmYes: {
				className: 'confirm-yes',
				title: 'answer Yes and close this popup'
			},
			confirmNo: {
				className: 'confirm-no',
				title: 'answer NO and close this popup'
			}
		},
		texts: {
			closerTextContent: 'x',
			confirmYes: 'yes',
			confirmNo: 'no'
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
		Object.defineProperties( this, {
			settings: {
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
			},
			dialogElement: {
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
			}
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

	static async showDialogsFromQueue ( /** @type {Number} */ showDialogWaitingBeforeShow = 5 )
	{
		return new Promise( function ( /** @type {Function} */ resolve )
		{
			setTimeout( function ()
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
				resolve();
			}, showDialogWaitingBeforeShow );
		} );
	}

	static async loadExternalFunctions ( /** @type {String} */ modulesImportPath = '' )
	{
		if ( 'hashCode' in String.prototype ) {
			return;
		}
		return importWithIntegrity(
			modulesImportPath + '/string/hashCode.mjs',
			'sha256-+MupuRrWLEIV9umMAgx9nqCJUfikCsACr9hgHXstC30='
		).then( ( /** @type {Module} */ hashCode ) =>
		{
			return new hashCode.append( String );
		} );
	}

	static removeDialogFromList ( /** @type {Dialogic} */ dialogic = Dialogic.prototype )
	{
		/** @type {Number} */
		const index = Dialogic.list.indexOf( dialogic );

		if ( index > -1 ) {
			Dialogic.list.splice( index, 1 );
		}
	}
}

Object.defineProperty( DialogicInternal, 'list', {
	value: [],
	writable: true,
	enumerable: false,
	configurable: false,
} );

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

		/** @type {Function|null} */
		this.onclick = null;

		/** @type {Function|null} */
		this.onclose = null;

		/** @type {Function|null} */
		this.onerror = null;

		/** @type {Function|null} */
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

		Object.defineProperties( this, {
			title: {
				value: title,
				writable: false,
				enumerable: true,
				configurable: true,
			},
			rootElement: {
				get: function ()
				{

					/** @type {HTMLElement|null} */
					const foundRootElement = this.settings.rootElementId ? document.getElementById( this.settings.rootElementId ) : null;

					return foundRootElement ? foundRootElement : document.body;
				},
				set: function () { },
				configurable: false,
				enumerable: false,
			},
			show: {
				value: function ()
				{
					// console.log( 'Dialogic show' );
					if ( this.onshow ) {
						this.onshow();
					}
					this.dialogElement.dispatchEvent( new Event( 'show' ) );
					this.dialogElement.show();
				},
				writable: false,
				enumerable: true,
				configurable: false,
			},
			close: {
				value: function ()
				{
					// console.log( 'Dialogic close' );
					if ( this.#runningTimeout ) {
						clearTimeout( this.#runningTimeout );
					}
					if ( this.onclose ) {
						this.onclose();
					}
					Dialogic.removeDialogFromList( this );
					this.dialogElement.close();
				},
				writable: false,
				enumerable: true,
				configurable: false,
			},
			click: {
				value: function ()
				{
					// console.log( 'Dialogic click' );
					if ( this.onclick ) {
						this.onclick();
					}
				},
				writable: false,
				enumerable: true,
				configurable: false,
			},
			error: {
				value: function ()
				{
					// console.log( 'Dialogic error' );
					if ( this.onerror ) {
						this.onerror();
					}
					this.dialogElement.error();
				},
				writable: false,
				enumerable: true,
				configurable: false,
			},
			addEventListener: {
				value: function (
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
				},
				writable: false,
				enumerable: true,
				configurable: false,
			},
			run: {
				value: async function ()
				{
					this.checkRequirements();
					await Dialogic.loadExternalFunctions( this.settings.modulesImportPath );
					await Dialogic.addCSSStyleSheets( this.settings.CSSStyleSheets );
					if ( this.createDialogSnippet() ) {
						this.appendRemoveDialogElementOnCloseListener();
						this.appendRequireInteractionListener();
						this.appendShowNextDialogAfterCloseListener();
					}
					Dialogic.showDialogsFromQueue( this.settings.showDialogWaitingBeforeShow );
				},
				writable: false,
				enumerable: false,
				configurable: false,
			}
		} );

		/** @type {HTMLDialogElement} */
		this.dialogElement = document.createElement( this.settings.resultSnippetElements.dialog );

		Dialogic.list = this;
		if ( this.settings.autoRun ) {
			this.run();
		}
	}

	checkRequirements ()
	{
		if ( !this.settings ) {
			throw new Error( 'Settings object is missing' );
		}
	}

	createDialogSnippet ()
	{

		/** @type {HTMLDialogElement} */
		const dialogElement = this.dialogElement;

		if ( dialogElement.open ) {
			return false;
		}

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

		Object.assign( dialogElement, { ...{ id: dialogId }, ...this.settings.snippetAttributes.dialog } );
		dialogElement.setAttribute( 'aria-labelledby', titleElementId );
		dialogElement.setAttribute( 'aria-describedby', descriptionElementId );
		Object.assign( innerWrapperElement, this.settings.snippetAttributes.innerWrapper );
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
		dialogElement.appendChild( innerWrapperElement );
		if ( iconElement ) {
			innerWrapperElement.appendChild( iconElement );
		}
		innerWrapperElement.appendChild( titleElement );
		innerWrapperElement.appendChild( descriptionElement );
		if ( this.type === Dialogic.ALERT ) {
			innerWrapperElement.addEventListener( 'click', this.click.bind( this ), {
				capture: false,
				once: false,
				passive: true,
			} );
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
			dialogElement.appendChild( closerElement );
		} else if ( this.type === Dialogic.CONFIRM ) {

			/** @type {HTMLButtonElement} */
			const confirmYes = document.createElement( this.settings.resultSnippetElements.confirmYes );

			/** @type {HTMLButtonElement} */
			const confirmNo = document.createElement( this.settings.resultSnippetElements.confirmNo );

			Object.assign( confirmYes, this.settings.snippetAttributes.confirmYes );
			Object.assign( confirmNo, this.settings.snippetAttributes.confirmNo );
			confirmYes.appendChild( document.createTextNode( this.settings.texts.confirmYes ) );
			confirmNo.appendChild( document.createTextNode( this.settings.texts.confirmNo ) );
			confirmYes.addEventListener( 'click', ( /** @type {PointerEvent} event */ ) =>
			{
				if ( this.#runningTimeout ) {
					clearTimeout( this.#runningTimeout );
				}
				this.click();
				Dialogic.removeDialogFromList( this );
				this.dialogElement.close(); // close popup without close() event on Dialogic
			}, {
				capture: false,
				once: true,
				passive: true,
			} );
			confirmNo.addEventListener( 'click', ( /** @type {PointerEvent} event */ ) =>
			{
				if ( this.#runningTimeout ) {
					clearTimeout( this.#runningTimeout );
				}
				this.close();
			}, {
				capture: false,
				once: true,
				passive: true,
			} );
			dialogElement.appendChild( confirmYes );
			dialogElement.appendChild( confirmNo );
		}
		this.rootElement.appendChild( dialogElement );
		return true;
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
			Dialogic.showDialogsFromQueue( this.settings.showDialogWaitingBeforeShow );
		}, {
			capture: false,
			once: true,
			passive: true,
		} );
	}

	async appendRequireInteractionListener ()
	{
		return new Promise( ( /** @type {Function} */ resolve ) =>
		{
			if ( this.requireInteraction ) {
				resolve();
			} else {
				this.#runningTimeout = setTimeout( () =>
				{
					this.close();
					resolve();
				}, this.settings.autoCloseAfter );
			}
		} );
	}
}

Object.defineProperties( Dialogic, {
	maxActions: {
		get: function ()
		{
			return 2;
		},
		set: function () { },
		enumerable: true,
		configurable: false
	},
	removeDialogFromList:
	{
		value: DialogicInternal.removeDialogFromList,
		writable: false,
		enumerable: true,
		configurable: false,
	},
	loadExternalFunctions: {
		value: DialogicInternal.loadExternalFunctions,
		writable: false,
		enumerable: true,
		configurable: false,
	},
	list: {
		get: function ()
		{
			return DialogicInternal.list;
		},
		set: function ( /** @type {Dialogic} */ listItem = Dialogic )
		{
			if ( listItem.constructor.name === 'Dialogic' ) {
				DialogicInternal.list.push( listItem );
			}
		},
		enumerable: true,
		configurable: false
	},
	showDialogsFromQueue: {
		value: DialogicInternal.showDialogsFromQueue,
		writable: false,
		enumerable: true,
		configurable: false,
	},
	addCSSStyleSheets: {
		value: DialogicInternal.addCSSStyleSheets,
		writable: false,
		enumerable: true,
		configurable: false,
	},
	ALERT: {
		get: function ()
		{
			return 0;
		},
		set: function () { },
		enumerable: true,
		configurable: false
	},
	CONFIRM: {
		get: function ()
		{
			return 1;
		},
		set: function () { },
		enumerable: true,
		configurable: false
	}
} );

window.Dialogic = Dialogic;
