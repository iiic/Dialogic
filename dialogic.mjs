import { importWithIntegrity } from '/modules/importWithIntegrity.mjs';

const DialogicInternal = class
{

	/** @type {Array} */
	static list = [];
	static getList ()
	{
		return DialogicInternal.list;
	}
	static setList ( /** @type {Dialogic} */ listItem = Dialogic.prototype )
	{
		if ( listItem.constructor.name === 'Dialogic' ) {
			DialogicInternal.list.push( listItem );
		}
	}

	/** @type {Object} */
	#settings = {
		rootElementId: 'dialogic-canvas',
		resultSnippetElements: {
			dialog: 'DIALOG',
			innerWrapper: 'DIV',
			title: 'H3',
			description: 'P',
			closer: 'BUTTON',
			actionsWrapper: 'DIV',
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
			confirmNo: 'no',
			dividerBetweenButtons: ' ',
		},
		CSSStyleSheets: [
			{ href: 'css/dialogic.css', title: 'CSS styles for Dialogic script' }
		],
		preloadFiles: [
			{ as: 'style', href: 'css/dialogic.css', integrity: 'sha256-ymXTU3JziuuUCLcA28TR0Lw39jn5rgOAZuij69qWVrA=' },
			{ as: 'audio', href: 'media/bell.mp3' },
		],
		dialogShowAudio: 'media/bell.mp3',
		modulesImportPath: 'https://iiic.dev/js/modules',
		autoRemoveDialogElementOnClose: true,
		autoCloseAfter: 6000, // in ms
		showDialogWaitingBeforeShow: 5, // in ms
		autoRun: true,
	};
	getSettings ()
	{
		return this.#settings;
	}
	setSettings ( /** @type {Object} */ newSettings = {} )
	{
		this.#settings = DialogicInternal.#deepAssign( this.#settings, newSettings );
	}

	/** @type {HTMLElement|null} */
	#dialogElement;
	getDialogElement ()
	{
		return this.#dialogElement;
	}
	setDialogElement ( /** @type {HTMLElement} */ dialogElement = HTMLDialogElement.prototype )
	{
		if ( dialogElement && 'nodeType' in dialogElement && dialogElement.nodeType === Node.ELEMENT_NODE ) {
			this.#dialogElement = dialogElement;
		} else {
			throw new Error( 'Not a valid HTMLElement' );
		}
	}

	/** @type {String} */
	#dir;
	getDir ()
	{
		return this.#dir;
	}
	setDir ( /** @type {String} */ dir = '' )
	{
		if ( ![ 'auto', 'ltr', 'rtl' ].includes( dir ) ) {
			throw new Error( 'Dir value is invalid' );
		}
		this.#dir = dir;
	}

	/** @type {Number|null} */
	#runningTimeout = null;

	/** @type {Function|null} */
	onclick = null;

	/** @type {Function|null} */
	onclose = null;

	/** @type {Function|null} */
	onerror = null;

	/** @type {Function|null} */
	onshow = null;

	constructor ( /** @type {String} */ title = '', /** @type {Object} */ options = {}, settingsElementId = 'dialogic-settings' )
	{
		if ( arguments.length === 0 ) {
			throw new TypeError( 'Failed to construct \'Dialogic\': 1 argument required, but only 0 present.' );
		}
		this.createProperties( {
			enumerable: [
				'dialogElement',
				'dialogShowAudio',
			],
			'configurable enumerable':
			{
				settings: {},
				dir: 'auto',
			}
		} );
		Object.defineProperties( this, {
			eventListeners: {
				value: {
					click: {
						preventClickOnClose: function ( /** @type {PointerEvent} */ event )
						{
							event.stopPropagation();
						},
						confirmYes: function ( /** @type {PointerEvent} event */ )
						{
							if ( this.#runningTimeout ) {
								clearTimeout( this.#runningTimeout );
							}
							this.click();
							Dialogic.removeDialogFromList( this );
							this.dialogElement.close(); // close popup without close() event on Dialogic
						},
						confirmNo: function ( /** @type {PointerEvent} event */ )
						{
							if ( this.#runningTimeout ) {
								clearTimeout( this.#runningTimeout );
							}
							this.close();
						},
						focusOnPopup: function ( /** @type {PointerEvent} */ event )
						{
							if ( event.target === this.dialogElement ) {

								/** @type {HTMLElement} */
								const innerWrapperElement = this.dialogElement.firstElementChild;

								innerWrapperElement.contentEditable = 'true'; // string with true/false not Boolean
								innerWrapperElement.focus(); // { focusVisible: true } option currently not working
								innerWrapperElement.contentEditable = 'false';
							}
						},
					},
					close: {
						showNextDialog: function ( /** @type {Event} event */ )
						{
							Dialogic.showDialogsFromQueue( this.settings.showDialogWaitingBeforeShow );
						},
						removeDialogElement: function ( /** @type {Event} event */ )
						{
							this.rootElement.removeChild( this.dialogElement );
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
	}

	static emptySetter () { }

	static getMaxActions ()
	{
		return 2;
	}

	static getALERT ()
	{
		return 0;
	}

	static getCONFIRM ()
	{
		return 1;
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

	static addLinksIntoHead ( /** @type {Object} */ attributesObject = {}, /** @type {String} */ rel = 'preload', /** @type {Set|null} */ excludeSet = null )
	{
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
	}

	static addCSSStyleSheets ( /** @type {Array} */ CSSStyleSheets = [], /** @type {String} */ rel = 'stylesheet' )
	{

		/** @type {Set} */
		const existingStyleSheets = new Set();

		[ ...document.styleSheets ].forEach( ( /** @type {CSSStyleSheet} */ css ) =>
		{
			if ( css.disabled === false ) {
				existingStyleSheets.add( css.href );
			}
		} );

		DialogicInternal.addLinksIntoHead( CSSStyleSheets, rel, existingStyleSheets );
	}

	static preloadResources ( /** @type {Array} */ resources = [], /** @type {String} */ rel = 'preload' )
	{

		/** @type {NodeList} */
		const alreadyPreloaded = document.querySelectorAll( 'link[rel=preload][href]' );

		/** @type {Set} */
		const preloadedHrefList = new Set();

		alreadyPreloaded.forEach( function ( /** @type {HTMLLinkElement} */ link )
		{
			preloadedHrefList.add( link.href );
		} );

		DialogicInternal.addLinksIntoHead( resources, rel, preloadedHrefList );
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

	static getAbsoluteUrl ( /** @type {String} */ urlString = '' )
	{

		/** @type {URL} */
		let url;

		if ( urlString.startsWith( 'https://', 0 ) || urlString.startsWith( 'http://', 0 ) ) {
			url = new URL( urlString );
		} else {
			url = new URL( urlString, window.location.protocol + '//' + window.location.host );
		}
		return url;
	}

	static removeDialogFromList ( /** @type {Dialogic} */ dialogic = Dialogic.prototype )
	{
		/** @type {Number} */
		const index = Dialogic.list.indexOf( dialogic );

		if ( index > -1 ) {
			Dialogic.list.splice( index, 1 );
		}
	}

	getRootElement ()
	{

		/** @type {HTMLElement|null} */
		const foundRootElement = this.settings.rootElementId ? document.getElementById( this.settings.rootElementId ) : null;

		return foundRootElement ? foundRootElement : document.body;
	}

	click ()
	{
		if ( this.onclick ) {
			this.onclick();
		}
	}

	show ()
	{
		if ( this.onshow ) {
			this.onshow();
		}
		if ( !this.silent && this.settings.dialogShowAudio ) {
			if ( DialogicInternal.dialogShowAudio ) {

				/** @type {HTMLAudioElement} */
				const audio = DialogicInternal.dialogShowAudio;

				audio.pause();
				audio.currentTime = 0;
				audio.play();
			} else {

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
		this.dialogElement.dispatchEvent( new Event( 'show' ) );
		this.dialogElement.show();
	}

	close ()
	{
		if ( this.#runningTimeout ) {
			clearTimeout( this.#runningTimeout );
		}
		if ( this.onclose ) {
			this.onclose();
		}
		Dialogic.removeDialogFromList( this );
		this.dialogElement.close();
	}

	error ()
	{
		if ( this.onerror ) {
			this.onerror();
		}
		this.dialogElement.dispatchEvent( new Event( 'error' ) );
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
		const dialogId = this.settings.snippetIdPrefixes.dialog + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const titleElementId = this.settings.snippetIdPrefixes.title + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {String} */
		const descriptionElementId = this.settings.snippetIdPrefixes.description + this.timestamp + '-' + ( this.title ).hashCode();

		/** @type {HTMLImageElement|null} */
		const iconElement = this.icon ? document.createElement( 'img' ) : null;

		Object.assign( dialogElement, { ...{ id: dialogId }, ...this.settings.snippetAttributes.dialog } );
		dialogElement.setAttribute( 'aria-labelledby', titleElementId );
		dialogElement.setAttribute( 'aria-describedby', descriptionElementId );
		if ( this.dir !== 'auto' ) {
			dialogElement.dir = this.dir;
		}
		if ( this.lang ) {
			dialogElement.lang = this.lang;
		}
		dialogElement.addEventListener( 'click', this.eventListeners.click.focusOnPopup.bind( this ), {
			capture: false,
			once: false,
			passive: true,
		} );
		if ( this.type === Dialogic.CONFIRM ) {
			dialogElement.className = 'confirm';
		} else {
			dialogElement.className = 'alert';
		}
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
			closerElement.addEventListener( 'click', this.eventListeners.click.preventClickOnClose, {
				capture: false,
				once: false,
				passive: false,
			} );
			dialogElement.appendChild( closerElement );
		} else if ( this.type === Dialogic.CONFIRM ) {

			/** @type {HTMLElement} */
			const actionsWrapperElement = document.createElement( this.settings.resultSnippetElements.actionsWrapper );

			/** @type {HTMLButtonElement} */
			const confirmYes = document.createElement( this.settings.resultSnippetElements.confirmYes );

			/** @type {HTMLButtonElement} */
			const confirmNo = document.createElement( this.settings.resultSnippetElements.confirmNo );

			Object.assign( confirmYes, this.settings.snippetAttributes.confirmYes );
			Object.assign( confirmNo, this.settings.snippetAttributes.confirmNo );
			confirmYes.appendChild( document.createTextNode( this.settings.texts.confirmYes ) );
			confirmNo.appendChild( document.createTextNode( this.settings.texts.confirmNo ) );
			confirmYes.addEventListener( 'click', this.eventListeners.click.confirmYes.bind( this ), {
				capture: false,
				once: true,
				passive: true,
			} );
			confirmNo.addEventListener( 'click', this.eventListeners.click.confirmNo.bind( this ), {
				capture: false,
				once: true,
				passive: true,
			} );
			actionsWrapperElement.appendChild( confirmYes );
			actionsWrapperElement.appendChild( document.createTextNode( this.settings.texts.dividerBetweenButtons ) );
			actionsWrapperElement.appendChild( confirmNo );
			innerWrapperElement.appendChild( actionsWrapperElement );
		}
		this.rootElement.appendChild( dialogElement );
		return true;
	}

	checkRequirements ()
	{
		if ( !this.settings ) {
			this.error();
			throw new Error( 'Settings object is missing' );
		}
	}

	static createProperties ( /** @type {Object} */ sections = {} )
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

	createProperties ( /** @type {Object} */ sections = {} )
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
	}

	async run ()
	{
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
	}
}

export class Dialogic extends DialogicInternal
{
	constructor ( /** @type {String} */ title = '', /** @type {Object} */ options = {}, settingsElementId = 'dialogic-settings' )
	{
		super( ...arguments );
		this.createProperties( {
			noneAll: [
				'rootElement',
			],
			enumerable: [
				'show',
				'close',
				'click',
				'error',
				'addEventListener',
				'appendRemoveDialogElementOnCloseListener',
				'appendShowNextDialogAfterCloseListener',
				'checkRequirements',
				'createDialogSnippet',
				'run'
			],
			'configurable enumerable': {
				title,
				actions: [],
				badge: '',
				body: '',
				htmlBody: '',
				data: null,
				icon: '', // will be displayed as 96x96 px by default
				image: null,
				lang: '',
				renotify: false,
				requireInteraction: true,
				silent: false,
				tag: '',
				timestamp: Date.now(),
				vibrate: [],
				type: DialogicInternal.getALERT(),
			},
		} );
		if ( this.settings.autoRun ) {
			this.run();
		}
	}
}

DialogicInternal.createProperties( {
	enumerable: [
		'list',
		'maxActions',
		'removeDialogFromList',
		'loadExternalFunctions',
		'showDialogsFromQueue',
		'addCSSStyleSheets',
		'preloadResources',
		'ALERT',
		'CONFIRM',
	]
} );

Object.defineProperty( window, 'Dialogic', {
	value: Dialogic,
	configurable: false,
	enumerable: true,
	writable: false,
} );
