/**
 * @typedef { 'auto' | 'ltr' | 'rtl' } DirString
 */

// @ts-ignore
import { importWithIntegrity } from '/modules/importWithIntegrity.mjs';

/**
 * @class
 * @description internal class, not accessible from outside the script
 */
const DialogicInternal = class
{

	/** @type {Array} */
	static list = [];

	/**
	 * @returns {Array}
	 * @ignore
	 */
	static getList ()
	{
		console.debug( '%c DialogicInternal %c (static) getList %c DialogicInternal.list: ',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			DialogicInternal.list
		);

		return DialogicInternal.list;
	}
	/**
	 * @ignore
	 */
	static setList ( /** @type {Dialogic.prototype} */ listItem )
	{
		console.groupCollapsed( '%c DialogicInternal %c (static) setList',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			arguments
		);

		if ( listItem.constructor.name === 'Dialogic' ) {
			DialogicInternal.list.push( listItem );
		}

		console.groupEnd();
	}

	/**
	 * @type {Object}
	 * @ignore
	 */
	#settings = {
		rootElementId: 'dialogic-canvas',
		resultSnippetElements: {
			dialog: 'dialog',
			innerWrapper: 'div',
			image: 'img',
			title: 'h3',
			icon: 'img',
			description: 'p',
			closer: 'button',
			actionsWrapper: 'div',
			confirmYes: 'button',
			confirmNo: 'button',
			confirmYesInner: 'data',
			confirmNoInner: 'data',
			timePublished: 'time',
			timeUpdated: 'time',
			timeExpires: 'time',
			lang: 'meta',
			schemaVersion: 'a',
			accessMode: 'meta',
			accessibilityAPI: 'meta',
			accessibilityControl: 'meta',
			creativeWorkStatus: 'meta'
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
				itemscope: '',
				itemtype: 'https://schema.org/SpecialAnnouncement',
				class: 'h-entry',
			},
			innerWrapper: {
				role: 'document',
				tabindex: 0,
				itemprop: 'text',
				class: 'e-content',
			},
			icon: {
				alt: 'Dialog icon',
				decoding: 'sync',
				crossorigin: 'anonymous',
				fetchpriority: 'high',
				width: 96, // html attribute… it means it's in px without unit
				height: 96, // html attribute… it means it's in px without unit
				loading: 'eager',
				itemprop: 'thumbnail',
				class: 'u-featured',
			},
			image: {
				itemprop: 'image',
			},
			title: {
				itemprop: 'headline name',
				class: 'p-name',
			},
			description: {
				itemprop: 'abstract',
				class: 'p-summary',
			},
			timePublished: {
				itemprop: 'datePosted',
				class: 'dt-published',
			},
			timeUpdated: {
				class: 'dt-updated',
			},
			timeExpires: {
				itemprop: 'expires',
			},
			closer: {
				class: 'closer',
				title: 'close this popup',
			},
			closerDataset: { // data- prefix
			},
			confirmYes: {
				class: 'confirm-yes',
				title: 'answer Yes and close this popup'
			},
			confirmNo: {
				class: 'confirm-no',
				title: 'answer NO and close this popup'
			},
			confirmYesInner: {
				class: 'p-rsvp',
				value: 'yes',
			},
			confirmNoInner: {
				class: 'p-rsvp',
				value: 'no',
			},
			lang: {
				itemprop: 'inLanguage'
			},
			schemaVersion: {
				href: 'https://schema.org/version/26.0',
				itemprop: 'schemaVersion',
				hidden: true
			},
			accessMode: {
				itemprop: 'accessMode',
				content: 'textual visual',
			},
			accessibilityAPI: {
				itemprop: 'accessibilityAPI',
				content: 'ARIA',
			},
			accessibilityControl: {
				itemprop: 'accessibilityControl',
				content: 'fullKeyboardControl fullMouseControl fullTouchControl',
			},
			creativeWorkStatus: {
				itemprop: 'creativeWorkStatus',
				content: 'Draft',
			}
		},
		texts: {
			closerTextContent: 'x',
			confirmYes: 'yes',
			confirmNo: 'no',
			iconAlt: 'icon',
			imageAlt: 'image',
			dividerBetweenButtons: ' ',
			timestampCreatedTitle: 'created at',
			timestampUpdatedTitle: 'updated at',
		},
		CSSStyleSheets: [
			{ href: 'css/dialogic.css', title: 'CSS styles for Dialogic script' }
		],
		preloadFiles: [
			{ as: 'style', href: 'css/dialogic.css', 'data-integrity': 'sha256-ymXTU3JziuuUCLcA28TR0Lw39jn5rgOAZuij69qWVrA=' },
			{ as: 'audio', href: 'media/bell.mp3' },
		],
		dialogShowAudio: 'media/bell.mp3',
		modulesImportPath: '/modules', // 'https://iiic.dev/js/modules',
		autoRemoveDialogElementOnClose: true,
		showTimeIfDiff: 30, // in s
		autoCloseAfter: 6000, // in ms
		showDialogWaitingBeforeShow: 5, // in ms
		autoRun: true,
	};

	/**
	 * @returns {Object}
	 * @ignore
	 */
	getSettings ()
	{
		return this.#settings;
	}
	/** @ignore */
	setSettings ( /** @type {Object} */ newSettings = {} )
	{
		console.groupCollapsed( '%c DialogicInternal %c setSettings %c newSettings:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			newSettings
		);

		this.#settings = DialogicInternal.#deepAssign( this.#settings, newSettings );

		console.groupEnd();
	}

	/**
	 * @type {HTMLElement|null}
	 * @ignore
	 */
	#dialogElement;

	/**
	 * @returns {HTMLElement|null}
	 * @ignore
	 */
	getDialogElement ()
	{
		console.debug( '%c DialogicInternal %c getDialogElement %c this.#dialogElement:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			this.#dialogElement
		);

		return this.#dialogElement;
	}
	/** @ignore */
	setDialogElement ( /** @type {HTMLElement} */ dialogElement = HTMLDialogElement.prototype )
	{
		console.groupCollapsed( '%c DialogicInternal %c setDialogElement %c dialogElement:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			dialogElement
		);

		if ( dialogElement && 'nodeType' in dialogElement && dialogElement.nodeType === Node.ELEMENT_NODE ) {
			this.#dialogElement = dialogElement;
		} else {
			throw new Error( 'Not a valid HTMLElement' );
		}

		console.groupEnd();
	}

	/**
	 * @type {DirString}
	 * @ignore
	 */
	#dir = 'auto';

	/**
	 * @returns {DirString}
	 * @ignore
	 */
	getDir ()
	{
		console.debug( '%c DialogicInternal %c getDir %c this.#dir: ' + this.#dir,
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
		);

		return this.#dir;
	}
	/** @ignore */
	setDir ( /** @type {DirString} */ dir = 'auto' )
	{
		console.groupCollapsed( '%c DialogicInternal %c setDir %c dir:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			dir
		);

		if ( ![ 'auto', 'ltr', 'rtl' ].includes( dir ) ) {
			throw new Error( 'Dir value is invalid' );
		}
		this.#dir = dir;

		console.groupEnd();
	}

	/**
	 * @description identifier of timeout for automatic dialog close
	 * @type {Number|null}
	 */
	#runningTimeout = null;

	/**
	 * @description is / was this dialog already displayed
	 * @type {Boolean}
	 * @public
	 */
	displayed = false;

	/**
	 * @description function called when pointer event (like click) on dialog body
	 * @type {Function|null}
	 * @public
	 */
	onclick = null;

	/**
	 * @description function called on dialog close
	 * @type {Function|null}
	 * @public
	 */
	onclose = null;

	/**
	 * @description function called on error
	 * @type {Function|null}
	 * @public
	 */
	onerror = null;

	/**
	 * @description function called on dialog show
	 * @type {Function|null}
	 * @public
	 */
	onshow = null;

	constructor ( /** @type {String} */ title, /** @type {Object} */ options = {}, settingsElementId = 'dialogic-settings' )
	{
		console.groupCollapsed( '%c DialogicInternal %c constructor',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			arguments
		);

		if ( arguments.length === 0 ) {
			throw new TypeError( 'Failed to construct \'Dialogic\': 1 argument required, but only 0 present.' );
		}
		this.createProperties( {
			enumerable: [

				/**
				 * @property {HTMLElement|null} dialogElement
				 * @name DialogicInternal#dialogElement
				 * @default null
				 * @readonly
				 */
				'dialogElement',

				/**
				 * @property {HTMLAudioElement|null} dialogShowAudio
				 * @name DialogicInternal.dialogShowAudio
				 * @default null
				 * @readonly
				 */
				'dialogShowAudio',

			],
			'configurable enumerable':
			{

				/**
				 * @property {Object} settings
				 * @name DialogicInternal#settings
				 * @readonly
				 */
				settings: {},

				/**
				 * @property {DirString} dir
				 * @name DialogicInternal#dir
				 * @default 'auto'
				 * @readonly
				 */
				dir: 'auto',

			}
		} );
		Object.defineProperties( this, {

			/**
			 * @property {Object} eventListeners
			 * @name DialogicInternal#eventListeners
			 * @readonly
			 */
			eventListeners: {
				value: {
					click: {
						preventClickOnClose: function ( /** @type {PointerEvent} */ event )
						{
							console.debug( '%c DialogicInternal %c preventClickOnClose %c event:',
								Dialogic.CONSOLE.CLASS_NAME,
								Dialogic.CONSOLE.METHOD_NAME,
								Dialogic.CONSOLE.INTEREST_PARAMETER,
								event
							);

							event.stopPropagation();
						},
						confirmYes: function ( /** @type {PointerEvent} event */ )
						{

							console.groupCollapsed( '%c DialogicInternal %c confirmYes',
								Dialogic.CONSOLE.CLASS_NAME,
								Dialogic.CONSOLE.METHOD_NAME
							);

							if ( this.#runningTimeout ) {
								clearTimeout( this.#runningTimeout );
							}
							this.click();
							Dialogic.removeDialogFromList( this );
							this.dialogElement.close(); // close popup without close() event on Dialogic

							console.groupEnd();
						},
						confirmNo: function ( /** @type {PointerEvent} event */ )
						{
							console.groupCollapsed( '%c DialogicInternal %c confirmNo',
								Dialogic.CONSOLE.CLASS_NAME,
								Dialogic.CONSOLE.METHOD_NAME
							);

							if ( this.#runningTimeout ) {
								clearTimeout( this.#runningTimeout );
							}
							this.close();

							console.groupEnd();
						},
						focusOnPopup: function ( /** @type {PointerEvent} */ event )
						{
							console.groupCollapsed( '%c DialogicInternal %c focusOnPopup',
								Dialogic.CONSOLE.CLASS_NAME,
								Dialogic.CONSOLE.METHOD_NAME
							);

							if ( event.target === this.dialogElement ) {

								/** @type {HTMLElement} */
								const innerWrapperElement = this.dialogElement.firstElementChild;

								innerWrapperElement.contentEditable = 'true'; // string with true/false not Boolean
								innerWrapperElement.focus(); // { focusVisible: true } option currently not working
								innerWrapperElement.contentEditable = 'false';
							}

							console.groupEnd();
						},
					},
					close: {
						showNextDialog: function ( /** @type {Event} event */ )
						{
							console.groupCollapsed( '%c DialogicInternal %c showNextDialog',
								Dialogic.CONSOLE.CLASS_NAME,
								Dialogic.CONSOLE.METHOD_NAME
							);

							Dialogic.showDialogsFromQueue( this.settings.showDialogWaitingBeforeShow );

							console.groupEnd();
						},
						removeDialogElement: function ( /** @type {Event} event */ )
						{
							console.groupCollapsed( '%c DialogicInternal %c removeDialogElement',
								Dialogic.CONSOLE.CLASS_NAME,
								Dialogic.CONSOLE.METHOD_NAME
							);

							this.rootElement.removeChild( this.dialogElement );

							console.groupEnd();
						},
					}
				},
				writable: false,
				enumerable: false,
				configurable: false,
			},

		} );

		this.title = title;

		/** @type {HTMLScriptElement | null} */
		const settingsElement = document.getElementById( settingsElementId );

		this.settings = settingsElement ? JSON.parse( settingsElement.text ) : null;
		if ( options ) {

			/** @type {Array} */
			const keys = Object.keys( options );

			keys.forEach( ( /** @type {String} */ key ) =>
			{
				this[ key ] = options[ key ];
			} );
		}

		/** @type {HTMLDialogElement} */
		this.dialogElement = document.createElement( this.settings.resultSnippetElements.dialog );

		Dialogic.list = this;

		console.groupEnd();
	}

	/** @ignore */
	static emptySetter () { }

	/**
	 * @returns {Number}
	 * @ignore
	 */
	static getMaxActions ()
	{
		console.debug( '%c DialogicInternal %c (static) getMaxActions',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		return 2;
	}

	/**
	 * @returns {Number}
	 * @ignore
	 */
	static getALERT ()
	{
		console.debug( '%c DialogicInternal %c (static) getALERT',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		return 0;
	}

	/**
	 * @returns {Number}
	 * @ignore
	 */
	static getCONFIRM ()
	{
		console.debug( '%c DialogicInternal %c (static) getCONFIRM',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		return 1;
	}

	/**
	 * @returns {Object}
	 * @ignore
	 */
	static getCONSOLE ()
	{
		return {
			DEFAULT_TEXT: 'color: white',
			CLASS_NAME: 'color: gray',
			METHOD_NAME: 'font-weight: normal; color: green',
			INTEREST_PARAMETER: 'font-weight: normal; font-size: x-small; color: teal',
			EVENT_TEXT: 'color: orange',
			WARNING: 'color: red',
		};
	}

	static #deepAssign ( /** @type {Array} */ ...args )
	{
		console.groupCollapsed( '%c DialogicInternal %c (static) #deepAssign %c args:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			args
		);

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

		console.groupEnd();

		return currentLevel;
	}

	static addLinksIntoHead ( /** @type {Object} */ attributesObject = {}, /** @type {String} */ rel = 'preload', /** @type {Set|null} */ excludeSet = null )
	{
		console.groupCollapsed( '%c DialogicInternal %c (static) addLinksIntoHead',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			arguments
		);

		attributesObject.forEach( function ( /** @type {Object} */ resource = {} )
		{

			/** @type {URL} */
			const url = DialogicInternal.getAbsoluteUrl( resource[ 'href' ] );

			if ( url && !excludeSet.has( url.href ) ) {

				/** @type {HTMLLinkElement} */
				const link = document.createElement( 'link' );

				/** @type {Array} */
				const attributeNames = Object.keys( resource );

				link.rel = rel;
				link.crossOrigin = 'anonymous';
				attributeNames.forEach( function ( /** @type {String} */ attributeName = '' )
				{
					if ( attributeName === 'href' ) {
						resource[ attributeName ] = url.href;
					}
					link.setAttribute( attributeName, resource[ attributeName ] );
				} );
				document.head.appendChild( link );
			}
		} );

		console.groupEnd();
	}

	static addCSSStyleSheets ( /** @type {Array} */ CSSStyleSheets = [], /** @type {String} */ rel = 'stylesheet' )
	{
		console.groupCollapsed( '%c DialogicInternal %c (static) addCSSStyleSheets',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			arguments
		);

		/** @type {Set} */
		const existingStyleSheets = new Set();

		[ ...document.styleSheets ].forEach( ( /** @type {CSSStyleSheet} */ css ) =>
		{
			if ( css.disabled === false ) {
				existingStyleSheets.add( css.href );
			}
		} );

		DialogicInternal.addLinksIntoHead( CSSStyleSheets, rel, existingStyleSheets );

		console.groupEnd();
	}

	static preloadResources ( /** @type {Array} */ resources = [], /** @type {String} */ rel = 'preload' )
	{
		console.groupCollapsed( '%c DialogicInternal %c (static) preloadResources',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			arguments
		);

		/** @type {NodeList} */
		const alreadyPreloaded = document.querySelectorAll( 'link[rel=preload][href]' );

		/** @type {Set} */
		const preloadedHrefList = new Set();

		alreadyPreloaded.forEach( function ( /** @type {HTMLLinkElement} */ link )
		{
			preloadedHrefList.add( link.href );
		} );

		DialogicInternal.addLinksIntoHead( resources, rel, preloadedHrefList );

		console.groupEnd();
	}

	static async showDialogsFromQueue ( /** @type {Number} */ showDialogWaitingBeforeShow = 5 )
	{
		console.debug( '%c DialogicInternal %c (static async) showDialogsFromQueue %c showDialogWaitingBeforeShow:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			showDialogWaitingBeforeShow
		);

		return new Promise( function ( /** @type {Function} */ resolve )
		{
			setTimeout( function ()
			{

				console.groupCollapsed( '%c DialogicInternal %c inner setTimeout inside promise %c (inside showDialogsFromQueue)',
					Dialogic.CONSOLE.CLASS_NAME,
					Dialogic.CONSOLE.DEFAULT_TEXT,
					Dialogic.CONSOLE.METHOD_NAME
				);

				/** @type {Array} */
				const reversedList = Dialogic.list.reverse();

				/** @type {Number} */
				const reversedListLength = reversedList.length;

				console.debug( ' %c DialogicInternal %c number of dialogs in list: %c reversedListLength:',
					Dialogic.CONSOLE.CLASS_NAME,
					Dialogic.CONSOLE.DEFAULT_TEXT,
					Dialogic.CONSOLE.INTEREST_PARAMETER,
					reversedListLength
				);

				for ( let i = 0; i < reversedListLength; i++ ) {
					if ( Dialogic.shouldBeDisplayed( reversedList[ i ] ) ) {
						console.debug( ' %c DialogicInternal %c found dialog to be displayed: %c reversedList[ i ]:',
							Dialogic.CONSOLE.CLASS_NAME,
							Dialogic.CONSOLE.DEFAULT_TEXT,
							Dialogic.CONSOLE.INTEREST_PARAMETER,
							reversedList[ i ]
						);
						reversedList[ i ].show();
						break;
					} else {
						console.debug( ' %c DialogicInternal %c dialog in list, but NOT to be displayed now %c reversedList[ i ]:',
							Dialogic.CONSOLE.CLASS_NAME,
							Dialogic.CONSOLE.DEFAULT_TEXT,
							Dialogic.CONSOLE.INTEREST_PARAMETER,
							reversedList[ i ]
						);
					}
				}

				console.groupEnd();

				resolve();
			}, showDialogWaitingBeforeShow );
		} );
	}

	static async loadExternalFunctions ( /** @type {String} */ modulesImportPath = '' )
	{ /// @todo : tahle funkce to do document.head vrátí vícekrát, měla by se dělat kontrola a pokud už to v head je, tak element znovu nevytvářet, jen nevím jestli tu opravu mít spíše tady nebo v importWithIntegrity(), zkontrolovat obě možnosti
		console.debug( '%c DialogicInternal %c (static async) loadExternalFunctions %c modulesImportPath:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			modulesImportPath
		);

		return Promise.all( [
			{
				name: 'hashCode',
				appendInto: String,
				path: modulesImportPath + '/string/hashCode.mjs',
				integrity: 'sha256-4tiphaWWIybGhWVriVschX8Wtl7oOGP6fCt/tu7Jt0M='
			},
			{
				name: 'setMultipleAttributes',
				appendInto: Element,
				path: modulesImportPath + '/element/setMultipleAttributes.mjs',
				integrity: 'sha256-Lza0Ffmr4xZiHN/nbYoCri8nbuE+HRI6GMNaORCLEQo='
			},
		].map( async ( { name, appendInto, path, integrity } ) =>
		{
			if ( !appendInto.hasOwnProperty( name ) ) {
				return importWithIntegrity(
					path,
					integrity
				).then( ( /** @type {module} */ module ) =>
				{
					return new module.append( appendInto );
				} );
			}
		} ) );
	}

	static getAbsoluteUrl ( /** @type {String} */ urlString )
	{
		console.debug( '%c DialogicInternal %c (static) getAbsoluteUrl %c urlString:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			urlString
		);

		/** @type {URL} */
		let url;

		if ( urlString.startsWith( 'https://', 0 ) || urlString.startsWith( 'http://', 0 ) ) {
			url = new URL( urlString );
		} else {
			url = new URL( urlString, window.location.protocol + '//' + window.location.host );
		}
		return url;
	}

	static removeDialogFromList ( /** @type {Dialogic.prototype} */ dialogic )
	{
		console.groupCollapsed( '%c DialogicInternal %c (static) removeDialogFromList %c dialogic',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			dialogic
		);

		/** @type {Number} */
		const index = Dialogic.list.indexOf( dialogic );

		if ( index > -1 ) {
			Dialogic.list.splice( index, 1 );
		}

		console.groupEnd();
	}

	static shouldBeDisplayed ( /** @type {HTMLDialogElement} */ dialog )
	{
		console.groupCollapsed( '%c DialogicInternal %c (static) shouldBeDisplayed %c dialog:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			dialog
		);

		if ( dialog.open ) {
			console.debug( '%c DialogicInternal %c (static) shouldBeDisplayed %c NO, this dialog is opened right now',
				Dialogic.CONSOLE.CLASS_NAME,
				Dialogic.CONSOLE.METHOD_NAME,
				Dialogic.CONSOLE.DEFAULT_TEXT
			);
			console.groupEnd();
			return false;
		}
		if ( dialog.displayed ) {
			console.debug( '%c DialogicInternal %c (static) shouldBeDisplayed %c NO, this dialog was already displayed',
				Dialogic.CONSOLE.CLASS_NAME,
				Dialogic.CONSOLE.METHOD_NAME,
				Dialogic.CONSOLE.DEFAULT_TEXT
			);
			console.groupEnd();
			return false;
		}
		if ( dialog.renotify ) {
			console.debug( '%c DialogicInternal %c (static) shouldBeDisplayed %c YES, this dialog have renotify property',
				Dialogic.CONSOLE.CLASS_NAME,
				Dialogic.CONSOLE.METHOD_NAME,
				Dialogic.CONSOLE.DEFAULT_TEXT
			);
			console.groupEnd();
			return true;
		}

		/** @const {Number} */
		const listLength = Dialogic.list.length;

		for ( let i = 0; i < listLength; i++ ) {
			if ( Dialogic.list[ i ].dialogElement.open ) {
				console.debug( '%c DialogicInternal %c (static) shouldBeDisplayed %c NO, some another dialog is displayed right now',
					Dialogic.CONSOLE.CLASS_NAME,
					Dialogic.CONSOLE.METHOD_NAME,
					Dialogic.CONSOLE.DEFAULT_TEXT
				);
				console.groupEnd();
				return false;
			}
			if (
				dialog.tag
				&& Dialogic.list[ i ].tag === dialog.tag
				&& Dialogic.list[ i ].displayed
			) {
				console.debug( '%c DialogicInternal %c (static) shouldBeDisplayed %c NO',
					Dialogic.CONSOLE.CLASS_NAME,
					Dialogic.CONSOLE.METHOD_NAME,
					Dialogic.CONSOLE.DEFAULT_TEXT
				);
				console.groupEnd();
				return false;
			}
		}

		console.debug( '%c DialogicInternal %c (static) shouldBeDisplayed %c YES',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.DEFAULT_TEXT
		);
		console.groupEnd();
		return true;
	}

	getRootElement ()
	{
		console.debug( '%c DialogicInternal %c getRootElement',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		/** @type {HTMLElement|null} */
		const foundRootElement = this.settings.rootElementId ? document.getElementById( this.settings.rootElementId ) : null;

		return foundRootElement ? foundRootElement : document.body;
	}

	#playAudio ()
	{
		console.groupCollapsed( '%c DialogicInternal %c #playAudio',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		if ( !this.silent && this.settings.dialogShowAudio ) {
			if ( DialogicInternal.dialogShowAudio ) { // audio already played, reset timer and play again

				/** @type {HTMLAudioElement} */
				const audio = DialogicInternal.dialogShowAudio;

				audio.pause();
				audio.currentTime = 0;
				audio.play();
			} else { // load new audio

				/** @type {URL} */
				const url = DialogicInternal.getAbsoluteUrl( this.settings.dialogShowAudio );

				/** @type {HTMLAudioElement} */
				const audio = new Audio( url.href );

				audio.addEventListener( 'canplaythrough', ( /** @type {Event} event */ ) =>
				{
					audio.play();
				} );
				DialogicInternal.dialogShowAudio = audio;
			}
		}

		console.groupEnd();
	}

	click ()
	{
		console.groupCollapsed( '%c DialogicInternal %c click',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		if ( this.onclick ) {
			this.onclick();
		}

		console.groupEnd();
	}

	show ()
	{
		console.groupCollapsed( '%c DialogicInternal %c show %c this:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			this
		);

		if ( this.onshow ) {
			this.onshow();
		}
		this.#playAudio();
		if ( this.vibrate ) {
			navigator.vibrate( this.vibrate );
		}

		/** @type {HTMLMetaElement|null} */
		const creativeWorkStatus = this.dialogElement.querySelector( '[itemprop=creativeWorkStatus]' );

		if ( creativeWorkStatus ) {
			creativeWorkStatus.content = 'Published';
		}

		this.displayed = true;
		this.dialogElement.dispatchEvent( new Event( 'show' ) );
		this.dialogElement.show();

		console.groupEnd();
	}

	close ()
	{
		console.groupCollapsed( '%c DialogicInternal %c close',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		if ( this.#runningTimeout ) {
			clearTimeout( this.#runningTimeout );
		}
		if ( this.onclose ) {
			this.onclose();
		}

		/** @type {HTMLMetaElement|null} */
		const creativeWorkStatus = this.dialogElement.querySelector( '[itemprop=creativeWorkStatus]' );

		if ( creativeWorkStatus ) {
			creativeWorkStatus.content = 'Obsolete';
		}

		if ( !this.tag ) {
			Dialogic.removeDialogFromList( this );
		}
		this.dialogElement.close();

		console.groupEnd();
	}

	error ()
	{
		console.groupCollapsed( '%c DialogicInternal %c error',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		if ( this.onerror ) {
			this.onerror();
		}
		this.dialogElement.dispatchEvent( new Event( 'error' ) );

		console.groupEnd();
	}

	addEventListener (
		/** @type {String} */ type,
		/** @type {Function} */ listener,
		/** @type {Object} */ options = {},
		/** @type {Boolean} */ useCapture = false
	)
	{
		console.groupCollapsed( '%c DialogicInternal %c addEventListener',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			arguments
		);

		if ( options && Object.keys( options ).length !== 0 ) {
			this.dialogElement.addEventListener( type, listener, options );
		} else {
			this.dialogElement.addEventListener( type, listener, useCapture );
		}

		console.groupEnd();
	}

	/** @returns {Promise} */
	async appendRequireInteractionListener ()
	{
		console.debug( '%c DialogicInternal %c (async) appendRequireInteractionListener',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

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

	appendShowNextDialogAfterCloseListener ()
	{
		console.groupCollapsed( '%c DialogicInternal %c appendShowNextDialogAfterCloseListener',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		this.addEventListener( 'close', this.eventListeners.close.showNextDialog.bind( this ), {
			capture: false,
			once: true,
			passive: true,
		} );

		console.groupEnd();
	}

	appendRemoveDialogElementOnCloseListener ()
	{
		console.groupCollapsed( '%c DialogicInternal %c appendRemoveDialogElementOnCloseListener',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		if ( this.settings.autoRemoveDialogElementOnClose ) {
			this.addEventListener( 'close', this.eventListeners.close.removeDialogElement.bind( this ), {
				capture: false,
				once: true,
				passive: true,
			} );
		}

		console.groupEnd();
	}

	addAttributesToElements ( /** @type {Object} */ elements = {} )
	{
		console.groupCollapsed( '%c DialogicInternal %c addAttributesToElements %c elements:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			elements
		);

		/** @type {Array} */
		const elementNames = Object.keys( elements );

		elementNames.forEach( ( /** @type {String} */ elementName ) =>
		{

			/** @type {Object|undefined} */
			const attributes = this.settings.snippetAttributes[ elementName ];

			/** @type {HTMLElement|null} */
			const element = elements[ elementName ]

			if ( element && attributes ) {
				element.setMultipleAttributes( attributes );
			}
		} );

		console.groupEnd();

		return elements;
	}

	createAllElements ()
	{
		console.groupCollapsed( '%c DialogicInternal %c createAllElements',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		/** @type {Object} */
		const elements = {};

		/** @type {Array} */
		const elementNames = Object.keys( this.settings.resultSnippetElements );

		elementNames.forEach( ( /** @type {String} */ elementName ) =>
		{
			if ( this.hasOwnProperty( elementName ) ) {
				elements[ elementName ] = this[ elementName ] ? document.createElement( this.settings.resultSnippetElements[ elementName ] ) : null;
			} else {
				elements[ elementName ] = document.createElement( this.settings.resultSnippetElements[ elementName ] );
			}
		} );

		console.debug( { elements } );
		console.groupEnd();

		return elements;
	}

	createDomStructureFrom ( /** @type {Object} */ elements = {} )
	{
		console.groupCollapsed( '%c DialogicInternal %c createDomStructureFrom %c elements:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			elements
		);

		if ( elements.image ) {
			elements.innerWrapper.appendChild( elements.image );
		}
		elements.title.appendChild( document.createTextNode( this.title ) );
		if ( this.body ) {
			elements.description.appendChild( document.createTextNode( this.body ) );
		} else if ( this.htmlBody ) {
			elements.description.insertAdjacentHTML( 'beforeend', this.htmlBody );
		}
		elements.schemaVersion.appendChild( document.createTextNode( '26.0' ) );
		elements.dialog.appendChild( elements.innerWrapper );
		if ( this.icon ) {
			elements.innerWrapper.appendChild( elements.icon );
		}
		elements.innerWrapper.appendChild( elements.title );
		elements.innerWrapper.appendChild( elements.description );
		if ( elements.timeElement ) {
			elements.innerWrapper.appendChild( elements.timeElement );
		}
		if ( this.type === Dialogic.CONFIRM ) {
			elements.innerWrapper.appendChild( elements.actionsWrapper );
		}
		if ( elements.lang ) {
			elements.dialog.appendChild( elements.lang );
		}
		elements.dialog.appendChild( elements.schemaVersion );
		elements.dialog.appendChild( elements.accessMode );
		elements.dialog.appendChild( elements.accessibilityAPI );
		elements.dialog.appendChild( elements.accessibilityControl );
		elements.dialog.appendChild( elements.creativeWorkStatus );
		this.rootElement.appendChild( elements.dialog );

		console.groupEnd();
	}

	createDialogSnippet ()
	{
		console.groupCollapsed( '%c DialogicInternal %c createDialogSnippet',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		/** @type {HTMLDialogElement} */
		const dialog = this.dialogElement;

		if ( !Dialogic.shouldBeDisplayed( dialog ) ) {

			console.debug( '%c DialogicInternal %c dialog should NOT be displayed %c dialog:',
				Dialogic.CONSOLE.CLASS_NAME,
				Dialogic.CONSOLE.DEFAULT_TEXT,
				Dialogic.CONSOLE.INTEREST_PARAMETER,
				dialog
			);
			console.groupEnd();

			return false;
		}

		/** @type {Object} */
		let elements = this.createAllElements();

		elements.dialog = dialog;
		elements = this.addAttributesToElements( elements );

		/** @type {String} */
		const dialogId = this.settings.snippetIdPrefixes.dialog + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const titleElementId = this.settings.snippetIdPrefixes.title + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const descriptionElementId = this.settings.snippetIdPrefixes.description + this.timestamp + '-' + ( this.title ).hashCode();

		elements.dialog.setMultipleAttributes( {
			id: dialogId,
			'aria-labelledby': titleElementId,
			'aria-describedby': descriptionElementId,
		} );
		if ( this.dir !== 'auto' ) {
			elements.dialog.dir = this.dir;
		}
		elements.dialog.addEventListener( 'click', this.eventListeners.click.focusOnPopup.bind( this ), {
			capture: false,
			once: false,
			passive: true,
		} );
		if ( this.type === Dialogic.CONFIRM ) {
			elements.dialog.classList.add( 'confirm' );
		} else {
			elements.dialog.classList.add( 'alert' );
		}
		if ( this.image ) {
			Object.assign( elements.image, {
				src: this.image,
				alt: this.settings.texts.imageAlt
			} );
		}
		if ( this.icon ) {
			Object.assign( elements.icon, {
				src: this.icon,
				alt: this.settings.texts.iconAlt
			} );
		}
		elements.title.id = titleElementId;
		elements.description.id = descriptionElementId;

		if ( this.timestamp ) {

			/** @type {Number} */
			const timeDiff = Math.abs( ( this.timestamp - Date.now() ) / 1000 );

			if ( timeDiff > this.settings.showTimeIfDiff ) {

				/** @type {HTMLTimeElement} */
				elements.timeElement = document.createElement( this.settings.resultSnippetElements.timePublished );

				/** @type {String} */
				const timeElementTextContent = ( timeDiff > ( 60 * 12 ) ) ? new Date( this.timestamp ).toLocaleString() : new Date( this.timestamp ).toLocaleTimeString();

				elements.timeElement.setMultipleAttributes( {
					...{
						title: this.settings.texts.timestampCreatedTitle,
						dateTime: new Date( this.timestamp ).toISOString(),
					}, ...this.settings.snippetAttributes.timePublished
				} );
				elements.timeElement.appendChild( document.createTextNode( timeElementTextContent ) );
			}
		}
		if ( this.type === Dialogic.ALERT ) {
			elements.innerWrapper.addEventListener( 'click', this.click.bind( this ), {
				capture: false,
				once: false,
				passive: true,
			} );
			elements.closer.appendChild( document.createTextNode( this.settings.texts.closerTextContent ) );
			if ( this.settings.snippetAttributes.closerDataset && this.settings.snippetAttributes.closerDataset.length ) {
				for ( const [ key, value ] of Object.entries( this.settings.snippetAttributes.closerDataset ) ) {
					elements.closer.dataset[ key ] = value;
				}
			} else {
				elements.closer.addEventListener( 'click', this.close.bind( this ), {
					capture: false,
					once: true,
					passive: true,
				} );
			}
			elements.closer.addEventListener( 'click', this.eventListeners.click.preventClickOnClose, {
				capture: false,
				once: false,
				passive: false,
			} );
			elements.dialog.appendChild( elements.closer );
		} else if ( this.type === Dialogic.CONFIRM ) {
			elements.confirmYesInner.appendChild( document.createTextNode( this.settings.texts.confirmYes ) );
			elements.confirmNoInner.appendChild( document.createTextNode( this.settings.texts.confirmNo ) );
			elements.confirmYes.appendChild( elements.confirmYesInner );
			elements.confirmNo.appendChild( elements.confirmNoInner );
			elements.confirmYes.addEventListener( 'click', this.eventListeners.click.confirmYes.bind( this ), {
				capture: false,
				once: true,
				passive: true,
			} );
			elements.confirmNo.addEventListener( 'click', this.eventListeners.click.confirmNo.bind( this ), {
				capture: false,
				once: true,
				passive: true,
			} );
			elements.actionsWrapper.appendChild( elements.confirmYes );
			elements.actionsWrapper.appendChild( document.createTextNode( this.settings.texts.dividerBetweenButtons ) );
			elements.actionsWrapper.appendChild( elements.confirmNo );
		}
		if ( this.lang ) {
			Object.assign( elements.lang, {
				content: this.lang
			} );
			elements.dialog.lang = this.lang;
		}
		this.createDomStructureFrom( elements );

		console.groupEnd();

		return true;
	}

	checkRequirements ()
	{
		console.debug( '%c DialogicInternal %c checkRequirements',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		if ( !this.settings ) {
			this.error();
			throw new Error( 'Settings object is missing' );
		}
	}

	static createProperties ( /** @type {Object} */ sections )
	{

		/** @type {Array} */
		const groupDescriptors = Object.keys( sections );

		groupDescriptors.forEach( ( /** @type {String} */ joinedPositiveDescriptors ) =>
		{

			/** @type {Array} */
			const descriptors = joinedPositiveDescriptors.split( ' ' );

			/** @type {Object|Array} */
			let allProperties = sections[ joinedPositiveDescriptors ];

			if ( !( Symbol.iterator in Object( allProperties ) ) ) {

				/** @type {Array} */
				allProperties = Object.keys( allProperties );

			}

			allProperties.forEach( ( /** @type {String} */ property ) =>
			{

				/** @type {Object} */
				const descriptor = {
					configurable: descriptors.includes( 'configurable' ),
					enumerable: descriptors.includes( 'enumerable' ),
				};

				/** @type {String} */
				const capitalizedProperty = property.charAt( 0 ).toUpperCase() + property.slice( 1 );

				/** @type {String} */
				const getterName = 'get' + capitalizedProperty;

				/** @type {String} */
				const setterName = 'set' + capitalizedProperty;

				/** @type {Boolean} */
				const isStaticGetter = Boolean( DialogicInternal.hasOwnProperty( getterName ) );

				/** @type {Boolean} */
				const isStaticSetter = Boolean( DialogicInternal.hasOwnProperty( setterName ) );

				/** @type {Boolean} */
				const isStaticValue = Boolean( DialogicInternal.hasOwnProperty( property ) );

				if ( isStaticGetter || isStaticSetter || isStaticValue ) { // existing static
					if ( isStaticGetter && isStaticSetter ) {
						descriptor.get = DialogicInternal[ getterName ];
						descriptor.set = DialogicInternal[ setterName ];
					} else if ( isStaticGetter ) {
						descriptor.get = DialogicInternal[ getterName ];
						descriptor.set = DialogicInternal.emptySetter;
					} else if ( isStaticSetter ) {
						descriptor.set = DialogicInternal[ setterName ];
					} else if ( isStaticValue ) {
						descriptor.value = DialogicInternal[ property ];
						descriptor.writable = descriptors.includes( 'writable' );
					}
					Object.defineProperty( Dialogic, property, descriptor );
				} else { // create new and set default

					/** @type {any} */
					const possibleValue = sections[ joinedPositiveDescriptors ][ property ];

					descriptor.value = ( typeof possibleValue === 'undefined' ) ? null : possibleValue;
					descriptor.writable = descriptors.includes( 'writable' );
					Object.defineProperty( Dialogic, property, descriptor );
				}
			} );
		} );
	}

	createProperties ( /** @type {Object} */ sections )
	{

		console.groupCollapsed( '%c DialogicInternal %c createProperties (dynamic) %c sections:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			sections
		);

		/** @type {Array} */
		const groupDescriptors = Object.keys( sections );

		groupDescriptors.forEach( ( /** @type {String} */ joinedPositiveDescriptors ) =>
		{

			/** @type {Array} */
			const descriptors = joinedPositiveDescriptors.split( ' ' );

			/** @type {Object|Array} */
			let allProperties = sections[ joinedPositiveDescriptors ];

			if ( !( Symbol.iterator in Object( allProperties ) ) ) {

				/** @type {Array} */
				allProperties = Object.keys( allProperties );

			}
			allProperties.forEach( ( /** @type {String} */ property ) =>
			{

				/** @type {Object} */
				const descriptor = {
					configurable: descriptors.includes( 'configurable' ),
					enumerable: descriptors.includes( 'enumerable' ),
				};

				/** @type {String} */
				const capitalizedProperty = property.charAt( 0 ).toUpperCase() + property.slice( 1 );

				/** @type {String} */
				const getterName = 'get' + capitalizedProperty;

				/** @type {String} */
				const setterName = 'set' + capitalizedProperty;

				/** @type {Boolean} */
				const isDynamicGetter = Boolean( this[ getterName ] );

				/** @type {Boolean} */
				const isDynamicSetter = Boolean( this[ setterName ] );

				/** @type {Boolean} */
				const isDynamicValue = Boolean( typeof this[ property ] !== 'undefined' );

				if ( isDynamicGetter || isDynamicSetter || isDynamicValue ) { // existing dynamic
					if ( isDynamicGetter && isDynamicSetter ) {
						descriptor.get = this[ getterName ];
						descriptor.set = this[ setterName ];
					} else if ( isDynamicGetter ) {
						descriptor.get = this[ getterName ];
						descriptor.set = DialogicInternal.emptySetter;
					} else if ( isDynamicSetter ) {
						descriptor.set = this[ setterName ];
					} else if ( isDynamicValue ) {
						descriptor.value = this[ property ];
						descriptor.writable = descriptors.includes( 'writable' );
					}
					Object.defineProperty( this, property, descriptor );
				} else { // create new and set default

					/** @type {any} */
					const possibleValue = sections[ joinedPositiveDescriptors ][ property ];

					descriptor.value = ( typeof possibleValue === 'undefined' ) ? null : possibleValue;
					descriptor.writable = descriptors.includes( 'writable' );
					Object.defineProperty( this, property, descriptor );
				}
			} );
		} );

		console.groupEnd();

	}

	async run ()
	{
		console.groupCollapsed( '%c DialogicInternal %c (async) run',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME
		);

		this.checkRequirements();
		await Dialogic.loadExternalFunctions( this.settings.modulesImportPath );
		Dialogic.preloadResources( this.settings.preloadFiles );
		Dialogic.addCSSStyleSheets( this.settings.CSSStyleSheets );
		if ( this.createDialogSnippet() ) {
			this.appendRemoveDialogElementOnCloseListener();
			this.appendRequireInteractionListener();
			this.appendShowNextDialogAfterCloseListener();
		}
		Dialogic.showDialogsFromQueue( this.settings.showDialogWaitingBeforeShow );

		console.groupEnd();
	}
}

/**
 * @class
 * @description accessible from Window object
 * @extends DialogicInternal
 */
export class Dialogic extends DialogicInternal
{
	constructor ( /** @type {String} */ title, /** @type {Object} */ options = {}, settingsElementId = 'dialogic-settings' )
	{
		console.groupCollapsed( '%c Dialogic %c constructor %c arguments:',
			Dialogic.CONSOLE.CLASS_NAME,
			Dialogic.CONSOLE.METHOD_NAME,
			Dialogic.CONSOLE.INTEREST_PARAMETER,
			arguments
		);

		super( ...arguments );
		this.createProperties( {
			noneAll: [

				/**
				 * @property {Function} rootElement
				 * @name DialogicInternal#rootElement
				 * @readonly
				 */
				'rootElement',

			],
			enumerable: [

				/**
				 * @property {Function} show
				 * @name DialogicInternal#show
				 * @readonly
				 */
				'show',

				/**
				 * @property {Function} close
				 * @name DialogicInternal#close
				 * @readonly
				 */
				'close',

				/**
				 * @property {Function} click
				 * @name DialogicInternal#click
				 * @readonly
				 */
				'click',

				/**
				 * @property {Function} error
				 * @name DialogicInternal#error
				 * @readonly
				 */
				'error',

				/**
				 * @property {Function} addEventListener
				 * @name DialogicInternal#addEventListener
				 * @readonly
				 */
				'addEventListener',

				/**
				 * @property {Function} appendRequireInteractionListener
				 * @name DialogicInternal#appendRequireInteractionListener
				 * @async
				 * @readonly
				 */
				'appendRequireInteractionListener',

				/**
				 * @property {Function} appendRemoveDialogElementOnCloseListener
				 * @name DialogicInternal#appendRemoveDialogElementOnCloseListener
				 * @readonly
				 */
				'appendRemoveDialogElementOnCloseListener',

				/**
				 * @property {Function} appendShowNextDialogAfterCloseListener
				 * @name DialogicInternal#appendShowNextDialogAfterCloseListener
				 * @readonly
				 */
				'appendShowNextDialogAfterCloseListener',

				/**
				 * @property {Function} checkRequirements
				 * @name DialogicInternal#checkRequirements
				 * @readonly
				 */
				'checkRequirements',

				/**
				 * @property {Function} createDialogSnippet
				 * @name DialogicInternal#createDialogSnippet
				 * @returns {Boolean}
				 * @readonly
				 */
				'createDialogSnippet',

				/**
				 * @property {Function} run
				 * @name DialogicInternal#run
				 * @readonly
				 */
				'run'
			],
			'configurable enumerable': {

				/**
				 * @property {String} title
				 * @name DialogicInternal#title
				 * @readonly
				 */
				title,

				/**
				 * @property {Array} actions
				 * @name DialogicInternal#actions
				 * @default []
				 * @readonly
				 */
				actions: [],

				/**
				 * @property {String} badge
				 * @name DialogicInternal#badge
				 * @default ''
				 * @readonly
				 */
				badge: '',

				/**
				 * @property {String} body
				 * @name DialogicInternal#body
				 * @default ''
				 * @readonly
				 */
				body: '',

				/**
				 * @property {String} htmlBody
				 * @name DialogicInternal#htmlBody
				 * @default ''
				 * @readonly
				 */
				htmlBody: '',

				/**
				 * @property {any} data
				 * @name DialogicInternal#data
				 * @default null
				 * @readonly
				 */
				data: null,

				/**
				 * @property {string} icon - will be displayed as 96x96 px by default
				 * @name DialogicInternal#icon
				 * @default ''
				 * @readonly
				 */
				icon: '',

				/**
				 * @property {string|null} image
				 * @name DialogicInternal#image
				 * @default null
				 * @readonly
				 */
				image: null,

				/**
				 * @property {string} lang
				 * @name DialogicInternal#lang
				 * @default ''
				 * @readonly
				 */
				lang: '',

				/**
				 * @property {boolean} renotify
				 * @name DialogicInternal#renotify
				 * @default false
				 * @readonly
				 */
				renotify: false,

				/**
				 * @property {boolean} requireInteraction
				 * @name DialogicInternal#requireInteraction
				 * @default true
				 * @readonly
				 */
				requireInteraction: true,

				/**
				 * @property {boolean} silent
				 * @name DialogicInternal#silent
				 * @default false
				 * @readonly
				 */
				silent: false,

				/**
				 * @property {any} tag
				 * @name DialogicInternal#tag
				 * @default ''
				 * @readonly
				 */
				tag: '',

				/**
				 * @property {Number} timestamp
				 * @name DialogicInternal#timestamp
				 * @readonly
				 */
				timestamp: Date.now(),

				/**
				 * @property {Array} vibrate
				 * @name DialogicInternal#vibrate
				 * @default []
				 * @readonly
				 */
				vibrate: [],

				/**
				 * @property {Number} type
				 * @name DialogicInternal#type
				 * @default 0
				 * @readonly
				 */
				type: DialogicInternal.getALERT(), /// @todo : nejde tu použít DialogicInternal.ALERT či Dialogic.ALERT ? Otestovat a případně nechat poznámku !

			},
		} );
		if ( this.settings.autoRun ) {
			console.debug( '%c DialogicInternal %c autoRun',
				Dialogic.CONSOLE.CLASS_NAME,
				Dialogic.CONSOLE.METHOD_NAME
			);
			this.run();
		}

		console.groupEnd();
	}
}

DialogicInternal.createProperties( {
	enumerable: [

		/**
		 * @property {Array} list
		 * @name DialogicInternal.list
		 * @default []
		 * @readonly
		 * @static
		 */
		'list',

		/**
		 * @property {Number} maxActions
		 * @name DialogicInternal.maxActions
		 * @default 2
		 * @readonly
		 * @static
		 */
		'maxActions',

		/**
		 * @property {Function} removeDialogFromList
		 * @name DialogicInternal.removeDialogFromList
		 * @readonly
		 * @static
		 */
		'removeDialogFromList',

		/**
		 * @property {Function} loadExternalFunctions
		 * @name DialogicInternal.loadExternalFunctions
		 * @readonly
		 * @static
		 * @async
		 */
		'loadExternalFunctions',

		/**
		 * @property {Function} shouldBeDisplayed
		 * @name DialogicInternal.shouldBeDisplayed
		 * @readonly
		 * @static
		 */
		'shouldBeDisplayed',

		/**
		 * @property {Function} showDialogsFromQueue
		 * @name DialogicInternal.showDialogsFromQueue
		 * @readonly
		 * @static
		 * @async
		 */
		'showDialogsFromQueue',

		/**
		 * @property {Function} addCSSStyleSheets
		 * @name DialogicInternal.addCSSStyleSheets
		 * @readonly
		 * @static
		 */
		'addCSSStyleSheets',

		/**
		 * @property {Function} preloadResources
		 * @name DialogicInternal.preloadResources
		 * @readonly
		 * @static
		 */
		'preloadResources',

		/**
		 * @constant {Object} CONSOLE
		 * @name DialogicInternal.CONSOLE
		 * @readonly
		 * @static
		 */
		'CONSOLE',

		/**
		 * @constant {Number} ALERT
		 * @name DialogicInternal.ALERT
		 * @default 1
		 * @readonly
		 * @static
		 */
		'ALERT',

		/**
		 * @constant {Number} CONFIRM
		 * @name Dialogic.CONFIRM
		 * @default 0
		 * @readonly
		 * @static
		 */
		'CONFIRM',

	]
} );

Object.defineProperty( window, 'Dialogic', {
	value: Dialogic,
	configurable: false,
	enumerable: true,
	writable: false,
} );
