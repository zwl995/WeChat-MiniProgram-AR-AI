const ocr = require('../../utils/ocrBusiness.js');
const canvasId = 'canvas2d';
const maxCanvasWidth = 375;
// if show points
const showPoints = true;

Page({
  frameWidth: 0,
  frameHeight: 0,
  data: {
    btnText: 'Take a photo',
    devicePosition: 'back',
    // if it is taking photo
    isRunning: true,
  },
  onReady() {
    var _that = this;
    ocr.initDetect(_that.initDetect_callback);
  },
  onUnload: function () {
    ocr.stopDetect();
  },
  initDetect_callback(predictions) {
    if (predictions && predictions.length > 0) {
      // var canvasWidth = this.frameWidth;
      // var canvasHeight = this.frameHeight;
      const prediction = predictions[0]

      if (showPoints) {
        const ctx = wx.createCanvasContext(canvasId);
        ctx.setFillStyle('greenyellow')
        ctx.setFontSize(22)

        const predictionArr = prediction.text.split(' ')
        predictionArr.forEach(function (item, index) {
          ctx.fillText(item, 15, 35 + index * 30)
        })
        ctx.draw(true)
      }
    }
    else {
      var message = 'No results.';
      wx.showToast({
        title: message,
        icon: 'none'
      });

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
          const frame = {
            data: new Uint8Array(res.data),
            width: res.width,
            height: res.height,
          };

          const faceFrame = {
            // the data type must be ArrayBuffer for face Detect
            data: res.data.buffer,
            width: res.width,
            height: res.height,
          };

          _that.frameWidth = frame.width
          _that.frameHeight = frame.height

          // process
          ocr.detect(faceFrame, 1);

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
