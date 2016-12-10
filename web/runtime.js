/*******************************************************************************************************************************************************************************************************
 * INIT
 ******************************************************************************************************************************************************************************************************/


var map = false;
$(function () {
	map = new MapViewer({
		canvas: $("#map"),
		touch: !!('ontouchstart' in window),
		appName: 'salem_map',
		defaultQuota: 5 * 1024 * 1024,
		imgPath: 'data',
		size: 100,
		scaleStep: 0.2,
		imgLoadMax: 5,
		keyMovementFactor: 10,
		regNameMap: /^\w+_(\d+)_(\d+)\.\w+$/,
		targetTileColor: '#FFF'
	});
});


/***************************************************************************************************************************************************************************************************
 * CUSTOM FUNCTIONS => helper?
 **************************************************************************************************************************************************************************************************/

/**
 *
 * @param {type} dataURL
 * @returns {Blob}
 */
var dataURItoBlob = function (dataURL) {
	var BASE64_MARKER = ';base64,';
	if (dataURL.indexOf(BASE64_MARKER) === -1) {
		var parts = dataURL.split(',');
		var contentType = parts[0].split(':')[1];
		var raw = decodeURIComponent(parts[1]);
		return new Blob([raw], {type: contentType});
	}

	var parts = dataURL.split(BASE64_MARKER);
	var contentType = parts[0].split(':')[1];
	var raw = window.atob(parts[1]);
	var rawLength = raw.length;
	var uInt8Array = new Uint8Array(rawLength);
	for (var i = 0; i < rawLength; ++i) {
		uInt8Array[i] = raw.charCodeAt(i);
	}

	return new Blob([uInt8Array], {type: contentType});
};
/***************************************************************************************************************************************************************************************************
 * BROWSER DIFFERENCES
 **************************************************************************************************************************************************************************************************/

window.crypto = window.crypto || window.msCrypto || window.webkitCrypto;

//window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame
//		|| function (callback) {
//			window.setTimeout(callback, 1000 / 60);
//		};

Date.prototype.getMicrotime = function () {
	return this.getTime() + this.getMilliseconds() / 1000;
};
