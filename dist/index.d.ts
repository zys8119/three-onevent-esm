import { Scene, Camera } from 'three';
declare class TargetList {
    updateCallbackList: any[];
    constructor(updateCallbackList?: any[]);
    gaze(targetList: any, camera: any): void;
    click(targetList: any, camera: any, el: any): void;
    hover(targetList: any, camera: any, el: any): void;
}
export default class index {
    scene: Scene;
    camera: Camera;
    el?: HTMLElement;
    TargetList: TargetList;
    updateCallbackList: any[];
    EventListeners: Record<any, any>;
    listenerList: Record<any, any>;
    option: Record<any, any>;
    constructor(scene: Scene, camera: Camera, el?: HTMLElement);
    init(): void;
    removeAll(this: any): void;
    update(): void;
}
export {};
