/*******************************************************************************************************************************************************************************************************
 * CONFIG
 ******************************************************************************************************************************************************************************************************/

var config = {
	appName : 'salem_map',
	imgPath : 'data',
	size : 100,
	scaleStep : 0.2,
	imgLoadMax : 5,
	keyMovementFactor: 10,
	targetTileColor: '#FFF'
};

/*******************************************************************************************************************************************************************************************************
 * SCRIPT
 ******************************************************************************************************************************************************************************************************/

var canvas = false, c2d = false;
var fileSystem = false;
var folder = false;
var winW = 0, winH = 0, cX = 0, cY = 0, sX = 0, sY = 0;
var imgs = {}, map = {};
var scale = 0, cScale = 1;
var d = { 
	t : 0,
	r : 0,
	b : 0,
	l : 0,
	cX : 0,
	cY : 0
};
$(function() {
	var appName = config.appName;
	canvas = $("#map");
	var slider = $(".slider").slider({
		orientation : "vertical",
		min : -10,
		max : 15
	});
	var center = $(".centerBarInner");
	c2d = canvas[0].getContext('2d')
	var size = config.size;
	var pb = false;
	
	var storage = window.localStorage;
	if (typeof(Dropbox) != "undefined")  {
		var dropbox = new Dropbox.Client({
			key : 'cog274db738jxvc'
		});
	}
	
	// init local file System
	var directory = config.appName;
	var askQuota = 0;
	if (storage.getItem(appName + '_askQuota') == null)
		askQuota = 5 * 1024 * 1024;
	else
		askQuota = storage.getItem(appName + '_askQuota')
	var fsQuota = function(e) {
		console.log('Error', e);
	}
	var fsError = function(e) {
		console.log("fsError");
		var msg = '';
		switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
			msg = 'QUOTA_EXCEEDED_ERR';
			break;
		case FileError.NOT_FOUND_ERR:
			msg = 'NOT_FOUND_ERR';
			break;
		case FileError.SECURITY_ERR:
			msg = 'SECURITY_ERR';
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			msg = 'INVALID_MODIFICATION_ERR';
			break;
		case FileError.INVALID_STATE_ERR:
			msg = 'INVALID_STATE_ERR';
			break;
		default:
			msg = 'Unknown Error: ' + e.code;
		}
		;
		console.log('Error: ' + msg);
	};
	console.log("requestQuota: " + askQuota);
	
	initFileSystem = function(askQuota) {
		if (!fileSystem && navigator.persistentStorage) {
			navigator.persistentStorage.requestQuota(askQuota, function(grantedBytes) {
				console.log("grantedBytes: " + grantedBytes);
				window.requestFileSystem(PERSISTENT, grantedBytes, function(fs) {
					console.log("requestFileSystem: success");
					fileSystem = fs;
					fileSystem.root.getDirectory(config.appName, {
						create : true
					}, function(dirEntry) {
						folder = dirEntry;
					}, fsError);
				}, fsError);
			}, fsQuota);
		}
		return fileSystem;
	}
	initFileSystem();
	
	// Background Process
	/*
	 * / if (Worker) { var worker = new SharedWorker('worker.js'); worker.port.addEventListener('message', function(e) { var data = e.data; var cmd = !data.cmd ? '---' : data.cmd; switch (data.cmd) {
	 * case "requestFileSystem": // init worker.port.postMessage({ 'cmd' : 'initFileSystem', 'askQuota' : askQuota, 'directory' : directory }); break;
	 * 
	 * case "---": default: console.log('Worker said: ', e.data); } }, false); worker.port.start(); } //
	 */

	isChangeHash = false;
	// calculate
	var calcPos = function(refreshHash) {
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
	}
	var checkHash = function() {
		if (isChangeHash) {
			isChangeHash = false;
			return;
		}
		var r = /^[#]([-0-9]+)[:]([-0-9]+)[:]([-0-9]+)$/.exec(location.hash);
		if ($.isArray(r)) {
			cX = parseInt(r[1]);
			cY = parseInt(r[2]);
			scale = parseInt(r[3]);
			slider.slider("value", scale);
			cScale = Math.pow(1 - config.scaleStep, scale);
			calcPos(false);
		}
	}

	window.addEventListener("hashchange", checkHash, false);
	checkHash();
	
	// resize
	var resizeWindow = function(e) {
		winW = window.innerWidth;
		winH = window.innerHeight;
		canvas.attr("width", winW).attr("height", winH);
		c2d.translate(winW / 2, winH / 2);
		calcPos(false);
		if (typeof (build) != "undefined")
			build();
	};
	$(window).resize(resizeWindow);
	resizeWindow();
	
	/***************************************************************************************************************************************************************************************************
	 * BUILD
	 **************************************************************************************************************************************************************************************************/
	var isBuilding = false;
	var build = function(newMap) {
		// if (!folder) return;
		if (isBuilding) {
			requestAnimFrame(function() {
				animateMove();
			});
			return;
		}
		if (typeof (newMap) != "undefined")
			map = newMap;
		c2d.clearRect(-winW / 2, -winH / 2, winW, winH);
		
		for (y = d.t; y < d.b;  y++) { 
			for (x = d.l; x < d.r; x++) { 
			
				var key = x+"_"+y;
				if ( key in map) {
					(function(key, tile) {
						if (key in imgs) {
							drawImg(imgs[key]);
						} else  {
							if (folder) {
								folder.getFile(tile.file, {
									create : false
								}, function(fileEntry) {
									fileEntry.getMetadata(function(meta) {
										if (meta.size == 0) {
											loadImage (config.imgPath + '/' +  tile.file, tile);
										}
										// TODO: check if new
										// console.log(meta);
									});
									
									loadImage(fileEntry.toURL(), tile);
								}, function (e) {
									loadImage (config.imgPath + '/' +  tile.file, tile);
								});
							} else {
								loadImage(config.imgPath + '/' +  tile.file, tile);
							}
						}
					})(key, map[key]);
				}
			}
		}
		
		$.each(imgs, function(key, img) {
			if (img.posY < d.t ||  img.posY > d.b || img.posX < d.l ||  img.posX > d.r) {
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
	}
	
	var loadImage = function(url, options) {
		img = new Image();
		jQuery.extend(img, options);
		img.onload = imgLoaded;
		img.src = url;
		imgs[options.posX+"_"+options.posY] = img;
	}
	var drawImg = function(img) {
		var x = (cX + img.posX *  img.width) * cScale;
		var y = (cY + img.posY *  img.height) * cScale;
		if (x + img.width * cScale >= -winW / 2 || y + img.height * cScale >= -winH / 2 || x <= winW / 2 || y <= winH / 2)  {
			c2d.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * cScale, img.height * cScale);
		}
	}
	
	var markPos = function(pX, pY) {
		storage.setItem(appName + '_currentPositionX', sX = pX);
		storage.setItem(appName + '_currentPositionY', sY = pY);
		build();
	}
	var imgLoaded = function(e) {
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
		if (img.src.substr(0, 11)  != "filesystem:") {
			saveImage(img);
		}
		
		drawImg(img);
		
		if (sX == img.posX && sY == img.posY) {
			c2d.strokeStyle = config.targetTileColor;
			c2d.beginPath();
			c2d.rect((cX + sX * img.width) * cScale, (cY + sY * img.height) * cScale, img.width * cScale, img.height * cScale);
			c2d.stroke();
		}
	}
	// reload
	var reload = function() {
		center.append('<div class="progress" />');
		var p = $(".progress").css({
			width : 400
		}).progressbar({
			value : false
		});
		$.getJSON(location.href, {
			a : 'load'
		}, function(data, textStatus) {
			initFileSystem();
			build(data.map);
			p.remove();
			
		});
	}

	var saveImage = function(img) {
		var cvs = document.createElement('canvas');
		cvs.setAttribute('width', img.width);
		cvs.setAttribute('height', img.height);
		cvs.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
		var dataURL = cvs.toDataURL();
		var blob = dataURItoBlob(dataURL);
		folder.getFile(
			img.file,
			{ create: true },
			function(fileEntry) {
				fileEntry.createWriter(function(writer) {
					writer.onwriteend = function(e) {
						console.log("Write successfully: " + img.file);
					};
					writer.onerror = function(e) {
						console.log("Write error!")
					}; 
					writer.write(blob);
				});
			}
		);
	}
	
	/***************************************************************************************************************************************************************************************************
	 * INTERACT
	 **************************************************************************************************************************************************************************************************/
	var allowMouseMove = false;
	var isAnimated = false;
	var tX = 0, tY = 0, mX = 0, mY = 0, md = false;
	var animateMove = function() {
		isAnimated = true;
		if (mX - tX != 0 || mX - tX != 0) {
			cX = cX + Math.round((mX - tX) / cScale);
			cY = cY + Math.round((mY - tY) / cScale);
			tX = mX;
			tY = mY;
			calcPos(false);
			build();
		}
		if (allowMouseMove)
			requestAnimFrame(function() {
				animateMove();
			});
		else
			isAnimated = false;
	}

	canvas.mousemove(function(e) {
		mX = e.clientX;
		mY = e.clientY;
		if (allowMouseMove && !isAnimated)
			requestAnimFrame(function() {
				animateMove();
			});
	});
	
	canvas.mousedown(function(e) {
		md = [ (new Date).getMicrotime(), mX, mY ];
		switch (e.button) {
		default:
			break;
		case 0:
			tX = mX;
			tY = mY;
			if (e.shiftKey) {
				
			} else {
				allowMouseMove = true;	
			}
		}
	});
	
	$(window).mouseup(function(e) {
		var isClick = ((mX - md[1]) == 0 && (mY - md[2]) == 0 && ((new Date).getMicrotime() - md[0]) <= 250);
		switch (e.button) {
		default:
			break;
		case 0:
			if (isClick) {
				markPos(Math.round(((mX - winW / 2) / cScale - cX - size / 2) / size), Math.round(((mY - winH / 2) / cScale - cY - size / 2) / size));
			} else if (allowMouseMove) {
				cX = cX + Math.round((mX - tX) / cScale);
				cY = cY + Math.round((mY - tY) / cScale);
				calcPos(true);
			} else {
				
			}
			allowMouseMove = false;
			(tX = mX) && (tY = mY);
			break;
		case 1:
			scale = 0;
			slider.slider("value", scale);
			cScale = Math.pow(1 - config.scaleStep, scale);
			calcPos(true) && build();
		}
	});
	
	var kd = [];
	var keyPress = true;
	var kX = 0, kY = 0, factor = config.keyMovementFactor;
	$(window).keydown(
			function(e) {
				keyPress = (typeof (kd[e.keyCode]) == "undefined");
				kd[e.keyCode] = (new Date).getMicrotime();
				cY = cY + (kY = e.keyCode == 38 ? 1 : e.keyCode == 40 ? -1 : 0)  * (e.shiftKey ? 1 : factor);
				cX = cX + (kX = e.keyCode == 37 ? 1 : e.keyCode == 39 ? -1 : 0) * (e.shiftKey ? 1 : factor);
				if (!allowMouseMove && kX + kY != 0) {
					calcPos(true); build();
				}
			});
	
	$(window).keyup(function(e) {
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
					'a' : 'del',
					'x' : sX,
					'y' : sY
				}, function(data) {
					reload();
				});
			}
			break;
		
		default:
			console.log("unknown key: " + e.keyCode);
			return true;
		}
		
		if (delta != 0) {
			scale += delta;
			slider.slider("value", scale);
			cScale = Math.pow(1 - config.scaleStep, scale);
		}
		calcPos(true);
		build();
		delete (kd[e.keyCode]);
	});
	
	canvas.bind("mousewheel", function(e) {
		var e = window.event || e;
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		scale -= delta;
		slider.slider("value", scale);
		cScale = Math.pow(1 - config.scaleStep, scale);
		calcPos(true);
		build();
	});
	slider.on("slidechange", function(e, ui) {
		scale = ui.value;
		cScale = Math.pow(1 - config.scaleStep, scale);
		calcPos(true);
		build();
	});
	
	canvas.on("contextmenu", function(e) {
		if (e.shiftKey)
			return true;
		
		var menu = [{
			name: 'create',
			img: 'images/create.png',
			title: 'create button',
			fun: function () {
				alert('i am add button')
			}
		}, {
			name: 'update',
			img: 'images/update.png',
			title: 'update button',
			fun: function () {
				alert('i am update button')
			}
		}, {
			name: 'delete',
			img: 'images/delete.png',
			title: 'create button',
			fun: function () {
				alert('i am add button')
			}
		}];
 
		$(e.target).contextMenu(menu);
		
		return false;
	});
	
	// action
	if (storage.getItem(appName + '_currentPositionX') != null && storage.getItem(appName + '_currentPositionY') != null) {
		sX = storage.getItem(appName + '_currentPositionX');
		sY = storage.getItem(appName + '_currentPositionY');
	}
	
	reload();
	// worker.postMessage({});
	
	/***************************************************************************************************************************************************************************************************
	 * UPLOAD
	 **************************************************************************************************************************************************************************************************/
	function noopHandler(e) {
		if (!e.target.draggable)
			e.target.draggable = true;
		e.stopPropagation();
		e.preventDefault();
	}
	canvas.bind("dragenter", noopHandler);
	canvas.bind("dragover", function(e) {
		noopHandler(e);
		canvas.addClass("dropover");
	});
	canvas.bind("dragleave", function(e) {
		noopHandler(e);
		canvas.removeClass("dropover");
	});
	canvas.bind("drop", function(e) {
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
		
		var uploads = [];
		var fileCount = 0;
		for ( var i = 0; i < files.length; i++) {
			var file = files[i];
			var r = config.regNameMap.exec(file['name']);
			if (!r)
				continue;
			
			// UPLOAD
			(function(i, file, r, sX, sY) {
				
				/*
				 * get DataURL
				 */
				var reader = new FileReader();
				reader.readAsDataURL(file);
				(function(currentFile) {
					reader.onload = function(e) {
						var dUrl = e.target.result;
						var hash = hex_sha1(dUrl);
					};
				}(file));
				var reader = new FileReader();
				reader.readAsDataURL(file);
				(function(currentFile) {
					reader.onload = function(e) {
						var dUrl = e.target.result;
						var hash = hex_sha1(dUrl);
					};
				}(file));
				
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
						url : location.href,
						type : 'POST',
						data : formData,
						cache : false,
						contentType : false,
						processData : false,
						dataType : "json",
						async : true,
						success : function(data) { //
							if (++fileCount >= files.length) {
								canvas.css({
									cursor : ''
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
});

/***************************************************************************************************************************************************************************************************
 * BROWSER DIFFERENCES
 **************************************************************************************************************************************************************************************************/
if (!navigator.persistentStorage) {
	navigator.persistentStorage = {
		requestQuota : function(askQuota, callback) {
			if (typeof (navigator.webkitPersistentStorage) != "undefined" && typeof (navigator.webkitPersistentStorage.requestQuota) != "undefined") {
				return navigator.webkitPersistentStorage.requestQuota(askQuota, callback);
			} else if (typeof (window.webkitStorageInfo) != "undefined" && typeof (window.webkitStorageInfo.requestQuota) != "undefined") {
				return window.webkitStorageInfo.requestQuota(PERSISTENT, askQuota, callback);
			}
		}
	};
}
if (!navigator.temporaryStorage) {
	navigator.temporaryStorage = {
		requestQuota : function(askQuota, callback) {
			if (typeof (navigator.webkitTemporaryStorage) != "undefined") {
				return navigator.webkitPersistentStorage.requestQuota(askQuota, callback);
			} else if (typeof (window.webkitStorageInfo) != "undefined") {
				return window.webkitStorageInfo.requestQuota(TEMPORARY, askQuota, callback);
			}
		}
	};
}

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame
			|| function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
})();

Date.prototype.getMicrotime = function() {
	return this.getTime() + this.getMilliseconds() / 1000;
}

var dataURItoBlob  = function(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
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
  }