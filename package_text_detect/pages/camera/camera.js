const ocr = require('../../utils/ocrBusiness.js')
const canvasId = 'canvas2d';
// throttling
const cameraFrameMax = 15;
// camera listener
var listener = null;
// if show points
const showPoints = true;

Page({
    frameWidth: 0,
    frameHeight: 0,
    data: {
        devicePosition: 'back',
    },
    onReady() {
        var _that = this;
        ocr.initDetect(_that.initDetect_callback);

        // start camera tracking
        _that.startTacking();
    },
    onUnload: function () {
        this.stopTacking();
        console.log('onUnload', 'The listener is stop.');

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
                ctx.draw()
            }

        } else {
            var message = 'No results.';
            wx.showToast({
                title: message,
                icon: 'none'
            });
        }
    },
    startTacking() {
        var _that = this;
        var count = 0;
        const context = wx.createCameraContext();

        // real-time
        listener = context.onCameraFrame(function (res) {
            // this is throttling
            if (count < cameraFrameMax) {
                count++;
                return;
            }
            count = 0;
            console.log('onCameraFrame:', res.width, res.height);
            const frame = {
                // the data type is ArrayBuffer
                data: res.data,
                width: res.width,
                height: res.height,
            };
            _that.frameWidth = frame.width
            _that.frameHeight = frame.height
            // process
            ocr.detect(frame, 0);
        });
        // start
        listener.start();
        console.log('startTacking', 'listener is start');
    },
    stopTacking() {
        if (listener) {
            listener.stop();
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
})
