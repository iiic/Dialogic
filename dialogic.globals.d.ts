type AttributeValue = string | number | boolean | null | undefined;
type Base36String = string;
  type DialogElementName = 'dialog' | 'innerWrapper' | 'image' | 'title' | 'icon' | 'badge' | 'description' | 'closer' | 'actionsWrapper' | 'confirmYes' | 'confirmNo' | 'confirmYesInner' | 'confirmNoInner' | 'timePublished' | 'timeUpdated' | 'timeExpires' | 'lang' | 'schemaVersion' | 'accessMode' | 'accessibilityAPI' | 'accessibilityControl' | 'creativeWorkStatus';

/**
 * @file dialogic.globals.d.ts
 * @description TypeScript global declarations for Dialogic.
 * @version 0.2
 * @license CC-BY-SA-4.0
 */
declare global {

	namespace Enums {

		/**  */
		type PossibleTextDirections = string & {
			readonly oneOf: 'auto' | 'ltr' | 'rtl';
		};

		/**  */
		type DialogTypes = string & {
			readonly oneOf: 'alert' | 'confirm';
		};

	}

	namespace Constants {

		const POSSIBLE_TEXT_DIRECTIONS: {
			readonly AUTO: Enums.PossibleTextDirections;
			readonly LTR: Enums.PossibleTextDirections;
			readonly RTL: Enums.PossibleTextDirections;
		};

		/**  */
		const DIALOG_TYPES: {
			readonly ALERT: Enums.DialogTypes;
			readonly CONFIRM: Enums.DialogTypes;
		};

	}

	namespace Types {

		type DialogTypes = typeof Constants.DIALOG_TYPES;

		type PossibleTextDirections = typeof Constants.POSSIBLE_TEXT_DIRECTIONS;

		type DialogElements = Record<DialogElementName, HTMLElement>;

		type DialogOptions = {
			actions?: Array<DialogAction>;
			badge?: string;
			body?: string;
			htmlBody?: string;
			data?: any;
			dir?: 'auto' | 'ltr' | 'rtl';
			direction?: 'auto' | 'ltr' | 'rtl';
			icon?: string;
			image?: string;
			lang?: string;
			navigate?: string;
			renotify?: boolean;
			requireInteraction?: boolean;
			silent?: boolean;
			tag?: string;
			timestamp?: number;
			type?: Enums.DialogTypes;
			vibrate?: number | Array<number>;
		};

		type DialogAction = {
			action: string;
			title: string;
			icon?: string;
			navigate?: string;
		};

		type Settings = {
			rootElementId: string;
			resultSnippetElements: Record<DialogElementName, string>;
			snippetIdPrefixes: {
				dialog: string;
				title: string;
				description: string;
			};
			snippetAttributes: {
				dialog: {
					open: boolean;
					role: string;
					itemscope: string;
					itemtype: string;
					class: string;
				};
				innerWrapper: {
					role: string;
					tabindex: number;
					itemprop: string;
					class: string;
				};
				image: {
					itemprop: string;
				};
				title: {
					itemprop: string;
					class: string;
				};
				icon: {
					alt: string;
					decoding: string;
					crossorigin: string;
					fetchpriority: string;
					width: number;
					height: number;
					loading: string;
					itemprop: string;
					class: string;
				};
				badge: {
					alt: string;
					decoding: string;
					crossorigin: string;
					fetchpriority: string;
					width: number;
					height: number;
					loading: string;
					itemprop: string;
					class: string;
				};
				description: {
					itemprop: string;
					class: string;
				};
				closer: {
					class: string;
					title: string;
				};
				actionsWrapper: Record<string, never>;
				confirmYes: {
					class: string;
					title: string;
				};
				confirmNo: {
					class: string;
					title: string;
				};
				confirmYesInner: {
					class: string;
					value: string;
				};
				confirmNoInner: {
					class: string;
					value: string;
				};
				timePublished: {
					itemprop: string;
					class: string;
				};
				timeUpdated: {
					class: string;
				};
				timeExpires: {
					itemprop: string;
				};
				lang: {
					itemprop: string;
				};
				closerDataset: Record<string, any>;
				schemaVersion: {
					href: string;
					itemprop: string;
					hidden: boolean;
				};
				accessMode: {
					itemprop: string;
					content: string;
				};
				accessibilityAPI: {
					itemprop: string;
					content: string;
				};
				accessibilityControl: {
					itemprop: string;
					content: string;
				};
				creativeWorkStatus: {
					itemprop: string;
					content: string;
				};
			};
			texts: {
				closerTextContent: string;
				confirmYes: string;
				confirmNo: string;
				iconAlt: string;
				imageAlt: string;
				dividerBetweenButtons: string;
				timestampCreatedTitle: string;
				timestampUpdatedTitle: string;
			};
			CSSStyleSheets: Array<{
				href: string;
				title: string;
				crossOrigin?: string;
			}>;
			preloadFiles: Array<{
				as: string;
				href: string;
				integrity?: string;
				crossOrigin?: string;
			}>;
			dialogShowAudio: string;
			modulesImportPath: string;
			autoRemoveDialogElementOnClose: boolean;
			showTimeIfDiff: number;
			autoCloseAfter: number;
			autoRun: boolean;
		};

	}

		namespace Classes {
		class DialogicInternal extends HTMLDialogElement {

			static get list(): Array<Dialogic>;

			static set list( listItem: Dialogic );

			static showDialogsFromQueue(): void;
			static addCSSStyleSheets( CSSStyleSheets?: Array<{ href: string; title: string }>, rel?: string ): void;
			static preloadResources( resources?: Array<{ as?: string; href?: string; src?: string; url?: string; title?: string; integrity?: string; rel?: string; crossOrigin?: string; media?: string; type?: string }>, rel?: string ): void;
			static shouldBeDisplayed( dialog: Dialogic ): boolean;
			static removeDialogFromList( dialogic: Dialogic ): void;
			static closeDialogsWithSameTag( dialog: Dialogic ): void;

			get settings(): Types.Settings;
			set settings( newSettings: Partial<Types.Settings> );

			get dialogElement(): HTMLDialogElement;
			set dialogElement( dialogElement: HTMLDialogElement );

			get dir(): Enums.PossibleTextDirections;
			set dir( newDir: Enums.PossibleTextDirections );

			displayed: boolean;
			onshow: ( () => void ) | null;
			type: Enums.DialogTypes;
			vibrate: number[];
			timestamp: number;
			tag: string;
			navigate: string;
			silent: boolean;
			requireInteraction: boolean;
			renotify: boolean;
			lang: string;
			image: string | null;
			icon: string;
			data: any;
			htmlBody: string;
			body: string;
			badge: string;
			actions: Array<Types.DialogAction>;
			title: string;
			dialogShowAudio: HTMLAudioElement | null;

			get rootElement(): HTMLElement;

			eventListeners: {
				click: {
					preventClickOnClose: ( event: PointerEvent ) => void;
					confirmYes: ( event: Event ) => void;
					confirmNo: ( event: Event ) => void;
					actionClick: ( event: PointerEvent ) => void;
					focusOnPopup: ( event: PointerEvent ) => void;
				};
				close: {
					showNextDialog: () => void;
					removeDialogElement: () => void;
				};
			};

			constructor ( title?: string, options?: Types.DialogOptions, settingsElementId?: string );

			click(): void;
			show(): void;
			close(): void;
			error(): void;
			dispatchEvent( event: Event ): boolean;
			addEventListener( type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions, useCapture?: boolean ): void;
			appendRequireInteractionListener(): Promise<void>;
			appendShowNextDialogAfterCloseListener(): void;
			appendRemoveDialogElementOnCloseListener(): void;
			addAttributesToElements( elements: Types.DialogElements ): Types.DialogElements;
			createAllElements(): Types.DialogElements;
			createDomStructureFrom( elements?: Types.DialogElements ): void;
			createDialogSnippet(): boolean;
			checkRequirements(): void;
			updatePathByBase(): void;
			run(): void;
		}

		class Dialogic extends DialogicInternal {

			/**
			 * Available dialog types exposed as Dialogic.DIALOG_TYPES.ALERT and
			 * Dialogic.DIALOG_TYPES.CONFIRM.
			 */
			static get DIALOG_TYPES(): Types.DialogTypes;
			static get POSSIBLE_TEXT_DIRECTIONS(): Types.PossibleTextDirections;
			static get maxActions(): number;
			static get SETTINGS_URL_PARAMETER(): string;
			static get DEFAULT_SETTINGS(): Types.Settings;

		}
	}

	interface String {
		hashCode(): Base36String;
	}

	interface Window {
		Dialogic: typeof Classes.Dialogic;
	}

}

export { };
