# 微信内视频及普通浏览器内视频内联播放方案  

<!-- TOC -->

- [微信内视频及普通浏览器内视频内联播放方案](#微信内视频及普通浏览器内视频内联播放方案)
  - [需求](#需求)
  - [IOS设备](#ios设备)
    - [内联视频](#内联视频)
    - [自动播放](#自动播放)
    - [补充](#补充)
  - [android设备](#android设备)
    - [内联视频](#内联视频-1)
      - [同层播放器支持版本](#同层播放器支持版本)
      - [简单使用](#简单使用)
      - [调整位置](#调整位置)
      - [TBS版本差异](#tbs版本差异)
  - [设备一致性](#设备一致性)
    - [video播放控制](#video播放控制)
    - [video的事件](#video的事件)
    - [视频居中](#视频居中)
  - [wechatH5Video](#wechath5video)
    - [Install](#install)
    - [Use](#use)

<!-- /TOC -->

## 需求
希望视频可以在手机上内联全屏播放、没有进度条等系统相关元素，可以在视频上方添加自定义元素（跳过按钮等）。  
以下分为两种环境：手机微信端、手机普通浏览器端；两种系统：IOS和Android来具体讨论实现方案。  

##  IOS设备

### 内联视频
在IOS上，APP都是使用系统自带的浏览器进行页面渲染，所以在IOS设备上video播放视频的效果是统一的。只需要考虑不同的IOS版本是否有不一致的地方。在IOS上普通的video标签会弹出一个系统自带播放器来全屏播放视频。播放器的下部有系统默认的控制栏，视频是“浮”在页面最上层的，所有的页面元素都只能在视频下面。  

**在ios10 Safari中，video新增了playsinline属性，可以使视频内联播放**  
参考文档：[New \<video\> Policies for iOS —— WebKit](https://webkit.org/blog/6784/new-video-policies-for-ios/)  

IOS 10 之前的版本支持```webkit-playsinline```，但是是在IOS9 上会出现只能听到声音不能看到画面的问题，需要加上[iphone-inline-video](https://github.com/bfred-it/iphone-inline-video)一起使用。
```html
<video width="100%" webkit-playsinline="true" playsinline></video>
```
这样视频就可以在IOS系统上不管是微信浏览器还是其他浏览器实现内联全屏播放了。  

### 自动播放
我们想着页面加载完视频就自动播放，但是现实是残酷的，经测发现android始终不能自动播放，IOS10后版本的safari和微信浏览器都不能自动播放。但是有个hack方法，微信提供一个事件WexinJSBridgeReady，在微信嵌入webview全局这个事件触发后，视频仍可以自动播放，这个方法可以实现ios端微信上的视频自动播放。但是android设备、手机QQ或者其他浏览器，建议引动用户触发触屏行为操作来实现播放。
```js
// 在WeixinJSBridgeReady事件中播放一次后暂停，使视频处于加载状态，为后面监听video事件，流程播放做准备
document.addEventListener("WeixinJSBridgeReady", function () {
  video.play();
  video.pause();
}, flase)
```

### 补充
当第一次播放视频的时候IOS端，如果网络慢，视频从开始播放到能展现画面会有短暂的黑屏（处理视频源数据的时间）,为了避免黑屏，可以在视频上加个div浮层（放vidoe的poster），然后用timeupdate方法监听，视频播放及有画面的时候再移除浮层
```js
video.addEventListener('timeupdate', function () {
  // 当视频currentTime大于0.1时候表示已有视频画面
  if(!video.isPlayed && this.currentTime > 0.1) {
    $('.poster').hide();
    video.isPlayed = true;
  }
})
```

## android设备

### 内联视频
移动端浏览器中的video元素是比较特别的，早期无论是在iOS还是Android的浏览器中，它都位于页面的最顶层，无法被遮盖。后来这个问题在iOS下得到了解决，但是Android的浏览器则问题依旧。X5是腾讯基于Webkit开发的渲染引擎，它提供了一种名叫「同层播放器」的特殊video元素以解决遮盖问题。   
H5同层播放器接入主要有三个属性，两个事件回调  
* x5-video-player-type="h5" 启用H5同层播放器
通过video属性“x5-video-player-type”声明启用同层H5播放器。x5-video-player-type支持的值类型：h5
```html
<video src="http://xxx.mp4" x5-video-player-type="h5"/>
```
* x5-video-player-fullscreen 全屏方式
视频播放时将会进入到全屏模式  
如果不申明此属性，页面得到视口区域为原始视口大小(视频未播放前)，比如在微信里，会有一个常驻的标题栏，如果不声明此属性，这个标题栏高度不会给页面，播放时会平均分为两块（上下黑块）  
注： 声明此属性，需要页面自己重新适配新的视口大小变化。可以通过监听resize 事件来实现
```html
<video id="test_video" src="xxx" x5-video-player-type="h5" x5-video-player-fullscreen="true"/>
```
```js
// 监听窗口大小变化(resize)实现全屏
window.onresize = function(){
  test_video.style.width = window.innerWidth + "px";
  test_video.style.height = window.innerHeight + "px";
}
```
* x5-video-orientation 控制横竖屏（landscape横屏，portraint竖屏）  
功能：声明播放器支持的方向  
可选值： landscape 横屏, portraint竖屏  
默认值：portraint  
```html
<video id="test_video" src="xxx" x5-video-player-type="h5" x5-video-player-fullscreen="true" x5-video-orientation="portrait" />
```

* x5videoenterfullscreen进入全屏通知
支持版本: TBS中从>=036900开始支持，QB中是>=7.2开始支持  
x5videoenterfullscreen: 表示播放器进入全屏状态 

* x5videoexitfullscreen退出全屏通知
x5videoexitfullscreen: 表示播放器退出了全屏状态  
使用方法与x5videoenterfullscreen类似   
注意：某些手机这两个监听事件会相反。

#### 同层播放器支持版本
TBS微信:  
TBS内核>=036849 后开始支持  
UA示例：  
Mozilla/5.0 (Linux; Android 4.4.4; OPPO R7 Build/KTU84P) AppleWebKit/537.36 (KHTML,like Gecko) Version/4.0 Chrome/37.0.0.0 Mobile MQQBrowser/6.8 TBS/036849 Safari/537.36 MicroMessenger/6.3.27.861 NetType/WIFI Language/zh_CN  

TBS手Q:  
TBS内核>= 036855  
  
Android QQ浏览器：    
浏览器版本>=7.1  
UA示例：   
UserAgent: Mozilla/5.0 (Linux; U; Android 4.4.4; zhcn; OPPO R7 Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko)Version/4.0 Chrome/37.0.0.0 MQQBrowser/7.1 Mobile Safari/537.36

#### 简单使用
html  
```html
<div class="player-wrapper">
  <video id="video" class="video" width="100%" webkit-playsinline="true" playsinline x5-video-player-type="h5" x5-video-player-fullscreen="true">
    <source src="video.mp4" />
  </video>
</div>
```
css  
```css
body {
  margin: 0;
  padding: 0;
  background: #000;
}
.player-wrapper {
  width: 100%;
  height: 4.22rem;
}
.player-wrapper .video {
  width: 100%;
  height: 100%;
}
```
#### 调整位置
按照官方文档所述，只要修改video元素的「object-position」属性，就可以修改视频部分的显示位置，但实际上还要把video元素的宽高设成屏幕的宽高才行：
```
.fullscreen .video {
  object-position: center top;
}
```

```js
var player = document.getElementById('video');
player.addEventListener('x5videoenterfullscreen', function() {
  // 设为屏幕尺寸
  player.style.width = window.screen.width + 'px';
  player.style.height = window.screen.height + 'px';

  document.body.classList.add('fullscreen');
}, false);

player.addEventListener('x5videoexitfullscreen', function() {
  player.style.width = player.style.height = '';
  document.body.classList.remove('fullscreen');
}, false)
```
注意把video元素的高设为屏幕高度时，要用「window.screen.height」而不能用「document.documentElement.clientHeight」，因为后者不包含导航栏高度，将会导致无法满屏。  

#### TBS版本差异
 / |TBS < 036849 | 036849 <= TBS < 036900 | 036900 <= TBS
--|--|--|--
是否支持同层播放器| 否 | 是 | 是
退出全屏播放时触发| | x5videoenterfullscreen | x5videoexitfullscreen
进入全屏播放时触发 | | x5videoexitfullscreen | x5videoenterfullscreen

## 设备一致性  
### video播放控制
对于video或者audio等媒体元素，有一些方法，常用的有play(),pause();  
### video的事件
video 支持的事件很多，但在有些事件在不同的系统上跟预想的表现不一致，例如：  
ios下监听'canplay'和'canplaythrough'（是否已缓冲了足够的数据可以流畅播放）,当加载时是不会触发的，即使preload="auto"也没用，但在pc的chrome调试器下和android下，是会在加载阶段就触发。ios需要播放后才会触发。  
总之就是现在的视频标准还不尽完善，有很多坑要注意，要使用前最好自己亲测一遍。  
在尝试比较之后，使用 timeupdate 和 ended这两个事件基本可以满足需求  
```js
video.addEventListener('timeupdate', function (e) {
console.log(video.currentTime) // 当前播放的进度
})
 
video.addEventListener('ended', function (e) {
// 播放结束时触发
})
```

### 视频居中  
视频的宽高比是固定的，而手机的屏幕宽高比则不是，所以，为了让观看到的视频的体验尽可能一致，以宽度为先，进行适配  
```js
function handleResize() {
  var sWidth = 9
  var sHeight = 16
  var width = window.innerWidth
  var height = window.innerHeight
  var marginTop = height - (width * sHeight) / sWidth
  
  marginTop = Math.round(marginTop)
  if (marginTop < -2) {
    video.$wrapper.css('marginTop', marginTop / 2 + 'px')
  } else {
    video.$wrapper.css('marginTop', '0')
  }
}
```
如果视频不按照原先宽高比也可以用```object-fit```属性使视频拉伸充满全部video  

## wechatH5Video

### Install
build
```
npm run build
```

dev
```
npm run start
```

### Use
```js
import wechatH5Video from 'wechatH5Video.min.js';
let wechatH5Video = new wechatH5Video(source,options);
wechatH5Video.load();
```
```html
<script src="/wechatH5Video.min.js"></script>
<script>
let wechatH5Video = new wechatH5Video(source,options);
wechatH5Video.load();
</script>
```
* ```source``` 视频源
  * {String} 视频路径
  * {Object} 视频路径和类型 { url: 'video.mp4', type: 'mp4' }

* ```options```配置项
  * ```context``` 渲染容器
  * ```canvas```  是否采用canvas播放视频，默认false
  * ```preload``` 是否预加载，默认true
  * ```mask```    播放视频时是否可以暂停，默认true
  * ```poster```  视频封面，接收字符串参数，传入视频封面地址
  * ```playBtn``` 播放按钮，true自动生成播放按钮，false需要自定义播放按钮，默认true
  * ```jumpBtn``` 跳过按钮，true自动生成跳过按钮，false需要自定义跳过按钮，默认false
  * ```autoClose``` 视频播放完自动关闭，true视频播放完自动remove掉渲染内容，false视频播放完回到视频最初状态，默认false
  * ```fill``` 是否拉伸充满全屏，默认true
  * ```orientation``` 视频横向还是垂直逻辑 （portrait or landscape），默认portrait
  * ```isRotate``` 视频是否随手机翻转而翻转，开启手机重力感应后有效，默认true
  * ```onPlay()``` 视频开始播放时回调
  * ```onPause()``` 视频暂停时回调
  * ```onEnd()``` 视频结束时回调

