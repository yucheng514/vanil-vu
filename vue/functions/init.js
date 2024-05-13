// init 用的函数都在这儿

import { config, inBrowser } from "../globalData";
import {
    mergeOptions,
    emptyObject,
    createElement,
    defineReactive$$1,
    resolveConstructorOptions
} from "./utils";
import { updateComponentListeners, isUpdatingChildComponent } from "./update";
import { resolveSlots } from "./slots";
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
function initLifecycle(vm) {
    var options = vm.$options;

    // locate first non-abstract parent
    var parent = options.parent;
    if (parent && !options.abstract) {
        while (parent.$options.abstract && parent.$parent) {
            parent = parent.$parent;
        }
        parent.$children.push(vm);
    }

    vm.$parent = parent;
    vm.$root = parent ? parent.$root : vm;

    vm.$children = [];
    vm.$refs = {};

    vm._watcher = null;
    vm._inactive = null;
    vm._directInactive = false;
    vm._isMounted = false;
    vm._isDestroyed = false;
    vm._isBeingDestroyed = false;
}
function initEvents(vm) {
    vm._events = Object.create(null);
    vm._hasHookEvent = false;
    // init parent attached events
    var listeners = vm.$options._parentListeners;
    if (listeners) {
        updateComponentListeners(vm, listeners);
    }
}
function initRender(vm) {
    vm._vnode = null; // the root of the child tree
    vm._staticTrees = null; // v-once cached trees
    var options = vm.$options;
    var parentVnode = (vm.$vnode = options._parentVnode); // the placeholder node in parent tree
    var renderContext = parentVnode && parentVnode.context;
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    // bind the createElement fn to this instance
    // so that we get proper render context inside it.
    // args order: tag, data, children, normalizationType, alwaysNormalize
    // internal version is used by render functions compiled from templates
    vm._c = function (a, b, c, d) {
        return createElement(vm, a, b, c, d, false);
    };
    // normalization is always applied for the public version, used in
    // user-written render functions.
    vm.$createElement = function (a, b, c, d) {
        return createElement(vm, a, b, c, d, true);
    };

    // $attrs & $listeners are exposed for easier HOC creation.
    // they need to be reactive so that HOCs using them are always updated
    var parentData = parentVnode && parentVnode.data;

    /* istanbul ignore else */
    {
        defineReactive$$1(
            vm,
            "$attrs",
            (parentData && parentData.attrs) || emptyObject,
            function () {
                !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
            },
            true
        );
        defineReactive$$1(
            vm,
            "$listeners",
            options._parentListeners || emptyObject,
            function () {
                !isUpdatingChildComponent &&
                    warn("$listeners is readonly.", vm);
            },
            true
        );
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
