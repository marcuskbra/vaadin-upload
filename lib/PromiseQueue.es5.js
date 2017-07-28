'use strict';
var exports = exports || {};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function() { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var PromiseQueue = function() {
  function PromiseQueue(opts) {
    _classCallCheck(this, PromiseQueue);

    this._queue = [];
    this._pause = false;
    opts = Object.assign({
      concurrency: Infinity
    }, opts);

    if (opts.concurrency < 1) {
      throw new TypeError('Expected `concurrency` to be a integer which is bigger than 0');
    }

    this._ongoingCount = 0;
    this._concurrency = opts.concurrency;
    this._resolveEmpty = function() { };

    this.utils = {
      isFunction: function(functionToCheck) {
        return functionToCheck && Object.prototype.toString.call(functionToCheck) === '[object Function]';
      },
      isArray: function(arrayToCheck) {
        return arrayToCheck && Object.prototype.toString.call(arrayToCheck) === '[object Array]';
      }
    };
  }

  _createClass(PromiseQueue, [{
    key: '_next',
    value: function _next() {
      if (this._pause) {
        return;
      }

      this._ongoingCount--;

      if (this._queue.length > 0) {
        this._queue.shift()();
      } else {
        this._resolveEmpty();
      }
    }
  }, {
    key: 'pause',
    value: function pause() {
      this._pause = true;
    }
  }, {
    key: 'resume',
    value: function resume() {
      this._pause = false;
      this._next();
    }
  }, {
    key: 'add',
    value: function add(fn) {
      var _this = this;

      if (this.utils.isArray(fn) && fn.every(this.utils.isFunction)) {
        return fn.length > 1 ? this.add(fn.shift()).add(fn) : this.add(fn[0]);
      } else if (this.utils.isFunction(fn)) {
        new Promise(function(resolve, reject) {
          var run = function run() {
            _this._ongoingCount++;
            fn().then(function(val) {
              resolve(val);
              _this._next();
            }, function(err) {
              reject(err);
              _this._next();
            });
          };

          if (_this._ongoingCount < _this._concurrency && !_this._pause) {
            run();
          } else {
            _this._queue.push(run);
          }
        });
        return this;
      } else {
        throw new TypeError('Expected `arg` in add(arg) must be a function which return a Promise, or an array of function which return a Promise');
      }
    }

    // Promises which are not ready yet to run in the queue.

  }, {
    key: 'size',
    get: function get() {
      return this._queue.length;
    }

    // Promises which are running but not done.

  }, {
    key: 'ongoing',
    get: function get() {
      return this._ongoingCount;
    }
  }]);

  return PromiseQueue;
}();

exports.default = PromiseQueue;