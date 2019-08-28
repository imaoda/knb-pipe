'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mmevents = require('mmevents');

var _mmevents2 = _interopRequireDefault(_mmevents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventCenter = function (_Events) {
    _inherits(EventCenter, _Events);

    function EventCenter(props) {
        _classCallCheck(this, EventCenter);

        var _this = _possibleConstructorReturn(this, (EventCenter.__proto__ || Object.getPrototypeOf(EventCenter)).call(this));

        var listenChannel = props.listenChannel,
            emitChannel = props.emitChannel,
            bridge = props.bridge,
            _props$maxDataOnAir = props.maxDataOnAir,
            maxDataOnAir = _props$maxDataOnAir === undefined ? 1800 : _props$maxDataOnAir,
            _props$storagePrefix = props.storagePrefix,
            storagePrefix = _props$storagePrefix === undefined ? '' : _props$storagePrefix;

        if (!listenChannel || !emitChannel || !bridge || !bridge.publish || !bridge.subscribe) throw new Error('初始化参数错误，listenChannel 为监听通道，emitChannel 为发出通道， bridge 为 KNB 桥');
        _this.listenChannel = listenChannel;
        _this.emitChannel = emitChannel;
        _this.bridge = bridge;
        _this.maxDataOnAir = maxDataOnAir;
        _this.storagePrefix = storagePrefix;
        _this.subscribedId = null;

        // 初始化后即监听
        _this._subscribe().catch(function (e) {
            return console.error(e);
        });
        return _this;
    }

    // type 是为了在一个通道里，实现码分复用，在实际业务中，我们的 type 通常可以多携带一些信息，增加其信息量，比如 unread_msg|refreshd，表示系统侧通知用户未读消息更新，而 system_msg|need_refresh 表示用户侧通知系统，希望再发一次数据


    _createClass(EventCenter, [{
        key: 'send',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(type) {
                var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var isOutofLength;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                isOutofLength = JSON.stringify(data).length > this.maxDataOnAir;

                                if (isOutofLength) {
                                    _context.next = 5;
                                    break;
                                }

                                _context.next = 4;
                                return this._publish(type, data);

                            case 4:
                                return _context.abrupt('return');

                            case 5:
                                _context.next = 7;
                                return this._setStorage('' + this.storagePrefix + type, data);

                            case 7:
                                _context.next = 9;
                                return this._publish(type, null, true);

                            case 9:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function send(_x) {
                return _ref.apply(this, arguments);
            }

            return send;
        }()
    }, {
        key: 'listen',
        value: function listen(type, callback) {
            this.on(type, callback);
            return this;
        }
    }, {
        key: 'stopListen',
        value: function stopListen(type, callback) {
            this.off(type, callback);
        }
    }, {
        key: '_publish',
        value: function _publish(type, data) {
            var _this2 = this;

            var byStorage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            return new Promise(function (resolve, reject) {
                _this2.bridge.publish({
                    action: _this2.emitChannel,
                    data: {
                        type: type,
                        data: data,
                        byStorage: byStorage
                    },
                    success: function success() {
                        resolve();
                        console.warn('发送成功', _this2.emitChannel);
                    },
                    fail: function fail() {
                        reject(new Error('KNB.publish \u5931\u8D25 channel: ' + _this2.emitChannel + ' type: ' + type));
                    }
                });
            });
        }

        // 自动监听，无需用户调用，需区分是否从 storage 里获取的数据

    }, {
        key: '_subscribe',
        value: function _subscribe() {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                _this3.bridge.subscribe({
                    action: _this3.listenChannel,
                    success: function success(data) {
                        _this3.subscribedId = data.subId;
                        console.warn('绑定成功', _this3.listenChannel, data);
                        resolve();
                    },
                    fail: function fail() {
                        reject(new Error('注册 KNB.subscribe 监听失败'));
                    },
                    handle: function handle(data) {
                        if (data.type) {
                            if (data.byStorage) {
                                _this3._getStorage('' + _this3.storagePrefix + data.type).then(function (d) {
                                    return _this3.emit(data.type, d);
                                });
                            } else {
                                _this3.emit(data.type, data.data);
                            }
                        }
                    }
                });
            });
        }

        // 主动解除监听，通常无需执行

    }, {
        key: 'destroy',
        value: function destroy() {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                if (!_this4.subscribedId) {
                    resolve();
                    return;
                }
                _this4.bridge.unsubscribe({
                    subId: _this4.subscribedId,
                    success: function success() {
                        this.subscribedId = null;
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
        key: '_getStorage',
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
                        reject(new Error('\u83B7\u53D6 storage ' + channel + ' \u6570\u636E\u5931\u8D25 ' + JSON.stringify(error)));
                    }
                });
            });
        }

        /**
         * 传输数据超过 1.8 kb，采用 storage 中转
         */

    }, {
        key: '_setStorage',
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
                        reject(new Error('\u8BBE\u7F6E storage ' + channel + ' \u6570\u636E\u5931\u8D25 ' + JSON.stringify(error)));
                    }
                });
            });
        }
    }]);

    return EventCenter;
}(_mmevents2.default);

exports.default = EventCenter;