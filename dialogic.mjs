const DialogicInternal = class
{

}

export class Dialogic extends DialogicInternal
{

	/** @type {Number} */
	static #maxActions = 2;

	/** @type {Array} */
	#actions = [];

	#badge = '';

	#body = '';

	#dir = 'auto';

	#icon = '';

	#image = '';

	#lang = '';

	#onclick = null;

	#onclose = null;

	#onerror = null;

	#onshow = null;

	#silent = false;

	#tag = '';

	/** @type {Number} */
	#timestamp;

	get maxActions ()
	{
		return maxActions;
	}

	constructor ( /** @type {String} */ title = '', /** @type {Object} */ settings = {} )
	{
		super();

		this.#timestamp = Math.floor( Date.now() );
	}

}
