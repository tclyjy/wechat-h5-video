
import style from './index.css';

/**
 * @export
 * @class wechatH5Video
 * @param {string} source 媒体路径
 * @param {string} context 渲染容器
 * @param {boolean} preload 预加载
 * @param {boolean} mask 点击视频暂停
 * @param {string} poster 标签图片
 * @param {boolean} playBtn 是否启用播放按钮
 * @param {boolean} jumpBtn 是否启用跳过按钮
 * @param {boolean} antoClose 视频不放完是否自动移除视频
 * @param {boolean} canvas 是否采用canvas播放视频
 * @param {boolean} fill 是否拉伸撑满容器
 * @param {string} orientation 视频横向还是垂直逻辑 （portrait or landscape）
 * @param {boolean} isRotate 视频是否随手机翻转而翻转
 * @param {functtion} onPlay 播放开始回调
 * @param {functtion} onPause 播放暂停回调
 * @param {functtion} onEnd 播放结束
 */
export default class wechatH5Video {
  constructor(source, options) {
    let defaultOpthon = {
      context: null,
      preload: true,
      mask: true,
      poster: null,
      playBtn: true,
      jumpBtn: false,
      autoClose: false,
      canvas: false,
      fill: true,
      orientation: 'portrait',
      isRotate: true,
      onPlay() { },
      onPause() { },
      onEnd() { }
    }

    if (!source) {
      throw new Error('缺少媒体路径参数source');
    }
    if (!options.context) {
      throw new Error('缺少容器参数context')
    }

    this.options = Object.assign(defaultOpthon, options)
    this.source = source
    this.context = _isString(this.options.context) ? document.getElementById(this.options.context) : this.options.context;
    this.orientation = null;
    this.container = null;
    this.video = null;
    this.mask = null;
    this.poster = null;
    this.playBtn = null;
    this.jumpBtn = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.timer = null;

    this.initContainer();
    this.initWrapper();
    if (this.options.preload) {
      this.init();
    }
  };
  init() {
    this.context.appendChild(this.container);
    this.video = this.getVideo();
    if (this.options.canvas) {
      this._videoToCavas();
    }
    if (!this.options.fill) {
      this._handleResize();
    } else {
      this._fillResize();
    }
  }
  initContainer() {
    // container
    this.container = document.createElement('div');
    this.container.classList.add(style.container);
  };

  initWrapper() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add(style.wrapper);

    this.wrapper.innerHTML = `
      <video
        class=${style.video}
        style="${this.options.fill ? 'object-fit: fill;object-position: 50% 50%;' : ''}"
        width="100%"
        preload="true"
        x-webkit-airplay="allow",
        webkit-playsinline="true",
        playsinline="true",
        x5-video-player-type="h5",
        x5-video-player-fullscreen="true",
        x5-video-orientation="${this.options.orientation}"
        >
        ${this.source instanceof Object ?
        `<source src="${this.source.url}" type="video/${this.source.type}"></source>` :
        `<source src="${this.source}"></source>`}
      </video>
    `
    this.container.appendChild(this.wrapper);

    if (this.options.mask) {
      this._initMask();
    }
    if (this.options.poster) {
      this._initPoster();
    }
    if (this.options.playBtn) {
      this._initPlayBtn();
    }
    if (this.options.jumpBtn) {
      this._initeJumpBtn();
    }

  }

  _initMask() {
    this.mask = document.createElement('div');
    this.mask.classList.add(style.mask);
    this.container.appendChild(this.mask);
  }

  _initPoster() {
    this.poster = document.createElement('div');
    this.poster.classList.add(style.poster);
    this.poster.style.backgroundImage = `url('${this.options.poster}')`
    this.container.appendChild(this.poster);
  }

  _initPlayBtn() {
    this.playBtn = document.createElement('div');
    this.playBtn.classList.add(style.playBtn);
    this.playBtn.innerHTML = `
      <svg viewBox="0 0 64 64">
        <path d="M26,45.5L44,32L26,18.6v27V45.5L26,45.5z M32,2C15.4,2,2,15.5,2,32c0,16.6,13.4,30,30,30c16.6,0,30-13.4,30-30 C62,15.4,48.5,2,32,2L32,2z M32,56c-9.7,0-18.5-5.9-22.2-14.8C6.1,32.2,8.1,21.9,15,15c6.9-6.9,17.2-8.9,26.2-5.2 C50.1,13.5,56,22.3,56,32C56,45.3,45.2,56,32,56L32,56z" />
      </svg>
    `
    this.container.appendChild(this.playBtn);
  }

  _initeJumpBtn() {
    this.jumpBtn = document.createElement('div');
    this.jumpBtn.classList.add(style.jumpBtn);
    this.jumpBtn.innerHTML = `跳过视频>>`;
    this.container.appendChild(this.jumpBtn);
  }

  getVideo() {
    return this.wrapper.querySelector(`.${style.video}`)
  }

  load() {
    if (!this.context.contains(this.container)) {
      this.init();
    }
    this._addEvent();
    this.video.load();
    return this;
  }

  play() {
    this.video.play();
    this.options.onPlay();
    let self = this;
    self.video.isPlayed = false;
    self.video.addEventListener('timeupdate', function () {

      // 当视频currentTime大于0.1时候表示已有视频画面
      if (!self.video.isPlayed && this.currentTime > 0.1) {
        self.video.isPlayed = true;
        if (self.options.canvas) {
          self._drawCavas();
        }
        self._hiddenPoster();
        self._hiddenPlayBtn();
        self._showJumpBtn();
      }
    })
  };

  pause() {
    this.video.pause();
    this._showPlayBtn();
    this._hideJumpBtn();
    this.options.onPause();
    if (this.options.canvas) {
      cancelAnimationFrame(this.timer);
    }
  }

  _hiddenPoster() {
    if (this.poster) {
      this.poster.style.display = 'none';
    }
  }

  _showPoster() {
    if (this.poster) {
      this.poster.style.display = 'block';
    }
  }

  _hiddenPlayBtn() {
    if (this.playBtn) {
      this.playBtn.style.display = 'none';
    }
  }

  _showPlayBtn() {
    if (this.playBtn) {
      this.playBtn.style.display = 'block';
    }
  }

  _showJumpBtn() {
    if (this.jumpBtn) {
      this.jumpBtn.style.display = 'block';
    }
  }

  _hideJumpBtn() {
    if (this.jumpBtn) {
      this.jumpBtn.style.display = 'none';
    }
  }

  _remove() {
    this.context.removeChild(this.container);
  }

  _reload() {
    this.video.currentTime = 0;
    this.pause();
    this._showPoster();
  }

  _addEvent() {
    if (this.options.playBtn) {
      this.playBtn.addEventListener('click', () => {
        this.play();
      }, false);
    }

    if (this.options.mask) {
      this.mask.addEventListener('click', () => {
        this.pause();
      }, false)
    }

    if (this.options.jumpBtn) {
      this.jumpBtn.addEventListener('click', () => {
        this.options.onEnd();
        if (this.options.autoClose) {
          this._remove();
        } else {
          this._reload();
        }
        if (this.options.canvas) {
          cancelAnimationFrame(this.timer);
        }
      }, false)
    }

    this.video.addEventListener('ended', () => {
      this.options.onEnd();
      this._showPlayBtn();
      if (this.options.autoClose) {
        this._remove();
      } else {
        this._reload();
      }
      if (this.options.canvas) {
        cancelAnimationFrame(this.timer);
      }
    }, false)

    window.onresize = () => {
      setTimeout(() => {
        _addStyles(this.wrapper, {
          width: window.innerWidth + 'px',
          height: window.innerHeight + 'px',
        });
        if (this.options.canvas) {
          _addStyles(this.canvas, {
            width: window.innerWidth + 'px',
            height: window.innerHeight + 'px',
          });
        }
      }, 200);
    }
  }

  _containerRect() {
    return this.container.getBoundingClientRect();
  }

  _handleResize() {
    let sWidth = 9
    let sHeight = 16
    let width = window.innerWidth
    let height = window.innerHeight

    let marginTop = height - (width * sHeight) / sWidth
    marginTop = Math.round(marginTop)
    this.video.style.marginTop = marginTop / 2 + 'px'
  }
  _fillResize() {

    let _changeStyle = () => {
      let containerRectWidth = this._containerRect().width;
      let containerRectHeight = this._containerRect().height;
      if (_judgePhoneOrientation() === this.options.orientation) {
        _addStyles(this.wrapper, {
          width: containerRectWidth + 'px',
          height: containerRectHeight + 'px',
          transform: '',
        })
        if (this.options.canvas) {
          _addStyles(this.canvas, {
            width: containerRectWidth + 'px',
            height: containerRectHeight + 'px',
            transform: '',
          })
        }
      } else {
        _addStyles(this.wrapper, {
          width: containerRectHeight + 'px',
          height: containerRectWidth + 'px',
          transform: 'rotate(-90deg)',
        });
        if (this.options.canvas) {
          _addStyles(this.canvas, {
            width: containerRectHeight + 'px',
            height: containerRectWidth + 'px',
          })
        }

      }
    }
    let _changeOrientation = () => {
      window.removeEventListener(_orientationchangeEvt, _changeOrientation);

      setTimeout(() => {
        _changeStyle();
        window.addEventListener(_orientationchangeEvt, _changeOrientation, false);
      }, 400);
    }

    if (this.options.isRotate) {
      _changeStyle();
      window.addEventListener(_orientationchangeEvt, _changeOrientation, false);
    } else {
      _addStyles(this.wrapper, {
        width: this._containerRect().width + 'px',
        height: this._containerRect().height + 'px',
      });
    }
  }

  _videoToCavas() {
    if (!this.video) return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this._containerRect().width;
    this.canvas.height = this._containerRect().height;
    this.canvasCtx = this.canvas.getContext('2d');

    this.video.parentNode.replaceChild(this.canvas, this.video);
  }

  _drawCavas() {
    this.canvasCtx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    this.timer = requestAnimationFrame(() => {
      this._drawCavas();
    });
  }

}

let _addStyles = (element, styles) => {
  for (let name in styles) {
    element.style[name] = styles[name];
  }
}

let _judgePhoneOrientation = () => {
  let clientWidth = document.documentElement.clientWidth
  let clientHeight = document.documentElement.clientHeight
  let result = '';

  if (clientWidth > clientHeight) {
    result = 'landscape';
  } else {
    result = 'portrait';
  }
  return result;
}
let _isString = (str) => typeof str === 'string' && str.constructor === String;
let _orientationchangeEvt = 'onorientationchange' in window ? 'orientationchange' : 'resize';
let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
let cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;