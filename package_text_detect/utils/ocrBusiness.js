var isInitOk = false;
var session;

function initDetect(callback) {
  session = wx.createVKSession({
    track: {
      OCR: { mode: 2 } // 1.使用摄像头 2.传入图像
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
      console.log('updateAnchors','length of anchors',anchors.length)
      if (callback) {
        callback(anchors)
      }
    })

    session.on('removeAnchors', anchors => {
      console.log('removeAnchors')
    })

  })
}

function detect(frame, sourceType) {
  if (!isInitOk) {
    return
  }

  session.runOCR({
    frameBuffer: frame.data,
    width: frame.width,
    height: frame.height,
  })

}

function stopDetect() {
  session.destroy()
  if (session) {
    session = null
  }
  console.log('stopFaceDetect')
}

module.exports = { initDetect, detect, stopDetect }
