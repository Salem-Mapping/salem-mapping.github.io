if (typeof (PERSISTENT) === "undefined") PERSISTENT = 1;
if (typeof (TEMPORARY) === "undefined")	TEMPORARY = 1;

window.FileSystem = (function () {

	function FileSystem (_type, _bytes) {
		var bytes = typeof (_bytes) === undefined ? 0 : _bytes;
		this.remainigBytes = this.grantedBytes = this.usedBytes = -1;
		this.type = _type;
		this.fileSystem = false;
		this.directory = false;
		this.queryUsageAndQuota().then(function (tObj, _remainigBytes, _grantedBytes) {
			tObj.init(Math.max(bytes, tObj.grantedBytes));
		});
		return this;
	}


	FileSystem.prototype = {
		queryUsageAndQuota: function () {
			var tObj = this;
			return new Promise(function (_resolve, _reject) {
				var success = function (_remainigBytes, _grantedBytes) {
					console.log("currently granted:", b2s(tObj.grantedBytes = _grantedBytes), "used:", b2s(tObj.usedBytes = _grantedBytes - _remainigBytes), "remainig:", b2s(tObj.remainigBytes = _remainigBytes));
					_resolve(tObj, _remainigBytes, _grantedBytes);
				};
				var failture = function (e) {
					_reject(fsError(e, 'queryUsageAndQuota'), e);
				};
				switch (tObj.type) {
					case PERSISTENT:
						navigator.persistentStorage.queryUsageAndQuota(success, failture);
						break;
					case TEMPORARY:
						navigator.temporaryStorage.queryUsageAndQuota(success, failture);
						break;
					default:
						_reject('INVALID_STATE_ERR', {});
				}
			});
		},
		requestQuota: function (_bytes) {
			var tObj = this;
			return new Promise(function (_resolve, _reject) {
				if (tObj.grantedBytes === -1) {
					tObj.queryUsageAndQuota().then(function (tObj) {
						tObj.requestQuota(_bytes).then(_resolve, _reject);
					});
				} else {
					var bytes = typeof (_bytes) === undefined ? 0 : _bytes;
					var requestBytes = tObj.usedBytes + bytes;
					console.log("request Bytes:", b2s(bytes), "with used: ", b2s(requestBytes));
					var success = function (_grantedBytes) {
						console.log("now granted:", b2s(tObj.grantedBytes = _grantedBytes), "remainig:", b2s(tObj.remainigBytes = tObj.grantedBytes - tObj.usedBytes));
						_resolve(tObj, _grantedBytes);
					};
					var failture = function (e) {
						_reject(fsError(e, 'requestQuota'), e);
					};
					switch (tObj.type) {
						case PERSISTENT:
							navigator.persistentStorage.requestQuota(requestBytes, success, failture);
							break;
						case TEMPORARY:
							navigator.temporaryStorage.requestQuota(requestBytes, success, failture);
							break;
						default:
							_reject('INVALID_STATE_ERR', {});
					}
				}
			});
		},
		init: function (_bytes) {
			var tObj = this;
			var bytes = typeof (_bytes) === undefined ? 0 : _bytes;
			return new Promise(function (_resolve, _reject) {
				if (tObj.remainigBytes < bytes) {
					tObj.requestQuota(tObj.remainigBytes + bytes).this(function (tObj, _grantedBytes) {
						tObj.init(_grantedBytes).then(_resolve, _reject);
					});
				} else {
					window.requestFileSystem(tObj.type, tObj.bytes, function (_fs) {
						console.log("requestFileSystem: ", _fs);
						_resolve(tObj, tObj.fileSystem = _fs, tObj.directory = _fs.root);
					}, function (e) {
						_reject(fsError(e, 'requestFileSystem'), e);
					});
				}
			});
		},
		getSubDirectory: function (_directory, _create) {
			var tObj = this;
			var directory = _directory === undefined ? "" : _directory;
			var create = _create === undefined ? true : _create;
			console.log("requestDirectory: ", directory);
			return new Promise(function (_resolve, _reject) {
				if (tObj.fileSystem === false) {
					tObj.init().then(function (tObj) {
						tObj.getSubDirectory(directory, create).then(_resolve, _reject);
					});
				} else {
					if (tObj.directory === false || directory === "") {
						tObj.directory = tObj.fileSystem.root;
						if (directory === "")
							return _resolve(tObj, tObj.directory);
					}
					tObj.directory.getDirectory(directory, {
						create: create
					}, function (_dirEntry) {
						console.log("getDirectory: ", tObj.directory = _dirEntry);
						_resolve(tObj, tObj.directory);
					}, function (e) {
						_reject(fsError(e, 'getDirectory(' + directory + ')'), e);
					});
				}
			});
		},
		getDirectory: function (_path) {
			var tObj = this;
			return new Promise(function (_resolve, _reject) {
				var path = _path === undefined ? '' : _path;
				var arrPath = typeof (path) === "String" ? path.replace('//', '/').split("/") : typeof (path) === "Array" ? path : "";
				var dirName = arrPath.shift();
				tObj.getSubDirectory(dirName).then(function (tObj, _dirEntry) {
					if (arrPath.length === 0) {
						_resolve(tObj, _dirEntry);
					} else {
						tObj.getDirectory(arrPath).then(_resolve, _reject);
					}
				}, _reject);
			});
		},
		getFile: function (_file) {
			var tObj = this;
			return new Promise(function (_resolve, _reject) {
				tObj.directory.getFile(_file, {
					create: false
				}, function (tObj, _fileEntry) {
					_fileEntry.getMetadata(function (_meta) {
						_resolve(tObj, _fileEntry, _meta);
					});
				}, function (e) {
					_reject(fsError(e, 'getFile'), e);
				});
			});
		}
	};

	var fsError = function (e, o) {
		console.log("fsError", e);
		var msg = e.name + ': ' + e.message;
		var obj = o === undefined ? '' : '->' + o;
		console.log('[FileSystem' + obj + '] ' + msg);
		return msg;
	};

	var b2s = function (bytes) {
		var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes == 0)
			return '0 Byte';
		var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
	};

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
	window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
	return(FileSystem);
}).call({});
