## 简介

用于使用 KNB 业务桥实现双向通信:

- RN <--> RN
- H5 <--> RN
- RN <--> H5

最少仅需要一个通道，实现双向通信，不同类别的消息通过「码分复用」承载在有限的通道上

## 使用

我们以一个常规的 `商户` <--> `客服` 之间的通信为例，描述一下一般过程

> 注：下文中的 listenChannel 和 emitChannel 本质上就是 KNB.publish KNB.subscribe 对应的 action 名称

商户侧：

```js
import Pipe from 'knb-pipe'

const pipe = new Pipe({
    listenChannel: 'service_channel', // 监听 service_channel 发出的信息
    emitChannel: 'customer_channel', // 发送信息通过 customer_channel 发出
    bridge: KNB, // 在 H5 端即 <script> 引入 的脚本，在 RN 端即 @mrn/mrn-knb
    maxDataOnAir: 1800, // 可选，缺省 1800; 如果传送的数据超过 1800 Byte，则走 storage 做桥接
    storagePrefix: 'wamai_e_', // 可选，缺省为 ''; storage 的前缀，通过 storage 做桥接时，请最好加上前缀，避免与其他业务覆盖
})

// 监听从 service_channel 发下来的 'unread|refreshed' 类型的信息
pipe.listen('unread|refreshed', data => {
  console.log(`未读消息数更新，目前未读数为: ${JSON.stringify(data)}`)
})

// 监听 service_channel 发下来的 'unread|refreshed' 类型的信息
pipe.listen('service_msg|refreshed', data => {
  console.log(`客服发来的消息`, data)
})

// 发出广播，不带消息
pipe.send('unread|need_refresh')

// 发出广播，带消息
pipe.send('customer_msg|refreshed', {
  msg: '请问这个商品多少钱'
})
```

> 注：listen 支持链式调用，send 函数是 promised 函数

客服侧：

```js
import Pipe from 'knb-pipe'

const pipe = new Pipe({
    listenChannel: 'customer_channel', // 与商户的 channel 刚好相反
    emitChannel: 'service_channel', 
    bridge: KNB, 
    maxDataOnAir: 1800, 
    storagePrefix: 'wamai_e_',
})

// 监听商户发送来的消息
pipe.listen('customer_msg|refreshed', data => {
  console.log(`商户发送来的消息为: ${JSON.stringify(data)}`)
})

// 监听商户要求更新的消息，并更新未读数
pipe.listen('unread|need_refresh', () => {
  pipe.send('unread|refreshed', 5) // 告知未读消息为 5 个
})

// 发出广播，带消息
pipe.send('service_msg|refreshed', {
  msg: '请问有什么可以帮到您？'
})
```

初始化 pipe 自动开启监听，如果需要解除监听，可将通道销毁：

```js
pipe.destroy()
```

销毁后，不要再使用该 pipe