var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { Object3D, Raycaster, Vector2 } from "three";
function getObjList(targetList) {
  const list = [];
  for (const key in targetList) {
    const target = targetList[key].object3d;
    list.push(target);
  }
  return group2meshlist(list);
}
function group2meshlist(list) {
  let l = [];
  for (const i in list) {
    if (list[i].type === "Group") {
      l = l.concat(group2meshlist(list[i].children));
    } else {
      l.push(list[i]);
    }
  }
  return l;
}
function getEventObj(targetList, object3d) {
  return object2group(targetList, object3d);
}
function object2group(targetList, object3d) {
  if (targetList[object3d.id]) {
    return targetList[object3d.id];
  } else {
    return object2group(targetList, object3d.parent);
  }
}
class TargetList {
  constructor(updateCallbackList = []) {
    this.updateCallbackList = updateCallbackList;
  }
  gaze(targetList, camera) {
    let Gazing = false, targetObject, obj;
    const Eye = new Raycaster();
    const gazeListener = function() {
      if (targetList) {
        let list = [];
        Eye.setFromCamera(new Vector2(), camera);
        list = getObjList(targetList);
        const intersects = Eye.intersectObjects(list);
        if (intersects.length > 0) {
          if (!Gazing) {
            Gazing = true;
            targetObject = intersects[0].object;
            obj = getEventObj(targetList, targetObject);
            if (obj.callback[0]) obj.callback[0](targetObject);
          }
        } else {
          if (Gazing && !!obj.callback[1]) {
            obj.callback[1](targetObject);
          }
          Gazing = false;
        }
      }
    };
    this.updateCallbackList.push(gazeListener);
  }
  click(targetList, camera, el) {
    let targetObject, obj, Click = false;
    const Mouse = new Raycaster();
    function down(event) {
      var _a;
      console.log(222);
      const path = event.path || ((_a = event.composedPath) == null ? void 0 : _a.call(event)) || [];
      if (el && path.includes(el) || !el) {
        if (!targetList) return;
        let list = [];
        const { width, height, x, y } = el.getBoundingClientRect();
        Mouse.setFromCamera(
          new Vector2(
            (event.clientX - x) / width * 2 - 1,
            -((event.clientY - y) / height) * 2 + 1
          ),
          camera
        );
        list = getObjList(targetList);
        const intersects = Mouse.intersectObjects(list);
        if (intersects.length > 0) {
          if (Click) return;
          Click = true;
          targetObject = intersects[0].object;
          obj = getEventObj(targetList, targetObject);
        } else {
          Click = false;
        }
      }
    }
    function move(event) {
      var _a;
      const path = event.path || ((_a = event.composedPath) == null ? void 0 : _a.call(event)) || [];
      if (el && path.includes(el) || !el) {
        if (Click) Click = false;
      }
    }
    function up(event) {
      var _a;
      const path = event.path || ((_a = event.composedPath) == null ? void 0 : _a.call(event)) || [];
      if (el && path.includes(el) || !el) {
        if (Click && !!obj.callback[0]) obj.callback[0](targetObject);
        Click = false;
      }
    }
    window.addEventListener("mousedown", down, false);
    window.addEventListener("mousemove", move, false);
    window.addEventListener("mouseup", up, false);
  }
  hover(targetList, camera, el) {
    let targetObject, obj;
    const Mouse = new Raycaster();
    window.addEventListener(
      "mousemove",
      function(event) {
        var _a;
        const path = event.path || ((_a = event.composedPath) == null ? void 0 : _a.call(event)) || [];
        if (el && path.includes(el) || !el) {
          if (!targetList) return;
          let list = [];
          const { width, height, x, y } = el.getBoundingClientRect();
          Mouse.setFromCamera(
            new Vector2(
              (event.clientX - x) / width * 2 - 1,
              -((event.clientY - y) / height) * 2 + 1
            ),
            camera
          );
          list = getObjList(targetList);
          const intersects = Mouse.intersectObjects(list);
          if (intersects.length > 0) {
            targetObject = intersects[0].object;
            obj = getEventObj(targetList, targetObject);
            if (obj.callback[0]) obj.callback[0](targetObject);
          }
        }
      },
      false
    );
  }
}
class index {
  constructor(scene, camera, el) {
    __publicField(this, "TargetList");
    __publicField(this, "updateCallbackList");
    __publicField(this, "EventListeners");
    __publicField(this, "listenerList");
    __publicField(this, "option");
    this.scene = scene;
    this.camera = camera;
    this.el = el;
    this.updateCallbackList = [];
    this.TargetList = new TargetList(this.updateCallbackList);
    this.EventListeners = {};
    this.listenerList = this.TargetList;
    this.option = {
      scene,
      camera,
      el
    };
    Object.keys(this.TargetList).concat(["gaze", "click", "hover"]).forEach((v) => {
      this.EventListeners[v] = {
        flag: false,
        listener: (targetList) => {
          this.listenerList[v](
            targetList,
            this.option.camera,
            this.option.el
          );
        }
      };
    });
    this.init();
  }
  init() {
    const _this = this;
    Object.assign(Object3D.prototype, {
      on: function(method) {
        if (_this.EventListeners.hasOwnProperty(method)) {
          _this.TargetList[method][this.id] = {
            object3d: this,
            callback: Array.from(arguments).slice(1)
          };
          const eventlistener = _this.EventListeners[method];
          if (!eventlistener.flag) {
            eventlistener.flag = true;
            eventlistener.listener(_this.TargetList[method]);
          }
        } else {
          console.warn("There is no method called '" + method + "';");
        }
      },
      off: function(method) {
        if (method) {
          if (_this.EventListeners.hasOwnProperty(method)) {
            delete _this.TargetList[method][this.id];
          } else {
            console.warn(
              "There is no method called '" + method + "';"
            );
          }
        } else {
          for (const key in _this.TargetList) {
            delete _this.TargetList[key][this["id"]];
          }
        }
      }
    });
  }
  removeAll() {
    for (const key in this.TargetList) {
      for (const id in this.TargetList[key]) {
        delete this.TargetList[key][id];
      }
    }
  }
  update() {
    for (const key in this.updateCallbackList) {
      this.updateCallbackList[key]();
    }
  }
}
const default_exports_copy_index = index;
export {
  default_exports_copy_index as default
};
