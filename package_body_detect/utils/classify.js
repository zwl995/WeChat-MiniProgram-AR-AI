// 伸展运动
let stretching_exercise = [[0.32, 0.16], [0.34, 0.15], [0.31, 0.15], [0.36, 0.16], [0.28, 0.16], [0.4, 0.23], [0.25, 0.22], [0.47, 0.16], [0.16, 0.15], [0.54, 0.1], [0.09, 0.11], [0.38, 0.41], [0.29, 0.41], [0.38, 0.54], [0.32, 0.54], [0.36, 0.67], [0.33, 0.63], [0.56, 0.07], [0.08, 0.1]]
// 扩胸运动1
let chest_expansion_exercise1 = [[0.32, 0.26], [0.33, 0.25], [0.3, 0.25], [0.35, 0.26], [0.28, 0.26], [0.39, 0.33], [0.22, 0.33], [0.46, 0.34], [0.14, 0.33], [-0.17, -0.21], [0.12, 0.32], [0.35, 0.47], [0.26, 0.47], [0.34, 0.62], [0.28, 0.6], [0.34, 0.71], [0.29, 0.72], [0.39, 0.4], [0.12, 0.31]]
// 扩胸运动2
let chest_expansion_exercise2 =[[0.21,0.07],[0.22,0.06],[0.2,0.06],[0.23,0.07],[0.18,0.07],[0.25,0.11],[0.16,0.11],[0.31,0.11],[0.1,0.12],[0.37,0.09],[0.04,0.11],[0.22,0.21],[0.18,0.21],[0.23,0.29],[0.2,0.29],[0.23,0.35],[0.2,0.36],[0.37,0.09],[0.04,0.11]]
// 体侧运动1
let lateral_movement_exercise1 = [[0.12, 0.09], [0.11, 0.08], [0.1, 0.08], [0.15, 0.06], [0.09, 0.09], [0.22, 0.09], [0.11, 0.17], [0.19, 0.06], [0.12, 0.27], [0.16, 0.01], [0.18, 0.28], [0.32, 0.27], [0.25, 0.3], [0.38, 0.43], [0.21, 0.43], [0.38, 0.52], [0.16, 0.55], [-0.37, -0.2], [0.19, 0.28]]
// 体侧运动2
let lateral_movement_exercise2 = [[0.26, 0.2], [0.28, 0.19], [0.25, 0.18], [0.28, 0.23], [0.23, 0.18], [0.26, 0.29], [0.16, 0.22], [0.27, 0.38], [0.23, 0.13], [0.16, 0.39], [0.27, 0.07], [0.18, 0.4], [0.15, 0.39], [0.2, 0.52], [0.17, 0.51], [0.27, 0.62], [0.24, 0.61], [0.15, 0.38], [0.27, 0.07]]

let train_dataset = []

function initGestureData() {
    train_dataset.push(
        { label: '伸展运动', data: stretching_exercise },
        { label: '扩胸运动', data: chest_expansion_exercise1 },
        { label: '扩胸运动', data: chest_expansion_exercise2 },
        { label: '体侧运动', data: lateral_movement_exercise1 },
        { label: '体侧运动', data: lateral_movement_exercise2 },
    )
}

function getGesture(test) {
    // 需要有19个关键点
    if (test.length != 19) {
        return
    }

    // 计算目标姿势和预定义姿势之间的余弦距离
    const angle_list = []
    for (let i = 0; i < train_dataset.length; i++) {
        // 预定义姿势
        const train = train_dataset[i]
        let angle = 0
        // 使用前15个关键点
        for (let j = 0; j < 15; j++) {
            const testItem = test[j]
            const trainItem = train.data[j]

            const x1 = testItem[0]
            const y1 = testItem[1]
            const x2 = trainItem[0]
            const y2 = trainItem[1]
            // 余弦距离
            const molecule = Math.pow(x1 * x2 + y1 * y2, 2)
            const denominator = (Math.pow(x1, 2) + Math.pow(y1, 2)) *
                (Math.pow(x2, 2) + Math.pow(y2, 2))
            let each_angle = 0
            if (denominator == 0) {
                each_angle = -1
            } else {
                each_angle = molecule / denominator
            }

            // 关键点的余弦距离之和
            angle += each_angle
        }
        // 保存计算结果
        angle_list.push({
            label: train.label,
            angle: angle,
        })

    }

    // 余弦距离越大，角度越小。
    // 按距离从大到小排序
    angle_list.sort(function (a, b) {
        return b.angle - a.angle
    })

    console.log(angle_list)

    // 当余弦距离太小时，则认为没有预定义的姿势。
    if (angle_list[0].angle < 1.5) {
        console.log('angle', angle_list[0].angle)
        return '未知姿势'
    }

    return angle_list[0].label
}

function dispose() {
    train_dataset = []
}

module.exports = {
    initGestureData,
    getGesture,
    dispose
}

