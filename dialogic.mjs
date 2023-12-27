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
		modulesImportPath: 'https://iiic.dev/js/modules',
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

	/*
			<p id="delivery-address-description">
				… imagine some form in here :)
				<br><br>
				<i>
					Lorem ipsum dolor sit amet, consectetuer adipiscing elit.<br>
					Aliquam erat volutpat. Suspendisse sagittis ultrices augue.<br>
					Integer malesuada. Aliquam ornare wisi eu metus. Integer pellentesque quam vel velit.<br>
					Nunc dapibus tortor vel mi dapibus sollicitudin.
				</i>
			</p>
			<button onclick="alert('yes')">yes</button> / <button onclick="alert('no')">no</button>
		</div>
		<button data-on="tap:my-lightbox.close" title="close dialog">x</button>
	</dialog>
	*/
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
		}
		titleElement.appendChild( document.createTextNode( this.title ) );
		titleElement.id = titleElementId;
		if ( this.body ) {
			descriptionElement.appendChild( document.createTextNode( this.body ) );
		} else if ( this.htmlBody ) {
			descriptionElement.insertAdjacentHTML( 'beforeend', this.htmlBody );
		}
		descriptionElement.id = descriptionElementId;
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
