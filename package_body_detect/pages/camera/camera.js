const body = require('../../utils/bodyBusiness.js')
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
        notice: '姿势分类',
    },
    onReady() {
        var _that = this;
        body.initBodyDetect(_that.initBodyDetect_callback);
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

        body.stopBodyDetect();
        model.stopAnimate();
        model.dispose();

        classify.dispose()
    },
    initBodyDetect_callback(predictions, detect_time) {
        var _that = this
        console.log('detect time', detect_time, 'ms')

        if (predictions && predictions.length > 0) {
            var canvasWidth = this.frameWidth;
            var canvasHeight = this.frameHeight;
            var prediction = predictions[0]

            // 保留19个关键点
            let gesture = []
            for (let i = 0; i < 19; i++) {
                const point = prediction.points[i]
                // 归一化数值
                const gesture_x = point.x - prediction.origin.x
                const gesture_y = point.y - prediction.origin.y

                gesture.push([parseFloat(gesture_x.toFixed(2)),
                parseFloat(gesture_y.toFixed(2))])
            }

            // 显示分类名称
            const gesture_label = classify.getGesture(gesture)

            // set the position of the 3d model.    
            _that.setData({
                notice: '自定义：' + gesture_label
            })

            // set the rotation and position of the 3d model.    
            model.setModel(prediction,
                canvasWidth,
                canvasHeight);
        } else {
            _that.setData({
                notice: '没有检测到姿势'
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
            body.bodyDetect(frame, 0);
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
