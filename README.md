# three-onevent-esm

threejs物体事件捕获绑定

## 安装

```
npm i three-onevent-esm
```

## 使用

使用前请确保项目已安装[three](https://www.npmjs.com/package/three), 本库不内置

```typescript
import onEvent from "three-onevent-esm"
new onEvent(scene, camera)

// 鼠标点击监听
object3d.on("click", (object3d)=>{
    //...
})

// 鼠标经过监听
object3d.on("hover", (object3d)=>{
    // 进入
}, ()=>{
    // 离开
})

// 凝视监听
object3d.on("gaze", (object3d)=>{
    // 进入
}, ()=>{
    // 离开
})
```

## 说明

本库为[three-onevent](https://www.npmjs.com/package/three-onevent)的es版本，具体详情请参见[three-onevent](https://www.npmjs.com/package/three-onevent)
