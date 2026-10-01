# Dialogic.js

Popups built on the native `<dialog>` element, created from JavaScript with the same parameters as the browser's
[`Notification()`](https://developer.mozilla.org/en-US/docs/Web/API/Notification).
No permission prompt, no dependencies, just vanilla JavaScript.

```js
new Dialogic( 'Saved', { body: 'Your changes have been saved.' } )
```

## Installation

```sh
npm install @iiic/dialogic.js
```

## Usage

### With a bundler or an import map

```js
import { Dialogic } from '@iiic/dialogic.js'

new Dialogic( 'New message', {
	body: 'You have 3 unread messages.',
	icon: '/img/avatar.png',
} )
```

Importing the module also defines `window.Dialogic`, so after the first import the class is available globally
(in inline scripts or in the browser console, for example).

The default stylesheet and sound (`css/dialogic.css`, `media/bell.mp3`) are resolved relative to the module itself,
so nothing has to be copied into your project.

### Directly in the browser (CDN)

```html
<script type="module">
	import { Dialogic } from 'https://cdn.jsdelivr.net/npm/@iiic/dialogic.js@0.2/dialogic.mjs'

	new Dialogic( 'Hello', { body: 'Loaded straight from a CDN.' } )
</script>
```

## Options

The second parameter accepts the same options as `Notification()`, plus a few that only Dialogic has.

| Option | Type | Description |
| --- | --- | --- |
| `body` | `string` | Text content of the dialog. |
| `htmlBody` | `string` | HTML content of the dialog, used when `body` is empty (Dialogic only). **It is inserted as raw HTML, never pass untrusted input.** |
| `icon` | `string` | URL of an icon shown next to the title (96 × 96 px by default). |
| `image` | `string` | URL of a larger image shown in the dialog. |
| `badge` | `string` | URL of a small badge image. |
| `tag` | `string` | Dialogs with the same tag replace each other, an open dialog is replaced immediately and silently. |
| `renotify` | `boolean` | With the same `tag`, the new dialog doesn't silently replace the open one, it is shown as a new dialog (with sound) after the current one is closed. Default `false`. |
| `requireInteraction` | `boolean` | Keep the dialog open until the user closes it. Default `false`, the dialog then closes after `autoCloseAfter` ms (6 s). |
| `silent` | `boolean` | Don't play the sound. Default `false`. |
| `timestamp` | `number` | Time in ms (e.g. `Date.now()`), shown in the dialog when it differs from the current time by more than 30 s. It does **not** delay the display. |
| `vibrate` | `number \| number[]` | Vibration pattern, passed to `navigator.vibrate()` where supported. |
| `dir` | `'auto' \| 'ltr' \| 'rtl'` | Text direction (`direction` works too). |
| `lang` | `string` | Language of the content, set as the `lang` attribute. |
| `data` | `any` | Any data, stored as a structured clone and available as `dialog.data`. |
| `actions` | `Array<{ action, title, icon? }>` | Custom buttons. A click fires the `actionclick` event with `event.detail.action` and closes the dialog. |
| `type` | `Dialogic.DIALOG_TYPES.ALERT \| Dialogic.DIALOG_TYPES.CONFIRM` | `CONFIRM` shows yes / no buttons (Dialogic only). Default `ALERT`. |

## Events

Events `click`, `close`, `error`, `show` and `actionclick` can be handled with `addEventListener()` or with the
`onclick`, `onclose`, `onerror` and `onshow` properties.

In a confirm dialog the yes button calls `onclick` and the no button calls `onclose`:

```js
const dialog = new Dialogic( 'Question', {
	type: Dialogic.DIALOG_TYPES.CONFIRM,
	body: 'Do you agree?',
} )
dialog.onclick = () => console.log( 'yes' )
dialog.onclose = () => console.log( 'no' )
```

## Settings

Settings shared by all dialogs on the page go into a JSON `<script>` element, its content is deep-merged over
`Dialogic.DEFAULT_SETTINGS`:

```html
<script type="application/json" id="dialogic-settings">
	{
		"autoCloseAfter": 10000,
		"texts": {
			"confirmYes": "Sure",
			"confirmNo": "No, thanks"
		}
	}
</script>
```

A different element id can be passed as the third parameter of the constructor. Settings can also be passed as
URL-encoded JSON in the `settings` parameter of the module URL, e.g. `dialogic.mjs?settings={"autoRun":false}`.

| Setting | Default | Description |
| --- | --- | --- |
| `autoCloseAfter` | `6000` | Milliseconds before a dialog without `requireInteraction` closes. |
| `autoRun` | `true` | Show the dialog right from the constructor. With `false`, call `dialog.run()` yourself. |
| `rootElementId` | `'dialogic-canvas'` | Id of the element dialogs are appended to, `document.body` is used when it doesn't exist. |
| `dialogShowAudio` | `media/bell.mp3` of this package | URL of the sound, an empty string disables it. |
| `CSSStyleSheets` | `css/dialogic.css` of this package | Stylesheets added to the page. |
| `preloadFiles` | stylesheet and sound | Resources preloaded with `<link rel="preload">`. |
| `texts` | | Texts of buttons and titles, e.g. for translations. |
| `snippetAttributes` | | Attributes of the generated elements (classes, microdata, titles, …). |

All settings are listed in `Dialogic.DEFAULT_SETTINGS` and described in `dialogic.globals.d.ts`. Arrays are replaced,
not merged, so to use your own stylesheet instead of the default one, replace both `CSSStyleSheets` and `preloadFiles`:

```json
{
	"CSSStyleSheets": [ { "href": "/css/my-dialogs.css", "title": "My dialogs" } ],
	"preloadFiles": []
}
```

Relative URLs in your own settings are resolved against the page, not against the module.

## Differences from `Notification`

- No permission is needed. The dialog is part of the page, so it is visible only while the page is open.
- `htmlBody`, `type: Dialogic.DIALOG_TYPES.CONFIRM` and global settings exist only in Dialogic.
- Dialogs without `requireInteraction` are queued and shown one at a time.

## Browser support

Dialogic extends the native `<dialog>` element (a customized built-in element). Chromium based browsers and Firefox
support it natively, Safari doesn't, so it needs a polyfill such as
[@ungap/custom-elements](https://www.npmjs.com/package/@ungap/custom-elements) loaded before Dialogic.

The module needs a browser environment (`window`, `document`, `customElements`), it can't run in Node.js without a DOM.

## Demo

`example-usage.html` in the [GitHub repository](https://github.com/iiic/Dialogic) compares all options side by side
with the native `Notification`.

## License

[CC BY-SA 4.0](LICENSE)
