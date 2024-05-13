import { config } from "../globalData";

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
function noop(a, b, c) {}

/**
 * Always return false.
 */
var no = function (a, b, c) {
    return false;
};

/**
 * Return the same value.
 */
var identity = function (_) {
    return _;
};

/**
 * Validate component names
 */
function checkComponents(options) {
    for (var key in options.components) {
        validateComponentName(key);
    }
}
/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps(options, vm) {
    var props = options.props;
    if (!props) {
        return;
    }
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) {
        i = props.length;
        while (i--) {
            val = props[i];
            if (typeof val === "string") {
                name = camelize(val);
                res[name] = { type: null };
            } else {
                warn("props must be strings when using array syntax.");
            }
        }
    } else if (isPlainObject(props)) {
        for (var key in props) {
            val = props[key];
            name = camelize(key);
            res[name] = isPlainObject(val) ? val : { type: val };
        }
    } else {
        warn(
            'Invalid value for option "props": expected an Array or an Object, ' +
                "but got " +
                toRawType(props) +
                ".",
            vm
        );
    }
    options.props = res;
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject(options, vm) {
    var inject = options.inject;
    if (!inject) {
        return;
    }
    var normalized = (options.inject = {});
    if (Array.isArray(inject)) {
        for (var i = 0; i < inject.length; i++) {
            normalized[inject[i]] = { from: inject[i] };
        }
    } else if (isPlainObject(inject)) {
        for (var key in inject) {
            var val = inject[key];
            normalized[key] = isPlainObject(val)
                ? extend({ from: key }, val)
                : { from: val };
        }
    } else {
        warn(
            'Invalid value for option "inject": expected an Array or an Object, ' +
                "but got " +
                toRawType(inject) +
                ".",
            vm
        );
    }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives(options) {
    var dirs = options.directives;
    if (dirs) {
        for (var key in dirs) {
            var def$$1 = dirs[key];
            if (typeof def$$1 === "function") {
                dirs[key] = { bind: def$$1, update: def$$1 };
            }
        }
    }
}
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions(parent, child, vm) {
    {
        checkComponents(child);
    }

    if (typeof child === "function") {
        child = child.options;
    }

    normalizeProps(child, vm);
    normalizeInject(child, vm);
    normalizeDirectives(child);

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
        if (child.extends) {
            parent = mergeOptions(parent, child.extends, vm);
        }
        if (child.mixins) {
            for (var i = 0, l = child.mixins.length; i < l; i++) {
                parent = mergeOptions(parent, child.mixins[i], vm);
            }
        }
    }

    var options = {};
    var key;
    for (key in parent) {
        mergeField(key);
    }
    for (key in child) {
        if (!hasOwn(parent, key)) {
            mergeField(key);
        }
    }
    function mergeField(key) {
        var strat = strats[key] || defaultStrat;
        options[key] = strat(parent[key], child[key], vm, key);
    }
    return options;
}

function resolveConstructorOptions(Ctor) {
    var options = Ctor.options;
    if (Ctor.super) {
        var superOptions = resolveConstructorOptions(Ctor.super);
        var cachedSuperOptions = Ctor.superOptions;
        if (superOptions !== cachedSuperOptions) {
            // super option changed,
            // need to resolve new options.
            Ctor.superOptions = superOptions;
            // check if there are any late-modified/attached options (#4976)
            var modifiedOptions = resolveModifiedOptions(Ctor);
            // update base extend options
            if (modifiedOptions) {
                extend(Ctor.extendOptions, modifiedOptions);
            }
            options = Ctor.options = mergeOptions(
                superOptions,
                Ctor.extendOptions
            );
            if (options.name) {
                options.components[options.name] = Ctor;
            }
        }
    }
    return options;
}

var emptyObject = Object.freeze({});

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
function createElement(
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
) {
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children;
        children = data;
        data = undefined;
    }
    if (isTrue(alwaysNormalize)) {
        normalizationType = ALWAYS_NORMALIZE;
    }
    return _createElement(context, tag, data, children, normalizationType);
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive$$1(obj, key, val, customSetter, shallow) {
    var dep = new Dep();

    var property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
        return;
    }

    // cater for pre-defined getter/setters
    var getter = property && property.get;
    var setter = property && property.set;
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key];
    }

    var childOb = !shallow && observe(val);
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            var value = getter ? getter.call(obj) : val;
            if (Dep.target) {
                dep.depend();
                if (childOb) {
                    childOb.dep.depend();
                    if (Array.isArray(value)) {
                        dependArray(value);
                    }
                }
            }
            return value;
        },
        set: function reactiveSetter(newVal) {
            var value = getter ? getter.call(obj) : val;
            /* eslint-disable no-self-compare */
            if (newVal === value || (newVal !== newVal && value !== value)) {
                return;
            }
            /* eslint-enable no-self-compare */
            if (customSetter) {
                customSetter();
            }
            // #7981: for accessor properties without setter
            if (getter && !setter) {
                return;
            }
            if (setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }
            childOb = !shallow && observe(newVal);
            dep.notify();
        },
    });
}

var warn = noop;
var generateComponentTrace = noop; // work around flow check
var formatComponentName = noop;
{
    var hasConsole = typeof console !== "undefined";
    var classifyRE = /(?:^|[-_])(\w)/g;
    var classify = function (str) {
        return str
            .replace(classifyRE, function (c) {
                return c.toUpperCase();
            })
            .replace(/[-_]/g, "");
    };
    warn = function (msg, vm) {
        var trace = vm ? generateComponentTrace(vm) : "";

        if (config.warnHandler) {
            config.warnHandler.call(null, msg, vm, trace);
        } else if (hasConsole && !config.silent) {
            console.error("[Vue warn]: " + msg + trace);
        }
    };
    formatComponentName = function (vm, includeFile) {
        if (vm.$root === vm) {
            return "<Root>";
        }
        var options =
            typeof vm === "function" && vm.cid != null
                ? vm.options
                : vm._isVue
                ? vm.$options || vm.constructor.options
                : vm;
        var name = options.name || options._componentTag;
        var file = options.__file;
        if (!name && file) {
            var match = file.match(/([^/\\]+)\.vue$/);
            name = match && match[1];
        }

        return (
            (name ? "<" + classify(name) + ">" : "<Anonymous>") +
            (file && includeFile !== false ? " at " + file : "")
        );
    };
    generateComponentTrace = function (vm) {
        if (vm._isVue && vm.$parent) {
            var tree = [];
            var currentRecursiveSequence = 0;
            while (vm) {
                if (tree.length > 0) {
                    var last = tree[tree.length - 1];
                    if (last.constructor === vm.constructor) {
                        currentRecursiveSequence++;
                        vm = vm.$parent;
                        continue;
                    } else if (currentRecursiveSequence > 0) {
                        tree[tree.length - 1] = [
                            last,
                            currentRecursiveSequence,
                        ];
                        currentRecursiveSequence = 0;
                    }
                }
                tree.push(vm);
                vm = vm.$parent;
            }
            return (
                "\n\nfound in\n\n" +
                tree
                    .map(function (vm, i) {
                        return (
                            "" +
                            (i === 0 ? "---> " : repeat(" ", 5 + i * 2)) +
                            (Array.isArray(vm)
                                ? formatComponentName(vm[0]) +
                                  "... (" +
                                  vm[1] +
                                  " recursive calls)"
                                : formatComponentName(vm))
                        );
                    })
                    .join("\n")
            );
        } else {
            return "\n\n(found in " + formatComponentName(vm) + ")";
        }
    };
}

export {
    no,
    noop,
    identity,
    mergeOptions,
    resolveConstructorOptions,
    emptyObject,
    createElement,
    defineReactive$$1,
};
