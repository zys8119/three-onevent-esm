import { Object3D, Raycaster, Vector2 } from "three";
function getObjList(targetList) {
  var list = [];
  for (var key in targetList) {
    var target = targetList[key].object3d;
    list.push(target);
  }
  return group2meshlist(list);
}
function group2meshlist(list) {
  var l = [];
  for (var i in list) {
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
    var Gazing = false, targetObject, obj;
    var Eye = new Raycaster();
    var gazeListener = function() {
      if (!!targetList) {
        var list = [];
        Eye.setFromCamera(new Vector2(), camera);
        list = getObjList(targetList);
        var intersects = Eye.intersectObjects(list);
        if (intersects.length > 0) {
          if (!Gazing) {
            Gazing = true;
            targetObject = intersects[0].object;
            obj = getEventObj(targetList, targetObject);
            if (!!obj.callback[0])
              obj.callback[0](targetObject);
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
    var targetObject, obj, Click = false, Down = false;
    var Mouse = new Raycaster();
    function down(event) {
      var _a;
      const path = event.path || ((_a = event.composedPath) == null ? void 0 : _a.call(event)) || [];
      if (el && path.includes(el) || !el) {
        event.preventDefault();
        if (!targetList)
          return;
        var list = [];
        Mouse.setFromCamera(new Vector2(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
        list = getObjList(targetList);
        var intersects = Mouse.intersectObjects(list);
        if (intersects.length > 0) {
          if (Click)
            return;
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
        event.preventDefault();
        if (Click)
          Click = false;
      }
    }
    function up(event) {
      var _a;
      const path = event.path || ((_a = event.composedPath) == null ? void 0 : _a.call(event)) || [];
      if (el && path.includes(el) || !el) {
        event.preventDefault();
        if (Click && !!obj.callback[0])
          obj.callback[0](targetObject);
        Click = false;
      }
    }
    window.addEventListener("mousedown", down, false);
    window.addEventListener("mousemove", move, false);
    window.addEventListener("mouseup", up, false);
  }
  hover(targetList, camera, el) {
    var targetObject, obj, Hover = false;
    var Mouse = new Raycaster();
    window.addEventListener("mousemove", function(event) {
      var _a;
      const path = event.path || ((_a = event.composedPath) == null ? void 0 : _a.call(event)) || [];
      if (el && path.includes(el) || !el) {
        event.preventDefault();
        if (!targetList)
          return;
        var list = [];
        Mouse.setFromCamera(new Vector2(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
        list = getObjList(targetList);
        var intersects = Mouse.intersectObjects(list);
        if (intersects.length > 0) {
          if (Hover)
            return;
          Hover = true;
          targetObject = intersects[0].object;
          obj = getEventObj(targetList, targetObject);
          if (!!obj.callback[0])
            obj.callback[0](targetObject);
        } else {
          if (Hover && !!obj.callback[1]) {
            obj.callback[1](targetObject);
          }
          Hover = false;
        }
      }
    }, false);
  }
}
export default class onEvent {
  constructor(scene, camera, el) {
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
    Object.keys(this.TargetList).concat([
      "gaze",
      "click",
      "hover"
    ]).forEach((v, i) => {
      this.EventListeners[v] = {
        flag: false,
        listener: (targetList) => {
          this.listenerList[v](targetList, this.option.camera, this.option.el);
        }
      };
    });
    this.init();
  }
  init() {
    const _this = this;
    Object.assign(Object3D.prototype, {
      on: function(method, callback1, callback2) {
        if (_this.EventListeners.hasOwnProperty(method)) {
          _this.TargetList[method][this.id] = {
            object3d: this,
            callback: Array.from(arguments).slice(1)
          };
          var eventlistener = _this.EventListeners[method];
          if (!eventlistener.flag) {
            eventlistener.flag = true;
            eventlistener.listener(_this.TargetList[method]);
          }
        } else {
          console.warn("There is no method called '" + method + "';");
        }
      },
      off: function(method) {
        if (!!method) {
          if (_this.EventListeners.hasOwnProperty(method)) {
            delete _this.TargetList[method][this.id];
          } else {
            console.warn("There is no method called '" + method + "';");
          }
        } else {
          for (const key in _this.TargetList) {
            delete _this.TargetList[key][this.id];
          }
        }
      }
    });
  }
  removeAll() {
    for (var key in this.TargetList) {
      for (var id in this.TargetList[key]) {
        delete this.TargetList[key][id];
      }
    }
  }
  update() {
    for (var key in this.updateCallbackList) {
      this.updateCallbackList[key]();
    }
  }
}
