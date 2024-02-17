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
			dialog: 'dialog',
			innerWrapper: 'div',
			title: 'h3',
			description: 'p',
			closer: 'button',
			actionsWrapper: 'div',
			confirmYes: 'button',
			confirmNo: 'button',
			confirmYesInner: 'data',
			confirmNoInner: 'data',
			timePublished: 'time',
			timeUpdated: 'time',
			timeExpires: 'time'
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
		},
		texts: {
			closerTextContent: 'x',
			confirmYes: 'yes',
			confirmNo: 'no',
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
	#dir = 'auto';
	getDir ()
	{
		return this.#dir;
	}
	setDir ( /** @type {String} */ dir = 'auto' )
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
		].map( async ( /** @type {Object} */ assignment ) =>
		{
			if ( !assignment.appendInto.hasOwnProperty( assignment.name ) ) {
				return importWithIntegrity(
					assignment.path,
					assignment.integrity
				).then( ( /** @type {Module} */ module ) =>
				{
					return new module.append( assignment.appendInto );
				} );
			}
		} ) );
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
		if ( this.vibrate ) {
			navigator.vibrate( this.vibrate );
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

		dialogElement.setMultipleAttributes( {
			...{
				id: dialogId,
				'aria-labelledby': titleElementId,
				'aria-describedby': descriptionElementId,
			}, ...this.settings.snippetAttributes.dialog
		} );
		if ( this.dir !== 'auto' ) {
			dialogElement.dir = this.dir;
		}
		if ( this.lang ) {
			dialogElement.lang = this.lang;
			// @todo : itemprop="inLanguage" nejlépe pomocí <meta itemprop="inLanguage" content="cs">
		}
		dialogElement.addEventListener( 'click', this.eventListeners.click.focusOnPopup.bind( this ), {
			capture: false,
			once: false,
			passive: true,
		} );
		if ( this.type === Dialogic.CONFIRM ) {
			dialogElement.classList.add( 'confirm' );
		} else {
			dialogElement.classList.add( 'alert' );
		}
		innerWrapperElement.setMultipleAttributes( this.settings.snippetAttributes.innerWrapper );
		if ( iconElement ) {
			iconElement.setMultipleAttributes( { ...{ src: this.icon }, ...this.settings.snippetAttributes.icon } );
		}
		titleElement.appendChild( document.createTextNode( this.title ) );
		titleElement.setMultipleAttributes( { ...{ id: titleElementId }, ...this.settings.snippetAttributes.title } );
		if ( this.body ) {
			descriptionElement.appendChild( document.createTextNode( this.body ) );
		} else if ( this.htmlBody ) {
			descriptionElement.insertAdjacentHTML( 'beforeend', this.htmlBody );
		}
		descriptionElement.setMultipleAttributes( { ...{ id: descriptionElementId }, ...this.settings.snippetAttributes.description } );
		dialogElement.appendChild( innerWrapperElement );
		if ( iconElement ) {
			innerWrapperElement.appendChild( iconElement );
		}
		innerWrapperElement.appendChild( titleElement );
		innerWrapperElement.appendChild( descriptionElement );
		if ( this.timestamp ) {

			/** @type {Number} */
			const timeDiff = Math.abs( ( this.timestamp - Date.now() ) / 1000 );

			if ( timeDiff > this.settings.showTimeIfDiff ) {

				/** @type {HTMLTimeElement} */
				const timeElement = document.createElement( this.settings.snippetAttributes.timePublished );

				/** @type {String} */
				const timeElementTextContent = ( timeDiff > ( 60 * 12 ) ) ? new Date( this.timestamp ).toLocaleString() : new Date( this.timestamp ).toLocaleTimeString();

				timeElement.setMultipleAttributes( {
					...{
						title: this.settings.texts.timestampCreatedTitle,
						dateTime: new Date( this.timestamp ).toISOString(),
					}, ...this.settings.snippetAttributes.timePublished
				} );
				timeElement.appendChild( document.createTextNode( timeElementTextContent ) );
				innerWrapperElement.appendChild( timeElement );
			}
		}
		if ( this.type === Dialogic.ALERT ) {
			innerWrapperElement.addEventListener( 'click', this.click.bind( this ), {
				capture: false,
				once: false,
				passive: true,
			} );
			closerElement.appendChild( document.createTextNode( this.settings.texts.closerTextContent ) );
			closerElement.setMultipleAttributes( this.settings.snippetAttributes.closer );
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

			/** @type {HTMLElement} */
			const confirmYesInner = document.createElement( this.settings.resultSnippetElements.confirmYesInner );

			/** @type {HTMLButtonElement} */
			const confirmNo = document.createElement( this.settings.resultSnippetElements.confirmNo );

			/** @type {HTMLElement} */
			const confirmNoInner = document.createElement( this.settings.resultSnippetElements.confirmNoInner );

			confirmYes.setMultipleAttributes( this.settings.snippetAttributes.confirmYes );
			confirmNo.setMultipleAttributes( this.settings.snippetAttributes.confirmNo );
			confirmYesInner.setMultipleAttributes( this.settings.snippetAttributes.confirmYesInner );
			confirmNoInner.setMultipleAttributes( this.settings.snippetAttributes.confirmNoInner );
			confirmYesInner.appendChild( document.createTextNode( this.settings.texts.confirmYes ) );
			confirmNoInner.appendChild( document.createTextNode( this.settings.texts.confirmNo ) );
			confirmYes.appendChild( confirmYesInner );
			confirmNo.appendChild( confirmNoInner );
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
		// @todo : …
		// <p hidden> layout.schemaVersion <a href="https://schema.org/version/7.0/" itemprop="schemaVersion">7.0</a></p>
		// <meta itemprop="accessMode" content="textual visual">
		// <meta itemprop="accessibilityAPI" content="ARIA">
		// <meta itemprop="accessibilityControl" content="fullKeyboardControl fullMouseControl fullTouchControl">
		// <meta itemprop="creativeWorkStatus" content="Published" > a přepínat podle toho jestli je nebo není popup zobrazen Draft / Published / Obsolete
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
