export class append
{
	constructor ( e = Element )
	{

		/** @type {String} */
		const FUNCTION_NAME = 'setMultipleAttributes';

		if ( !e.prototype.hasOwnProperty( FUNCTION_NAME ) ) {
			Object.defineProperty( e.prototype, FUNCTION_NAME, {
				value: function ( /** @type {Object} */ attributes )
				{

					/** @type {Array} */
					const attrNames = Object.keys( attributes );

					attrNames.forEach( ( /** @type {String} */ attrName = '' ) =>
					{

						/** @type {String|Boolean} */
						const attrValue = attributes[ attrName ];

						if ( attrValue === true || attrValue === false ) {
							this[ attrName ] = attrValue;
						} else {
							this.setAttribute( attrName, attrValue );
						}
					} );
				},
				writable: false,
				configurable: false,
				enumerable: false,
			} );
		}
	}
}
