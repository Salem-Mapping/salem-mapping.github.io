window.Pointers = (function () {
	function Pointers(xyz) {
		var pointers = Object.create(Array.prototype);
		pointers = (Array.apply(pointers, arguments) || pointers);
		Pointers.injectClassMethods(pointers);
		return(pointers);
	}

	Pointers.injectClassMethods = function (pointers) {
		for (var method in Pointers.prototype) {
			if (Pointers.prototype.hasOwnProperty(method)) {
				pointers[ method ] = Pointers.prototype[ method ];
			}
		}
		return(pointers);
	};

	Pointers.fromArray = function (array) {
		var pointers = Pointers.apply(null, array);
		return(pointers);
	};

	Pointers.isArray = function (value) {
		var stringValue = Object.prototype.toString.call(value);
		return(stringValue.toLowerCase() === "[object array]");

	};

	Pointers.prototype = {
		add: function (value) {
			if (Pointers.isArray(value)) {
				for (var i = 0; i < value.length; i++) {
					Array.prototype.push.call(this, value[ i ]);
				}

			} else {
				Array.prototype.push.call(this, value);
			}
			return(this);

		},
		addAll: function () {
			for (var i = 0; i < arguments.length; i++) {
				this.add(arguments[ i ]);
			}
			return(this);
		},
		importMouse: function (click) {
			var idx = 0;
			if (this[idx] === undefined)
				this[idx] = new Pointer(click);
			else
				this[idx].import(click);
			return this;
		},
		importTouches: function (touches) {
			for (var idx = 0; idx < touches.length; idx++) {
				if (this[idx] === undefined)
					this[idx] = new Pointer(touches[idx]);
				else
					this[idx].import(touches[idx]);
			}
			return this;
		}
	};

	return(Pointers);
}).call({});

window.Pointer = (function () {
	function Pointer(_pointer) {
		var _this = this;
		this.mX = this.mY = this.tX = this.tY = this.act = 0;
		this.md = false;

		this.import = function (_pointer) {
			this.act = _pointer.button !== undefined ? _pointer.button : this.act;
			this.set(_pointer.clientX, _pointer.clientY);
			if (!this.md)
				this.start();
			return this;
		};
		this.start = function () {
			this.md = [(new Date).getMicrotime(), this.mX, this.mY];
			return this;
		};
		this.isClick = function () {
			return ((this.mX - this.md[1]) === 0 && (this.mY - this.md[2]) === 0 && ((new Date).getMicrotime() - this.md[0]) <= 250);
		};
		this.set = function (_X, _Y) {
			this.mX = _X === undefined ? this.mX : _X;
			this.mY = _Y === undefined ? this.mY : _Y;
			return _this;
		};

		this.clearDiff = function (_X, _Y) {
			this.tX = _X === undefined ? this.mX : this.mX = _X;
			this.tY = _Y === undefined ? this.mY : this.mY = _Y;
			return _this;
		};

		this.diffX = function () {
			return this.mX - this.tX;
		};
		this.diffY = function () {
			return this.mY - this.tY;
		};

		if (_pointer !== undefined) {
			this.import(_pointer);
		}
		return this;
	}

	return(Pointer);
}).call({});
