function updateComponentListeners(vm, listeners, oldListeners) {
    target = vm;
    updateListeners(
        listeners,
        oldListeners || {},
        add,
        remove$1,
        createOnceHandler,
        vm
    );
    target = undefined;
}
var isUpdatingChildComponent = false;
export { updateComponentListeners, isUpdatingChildComponent };
