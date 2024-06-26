import { Object3D, Raycaster, Vector2, Scene, Camera } from 'three';
function getObjList(targetList: any) {
    const list = [];
    for (const key in targetList) {
        const target = targetList[key].object3d;
        list.push(target);
    }
    return group2meshlist(list);
}

function group2meshlist(list: any) {
    let l: any = [];
    for (const i in list) {
        if (list[i].type === 'Group') {
            l = l.concat(group2meshlist(list[i].children));
        } else {
            l.push(list[i]);
        }
    }
    return l;
}

function getEventObj(targetList: any, object3d: any) {
    return object2group(targetList, object3d);
}

function object2group(targetList: any, object3d: any): any {
    if (targetList[object3d.id]) {
        return targetList[object3d.id] as any;
    } else {
        return object2group(targetList, object3d.parent) as any;
    }
}

class TargetList {
    constructor(public updateCallbackList: any[] = []) {}
    gaze(targetList: any, camera: any) {
        let Gazing = false,
            targetObject: any,
            obj: any;
        const Eye = new Raycaster();
        const gazeListener = function () {
            // create a gazeListener loop
            if (targetList) {
                let list = [];
                Eye.setFromCamera(new Vector2(), camera);
                list = getObjList(targetList);
                const intersects = Eye.intersectObjects(list);

                if (intersects.length > 0) {
                    if (!Gazing) {
                        //trigger once when gaze in
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
    click(targetList: any, camera: any, el: any) {
        let targetObject: any,
            obj: any,
            Click = false;
        const Mouse = new Raycaster();

        function down(event: any) {
            console.log(222)
            const path = (event as any).path || event.composedPath?.() || [];
            if ((el && path.includes(el)) || !el) {
                // event.preventDefault();
                if (!targetList) return;
                let list = [];
                const {width, height, x, y} = el.getBoundingClientRect()
                Mouse.setFromCamera(
                    new Vector2(
                        ((event.clientX - x) / width) * 2 - 1,
                        -((event.clientY- y) / height) * 2 + 1
                    ),
                    camera
                );
                list = getObjList(targetList);
                const intersects = Mouse.intersectObjects(list);

                if (intersects.length > 0) {
                    // mouse down trigger
                    if (Click) return;
                    Click = true;
                    targetObject = intersects[0].object;
                    obj = getEventObj(targetList, targetObject);
                } else {
                    Click = false;
                }
            }
        }

        function move(event: any) {
            const path = (event as any).path || event.composedPath?.() || [];
            if ((el && path.includes(el)) || !el) {
                // event.preventDefault();
                // disable click trigger when mouse moving
                if (Click) Click = false;
            }
        }

        function up(event: any) {
            const path = (event as any).path || event.composedPath?.() || [];
            if ((el && path.includes(el)) || !el) {
                // event.preventDefault();
                if (Click && !!obj.callback[0]) obj.callback[0](targetObject);
                Click = false;
            }
        }

        window.addEventListener('mousedown', down, false);
        window.addEventListener('mousemove', move, false);
        window.addEventListener('mouseup', up, false);
    }
    hover(targetList: any, camera: any, el: any) {
        let targetObject: any,
            obj: any;
        const Mouse = new Raycaster();
        window.addEventListener(
            'mousemove',
            function (event) {
                const path =
                    (event as any).path || event.composedPath?.() || [];
                if ((el && path.includes(el)) || !el) {
                    // event.preventDefault();
                    if (!targetList) return;
                    let list = [];
                    const {width, height, x, y} = el.getBoundingClientRect()
                    Mouse.setFromCamera(
                        new Vector2(
                            ((event.clientX - x) / width) * 2 - 1,
                            -((event.clientY- y) / height) * 2 + 1
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
export default class index {
    TargetList: TargetList;
    updateCallbackList: any[];
    EventListeners: Record<any, any>;
    listenerList: Record<any, any>;
    option: Record<any, any>;
    constructor(
        public scene: Scene,
        public camera: Camera,
        public el?: HTMLElement
    ) {
        this.updateCallbackList = [];
        this.TargetList = new TargetList(this.updateCallbackList);
        this.EventListeners = {};
        this.listenerList = this.TargetList;
        this.option = {
            scene,
            camera,
            el,
        };
        Object.keys(this.TargetList)
            .concat(['gaze', 'click', 'hover'])
            .forEach((v) => {
                this.EventListeners[v] = {
                    flag: false,
                    listener: (targetList: any) => {
                        this.listenerList[v](
                            targetList,
                            this.option.camera,
                            this.option.el
                        );
                    },
                };
            });
        this.init();
    }
    init() {
        //@typescript-eslint/no-this-alias
        const _this: any = this;
        Object.assign(Object3D.prototype, {
            on: function (this: any, method: any) {
                //no-prototype-builtins
                if (_this.EventListeners.hasOwnProperty(method)) {
                    _this.TargetList[method][this.id] = {
                        object3d: this,
                        callback: Array.from(arguments).slice(1),
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
            off: function (this: any, method: any) {
                if (method) {
                    // no-prototype-builtins
                    if (_this.EventListeners.hasOwnProperty(method)) {
                        delete _this.TargetList[method][this.id];
                    } else {
                        console.warn(
                            "There is no method called '" + method + "';"
                        );
                    }
                } else {
                    for (const key in _this.TargetList) {
                        delete _this.TargetList[key][this['id'] as string];
                    }
                }
            },
        });
    }
    removeAll(this: any) {
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
