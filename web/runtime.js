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

navigator.persistentStorage = navigator.persistentStorage || navigator.webkitPersistentStorage || {
	requestQuota: function (askQuota, callback) {
		if (typeof (navigator.webkitPersistentStorage) !== "undefined" && typeof (navigator.webkitPersistentStorage.requestQuota) !== "undefined") {
			return navigator.webkitPersistentStorage.requestQuota(askQuota, callback);
		} else if (typeof (window.webkitStorageInfo) !== "undefined" && typeof (window.webkitStorageInfo.requestQuota) !== "undefined") {
			return window.webkitStorageInfo.requestQuota(PERSISTENT, askQuota, callback);
		}
		throw "navigator.persistentStorage.requestQuota is not defined";
	},
	queryUsageAndQuota: function (responseCallback, errorCallback) {
		if (typeof (navigator.webkitPersistentStorage) !== "undefined" && typeof (navigator.webkitPersistentStorage.queryUsageAndQuota) !== "undefined") {
			return navigator.webkitPersistentStorage.queryUsageAndQuota(responseCallback, errorCallback);
		} else if (typeof (window.webkitStorageInfo) !== "undefined" && typeof (window.webkitStorageInfo.queryUsageAndQuota) !== "undefined") {
			return window.webkitStorageInfo.queryUsageAndQuota(PERSISTENT, responseCallback, errorCallback);
		}
		throw "navigator.persistentStorage.queryUsageAndQuota is not defined";
	}
};
navigator.temporaryStorage = navigator.temporaryStorage || navigator.webkitTemporaryStorage || {
	requestQuota: function (askQuota, callback) {
		if (typeof (navigator.webkitTemporaryStorage) !== "undefined") {
			return navigator.webkitTemporaryStorage.requestQuota(askQuota, callback);
		} else if (typeof (window.webkitStorageInfo) !== "undefined") {
			return window.webkitStorageInfo.requestQuota(TEMPORARY, askQuota, callback);
		}
		throw "navigator.temporaryStorage.requestQuota is not defined";
	},
	queryUsageAndQuota: function (responseCallback, errorCallback) {
		if (typeof (navigator.webkitTemporaryStorage) !== "undefined" && typeof (navigator.webkitTemporaryStorage.queryUsageAndQuota) !== "undefined") {
			return navigator.webkitTemporaryStorage.queryUsageAndQuota(responseCallback, errorCallback);
		} else if (typeof (window.webkitStorageInfo) !== "undefined" && typeof (window.webkitStorageInfo.queryUsageAndQuota) !== "undefined") {
			return window.webkitStorageInfo.queryUsageAndQuota(TEMPORARY, responseCallback, errorCallback);
		}
		throw "navigator.temporaryStorage.queryUsageAndQuota is not defined";
	}
};
window.crypto = window.crypto || window.msCrypto || window.webkitCrypto;

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystemSync = window.requestFileSystemSync || window.webkitRequestFileSystemSync;
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

//window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame
//		|| function (callback) {
//			window.setTimeout(callback, 1000 / 60);
//		};

Date.prototype.getMicrotime = function () {
	return this.getTime() + this.getMilliseconds() / 1000;
};
