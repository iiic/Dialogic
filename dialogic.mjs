"use strict";

//@ts-check

import { append as HashCodeAppend } from './modules/string/hashCode.mjs';

/**
 * @class
 * @file dilogic.mjs
 * @implements {Classes.DialogicInternal}
 * @extends HTMLDialogElement
 */
class DialogicInternal extends HTMLDialogElement
{

	/** @type {Array.<Dialogic.prototype>} */
	static #list = [];

	/** @returns {Array.<Dialogic.prototype>} */
	static get list ()
	{
		return DialogicInternal.#list;
	}

	static set list ( /** @type {Dialogic.prototype} */ listItem )
	{
		if ( listItem instanceof Dialogic ) {
			DialogicInternal.#list.push( listItem );
		}
	}

	static showDialogsFromQueue ()
	{
		/** @type {Array.<Dialogic.prototype>} */
		const reversedList = [ ...Dialogic.list ].reverse()

		/** @type {Number} */
		const reversedListLength = reversedList.length;

		for ( let i = 0; i < reversedListLength; i++ ) {
			if ( reversedList[ i ].#isPrepared && Dialogic.shouldBeDisplayed( reversedList[ i ] ) ) {
				reversedList[ i ].show();
				if ( !reversedList[ i ].requireInteraction ) {
					break;
				}
			}
		}
	}

	static addCSSStyleSheets ( /** @type {Array.<{href: string, title: string}>} */ CSSStyleSheets = [], /** @type {String} */ rel = 'stylesheet' )
	{

		/** @type {Set.<string>} */
		const existingStyleSheets = new Set();

		[ ...document.styleSheets ].forEach( ( css ) =>
		{
			if ( css.disabled === false && css.href ) {
				existingStyleSheets.add( css.href );
			}
		} );

		DialogicInternal.addLinksIntoHead( CSSStyleSheets, rel, existingStyleSheets );
	}

	static preloadResources ( /** @type {Array.<{as: String, href: String, integrity?: string}>} */ resources = [], /** @type {String} */ rel = 'preload' )
	{

		/** @type {NodeListOf<HTMLLinkElement>} */
		const alreadyPreloaded = document.querySelectorAll( 'link[href]' );

		/** @type {Set.<string>} */
		const preloadedHrefList = new Set();

		alreadyPreloaded.forEach( function ( link )
		{
			const href = link.getAttribute( 'href' );
			if ( href ) {
				const url = DialogicInternal.getAbsoluteUrl( href );
				preloadedHrefList.add( url.href );
			}
		} );
		DialogicInternal.addLinksIntoHead( resources, rel, preloadedHrefList );
	}

	static shouldBeDisplayed ( /** @type {Dialogic.prototype} */ dialog )
	{
		if ( dialog.dialogElement.open ) {
			return false;
		}
		if ( dialog.displayed ) {
			return false;
		}
		if ( dialog.requireInteraction ) {
			return true;
		}
		const listLength = Dialogic.list.length;
		for ( let i = 0; i < listLength; i++ ) {
			if ( Dialogic.list[ i ].dialogElement.open ) {
				return false;
			}
			if (
				dialog.tag
				&& Dialogic.list[ i ].tag === dialog.tag
				&& Dialogic.list[ i ].displayed
				&& Dialogic.list[ i ].dialogElement.open
			) {
				return false;
			}
		}
		return true;
	}

	static removeDialogFromList ( /** @type {Dialogic.prototype} */ dialogic )
	{
		const index = Dialogic.list.indexOf( dialogic );
		if ( index > -1 ) {
			Dialogic.list.splice( index, 1 );
		}
	}

	static closeDialogsWithSameTag ( /** @type {Dialogic.prototype} */ dialog )
	{
		if ( dialog.renotify ) {
			return;
		}
		const listLength = Dialogic.list.length;
		for ( let i = 0; i < listLength; i++ ) {
			if (
				Dialogic.list[ i ].tag === dialog.tag
				&& Dialogic.list[ i ] !== dialog
				&& Dialogic.list[ i ].dialogElement.open
			) {
				Dialogic.list[ i ].close();
				dialog.#isSilentReplacement = true;
			}
		}
	}

	/** @type {Types.Settings} */
	#settings = Dialogic.DEFAULT_SETTINGS;

	/** @type {Classes.DialogicInternal['settings']} */
	get settings ()
	{
		return this.#settings;
	}
	set settings ( /** @type {Partial<Types.Settings>} */ newSettings )
	{
		this.#settings = /** @type {Types.Settings} */ ( DialogicInternal.#deepAssign( this.#settings, newSettings ) );
	}

	/**
	 * @type {?HTMLDialogElement}
	 */
	#dialogElement = null;

	/** @type {Classes.DialogicInternal['dialogElement']} */
	get dialogElement ()
	{
		return this.#dialogElement ?? /** @type {HTMLDialogElement} */ ( /** @type {unknown} */ ( this ) );
	}
	set dialogElement ( dialogElement )
	{
		if ( dialogElement && dialogElement instanceof HTMLDialogElement ) {
			this.#dialogElement = dialogElement;
		} else {
			throw new Error( 'Not a valid HTMLElement' );
		}
	}

	/**
	 * @description identifier of timeout for automatic dialog close
	 * @type {Number|null}
	 */
	#runningTimeout = null;

	/** @type {boolean} */
	#isPrepared = false

	/** @type {boolean} */
	#isSilentReplacement = false

	/** @type {Enums.PossibleTextDirections} */
	#dir = Dialogic.POSSIBLE_TEXT_DIRECTIONS.AUTO;

	set dir ( newDir )
	{
		if (
			newDir === Dialogic.POSSIBLE_TEXT_DIRECTIONS.LTR
			|| newDir === Dialogic.POSSIBLE_TEXT_DIRECTIONS.RTL
			|| newDir === Dialogic.POSSIBLE_TEXT_DIRECTIONS.AUTO
		) {
			this.#dir = newDir;
		} else {
			console.warn( 'Invalid direction value. Use "ltr", "rtl", or "auto".' );
		}
	}
	get dir ()
	{
		return this.#dir;
	}

	/**
	 * @description is / was this dialog already displayed
	 * @type {Boolean}
	 */
	displayed = false;

	/**
	 * @description function called on dialog show
	 * @type {((event?: Event) => void) | null}
	 */
	onshow = null;

	/** @type {Enums.DialogTypes} */
	type = Dialogic.DIALOG_TYPES.ALERT;

	/** @type {Array.<number>} */
	vibrate = [];

	timestamp = Date.now();

	tag = '';

	navigate = '';

	silent = false;

	requireInteraction = false;

	renotify = false;

	lang = '';

	/** @type {string|null} */
	image = null;

	icon = '';

	data = null;

	htmlBody = '';

	body = '';

	badge = '';

	/** @type {Array.<Dialogic.prototype>} */
	actions = [];

	title = '';

	/** @type {HTMLAudioElement|null} */
	dialogShowAudio = null;

	eventListeners = {
		click: {
			preventClickOnClose: function ( /** @type {PointerEvent} */ event )
			{
				event.stopPropagation();
			},
			/** @this {Dialogic.prototype} */
			confirmYes: function ( /** @type {PointerEvent} event */ event )
			{
				event.stopPropagation();
				if ( this.#runningTimeout ) {
					clearTimeout( this.#runningTimeout );
				}
				this.click();
				Dialogic.removeDialogFromList( this );
				HTMLDialogElement.prototype.close.call( this.dialogElement ); // native close, no Dialogic close event
			},
			/** @this {Dialogic.prototype} */
			confirmNo: function ( /** @type {PointerEvent} event */ event )
			{
				event.stopPropagation();
				if ( this.#runningTimeout ) {
					clearTimeout( this.#runningTimeout );
				}
				this.close();
			},
			/** @this {Dialogic.prototype} */
			actionClick: function ( /** @type {PointerEvent} event */ event )
			{
				event.stopPropagation();

				const actionName = event.currentTarget instanceof Element
					? event.currentTarget.getAttribute( 'data-action' ) ?? ''
					: '';

				this.dispatchEvent( new CustomEvent( 'actionclick', { detail: { action: actionName } } ) );
				if ( this.#runningTimeout ) {
					clearTimeout( this.#runningTimeout );
				}
				this.close();
			},
			/** @this {Dialogic.prototype} */
			focusOnPopup: function ( /** @type {PointerEvent} */ event )
			{
				if ( event.target === this.dialogElement ) {

					/** @type {Element|null} */
					const innerWrapperElement = this.dialogElement.firstElementChild;

					if ( innerWrapperElement && innerWrapperElement instanceof HTMLElement ) {
						innerWrapperElement.contentEditable = 'true'; // string with true/false not Boolean
						innerWrapperElement.focus(); // { focusVisible: true } option currently not working
						innerWrapperElement.contentEditable = 'false';
					}
				}
			},
		},
		close: {
			/** @this {Dialogic.prototype} */
			showNextDialog: function ( /** @type {Event} event */ )
			{
				Dialogic.showDialogsFromQueue();
			},
			/** @this {Dialogic.prototype} */
			removeDialogElement: function ( /** @type {Event} event */ )
			{
				this.rootElement.removeChild( this.dialogElement );
			},
		}
	};

	constructor (
		/** @type {String} */ title = '',
		/** @type {{actions?: Array.<Dialogic.prototype>, badge?: string, body?: string, htmlBody?: string, data?: any, dir?: Enums.PossibleTextDirections, direction?: Enums.PossibleTextDirections, icon?: string, image?: string, lang?: string, navigate?: string, renotify?: boolean, requireInteraction?: boolean, silent?: boolean, tag?: string, timestamp?: number, vibrate?: number|Array.<number> }} */ options = {},
		settingsElementId = 'dialogic-settings'
	)
	{
		if ( arguments.length === 0 ) {
			throw new TypeError( 'Failed to construct \'Dialogic\': 1 argument required, but only 0 present.' );
		}
		super();

		if ( options ) {
			for ( const key of Object.keys( options ) ) {
				if ( key === 'dir' || key === 'direction' ) {
					this.dir = /** @type {Enums.PossibleTextDirections} */ ( options[ key ] )
				} else if ( [
					'actions', 'badge', 'body', 'data', 'htmlBody', 'icon', 'image', 'lang', 'navigate',
					'renotify', 'requireInteraction', 'silent', 'tag', 'timestamp', 'type', 'vibrate'
				].includes( key ) ) {
					const optionKey = /** @type {keyof Types.DialogOptions} */ ( key )
					Reflect.set( this, key, options[ optionKey ] )
				}
			}
		}

		Object.defineProperties( this, {
			type: {
				value: this.type,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			vibrate: {
				value: this.vibrate,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			timestamp: {
				value: this.timestamp,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			tag: {
				value: this.tag,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			navigate: {
				value: this.navigate,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			silent: {
				value: this.silent,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			requireInteraction: {
				value: this.requireInteraction,
				configurable: true,
				enumerable: true,
				writable: true,
			},
			renotify: {
				value: this.renotify,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			lang: {
				value: this.lang,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			image: {
				value: this.image,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			icon: {
				value: this.icon,
				configurable: true,
				enumerable: true,
				writable: true,
			},
			data: {
				value: structuredClone( this.data ),
				configurable: true,
				enumerable: true,
				writable: false,
			},
			htmlBody: {
				value: this.htmlBody,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			body: {
				value: this.body,
				configurable: true,
				enumerable: true,
				writable: true,
			},
			badge: {
				value: this.badge,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			actions: {
				value: this.actions,
				configurable: true,
				enumerable: true,
				writable: false,
			},
			title: {
				value: this.title,
				configurable: true,
				enumerable: true,
				writable: true,
			},
			run: {
				value: this.run,
				configurable: false,
				enumerable: true,
				writable: false
			},
			createDialogSnippet: {
				value: this.createDialogSnippet,
				configurable: false,
				enumerable: true,
				writable: false
			},
			updatePathByBase: {
				value: this.updatePathByBase,
				configurable: false,
				enumerable: true,
				writable: false
			},
			checkRequirements: {
				value: this.checkRequirements,
				configurable: false,
				enumerable: true,
				writable: false
			},
			appendShowNextDialogAfterCloseListener: {
				value: this.appendShowNextDialogAfterCloseListener,
				configurable: false,
				enumerable: true,
				writable: false
			},
			appendRemoveDialogElementOnCloseListener: {
				value: this.appendRemoveDialogElementOnCloseListener,
				configurable: false,
				enumerable: true,
				writable: false
			},
			appendRequireInteractionListener: {
				value: this.appendRequireInteractionListener,
				configurable: false,
				enumerable: true,
				writable: false
			},
			addEventListener: {
				value: this.addEventListener,
				configurable: false,
				enumerable: true,
				writable: false
			},
			error: {
				value: this.error,
				configurable: false,
				enumerable: true,
				writable: false
			},
			click: {
				value: this.click,
				configurable: false,
				enumerable: true,
				writable: false
			},
			close: {
				value: this.close,
				configurable: false,
				enumerable: true,
				writable: false
			},
			show: {
				value: this.show,
				configurable: false,
				enumerable: true,
				writable: false
			},
			dialogShowAudio: {
				value: this.dialogShowAudio,
				configurable: false,
				enumerable: true,
				writable: true,
			},
			eventListeners: {
				value: this.eventListeners,
				configurable: false,
				enumerable: true,
				writable: false,
			}
		} );

		this.title = title;

		/** @type {URLSearchParams} */
		const searchParams = new URL( import.meta.url ).searchParams;

		if ( searchParams.has( Dialogic.SETTINGS_URL_PARAMETER ) ) {
			const jsonInString = /** @type {String} */ ( searchParams.get( Dialogic.SETTINGS_URL_PARAMETER ) );
			this.settings = JSON.parse( jsonInString );
		}

		/** @type {HTMLElement | null} */
		const settingsElement = document.getElementById( settingsElementId );

		if ( settingsElement && settingsElement instanceof HTMLScriptElement ) {
			const jsonInElement = /** @type {HTMLScriptElement} */ ( settingsElement );
			this.settings = JSON.parse( jsonInElement.text );
		}

		// no dialog element is created here, because this instance itself is the `dialogic-item` custom element
		// inherited from native `dialog` element, so `this.dialogElement` returns `this`
		Dialogic.list = this;
	}

	static #deepAssign ( /** @type {Array.<any>} */ ...customArgs )
	{

		/** @type {Object<string, any>} */
		let currentLevel = {};

		loopThroughAllCustomArgs:
		customArgs.forEach( ( /** @type {Object} */ source ) =>
		{
			if ( source instanceof Array ) {
				currentLevel = source;
			} else if ( source !== null ) {
				loopThroughKeyValPairsObject:
				Object.entries( source ).forEach( ( [ /** @type {String} */ key, /** @type {any} */ value ] ) =>
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

	static addLinksIntoHead (
		/** @type {Array.<{as?: string, href?: string, src?: string, url?: string, title?: string, integrity?: string, rel?: string, crossOrigin?: String, media?: String, type?: String}>|{as?: string, href?: string, src?: string, url?: string, title?: string, integrity?: string, rel?: string, crossOrigin?: String, media?: String, type?: String}} */ attributesObject = [],
		/** @type {String} */ rel = 'preload',
		/** @type {Set.<string>|null} */ excludeSet = null
	)
	{

		if ( !Array.isArray( attributesObject ) ) {
			attributesObject = [ attributesObject ];
		}

		/** @type {Set.<string>} */
		const disableSet = excludeSet instanceof Set ? excludeSet : new Set();

		/** @type {Set.<string>} */
		const seenResources = new Set();

		attributesObject.forEach( function ( /** @type {{as?: string, href?: string, src?: string, url?: string, title?: string, integrity?: string, rel?: string, crossOrigin?: String, media?: String, type?: String}} */ resource = {} )
		{

			if ( !resource || typeof resource !== 'object' ) {
				return;
			}

			/** @type {String|null} */
			const href = resource.href ?? resource.src ?? resource.url ?? null;

			if ( !href ) {
				return;
			}

			/** @type {URL} */
			const url = DialogicInternal.getAbsoluteUrl( href );

			if ( !url ) {
				return;
			}

			const normalizedHref = url.href;

			if ( disableSet.has( normalizedHref ) || seenResources.has( normalizedHref ) ) {
				return;
			}
			seenResources.add( normalizedHref );

			/** @type {HTMLLinkElement} */
			const link = document.createElement( 'link' );

			const attributeNames = /** @type {Array.<'as'|'href'|'src'|'url'|'title'|'integrity'|'rel'|'crossOrigin'|'media'|'type'>} */ ( Object.keys( resource ) );
			const linkRel = resource.rel ?? rel;
			link.rel = linkRel;
			if ( resource.as ) {
				link.as = resource.as;
			}
			if ( resource.crossOrigin ) {
				link.crossOrigin = resource.crossOrigin;
			}
			if ( resource.integrity ) {
				link.integrity = resource.integrity;
			}
			if ( resource.media ) {
				link.media = resource.media;
			}
			if ( resource.title ) {
				link.title = resource.title;
			}
			if ( resource.type ) {
				link.type = resource.type;
			}

			/** @type {Array.<'as'|'href'|'src'|'url'|'title'|'integrity'|'rel'|'crossOrigin'|'media'|'type'>} */
			const validAttributeNames = attributeNames.filter( function ( /** @type {string} */ name )
			{
				return [ 'as', 'href', 'src', 'url', 'title', 'integrity', 'rel', 'crossOrigin', 'media', 'type' ].includes( name );
			} );

			validAttributeNames.forEach( function ( /** @type {'as'|'href'|'src'|'url'|'title'|'integrity'|'rel'|'crossOrigin'|'media'|'type'} */ attributeName )
			{
				if ( resource[ attributeName ] ) {
					if ( attributeName === 'href' || attributeName === 'src' || attributeName === 'url' ) {
						link.href = normalizedHref;
					} else if ( attributeName === 'rel' ) {
						link.rel = resource[ attributeName ] ?? linkRel;
					} else if ( attributeName === 'as' ) {
						link.as = resource[ attributeName ];
					} else if ( attributeName === 'crossOrigin' ) {
						link.crossOrigin = resource[ attributeName ];
					} else if ( attributeName === 'integrity' ) {
						link.integrity = resource[ attributeName ];
					} else if ( attributeName === 'media' ) {
						link.media = resource[ attributeName ];
					} else if ( attributeName === 'title' ) {
						link.title = resource[ attributeName ];
					} else if ( attributeName === 'type' ) {
						link.type = resource[ attributeName ];
					} else {
						link.setAttribute( attributeName, resource[ attributeName ] );
					}
				}
			} );
			document.head.appendChild( link );
		} );
	}

	/** @returns {URL} */
	static getAbsoluteUrl ( /** @type {string} */ urlString )
	{
		return new URL( urlString, document.baseURI )
	}

	/** @return {HTMLElement|HTMLBodyElement}  */
	get rootElement ()
	{

		/** @type {?HTMLElement} */
		const foundRootElement = this.settings.rootElementId ? document.getElementById( this.settings.rootElementId ) : null;

		return foundRootElement ? foundRootElement : document.body;
	}

	#playAudio ()
	{

		if ( !this.silent && !this.#isSilentReplacement && this.settings.dialogShowAudio ) {
			if ( this.dialogShowAudio ) { // audio already played, reset timer and play again

				/** @type {HTMLAudioElement} */
				const audio = this.dialogShowAudio;

				audio.pause();
				audio.currentTime = 0;
				audio.play().catch( err => console.log( "Blocked: Click on the page first!" ) );;
			} else { // load new audio

				/** @type {URL} */
				const url = DialogicInternal.getAbsoluteUrl( this.settings.dialogShowAudio );

				/** @type {HTMLAudioElement} */
				const audio = new Audio( url.href );

				audio.addEventListener( 'canplaythrough', ( /** @type {Event} event */ ) =>
				{
					audio.play().catch( err => console.log( "Blocked: Click on the page first!" ) );;
				} );
				this.dialogShowAudio = audio;
			}
		}
	}

	click ()
	{
		if ( this.onclick ) {
			this.onclick( new PointerEvent( 'click' ) );
		}
	}

	show ()
	{
		if ( this.onshow ) {
			this.onshow();
		}
		this.#playAudio();
		if ( 'vibrate' in navigator && this.vibrate ) {
			navigator.vibrate( this.vibrate );
		}

		/** @type {HTMLMetaElement|null|undefined} */
		const creativeWorkStatus = this.dialogElement.querySelector( '[itemprop=creativeWorkStatus]' );

		if ( creativeWorkStatus ) {
			creativeWorkStatus.content = 'Published';
		}

		this.displayed = true;
		this.dialogElement.dispatchEvent( new Event( 'show' ) );
		HTMLDialogElement.prototype.show.call( this.dialogElement ); // native show(), not Dialogic one
		this.appendRequireInteractionListener()
	}

	close ()
	{
		if ( this.#runningTimeout ) {
			clearTimeout( this.#runningTimeout );
		}
		if ( this.onclose ) {
			this.onclose( new Event( 'close' ) );
		}

		/** @type {HTMLMetaElement|null} */
		const creativeWorkStatus = this.dialogElement.querySelector( '[itemprop=creativeWorkStatus]' );

		if ( creativeWorkStatus ) {
			creativeWorkStatus.content = 'Obsolete';
		}

		if ( !this.tag ) {
			Dialogic.removeDialogFromList( this );
		}
		HTMLDialogElement.prototype.close.call( this.dialogElement ); // native close(), not Dialogic one
		this.dialogElement.dispatchEvent( new Event( 'close' ) );
	}

	error ()
	{
		if ( this.onerror ) {
			this.onerror( new Event( 'error' ) );
		}
		this.dialogElement.dispatchEvent( new Event( 'error' ) );
	}

	addEventListener (
		/** @type {String} */ type,
		/** @type {EventListenerOrEventListenerObject} */ listener,
		/** @type {Boolean|AddEventListenerOptions} */ options = {},
		/** @type {Boolean} */ useCapture = false
	)
	{
		/** @type {(type: string, listener: EventListenerOrEventListenerObject, options?: boolean|AddEventListenerOptions) => void} */
		const nativeAddEventListener = EventTarget.prototype.addEventListener.bind( this.dialogElement );

		if ( typeof options === 'boolean' ) {
			nativeAddEventListener( type, listener, options );
		} else if ( options && Object.keys( options ).length !== 0 ) {
			nativeAddEventListener( type, listener, options );
		} else {
			nativeAddEventListener( type, listener, useCapture );
		}
	}

	/** @returns {Promise<void>} */
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

	appendShowNextDialogAfterCloseListener ()
	{
		this.addEventListener( 'close', this.eventListeners.close.showNextDialog.bind( this ), {
			capture: false,
			once: true,
			passive: true,
		} );
	}

	appendRemoveDialogElementOnCloseListener ()
	{
		if ( this.settings.autoRemoveDialogElementOnClose ) {
			this.addEventListener( 'close', this.eventListeners.close.removeDialogElement.bind( this ), {
				capture: false,
				once: true,
				passive: true,
			} );
		}
	}

	addAttributesToElements ( /** @type { Object.< 'dialog' | 'innerWrapper' | 'image' | 'title' | 'icon' | 'description' | 'closer' | 'actionsWrapper' | 'confirmYes' | 'confirmNo' | 'confirmYesInner' | 'confirmNoInner' | 'timePublished' | 'timeUpdated' | 'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus', HTMLElement >} */ elements )
	{
		const attributesObject = this.settings.snippetAttributes;
		const elementNames = /** @type {Array.< 'dialog' | 'innerWrapper' | 'image' | 'title' | 'icon' | 'description' | 'closer' | 'actionsWrapper' | 'confirmYes' | 'confirmNo' | 'confirmYesInner' | 'confirmNoInner' | 'timePublished' | 'timeUpdated' | 'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus' >} */ ( Object.keys( elements ) );
		elementNames.forEach( ( elementName ) =>
		{

			/** @type {Object.<string, any>|undefined} */
			const attributes = attributesObject[ elementName ];

			/** @type {?HTMLElement} */
			const element = elements[ elementName ]

			if ( element && attributes ) {
				for ( const [ key, value ] of Object.entries( attributes ) ) {
					if ( typeof value === 'boolean' ) {
						element[ key ] = value;
					} else {
						element.setAttribute( key, value );
					}
				}
			}
		} );

		return elements;
	}

	/**
	 * @returns {Object.<'dialog' | 'innerWrapper'|'image'| 'title'|'icon' | 'description' | 'closer' | 'actionsWrapper'|'confirmYes' | 'confirmNo'| 'confirmYesInner'| 'confirmNoInner'| 'timePublished' | 'timeUpdated'|'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus', HTMLElement>}
	 */
	createAllElements ()
	{

		/** @type {Object.<'dialog' | 'innerWrapper'|'image'| 'title'|'icon' | 'description' | 'closer' | 'actionsWrapper'|'confirmYes' | 'confirmNo'| 'confirmYesInner'| 'confirmNoInner'| 'timePublished' | 'timeUpdated'|'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus', HTMLElement>} */
		const elements = {};

		const elementNames = /** @type {Array.<'dialog' | 'innerWrapper' | 'image'| 'title' | 'icon' | 'description' | 'closer' | 'actionsWrapper' | 'confirmYes' | 'confirmNo'| 'confirmYesInner'| 'confirmNoInner'| 'timePublished' | 'timeUpdated'|'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus'>} */ ( Object.keys( this.settings.resultSnippetElements ) );
		elementNames.forEach( ( /** @type { 'dialog' | 'innerWrapper' | 'image'| 'title' | 'icon' | 'description' | 'closer' | 'actionsWrapper' | 'confirmYes' | 'confirmNo'| 'confirmYesInner'| 'confirmNoInner'| 'timePublished' | 'timeUpdated'|'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus' } */ elementName ) =>
		{
			if ( elementName === 'dialog' ) {
				elements[ elementName ] = this.dialogElement; // instance itself, no new element needed
			} else if ( elementName !== 'title' && Object.hasOwn( this, elementName ) ) {
				elements[ elementName ] = /** @type {any} */ ( this )[ elementName ] ? document.createElement( this.settings.resultSnippetElements[ elementName ] ) : null;
			} else {
				elements[ elementName ] = document.createElement( this.settings.resultSnippetElements[ elementName ] );
			}
		} );
		return elements;
	}

	/** @returns {void} */
	createDomStructureFrom ( /** @type { Object.< 'dialog' | 'innerWrapper' | 'image' | 'title' | 'icon' | 'description' | 'closer' | 'actionsWrapper' | 'confirmYes' | 'confirmNo' | 'confirmYesInner' | 'confirmNoInner' | 'timePublished' | 'timeUpdated' | 'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus', HTMLElement >} */ elements = {} )
	{
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
		if ( elements.badge ) {
			elements.innerWrapper.appendChild( elements.badge );
		}
		elements.innerWrapper.appendChild( elements.title );
		elements.innerWrapper.appendChild( elements.description );
		if ( elements.timeElement ) {
			elements.innerWrapper.appendChild( elements.timeElement );
		}
		if ( this.type === Dialogic.DIALOG_TYPES.CONFIRM ) {
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
	}

	createDialogSnippet ()
	{

		/** @type {HTMLDialogElement} */
		const dialog = this.dialogElement;

		if ( this.#isPrepared ) {
			return false;
		}

		/** @type { Object.< 'dialog' | 'innerWrapper' | 'image' | 'title' | 'icon' | 'description' | 'closer' | 'actionsWrapper' | 'confirmYes' | 'confirmNo' | 'confirmYesInner' | 'confirmNoInner' | 'timePublished' | 'timeUpdated' | 'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus', HTMLElement >} */
		let elements = this.createAllElements();

		elements.dialog = dialog;
		elements = this.addAttributesToElements( elements );

		/** @type {String} */
		const dialogId = this.settings.snippetIdPrefixes.dialog + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const titleElementId = this.settings.snippetIdPrefixes.title + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const descriptionElementId = this.settings.snippetIdPrefixes.description + this.timestamp + '-' + ( this.title ).hashCode();

		elements.dialog.setAttribute( 'is', Dialogic.ELEMENT_NAME );
		elements.dialog.setAttribute( 'id', dialogId );
		elements.dialog.setAttribute( 'aria-labelledby', titleElementId );
		elements.dialog.setAttribute( 'aria-describedby', descriptionElementId );
		if ( this.dir !== 'auto' ) {
			elements.dialog.setAttribute( 'dir', this.dir ); // dir getter / setter is overridden, so attribute must be set directly
		}
		elements.dialog.addEventListener( 'click', this.eventListeners.click.focusOnPopup.bind( this ), {
			capture: false,
			once: false,
			passive: true,
		} );
		if ( this.type === Dialogic.DIALOG_TYPES.ALERT ) {
			elements.dialog.classList.add( 'alert' );
		} else if ( this.type === Dialogic.DIALOG_TYPES.CONFIRM ) {
			elements.dialog.classList.add( 'confirm' );
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
		if ( this.badge ) {
			Object.assign( elements.badge, {
				src: this.badge,
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

				elements.timeElement.setAttribute( 'title', this.settings.texts.timestampCreatedTitle );
				elements.timeElement.setAttribute( 'dateTime', new Date( this.timestamp ).toISOString() );
				for ( const [ key, value ] of Object.entries( /** @type {Record<string, string>} */( this.settings.snippetAttributes.timePublished ) ) ) {
					if ( typeof value === 'boolean' ) {
						elements.timeElement[ key ] = value;
					} else {
						elements.timeElement.setAttribute( key, value );
					}
				}
				elements.timeElement.appendChild( document.createTextNode( timeElementTextContent ) );
			}
		}
		if ( this.type === Dialogic.DIALOG_TYPES.ALERT ) {
			elements.innerWrapper.addEventListener( 'click', this.click.bind( this ), {
				capture: false,
				once: false,
				passive: true,
			} );
			elements.closer.appendChild( document.createTextNode( this.settings.texts.closerTextContent ) );
			if (
				this.settings.snippetAttributes.closerDataset
				&& Object.keys( this.settings.snippetAttributes.closerDataset ).length ) {
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
		} else if ( this.type === Dialogic.DIALOG_TYPES.CONFIRM ) {
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

		// Render custom action buttons
		if ( this.actions.length > 0 ) {
			elements.innerWrapper.appendChild( elements.actionsWrapper );
			for ( const [ index, action ] of this.actions.entries() ) {
				/** @type {HTMLButtonElement} */
				const actionButton = document.createElement( 'button' );
				actionButton.setAttribute( 'type', 'button' );
				actionButton.setAttribute( 'data-action', String( action.action ) );
				actionButton.setAttribute( 'title', action.title );
				if ( action.icon ) {
					/** @type {HTMLImageElement} */
					const icon = document.createElement( 'img' );
					icon.setAttribute( 'src', action.icon );
					icon.setAttribute( 'alt', action.title );
					icon.setAttribute( 'width', '24' );
					icon.setAttribute( 'height', '24' );
					actionButton.appendChild( icon );
				}
				actionButton.appendChild( document.createTextNode( action.title ) );
				actionButton.addEventListener( 'click', this.eventListeners.click.actionClick.bind( this ), {
					capture: false,
					once: true,
					passive: true,
				} );
				if ( index > 0 ) {
					elements.actionsWrapper.appendChild( document.createTextNode( ' ' ) );
				}
				elements.actionsWrapper.appendChild( actionButton );
			}
		}
		if ( this.lang ) {
			Object.assign( elements.lang, {
				content: this.lang
			} );
			elements.dialog.setAttribute( 'lang', this.lang ); // lang is own property of Dialogic, so attribute must be set directly
		}
		this.createDomStructureFrom( elements );
		this.#isPrepared = true

		return true;
	}

	checkRequirements ()
	{
		if ( !this.settings ) {
			this.error();
			throw new Error( 'Settings object is missing' );
		}
	}

	updatePathByBase ()
	{
		/** @type {HTMLBaseElement|null} */
		const possibleBaseElement = document.head.querySelector( 'base' );

		if ( possibleBaseElement && possibleBaseElement.href ) {
			this.settings.modulesImportPath = possibleBaseElement.href + this.settings.modulesImportPath;
		}


	}

	run ()
	{
		this.checkRequirements();
		this.updatePathByBase();

		Dialogic.preloadResources( this.settings.preloadFiles );
		Dialogic.addCSSStyleSheets( this.settings.CSSStyleSheets );
		if ( this.createDialogSnippet() ) {
			this.appendRemoveDialogElementOnCloseListener();
			this.appendShowNextDialogAfterCloseListener();
		}
		Dialogic.showDialogsFromQueue();
	}
}

/**
 * @class
 * @extends DialogicInternal
 * @implements {Classes.Dialogic}
 * @version 0.2
 * @since Q4 2026
 * @file dialogic.mjs
 * @license CC-BY-SA-4.0
 * @author ic<ic.czech+dialogic@gmail.com>
 * @see {@link https://github.com/iiic/Dialogic|GitHub}
 * @see {@link https://iiic.dev/dialogic#github|homepage}
 * @returns {Function}
 */
export class Dialogic extends DialogicInternal
{

	/** @type { Classes.Dialogic.DIALOG_TYPES } */
	static get DIALOG_TYPES ()
	{
		return {
			ALERT: /** @type {Enums.DialogTypes} */ ( 'alert' ),
			CONFIRM: /** @type {Enums.DialogTypes} */ ( 'confirm' ),
		};
	}

	/** @type { Classes.Dialogic.POSSIBLE_TEXT_DIRECTIONS } */
	static get POSSIBLE_TEXT_DIRECTIONS ()
	{
		return {
			AUTO: /** @type {Enums.PossibleTextDirections} */ ( 'auto' ),
			LTR: /** @type {Enums.PossibleTextDirections} */ ( 'ltr' ),
			RTL: /** @type {Enums.PossibleTextDirections} */ ( 'rtl' )
		};
	}

	/** @description name of custom element registered in customElements registry */
	static get ELEMENT_NAME ()
	{
		return 'dialogic-item';
	}

	/** @description name of native element, which is `dialogic-item` inherited from */
	static get EXTENDS_ELEMENT_NAME ()
	{
		return 'dialog';
	}

	static get maxActions ()
	{
		return 2;
	}

	static get SETTINGS_URL_PARAMETER ()
	{
		return 'settings';
	}

	static {
		Object.defineProperties( this, {
			preloadResources: {
				value: DialogicInternal.preloadResources,
				configurable: false,
				enumerable: true,
				writable: false,
			},
			addCSSStyleSheets: {
				value: DialogicInternal.addCSSStyleSheets,
				configurable: false,
				enumerable: true,
				writable: false,
			},
			showDialogsFromQueue: {
				value: DialogicInternal.showDialogsFromQueue,
				configurable: false,
				enumerable: true,
				writable: false,
			},
			shouldBeDisplayed: {
				value: DialogicInternal.shouldBeDisplayed,
				configurable: false,
				enumerable: true,
				writable: false,
			},
			removeDialogFromList: {
				value: DialogicInternal.removeDialogFromList,
				configurable: false,
				enumerable: true,
				writable: false,
			},
		} );
	}

	constructor (
		/** @type {String} */ title = '',
		/** @type {{actions?: Array.<Dialogic.prototype>, badge?: string, body?: string, htmlBody?: string, data?: any, direction?: 'auto'|'ltr'|'rtl', icon?: string, image?: string, lang?: string, navigate?: string, renotify?: boolean, requireInteraction?: boolean, silent?: boolean, tag?: string, timestamp?: number, vibrate?: number|Array.<number> }} */ options = {},
		settingsElementId = 'dialogic-settings'
	)
	{
		super( ...arguments );
		if ( this.tag ) {
			Dialogic.closeDialogsWithSameTag( this );
		}
		if ( this.settings.autoRun ) {
			this.run();
		}
	}

}

Object.defineProperty( Dialogic, 'DEFAULT_SETTINGS', {
	get: function ()
	{

		// default assets are resolved against this module (not the page), so they also work from node_modules or CDN
		/** @type {String} */
		const cssUrl = new URL( './css/dialogic.css', import.meta.url ).href;

		/** @type {String} */
		const audioUrl = new URL( './media/bell.mp3', import.meta.url ).href;

		return {
			rootElementId: 'dialogic-canvas',
			resultSnippetElements: {
				dialog: 'dialog',
				innerWrapper: 'div',
				image: 'img',
				title: 'h3',
				icon: 'img',
				badge: 'img',
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
				image: {
					itemprop: 'image',
				},
				title: {
					itemprop: 'headline name',
					class: 'p-name',
				},
				icon: {
					alt: 'Dialog icon',
					decoding: 'sync',
					crossorigin: 'anonymous',
					fetchpriority: 'high',
					width: 96,
					height: 96,
					loading: 'eager',
					itemprop: 'thumbnail',
					class: 'u-featured',
				},
				badge: {
					alt: 'Badge image',
					decoding: 'sync',
					crossorigin: 'anonymous',
					fetchpriority: 'high',
					width: 96,
					height: 96,
					loading: 'eager',
					itemprop: 'badge',
					class: 'u-badge',
				},
				description: {
					itemprop: 'abstract',
					class: 'p-summary',
				},
				closer: {
					class: 'closer',
					title: 'close this popup',
				},
				actionsWrapper: {},
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
				lang: {
					itemprop: 'inLanguage'
				},
				closerDataset: {
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
				{ href: cssUrl, title: 'CSS styles for Dialogic script', crossOrigin: 'anonymous' }
			],
			preloadFiles: [
				{ as: 'style', href: cssUrl, 'integrity': 'sha256-VGA63JNWZwNYYsGMRqljNyoQSrtoM8IXQolZAZaaSas=', crossOrigin: 'anonymous' },
				{ as: 'audio', href: audioUrl },
			],
			dialogShowAudio: audioUrl,
			modulesImportPath: './modules',
			autoRemoveDialogElementOnClose: true,
			showTimeIfDiff: 30,
			autoCloseAfter: 6000, // in ms
			autoRun: true,
		};
	},
	configurable: false,
	enumerable: true,
} );

if ( !customElements.get( Dialogic.ELEMENT_NAME ) ) {
	customElements.define( Dialogic.ELEMENT_NAME, Dialogic, { extends: Dialogic.EXTENDS_ELEMENT_NAME } );
}

if ( !Object.hasOwn( window, 'Dialogic' ) ) {
	Object.defineProperty( window, 'Dialogic', {
		value: Dialogic,
		configurable: false,
		enumerable: true,
		writable: false,
	} );
}

new HashCodeAppend( String );
