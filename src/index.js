import Events from 'mmevents';

class EventCenter extends Events {
    constructor(props) {
        super();
        const {
            listenChannel, emitChannel, bridge, maxDataOnAir = 1800, storagePrefix = '', showLog = false
        } = props;
        if (!listenChannel || !emitChannel || !bridge || !bridge.publish || !bridge.subscribe) throw new Error('初始化参数错误，listenChannel 为监听通道，emitChannel 为发出通道， bridge 为 KNB 桥');
        this.listenChannel = listenChannel;
        this.emitChannel = emitChannel;
        this.bridge = bridge;
        this.maxDataOnAir = maxDataOnAir;
        this.storagePrefix = storagePrefix;
        this.subscribedId = null
        this.showLog = showLog

        // 初始化后即监听
        this._subscribe().catch(e => console.error(e));
    }

    // type 是为了在一个通道里，实现码分复用，在实际业务中，我们的 type 通常可以多携带一些信息，增加其信息量，比如 unread_msg|refreshd，表示系统侧通知用户未读消息更新，而 system_msg|need_refresh 表示用户侧通知系统，希望再发一次数据
    async send(type, data = null) {
        const isOutofLength = JSON.stringify(data).length > this.maxDataOnAir;
        if (!isOutofLength) {
            await this._publish(type, data);
            return;
        }
        await this._setStorage(`${this.storagePrefix}${type}`, data);
        await this._publish(type, null, true);
    }

    listen(type, callback) {
        this.on(type, callback);
        return this;
    }

    stopListen(type, callback) {
        this.off(type, callback);
    }

    _publish(type, data, byStorage = false) {
        return new Promise((resolve, reject) => {
            this.bridge.publish({
                type: 'native',
                action: this.emitChannel,
                data: {
                    type,
                    data,
                    byStorage,
                },
                success: () => {
                    resolve();
                    if (this.showLog) console.warn('发送成功', this.emitChannel, type);
                },
                fail: () => {
                    reject(new Error(`KNB.publish 失败 channel: ${this.emitChannel} type: ${type}`));
                },
            });
        });
    }

    // 自动监听，无需用户调用，需区分是否从 storage 里获取的数据
    _subscribe() {
        return new Promise((resolve, reject) => {
            this.bridge.subscribe({
                type: 'native',
                action: this.listenChannel,
                success: (data) => {
                    this.subscribedId = data.subId;
                    if (this.showLog) console.warn('绑定成功', this.listenChannel, data);
                    resolve();
                },
                fail: () => {
                    reject(new Error('注册 KNB.subscribe 监听失败'));
                },
                handle: (data) => {
                    data = data.data
                    if (data.type) {
                        if (data.byStorage) {
                            this._getStorage(`${this.storagePrefix}${data.type}`).then(d => this.emit(data.type, d));
                        } else {
                            this.emit(data.type, data.data);
                        }
                    }
                },
            });
        });
    }

    // 主动解除监听，通常无需执行
    destroy() {
        return new Promise((resolve, reject) => {
            if (!this.subscribedId) {
                resolve();
                return;
            }
            this.bridge.unsubscribe({
                type: 'native',
                subId: this.subscribedId,
                success() {
                    this.subscribedId = null;
                    resolve();
                },
                fail() {
                    reject(new Error('注册 KNB.unsubscribe 监听失败'));
                },
            });
        });
    }

    /**
     * 传输数据超过 1.8 kb，采用 storage 中转
     */
    _getStorage(channel) {
        return new Promise((resolve, reject) => {
            this.bridge.getStorage({
                key: channel,
                success: (result) => {
                    let obj = null;
                    try {
                        obj = JSON.parse(result.value);
                    } catch (error) {
                        console.warn('通过 storage 的传输的是非法的 json 序列化的数据');
                    }
                    resolve(obj);
                },
                fail(error) {
                    reject(new Error(`获取 storage ${channel} 数据失败 ${JSON.stringify(error)}`));
                },
            });
        });
    }

    /**
     * 传输数据超过 1.8 kb，采用 storage 中转
     */
    _setStorage(channel, value) {
        return new Promise((resolve, reject) => {
            this.bridge.setStorage({
                key: channel,
                value: JSON.stringify(value),
                level: 1,
                success() {
                    resolve();
                },
                fail(error) {
                    reject(new Error(`设置 storage ${channel} 数据失败 ${JSON.stringify(error)}`));
                },
            });
        });
    }
}

export default EventCenter;
