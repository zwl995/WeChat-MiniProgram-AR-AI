var isInitOk = false;
var session;

function initFaceDetect(callback) {
  session = wx.createVKSession({
    track: {
      face: { mode: 2 } // 1.使用摄像头 2.传入图像
    },
    version: 'v1'
  })

  // 开始AR会话
  session.start(err => {
    if (err) {
      console.log('session.start', err)
      return
    }
    isInitOk = true;
    console.log('session.start', 'ok')

    session.on('addAnchors', anchors => {
      console.log('addAnchors')
    })

    session.on('updateAnchors', anchors => {
      console.log('updateAnchors')
      if (callback) {
        callback(anchors)
      }
    })

    session.on('removeAnchors', anchors => {
      console.log('removeAnchors')
    })

  })
}

function faceDetect(frame, sourceType) {
  if (!isInitOk) {
    return
  }

  session.detectFace({
    frameBuffer: frame.data,
    width: frame.width,
    height: frame.height,
    scoreThreshold: 0.8, // 评分阈值。正常情况传入 0.8 即可。
    sourceType: sourceType, // 正常情况传入 1 即可。当输入的图片是来自一个连续视频的每一帧图像时，sourceType 传入 0 会得到更优的效果。
    modelMode: 1, // 0、1、2 分别表示小、中、大等模型
  })

}

function stopFaceDetect() {
  session.destroy()
  if (session) {
    session = null
  }
  console.log('stopFaceDetect')
}

module.exports = { initFaceDetect, faceDetect, stopFaceDetect }
