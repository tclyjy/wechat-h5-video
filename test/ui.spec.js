import wechatH5Video from '../dist/wechatH5Video';

describe('ui spec', () => {
  const videoWrapper = document.createElement('div');
  const source = 'https://www.haorooms.com/uploads/invitePage/media/move.mp4';

  videoWrapper.style.width = '360px';
  videoWrapper.style.height = '640px';

  let videoDefault = new wechatH5Video(source, {
    context: videoWrapper,
    mask: true,
    poster: 'https://ss0.bdstatic.com/94oJfD_bAAcT8t7mm9GUKT-xh_/timg?image&quality=100&size=b4000_4000&sec=1541401188&di=41264a717eb6a592709efc04a66e216d&src=http://i8.download.fd.pchome.net/t_600x1024/g1/M00/07/04/oYYBAFMioPmIClVuAALr2NPIYaIAABZ9QKPJJUAAuvw540.jpg',
    playBtn: true,
    jumpBtn: true,
    autoClose: false,
    canvas: false,
    fill: true,
    onPlay() {
      console.log('play');
    },
    onPause() {
      console.log('pause');
    },
    onEnd() {
      console.log('end');
    }
  }).load();

  test('videoDefault.container.parentNode should be videoWrapper', () => {
    expect(videoDefault.container.parentNode).toBe(videoWrapper);
  });
});
