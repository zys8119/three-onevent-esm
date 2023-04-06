"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var three_1 = require("three");
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
        if (list[i].type === 'Group') {
            l = l.concat(group2meshlist(list[i].children));
        }
        else {
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
    }
    else {
        return object2group(targetList, object3d.parent);
    }
}
var TargetList = /** @class */ (function () {
    function TargetList(updateCallbackList) {
        if (updateCallbackList === void 0) { updateCallbackList = []; }
        this.updateCallbackList = updateCallbackList;
    }
    TargetList.prototype.gaze = function (targetList, camera) {
        var Gazing = false, targetObject, obj;
        var Eye = new three_1.Raycaster();
        var gazeListener = function () {
            // create a gazeListener loop
            if (!!targetList) {
                var list = [];
                Eye.setFromCamera(new three_1.Vector2(), camera);
                list = getObjList(targetList);
                var intersects = Eye.intersectObjects(list);
                if (intersects.length > 0) {
                    if (!Gazing) { //trigger once when gaze in
                        Gazing = true;
                        targetObject = intersects[0].object;
                        obj = getEventObj(targetList, targetObject);
                        if (!!obj.callback[0])
                            obj.callback[0](targetObject);
                    }
                }
                else {
                    if (Gazing && !!obj.callback[1]) {
                        obj.callback[1](targetObject);
                    }
                    Gazing = false;
                }
            }
        };
        this.updateCallbackList.push(gazeListener);
    };
    TargetList.prototype.click = function (targetList, camera) {
        var targetObject, obj, Click = false, Down = false;
        var Mouse = new three_1.Raycaster();
        function down(event) {
            event.preventDefault();
            if (!targetList)
                return;
            var list = [];
            Mouse.setFromCamera(new three_1.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
            list = getObjList(targetList);
            var intersects = Mouse.intersectObjects(list);
            if (intersects.length > 0) { // mouse down trigger
                if (Click)
                    return;
                Click = true;
                targetObject = intersects[0].object;
                obj = getEventObj(targetList, targetObject);
            }
            else {
                Click = false;
            }
        }
        function move(event) {
            event.preventDefault();
            // disable click trigger when mouse moving
            if (Click)
                Click = false;
        }
        function up(event) {
            event.preventDefault();
            if (Click && !!obj.callback[0])
                obj.callback[0](targetObject);
            Click = false;
        }
        window.addEventListener('mousedown', down, false);
        window.addEventListener('mousemove', move, false);
        window.addEventListener('mouseup', up, false);
    };
    TargetList.prototype.hover = function (targetList, camera) {
        var targetObject, obj, Hover = false;
        var Mouse = new three_1.Raycaster();
        window.addEventListener('mousemove', function (event) {
            event.preventDefault();
            if (!targetList)
                return;
            var list = [];
            Mouse.setFromCamera(new three_1.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
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
            }
            else {
                if (Hover && !!obj.callback[1]) {
                    obj.callback[1](targetObject);
                }
                Hover = false;
            }
        }, false);
    };
    return TargetList;
}());
var onEvent = /** @class */ (function () {
    function onEvent(scene, camera) {
        var _this_1 = this;
        this.scene = scene;
        this.camera = camera;
        this.updateCallbackList = [];
        this.TargetList = new TargetList(this.updateCallbackList);
        this.EventListeners = {};
        this.listenerList = this.TargetList;
        this.option = {
            scene: scene,
            camera: camera,
        };
        Object.keys(this.TargetList).concat([
            'gaze',
            "click",
            "hover",
        ]).forEach(function (v, i) {
            _this_1.EventListeners[v] = {
                flag: false,
                listener: function (targetList) {
                    _this_1.listenerList[v](targetList, _this_1.option.camera);
                }
            };
        });
        this.init();
    }
    onEvent.prototype.init = function () {
        var _this = this;
        Object.assign(three_1.Object3D.prototype, {
            on: function (method, callback1, callback2) {
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
                }
                else {
                    console.warn("There is no method called '" + method + "';");
                }
            },
            off: function (method) {
                if (!!method) {
                    if (_this.EventListeners.hasOwnProperty(method)) {
                        delete _this.TargetList[method][this.id];
                    }
                    else {
                        console.warn("There is no method called '" + method + "';");
                    }
                }
                else {
                    for (var key in _this.TargetList) {
                        delete _this.TargetList[key][this.id];
                    }
                }
            }
        });
    };
    onEvent.prototype.removeAll = function () {
        for (var key in this.TargetList) {
            for (var id in this.TargetList[key]) {
                delete this.TargetList[key][id];
            }
        }
    };
    onEvent.prototype.update = function () {
        for (var key in this.updateCallbackList) {
            this.updateCallbackList[key]();
        }
    };
    return onEvent;
}());
exports.default = onEvent;
