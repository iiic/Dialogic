//https://github.com/wootzapp/wootz-browser/blob/11f9323feb5ef4ab7dc420d7c3e9dbe372d868b3/js/web_notification.js#L18

// @todo : vyzkoušet jak se chová settings… jestli jeto stejné jako moje object.deepAssign

// @todo : vyzkoušet přesunout věci z constructoru do Internal třídy

const DialogicInternal = class
{

	#settings = {
		defaultOptions: {
			actions: [],
			badge: '',
			body: '',
			data: null,
			dir: 'auto',
			icon: '',
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
			closer: 'BUTTON'
		},
		modulesImportPath: 'https://iiic.dev/js/modules',
		autoRun: true,
	};

	constructor ()
	{

		Object.defineProperty( this, 'settings', {
			get: function ()
			{
				return this.#settings;
			},
			set: function ( /** @type {Object} */ newSettings )
			{
				this.#settings = { ...this.#settings, ...newSettings };
			},
			enumerable: true,
			configurable: true
		} );

	}

	#privatniMetoda ()
	{
		console.log( 'hustý' );
	}

}

export class Dialogic extends DialogicInternal
{

	static ALERT = 0;
	static CONFIRM = 1;

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

	async run ()
	{
		await this.checkRequirements();

	}

}

// Private properties
Object.defineProperty( Dialogic, 'maxActions', {
	get: function ()
	{
		return 2;
	},
	set: function () { },
	enumerable: true
} );

window.Dialogic = Dialogic;
