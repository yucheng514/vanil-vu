// init 用的函数都在这儿

import { config, inBrowser } from "../globalData";
import { mergeOptions } from "./utils";
var uid$3 = 0;

var mark;
var measure;
{
    var perf = inBrowser && window.performance;
    // perf = window.performance

    /* istanbul ignore if */
    if (
        perf &&
        perf.mark &&
        perf.measure &&
        perf.clearMarks &&
        perf.clearMeasures
    ) {
        mark = function (tag) {
            return perf.mark(tag);
        };
        measure = function (name, startTag, endTag) {
            perf.measure(name, startTag, endTag);
            perf.clearMarks(startTag);
            perf.clearMarks(endTag);
            // perf.clearMeasures(name)
        };
    }
}

var initProxy;
{
    initProxy = function initProxy(vm) {
        if (hasProxy) {
            // determine which proxy handler to use
            var options = vm.$options;
            var handlers =
                options.render && options.render._withStripped
                    ? getHandler
                    : hasHandler;
            vm._renderProxy = new Proxy(vm, handlers);
        } else {
            vm._renderProxy = vm;
        }
    };
}

function initInternalComponent(vm, options) {
    var opts = (vm.$options = Object.create(vm.constructor.options));
    // doing this because it's faster than dynamic enumeration.
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;

    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;

    if (options.render) {
        opts.render = options.render;
        opts.staticRenderFns = options.staticRenderFns;
    }
}

function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        // todo 这里的 this 指的是？
        console.log(this);
        var vm = this;
        // a uid
        vm._uid = uid$3++;

        var startTag, endTag;
        /* istanbul ignore if */
        if (config.performance && mark) {
            startTag = "vue-perf-start:" + vm._uid;
            endTag = "vue-perf-end:" + vm._uid;
            mark(startTag);
        }

        // a flag to avoid this being observed
        vm._isVue = true;
        // merge options
        if (options && options._isComponent) {
            // optimize internal component instantiation
            // since dynamic options merging is pretty slow, and none of the
            // internal component options needs special treatment.
            initInternalComponent(vm, options);
        } else {
            vm.$options = mergeOptions(
                resolveConstructorOptions(vm.constructor),
                options || {},
                vm
            );
        }
        /* istanbul ignore else */
        {
            initProxy(vm);
        }
        // expose real self
        vm._self = vm;

        // save here
        
        initLifecycle(vm);
        initEvents(vm);
        initRender(vm);
        callHook(vm, "beforeCreate");
        initInjections(vm); // resolve injections before data/props
        initState(vm);
        initProvide(vm); // resolve provide after data/props
        callHook(vm, "created");

        /* istanbul ignore if */
        if (config.performance && mark) {
            vm._name = formatComponentName(vm, false);
            mark(endTag);
            measure("vue " + vm._name + " init", startTag, endTag);
        }

        if (vm.$options.el) {
            vm.$mount(vm.$options.el);
        }
    };
}

export { initMixin };
