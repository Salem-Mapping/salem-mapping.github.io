'use strict';
importScripts("ExtendedAPI.html");
importScripts("WorkerController.html");
importScripts("XHR.html");
importScripts("FileSystem.html");
importScripts("Color.html");

(function () {
	var config = {};
	var fileIsWritten = {};
	var fs = new FileSystem(PERSISTENT);
	var fsData = false;
	var controller = new WorkerController(this);
	controller
//		.registerCommand(function (data, message) {
//			console.log(message.id, message.command, data);
//		})

		.registerCommand("set", function (data, message) {
			for (var n in data) {
				config[n] = data[n];
				if (n === 'imgPath') {
					fs.getDirectory(data[n], true)
						.then(function (_fsData) {
							fsData = _fsData;
						});
				}
			}
			return true;
		})
		.registerCommand("preload", function (_map, message) {
			return new Promise(function (_resolve, _reject) {
				if (_map === undefined || _map.tiles === undefined) {
					return _reject("preload tiles missing");
				}

				var p;
				if (fsData) {
					p = Promise.resolve(fsData);
				} else {
					p = fs.getDirectory(config['imgPath'], true)
						.then(function (_fsData) {
							fsData = _fsData;
							return Promise.resolve(fsData);
						});
				}

				p.then(function (_fsData) {
//					console.log("fsData", fsData, _fsData);
					var requests = [];
					for (var c in _map.tiles) {
						(function (c) {
							var tiles = _map.tiles[c];
							var file = tiles.file;
							var filepath = config['imgPath'] + '/' + file;
							if (fileIsWritten[tiles.file] >= tiles.date)
								return;

							var p = fsData
								.getFile(file, true)
								.then(function (_fileObj) {
									var meta = _fileObj.meta;
									if (meta.size > 0 && new Date(meta.modificationTime).getTime() / 1000 >= tiles.date || fileIsWritten[tiles.file] >= tiles.date) {
										return Promise.resolve(_fileObj.name);
									}

									fileIsWritten[tiles.file] = tiles.date;
									return XHR.get(filepath, {responseType: 'arraybuffer'})
										.then(function (_data) {
											return _fileObj.write(new Blob([_data], {type: "image/png"}));
										}, (e) => {
											_reject(e);
										})
										.then(function (e) {
											return Promise.resolve(_fileObj);
										}, (e) => {
											_reject(e);
										});
								}, function (e) {
									if (e instanceof Error) {
										console.log(e.stack);
									} else {
										console.log(e);
									}
								})
								.then(function (fileName) {
									return Promise.resolve();
									// get Image Data
//							return controller
//								.post("getImageData", config['imgPath'] + '/' + fileName, message.port)
//								.then(function (data) {
//									fileData[fileName] = data;
//									return Promise.resolve(true);
//								});
								}, (e) => {
									_reject(e);
								});
							requests.push(p);
						})(c);
					}
					Promise
						.all(requests)
						.then(function (_results) {
							var results = Array.isArray(_results) ? _results : [_results];
							for (var i = 0; i < results.length; i++) {
								if (results[i] === undefined) {
									results.splice(i--, 1);
								}
							}
							var result = results.length === 0 ? true : results.length === 1 ? results.shift() : results;
							_resolve(result);
						}, _reject);
				});
			});

			console.log(controller.post);

		})
		.registerCommand("compareImageData", function (data) {
			return new Promise(function (_resolve) {
				var d1 = new Uint32Array(data.d1);
				var d2 = new Uint32Array(data.d2);
				var d = 0, l = d1.length;
				var tmp;
				for (var i = 0; i < l; i++) {
					var c1 = new Color([(tmp = d1[i]) & 0x000000ff, tmp & 0x0000ff00 >> 8, tmp & 0x00ff0000 >> 16, tmp & 0xff000000 >> 24]);
					var c2 = new Color([(tmp = d2[i]) & 0x000000ff, tmp & 0x0000ff00 >> 8, tmp & 0x00ff0000 >> 16, tmp & 0xff000000 >> 24]);
					d += c1.compareWith(c2);
				}
				return _resolve(d / l);
			});
		});

//this.addEventListener("error", function (e) {
//	console.log("error", e);
//	this.postMessage("error");
//});
	this.addEventListener("online", this.online = function (e) {
		console.log("online", e);
//		this.postMessage("online");
	});
	this.addEventListener("offline", this.onoffline = function (e) {
		console.log("offline", e);
//		this.postMessage("offline");
	});

}).call(this);