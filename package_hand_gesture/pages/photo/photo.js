const hand = require('../../utils/handBusiness.js');
const model = require('../../utils/modelBusiness.js');
const classify = require('../../utils/classify.js');
const canvasId = 'canvas2d';
const canvasWebGLId = 'canvasWebGL';
const maxCanvasWidth = 375;
// if show hand points
const showHandPoint = true;
// a url of gltf model 
const modelUrl = 'https://m.sanyue.red/demo/imgs/cat_beard.png';

Page({
  frameWidth: 0,
  frameHeight: 0,
  data: {
    btnText: 'Take a photo',
    devicePosition: 'back',
    // if it is taking photo
    isRunning: true,
    notice: '手势分类',
  },
  onReady() {
    var _that = this;
    hand.initHandDetect(_that.initHandDetect_callback);
    // load a 3D model
    model.initThree(canvasWebGLId, modelUrl);

    // init gesture data
    classify.initGestureData()
  },
  onUnload: function () {
    hand.stopHandDetect();
    model.stopAnimate();
    model.dispose();

    classify.dispose()
  },
  initHandDetect_callback(predictions, detect_time) {
    var _that = this
    console.log('detect time', detect_time, 'ms')

    if (predictions && predictions.length > 0) {
      var canvasWidth = this.frameWidth;
      var canvasHeight = this.frameHeight;
      var prediction = predictions[0]

      // 手势的关键点
      let gesture = []
      for (let point of prediction.points) {
        // 归一化数值
        const gesture_x = point.x - prediction.origin.x
        const gesture_y = point.y - prediction.origin.y
        
        gesture.push([parseFloat(gesture_x.toFixed(2)),
        parseFloat(gesture_y.toFixed(2))])
      }
      console.log(JSON.stringify(gesture))

      // 显示分类名称
      const gesture_label = classify.getGesture(gesture)
      // 1：布、 2：剪刀、3：拳头、-1：未知手势
      console.log('gesture', prediction.gesture, gesture_label)
      const wechat_gesture = ['', '布', '剪刀', '拳头']
      const wechat_gesture_name = wechat_gesture[prediction.gesture] || '未知手势'
      
      _that.setData({
        notice: '自定义：'+gesture_label + ',小程序：' + wechat_gesture_name
      })


      if (showHandPoint) {
        const ctx = wx.createCanvasContext(canvasId);
        ctx.setFillStyle('red')
        ctx.setFontSize(11)
        prediction.points.forEach(function (item, index) {
          ctx.fillText(index, item.x * canvasWidth, item.y * canvasHeight)
        })

        const x = prediction.origin.x * canvasWidth
        const y = prediction.origin.y * canvasHeight
        const w = prediction.size.width * canvasWidth
        const h = prediction.size.height * canvasHeight
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, w, h)

        ctx.draw(true)
      }

      // set the rotation and position of the 3d model.    
      model.setModel(prediction,
        canvasWidth,
        canvasHeight);

    }
    else {
      _that.setData({
        notice: '没有检测到手势'
      })
    }
  },
  processPhoto(photoPath, imageWidth, imageHeight) {
    var _that = this;
    const ctx = wx.createCanvasContext(canvasId);
    // the width of the scale image 
    var canvasWidth = imageWidth;
    if (canvasWidth > maxCanvasWidth) {
      canvasWidth = maxCanvasWidth;
    }
    // the height of the scale image 
    var canvasHeight = Math.floor(canvasWidth * (imageHeight / imageWidth));
    // draw image on canvas
    ctx.drawImage(photoPath, 0, 0, canvasWidth, canvasHeight);
    // waiting for drawing
    ctx.draw(false, function () {
      // get image data from canvas
      wx.canvasGetImageData({
        canvasId: canvasId,
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        success(res) {
          console.log('size of frame:', res.width, res.height);
          // 提供给THREE.DataTexture()
          const frame = {
            data: new Uint8Array(res.data),
            width: res.width,
            height: res.height,
          };

          // set 3d scene background
          model.setSceneBackground(frame);

          // 提供给session.detectHand()
          const handFrame = {
            // the data type must be ArrayBuffer for hand Detect
            data: res.data.buffer,
            width: res.width,
            height: res.height,
          };

          _that.frameWidth = frame.width
          _that.frameHeight = frame.height

          // process
          hand.handDetect(handFrame, 1);

        }
      });
    });
  },
  takePhoto() {
    var _that = this;

    const context = wx.createCameraContext();
    const ctx = wx.createCanvasContext(canvasId);
    if (_that.data.isRunning) {
      _that.setData({
        btnText: 'Retry',
        isRunning: false,
      });

      // take a photo
      context.takePhoto({
        quality: 'normal',
        success: (res) => {
          var photoPath = res.tempImagePath;
          //get size of image 
          wx.getImageInfo({
            src: photoPath,
            success(res) {
              console.log('size of image:', res.width, res.height);
              _that.processPhoto(photoPath, res.width, res.height);
            }
          });
        }
      });

    }
    else {
      _that.setData({
        btnText: 'Take a photo',
        isRunning: true,
      });
      // clear 2d canvas
      ctx.clearRect(0, 0);
      ctx.draw();
      // clear 3d canvas
      model.clearSceneBackground();
    }
  },
  changeDirection() {
    var status = this.data.devicePosition;
    if (status === 'back') {
      status = 'front';
    } else {
      status = 'back';
    }
    this.setData({
      devicePosition: status,
    });
  }
});
