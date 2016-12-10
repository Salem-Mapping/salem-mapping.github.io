/**
 * Map Viewer
 *	Optimiert für Salem
 *	
 * @param {type} _input
 * @param {type} _init
 * @returns {undefined}
 */
function MapViewer(_input, _init) {
	/*
	 * SET INPUT VALUES
	 */
	var _MV = this;
	var $win = typeof (window) === "undefined" ? false : $(window);
	var config = _MV.config = _input;
	var init = _MV.init = $win === false ? false : _init === undefined ? true : _init;
	var size = config.size;
	var appName = config.appName;

	/*
	 * ZERO VALUES
	 */
	var storage = false;
	var slider = false, center = false, progress = false;
	var canvas = config.canvas, c2d = false;
	var mapFolder = false;
	var winW = 0, winH = 0, cX = 0, cY = 0, sX = 0, sY = 0;
	var imgs = {}, currentMap = {};
	var scale = 0, cScale = 1;
	var d = {
		t: 0,
		r: 0,
		b: 0,
		l: 0,
		cX: 0,
		cY: 0
	};

	/*
	 * INIT
	 */
	var storage = localStorage;
	if ($win) {
		slider = config.touch ? false : $(".slider").slider({
			orientation: "vertical",
			min: -10,
			max: 15
		});
		center = $(".centerBarInner");
		c2d = canvas[0].getContext('2d');
	}
	_MV.fileSystem = new FileSystem(PERSISTENT, ((q = storage.getItem(appName + '_quota')) === null ? config.defaultQuota : parseInt(q)));
	// init local file System

	// Background Process
	/*
	 * / if (Worker) { var worker = new SharedWorker('worker.js'); worker.port.addEventListener('message', function(e) { var data = e.data; var cmd = !data.cmd ? '---' : data.cmd; switch (data.cmd) {
	 * case "requestFileSystem": // init worker.port.postMessage({ 'cmd' : 'initFileSystem', 'askQuota' : askQuota, 'directory' : directory }); break;
	 *
	 * case "---": default: console.log('Worker said: ', e.data); } }, false); worker.port.start(); } //
	 */

	var isChangeHash = false;
	// calculate
	var calcPos = function (refreshHash) {
		d.t = Math.round(((-winH / 2) / cScale - cY) / size) - 1;
		d.r = Math.round(((winW / 2) / cScale - cX) / size) + 1;
		d.b = Math.round(((winH / 2) / cScale - cY) / size) + 1;
		d.l = Math.round(((-winW / 2) / cScale - cX) / size) - 1;
		d.cX = Math.round((cX / cScale) / size) - 1;
		d.cY = Math.round((cY / cScale) / size) - 1;
		if (refreshHash) {
			isChangeHash = true;
			location.hash = cX + ":" + cY + ":" + scale;
		}
	};
	var checkHash = function () {
		if (isChangeHash) {
			isChangeHash = false;
			return;
		}
		var r = /^[#]([-0-9]+)[:]([-0-9]+)[:]([-0-9]+)$/.exec(location.hash);
		if ($.isArray(r)) {
			cX = parseInt(r[1]);
			cY = parseInt(r[2]);
			scale = parseInt(r[3]);
			if (slider)
				slider.slider("value", scale);
			cScale = Math.pow(1 - config.scaleStep, scale);
			calcPos(false);
		}
	};
	window.addEventListener("hashchange", checkHash, false);
	checkHash();
	// resize
	var resizeWindow = function (e) {
		winW = window.innerWidth;
		winH = window.innerHeight;
		canvas.attr("width", winW).attr("height", winH);
		c2d.translate(winW / 2, winH / 2);
		calcPos(false);
		if (build !== undefined) {
			build();
		}
	};

	/***************************************************************************************************************************************************************************************************
	 * BUILD
	 **************************************************************************************************************************************************************************************************/
	var isBuilding = false;
	var build = function (newMap) {
		// if (!folder) return;
		if (isBuilding) {
			requestAnimationFrame(animateMove);
			return;
		}

		currentMap = newMap !== undefined ? newMap : currentMap;
		c2d.clearRect(-winW / 2, -winH / 2, winW, winH);
		for (var y = d.t; y < d.b; y++) {
			for (var x = d.l; x < d.r; x++) {

				var key = x + "_" + y;
				if (key in currentMap) {
					(function (key, tile) {
						if (key in imgs) {
							drawImg(imgs[key]);
						} else {
							if (mapFolder) {
								mapFolder.getFile(tile.file, {
									create: false
								}, function (fileEntry) {
									fileEntry.getMetadata(function (meta) {
										if (meta.size === 0 || meta.modificationTime < new Date(tile.date * 1000)) {
											loadImage(config.imgPath + '/' + tile.file, tile);
										}
									});
									loadImage(fileEntry.toURL(), tile);
								}, function (e) {
									loadImage(config.imgPath + '/' + tile.file, tile);
								});
							} else {
								loadImage(config.imgPath + '/' + tile.file, tile);
							}
						}
					})(key, currentMap[key]);
				}
			}
		}

		$.each(imgs, function (key, img) {
			if (img.posY < d.t || img.posY > d.b || img.posX < d.l || img.posX > d.r) {
				delete imgs[key];
			}
		});
		if (!(sX < d.l || d.r < sX || sY < d.t || d.b < sY)) {
			c2d.strokeStyle = config.targetTileColor;
			c2d.beginPath();
			c2d.rect((cX + sX * size) * cScale, (cY + sY * size) * cScale, size * cScale, size * cScale);
			c2d.stroke();
		}

		isBuilding = false;
	};
	var loadImage = function (url, options) {
		var img = new Image();
		$.extend(img, options);
		img.onload = imgLoaded;
		img.src = url;
		imgs[options.posX + "_" + options.posY] = img;
	};
	var drawImg = function (img) {
		var x = (cX + img.posX * img.width) * cScale;
		var y = (cY + img.posY * img.height) * cScale;
		if (x + img.width * cScale >= -winW / 2 || y + img.height * cScale >= -winH / 2 || x <= winW / 2 || y <= winH / 2) {
			c2d.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * cScale, img.height * cScale);
		}
	};
	var markPos = function (pX, pY) {
		storage.setItem(appName + '_currentPositionX', sX = pX);
		storage.setItem(appName + '_currentPositionY', sY = pY);
		build();
	};
	var tryToWriteFiles = [];
	var imgLoaded = function (e) {
		// var tar = e.target;
		// var r = config.regNameMap.exec(tar.src);
		// var cvs = document.createElement('canvas');
		// cvs.setAttribute('width', tar.width);
		// cvs.setAttribute('height', tar.height);
		// cvs.getContext('2d').drawImage(tar, 0, 0, tar.width, tar.height, 0, 0, tar.width, tar.height);
		// imgs[r[0]] = cvs;

		// var cvs = imgLoaded(e);
		// var img =  imgs[r[0]] ;

		var img = e.target;
		if (img.src.substr(0, 11) !== "filesystem:") {
			if (tryToWriteFiles.indexOf(img.src) === -1) {
				tryToWriteFiles.push(img.src);
				saveImage(img);
			}
		}

		drawImg(img);
		if (sX === img.posX && sY === img.posY) {
			c2d.strokeStyle = config.targetTileColor;
			c2d.beginPath();
			c2d.rect((cX + sX * img.width) * cScale, (cY + sY * img.height) * cScale, img.width * cScale, img.height * cScale);
			c2d.stroke();
		}
	};

	// reload
	var reload = function () {
		if ($win) {
			center.append('<div class="progress" />');
			progress = $(".progress").css({
				width: 400
			}).progressbar({
				value: false
			});
		}

		var storedJSON = storage.getItem(appName + '_maps');
		var storedData = storedJSON === null ? null : JSON.parse(storedJSON);
		var processMaps = function (data, textStatus, jqXHR) {
			var askQuota = data.maxsize !== undefined ? data.maxsize : ((q = storage.getItem(appName + '_quota')) === null ? config.defaultQuota : parseInt(q));
			storage.setItem(appName + '_quota', askQuota);
			_MV.fileSystem.requestQuota(askQuota).then(function (_fileSystem, _grantedBytes) {
				_fileSystem.getDirectory("/" + config.appName).then(function (_fileSystem, _directory) {
					mapFolder = _directory;
					build(data.maps[0]);
					progress.remove();
				});
			});
		};
		var loadFromLive = function (data, textStatus, jqXHR) {
			switch (jqXHR.status) {
				case 200:
					data.modified = jqXHR.getResponseHeader('Date');
					storage.setItem(appName + '_maps', JSON.stringify(data));
					processMaps(data, textStatus, jqXHR);
					break;

				default :
					if (storedData !== null && storedData !== false) {
						processMaps(storedData, textStatus, jqXHR);
					}
			}
		};
		var loadFromCache = function (jqXHR, textStatus, errorThrown) {
			console.log("errorThrown", errorThrown);
			if (storedData !== null && storedData !== false) {
				processMaps(storedData, textStatus, jqXHR);
			}
		};

		var headers = {};
		if (storedData !== null)
			headers["If-Modified-Since"] = storedData.modified;
		$.ajax({dataType: "json",
			url: location.href,
			ifModified: true,
			headers: headers,
			data: {
				a: 'load'
			}
		}).then(loadFromLive, loadFromCache);
	};

	var saveImage = function (img) {
		if (mapFolder) {
			mapFolder.getFile(
				img.file,
				{create: true},
			function (fileEntry) {
				fileEntry.createWriter(function (writer) {
					writer.onwriteend = function (e) {
						console.log("Write completed.", fileEntry.fullPath);
					};
					writer.onerror = function (e) {
						console.log("Write error: ", fileEntry.fullPath, e);
					};
					var cvs = document.createElement('canvas');
					cvs.setAttribute('width', img.width);
					cvs.setAttribute('height', img.height);
					cvs.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
					writer.write(dataURItoBlob(cvs.toDataURL()));
				});
			}, fsError);
		}
	};
	/***************************************************************************************************************************************************************************************************
	 * INTERACT
	 **************************************************************************************************************************************************************************************************/

	if ($win) {
		$win.resize(resizeWindow);
		resizeWindow();

		var allowPointerMove = false;
		var allowPointerZoom = false;
		var pointerCount = 2;
		var inAnimation = false;
		var pointers = new Pointers();
		var animateMove = function () {
			inAnimation = true;
			var p = pointers[0];
			if (p.diffX() !== 0 || p.diffY() !== 0) {
				cX = cX + Math.round(p.diffX() / cScale);
				cY = cY + Math.round(p.diffY() / cScale);
				p.clearDiff();
				calcPos(false);
				build();
			}
			if (allowPointerMove) {
				requestAnimationFrame(animateMove);
			} else {
				inAnimation = false;
			}
		};
		// MOVE
		canvas.bind("mousemove", function (e) {
			pointers.importMouse(e.originalEvent);
			if (allowPointerMove && !inAnimation) {
				requestAnimationFrame(animateMove);
			}
			return false;
		});
		canvas.bind("touchmove", function (e) {
			pointers.importTouches(e.originalEvent.touches);
			switch (pointers.length) {
				case 1:
					if (allowPointerMove && !inAnimation) {
						requestAnimationFrame(animateMove);
					}
					return false;
				case 2:
					allowPointerZoom = true;
					break;
				default:
			}
		});
		// START
		canvas.bind("mousedown", function (e) {
			pointers.importMouse(e, true).clearDiff();
			switch (e.button) {
				default:
					break;
				case 0:
					allowPointerMove = true;
			}
			return false;
		});
		canvas.bind("touchstart", function (e) {
			var evt = e.originalEvent;
			var touches = evt.touches;
			pointers.importTouches(touches);
			switch (pointerCount = touches.length) {
				case 1:
					allowPointerMove = true;
					return false;
				case 2:
					allowPointerZoom = true;
					break;
				default:
			}
		});
		// END
		var endMove = function (e) {
			var p = pointers[0];
			if (p.isClick()) {
				markPos(Math.round(((p.mX - winW / 2) / cScale - cX - size / 2) / size), Math.round(((p.mY - winH / 2) / cScale - cY - size / 2) / size));
			} else if (allowPointerMove) {
				cX = cX + Math.round((p.diffX()) / cScale);
				cY = cY + Math.round((p.diffY()) / cScale);
				calcPos(true);
			} else {

			}
			allowPointerMove = false;
//				p.clearDiff();
			return false;
		}
		;
		$win.bind("touchend", function (e) {
			pointers.importTouches(e.originalEvent.touches);
			switch (pointerCount) {
				case 1:
					return endMove(e);
				case 2:
					return false;
				default:
			}
		});
		$win.bind("mouseup", function (e) {
			pointers.importMouse(e);
			switch (e.button) {
				default:
					break;
				case 0:
					return endMove(e);
				case 1:
					scale = 0;
					if (slider)
						slider.slider("value", scale);
					cScale = Math.pow(1 - config.scaleStep, scale);
					calcPos(true) && build();
					return false;
			}
			return true;
		});
		var kd = [];
		var keyPress = true;
		var kX = 0, kY = 0, factor = config.keyMovementFactor;
		$win.keydown(
			function (e) {
				keyPress = (kd[e.keyCode] === undefined);
				kd[e.keyCode] = (new Date).getMicrotime();
				cY = cY + (kY = e.keyCode === 38 ? 1 : e.keyCode === 40 ? -1 : 0) * (e.shiftKey ? 1 : factor);
				cX = cX + (kX = e.keyCode === 37 ? 1 : e.keyCode === 39 ? -1 : 0) * (e.shiftKey ? 1 : factor);
				if (!allowPointerMove && kX + kY !== 0) {
					calcPos(true);
					build();
				}
			});
		$win.keyup(function (e) {
			var delta = 0;
			switch (e.keyCode) {
				case 38: // OBEN
				case 40: // UNTEN
					//cY = cY + (keyPress ? kY * size - kY : 0);
					break;
				case 39: // LINKS
				case 37: // RECHTS
					//cX = cX + (keyPress ? kX * size - kX: 0);
					break;
				case 107: // +
					delta = -1;
					break;
				case 109:// -
					delta = 1;
					break;
				case 13:
				case 10: // ENTER
					if (e.ctrlKey) {
						if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
							if (document.documentElement.requestFullscreen) {
								document.documentElement.requestFullscreen();
							} else if (document.documentElement.mozRequestFullScreen) {
								document.documentElement.mozRequestFullScreen();
							} else if (document.documentElement.webkitRequestFullscreen) {
								document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
							}
						} else {
							if (document.cancelFullScreen) {
								document.cancelFullScreen();
							} else if (document.mozCancelFullScreen) {
								document.mozCancelFullScreen();
							} else if (document.webkitCancelFullScreen) {
								document.webkitCancelFullScreen();
							}
						}
					}
					break;
				case 46: // DEL
					var del = confirm('Kachel löschen?');
					if (del) {
						$.getJSON(location.href, {
							'a': 'del',
							'x': sX,
							'y': sY
						}, function (data) {
							reload();
						});
					}
					break;
				default:
					console.log("unknown key: " + e.keyCode);
					return true;
			}

			if (delta !== 0) {
				scale += delta;
				if (slider)
					slider.slider("value", scale);
				cScale = Math.pow(1 - config.scaleStep, scale);
			}
			calcPos(true);
			build();
			delete (kd[e.keyCode]);
		});
		canvas.bind("mousewheel", function (e) {
			var e = window.event || e;
			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			scale -= delta;
			if (slider)
				slider.slider("value", scale);
			cScale = Math.pow(1 - config.scaleStep, scale);
			calcPos(true);
			build();
		});
		if (slider) {
			slider.on("slidechange", function (e, ui) {
				scale = ui.value;
				cScale = Math.pow(1 - config.scaleStep, scale);
				calcPos(true);
				build();
			});
		}

		canvas.on("contextmenu", function (e) {
//		if (e.shiftKey)
			return true;
			var menu = [{
					name: 'create',
					//img: 'images/create.png',
					title: 'create button',
					fun: function () {
						alert('i am add button');
					}
				}, {
					name: 'update',
					//img: 'images/update.png',
					title: 'update button',
					fun: function () {
						alert('i am update button');
					}
				}, {
					name: 'delete',
					//img: 'images/delete.png',
					title: 'delete button',
					fun: function () {
						alert('i am delete button');
					}
				}];
			$(e.target).contextMenu(menu);
			return false;
		});
	}

// action
	if (storage.getItem(appName + '_currentPositionX') !== null && storage.getItem(appName + '_currentPositionY') !== null) {
		sX = storage.getItem(appName + '_currentPositionX');
		sY = storage.getItem(appName + '_currentPositionY');
	}

	if (init) {
		reload();

//		var worker = new Worker('worker.js');
//		worker.onmessage = function (e) {
////			console.log("e", e);
//			var urls = e.data.entries;
//			urls.forEach(function (url, i) {
//				window.resolveLocalFileSystemURL(url, function (fileEntry) {
////					console.log(fileEntry.name); // Print out file's name.
//				});
//			});
//		};
//		worker.postMessage({'cmd': 'list'});
	}

	/***************************************************************************************************************************************************************************************************
	 * UPLOAD
	 **************************************************************************************************************************************************************************************************/

	/**
	 *
	 * @param {type} e
	 * @returns {undefined}
	 */
	function noopHandler(e) {
		if (!e.target.draggable)
			e.target.draggable = true;
		e.stopPropagation();
		e.preventDefault();
	}

	if ($win) {
		canvas.bind("dragenter", noopHandler);
		canvas.bind("dragover", function (e) {
			noopHandler(e);
			canvas.addClass("dropover");
		});
		canvas.bind("dragleave", function (e) {
			noopHandler(e);
			canvas.removeClass("dropover");
		});
		canvas.bind("drop", function (e) {
			noopHandler(e);
			// canvas.css({
			// cursor : 'wait'
			// });
			canvas.removeClass("dropover");
			switch (true) {
				case (!!e.originalEvent && !!e.originalEvent.dataTransfer && !!e.originalEvent.dataTransfer.files):
					files = e.originalEvent.dataTransfer.files;
					break;
				case (!!e.target.files):
					files = e.target.files;
					break;
				case (!!e.dataTransfer && !!e.dataTransfer.files):
					files = e.dataTransfer.files;
					break;
				default:
					var files = false;
			}

			if (!files)
				return false;
			var fileCount = 0;
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				var r = config.regNameMap.exec(file['name']);
				if (!r)
					continue;
				// UPLOAD
				(function (i, file, r, sX, sY) {
					/*
					 * get DataURL
					 */
//				var reader = new FileReader();
//				reader.readAsArrayBuffer(file);
//				(function (currentFile) {
//					console.log("currentFile", currentFile);
//					reader.onload = function (e) {
//						console.log("result", reader.result.byteLength, reader.result);
//						var data = new Uint8Array(reader.result);
//						console.log("data", data);
//						crypto.subtle.digest({name: "SHA-256"}, data).then(function (hash) {
//							console.log("hash", hash);
//						}).catch(function (x, y, z) {
//							console.log("error", x, y, z);
//						});
//					};
//				}(file));

					/*
					 * Upload
					 */

					// *
					if (files.length > 9) {
						var formData = new FormData();
						formData.append('a', 'upload');
						formData.append('x', sX + parseInt(r[1]));
						formData.append('y', sY + parseInt(r[2]));
						formData.append(i, file);
						$.ajax({
							url: location.href,
							type: 'POST',
							data: formData,
							cache: false,
							contentType: false,
							processData: false,
							dataType: "json",
							async: true,
							success: function (data) { //
								if (++fileCount >= files.length) {
									canvas.css({
										cursor: ''
									});
									reload();
								}
							}
						});
					}
					// */

				})(i, file, r, sX, sY);
			}
		});
	}

}
