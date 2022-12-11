// threejs库
const { createScopedThreejs } = require('threejs-miniprogram');
// 加载gltf库
const { registerGLTFLoader } = require('../../utils/gltf-loader.js');
// 相机每帧图像作为threejs场景的背景图
const webglBusiness = require('./webglBusiness.js')
// 近截面
const NEAR = 0.001
// 远截面
const FAR = 1000
// 相机、场景、渲染器
var camera, scene, renderer;
// 画布对象
var canvas;
// var touchX, touchY;
// threejs对象
var THREE;
// 自定义的3D模型
var mainModel, mainPlane;
// AR会话
var session;
// 光标模型、跟踪时间的对象
var reticle, clock;
// 保存3D模型的动画
var mixers = [];
// 设备像素比例
var devicePixelRatio;
var screenWidth, screenHeight;
var markerId;
// 模型的默认缩放大小
const modelScale = 0.1;
// 平面遮罩层的默认缩放大小
const planeScale = 0.28

function initWorldTrack() {
    if (!session) {
        console.log('The VKSession is not created.')
        return
    }

    // 检查API是否存在
    if (!session.addMarker) {
        return
    }

    session.on('addAnchors', anchors => {
        // 发现新的平面
        wx.hideLoading();
    })

    session.on('updateAnchors', anchors => {
        // 更新平面
    })

    session.on('removeAnchors', anchors => {
        // 当平面跟踪丢失时
    })

    wx.showLoading({
        title: '请对准识别图...',
    });

    // 在session.start()成功后，session.addMarker()才会起作用。
    addMarker()
}

function addMarker() {
    if (markerId) {
        return
    }
    // 如果文件路径包含新文件夹，则需要先创建文件夹。
    const filePath = `${wx.env.USER_DATA_PATH}/image_pattern_1.jpg`
    wx.downloadFile({
        url: 'https://m.sanyue.red/wechat/imgs/image_pattern_1.jpg',
        filePath,
        success: () => {
            // session.addMarker()需要等待session初始化完成，才能成功调用。
            markerId = session.addMarker(filePath)
            console.log('addMarker', filePath)
        }
    })
}

// 添加平面
function addPlane(size) {
    const geometry1 = new THREE.PlaneGeometry(size.width, size.height);
    const material1 = new THREE.MeshBasicMaterial({
        color: 'white',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
    });
    const plane1 = new THREE.Mesh(geometry1, material1);
    // 缩放
    plane1.scale.set(planeScale, planeScale, planeScale)
    // 旋转90度
    plane1.rotateX(-Math.PI / 2)
    mainPlane = plane1;
    scene.add(mainPlane);
}


// 加载3D模型
function loadModel(modelUrl, callback) {
    var loader = new THREE.GLTFLoader();
    wx.showLoading({
        title: 'Loading Model...',
    });
    loader.load(modelUrl,
        function (gltf) {
            console.log('loadModel', 'success');
            wx.hideLoading();
            var model = gltf.scene;
            // 缩放
            model.scale.set(modelScale, modelScale, modelScale)
            mainModel = model;
            scene.add(mainModel)

            var animations = gltf.animations;
            if (callback) {
                callback(model, animations);
            }
        },
        null,
        function (error) {
            console.log('loadModel', error);
            wx.hideLoading();
            wx.showToast({
                title: 'Loading model failed.',
                icon: 'none',
                duration: 3000,
            });
        });
}

// 加载3D模型的动画
function createAnimation(model, animations, clipName) {
    if (!model || !animations) {
        return
    }

    // 动画混合器
    const mixer = new THREE.AnimationMixer(model)
    for (let i = 0; i < animations.length; i++) {
        const clip = animations[i]
        if (clip.name === clipName) {
            const action = mixer.clipAction(clip)
            action.play()
        }
    }

    mixers.push(mixer)
}

// 更新3D模型的动画
function updateAnimation() {
    const dt = clock.getDelta()
    if (mixers) {
        mixers.forEach(function (mixer) {
            mixer.update(dt)
        })
    }
}

// 在threejs的每帧渲染中，使用AR相机更新threejs相机的变换。
function render(frame) {
    // 更新threejs场景的背景
    webglBusiness.renderGL(frame)
    // 更新3D模型的动画
    updateAnimation()
    // 从ar每帧图像获取ar相机对象
    const ar_camera = frame.camera

    if (ar_camera) {
        // 更新three.js相机对象的视图矩阵
        camera.matrixAutoUpdate = false
        camera.matrixWorldInverse.fromArray(ar_camera.viewMatrix)
        camera.matrixWorld.getInverse(camera.matrixWorldInverse)

        // 更新three.js相机对象的投影矩阵
        const projectionMatrix = ar_camera.getProjectionMatrix(NEAR, FAR)
        camera.projectionMatrix.fromArray(projectionMatrix)
        camera.projectionMatrixInverse.getInverse(camera.projectionMatrix)
    }

    renderer.autoClearColor = false
    // 这个是three.js相机对象
    renderer.render(scene, camera)
    // 保留模型的正面和背面
    renderer.state.setCullFace(THREE.CullFaceNone)
}


function initTHREE() {
    THREE = createScopedThreejs(canvas)
    console.log('initTHREE')
    registerGLTFLoader(THREE)

    // 相机
    camera = new THREE.Camera()
    // 场景
    scene = new THREE.Scene()

    // 半球光
    const light1 = new THREE.HemisphereLight(0xffffff, 0x444444)
    light1.position.set(0, 0.2, 0)
    scene.add(light1)

    // 平行光
    const light2 = new THREE.DirectionalLight(0xffffff)
    light2.position.set(0, 0.2, 0.1)
    scene.add(light2)

    // 渲染层
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    })
    renderer.gammaOutput = true
    renderer.gammaFactor = 2.2

    // 动画需要的
    clock = new THREE.Clock()

    // 添加平面，应该与识别图像的宽度和高度比例相同
    addPlane({ width: 3.75, height: 2.06 })
}


// 调整画布的大小
function calcCanvasSize() {
    console.log('calcCanvasSize')

    const info = wx.getSystemInfoSync()
    devicePixelRatio = info.pixelRatio
    screenWidth = info.windowWidth
    screenHeight = info.windowHeight
    /* 官方示例的代码
    canvas.width = width * devicePixelRatio / 2
    canvas.height = height * devicePixelRatio / 2
    */
    renderer.setSize(screenWidth, screenHeight);
    renderer.setPixelRatio(devicePixelRatio);

}

// 启动AR会话
function initEnvironment(canvasDom, callback) {
    console.log('initEnvironment')
    // 画布组件的对象
    canvas = canvasDom
    // 创建threejs场景
    initTHREE()
    // 创建AR会话
    session = wx.createVKSession({
        track: {
            marker: true,
        }
    })

    if (!session.addMarker) {
        wx.showModal({
            title: '提示',
            content: '由于该功能较新，需要微信版本号8.0.22以上运行。',
            showCancel: false,
            success: function (res) {
                // 用户点击确定
                if (res.confirm) {
                    wx.navigateBack()
                }
            },
        })
        return
    }

    // 开始AR会话
    session.start(err => {
        if (err) {
            console.log('session.start', err)
            return
        }
        console.log('session.start', 'ok')

        // 监视小程序窗口变化
        session.on('resize', function () {
            console.log('session on resize')
            calcCanvasSize()
        })

        if (callback) {
            callback()
        }

        // 设置画布的大小
        calcCanvasSize()
        // 初始化webgl的背景
        webglBusiness.initGL(renderer)
        // 每帧渲染
        const onFrame = function (timestamp) {
            if (!session) {
                return
            }

            // 从AR会话获取每帧图像
            const frame = session.getVKFrame(canvas.width, canvas.height)
            if (frame) {
                // threejs渲染过程
                render(frame)
            }
            session.requestAnimationFrame(onFrame)
        }
        session.requestAnimationFrame(onFrame)
    })
}

// 将对象回收
function dispose() {
    if (renderer) {
        renderer.dispose()
        renderer = null
    }
    if (scene) {
        scene.dispose()
        scene = null
    }
    if (camera) {
        camera = null
    }
    if (mainModel) {
        mainModel = null
    }

    if (mixers) {
        mixers.forEach(function (mixer) {
            mixer.uncacheRoot(mixer.getRoot())
        })
        mixers = []
    }
    if (clock) {
        clock = null
    }
    if (THREE) {
        THREE = null
    }

    if (canvas) {
        canvas = null
    }
    if (session) {
        session = null
    }

    if (reticle) {
        reticle = null
    }

    if (devicePixelRatio) {
        devicePixelRatio = null
    }

    if (screenWidth) {
        screenWidth = null
    }

    if (markerId) {
        markerId = null
    }

    webglBusiness.dispose()
}

module.exports = {
    render,
    initWorldTrack,
    initEnvironment,
    loadModel,
    createAnimation,
    updateAnimation,
    dispose,
}
