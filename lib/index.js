"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mmevents = _interopRequireDefault(require("mmevents"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Pipe =
/*#__PURE__*/
function (_Events) {
  _inherits(Pipe, _Events);

  function Pipe(props) {
    var _this;

    _classCallCheck(this, Pipe);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Pipe).call(this));
    var listenChannel = props.listenChannel,
        emitChannel = props.emitChannel,
        bridge = props.bridge,
        _props$maxDataOnAir = props.maxDataOnAir,
        maxDataOnAir = _props$maxDataOnAir === void 0 ? 1800 : _props$maxDataOnAir,
        _props$storagePrefix = props.storagePrefix,
        storagePrefix = _props$storagePrefix === void 0 ? '' : _props$storagePrefix,
        _props$showLog = props.showLog,
        showLog = _props$showLog === void 0 ? false : _props$showLog;
    if (!listenChannel || !emitChannel || !bridge || !bridge.publish || !bridge.subscribe) throw new Error('初始化参数错误，listenChannel 为监听通道，emitChannel 为发出通道， bridge 为 KNB 桥');
    _this.listenChannel = listenChannel;
    _this.emitChannel = emitChannel;
    _this.bridge = bridge;
    _this.maxDataOnAir = maxDataOnAir;
    _this.storagePrefix = storagePrefix;
    _this.subscribedId = null;
    _this.showLog = showLog; // 初始化后即监听

    _this._subscribe().catch(function (e) {
      return console.error(e);
    });

    return _this;
  } // type 是为了在一个通道里，实现码分复用，在实际业务中，我们的 type 通常可以多携带一些信息，增加其信息量，比如 unread_msg|refreshd，表示系统侧通知用户未读消息更新，而 system_msg|need_refresh 表示用户侧通知系统，希望再发一次数据


  _createClass(Pipe, [{
    key: "send",
    value: function () {
      var _send = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(type) {
        var data,
            isOutofLength,
            _args = arguments;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                data = _args.length > 1 && _args[1] !== undefined ? _args[1] : null;
                isOutofLength = JSON.stringify(data).length > this.maxDataOnAir;

                if (isOutofLength) {
                  _context.next = 6;
                  break;
                }

                _context.next = 5;
                return this._publish(type, data);

              case 5:
                return _context.abrupt("return");

              case 6:
                _context.next = 8;
                return this._setStorage("".concat(this.storagePrefix).concat(type), data);

              case 8:
                _context.next = 10;
                return this._publish(type, null, true);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function send(_x) {
        return _send.apply(this, arguments);
      }

      return send;
    }()
  }, {
    key: "listen",
    value: function listen(type, callback) {
      this.on(type, callback);
      return this;
    }
  }, {
    key: "stopListen",
    value: function stopListen(type, callback) {
      this.off(type, callback);
    }
  }, {
    key: "_publish",
    value: function _publish(type, data) {
      var _this2 = this;

      var byStorage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      return new Promise(function (resolve, reject) {
        _this2.bridge.publish({
          type: 'native',
          action: _this2.emitChannel,
          data: {
            type: type,
            data: data,
            byStorage: byStorage
          },
          success: function success() {
            resolve();
            if (_this2.showLog) console.warn('发送成功', _this2.emitChannel, type);
          },
          fail: function fail() {
            reject(new Error("KNB.publish \u5931\u8D25 channel: ".concat(_this2.emitChannel, " type: ").concat(type)));
          }
        });
      });
    } // 自动监听，无需用户调用，需区分是否从 storage 里获取的数据

  }, {
    key: "_subscribe",
    value: function _subscribe() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.bridge.subscribe({
          type: 'native',
          action: _this3.listenChannel,
          success: function success(data) {
            _this3.subscribedId = data.subId;
            if (_this3.showLog) console.warn('绑定成功', _this3.listenChannel, data);
            resolve();
          },
          fail: function fail() {
            reject(new Error('注册 KNB.subscribe 监听失败'));
          },
          handle: function handle(data) {
            data = data.data;

            if (data.type) {
              if (data.byStorage) {
                _this3._getStorage("".concat(_this3.storagePrefix).concat(data.type)).then(function (d) {
                  return _this3.emit(data.type, d);
                });
              } else {
                _this3.emit(data.type, data.data);
              }
            }
          }
        });
      });
    } // 主动解除监听，通常无需执行

  }, {
    key: "destroy",
    value: function destroy() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (!_this4.subscribedId) {
          resolve();
          return;
        }

        _this4.bridge.unsubscribe({
          type: 'native',
          subId: _this4.subscribedId,
          success: function success() {
            _this4.subscribedId = null;
            resolve();
          },
          fail: function fail() {
            reject(new Error('注册 KNB.unsubscribe 监听失败'));
          }
        });
      });
    }
    /**
     * 传输数据超过 1.8 kb，采用 storage 中转
     */

  }, {
    key: "_getStorage",
    value: function _getStorage(channel) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        _this5.bridge.getStorage({
          key: channel,
          success: function success(result) {
            var obj = null;

            try {
              obj = JSON.parse(result.value);
            } catch (error) {
              console.warn('通过 storage 的传输的是非法的 json 序列化的数据');
            }

            resolve(obj);
          },
          fail: function fail(error) {
            reject(new Error("\u83B7\u53D6 storage ".concat(channel, " \u6570\u636E\u5931\u8D25 ").concat(JSON.stringify(error))));
          }
        });
      });
    }
    /**
     * 传输数据超过 1.8 kb，采用 storage 中转
     */

  }, {
    key: "_setStorage",
    value: function _setStorage(channel, value) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        _this6.bridge.setStorage({
          key: channel,
          value: JSON.stringify(value),
          level: 1,
          success: function success() {
            resolve();
          },
          fail: function fail(error) {
            reject(new Error("\u8BBE\u7F6E storage ".concat(channel, " \u6570\u636E\u5931\u8D25 ").concat(JSON.stringify(error))));
          }
        });
      });
    }
  }]);

  return Pipe;
}(_mmevents.default); // window.Pipe = Pipe


var _default = Pipe;
exports.default = _default;