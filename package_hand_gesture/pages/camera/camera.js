const hand = require('../../utils/handBusiness.js')
const model = require('../../utils/modelBusiness.js');
const classify = require('../../utils/classify.js');
const canvasWebGLId = 'canvasWebGL';
// throttling
const cameraFrameMax = 6;
// a url of gltf model 
const modelUrl = 'https://m.sanyue.red/demo/imgs/cat_beard.png';
// camera listener
var listener = null;

Page({
    frameWidth: 0,
    frameHeight: 0,
    data: {
        devicePosition: 'back',
        notice: '手势分类',
    },
    onReady() {
        var _that = this;
        hand.initHandDetect(_that.initHandDetect_callback);
        // load a 3D model
        model.initThree(canvasWebGLId, modelUrl);

        // init gesture data
        classify.initGestureData()

        // start camera tracking
        _that.startTacking();
    },
    onUnload: function () {
        this.stopTacking();
        console.log('onUnload', 'The listener is stop.');

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

             // 显示分类名称
            const gesture_label = classify.getGesture(gesture)
            // 1：布、 2：剪刀、3：拳头、-1：未知手势
            console.log('gesture', prediction.gesture, gesture_label)
            const wechat_gesture = ['','布','剪刀','拳头']
            const wechat_gesture_name = wechat_gesture[prediction.gesture] || '未知手势'
            // set the position of the 3d model.    
            _that.setData({
                notice: '自定义：'+gesture_label + ',小程序：' + wechat_gesture_name
            })

            model.setModel(prediction,
                canvasWidth,
                canvasHeight);
        } else {
            _that.setData({
                notice: '没有检测到手势'
            })
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
            hand.handDetect(frame, 0);
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
