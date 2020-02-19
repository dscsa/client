/* @preserve
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2018 Petka Antonov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
/**
 * bluebird build version 3.7.1
 * Features enabled: core
 * Features disabled: race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, using, timers, filter, any, each
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule");
var Queue = _dereq_("./queue");

function Async() {
    this._customScheduler = false;
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule = schedule;
}

Async.prototype.setScheduler = function(fn) {
    var prev = this._schedule;
    this._schedule = fn;
    this._customScheduler = true;
    return prev;
};

Async.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
};

Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
};


Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) +
            "\n");
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

Async.prototype.invokeLater = AsyncInvokeLater;
Async.prototype.invoke = AsyncInvoke;
Async.prototype.settlePromises = AsyncSettlePromises;


function _drainQueue(queue) {
    while (queue.length() > 0) {
        _drainQueueStep(queue);
    }
}

function _drainQueueStep(queue) {
    var fn = queue.shift();
    if (typeof fn !== "function") {
        fn._settlePromises();
    } else {
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
}

Async.prototype._drainQueues = function () {
    _drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    _drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = Async;
module.exports.firstLineError = firstLineError;

},{"./queue":17,"./schedule":18}],2:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
var calledBind = false;
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
    }
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~2097152);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 2097152) === 2097152;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};
};

},{}],3:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise":15}],4:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    var child = promise;
    while (promise._isCancellable()) {
        if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
                child._followee().cancel();
            } else {
                child._cancelBranched();
            }
            break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent._isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancelBranched();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            promise._setWillBeCancelled();
            child = promise;
            promise = parent;
        }
    }
};

Promise.prototype._branchHasCancelled = function() {
    this._branchesRemainingToCancel--;
};

Promise.prototype._enoughBranchesHaveCancelled = function() {
    return this._branchesRemainingToCancel === undefined ||
           this._branchesRemainingToCancel <= 0;
};

Promise.prototype._cancelBy = function(canceller) {
    if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
    } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
        }
    }
    return false;
};

Promise.prototype._cancelBranched = function() {
    if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
    }
};

Promise.prototype._cancel = function() {
    if (!this._isCancellable()) return;
    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    this._onCancelField = undefined;
};

Promise.prototype._isCancellable = function() {
    return this.isPending() && !this._isCancelled();
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundValue());
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

Promise.prototype._invokeOnCancel = function() {
    var onCancelCallback = this._onCancel();
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this._isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};

},{"./util":21}],5:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util");
var getKeys = _dereq_("./es5").keys;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];

            if (item === Error ||
                (item != null && item.prototype instanceof Error)) {
                if (e instanceof item) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (typeof item === "function") {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                    var key = keys[j];
                    if (item[key] != e[key]) {
                        continue predicateLoop;
                    }
                }
                return tryCatch(cb).call(boundTo, e);
            }
        }
        return NEXT_FILTER;
    };
}

return catchFilter;
};

},{"./es5":10,"./util":21}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var longStackTraces = false;
var contextStack = [];

Promise.prototype._promiseCreated = function() {};
Promise.prototype._pushContext = function() {};
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_pushContext = Promise.prototype._pushContext;
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var Promise_promiseCreated = Promise.prototype._promiseCreated;
    Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
    };
    longStackTraces = true;
    Promise.prototype._pushContext = Context.prototype._pushContext;
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
    Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
};
return Context;
};

},{}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, Context,
    enableAsyncHooks, disableAsyncHooks) {
var async = Promise._async;
var Warning = _dereq_("./errors").Warning;
var util = _dereq_("./util");
var es5 = _dereq_("./es5");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var printWarning;
var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
                        (true ||
                         util.env("BLUEBIRD_DEBUG") ||
                         util.env("NODE_ENV") === "development"));

var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
    (debugging || util.env("BLUEBIRD_WARNINGS")));

var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
    (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
    (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

var deferUnhandledRejectionCheck;
(function() {
    var promises = [];

    function unhandledRejectionCheck() {
        for (var i = 0; i < promises.length; ++i) {
            promises[i]._notifyUnhandledRejection();
        }
        unhandledRejectionClear();
    }

    function unhandledRejectionClear() {
        promises.length = 0;
    }

    if (typeof document === "object" && document.createElement) {
        deferUnhandledRejectionCheck = (function() {
            var iframeSetTimeout;

            function checkIframe() {
                if (document.body) {
                    var iframe = document.createElement("iframe");
                    document.body.appendChild(iframe);
                    if (iframe.contentWindow &&
                        iframe.contentWindow.setTimeout) {
                        iframeSetTimeout = iframe.contentWindow.setTimeout;
                    }
                    document.body.removeChild(iframe);
                }
            }
            checkIframe();
            return function(promise) {
                promises.push(promise);
                if (iframeSetTimeout) {
                    iframeSetTimeout(unhandledRejectionCheck, 1);
                } else {
                    checkIframe();
                }
            };
        })();
    } else {
        deferUnhandledRejectionCheck = function(promise) {
            promises.push(promise);
            setTimeout(unhandledRejectionCheck, 1);
        };
    }

    es5.defineProperty(Promise, "_unhandledRejectionCheck", {
        value: unhandledRejectionCheck
    });
    es5.defineProperty(Promise, "_unhandledRejectionClear", {
        value: unhandledRejectionClear
    });
})();

Promise.prototype.suppressUnhandledRejections = function() {
    var target = this._target();
    target._bitField = ((target._bitField & (~1048576)) |
                      524288);
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 524288) !== 0) return;
    this._setRejectionIsUnhandled();
    deferUnhandledRejectionCheck(this);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._setReturnedNonUndefined = function() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._returnedNonUndefined = function() {
    return (this._bitField & 268435456) !== 0;
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 262144;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~262144);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 262144) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 1048576;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~1048576);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
    return warn(message, shouldUseOwnTrace, promise || this);
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var context = Promise._getContext();
    possiblyUnhandledRejection = util.contextBind(context, fn);
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var context = Promise._getContext();
    unhandledRejectionHandled = util.contextBind(context, fn);
};

var disableLongStackTraces = function() {};
Promise.longStackTraces = function () {
    if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        var Promise_dereferenceTrace = Promise.prototype._dereferenceTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
                throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
            }
            Promise.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Promise.prototype._dereferenceTrace = Promise_dereferenceTrace;
            Context.deactivateLongStackTraces();
            config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Promise.prototype._dereferenceTrace = longStackTracesDereferenceTrace;
        Context.activateLongStackTraces();
    }
};

Promise.hasLongStackTraces = function () {
    return config.longStackTraces && longStackTracesIsSupported();
};


var legacyHandlers = {
    unhandledrejection: {
        before: function() {
            var ret = util.global.onunhandledrejection;
            util.global.onunhandledrejection = null;
            return ret;
        },
        after: function(fn) {
            util.global.onunhandledrejection = fn;
        }
    },
    rejectionhandled: {
        before: function() {
            var ret = util.global.onrejectionhandled;
            util.global.onrejectionhandled = null;
            return ret;
        },
        after: function(fn) {
            util.global.onrejectionhandled = fn;
        }
    }
};

var fireDomEvent = (function() {
    var dispatch = function(legacy, e) {
        if (legacy) {
            var fn;
            try {
                fn = legacy.before();
                return !util.global.dispatchEvent(e);
            } finally {
                legacy.after(fn);
            }
        } else {
            return !util.global.dispatchEvent(e);
        }
    };
    try {
        if (typeof CustomEvent === "function") {
            var event = new CustomEvent("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                name = name.toLowerCase();
                var eventData = {
                    detail: event,
                    cancelable: true
                };
                var domEvent = new CustomEvent(name, eventData);
                es5.defineProperty(
                    domEvent, "promise", {value: event.promise});
                es5.defineProperty(
                    domEvent, "reason", {value: event.reason});

                return dispatch(legacyHandlers[name], domEvent);
            };
        } else if (typeof Event === "function") {
            var event = new Event("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                name = name.toLowerCase();
                var domEvent = new Event(name, {
                    cancelable: true
                });
                domEvent.detail = event;
                es5.defineProperty(domEvent, "promise", {value: event.promise});
                es5.defineProperty(domEvent, "reason", {value: event.reason});
                return dispatch(legacyHandlers[name], domEvent);
            };
        } else {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent("testingtheevent", false, true, {});
            util.global.dispatchEvent(event);
            return function(name, event) {
                name = name.toLowerCase();
                var domEvent = document.createEvent("CustomEvent");
                domEvent.initCustomEvent(name, false, true,
                    event);
                return dispatch(legacyHandlers[name], domEvent);
            };
        }
    } catch (e) {}
    return function() {
        return false;
    };
})();

var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function() {
            return process.emit.apply(process, arguments);
        };
    } else {
        if (!util.global) {
            return function() {
                return false;
            };
        }
        return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method) return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
        };
    }
})();

function generatePromiseLifecycleEventObject(name, promise) {
    return {promise: promise};
}

var eventToObjectGenerator = {
    promiseCreated: generatePromiseLifecycleEventObject,
    promiseFulfilled: generatePromiseLifecycleEventObject,
    promiseRejected: generatePromiseLifecycleEventObject,
    promiseResolved: generatePromiseLifecycleEventObject,
    promiseCancelled: generatePromiseLifecycleEventObject,
    promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
    },
    warning: function(name, warning) {
        return {warning: warning};
    },
    unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
    },
    rejectionHandled: generatePromiseLifecycleEventObject
};

var activeFireEvent = function (name) {
    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
    } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
    }

    var domEventFired = false;
    try {
        domEventFired = fireDomEvent(name,
                    eventToObjectGenerator[name].apply(null, arguments));
    } catch (e) {
        async.throwLater(e);
        domEventFired = true;
    }

    return domEventFired || globalEventFired;
};

Promise.config = function(opts) {
    opts = Object(opts);
    if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
            Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
            disableLongStackTraces();
        }
    }
    if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
                wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
        }
    }
    if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
            throw new Error(
                "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
            cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
            cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
    }
    if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise.prototype._fireEvent = defaultFireEvent;
        }
    }
    if ("asyncHooks" in opts && util.nodeSupportsAsyncResource) {
        var prev = config.asyncHooks;
        var cur = !!opts.asyncHooks;
        if (prev !== cur) {
            config.asyncHooks = cur;
            if (cur) {
                enableAsyncHooks();
            } else {
                disableAsyncHooks();
            }
        }
    }
    return Promise;
};

function defaultFireEvent() { return false; }

Promise.prototype._fireEvent = defaultFireEvent;
Promise.prototype._execute = function(executor, resolve, reject) {
    try {
        executor(resolve, reject);
    } catch (e) {
        return e;
    }
};
Promise.prototype._onCancel = function () {};
Promise.prototype._setOnCancel = function (handler) { ; };
Promise.prototype._attachCancellationCallback = function(onCancel) {
    ;
};
Promise.prototype._captureStackTrace = function () {};
Promise.prototype._attachExtraTrace = function () {};
Promise.prototype._dereferenceTrace = function () {};
Promise.prototype._clearCancellationData = function() {};
Promise.prototype._propagateFrom = function (parent, flags) {
    ;
    ;
};

function cancellationExecute(executor, resolve, reject) {
    var promise = this;
    try {
        executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
                throw new TypeError("onCancel must be a function, got: " +
                                    util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
        });
    } catch (e) {
        return e;
    }
}

function cancellationAttachCancellationCallback(onCancel) {
    if (!this._isCancellable()) return this;

    var previousOnCancel = this._onCancel();
    if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
        } else {
            this._setOnCancel([previousOnCancel, onCancel]);
        }
    } else {
        this._setOnCancel(onCancel);
    }
}

function cancellationOnCancel() {
    return this._onCancelField;
}

function cancellationSetOnCancel(onCancel) {
    this._onCancelField = onCancel;
}

function cancellationClearCancellationData() {
    this._cancellationParent = undefined;
    this._onCancelField = undefined;
}

function cancellationPropagateFrom(parent, flags) {
    if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
            branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
    }
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}

function bindingPropagateFrom(parent, flags) {
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}
var propagateFromFunction = bindingPropagateFrom;

function boundValueFunction() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
}

function longStackTracesCaptureStackTrace() {
    this._trace = new CapturedTrace(this._peekContext());
}

function longStackTracesAttachExtraTrace(error, ignoreSelf) {
    if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
}

function longStackTracesDereferenceTrace() {
    this._trace = undefined;
}

function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                               parent) {
    if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;
        if ((promise._bitField & 65535) === 0) return;

        if (name) name = name + " ";
        var handlerLine = "";
        var creatorLine = "";
        if (promiseCreated._trace) {
            var traceLines = promiseCreated._trace.stack.split("\n");
            var stack = cleanStack(traceLines);
            for (var i = stack.length - 1; i >= 0; --i) {
                var line = stack[i];
                if (!nodeFramePattern.test(line)) {
                    var lineMatches = line.match(parseLinePattern);
                    if (lineMatches) {
                        handlerLine  = "at " + lineMatches[1] +
                            ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
                    }
                    break;
                }
            }

            if (stack.length > 0) {
                var firstUserLine = stack[0];
                for (var i = 0; i < traceLines.length; ++i) {

                    if (traceLines[i] === firstUserLine) {
                        if (i > 0) {
                            creatorLine = "\n" + traceLines[i - 1];
                        }
                        break;
                    }
                }

            }
        }
        var msg = "a promise was created in a " + name +
            "handler " + handlerLine + "but was not returned from it, " +
            "see http://goo.gl/rRqMUw" +
            creatorLine;
        promise._warn(msg, true, promiseCreated);
    }
}

function deprecated(name, replacement) {
    var message = name +
        " is deprecated and will be removed in a future version.";
    if (replacement) message += " Use " + replacement + " instead.";
    return warn(message);
}

function warn(message, shouldUseOwnTrace, promise) {
    if (!config.warnings) return;
    var warning = new Warning(message);
    var ctx;
    if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
    } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }

    if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
    }
}

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
            stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0 && error.name != "SyntaxError") {
        stack = stack.slice(i);
    }
    return stack;
}

function parseStackAndMessage(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: error.name == "SyntaxError" ? stack : cleanStack(stack)
    };
}

function formatAndLogError(error, title, isSoft) {
    if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof printWarning === "function") {
            printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
}

function fireRejectionEvent(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
        }
    } else {
        activeFireEvent(name, promise);
    }
}

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj && typeof obj.toString === "function"
            ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

function longStackTracesIsSupported() {
    return typeof captureStackTrace === "function";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}

function setBounds(firstLineError, lastLineError) {
    if (!longStackTracesIsSupported()) return;
    var firstStackLines = (firstLineError.stack || "").split("\n");
    var lastStackLines = (lastLineError.stack || "").split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
}

function CapturedTrace(parent) {
    this._parent = parent;
    this._promisesCreated = 0;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);
Context.CapturedTrace = CapturedTrace;

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit += 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit -= 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    printWarning = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
            var color = isSoft ? "\u001b[33m" : "\u001b[31m";
            console.warn(color + message + "\u001b[0m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
            console.warn("%c" + message,
                        isSoft ? "color: darkorange" : "color: red");
        };
    }
}

var config = {
    warnings: warnings,
    longStackTraces: false,
    cancellation: false,
    monitoring: false,
    asyncHooks: false
};

if (longStackTraces) Promise.longStackTraces();

return {
    asyncHooks: function() {
        return config.asyncHooks;
    },
    longStackTraces: function() {
        return config.longStackTraces;
    },
    warnings: function() {
        return config.warnings;
    },
    cancellation: function() {
        return config.cancellation;
    },
    monitoring: function() {
        return config.monitoring;
    },
    propagateFromFunction: function() {
        return propagateFromFunction;
    },
    boundValueFunction: function() {
        return boundValueFunction;
    },
    checkForgottenReturns: checkForgottenReturns,
    setBounds: setBounds,
    warn: warn,
    deprecated: deprecated,
    CapturedTrace: CapturedTrace,
    fireDomEvent: fireDomEvent,
    fireGlobalEvent: fireGlobalEvent
};
};

},{"./errors":9,"./es5":10,"./util":21}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function returner() {
    return this.value;
}
function thrower() {
    throw this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value instanceof Promise) value.suppressUnhandledRejections();
    return this._then(
        returner, undefined, undefined, {value: value}, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    return this._then(
        thrower, undefined, undefined, {reason: reason}, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length <= 1) {
        return this._then(
            undefined, thrower, undefined, {reason: reason}, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
            undefined, returner, undefined, {value: value}, undefined);
    } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};

},{}],9:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5":10,"./util":21}],10:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],11:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, tryConvertToPromise, NEXT_FILTER) {
var util = _dereq_("./util");
var CancellationError = Promise.CancellationError;
var errorObj = util.errorObj;
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);

function PassThroughHandlerContext(promise, type, handler) {
    this.promise = promise;
    this.type = type;
    this.handler = handler;
    this.called = false;
    this.cancelPromise = null;
}

PassThroughHandlerContext.prototype.isFinallyHandler = function() {
    return this.type === 0;
};

function FinallyHandlerCancelReaction(finallyHandler) {
    this.finallyHandler = finallyHandler;
}

FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
    checkCancel(this.finallyHandler);
};

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue());
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
            ? handler.call(promise._boundValue())
            : handler.call(promise._boundValue(), reasonOrValue);
        if (ret === NEXT_FILTER) {
            return ret;
        } else if (ret !== undefined) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                if (this.cancelPromise != null) {
                    if (maybePromise._isCancelled()) {
                        var reason =
                            new CancellationError("late cancellation observer");
                        promise._attachExtraTrace(reason);
                        errorObj.e = reason;
                        return errorObj;
                    } else if (maybePromise.isPending()) {
                        maybePromise._attachCancellationCallback(
                            new FinallyHandlerCancelReaction(this));
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, type, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success,
                      fail,
                      undefined,
                      new PassThroughHandlerContext(this, type, handler),
                      undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler,
                             0,
                             finallyHandler,
                             finallyHandler);
};


Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, 1, finallyHandler);
};

Promise.prototype.tapCatch = function (handlerOrPredicate) {
    var len = arguments.length;
    if(len === 1) {
        return this._passThrough(handlerOrPredicate,
                                 1,
                                 undefined,
                                 finallyHandler);
    } else {
         var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(new TypeError(
                    "tapCatch statement predicate: "
                    + "expecting an object but got " + util.classString(item)
                ));
            }
        }
        catchInstances.length = j;
        var handler = arguments[i];
        return this._passThrough(catchFilter(catchInstances, handler, this),
                                 1,
                                 undefined,
                                 finallyHandler);
    }

};

return PassThroughHandlerContext;
};

},{"./catch_filter":5,"./util":21}],12:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var promiseSetter = function(i) {
        return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
    };

    var generateHolderClass = function(total) {
        var props = new Array(total);
        for (var i = 0; i < props.length; ++i) {
            props[i] = "this.p" + (i+1);
        }
        var assignment = props.join(" = ") + " = null;";
        var cancellationCode= "var promise;\n" + props.map(function(prop) {
            return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
        }).join("\n");
        var passedArguments = props.join(", ");
        var name = "Holder$" + total;


        var code = "return function(tryCatch, errorObj, Promise, async) {    \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.asyncNeeded = true;                                     \n\
                this.now = 0;                                                \n\
            }                                                                \n\
                                                                             \n\
            [TheName].prototype._callFunction = function(promise) {          \n\
                promise._pushContext();                                      \n\
                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n\
                promise._popContext();                                       \n\
                if (ret === errorObj) {                                      \n\
                    promise._rejectCallback(ret.e, false);                   \n\
                } else {                                                     \n\
                    promise._resolveCallback(ret);                           \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    if (this.asyncNeeded) {                                  \n\
                        async.invoke(this._callFunction, this, promise);     \n\
                    } else {                                                 \n\
                        this._callFunction(promise);                         \n\
                    }                                                        \n\
                                                                             \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise, async);                               \n\
        ";

        code = code.replace(/\[TheName\]/g, name)
            .replace(/\[TheTotal\]/g, total)
            .replace(/\[ThePassedArguments\]/g, passedArguments)
            .replace(/\[TheProperties\]/g, assignment)
            .replace(/\[CancellationCode\]/g, cancellationCode);

        return new Function("tryCatch", "errorObj", "Promise", "async", code)
                           (tryCatch, errorObj, Promise, async);
    };

    var holderClasses = [];
    var thenCallbacks = [];
    var promiseSetters = [];

    for (var i = 0; i < 8; ++i) {
        holderClasses.push(generateHolderClass(i + 1));
        thenCallbacks.push(thenCallback(i + 1));
        promiseSetters.push(promiseSetter(i + 1));
    }

    reject = function (reason) {
        this._reject(reason);
    };
}}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last <= 8 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var HolderClass = holderClasses[last - 1];
                var holder = new HolderClass(fn);
                var callbacks = thenCallbacks;

                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        var bitField = maybePromise._bitField;
                        ;
                        if (((bitField & 50397184) === 0)) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                            promiseSetters[i](maybePromise, holder);
                            holder.asyncNeeded = false;
                        } else if (((bitField & 33554432) !== 0)) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else if (((bitField & 16777216) !== 0)) {
                            ret._reject(maybePromise._reason());
                        } else {
                            ret._cancel();
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }

                if (!ret._isFateSealed()) {
                    if (holder.asyncNeeded) {
                        var context = Promise._getContext();
                        holder.fn = util.contextBind(context, holder.fn);
                    }
                    ret._setAsyncGuaranteed();
                    ret._setOnCancel(holder);
                }
                return ret;
            }
        }
    }
    var args = [].slice.call(arguments);;
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util":21}],13:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value;
    if (arguments.length > 1) {
        debug.deprecated("calling Promise.try with more than 1 argument");
        var arg = arguments[1];
        var ctx = arguments[2];
        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
                                  : tryCatch(fn).call(ctx, arg);
    } else {
        value = tryCatch(fn)();
    }
    var promiseCreated = ret._popContext();
    debug.checkForgottenReturns(
        value, promiseCreated, "Promise.try", ret);
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util":21}],14:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors");
var OperationalError = errors.OperationalError;
var es5 = _dereq_("./es5");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
        if (promise === null) return;
        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (!multiArgs) {
            promise._fulfill(value);
        } else {
            var args = [].slice.call(arguments, 1);;
            promise._fulfill(args);
        }
        promise = null;
    };
}

module.exports = nodebackForPromise;

},{"./errors":9,"./es5":10,"./util":21}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
function Proxyable() {}
var UNDEFINED_BINDING = {};
var util = _dereq_("./util");
util.setReflectHandler(reflectHandler);

var getDomain = function() {
    var domain = process.domain;
    if (domain === undefined) {
        return null;
    }
    return domain;
};
var getContextDefault = function() {
    return null;
};
var getContextDomain = function() {
    return {
        domain: getDomain(),
        async: null
    };
};
var AsyncResource = util.isNode && util.nodeSupportsAsyncResource ?
    _dereq_("async_hooks").AsyncResource : null;
var getContextAsyncHooks = function() {
    return {
        domain: getDomain(),
        async: new AsyncResource("Bluebird::Promise")
    };
};
var getContext = util.isNode ? getContextDomain : getContextDefault;
util.notEnumerableProp(Promise, "_getContext", getContext);
var enableAsyncHooks = function() {
    getContext = getContextAsyncHooks;
    util.notEnumerableProp(Promise, "_getContext", getContextAsyncHooks);
};
var disableAsyncHooks = function() {
    getContext = getContextDomain;
    util.notEnumerableProp(Promise, "_getContext", getContextDomain);
};

var es5 = _dereq_("./es5");
var Async = _dereq_("./async");
var async = new Async();
es5.defineProperty(Promise, "_async", {value: async});
var errors = _dereq_("./errors");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
var CancellationError = Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = _dereq_("./thenables")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array")(Promise, INTERNAL,
                               tryConvertToPromise, apiRejection, Proxyable);
var Context = _dereq_("./context")(Promise);
 /*jshint unused:false*/
var createContext = Context.create;

var debug = _dereq_("./debuggability")(Promise, Context,
    enableAsyncHooks, disableAsyncHooks);
var CapturedTrace = debug.CapturedTrace;
var PassThroughHandlerContext =
    _dereq_("./finally")(Promise, tryConvertToPromise, NEXT_FILTER);
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);
var nodebackForPromise = _dereq_("./nodeback");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, executor) {
    if (self == null || self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
    }

}

function Promise(executor) {
    if (executor !== INTERNAL) {
        check(this, executor);
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._resolveFromExecutor(executor);
    this._promiseCreated();
    this._fireEvent("promiseCreated", this);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection("Catch statement predicate: " +
                    "expecting an object but got " + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];

        if (typeof fn !== "function") {
            throw new TypeError("The last argument to .catch() " +
                "must be a function, got " + util.toString(fn));
        }
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.getNewLibraryCopy = module.exports;

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = Promise.fromCallback = function(fn) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
                                         : false;
    var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    return async.setScheduler(fn);
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _,    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);
    var target = this._target();
    var bitField = target._bitField;

    if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
            ((this._bitField & 2097152) !== 0)) {
            if (!((bitField & 50397184) === 0)) {
                receiver = this._boundValue();
            } else {
                receiver = target === this ? undefined : this._boundTo;
            }
        }
        this._fireEvent("promiseChained", this, promise);
    }

    var context = getContext();
    if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
            value = target._rejectionHandler0;
            handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
        }

        async.invoke(settler, target, {
            handler: util.contextBind(context, handler),
            promise: promise,
            receiver: receiver,
            value: value
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise,
                receiver, context);
    }

    return promise;
};

Promise.prototype._length = function () {
    return this._bitField & 65535;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & 117506048) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 67108864) === 67108864;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -65536) |
        (len & 65535);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 33554432;
    this._fireEvent("promiseFulfilled", this);
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 16777216;
    this._fireEvent("promiseRejected", this);
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 67108864;
    this._fireEvent("promiseResolved", this);
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~65536);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | 65536;
    this._fireEvent("promiseCancelled", this);
};

Promise.prototype._setWillBeCancelled = function() {
    this._bitField = this._bitField | 8388608;
};

Promise.prototype._setAsyncGuaranteed = function() {
    if (async.hasCustomScheduler()) return;
    var bitField = this._bitField;
    this._bitField = bitField |
        (((bitField & 536870912) >> 2) ^
        134217728);
};

Promise.prototype._setNoAsyncGuarantee = function() {
    this._bitField = (this._bitField | 536870912) &
        (~134217728);
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0 ? this._receiver0 : this[
            index * 4 - 4 + 3];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return this[
            index * 4 - 4 + 2];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 1];
};

Promise.prototype._boundValue = function() {};

Promise.prototype._migrateCallback0 = function (follower) {
    var bitField = follower._bitField;
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiverAt(0);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver,
    context
) {
    var index = this._length();

    if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
            this._fulfillmentHandler0 = util.contextBind(context, fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 = util.contextBind(context, reject);
        }
    } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                util.contextBind(context, fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                util.contextBind(context, reject);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxy = function (proxyable, arg) {
    this._addCallbacks(undefined, undefined, arg, proxyable, null);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (((this._bitField & 117506048) !== 0)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, 2);


    var promise = maybePromise._target();

    if (promise === this) {
        this._reject(makeSelfResolutionError());
        return;
    }

    var bitField = promise._bitField;
    if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(maybePromise);
    } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
    } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
    } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, ignoreNonErrorWarnings) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason);
};

Promise.prototype._resolveFromExecutor = function (executor) {
    if (executor === INTERNAL) return;
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        promise._rejectCallback(r, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundValue(), value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promiseCreated = promise._popContext();
    bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj) {
        promise._rejectCallback(x.e, false);
    } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var asyncGuaranteed = ((bitField & 134217728) !== 0);
    if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
            receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            if (asyncGuaranteed) promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
            if (((bitField & 33554432) !== 0)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
            promise._fulfill(value);
        } else {
            promise._reject(value);
        }
    }
};

Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
    var handler = ctx.handler;
    var promise = ctx.promise;
    var receiver = ctx.receiver;
    var value = ctx.value;
    if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (promise instanceof Promise) {
        promise._reject(value);
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
};

Promise.prototype._settlePromise0 = function(handler, value, bitField) {
    var promise = this._promise0;
    var receiver = this._receiverAt(0);
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settlePromise(promise, handler, receiver, value);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    var base = index * 4 - 4;
    this[base + 2] =
    this[base + 3] =
    this[base + 0] =
    this[base + 1] = undefined;
};

Promise.prototype._fulfill = function (value) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
    }
    this._setFulfilled();
    this._rejectionHandler0 = value;

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
        this._dereferenceTrace();
    }
};

Promise.prototype._reject = function (reason) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    this._setRejected();
    this._fulfillmentHandler0 = reason;

    if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
    }

    if ((bitField & 65535) > 0) {
        async.settlePromises(this);
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len, value) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
    }
};

Promise.prototype._rejectPromises = function (len, reason) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = (bitField & 65535);

    if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
        } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
        }
        this._setLength(0);
    }
    this._clearCancellationData();
};

Promise.prototype._settledValue = function() {
    var bitField = this._bitField;
    if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
    } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
    }
};

if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
    es5.defineProperty(Promise.prototype, Symbol.toStringTag, {
        get: function () {
            return "Object";
        }
    });
}

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = Promise.pending = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
    debug);
_dereq_("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
_dereq_("./cancel")(Promise, PromiseArray, apiRejection, debug);
_dereq_("./direct_resolve")(Promise);
_dereq_("./synchronous_inspection")(Promise);
_dereq_("./join")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, async);
Promise.Promise = Promise;
Promise.version = "3.7.1";

    util.toFastProperties(Promise);
    util.toFastProperties(Promise.prototype);
    function fillTypes(value) {
        var p = new Promise(INTERNAL);
        p._fulfillmentHandler0 = value;
        p._rejectionHandler0 = value;
        p._promise0 = value;
        p._receiver0 = value;
    }
    // Complete slack tracking, opt out of field-type tracking and
    // stabilize map
    fillTypes({a: 1});
    fillTypes({b: 2});
    fillTypes({c: 3});
    fillTypes(1);
    fillTypes(function(){});
    fillTypes(undefined);
    fillTypes(false);
    fillTypes(new Promise(INTERNAL));
    debug.setBounds(Async.firstLineError, util.lastLineError);
    return Promise;

};

},{"./async":1,"./bind":2,"./cancel":4,"./catch_filter":5,"./context":6,"./debuggability":7,"./direct_resolve":8,"./errors":9,"./es5":10,"./finally":11,"./join":12,"./method":13,"./nodeback":14,"./promise_array":16,"./synchronous_inspection":19,"./thenables":20,"./util":21,"async_hooks":undefined}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var util = _dereq_("./util");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    case -6: return new Map();
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
        values.suppressUnhandledRejections();
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (((bitField & 33554432) !== 0)) {
            values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (((bitField & 50397184) === 0)) {
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (((bitField & 33554432) !== 0)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (((bitField & 16777216) !== 0)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise._isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util":21}],17:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],18:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var NativePromise = util.getNativePromise();
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if (typeof NativePromise === "function" &&
           typeof NativePromise.resolve === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
        nativePromise.then(fn);
    };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            (window.navigator.standalone || window.cordova)) &&
          ("classList" in document.documentElement)) {
    schedule = (function() {
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
            toggleScheduled = true;
            div2.classList.toggle("foo");
        };

        return function schedule(fn) {
            var o = new MutationObserver(function() {
                o.disconnect();
                fn();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":21}],19:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
            ? promise._settledValue() : undefined;
    }
    else {
        this._bitField = 0;
        this._settledValueField = undefined;
    }
}

PromiseInspection.prototype._settledValue = function() {
    return this._settledValueField;
};

var value = PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var reason = PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
    return (this._bitField & 33554432) !== 0;
};

var isRejected = PromiseInspection.prototype.isRejected = function () {
    return (this._bitField & 16777216) !== 0;
};

var isPending = PromiseInspection.prototype.isPending = function () {
    return (this._bitField & 50397184) === 0;
};

var isResolved = PromiseInspection.prototype.isResolved = function () {
    return (this._bitField & 50331648) !== 0;
};

PromiseInspection.prototype.isCancelled = function() {
    return (this._bitField & 8454144) !== 0;
};

Promise.prototype.__isCancelled = function() {
    return (this._bitField & 65536) === 65536;
};

Promise.prototype._isCancelled = function() {
    return this._target().__isCancelled();
};

Promise.prototype.isCancelled = function() {
    return (this._target()._bitField & 8454144) !== 0;
};

Promise.prototype.isPending = function() {
    return isPending.call(this._target());
};

Promise.prototype.isRejected = function() {
    return isRejected.call(this._target());
};

Promise.prototype.isFulfilled = function() {
    return isFulfilled.call(this._target());
};

Promise.prototype.isResolved = function() {
    return isResolved.call(this._target());
};

Promise.prototype.value = function() {
    return value.call(this._target());
};

Promise.prototype.reason = function() {
    var target = this._target();
    target._unsetRejectionIsUnhandled();
    return reason.call(target);
};

Promise.prototype._value = function() {
    return this._settledValue();
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue();
};

Promise.PromiseInspection = PromiseInspection;
};

},{}],20:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
                var ret = new Promise(INTERNAL);
                obj._then(
                    ret._fulfill,
                    ret._reject,
                    undefined,
                    ret,
                    null
                );
                return ret;
            }
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function doGetThen(obj) {
    return obj.then;
}

function getThen(obj) {
    try {
        return doGetThen(obj);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    try {
        return hasProp.call(obj, "_promise0");
    } catch (e) {
        return false;
    }
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x, resolve, reject);
    synchronous = false;

    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util":21}],21:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var canEvaluate = typeof navigator == "undefined";

var errorObj = {e: {}};
var tryCatchTarget;
var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    typeof global !== "undefined" ? global :
    this !== undefined ? this : null;

function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return typeof value === "function" ||
           typeof value === "object" && value !== null;
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var receiver = new FakeConstructor();
    function ic() {
        return typeof receiver.foo;
    }
    ic();
    ic();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function isError(obj) {
    return obj instanceof Error ||
        (obj !== null &&
           typeof obj === "object" &&
           typeof obj.message === "string" &&
           typeof obj.name === "string");
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var asArray = function(v) {
    if (es5.isArray(v)) {
        return v;
    }
    return null;
};

if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
    } : function(v) {
        var ret = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!((itResult = it.next()).done)) {
            ret.push(itResult.value);
        }
        return ret;
    };

    asArray = function(v) {
        if (es5.isArray(v)) {
            return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
            return ArrayFrom(v);
        }
        return null;
    };
}

var isNode = typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]";

var hasEnvVariables = typeof process !== "undefined" &&
    typeof process.env !== "undefined";

function env(key) {
    return hasEnvVariables ? process.env[key] : undefined;
}

function getNativePromise() {
    if (typeof Promise === "function") {
        try {
            var promise = new Promise(function(){});
            if (classString(promise) === "[object Promise]") {
                return Promise;
            }
        } catch (e) {}
    }
}

var reflectHandler;
function contextBind(ctx, cb) {
    if (ctx === null ||
        typeof cb !== "function" ||
        cb === reflectHandler) {
        return cb;
    }

    if (ctx.domain !== null) {
        cb = ctx.domain.bind(cb);
    }

    var async = ctx.async;
    if (async !== null) {
        var old = cb;
        cb = function() {
            var args = (new Array(2)).concat([].slice.call(arguments));;
            args[0] = old;
            args[1] = this;
            return async.runInAsyncScope.apply(async, args);
        };
    }
    return cb;
}

var ret = {
    setReflectHandler: function(fn) {
        reflectHandler = fn;
    },
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    isNode: isNode,
    hasEnvVariables: hasEnvVariables,
    env: env,
    global: globalObject,
    getNativePromise: getNativePromise,
    contextBind: contextBind
};
ret.isRecentNode = ret.isNode && (function() {
    var version;
    if (process.versions && process.versions.node) {
        version = process.versions.node.split(".").map(Number);
    } else if (process.version) {
        version = process.version.split(".").map(Number);
    }
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();
ret.nodeSupportsAsyncResource = ret.isNode && (function() {
    var supportsAsync = false;
    try {
        var res = _dereq_("async_hooks").AsyncResource;
        supportsAsync = typeof res.prototype.runInAsyncScope === "function";
    } catch (e) {
        supportsAsync = false;
    }
    return supportsAsync;
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5":10,"async_hooks":undefined}]},{},[3])(3)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
/*
 RequireJS 2.2.0 Copyright jQuery Foundation and other contributors.
 Released under MIT license, http://github.com/requirejs/requirejs/LICENSE
*/
var requirejs,require,define;
(function(ga){function ka(b,c,d,g){return g||""}function K(b){return"[object Function]"===Q.call(b)}function L(b){return"[object Array]"===Q.call(b)}function y(b,c){if(b){var d;for(d=0;d<b.length&&(!b[d]||!c(b[d],d,b));d+=1);}}function X(b,c){if(b){var d;for(d=b.length-1;-1<d&&(!b[d]||!c(b[d],d,b));--d);}}function x(b,c){return la.call(b,c)}function e(b,c){return x(b,c)&&b[c]}function D(b,c){for(var d in b)if(x(b,d)&&c(b[d],d))break}function Y(b,c,d,g){c&&D(c,function(c,e){if(d||!x(b,e))!g||"object"!==
typeof c||!c||L(c)||K(c)||c instanceof RegExp?b[e]=c:(b[e]||(b[e]={}),Y(b[e],c,d,g))});return b}function z(b,c){return function(){return c.apply(b,arguments)}}function ha(b){throw b;}function ia(b){if(!b)return b;var c=ga;y(b.split("."),function(b){c=c[b]});return c}function F(b,c,d,g){c=Error(c+"\nhttp://requirejs.org/docs/errors.html#"+b);c.requireType=b;c.requireModules=g;d&&(c.originalError=d);return c}function ma(b){function c(a,n,b){var h,k,f,c,d,l,g,r;n=n&&n.split("/");var q=p.map,m=q&&q["*"];
if(a){a=a.split("/");k=a.length-1;p.nodeIdCompat&&U.test(a[k])&&(a[k]=a[k].replace(U,""));"."===a[0].charAt(0)&&n&&(k=n.slice(0,n.length-1),a=k.concat(a));k=a;for(f=0;f<k.length;f++)c=k[f],"."===c?(k.splice(f,1),--f):".."===c&&0!==f&&(1!==f||".."!==k[2])&&".."!==k[f-1]&&0<f&&(k.splice(f-1,2),f-=2);a=a.join("/")}if(b&&q&&(n||m)){k=a.split("/");f=k.length;a:for(;0<f;--f){d=k.slice(0,f).join("/");if(n)for(c=n.length;0<c;--c)if(b=e(q,n.slice(0,c).join("/")))if(b=e(b,d)){h=b;l=f;break a}!g&&m&&e(m,d)&&
(g=e(m,d),r=f)}!h&&g&&(h=g,l=r);h&&(k.splice(0,l,h),a=k.join("/"))}return(h=e(p.pkgs,a))?h:a}function d(a){E&&y(document.getElementsByTagName("script"),function(n){if(n.getAttribute("data-requiremodule")===a&&n.getAttribute("data-requirecontext")===l.contextName)return n.parentNode.removeChild(n),!0})}function m(a){var n=e(p.paths,a);if(n&&L(n)&&1<n.length)return n.shift(),l.require.undef(a),l.makeRequire(null,{skipMap:!0})([a]),!0}function r(a){var n,b=a?a.indexOf("!"):-1;-1<b&&(n=a.substring(0,
b),a=a.substring(b+1,a.length));return[n,a]}function q(a,n,b,h){var k,f,d=null,g=n?n.name:null,p=a,q=!0,m="";a||(q=!1,a="_@r"+(Q+=1));a=r(a);d=a[0];a=a[1];d&&(d=c(d,g,h),f=e(v,d));a&&(d?m=f&&f.normalize?f.normalize(a,function(a){return c(a,g,h)}):-1===a.indexOf("!")?c(a,g,h):a:(m=c(a,g,h),a=r(m),d=a[0],m=a[1],b=!0,k=l.nameToUrl(m)));b=!d||f||b?"":"_unnormalized"+(T+=1);return{prefix:d,name:m,parentMap:n,unnormalized:!!b,url:k,originalName:p,isDefine:q,id:(d?d+"!"+m:m)+b}}function u(a){var b=a.id,
c=e(t,b);c||(c=t[b]=new l.Module(a));return c}function w(a,b,c){var h=a.id,k=e(t,h);if(!x(v,h)||k&&!k.defineEmitComplete)if(k=u(a),k.error&&"error"===b)c(k.error);else k.on(b,c);else"defined"===b&&c(v[h])}function A(a,b){var c=a.requireModules,h=!1;if(b)b(a);else if(y(c,function(b){if(b=e(t,b))b.error=a,b.events.error&&(h=!0,b.emit("error",a))}),!h)g.onError(a)}function B(){V.length&&(y(V,function(a){var b=a[0];"string"===typeof b&&(l.defQueueMap[b]=!0);G.push(a)}),V=[])}function C(a){delete t[a];
delete Z[a]}function J(a,b,c){var h=a.map.id;a.error?a.emit("error",a.error):(b[h]=!0,y(a.depMaps,function(h,f){var d=h.id,g=e(t,d);!g||a.depMatched[f]||c[d]||(e(b,d)?(a.defineDep(f,v[d]),a.check()):J(g,b,c))}),c[h]=!0)}function H(){var a,b,c=(a=1E3*p.waitSeconds)&&l.startTime+a<(new Date).getTime(),h=[],k=[],f=!1,g=!0;if(!aa){aa=!0;D(Z,function(a){var l=a.map,e=l.id;if(a.enabled&&(l.isDefine||k.push(a),!a.error))if(!a.inited&&c)m(e)?f=b=!0:(h.push(e),d(e));else if(!a.inited&&a.fetched&&l.isDefine&&
(f=!0,!l.prefix))return g=!1});if(c&&h.length)return a=F("timeout","Load timeout for modules: "+h,null,h),a.contextName=l.contextName,A(a);g&&y(k,function(a){J(a,{},{})});c&&!b||!f||!E&&!ja||ba||(ba=setTimeout(function(){ba=0;H()},50));aa=!1}}function I(a){x(v,a[0])||u(q(a[0],null,!0)).init(a[1],a[2])}function O(a){a=a.currentTarget||a.srcElement;var b=l.onScriptLoad;a.detachEvent&&!ca?a.detachEvent("onreadystatechange",b):a.removeEventListener("load",b,!1);b=l.onScriptError;a.detachEvent&&!ca||a.removeEventListener("error",
b,!1);return{node:a,id:a&&a.getAttribute("data-requiremodule")}}function P(){var a;for(B();G.length;){a=G.shift();if(null===a[0])return A(F("mismatch","Mismatched anonymous define() module: "+a[a.length-1]));I(a)}l.defQueueMap={}}var aa,da,l,R,ba,p={waitSeconds:2,baseUrl:"./",paths:{},bundles:{},pkgs:{},shim:{},config:{}},t={},Z={},ea={},G=[],v={},W={},fa={},Q=1,T=1;R={require:function(a){return a.require?a.require:a.require=l.makeRequire(a.map)},exports:function(a){a.usingExports=!0;if(a.map.isDefine)return a.exports?
v[a.map.id]=a.exports:a.exports=v[a.map.id]={}},module:function(a){return a.module?a.module:a.module={id:a.map.id,uri:a.map.url,config:function(){return e(p.config,a.map.id)||{}},exports:a.exports||(a.exports={})}}};da=function(a){this.events=e(ea,a.id)||{};this.map=a;this.shim=e(p.shim,a.id);this.depExports=[];this.depMaps=[];this.depMatched=[];this.pluginMaps={};this.depCount=0};da.prototype={init:function(a,b,c,h){h=h||{};if(!this.inited){this.factory=b;if(c)this.on("error",c);else this.events.error&&
(c=z(this,function(a){this.emit("error",a)}));this.depMaps=a&&a.slice(0);this.errback=c;this.inited=!0;this.ignore=h.ignore;h.enabled||this.enabled?this.enable():this.check()}},defineDep:function(a,b){this.depMatched[a]||(this.depMatched[a]=!0,--this.depCount,this.depExports[a]=b)},fetch:function(){if(!this.fetched){this.fetched=!0;l.startTime=(new Date).getTime();var a=this.map;if(this.shim)l.makeRequire(this.map,{enableBuildCallback:!0})(this.shim.deps||[],z(this,function(){return a.prefix?this.callPlugin():
this.load()}));else return a.prefix?this.callPlugin():this.load()}},load:function(){var a=this.map.url;W[a]||(W[a]=!0,l.load(this.map.id,a))},check:function(){if(this.enabled&&!this.enabling){var a,b,c=this.map.id;b=this.depExports;var h=this.exports,k=this.factory;if(!this.inited)x(l.defQueueMap,c)||this.fetch();else if(this.error)this.emit("error",this.error);else if(!this.defining){this.defining=!0;if(1>this.depCount&&!this.defined){if(K(k)){if(this.events.error&&this.map.isDefine||g.onError!==
ha)try{h=l.execCb(c,k,b,h)}catch(d){a=d}else h=l.execCb(c,k,b,h);this.map.isDefine&&void 0===h&&((b=this.module)?h=b.exports:this.usingExports&&(h=this.exports));if(a)return a.requireMap=this.map,a.requireModules=this.map.isDefine?[this.map.id]:null,a.requireType=this.map.isDefine?"define":"require",A(this.error=a)}else h=k;this.exports=h;if(this.map.isDefine&&!this.ignore&&(v[c]=h,g.onResourceLoad)){var f=[];y(this.depMaps,function(a){f.push(a.normalizedMap||a)});g.onResourceLoad(l,this.map,f)}C(c);
this.defined=!0}this.defining=!1;this.defined&&!this.defineEmitted&&(this.defineEmitted=!0,this.emit("defined",this.exports),this.defineEmitComplete=!0)}}},callPlugin:function(){var a=this.map,b=a.id,d=q(a.prefix);this.depMaps.push(d);w(d,"defined",z(this,function(h){var k,f,d=e(fa,this.map.id),M=this.map.name,r=this.map.parentMap?this.map.parentMap.name:null,m=l.makeRequire(a.parentMap,{enableBuildCallback:!0});if(this.map.unnormalized){if(h.normalize&&(M=h.normalize(M,function(a){return c(a,r,!0)})||
""),f=q(a.prefix+"!"+M,this.map.parentMap),w(f,"defined",z(this,function(a){this.map.normalizedMap=f;this.init([],function(){return a},null,{enabled:!0,ignore:!0})})),h=e(t,f.id)){this.depMaps.push(f);if(this.events.error)h.on("error",z(this,function(a){this.emit("error",a)}));h.enable()}}else d?(this.map.url=l.nameToUrl(d),this.load()):(k=z(this,function(a){this.init([],function(){return a},null,{enabled:!0})}),k.error=z(this,function(a){this.inited=!0;this.error=a;a.requireModules=[b];D(t,function(a){0===
a.map.id.indexOf(b+"_unnormalized")&&C(a.map.id)});A(a)}),k.fromText=z(this,function(h,c){var d=a.name,f=q(d),M=S;c&&(h=c);M&&(S=!1);u(f);x(p.config,b)&&(p.config[d]=p.config[b]);try{g.exec(h)}catch(e){return A(F("fromtexteval","fromText eval for "+b+" failed: "+e,e,[b]))}M&&(S=!0);this.depMaps.push(f);l.completeLoad(d);m([d],k)}),h.load(a.name,m,k,p))}));l.enable(d,this);this.pluginMaps[d.id]=d},enable:function(){Z[this.map.id]=this;this.enabling=this.enabled=!0;y(this.depMaps,z(this,function(a,
b){var c,h;if("string"===typeof a){a=q(a,this.map.isDefine?this.map:this.map.parentMap,!1,!this.skipMap);this.depMaps[b]=a;if(c=e(R,a.id)){this.depExports[b]=c(this);return}this.depCount+=1;w(a,"defined",z(this,function(a){this.undefed||(this.defineDep(b,a),this.check())}));this.errback?w(a,"error",z(this,this.errback)):this.events.error&&w(a,"error",z(this,function(a){this.emit("error",a)}))}c=a.id;h=t[c];x(R,c)||!h||h.enabled||l.enable(a,this)}));D(this.pluginMaps,z(this,function(a){var b=e(t,a.id);
b&&!b.enabled&&l.enable(a,this)}));this.enabling=!1;this.check()},on:function(a,b){var c=this.events[a];c||(c=this.events[a]=[]);c.push(b)},emit:function(a,b){y(this.events[a],function(a){a(b)});"error"===a&&delete this.events[a]}};l={config:p,contextName:b,registry:t,defined:v,urlFetched:W,defQueue:G,defQueueMap:{},Module:da,makeModuleMap:q,nextTick:g.nextTick,onError:A,configure:function(a){a.baseUrl&&"/"!==a.baseUrl.charAt(a.baseUrl.length-1)&&(a.baseUrl+="/");if("string"===typeof a.urlArgs){var b=
a.urlArgs;a.urlArgs=function(a,c){return(-1===c.indexOf("?")?"?":"&")+b}}var c=p.shim,h={paths:!0,bundles:!0,config:!0,map:!0};D(a,function(a,b){h[b]?(p[b]||(p[b]={}),Y(p[b],a,!0,!0)):p[b]=a});a.bundles&&D(a.bundles,function(a,b){y(a,function(a){a!==b&&(fa[a]=b)})});a.shim&&(D(a.shim,function(a,b){L(a)&&(a={deps:a});!a.exports&&!a.init||a.exportsFn||(a.exportsFn=l.makeShimExports(a));c[b]=a}),p.shim=c);a.packages&&y(a.packages,function(a){var b;a="string"===typeof a?{name:a}:a;b=a.name;a.location&&
(p.paths[b]=a.location);p.pkgs[b]=a.name+"/"+(a.main||"main").replace(na,"").replace(U,"")});D(t,function(a,b){a.inited||a.map.unnormalized||(a.map=q(b,null,!0))});(a.deps||a.callback)&&l.require(a.deps||[],a.callback)},makeShimExports:function(a){return function(){var b;a.init&&(b=a.init.apply(ga,arguments));return b||a.exports&&ia(a.exports)}},makeRequire:function(a,n){function m(c,d,f){var e,r;n.enableBuildCallback&&d&&K(d)&&(d.__requireJsBuild=!0);if("string"===typeof c){if(K(d))return A(F("requireargs",
"Invalid require call"),f);if(a&&x(R,c))return R[c](t[a.id]);if(g.get)return g.get(l,c,a,m);e=q(c,a,!1,!0);e=e.id;return x(v,e)?v[e]:A(F("notloaded",'Module name "'+e+'" has not been loaded yet for context: '+b+(a?"":". Use require([])")))}P();l.nextTick(function(){P();r=u(q(null,a));r.skipMap=n.skipMap;r.init(c,d,f,{enabled:!0});H()});return m}n=n||{};Y(m,{isBrowser:E,toUrl:function(b){var d,f=b.lastIndexOf("."),g=b.split("/")[0];-1!==f&&("."!==g&&".."!==g||1<f)&&(d=b.substring(f,b.length),b=b.substring(0,
f));return l.nameToUrl(c(b,a&&a.id,!0),d,!0)},defined:function(b){return x(v,q(b,a,!1,!0).id)},specified:function(b){b=q(b,a,!1,!0).id;return x(v,b)||x(t,b)}});a||(m.undef=function(b){B();var c=q(b,a,!0),f=e(t,b);f.undefed=!0;d(b);delete v[b];delete W[c.url];delete ea[b];X(G,function(a,c){a[0]===b&&G.splice(c,1)});delete l.defQueueMap[b];f&&(f.events.defined&&(ea[b]=f.events),C(b))});return m},enable:function(a){e(t,a.id)&&u(a).enable()},completeLoad:function(a){var b,c,d=e(p.shim,a)||{},g=d.exports;
for(B();G.length;){c=G.shift();if(null===c[0]){c[0]=a;if(b)break;b=!0}else c[0]===a&&(b=!0);I(c)}l.defQueueMap={};c=e(t,a);if(!b&&!x(v,a)&&c&&!c.inited)if(!p.enforceDefine||g&&ia(g))I([a,d.deps||[],d.exportsFn]);else return m(a)?void 0:A(F("nodefine","No define call for "+a,null,[a]));H()},nameToUrl:function(a,b,c){var d,k,f,m;(d=e(p.pkgs,a))&&(a=d);if(d=e(fa,a))return l.nameToUrl(d,b,c);if(g.jsExtRegExp.test(a))d=a+(b||"");else{d=p.paths;k=a.split("/");for(f=k.length;0<f;--f)if(m=k.slice(0,f).join("/"),
m=e(d,m)){L(m)&&(m=m[0]);k.splice(0,f,m);break}d=k.join("/");d+=b||(/^data\:|^blob\:|\?/.test(d)||c?"":".js");d=("/"===d.charAt(0)||d.match(/^[\w\+\.\-]+:/)?"":p.baseUrl)+d}return p.urlArgs&&!/^blob\:/.test(d)?d+p.urlArgs(a,d):d},load:function(a,b){g.load(l,a,b)},execCb:function(a,b,c,d){return b.apply(d,c)},onScriptLoad:function(a){if("load"===a.type||oa.test((a.currentTarget||a.srcElement).readyState))N=null,a=O(a),l.completeLoad(a.id)},onScriptError:function(a){var b=O(a);if(!m(b.id)){var c=[];
D(t,function(a,d){0!==d.indexOf("_@r")&&y(a.depMaps,function(a){if(a.id===b.id)return c.push(d),!0})});return A(F("scripterror",'Script error for "'+b.id+(c.length?'", needed by: '+c.join(", "):'"'),a,[b.id]))}}};l.require=l.makeRequire();return l}function pa(){if(N&&"interactive"===N.readyState)return N;X(document.getElementsByTagName("script"),function(b){if("interactive"===b.readyState)return N=b});return N}var g,B,C,H,O,I,N,P,u,T,qa=/(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,ra=/[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
U=/\.js$/,na=/^\.\//;B=Object.prototype;var Q=B.toString,la=B.hasOwnProperty,E=!("undefined"===typeof window||"undefined"===typeof navigator||!window.document),ja=!E&&"undefined"!==typeof importScripts,oa=E&&"PLAYSTATION 3"===navigator.platform?/^complete$/:/^(complete|loaded)$/,ca="undefined"!==typeof opera&&"[object Opera]"===opera.toString(),J={},w={},V=[],S=!1;if("undefined"===typeof define){if("undefined"!==typeof requirejs){if(K(requirejs))return;w=requirejs;requirejs=void 0}"undefined"===typeof require||
K(require)||(w=require,require=void 0);g=requirejs=function(b,c,d,m){var r,q="_";L(b)||"string"===typeof b||(r=b,L(c)?(b=c,c=d,d=m):b=[]);r&&r.context&&(q=r.context);(m=e(J,q))||(m=J[q]=g.s.newContext(q));r&&m.configure(r);return m.require(b,c,d)};g.config=function(b){return g(b)};g.nextTick="undefined"!==typeof setTimeout?function(b){setTimeout(b,4)}:function(b){b()};require||(require=g);g.version="2.2.0";g.jsExtRegExp=/^\/|:|\?|\.js$/;g.isBrowser=E;B=g.s={contexts:J,newContext:ma};g({});y(["toUrl",
"undef","defined","specified"],function(b){g[b]=function(){var c=J._;return c.require[b].apply(c,arguments)}});E&&(C=B.head=document.getElementsByTagName("head")[0],H=document.getElementsByTagName("base")[0])&&(C=B.head=H.parentNode);g.onError=ha;g.createNode=function(b,c,d){c=b.xhtml?document.createElementNS("http://www.w3.org/1999/xhtml","html:script"):document.createElement("script");c.type=b.scriptType||"text/javascript";c.charset="utf-8";c.async=!0;return c};g.load=function(b,c,d){var m=b&&b.config||
{},e;if(E){e=g.createNode(m,c,d);e.setAttribute("data-requirecontext",b.contextName);e.setAttribute("data-requiremodule",c);!e.attachEvent||e.attachEvent.toString&&0>e.attachEvent.toString().indexOf("[native code")||ca?(e.addEventListener("load",b.onScriptLoad,!1),e.addEventListener("error",b.onScriptError,!1)):(S=!0,e.attachEvent("onreadystatechange",b.onScriptLoad));e.src=d;if(m.onNodeCreated)m.onNodeCreated(e,m,c,d);P=e;H?C.insertBefore(e,H):C.appendChild(e);P=null;return e}if(ja)try{setTimeout(function(){},
0),importScripts(d),b.completeLoad(c)}catch(q){b.onError(F("importscripts","importScripts failed for "+c+" at "+d,q,[c]))}};E&&!w.skipDataMain&&X(document.getElementsByTagName("script"),function(b){C||(C=b.parentNode);if(O=b.getAttribute("data-main"))return u=O,w.baseUrl||-1!==u.indexOf("!")||(I=u.split("/"),u=I.pop(),T=I.length?I.join("/")+"/":"./",w.baseUrl=T),u=u.replace(U,""),g.jsExtRegExp.test(u)&&(u=O),w.deps=w.deps?w.deps.concat(u):[u],!0});define=function(b,c,d){var e,g;"string"!==typeof b&&
(d=c,c=b,b=null);L(c)||(d=c,c=null);!c&&K(d)&&(c=[],d.length&&(d.toString().replace(qa,ka).replace(ra,function(b,d){c.push(d)}),c=(1===d.length?["require"]:["require","exports","module"]).concat(c)));S&&(e=P||pa())&&(b||(b=e.getAttribute("data-requiremodule")),g=J[e.getAttribute("data-requirecontext")]);g?(g.defQueue.push([b,c,d]),g.defQueueMap[b]=!0):V.push([b,c,d])};define.amd={jQuery:!0};g.exec=function(b){return eval(b)};g(w)}})(this);

requirejs.config({"baseUrl":"../","paths":{"text":"development/aurelia_project/text","assets/client":"../../client/assets/client"},"packages":[{"name":"aurelia-http-client","location":"aurelia-http-client/dist/amd","main":"aurelia-http-client"},{"name":"aurelia-animator-css","location":"aurelia-animator-css/dist/amd","main":"aurelia-animator-css"},{"name":"aurelia-binding","location":"aurelia-binding/dist/amd","main":"aurelia-binding"},{"name":"aurelia-bootstrapper","location":"aurelia-bootstrapper/dist/amd","main":"aurelia-bootstrapper"},{"name":"aurelia-dependency-injection","location":"aurelia-dependency-injection/dist/amd","main":"aurelia-dependency-injection"},{"name":"aurelia-event-aggregator","location":"aurelia-event-aggregator/dist/amd","main":"aurelia-event-aggregator"},{"name":"aurelia-framework","location":"aurelia-framework/dist/amd","main":"aurelia-framework"},{"name":"aurelia-history","location":"aurelia-history/dist/amd","main":"aurelia-history"},{"name":"aurelia-history-browser","location":"aurelia-history-browser/dist/amd","main":"aurelia-history-browser"},{"name":"aurelia-loader","location":"aurelia-loader/dist/amd","main":"aurelia-loader"},{"name":"aurelia-loader-default","location":"aurelia-loader-default/dist/amd","main":"aurelia-loader-default"},{"name":"aurelia-logging","location":"aurelia-logging/dist/amd","main":"aurelia-logging"},{"name":"aurelia-logging-console","location":"aurelia-logging-console/dist/amd","main":"aurelia-logging-console"},{"name":"aurelia-metadata","location":"aurelia-metadata/dist/amd","main":"aurelia-metadata"},{"name":"aurelia-pal","location":"aurelia-pal/dist/amd","main":"aurelia-pal"},{"name":"aurelia-pal-browser","location":"aurelia-pal-browser/dist/amd","main":"aurelia-pal-browser"},{"name":"aurelia-path","location":"aurelia-path/dist/amd","main":"aurelia-path"},{"name":"aurelia-polyfills","location":"aurelia-polyfills/dist/amd","main":"aurelia-polyfills"},{"name":"aurelia-route-recognizer","location":"aurelia-route-recognizer/dist/amd","main":"aurelia-route-recognizer"},{"name":"aurelia-router","location":"aurelia-router/dist/amd","main":"aurelia-router"},{"name":"aurelia-task-queue","location":"aurelia-task-queue/dist/amd","main":"aurelia-task-queue"},{"name":"aurelia-templating","location":"aurelia-templating/dist/amd","main":"aurelia-templating"},{"name":"aurelia-templating-binding","location":"aurelia-templating-binding/dist/amd","main":"aurelia-templating-binding"},{"name":"aurelia-templating-resources","location":"aurelia-templating-resources/dist/amd","main":"aurelia-templating-resources"},{"name":"aurelia-templating-router","location":"aurelia-templating-router/dist/amd","main":"aurelia-templating-router"}],"stubModules":["text"],"shim":{},"bundles":{"assets/client":["client/src/environment","client/src/elems/form","client/src/elems/md-autocomplete","client/src/elems/md-button","client/src/elems/md-checkbox","client/src/elems/md-drawer","client/src/elems/md-input","client/src/elems/md-loading","client/src/elems/md-menu","client/src/elems/md-select","client/src/elems/md-shadow","client/src/elems/md-snackbar","client/src/elems/md-switch","client/src/elems/md-table","client/src/elems/md-text","client/src/libs/csv","client/src/libs/pouch","client/src/resources/helpers","client/src/resources/value-converters","client/src/views/account","client/src/views/drugs","client/src/views/index","client/src/views/inventory","client/src/views/join","client/src/views/login","client/src/views/routes","client/src/views/shipments","client/src/views/shopping"]}});
define('aurelia-http-client/aurelia-http-client',['exports', 'aurelia-path', 'aurelia-pal'], function (exports, _aureliaPath, _aureliaPal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.HttpClient = exports.RequestBuilder = exports.ErrorHttpResponseMessage = exports.HttpRequestMessage = exports.JSONPRequestMessage = exports.RequestMessageProcessor = exports.mimeTypes = exports.HttpResponseMessage = exports.RequestMessage = exports.Headers = undefined;
  exports.timeoutTransformer = timeoutTransformer;
  exports.callbackParameterNameTransformer = callbackParameterNameTransformer;
  exports.credentialsTransformer = credentialsTransformer;
  exports.progressTransformer = progressTransformer;
  exports.downloadProgressTransformer = downloadProgressTransformer;
  exports.responseTypeTransformer = responseTypeTransformer;
  exports.headerTransformer = headerTransformer;
  exports.contentTransformer = contentTransformer;
  exports.createJSONPRequestMessageProcessor = createJSONPRequestMessageProcessor;
  exports.createHttpRequestMessageProcessor = createHttpRequestMessageProcessor;

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();



  var Headers = exports.Headers = function () {
    function Headers() {
      var headers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};



      this.headers = {};

      for (var _key in headers) {
        this.headers[_key.toLowerCase()] = { key: _key, value: headers[_key] };
      }
    }

    Headers.prototype.add = function add(key, value) {
      this.headers[key.toLowerCase()] = { key: key, value: value };
    };

    Headers.prototype.get = function get(key) {
      var header = this.headers[key.toLowerCase()];
      return header ? header.value : undefined;
    };

    Headers.prototype.clear = function clear() {
      this.headers = {};
    };

    Headers.prototype.has = function has(header) {
      return this.headers.hasOwnProperty(header.toLowerCase());
    };

    Headers.prototype.configureXHR = function configureXHR(xhr) {
      for (var name in this.headers) {
        if (this.headers.hasOwnProperty(name)) {
          xhr.setRequestHeader(this.headers[name].key, this.headers[name].value);
        }
      }
    };

    Headers.parse = function parse(headerStr) {
      var headers = new Headers();
      if (!headerStr) {
        return headers;
      }

      var headerPairs = headerStr.split('\r\n');
      for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i];

        var index = headerPair.indexOf(': ');
        if (index > 0) {
          var _key2 = headerPair.substring(0, index);
          var val = headerPair.substring(index + 2);
          headers.add(_key2, val);
        }
      }

      return headers;
    };

    return Headers;
  }();

  var RequestMessage = exports.RequestMessage = function () {
    function RequestMessage(method, url, content, headers) {


      this.method = method;
      this.url = url;
      this.content = content;
      this.headers = headers || new Headers();
      this.baseUrl = '';
    }

    RequestMessage.prototype.buildFullUrl = function buildFullUrl() {
      var absoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;
      var url = absoluteUrl.test(this.url) ? this.url : (0, _aureliaPath.join)(this.baseUrl, this.url);

      if (this.params) {
        var qs = (0, _aureliaPath.buildQueryString)(this.params, this.traditional);
        url = qs ? url + (this.url.indexOf('?') < 0 ? '?' : '&') + qs : url;
      }

      return url;
    };

    return RequestMessage;
  }();

  var HttpResponseMessage = exports.HttpResponseMessage = function () {
    function HttpResponseMessage(requestMessage, xhr, responseType, reviver) {


      this.requestMessage = requestMessage;
      this.statusCode = xhr.status;
      this.response = xhr.response || xhr.responseText;
      this.isSuccess = xhr.status >= 200 && xhr.status < 400;
      this.statusText = xhr.statusText;
      this.reviver = reviver;
      this.mimeType = null;

      if (xhr.getAllResponseHeaders) {
        this.headers = Headers.parse(xhr.getAllResponseHeaders());
      } else {
        this.headers = new Headers();
      }

      var contentType = void 0;

      if (this.headers && this.headers.headers) {
        contentType = this.headers.get('Content-Type');
      }

      if (contentType) {
        this.mimeType = responseType = contentType.split(';')[0].trim();
        if (mimeTypes.hasOwnProperty(this.mimeType)) responseType = mimeTypes[this.mimeType];
      }

      this.responseType = responseType;
    }

    _createClass(HttpResponseMessage, [{
      key: 'content',
      get: function get() {
        try {
          if (this._content !== undefined) {
            return this._content;
          }

          if (this.response === undefined || this.response === null || this.response === '') {
            this._content = this.response;
            return this._content;
          }

          if (this.responseType === 'json') {
            this._content = JSON.parse(this.response, this.reviver);
            return this._content;
          }

          if (this.reviver) {
            this._content = this.reviver(this.response);
            return this._content;
          }

          this._content = this.response;
          return this._content;
        } catch (e) {
          if (this.isSuccess) {
            throw e;
          }

          this._content = null;
          return this._content;
        }
      }
    }]);

    return HttpResponseMessage;
  }();

  var mimeTypes = exports.mimeTypes = {
    'text/html': 'html',
    'text/javascript': 'js',
    'application/javascript': 'js',
    'text/json': 'json',
    'application/json': 'json',
    'application/rss+xml': 'rss',
    'application/atom+xml': 'atom',
    'application/xhtml+xml': 'xhtml',
    'text/markdown': 'md',
    'text/xml': 'xml',
    'text/mathml': 'mml',
    'application/xml': 'xml',
    'text/yml': 'yml',
    'text/csv': 'csv',
    'text/css': 'css',
    'text/less': 'less',
    'text/stylus': 'styl',
    'text/scss': 'scss',
    'text/sass': 'sass',
    'text/plain': 'txt'
  };

  function applyXhrTransformers(xhrTransformers, client, processor, message, xhr) {
    var i = void 0;
    var ii = void 0;

    for (i = 0, ii = xhrTransformers.length; i < ii; ++i) {
      xhrTransformers[i](client, processor, message, xhr);
    }
  }

  var RequestMessageProcessor = exports.RequestMessageProcessor = function () {
    function RequestMessageProcessor(xhrType, xhrTransformers) {


      this.XHRType = xhrType;
      this.xhrTransformers = xhrTransformers;
      this.isAborted = false;
    }

    RequestMessageProcessor.prototype.abort = function abort() {
      if (this.xhr && this.xhr.readyState !== _aureliaPal.PLATFORM.XMLHttpRequest.UNSENT) {
        this.xhr.abort();
      }

      this.isAborted = true;
    };

    RequestMessageProcessor.prototype.process = function process(client, requestMessage) {
      var _this = this;

      var promise = new Promise(function (resolve, reject) {
        var rejectResponse = void 0;
        if (client.rejectPromiseWithErrorObject) {
          rejectResponse = function rejectResponse(resp) {
            var errorResp = new ErrorHttpResponseMessage(resp);
            reject(errorResp);
          };
        } else {
          rejectResponse = function rejectResponse(resp) {
            reject(resp);
          };
        }

        var xhr = _this.xhr = new _this.XHRType();
        xhr.onload = function (e) {
          var response = new HttpResponseMessage(requestMessage, xhr, requestMessage.responseType, requestMessage.reviver);
          if (response.isSuccess) {
            resolve(response);
          } else {
            rejectResponse(response);
          }
        };

        xhr.ontimeout = function (e) {
          rejectResponse(new HttpResponseMessage(requestMessage, {
            response: e,
            status: xhr.status,
            statusText: xhr.statusText
          }, 'timeout'));
        };

        xhr.onerror = function (e) {
          rejectResponse(new HttpResponseMessage(requestMessage, {
            response: e,
            status: xhr.status,
            statusText: xhr.statusText
          }, 'error'));
        };

        xhr.onabort = function (e) {
          rejectResponse(new HttpResponseMessage(requestMessage, {
            response: e,
            status: xhr.status,
            statusText: xhr.statusText
          }, 'abort'));
        };
      });

      return Promise.resolve(requestMessage).then(function (message) {
        var processRequest = function processRequest() {
          if (_this.isAborted) {
            _this.xhr.abort();
          } else {
            _this.xhr.open(message.method, message.buildFullUrl(), true, message.user, message.password);
            applyXhrTransformers(_this.xhrTransformers, client, _this, message, _this.xhr);
            if (typeof message.content === 'undefined') {
              _this.xhr.send();
            } else {
              _this.xhr.send(message.content);
            }
          }

          return promise;
        };

        var chain = [[processRequest, undefined]];

        var interceptors = message.interceptors || [];
        interceptors.forEach(function (interceptor) {
          if (interceptor.request || interceptor.requestError) {
            chain.unshift([interceptor.request ? interceptor.request.bind(interceptor) : undefined, interceptor.requestError ? interceptor.requestError.bind(interceptor) : undefined]);
          }

          if (interceptor.response || interceptor.responseError) {
            chain.push([interceptor.response ? interceptor.response.bind(interceptor) : undefined, interceptor.responseError ? interceptor.responseError.bind(interceptor) : undefined]);
          }
        });

        var interceptorsPromise = Promise.resolve(message);

        while (chain.length) {
          var _interceptorsPromise;

          interceptorsPromise = (_interceptorsPromise = interceptorsPromise).then.apply(_interceptorsPromise, chain.shift());
        }

        return interceptorsPromise;
      });
    };

    return RequestMessageProcessor;
  }();

  function timeoutTransformer(client, processor, message, xhr) {
    if (message.timeout !== undefined) {
      xhr.timeout = message.timeout;
    }
  }

  function callbackParameterNameTransformer(client, processor, message, xhr) {
    if (message.callbackParameterName !== undefined) {
      xhr.callbackParameterName = message.callbackParameterName;
    }
  }

  function credentialsTransformer(client, processor, message, xhr) {
    if (message.withCredentials !== undefined) {
      xhr.withCredentials = message.withCredentials;
    }
  }

  function progressTransformer(client, processor, message, xhr) {
    if (message.progressCallback) {
      xhr.upload.onprogress = message.progressCallback;
    }
  }

  function downloadProgressTransformer(client, processor, message, xhr) {
    if (message.downloadProgressCallback) {
      xhr.onprogress = message.downloadProgressCallback;
    }
  }

  function responseTypeTransformer(client, processor, message, xhr) {
    var responseType = message.responseType;

    if (responseType === 'json') {
      responseType = 'text';
    }

    xhr.responseType = responseType;
  }

  function headerTransformer(client, processor, message, xhr) {
    message.headers.configureXHR(xhr);
  }

  function contentTransformer(client, processor, message, xhr) {
    if (message.skipContentProcessing) {
      return;
    }

    if (_aureliaPal.PLATFORM.global.FormData && message.content instanceof FormData) {
      return;
    }

    if (_aureliaPal.PLATFORM.global.Blob && message.content instanceof Blob) {
      return;
    }

    if (_aureliaPal.PLATFORM.global.ArrayBuffer && message.content instanceof ArrayBuffer) {
      return;
    }

    if (message.content instanceof Document) {
      return;
    }

    if (typeof message.content === 'string') {
      return;
    }

    if (message.content === null || message.content === undefined) {
      return;
    }

    message.content = JSON.stringify(message.content, message.replacer);

    if (!message.headers.has('Content-Type')) {
      message.headers.add('Content-Type', 'application/json');
    }
  }

  var JSONPRequestMessage = exports.JSONPRequestMessage = function (_RequestMessage) {
    _inherits(JSONPRequestMessage, _RequestMessage);

    function JSONPRequestMessage(url, callbackParameterName) {


      var _this2 = _possibleConstructorReturn(this, _RequestMessage.call(this, 'JSONP', url));

      _this2.responseType = 'jsonp';
      _this2.callbackParameterName = callbackParameterName;
      return _this2;
    }

    return JSONPRequestMessage;
  }(RequestMessage);

  var JSONPXHR = function () {
    function JSONPXHR() {

    }

    JSONPXHR.prototype.open = function open(method, url) {
      this.method = method;
      this.url = url;
      this.callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    };

    JSONPXHR.prototype.send = function send() {
      var _this3 = this;

      var url = this.url + (this.url.indexOf('?') >= 0 ? '&' : '?') + encodeURIComponent(this.callbackParameterName) + '=' + this.callbackName;
      var script = _aureliaPal.DOM.createElement('script');

      script.src = url;
      script.onerror = function (e) {
        cleanUp();

        _this3.status = 0;
        _this3.onerror(new Error('error'));
      };

      var cleanUp = function cleanUp() {
        delete _aureliaPal.PLATFORM.global[_this3.callbackName];
        _aureliaPal.DOM.removeNode(script);
      };

      _aureliaPal.PLATFORM.global[this.callbackName] = function (data) {
        cleanUp();

        if (_this3.status === undefined) {
          _this3.status = 200;
          _this3.statusText = 'OK';
          _this3.response = data;
          _this3.onload(_this3);
        }
      };

      _aureliaPal.DOM.appendNode(script);

      if (this.timeout !== undefined) {
        setTimeout(function () {
          if (_this3.status === undefined) {
            _this3.status = 0;
            _this3.ontimeout(new Error('timeout'));
          }
        }, this.timeout);
      }
    };

    JSONPXHR.prototype.abort = function abort() {
      if (this.status === undefined) {
        this.status = 0;
        this.onabort(new Error('abort'));
      }
    };

    JSONPXHR.prototype.setRequestHeader = function setRequestHeader() {};

    return JSONPXHR;
  }();

  function createJSONPRequestMessageProcessor() {
    return new RequestMessageProcessor(JSONPXHR, [timeoutTransformer, callbackParameterNameTransformer]);
  }

  var HttpRequestMessage = exports.HttpRequestMessage = function (_RequestMessage2) {
    _inherits(HttpRequestMessage, _RequestMessage2);

    function HttpRequestMessage(method, url, content, headers) {


      var _this4 = _possibleConstructorReturn(this, _RequestMessage2.call(this, method, url, content, headers));

      _this4.responseType = 'json';return _this4;
    }

    return HttpRequestMessage;
  }(RequestMessage);

  function createHttpRequestMessageProcessor() {
    return new RequestMessageProcessor(_aureliaPal.PLATFORM.XMLHttpRequest, [timeoutTransformer, credentialsTransformer, progressTransformer, downloadProgressTransformer, responseTypeTransformer, contentTransformer, headerTransformer]);
  }

  var ErrorHttpResponseMessage = exports.ErrorHttpResponseMessage = function (_HttpResponseMessage) {
    _inherits(ErrorHttpResponseMessage, _HttpResponseMessage);

    function ErrorHttpResponseMessage(responseMessage) {


      var _this5 = _possibleConstructorReturn(this, _HttpResponseMessage.call(this, responseMessage.requestMessage, {
        response: responseMessage.response,
        status: responseMessage.statusCode,
        statusText: responseMessage.statusText
      }, responseMessage.responseType));

      _this5.name = responseMessage.responseType;
      _this5.message = 'Error: ' + responseMessage.statusCode + ' Status: ' + responseMessage.statusText;
      return _this5;
    }

    return ErrorHttpResponseMessage;
  }(HttpResponseMessage);

  var RequestBuilder = exports.RequestBuilder = function () {
    function RequestBuilder(client) {


      this.client = client;
      this.transformers = client.requestTransformers.slice(0);
      this.useJsonp = false;
    }

    RequestBuilder.prototype.asDelete = function asDelete() {
      return this._addTransformer(function (client, processor, message) {
        message.method = 'DELETE';
      });
    };

    RequestBuilder.prototype.asGet = function asGet() {
      return this._addTransformer(function (client, processor, message) {
        message.method = 'GET';
      });
    };

    RequestBuilder.prototype.asHead = function asHead() {
      return this._addTransformer(function (client, processor, message) {
        message.method = 'HEAD';
      });
    };

    RequestBuilder.prototype.asOptions = function asOptions() {
      return this._addTransformer(function (client, processor, message) {
        message.method = 'OPTIONS';
      });
    };

    RequestBuilder.prototype.asPatch = function asPatch() {
      return this._addTransformer(function (client, processor, message) {
        message.method = 'PATCH';
      });
    };

    RequestBuilder.prototype.asPost = function asPost() {
      return this._addTransformer(function (client, processor, message) {
        message.method = 'POST';
      });
    };

    RequestBuilder.prototype.asPut = function asPut() {
      return this._addTransformer(function (client, processor, message) {
        message.method = 'PUT';
      });
    };

    RequestBuilder.prototype.asJsonp = function asJsonp(callbackParameterName) {
      this.useJsonp = true;
      return this._addTransformer(function (client, processor, message) {
        message.callbackParameterName = callbackParameterName;
      });
    };

    RequestBuilder.prototype.withUrl = function withUrl(url) {
      return this._addTransformer(function (client, processor, message) {
        message.url = url;
      });
    };

    RequestBuilder.prototype.withContent = function withContent(content) {
      return this._addTransformer(function (client, processor, message) {
        message.content = content;
      });
    };

    RequestBuilder.prototype.withBaseUrl = function withBaseUrl(baseUrl) {
      return this._addTransformer(function (client, processor, message) {
        message.baseUrl = baseUrl;
      });
    };

    RequestBuilder.prototype.withParams = function withParams(params, traditional) {
      return this._addTransformer(function (client, processor, message) {
        message.traditional = traditional;
        message.params = params;
      });
    };

    RequestBuilder.prototype.withResponseType = function withResponseType(responseType) {
      return this._addTransformer(function (client, processor, message) {
        message.responseType = responseType;
      });
    };

    RequestBuilder.prototype.withTimeout = function withTimeout(timeout) {
      return this._addTransformer(function (client, processor, message) {
        message.timeout = timeout;
      });
    };

    RequestBuilder.prototype.withHeader = function withHeader(key, value) {
      return this._addTransformer(function (client, processor, message) {
        message.headers.add(key, value);
      });
    };

    RequestBuilder.prototype.withCredentials = function withCredentials(value) {
      return this._addTransformer(function (client, processor, message) {
        message.withCredentials = value;
      });
    };

    RequestBuilder.prototype.withLogin = function withLogin(user, password) {
      return this._addTransformer(function (client, processor, message) {
        message.user = user;message.password = password;
      });
    };

    RequestBuilder.prototype.withReviver = function withReviver(reviver) {
      return this._addTransformer(function (client, processor, message) {
        message.reviver = reviver;
      });
    };

    RequestBuilder.prototype.withReplacer = function withReplacer(replacer) {
      return this._addTransformer(function (client, processor, message) {
        message.replacer = replacer;
      });
    };

    RequestBuilder.prototype.withProgressCallback = function withProgressCallback(progressCallback) {
      return this._addTransformer(function (client, processor, message) {
        message.progressCallback = progressCallback;
      });
    };

    RequestBuilder.prototype.withDownloadProgressCallback = function withDownloadProgressCallback(downloadProgressCallback) {
      return this._addTransformer(function (client, processor, message) {
        message.downloadProgressCallback = downloadProgressCallback;
      });
    };

    RequestBuilder.prototype.withCallbackParameterName = function withCallbackParameterName(callbackParameterName) {
      return this._addTransformer(function (client, processor, message) {
        message.callbackParameterName = callbackParameterName;
      });
    };

    RequestBuilder.prototype.withInterceptor = function withInterceptor(interceptor) {
      return this._addTransformer(function (client, processor, message) {
        message.interceptors = message.interceptors || [];
        message.interceptors.unshift(interceptor);
      });
    };

    RequestBuilder.prototype.skipContentProcessing = function skipContentProcessing() {
      return this._addTransformer(function (client, processor, message) {
        message.skipContentProcessing = true;
      });
    };

    RequestBuilder.prototype._addTransformer = function _addTransformer(fn) {
      this.transformers.push(fn);
      return this;
    };

    RequestBuilder.addHelper = function addHelper(name, fn) {
      RequestBuilder.prototype[name] = function () {
        return this._addTransformer(fn.apply(this, arguments));
      };
    };

    RequestBuilder.prototype.send = function send() {
      var message = this.useJsonp ? new JSONPRequestMessage() : new HttpRequestMessage();
      return this.client.send(message, this.transformers);
    };

    return RequestBuilder;
  }();

  function trackRequestStart(client, processor) {
    client.pendingRequests.push(processor);
    client.isRequesting = true;
  }

  function trackRequestEnd(client, processor) {
    var index = client.pendingRequests.indexOf(processor);

    client.pendingRequests.splice(index, 1);
    client.isRequesting = client.pendingRequests.length > 0;

    if (!client.isRequesting) {
      var evt = _aureliaPal.DOM.createCustomEvent('aurelia-http-client-requests-drained', { bubbles: true, cancelable: true });
      setTimeout(function () {
        return _aureliaPal.DOM.dispatchEvent(evt);
      }, 1);
    }
  }

  var HttpClient = exports.HttpClient = function () {
    function HttpClient() {


      this.isRequesting = false;

      this.rejectPromiseWithErrorObject = false;
      this.requestTransformers = [];
      this.requestProcessorFactories = new Map();
      this.requestProcessorFactories.set(HttpRequestMessage, createHttpRequestMessageProcessor);
      this.requestProcessorFactories.set(JSONPRequestMessage, createJSONPRequestMessageProcessor);
      this.pendingRequests = [];
    }

    HttpClient.prototype.configure = function configure(fn) {
      var builder = new RequestBuilder(this);
      fn(builder);
      this.requestTransformers = builder.transformers;
      return this;
    };

    HttpClient.prototype.createRequest = function createRequest(url) {
      var builder = new RequestBuilder(this);

      if (url) {
        builder.withUrl(url);
      }

      return builder;
    };

    HttpClient.prototype.send = function send(requestMessage, transformers) {
      var _this6 = this;

      var createProcessor = this.requestProcessorFactories.get(requestMessage.constructor);
      var processor = void 0;
      var promise = void 0;
      var i = void 0;
      var ii = void 0;

      if (!createProcessor) {
        throw new Error('No request message processor factory for ' + requestMessage.constructor + '.');
      }

      processor = createProcessor();
      trackRequestStart(this, processor);

      transformers = transformers || this.requestTransformers;

      promise = Promise.resolve(requestMessage).then(function (message) {
        for (i = 0, ii = transformers.length; i < ii; ++i) {
          transformers[i](_this6, processor, message);
        }

        return processor.process(_this6, message).then(function (response) {
          trackRequestEnd(_this6, processor);
          return response;
        }).catch(function (response) {
          trackRequestEnd(_this6, processor);
          throw response;
        });
      });

      promise.abort = promise.cancel = function () {
        processor.abort();
      };

      return promise;
    };

    HttpClient.prototype.delete = function _delete(url) {
      return this.createRequest(url).asDelete().send();
    };

    HttpClient.prototype.get = function get(url, params, traditional) {
      var req = this.createRequest(url).asGet();

      if (params) {
        return req.withParams(params, traditional).send();
      }

      return req.send();
    };

    HttpClient.prototype.head = function head(url) {
      return this.createRequest(url).asHead().send();
    };

    HttpClient.prototype.jsonp = function jsonp(url) {
      var callbackParameterName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'jsoncallback';

      return this.createRequest(url).asJsonp(callbackParameterName).send();
    };

    HttpClient.prototype.options = function options(url) {
      return this.createRequest(url).asOptions().send();
    };

    HttpClient.prototype.put = function put(url, content) {
      return this.createRequest(url).asPut().withContent(content).send();
    };

    HttpClient.prototype.patch = function patch(url, content) {
      return this.createRequest(url).asPatch().withContent(content).send();
    };

    HttpClient.prototype.post = function post(url, content) {
      return this.createRequest(url).asPost().withContent(content).send();
    };

    return HttpClient;
  }();
});;define('aurelia-http-client', ['aurelia-http-client/aurelia-http-client'], function (main) { return main; });

define('aurelia-animator-css/aurelia-animator-css',['exports', 'aurelia-templating', 'aurelia-pal'], function (exports, _aureliaTemplating, _aureliaPal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.CssAnimator = undefined;
  exports.configure = configure;



  var CssAnimator = exports.CssAnimator = function () {
    function CssAnimator() {


      this.useAnimationDoneClasses = false;
      this.animationEnteredClass = 'au-entered';
      this.animationLeftClass = 'au-left';
      this.isAnimating = false;

      this.verifyKeyframesExist = true;
    }

    CssAnimator.prototype._addMultipleEventListener = function _addMultipleEventListener(el, s, fn) {
      var evts = s.split(' ');
      for (var i = 0, ii = evts.length; i < ii; ++i) {
        el.addEventListener(evts[i], fn, false);
      }
    };

    CssAnimator.prototype._removeMultipleEventListener = function _removeMultipleEventListener(el, s, fn) {
      var evts = s.split(' ');
      for (var i = 0, ii = evts.length; i < ii; ++i) {
        el.removeEventListener(evts[i], fn, false);
      }
    };

    CssAnimator.prototype._getElementAnimationDelay = function _getElementAnimationDelay(element) {
      var styl = _aureliaPal.DOM.getComputedStyle(element);
      var prop = void 0;
      var delay = void 0;

      if (styl.getPropertyValue('animation-delay')) {
        prop = 'animation-delay';
      } else if (styl.getPropertyValue('-webkit-animation-delay')) {
        prop = '-webkit-animation-delay';
      } else if (styl.getPropertyValue('-moz-animation-delay')) {
        prop = '-moz-animation-delay';
      } else {
        return 0;
      }

      delay = styl.getPropertyValue(prop);
      delay = Number(delay.replace(/[^\d\.]/g, ''));

      return delay * 1000;
    };

    CssAnimator.prototype._getElementAnimationNames = function _getElementAnimationNames(element) {
      var styl = _aureliaPal.DOM.getComputedStyle(element);
      var prefix = void 0;

      if (styl.getPropertyValue('animation-name')) {
        prefix = '';
      } else if (styl.getPropertyValue('-webkit-animation-name')) {
        prefix = '-webkit-';
      } else if (styl.getPropertyValue('-moz-animation-name')) {
        prefix = '-moz-';
      } else {
        return [];
      }

      var animationNames = styl.getPropertyValue(prefix + 'animation-name');
      return animationNames ? animationNames.split(' ') : [];
    };

    CssAnimator.prototype._performSingleAnimate = function _performSingleAnimate(element, className) {
      var _this = this;

      this._triggerDOMEvent(_aureliaTemplating.animationEvent.animateBegin, element);

      return this.addClass(element, className, true).then(function (result) {
        _this._triggerDOMEvent(_aureliaTemplating.animationEvent.animateActive, element);

        if (result !== false) {
          return _this.removeClass(element, className, true).then(function () {
            _this._triggerDOMEvent(_aureliaTemplating.animationEvent.animateDone, element);
          });
        }

        return false;
      }).catch(function () {
        _this._triggerDOMEvent(_aureliaTemplating.animationEvent.animateTimeout, element);
      });
    };

    CssAnimator.prototype._triggerDOMEvent = function _triggerDOMEvent(eventType, element) {
      var evt = _aureliaPal.DOM.createCustomEvent(eventType, { bubbles: true, cancelable: true, detail: element });
      _aureliaPal.DOM.dispatchEvent(evt);
    };

    CssAnimator.prototype._animationChangeWithValidKeyframe = function _animationChangeWithValidKeyframe(animationNames, prevAnimationNames) {
      var newAnimationNames = animationNames.filter(function (name) {
        return prevAnimationNames.indexOf(name) === -1;
      });

      if (newAnimationNames.length === 0) {
        return false;
      }

      if (!this.verifyKeyframesExist) {
        return true;
      }

      var keyframesRuleType = window.CSSRule.KEYFRAMES_RULE || window.CSSRule.MOZ_KEYFRAMES_RULE || window.CSSRule.WEBKIT_KEYFRAMES_RULE;

      var styleSheets = document.styleSheets;

      try {
        for (var i = 0; i < styleSheets.length; ++i) {
          var cssRules = null;

          try {
            cssRules = styleSheets[i].cssRules;
          } catch (e) {}

          if (!cssRules) {
            continue;
          }

          for (var j = 0; j < cssRules.length; ++j) {
            var cssRule = cssRules[j];

            if (cssRule.type === keyframesRuleType) {
              if (newAnimationNames.indexOf(cssRule.name) !== -1) {
                return true;
              }
            }
          }
        }
      } catch (e) {}

      return false;
    };

    CssAnimator.prototype.animate = function animate(element, className) {
      var _this2 = this;

      if (Array.isArray(element)) {
        return Promise.all(element.map(function (el) {
          return _this2._performSingleAnimate(el, className);
        }));
      }

      return this._performSingleAnimate(element, className);
    };

    CssAnimator.prototype.runSequence = function runSequence(animations) {
      var _this3 = this;

      this._triggerDOMEvent(_aureliaTemplating.animationEvent.sequenceBegin, null);

      return animations.reduce(function (p, anim) {
        return p.then(function () {
          return _this3.animate(anim.element, anim.className);
        });
      }, Promise.resolve(true)).then(function () {
        _this3._triggerDOMEvent(_aureliaTemplating.animationEvent.sequenceDone, null);
      });
    };

    CssAnimator.prototype._stateAnim = function _stateAnim(element, direction, doneClass) {
      var _this4 = this;

      var auClass = 'au-' + direction;
      var auClassActive = auClass + '-active';
      return new Promise(function (resolve, reject) {
        var classList = element.classList;

        _this4._triggerDOMEvent(_aureliaTemplating.animationEvent[direction + 'Begin'], element);

        if (_this4.useAnimationDoneClasses) {
          classList.remove(_this4.animationEnteredClass);
          classList.remove(_this4.animationLeftClass);
        }

        classList.add(auClass);
        var prevAnimationNames = _this4._getElementAnimationNames(element);

        var _animStart = void 0;
        var animHasStarted = false;
        _this4._addMultipleEventListener(element, 'webkitAnimationStart animationstart', _animStart = function animStart(evAnimStart) {
          if (evAnimStart.target !== element) {
            return;
          }
          animHasStarted = true;
          _this4.isAnimating = true;

          _this4._triggerDOMEvent(_aureliaTemplating.animationEvent[direction + 'Active'], element);

          evAnimStart.stopPropagation();

          evAnimStart.target.removeEventListener(evAnimStart.type, _animStart);
        }, false);

        var _animEnd = void 0;
        _this4._addMultipleEventListener(element, 'webkitAnimationEnd animationend', _animEnd = function animEnd(evAnimEnd) {
          if (!animHasStarted) {
            return;
          }
          if (evAnimEnd.target !== element) {
            return;
          }

          evAnimEnd.stopPropagation();

          classList.remove(auClassActive);
          classList.remove(auClass);

          evAnimEnd.target.removeEventListener(evAnimEnd.type, _animEnd);

          if (_this4.useAnimationDoneClasses && doneClass !== undefined && doneClass !== null) {
            classList.add(doneClass);
          }

          _this4.isAnimating = false;
          _this4._triggerDOMEvent(_aureliaTemplating.animationEvent[direction + 'Done'], element);

          resolve(true);
        }, false);

        var parent = element.parentElement;
        var attrib = 'data-animator-pending' + direction;

        var cleanupAnimation = function cleanupAnimation() {
          var animationNames = _this4._getElementAnimationNames(element);
          if (!_this4._animationChangeWithValidKeyframe(animationNames, prevAnimationNames)) {
            classList.remove(auClassActive);
            classList.remove(auClass);

            _this4._removeMultipleEventListener(element, 'webkitAnimationEnd animationend', _animEnd);
            _this4._removeMultipleEventListener(element, 'webkitAnimationStart animationstart', _animStart);

            _this4._triggerDOMEvent(_aureliaTemplating.animationEvent[direction + 'Timeout'], element);
            resolve(false);
          }
          parent && parent.setAttribute(attrib, +(parent.getAttribute(attrib) || 1) - 1);
        };

        if (parent !== null && parent !== undefined && (parent.classList.contains('au-stagger') || parent.classList.contains('au-stagger-' + direction))) {
          var offset = +(parent.getAttribute(attrib) || 0);
          parent.setAttribute(attrib, offset + 1);
          var delay = _this4._getElementAnimationDelay(parent) * offset;
          _this4._triggerDOMEvent(_aureliaTemplating.animationEvent.staggerNext, element);

          setTimeout(function () {
            classList.add(auClassActive);
            cleanupAnimation();
          }, delay);
        } else {
          classList.add(auClassActive);
          cleanupAnimation();
        }
      });
    };

    CssAnimator.prototype.enter = function enter(element) {
      return this._stateAnim(element, 'enter', this.animationEnteredClass);
    };

    CssAnimator.prototype.leave = function leave(element) {
      return this._stateAnim(element, 'leave', this.animationLeftClass);
    };

    CssAnimator.prototype.removeClass = function removeClass(element, className) {
      var _this5 = this;

      var suppressEvents = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      return new Promise(function (resolve, reject) {
        var classList = element.classList;

        if (!classList.contains(className) && !classList.contains(className + '-add')) {
          resolve(false);
          return;
        }

        if (suppressEvents !== true) {
          _this5._triggerDOMEvent(_aureliaTemplating.animationEvent.removeClassBegin, element);
        }

        if (classList.contains(className + '-add')) {
          classList.remove(className + '-add');
          classList.add(className);
        }

        classList.remove(className);
        var prevAnimationNames = _this5._getElementAnimationNames(element);

        var _animStart2 = void 0;
        var animHasStarted = false;
        _this5._addMultipleEventListener(element, 'webkitAnimationStart animationstart', _animStart2 = function animStart(evAnimStart) {
          if (evAnimStart.target !== element) {
            return;
          }
          animHasStarted = true;
          _this5.isAnimating = true;

          if (suppressEvents !== true) {
            _this5._triggerDOMEvent(_aureliaTemplating.animationEvent.removeClassActive, element);
          }

          evAnimStart.stopPropagation();

          evAnimStart.target.removeEventListener(evAnimStart.type, _animStart2);
        }, false);

        var _animEnd2 = void 0;
        _this5._addMultipleEventListener(element, 'webkitAnimationEnd animationend', _animEnd2 = function animEnd(evAnimEnd) {
          if (!animHasStarted) {
            return;
          }
          if (evAnimEnd.target !== element) {
            return;
          }

          if (!element.classList.contains(className + '-remove')) {
            resolve(true);
          }

          evAnimEnd.stopPropagation();

          classList.remove(className);

          classList.remove(className + '-remove');

          evAnimEnd.target.removeEventListener(evAnimEnd.type, _animEnd2);

          _this5.isAnimating = false;

          if (suppressEvents !== true) {
            _this5._triggerDOMEvent(_aureliaTemplating.animationEvent.removeClassDone, element);
          }

          resolve(true);
        }, false);

        classList.add(className + '-remove');

        var animationNames = _this5._getElementAnimationNames(element);
        if (!_this5._animationChangeWithValidKeyframe(animationNames, prevAnimationNames)) {
          classList.remove(className + '-remove');
          classList.remove(className);

          _this5._removeMultipleEventListener(element, 'webkitAnimationEnd animationend', _animEnd2);
          _this5._removeMultipleEventListener(element, 'webkitAnimationStart animationstart', _animStart2);

          if (suppressEvents !== true) {
            _this5._triggerDOMEvent(_aureliaTemplating.animationEvent.removeClassTimeout, element);
          }

          resolve(false);
        }
      });
    };

    CssAnimator.prototype.addClass = function addClass(element, className) {
      var _this6 = this;

      var suppressEvents = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      return new Promise(function (resolve, reject) {
        var classList = element.classList;

        if (suppressEvents !== true) {
          _this6._triggerDOMEvent(_aureliaTemplating.animationEvent.addClassBegin, element);
        }

        if (classList.contains(className + '-remove')) {
          classList.remove(className + '-remove');
          classList.remove(className);
        }

        var _animStart3 = void 0;
        var animHasStarted = false;
        _this6._addMultipleEventListener(element, 'webkitAnimationStart animationstart', _animStart3 = function animStart(evAnimStart) {
          if (evAnimStart.target !== element) {
            return;
          }
          animHasStarted = true;
          _this6.isAnimating = true;

          if (suppressEvents !== true) {
            _this6._triggerDOMEvent(_aureliaTemplating.animationEvent.addClassActive, element);
          }

          evAnimStart.stopPropagation();

          evAnimStart.target.removeEventListener(evAnimStart.type, _animStart3);
        }, false);

        var _animEnd3 = void 0;
        _this6._addMultipleEventListener(element, 'webkitAnimationEnd animationend', _animEnd3 = function animEnd(evAnimEnd) {
          if (!animHasStarted) {
            return;
          }
          if (evAnimEnd.target !== element) {
            return;
          }

          if (!element.classList.contains(className + '-add')) {
            resolve(true);
          }

          evAnimEnd.stopPropagation();

          classList.add(className);

          classList.remove(className + '-add');

          evAnimEnd.target.removeEventListener(evAnimEnd.type, _animEnd3);

          _this6.isAnimating = false;

          if (suppressEvents !== true) {
            _this6._triggerDOMEvent(_aureliaTemplating.animationEvent.addClassDone, element);
          }

          resolve(true);
        }, false);

        var prevAnimationNames = _this6._getElementAnimationNames(element);

        classList.add(className + '-add');

        var animationNames = _this6._getElementAnimationNames(element);
        if (!_this6._animationChangeWithValidKeyframe(animationNames, prevAnimationNames)) {
          classList.remove(className + '-add');
          classList.add(className);

          _this6._removeMultipleEventListener(element, 'webkitAnimationEnd animationend', _animEnd3);
          _this6._removeMultipleEventListener(element, 'webkitAnimationStart animationstart', _animStart3);

          if (suppressEvents !== true) {
            _this6._triggerDOMEvent(_aureliaTemplating.animationEvent.addClassTimeout, element);
          }

          resolve(false);
        }
      });
    };

    return CssAnimator;
  }();

  function configure(config, callback) {
    var animator = config.container.get(CssAnimator);
    config.container.get(_aureliaTemplating.TemplatingEngine).configureAnimator(animator);
    if (typeof callback === 'function') {
      callback(animator);
    }
  }
});;define('aurelia-animator-css', ['aurelia-animator-css/aurelia-animator-css'], function (main) { return main; });

define('aurelia-binding/aurelia-binding',['exports', 'aurelia-logging', 'aurelia-pal', 'aurelia-task-queue', 'aurelia-metadata'], function (exports, _aureliaLogging, _aureliaPal, _aureliaTaskQueue, _aureliaMetadata) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.getSetObserver = exports.BindingEngine = exports.NameExpression = exports.Listener = exports.ListenerExpression = exports.BindingBehaviorResource = exports.ValueConverterResource = exports.Call = exports.CallExpression = exports.Binding = exports.BindingExpression = exports.ObjectObservationAdapter = exports.ObserverLocator = exports.SVGAnalyzer = exports.presentationAttributes = exports.presentationElements = exports.elements = exports.ComputedExpression = exports.ClassObserver = exports.SelectValueObserver = exports.CheckedObserver = exports.ValueAttributeObserver = exports.StyleObserver = exports.DataAttributeObserver = exports.dataAttributeAccessor = exports.XLinkAttributeObserver = exports.SetterObserver = exports.PrimitiveObserver = exports.propertyAccessor = exports.DirtyCheckProperty = exports.DirtyChecker = exports.EventSubscriber = exports.EventManager = exports.delegationStrategy = exports.getMapObserver = exports.ParserImplementation = exports.Parser = exports.bindingMode = exports.ExpressionCloner = exports.Unparser = exports.LiteralObject = exports.LiteralArray = exports.LiteralTemplate = exports.LiteralString = exports.LiteralPrimitive = exports.Unary = exports.Binary = exports.CallFunction = exports.CallMember = exports.CallScope = exports.AccessKeyed = exports.AccessMember = exports.AccessScope = exports.AccessThis = exports.Conditional = exports.Assign = exports.ValueConverter = exports.BindingBehavior = exports.Expression = exports.getArrayObserver = exports.CollectionLengthObserver = exports.ModifyCollectionObserver = exports.ExpressionObserver = exports.sourceContext = exports.targetContext = undefined;
  exports.camelCase = camelCase;
  exports.createOverrideContext = createOverrideContext;
  exports.getContextFor = getContextFor;
  exports.createScopeForTest = createScopeForTest;
  exports.connectable = connectable;
  exports.enqueueBindingConnect = enqueueBindingConnect;
  exports.setConnectQueueThreshold = setConnectQueueThreshold;
  exports.enableConnectQueue = enableConnectQueue;
  exports.disableConnectQueue = disableConnectQueue;
  exports.getConnectQueueSize = getConnectQueueSize;
  exports.subscriberCollection = subscriberCollection;
  exports.calcSplices = calcSplices;
  exports.mergeSplice = mergeSplice;
  exports.projectArraySplices = projectArraySplices;
  exports.getChangeRecords = getChangeRecords;
  exports.cloneExpression = cloneExpression;
  exports.hasDeclaredDependencies = hasDeclaredDependencies;
  exports.declarePropertyDependencies = declarePropertyDependencies;
  exports.computedFrom = computedFrom;
  exports.createComputedObserver = createComputedObserver;
  exports.valueConverter = valueConverter;
  exports.bindingBehavior = bindingBehavior;
  exports.observable = observable;
  exports.connectBindingToSignal = connectBindingToSignal;
  exports.signalBindings = signalBindings;

  var LogManager = _interopRequireWildcard(_aureliaLogging);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }



  var _dec, _dec2, _class, _dec3, _class2, _dec4, _class3, _dec5, _class5, _dec6, _class7, _dec7, _class8, _dec8, _class9, _dec9, _class10, _class12, _temp, _dec10, _class13, _class14, _temp2;

  var targetContext = exports.targetContext = 'Binding:target';
  var sourceContext = exports.sourceContext = 'Binding:source';

  var map = Object.create(null);

  function camelCase(name) {
    if (name in map) {
      return map[name];
    }
    var result = name.charAt(0).toLowerCase() + name.slice(1).replace(/[_.-](\w|$)/g, function (_, x) {
      return x.toUpperCase();
    });
    map[name] = result;
    return result;
  }

  function createOverrideContext(bindingContext, parentOverrideContext) {
    return {
      bindingContext: bindingContext,
      parentOverrideContext: parentOverrideContext || null
    };
  }

  function getContextFor(name, scope, ancestor) {
    var oc = scope.overrideContext;

    if (ancestor) {
      while (ancestor && oc) {
        ancestor--;
        oc = oc.parentOverrideContext;
      }
      if (ancestor || !oc) {
        return undefined;
      }
      return name in oc ? oc : oc.bindingContext;
    }

    while (oc && !(name in oc) && !(oc.bindingContext && name in oc.bindingContext)) {
      oc = oc.parentOverrideContext;
    }
    if (oc) {
      return name in oc ? oc : oc.bindingContext;
    }

    return scope.bindingContext || scope.overrideContext;
  }

  function createScopeForTest(bindingContext, parentBindingContext) {
    if (parentBindingContext) {
      return {
        bindingContext: bindingContext,
        overrideContext: createOverrideContext(bindingContext, createOverrideContext(parentBindingContext))
      };
    }
    return {
      bindingContext: bindingContext,
      overrideContext: createOverrideContext(bindingContext)
    };
  }

  var slotNames = [];
  var versionSlotNames = [];
  var lastSlot = -1;
  function ensureEnoughSlotNames(currentSlot) {
    if (currentSlot === lastSlot) {
      lastSlot += 5;
      var ii = slotNames.length = versionSlotNames.length = lastSlot + 1;
      for (var i = currentSlot + 1; i < ii; ++i) {
        slotNames[i] = '_observer' + i;
        versionSlotNames[i] = '_observerVersion' + i;
      }
    }
  }
  ensureEnoughSlotNames(-1);

  function addObserver(observer) {
    var observerSlots = this._observerSlots === undefined ? 0 : this._observerSlots;
    var i = observerSlots;
    while (i-- && this[slotNames[i]] !== observer) {}

    if (i === -1) {
      i = 0;
      while (this[slotNames[i]]) {
        i++;
      }
      this[slotNames[i]] = observer;
      observer.subscribe(sourceContext, this);

      if (i === observerSlots) {
        this._observerSlots = i + 1;
      }
    }

    if (this._version === undefined) {
      this._version = 0;
    }
    this[versionSlotNames[i]] = this._version;
    ensureEnoughSlotNames(i);
  }

  function observeProperty(obj, propertyName) {
    var observer = this.observerLocator.getObserver(obj, propertyName);
    addObserver.call(this, observer);
  }

  function observeArray(array) {
    var observer = this.observerLocator.getArrayObserver(array);
    addObserver.call(this, observer);
  }

  function unobserve(all) {
    var i = this._observerSlots;
    while (i--) {
      if (all || this[versionSlotNames[i]] !== this._version) {
        var observer = this[slotNames[i]];
        this[slotNames[i]] = null;
        if (observer) {
          observer.unsubscribe(sourceContext, this);
        }
      }
    }
  }

  function connectable() {
    return function (target) {
      target.prototype.observeProperty = observeProperty;
      target.prototype.observeArray = observeArray;
      target.prototype.unobserve = unobserve;
      target.prototype.addObserver = addObserver;
    };
  }

  var queue = [];
  var queued = {};
  var nextId = 0;
  var minimumImmediate = 100;
  var frameBudget = 15;

  var isFlushRequested = false;
  var immediate = 0;

  function flush(animationFrameStart) {
    var length = queue.length;
    var i = 0;
    while (i < length) {
      var binding = queue[i];
      queued[binding.__connectQueueId] = false;
      binding.connect(true);
      i++;

      if (i % 100 === 0 && _aureliaPal.PLATFORM.performance.now() - animationFrameStart > frameBudget) {
        break;
      }
    }
    queue.splice(0, i);

    if (queue.length) {
      _aureliaPal.PLATFORM.requestAnimationFrame(flush);
    } else {
      isFlushRequested = false;
      immediate = 0;
    }
  }

  function enqueueBindingConnect(binding) {
    if (immediate < minimumImmediate) {
      immediate++;
      binding.connect(false);
    } else {
      var id = binding.__connectQueueId;
      if (id === undefined) {
        id = nextId;
        nextId++;
        binding.__connectQueueId = id;
      }

      if (!queued[id]) {
        queue.push(binding);
        queued[id] = true;
      }
    }
    if (!isFlushRequested) {
      isFlushRequested = true;
      _aureliaPal.PLATFORM.requestAnimationFrame(flush);
    }
  }

  function setConnectQueueThreshold(value) {
    minimumImmediate = value;
  }

  function enableConnectQueue() {
    setConnectQueueThreshold(100);
  }

  function disableConnectQueue() {
    setConnectQueueThreshold(Number.MAX_SAFE_INTEGER);
  }

  function getConnectQueueSize() {
    return queue.length;
  }

  function addSubscriber(context, callable) {
    if (this.hasSubscriber(context, callable)) {
      return false;
    }
    if (!this._context0) {
      this._context0 = context;
      this._callable0 = callable;
      return true;
    }
    if (!this._context1) {
      this._context1 = context;
      this._callable1 = callable;
      return true;
    }
    if (!this._context2) {
      this._context2 = context;
      this._callable2 = callable;
      return true;
    }
    if (!this._contextsRest) {
      this._contextsRest = [context];
      this._callablesRest = [callable];
      return true;
    }
    this._contextsRest.push(context);
    this._callablesRest.push(callable);
    return true;
  }

  function removeSubscriber(context, callable) {
    if (this._context0 === context && this._callable0 === callable) {
      this._context0 = null;
      this._callable0 = null;
      return true;
    }
    if (this._context1 === context && this._callable1 === callable) {
      this._context1 = null;
      this._callable1 = null;
      return true;
    }
    if (this._context2 === context && this._callable2 === callable) {
      this._context2 = null;
      this._callable2 = null;
      return true;
    }
    var callables = this._callablesRest;
    if (callables === undefined || callables.length === 0) {
      return false;
    }
    var contexts = this._contextsRest;
    var i = 0;
    while (!(callables[i] === callable && contexts[i] === context) && callables.length > i) {
      i++;
    }
    if (i >= callables.length) {
      return false;
    }
    contexts.splice(i, 1);
    callables.splice(i, 1);
    return true;
  }

  var arrayPool1 = [];
  var arrayPool2 = [];
  var poolUtilization = [];

  function callSubscribers(newValue, oldValue) {
    var context0 = this._context0;
    var callable0 = this._callable0;
    var context1 = this._context1;
    var callable1 = this._callable1;
    var context2 = this._context2;
    var callable2 = this._callable2;
    var length = this._contextsRest ? this._contextsRest.length : 0;
    var contextsRest = void 0;
    var callablesRest = void 0;
    var poolIndex = void 0;
    var i = void 0;
    if (length) {
      poolIndex = poolUtilization.length;
      while (poolIndex-- && poolUtilization[poolIndex]) {}
      if (poolIndex < 0) {
        poolIndex = poolUtilization.length;
        contextsRest = [];
        callablesRest = [];
        poolUtilization.push(true);
        arrayPool1.push(contextsRest);
        arrayPool2.push(callablesRest);
      } else {
        poolUtilization[poolIndex] = true;
        contextsRest = arrayPool1[poolIndex];
        callablesRest = arrayPool2[poolIndex];
      }

      i = length;
      while (i--) {
        contextsRest[i] = this._contextsRest[i];
        callablesRest[i] = this._callablesRest[i];
      }
    }

    if (context0) {
      if (callable0) {
        callable0.call(context0, newValue, oldValue);
      } else {
        context0(newValue, oldValue);
      }
    }
    if (context1) {
      if (callable1) {
        callable1.call(context1, newValue, oldValue);
      } else {
        context1(newValue, oldValue);
      }
    }
    if (context2) {
      if (callable2) {
        callable2.call(context2, newValue, oldValue);
      } else {
        context2(newValue, oldValue);
      }
    }
    if (length) {
      for (i = 0; i < length; i++) {
        var callable = callablesRest[i];
        var context = contextsRest[i];
        if (callable) {
          callable.call(context, newValue, oldValue);
        } else {
          context(newValue, oldValue);
        }
        contextsRest[i] = null;
        callablesRest[i] = null;
      }
      poolUtilization[poolIndex] = false;
    }
  }

  function hasSubscribers() {
    return !!(this._context0 || this._context1 || this._context2 || this._contextsRest && this._contextsRest.length);
  }

  function hasSubscriber(context, callable) {
    var has = this._context0 === context && this._callable0 === callable || this._context1 === context && this._callable1 === callable || this._context2 === context && this._callable2 === callable;
    if (has) {
      return true;
    }
    var index = void 0;
    var contexts = this._contextsRest;
    if (!contexts || (index = contexts.length) === 0) {
      return false;
    }
    var callables = this._callablesRest;
    while (index--) {
      if (contexts[index] === context && callables[index] === callable) {
        return true;
      }
    }
    return false;
  }

  function subscriberCollection() {
    return function (target) {
      target.prototype.addSubscriber = addSubscriber;
      target.prototype.removeSubscriber = removeSubscriber;
      target.prototype.callSubscribers = callSubscribers;
      target.prototype.hasSubscribers = hasSubscribers;
      target.prototype.hasSubscriber = hasSubscriber;
    };
  }

  var ExpressionObserver = exports.ExpressionObserver = (_dec = connectable(), _dec2 = subscriberCollection(), _dec(_class = _dec2(_class = function () {
    function ExpressionObserver(scope, expression, observerLocator, lookupFunctions) {


      this.scope = scope;
      this.expression = expression;
      this.observerLocator = observerLocator;
      this.lookupFunctions = lookupFunctions;
    }

    ExpressionObserver.prototype.getValue = function getValue() {
      return this.expression.evaluate(this.scope, this.lookupFunctions);
    };

    ExpressionObserver.prototype.setValue = function setValue(newValue) {
      this.expression.assign(this.scope, newValue);
    };

    ExpressionObserver.prototype.subscribe = function subscribe(context, callable) {
      var _this = this;

      if (!this.hasSubscribers()) {
        this.oldValue = this.expression.evaluate(this.scope, this.lookupFunctions);
        this.expression.connect(this, this.scope);
      }
      this.addSubscriber(context, callable);
      if (arguments.length === 1 && context instanceof Function) {
        return {
          dispose: function dispose() {
            _this.unsubscribe(context, callable);
          }
        };
      }
    };

    ExpressionObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
        this.unobserve(true);
        this.oldValue = undefined;
      }
    };

    ExpressionObserver.prototype.call = function call() {
      var newValue = this.expression.evaluate(this.scope, this.lookupFunctions);
      var oldValue = this.oldValue;
      if (newValue !== oldValue) {
        this.oldValue = newValue;
        this.callSubscribers(newValue, oldValue);
      }
      this._version++;
      this.expression.connect(this, this.scope);
      this.unobserve(false);
    };

    return ExpressionObserver;
  }()) || _class) || _class);


  function isIndex(s) {
    return +s === s >>> 0;
  }

  function toNumber(s) {
    return +s;
  }

  function newSplice(index, removed, addedCount) {
    return {
      index: index,
      removed: removed,
      addedCount: addedCount
    };
  }

  var EDIT_LEAVE = 0;
  var EDIT_UPDATE = 1;
  var EDIT_ADD = 2;
  var EDIT_DELETE = 3;

  function ArraySplice() {}

  ArraySplice.prototype = {
    calcEditDistances: function calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd) {
      var rowCount = oldEnd - oldStart + 1;
      var columnCount = currentEnd - currentStart + 1;
      var distances = new Array(rowCount);
      var north = void 0;
      var west = void 0;

      for (var i = 0; i < rowCount; ++i) {
        distances[i] = new Array(columnCount);
        distances[i][0] = i;
      }

      for (var j = 0; j < columnCount; ++j) {
        distances[0][j] = j;
      }

      for (var _i = 1; _i < rowCount; ++_i) {
        for (var _j = 1; _j < columnCount; ++_j) {
          if (this.equals(current[currentStart + _j - 1], old[oldStart + _i - 1])) {
            distances[_i][_j] = distances[_i - 1][_j - 1];
          } else {
            north = distances[_i - 1][_j] + 1;
            west = distances[_i][_j - 1] + 1;
            distances[_i][_j] = north < west ? north : west;
          }
        }
      }

      return distances;
    },

    spliceOperationsFromEditDistances: function spliceOperationsFromEditDistances(distances) {
      var i = distances.length - 1;
      var j = distances[0].length - 1;
      var current = distances[i][j];
      var edits = [];
      while (i > 0 || j > 0) {
        if (i === 0) {
          edits.push(EDIT_ADD);
          j--;
          continue;
        }
        if (j === 0) {
          edits.push(EDIT_DELETE);
          i--;
          continue;
        }
        var northWest = distances[i - 1][j - 1];
        var west = distances[i - 1][j];
        var north = distances[i][j - 1];

        var min = void 0;
        if (west < north) {
          min = west < northWest ? west : northWest;
        } else {
          min = north < northWest ? north : northWest;
        }

        if (min === northWest) {
          if (northWest === current) {
            edits.push(EDIT_LEAVE);
          } else {
            edits.push(EDIT_UPDATE);
            current = northWest;
          }
          i--;
          j--;
        } else if (min === west) {
          edits.push(EDIT_DELETE);
          i--;
          current = west;
        } else {
          edits.push(EDIT_ADD);
          j--;
          current = north;
        }
      }

      edits.reverse();
      return edits;
    },

    calcSplices: function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
      var prefixCount = 0;
      var suffixCount = 0;

      var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
      if (currentStart === 0 && oldStart === 0) {
        prefixCount = this.sharedPrefix(current, old, minLength);
      }

      if (currentEnd === current.length && oldEnd === old.length) {
        suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
      }

      currentStart += prefixCount;
      oldStart += prefixCount;
      currentEnd -= suffixCount;
      oldEnd -= suffixCount;

      if (currentEnd - currentStart === 0 && oldEnd - oldStart === 0) {
        return [];
      }

      if (currentStart === currentEnd) {
        var _splice = newSplice(currentStart, [], 0);
        while (oldStart < oldEnd) {
          _splice.removed.push(old[oldStart++]);
        }

        return [_splice];
      } else if (oldStart === oldEnd) {
        return [newSplice(currentStart, [], currentEnd - currentStart)];
      }

      var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));

      var splice = undefined;
      var splices = [];
      var index = currentStart;
      var oldIndex = oldStart;
      for (var i = 0; i < ops.length; ++i) {
        switch (ops[i]) {
          case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }

            index++;
            oldIndex++;
            break;
          case EDIT_UPDATE:
            if (!splice) {
              splice = newSplice(index, [], 0);
            }

            splice.addedCount++;
            index++;

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          case EDIT_ADD:
            if (!splice) {
              splice = newSplice(index, [], 0);
            }

            splice.addedCount++;
            index++;
            break;
          case EDIT_DELETE:
            if (!splice) {
              splice = newSplice(index, [], 0);
            }

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
        }
      }

      if (splice) {
        splices.push(splice);
      }
      return splices;
    },

    sharedPrefix: function sharedPrefix(current, old, searchLength) {
      for (var i = 0; i < searchLength; ++i) {
        if (!this.equals(current[i], old[i])) {
          return i;
        }
      }

      return searchLength;
    },

    sharedSuffix: function sharedSuffix(current, old, searchLength) {
      var index1 = current.length;
      var index2 = old.length;
      var count = 0;
      while (count < searchLength && this.equals(current[--index1], old[--index2])) {
        count++;
      }

      return count;
    },

    calculateSplices: function calculateSplices(current, previous) {
      return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
    },

    equals: function equals(currentValue, previousValue) {
      return currentValue === previousValue;
    }
  };

  var arraySplice = new ArraySplice();

  function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
    return arraySplice.calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd);
  }

  function intersect(start1, end1, start2, end2) {
    if (end1 < start2 || end2 < start1) {
      return -1;
    }

    if (end1 === start2 || end2 === start1) {
      return 0;
    }

    if (start1 < start2) {
      if (end1 < end2) {
        return end1 - start2;
      }

      return end2 - start2;
    }

    if (end2 < end1) {
      return end2 - start1;
    }

    return end1 - start1;
  }

  function mergeSplice(splices, index, removed, addedCount) {
    var splice = newSplice(index, removed, addedCount);

    var inserted = false;
    var insertionOffset = 0;

    for (var i = 0; i < splices.length; i++) {
      var current = splices[i];
      current.index += insertionOffset;

      if (inserted) {
        continue;
      }

      var intersectCount = intersect(splice.index, splice.index + splice.removed.length, current.index, current.index + current.addedCount);

      if (intersectCount >= 0) {

        splices.splice(i, 1);
        i--;

        insertionOffset -= current.addedCount - current.removed.length;

        splice.addedCount += current.addedCount - intersectCount;
        var deleteCount = splice.removed.length + current.removed.length - intersectCount;

        if (!splice.addedCount && !deleteCount) {
          inserted = true;
        } else {
          var currentRemoved = current.removed;

          if (splice.index < current.index) {
            var prepend = splice.removed.slice(0, current.index - splice.index);
            Array.prototype.push.apply(prepend, currentRemoved);
            currentRemoved = prepend;
          }

          if (splice.index + splice.removed.length > current.index + current.addedCount) {
            var append = splice.removed.slice(current.index + current.addedCount - splice.index);
            Array.prototype.push.apply(currentRemoved, append);
          }

          splice.removed = currentRemoved;
          if (current.index < splice.index) {
            splice.index = current.index;
          }
        }
      } else if (splice.index < current.index) {

        inserted = true;

        splices.splice(i, 0, splice);
        i++;

        var offset = splice.addedCount - splice.removed.length;
        current.index += offset;
        insertionOffset += offset;
      }
    }

    if (!inserted) {
      splices.push(splice);
    }
  }

  function createInitialSplices(array, changeRecords) {
    var splices = [];

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      switch (record.type) {
        case 'splice':
          mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
          break;
        case 'add':
        case 'update':
        case 'delete':
          if (!isIndex(record.name)) {
            continue;
          }

          var index = toNumber(record.name);
          if (index < 0) {
            continue;
          }

          mergeSplice(splices, index, [record.oldValue], record.type === 'delete' ? 0 : 1);
          break;
        default:
          console.error('Unexpected record type: ' + JSON.stringify(record));
          break;
      }
    }

    return splices;
  }

  function projectArraySplices(array, changeRecords) {
    var splices = [];

    createInitialSplices(array, changeRecords).forEach(function (splice) {
      if (splice.addedCount === 1 && splice.removed.length === 1) {
        if (splice.removed[0] !== array[splice.index]) {
          splices.push(splice);
        }

        return;
      }

      splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount, splice.removed, 0, splice.removed.length));
    });

    return splices;
  }

  function newRecord(type, object, key, oldValue) {
    return {
      type: type,
      object: object,
      key: key,
      oldValue: oldValue
    };
  }

  function getChangeRecords(map) {
    var entries = new Array(map.size);
    var keys = map.keys();
    var i = 0;
    var item = void 0;

    while (item = keys.next()) {
      if (item.done) {
        break;
      }

      entries[i] = newRecord('added', map, item.value);
      i++;
    }

    return entries;
  }

  var ModifyCollectionObserver = exports.ModifyCollectionObserver = (_dec3 = subscriberCollection(), _dec3(_class2 = function () {
    function ModifyCollectionObserver(taskQueue, collection) {


      this.taskQueue = taskQueue;
      this.queued = false;
      this.changeRecords = null;
      this.oldCollection = null;
      this.collection = collection;
      this.lengthPropertyName = collection instanceof Map || collection instanceof Set ? 'size' : 'length';
    }

    ModifyCollectionObserver.prototype.subscribe = function subscribe(context, callable) {
      this.addSubscriber(context, callable);
    };

    ModifyCollectionObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      this.removeSubscriber(context, callable);
    };

    ModifyCollectionObserver.prototype.addChangeRecord = function addChangeRecord(changeRecord) {
      if (!this.hasSubscribers() && !this.lengthObserver) {
        return;
      }

      if (changeRecord.type === 'splice') {
        var index = changeRecord.index;
        var arrayLength = changeRecord.object.length;
        if (index > arrayLength) {
          index = arrayLength - changeRecord.addedCount;
        } else if (index < 0) {
          index = arrayLength + changeRecord.removed.length + index - changeRecord.addedCount;
        }
        if (index < 0) {
          index = 0;
        }
        changeRecord.index = index;
      }

      if (this.changeRecords === null) {
        this.changeRecords = [changeRecord];
      } else {
        this.changeRecords.push(changeRecord);
      }

      if (!this.queued) {
        this.queued = true;
        this.taskQueue.queueMicroTask(this);
      }
    };

    ModifyCollectionObserver.prototype.flushChangeRecords = function flushChangeRecords() {
      if (this.changeRecords && this.changeRecords.length || this.oldCollection) {
        this.call();
      }
    };

    ModifyCollectionObserver.prototype.reset = function reset(oldCollection) {
      this.oldCollection = oldCollection;

      if (this.hasSubscribers() && !this.queued) {
        this.queued = true;
        this.taskQueue.queueMicroTask(this);
      }
    };

    ModifyCollectionObserver.prototype.getLengthObserver = function getLengthObserver() {
      return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection));
    };

    ModifyCollectionObserver.prototype.call = function call() {
      var changeRecords = this.changeRecords;
      var oldCollection = this.oldCollection;
      var records = void 0;

      this.queued = false;
      this.changeRecords = [];
      this.oldCollection = null;

      if (this.hasSubscribers()) {
        if (oldCollection) {
          if (this.collection instanceof Map || this.collection instanceof Set) {
            records = getChangeRecords(oldCollection);
          } else {
            records = calcSplices(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
          }
        } else {
          if (this.collection instanceof Map || this.collection instanceof Set) {
            records = changeRecords;
          } else {
            records = projectArraySplices(this.collection, changeRecords);
          }
        }

        this.callSubscribers(records);
      }

      if (this.lengthObserver) {
        this.lengthObserver.call(this.collection[this.lengthPropertyName]);
      }
    };

    return ModifyCollectionObserver;
  }()) || _class2);
  var CollectionLengthObserver = exports.CollectionLengthObserver = (_dec4 = subscriberCollection(), _dec4(_class3 = function () {
    function CollectionLengthObserver(collection) {


      this.collection = collection;
      this.lengthPropertyName = collection instanceof Map || collection instanceof Set ? 'size' : 'length';
      this.currentValue = collection[this.lengthPropertyName];
    }

    CollectionLengthObserver.prototype.getValue = function getValue() {
      return this.collection[this.lengthPropertyName];
    };

    CollectionLengthObserver.prototype.setValue = function setValue(newValue) {
      this.collection[this.lengthPropertyName] = newValue;
    };

    CollectionLengthObserver.prototype.subscribe = function subscribe(context, callable) {
      this.addSubscriber(context, callable);
    };

    CollectionLengthObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      this.removeSubscriber(context, callable);
    };

    CollectionLengthObserver.prototype.call = function call(newValue) {
      var oldValue = this.currentValue;
      this.callSubscribers(newValue, oldValue);
      this.currentValue = newValue;
    };

    return CollectionLengthObserver;
  }()) || _class3);

  var arrayProto = Array.prototype;
  var pop = arrayProto.pop;
  var push = arrayProto.push;
  var reverse = arrayProto.reverse;
  var shift = arrayProto.shift;
  var sort = arrayProto.sort;
  var splice = arrayProto.splice;
  var unshift = arrayProto.unshift;

  if (arrayProto.__au_patched__) {
    LogManager.getLogger('array-observation').warn('Detected 2nd attempt of patching array from Aurelia binding.' + ' This is probably caused by dependency mismatch between core modules and a 3rd party plugin.' + ' Please see https://github.com/aurelia/cli/pull/906 if you are using webpack.');
  } else {
    Reflect.defineProperty(arrayProto, '__au_patched__', { value: 1 });
    arrayProto.pop = function () {
      var notEmpty = this.length > 0;
      var methodCallResult = pop.apply(this, arguments);
      if (notEmpty && this.__array_observer__ !== undefined) {
        this.__array_observer__.addChangeRecord({
          type: 'delete',
          object: this,
          name: this.length,
          oldValue: methodCallResult
        });
      }
      return methodCallResult;
    };

    arrayProto.push = function () {
      var methodCallResult = push.apply(this, arguments);
      if (this.__array_observer__ !== undefined) {
        this.__array_observer__.addChangeRecord({
          type: 'splice',
          object: this,
          index: this.length - arguments.length,
          removed: [],
          addedCount: arguments.length
        });
      }
      return methodCallResult;
    };

    arrayProto.reverse = function () {
      var oldArray = void 0;
      if (this.__array_observer__ !== undefined) {
        this.__array_observer__.flushChangeRecords();
        oldArray = this.slice();
      }
      var methodCallResult = reverse.apply(this, arguments);
      if (this.__array_observer__ !== undefined) {
        this.__array_observer__.reset(oldArray);
      }
      return methodCallResult;
    };

    arrayProto.shift = function () {
      var notEmpty = this.length > 0;
      var methodCallResult = shift.apply(this, arguments);
      if (notEmpty && this.__array_observer__ !== undefined) {
        this.__array_observer__.addChangeRecord({
          type: 'delete',
          object: this,
          name: 0,
          oldValue: methodCallResult
        });
      }
      return methodCallResult;
    };

    arrayProto.sort = function () {
      var oldArray = void 0;
      if (this.__array_observer__ !== undefined) {
        this.__array_observer__.flushChangeRecords();
        oldArray = this.slice();
      }
      var methodCallResult = sort.apply(this, arguments);
      if (this.__array_observer__ !== undefined) {
        this.__array_observer__.reset(oldArray);
      }
      return methodCallResult;
    };

    arrayProto.splice = function () {
      var methodCallResult = splice.apply(this, arguments);
      if (this.__array_observer__ !== undefined) {
        this.__array_observer__.addChangeRecord({
          type: 'splice',
          object: this,
          index: +arguments[0],
          removed: methodCallResult,
          addedCount: arguments.length > 2 ? arguments.length - 2 : 0
        });
      }
      return methodCallResult;
    };

    arrayProto.unshift = function () {
      var methodCallResult = unshift.apply(this, arguments);
      if (this.__array_observer__ !== undefined) {
        this.__array_observer__.addChangeRecord({
          type: 'splice',
          object: this,
          index: 0,
          removed: [],
          addedCount: arguments.length
        });
      }
      return methodCallResult;
    };
  }

  function _getArrayObserver(taskQueue, array) {
    return ModifyArrayObserver.for(taskQueue, array);
  }

  exports.getArrayObserver = _getArrayObserver;

  var ModifyArrayObserver = function (_ModifyCollectionObse) {
    _inherits(ModifyArrayObserver, _ModifyCollectionObse);

    function ModifyArrayObserver(taskQueue, array) {


      return _possibleConstructorReturn(this, _ModifyCollectionObse.call(this, taskQueue, array));
    }

    ModifyArrayObserver.for = function _for(taskQueue, array) {
      if (!('__array_observer__' in array)) {
        Reflect.defineProperty(array, '__array_observer__', {
          value: ModifyArrayObserver.create(taskQueue, array),
          enumerable: false, configurable: false
        });
      }
      return array.__array_observer__;
    };

    ModifyArrayObserver.create = function create(taskQueue, array) {
      return new ModifyArrayObserver(taskQueue, array);
    };

    return ModifyArrayObserver;
  }(ModifyCollectionObserver);

  var Expression = exports.Expression = function () {
    function Expression() {


      this.isAssignable = false;
    }

    Expression.prototype.evaluate = function evaluate(scope, lookupFunctions, args) {
      throw new Error('Binding expression "' + this + '" cannot be evaluated.');
    };

    Expression.prototype.assign = function assign(scope, value, lookupFunctions) {
      throw new Error('Binding expression "' + this + '" cannot be assigned to.');
    };

    Expression.prototype.toString = function toString() {
      return typeof FEATURE_NO_UNPARSER === 'undefined' ? _Unparser.unparse(this) : Function.prototype.toString.call(this);
    };

    return Expression;
  }();

  var BindingBehavior = exports.BindingBehavior = function (_Expression) {
    _inherits(BindingBehavior, _Expression);

    function BindingBehavior(expression, name, args) {


      var _this3 = _possibleConstructorReturn(this, _Expression.call(this));

      _this3.expression = expression;
      _this3.name = name;
      _this3.args = args;
      return _this3;
    }

    BindingBehavior.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      return this.expression.evaluate(scope, lookupFunctions);
    };

    BindingBehavior.prototype.assign = function assign(scope, value, lookupFunctions) {
      return this.expression.assign(scope, value, lookupFunctions);
    };

    BindingBehavior.prototype.accept = function accept(visitor) {
      return visitor.visitBindingBehavior(this);
    };

    BindingBehavior.prototype.connect = function connect(binding, scope) {
      this.expression.connect(binding, scope);
    };

    BindingBehavior.prototype.bind = function bind(binding, scope, lookupFunctions) {
      if (this.expression.expression && this.expression.bind) {
        this.expression.bind(binding, scope, lookupFunctions);
      }
      var behavior = lookupFunctions.bindingBehaviors(this.name);
      if (!behavior) {
        throw new Error('No BindingBehavior named "' + this.name + '" was found!');
      }
      var behaviorKey = 'behavior-' + this.name;
      if (binding[behaviorKey]) {
        throw new Error('A binding behavior named "' + this.name + '" has already been applied to "' + this.expression + '"');
      }
      binding[behaviorKey] = behavior;
      behavior.bind.apply(behavior, [binding, scope].concat(evalList(scope, this.args, binding.lookupFunctions)));
    };

    BindingBehavior.prototype.unbind = function unbind(binding, scope) {
      var behaviorKey = 'behavior-' + this.name;
      binding[behaviorKey].unbind(binding, scope);
      binding[behaviorKey] = null;
      if (this.expression.expression && this.expression.unbind) {
        this.expression.unbind(binding, scope);
      }
    };

    return BindingBehavior;
  }(Expression);

  var ValueConverter = exports.ValueConverter = function (_Expression2) {
    _inherits(ValueConverter, _Expression2);

    function ValueConverter(expression, name, args) {


      var _this4 = _possibleConstructorReturn(this, _Expression2.call(this));

      _this4.expression = expression;
      _this4.name = name;
      _this4.args = args;
      _this4.allArgs = [expression].concat(args);
      return _this4;
    }

    ValueConverter.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var converter = lookupFunctions.valueConverters(this.name);
      if (!converter) {
        throw new Error('No ValueConverter named "' + this.name + '" was found!');
      }

      if ('toView' in converter) {
        return converter.toView.apply(converter, evalList(scope, this.allArgs, lookupFunctions));
      }

      return this.allArgs[0].evaluate(scope, lookupFunctions);
    };

    ValueConverter.prototype.assign = function assign(scope, value, lookupFunctions) {
      var converter = lookupFunctions.valueConverters(this.name);
      if (!converter) {
        throw new Error('No ValueConverter named "' + this.name + '" was found!');
      }

      if ('fromView' in converter) {
        value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, lookupFunctions)));
      }

      return this.allArgs[0].assign(scope, value, lookupFunctions);
    };

    ValueConverter.prototype.accept = function accept(visitor) {
      return visitor.visitValueConverter(this);
    };

    ValueConverter.prototype.connect = function connect(binding, scope) {
      var expressions = this.allArgs;
      var i = expressions.length;
      while (i--) {
        expressions[i].connect(binding, scope);
      }
      var converter = binding.lookupFunctions.valueConverters(this.name);
      if (!converter) {
        throw new Error('No ValueConverter named "' + this.name + '" was found!');
      }
      var signals = converter.signals;
      if (signals === undefined) {
        return;
      }
      i = signals.length;
      while (i--) {
        connectBindingToSignal(binding, signals[i]);
      }
    };

    return ValueConverter;
  }(Expression);

  var Assign = exports.Assign = function (_Expression3) {
    _inherits(Assign, _Expression3);

    function Assign(target, value) {


      var _this5 = _possibleConstructorReturn(this, _Expression3.call(this));

      _this5.target = target;
      _this5.value = value;
      _this5.isAssignable = true;
      return _this5;
    }

    Assign.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      return this.target.assign(scope, this.value.evaluate(scope, lookupFunctions));
    };

    Assign.prototype.accept = function accept(vistor) {
      vistor.visitAssign(this);
    };

    Assign.prototype.connect = function connect(binding, scope) {};

    Assign.prototype.assign = function assign(scope, value) {
      this.value.assign(scope, value);
      this.target.assign(scope, value);
    };

    return Assign;
  }(Expression);

  var Conditional = exports.Conditional = function (_Expression4) {
    _inherits(Conditional, _Expression4);

    function Conditional(condition, yes, no) {


      var _this6 = _possibleConstructorReturn(this, _Expression4.call(this));

      _this6.condition = condition;
      _this6.yes = yes;
      _this6.no = no;
      return _this6;
    }

    Conditional.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      return !!this.condition.evaluate(scope, lookupFunctions) ? this.yes.evaluate(scope, lookupFunctions) : this.no.evaluate(scope, lookupFunctions);
    };

    Conditional.prototype.accept = function accept(visitor) {
      return visitor.visitConditional(this);
    };

    Conditional.prototype.connect = function connect(binding, scope) {
      this.condition.connect(binding, scope);
      if (this.condition.evaluate(scope)) {
        this.yes.connect(binding, scope);
      } else {
        this.no.connect(binding, scope);
      }
    };

    return Conditional;
  }(Expression);

  var AccessThis = exports.AccessThis = function (_Expression5) {
    _inherits(AccessThis, _Expression5);

    function AccessThis(ancestor) {


      var _this7 = _possibleConstructorReturn(this, _Expression5.call(this));

      _this7.ancestor = ancestor;
      return _this7;
    }

    AccessThis.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var oc = scope.overrideContext;
      var i = this.ancestor;
      while (i-- && oc) {
        oc = oc.parentOverrideContext;
      }
      return i < 1 && oc ? oc.bindingContext : undefined;
    };

    AccessThis.prototype.accept = function accept(visitor) {
      return visitor.visitAccessThis(this);
    };

    AccessThis.prototype.connect = function connect(binding, scope) {};

    return AccessThis;
  }(Expression);

  var AccessScope = exports.AccessScope = function (_Expression6) {
    _inherits(AccessScope, _Expression6);

    function AccessScope(name, ancestor) {


      var _this8 = _possibleConstructorReturn(this, _Expression6.call(this));

      _this8.name = name;
      _this8.ancestor = ancestor;
      _this8.isAssignable = true;
      return _this8;
    }

    AccessScope.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var context = getContextFor(this.name, scope, this.ancestor);
      return context[this.name];
    };

    AccessScope.prototype.assign = function assign(scope, value) {
      var context = getContextFor(this.name, scope, this.ancestor);
      return context ? context[this.name] = value : undefined;
    };

    AccessScope.prototype.accept = function accept(visitor) {
      return visitor.visitAccessScope(this);
    };

    AccessScope.prototype.connect = function connect(binding, scope) {
      var context = getContextFor(this.name, scope, this.ancestor);
      binding.observeProperty(context, this.name);
    };

    return AccessScope;
  }(Expression);

  var AccessMember = exports.AccessMember = function (_Expression7) {
    _inherits(AccessMember, _Expression7);

    function AccessMember(object, name) {


      var _this9 = _possibleConstructorReturn(this, _Expression7.call(this));

      _this9.object = object;
      _this9.name = name;
      _this9.isAssignable = true;
      return _this9;
    }

    AccessMember.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var instance = this.object.evaluate(scope, lookupFunctions);
      return instance === null || instance === undefined ? instance : instance[this.name];
    };

    AccessMember.prototype.assign = function assign(scope, value) {
      var instance = this.object.evaluate(scope);

      if (instance === null || instance === undefined) {
        instance = {};
        this.object.assign(scope, instance);
      }

      instance[this.name] = value;
      return value;
    };

    AccessMember.prototype.accept = function accept(visitor) {
      return visitor.visitAccessMember(this);
    };

    AccessMember.prototype.connect = function connect(binding, scope) {
      this.object.connect(binding, scope);
      var obj = this.object.evaluate(scope);
      if (obj) {
        binding.observeProperty(obj, this.name);
      }
    };

    return AccessMember;
  }(Expression);

  var AccessKeyed = exports.AccessKeyed = function (_Expression8) {
    _inherits(AccessKeyed, _Expression8);

    function AccessKeyed(object, key) {


      var _this10 = _possibleConstructorReturn(this, _Expression8.call(this));

      _this10.object = object;
      _this10.key = key;
      _this10.isAssignable = true;
      return _this10;
    }

    AccessKeyed.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var instance = this.object.evaluate(scope, lookupFunctions);
      var lookup = this.key.evaluate(scope, lookupFunctions);
      return getKeyed(instance, lookup);
    };

    AccessKeyed.prototype.assign = function assign(scope, value) {
      var instance = this.object.evaluate(scope);
      var lookup = this.key.evaluate(scope);
      return setKeyed(instance, lookup, value);
    };

    AccessKeyed.prototype.accept = function accept(visitor) {
      return visitor.visitAccessKeyed(this);
    };

    AccessKeyed.prototype.connect = function connect(binding, scope) {
      this.object.connect(binding, scope);
      var obj = this.object.evaluate(scope);
      if (obj instanceof Object) {
        this.key.connect(binding, scope);
        var key = this.key.evaluate(scope);

        if (key !== null && key !== undefined && !(Array.isArray(obj) && typeof key === 'number')) {
          binding.observeProperty(obj, key);
        }
      }
    };

    return AccessKeyed;
  }(Expression);

  var CallScope = exports.CallScope = function (_Expression9) {
    _inherits(CallScope, _Expression9);

    function CallScope(name, args, ancestor) {


      var _this11 = _possibleConstructorReturn(this, _Expression9.call(this));

      _this11.name = name;
      _this11.args = args;
      _this11.ancestor = ancestor;
      return _this11;
    }

    CallScope.prototype.evaluate = function evaluate(scope, lookupFunctions, mustEvaluate) {
      var args = evalList(scope, this.args, lookupFunctions);
      var context = getContextFor(this.name, scope, this.ancestor);
      var func = getFunction(context, this.name, mustEvaluate);
      if (func) {
        return func.apply(context, args);
      }
      return undefined;
    };

    CallScope.prototype.accept = function accept(visitor) {
      return visitor.visitCallScope(this);
    };

    CallScope.prototype.connect = function connect(binding, scope) {
      var args = this.args;
      var i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    };

    return CallScope;
  }(Expression);

  var CallMember = exports.CallMember = function (_Expression10) {
    _inherits(CallMember, _Expression10);

    function CallMember(object, name, args) {


      var _this12 = _possibleConstructorReturn(this, _Expression10.call(this));

      _this12.object = object;
      _this12.name = name;
      _this12.args = args;
      return _this12;
    }

    CallMember.prototype.evaluate = function evaluate(scope, lookupFunctions, mustEvaluate) {
      var instance = this.object.evaluate(scope, lookupFunctions);
      var args = evalList(scope, this.args, lookupFunctions);
      var func = getFunction(instance, this.name, mustEvaluate);
      if (func) {
        return func.apply(instance, args);
      }
      return undefined;
    };

    CallMember.prototype.accept = function accept(visitor) {
      return visitor.visitCallMember(this);
    };

    CallMember.prototype.connect = function connect(binding, scope) {
      this.object.connect(binding, scope);
      var obj = this.object.evaluate(scope);
      if (getFunction(obj, this.name, false)) {
        var args = this.args;
        var i = args.length;
        while (i--) {
          args[i].connect(binding, scope);
        }
      }
    };

    return CallMember;
  }(Expression);

  var CallFunction = exports.CallFunction = function (_Expression11) {
    _inherits(CallFunction, _Expression11);

    function CallFunction(func, args) {


      var _this13 = _possibleConstructorReturn(this, _Expression11.call(this));

      _this13.func = func;
      _this13.args = args;
      return _this13;
    }

    CallFunction.prototype.evaluate = function evaluate(scope, lookupFunctions, mustEvaluate) {
      var func = this.func.evaluate(scope, lookupFunctions);
      if (typeof func === 'function') {
        return func.apply(null, evalList(scope, this.args, lookupFunctions));
      }
      if (!mustEvaluate && (func === null || func === undefined)) {
        return undefined;
      }
      throw new Error(this.func + ' is not a function');
    };

    CallFunction.prototype.accept = function accept(visitor) {
      return visitor.visitCallFunction(this);
    };

    CallFunction.prototype.connect = function connect(binding, scope) {
      this.func.connect(binding, scope);
      var func = this.func.evaluate(scope);
      if (typeof func === 'function') {
        var args = this.args;
        var i = args.length;
        while (i--) {
          args[i].connect(binding, scope);
        }
      }
    };

    return CallFunction;
  }(Expression);

  var Binary = exports.Binary = function (_Expression12) {
    _inherits(Binary, _Expression12);

    function Binary(operation, left, right) {


      var _this14 = _possibleConstructorReturn(this, _Expression12.call(this));

      _this14.operation = operation;
      _this14.left = left;
      _this14.right = right;
      return _this14;
    }

    Binary.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var left = this.left.evaluate(scope, lookupFunctions);

      switch (this.operation) {
        case '&&':
          return left && this.right.evaluate(scope, lookupFunctions);
        case '||':
          return left || this.right.evaluate(scope, lookupFunctions);
      }

      var right = this.right.evaluate(scope, lookupFunctions);

      switch (this.operation) {
        case '==':
          return left == right;
        case '===':
          return left === right;
        case '!=':
          return left != right;
        case '!==':
          return left !== right;
        case 'instanceof':
          return typeof right === 'function' && left instanceof right;
        case 'in':
          return (typeof right === 'undefined' ? 'undefined' : _typeof(right)) === 'object' && right !== null && left in right;
      }

      if (left === null || right === null || left === undefined || right === undefined) {
        switch (this.operation) {
          case '+':
            if (left !== null && left !== undefined) return left;
            if (right !== null && right !== undefined) return right;
            return 0;
          case '-':
            if (left !== null && left !== undefined) return left;
            if (right !== null && right !== undefined) return 0 - right;
            return 0;
        }

        return null;
      }

      switch (this.operation) {
        case '+':
          return autoConvertAdd(left, right);
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '%':
          return left % right;
        case '<':
          return left < right;
        case '>':
          return left > right;
        case '<=':
          return left <= right;
        case '>=':
          return left >= right;
        case '^':
          return left ^ right;
      }

      throw new Error('Internal error [' + this.operation + '] not handled');
    };

    Binary.prototype.accept = function accept(visitor) {
      return visitor.visitBinary(this);
    };

    Binary.prototype.connect = function connect(binding, scope) {
      this.left.connect(binding, scope);
      var left = this.left.evaluate(scope);
      if (this.operation === '&&' && !left || this.operation === '||' && left) {
        return;
      }
      this.right.connect(binding, scope);
    };

    return Binary;
  }(Expression);

  var Unary = exports.Unary = function (_Expression13) {
    _inherits(Unary, _Expression13);

    function Unary(operation, expression) {


      var _this15 = _possibleConstructorReturn(this, _Expression13.call(this));

      _this15.operation = operation;
      _this15.expression = expression;
      return _this15;
    }

    Unary.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      switch (this.operation) {
        case '!':
          return !this.expression.evaluate(scope, lookupFunctions);
        case 'typeof':
          return _typeof(this.expression.evaluate(scope, lookupFunctions));
        case 'void':
          return void this.expression.evaluate(scope, lookupFunctions);
      }

      throw new Error('Internal error [' + this.operation + '] not handled');
    };

    Unary.prototype.accept = function accept(visitor) {
      return visitor.visitPrefix(this);
    };

    Unary.prototype.connect = function connect(binding, scope) {
      this.expression.connect(binding, scope);
    };

    return Unary;
  }(Expression);

  var LiteralPrimitive = exports.LiteralPrimitive = function (_Expression14) {
    _inherits(LiteralPrimitive, _Expression14);

    function LiteralPrimitive(value) {


      var _this16 = _possibleConstructorReturn(this, _Expression14.call(this));

      _this16.value = value;
      return _this16;
    }

    LiteralPrimitive.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      return this.value;
    };

    LiteralPrimitive.prototype.accept = function accept(visitor) {
      return visitor.visitLiteralPrimitive(this);
    };

    LiteralPrimitive.prototype.connect = function connect(binding, scope) {};

    return LiteralPrimitive;
  }(Expression);

  var LiteralString = exports.LiteralString = function (_Expression15) {
    _inherits(LiteralString, _Expression15);

    function LiteralString(value) {


      var _this17 = _possibleConstructorReturn(this, _Expression15.call(this));

      _this17.value = value;
      return _this17;
    }

    LiteralString.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      return this.value;
    };

    LiteralString.prototype.accept = function accept(visitor) {
      return visitor.visitLiteralString(this);
    };

    LiteralString.prototype.connect = function connect(binding, scope) {};

    return LiteralString;
  }(Expression);

  var LiteralTemplate = exports.LiteralTemplate = function (_Expression16) {
    _inherits(LiteralTemplate, _Expression16);

    function LiteralTemplate(cooked, expressions, raw, tag) {


      var _this18 = _possibleConstructorReturn(this, _Expression16.call(this));

      _this18.cooked = cooked;
      _this18.expressions = expressions || [];
      _this18.length = _this18.expressions.length;
      _this18.tagged = tag !== undefined;
      if (_this18.tagged) {
        _this18.cooked.raw = raw;
        _this18.tag = tag;
        if (tag instanceof AccessScope) {
          _this18.contextType = 'Scope';
        } else if (tag instanceof AccessMember || tag instanceof AccessKeyed) {
          _this18.contextType = 'Object';
        } else {
          throw new Error(_this18.tag + ' is not a valid template tag');
        }
      }
      return _this18;
    }

    LiteralTemplate.prototype.getScopeContext = function getScopeContext(scope, lookupFunctions) {
      return getContextFor(this.tag.name, scope, this.tag.ancestor);
    };

    LiteralTemplate.prototype.getObjectContext = function getObjectContext(scope, lookupFunctions) {
      return this.tag.object.evaluate(scope, lookupFunctions);
    };

    LiteralTemplate.prototype.evaluate = function evaluate(scope, lookupFunctions, mustEvaluate) {
      var results = new Array(this.length);
      for (var i = 0; i < this.length; i++) {
        results[i] = this.expressions[i].evaluate(scope, lookupFunctions);
      }
      if (this.tagged) {
        var func = this.tag.evaluate(scope, lookupFunctions);
        if (typeof func === 'function') {
          var context = this['get' + this.contextType + 'Context'](scope, lookupFunctions);
          return func.call.apply(func, [context, this.cooked].concat(results));
        }
        if (!mustEvaluate) {
          return null;
        }
        throw new Error(this.tag + ' is not a function');
      }
      var result = this.cooked[0];
      for (var _i2 = 0; _i2 < this.length; _i2++) {
        result = String.prototype.concat(result, results[_i2], this.cooked[_i2 + 1]);
      }
      return result;
    };

    LiteralTemplate.prototype.accept = function accept(visitor) {
      return visitor.visitLiteralTemplate(this);
    };

    LiteralTemplate.prototype.connect = function connect(binding, scope) {
      for (var i = 0; i < this.length; i++) {
        this.expressions[i].connect(binding, scope);
      }
      if (this.tagged) {
        this.tag.connect(binding, scope);
      }
    };

    return LiteralTemplate;
  }(Expression);

  var LiteralArray = exports.LiteralArray = function (_Expression17) {
    _inherits(LiteralArray, _Expression17);

    function LiteralArray(elements) {


      var _this19 = _possibleConstructorReturn(this, _Expression17.call(this));

      _this19.elements = elements;
      return _this19;
    }

    LiteralArray.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var elements = this.elements;
      var result = [];

      for (var i = 0, length = elements.length; i < length; ++i) {
        result[i] = elements[i].evaluate(scope, lookupFunctions);
      }

      return result;
    };

    LiteralArray.prototype.accept = function accept(visitor) {
      return visitor.visitLiteralArray(this);
    };

    LiteralArray.prototype.connect = function connect(binding, scope) {
      var length = this.elements.length;
      for (var i = 0; i < length; i++) {
        this.elements[i].connect(binding, scope);
      }
    };

    return LiteralArray;
  }(Expression);

  var LiteralObject = exports.LiteralObject = function (_Expression18) {
    _inherits(LiteralObject, _Expression18);

    function LiteralObject(keys, values) {


      var _this20 = _possibleConstructorReturn(this, _Expression18.call(this));

      _this20.keys = keys;
      _this20.values = values;
      return _this20;
    }

    LiteralObject.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      var instance = {};
      var keys = this.keys;
      var values = this.values;

      for (var i = 0, length = keys.length; i < length; ++i) {
        instance[keys[i]] = values[i].evaluate(scope, lookupFunctions);
      }

      return instance;
    };

    LiteralObject.prototype.accept = function accept(visitor) {
      return visitor.visitLiteralObject(this);
    };

    LiteralObject.prototype.connect = function connect(binding, scope) {
      var length = this.keys.length;
      for (var i = 0; i < length; i++) {
        this.values[i].connect(binding, scope);
      }
    };

    return LiteralObject;
  }(Expression);

  function evalList(scope, list, lookupFunctions) {
    var length = list.length;
    var result = [];
    for (var i = 0; i < length; i++) {
      result[i] = list[i].evaluate(scope, lookupFunctions);
    }
    return result;
  }

  function autoConvertAdd(a, b) {
    if (a !== null && b !== null) {
      if (typeof a === 'string' && typeof b !== 'string') {
        return a + b.toString();
      }

      if (typeof a !== 'string' && typeof b === 'string') {
        return a.toString() + b;
      }

      return a + b;
    }

    if (a !== null) {
      return a;
    }

    if (b !== null) {
      return b;
    }

    return 0;
  }

  function getFunction(obj, name, mustExist) {
    var func = obj === null || obj === undefined ? null : obj[name];
    if (typeof func === 'function') {
      return func;
    }
    if (!mustExist && (func === null || func === undefined)) {
      return null;
    }
    throw new Error(name + ' is not a function');
  }

  function getKeyed(obj, key) {
    if (Array.isArray(obj)) {
      return obj[parseInt(key, 10)];
    } else if (obj) {
      return obj[key];
    } else if (obj === null || obj === undefined) {
      return undefined;
    }

    return obj[key];
  }

  function setKeyed(obj, key, value) {
    if (Array.isArray(obj)) {
      var index = parseInt(key, 10);

      if (obj.length <= index) {
        obj.length = index + 1;
      }

      obj[index] = value;
    } else {
      obj[key] = value;
    }

    return value;
  }

  var _Unparser = null;

  exports.Unparser = _Unparser;
  if (typeof FEATURE_NO_UNPARSER === 'undefined') {
    exports.Unparser = _Unparser = function () {
      function Unparser(buffer) {


        this.buffer = buffer;
      }

      Unparser.unparse = function unparse(expression) {
        var buffer = [];
        var visitor = new _Unparser(buffer);

        expression.accept(visitor);

        return buffer.join('');
      };

      Unparser.prototype.write = function write(text) {
        this.buffer.push(text);
      };

      Unparser.prototype.writeArgs = function writeArgs(args) {
        this.write('(');

        for (var i = 0, length = args.length; i < length; ++i) {
          if (i !== 0) {
            this.write(',');
          }

          args[i].accept(this);
        }

        this.write(')');
      };

      Unparser.prototype.visitBindingBehavior = function visitBindingBehavior(behavior) {
        var args = behavior.args;

        behavior.expression.accept(this);
        this.write('&' + behavior.name);

        for (var i = 0, length = args.length; i < length; ++i) {
          this.write(':');
          args[i].accept(this);
        }
      };

      Unparser.prototype.visitValueConverter = function visitValueConverter(converter) {
        var args = converter.args;

        converter.expression.accept(this);
        this.write('|' + converter.name);

        for (var i = 0, length = args.length; i < length; ++i) {
          this.write(':');
          args[i].accept(this);
        }
      };

      Unparser.prototype.visitAssign = function visitAssign(assign) {
        assign.target.accept(this);
        this.write('=');
        assign.value.accept(this);
      };

      Unparser.prototype.visitConditional = function visitConditional(conditional) {
        conditional.condition.accept(this);
        this.write('?');
        conditional.yes.accept(this);
        this.write(':');
        conditional.no.accept(this);
      };

      Unparser.prototype.visitAccessThis = function visitAccessThis(access) {
        if (access.ancestor === 0) {
          this.write('$this');
          return;
        }
        this.write('$parent');
        var i = access.ancestor - 1;
        while (i--) {
          this.write('.$parent');
        }
      };

      Unparser.prototype.visitAccessScope = function visitAccessScope(access) {
        var i = access.ancestor;
        while (i--) {
          this.write('$parent.');
        }
        this.write(access.name);
      };

      Unparser.prototype.visitAccessMember = function visitAccessMember(access) {
        access.object.accept(this);
        this.write('.' + access.name);
      };

      Unparser.prototype.visitAccessKeyed = function visitAccessKeyed(access) {
        access.object.accept(this);
        this.write('[');
        access.key.accept(this);
        this.write(']');
      };

      Unparser.prototype.visitCallScope = function visitCallScope(call) {
        var i = call.ancestor;
        while (i--) {
          this.write('$parent.');
        }
        this.write(call.name);
        this.writeArgs(call.args);
      };

      Unparser.prototype.visitCallFunction = function visitCallFunction(call) {
        call.func.accept(this);
        this.writeArgs(call.args);
      };

      Unparser.prototype.visitCallMember = function visitCallMember(call) {
        call.object.accept(this);
        this.write('.' + call.name);
        this.writeArgs(call.args);
      };

      Unparser.prototype.visitPrefix = function visitPrefix(prefix) {
        this.write('(' + prefix.operation);
        if (prefix.operation.charCodeAt(0) >= 97) {
          this.write(' ');
        }
        prefix.expression.accept(this);
        this.write(')');
      };

      Unparser.prototype.visitBinary = function visitBinary(binary) {
        binary.left.accept(this);
        if (binary.operation.charCodeAt(0) === 105) {
          this.write(' ' + binary.operation + ' ');
        } else {
          this.write(binary.operation);
        }
        binary.right.accept(this);
      };

      Unparser.prototype.visitLiteralPrimitive = function visitLiteralPrimitive(literal) {
        this.write('' + literal.value);
      };

      Unparser.prototype.visitLiteralArray = function visitLiteralArray(literal) {
        var elements = literal.elements;

        this.write('[');

        for (var i = 0, length = elements.length; i < length; ++i) {
          if (i !== 0) {
            this.write(',');
          }

          elements[i].accept(this);
        }

        this.write(']');
      };

      Unparser.prototype.visitLiteralObject = function visitLiteralObject(literal) {
        var keys = literal.keys;
        var values = literal.values;

        this.write('{');

        for (var i = 0, length = keys.length; i < length; ++i) {
          if (i !== 0) {
            this.write(',');
          }

          this.write('\'' + keys[i] + '\':');
          values[i].accept(this);
        }

        this.write('}');
      };

      Unparser.prototype.visitLiteralString = function visitLiteralString(literal) {
        var escaped = literal.value.replace(/'/g, "\'");
        this.write('\'' + escaped + '\'');
      };

      Unparser.prototype.visitLiteralTemplate = function visitLiteralTemplate(literal) {
        var cooked = literal.cooked,
            expressions = literal.expressions;

        var length = expressions.length;
        this.write('`');
        this.write(cooked[0]);
        for (var i = 0; i < length; i++) {
          expressions[i].accept(this);
          this.write(cooked[i + 1]);
        }
        this.write('`');
      };

      return Unparser;
    }();
  }

  var ExpressionCloner = exports.ExpressionCloner = function () {
    function ExpressionCloner() {

    }

    ExpressionCloner.prototype.cloneExpressionArray = function cloneExpressionArray(array) {
      var clonedArray = [];
      var i = array.length;
      while (i--) {
        clonedArray[i] = array[i].accept(this);
      }
      return clonedArray;
    };

    ExpressionCloner.prototype.visitBindingBehavior = function visitBindingBehavior(behavior) {
      return new BindingBehavior(behavior.expression.accept(this), behavior.name, this.cloneExpressionArray(behavior.args));
    };

    ExpressionCloner.prototype.visitValueConverter = function visitValueConverter(converter) {
      return new ValueConverter(converter.expression.accept(this), converter.name, this.cloneExpressionArray(converter.args));
    };

    ExpressionCloner.prototype.visitAssign = function visitAssign(assign) {
      return new Assign(assign.target.accept(this), assign.value.accept(this));
    };

    ExpressionCloner.prototype.visitConditional = function visitConditional(conditional) {
      return new Conditional(conditional.condition.accept(this), conditional.yes.accept(this), conditional.no.accept(this));
    };

    ExpressionCloner.prototype.visitAccessThis = function visitAccessThis(access) {
      return new AccessThis(access.ancestor);
    };

    ExpressionCloner.prototype.visitAccessScope = function visitAccessScope(access) {
      return new AccessScope(access.name, access.ancestor);
    };

    ExpressionCloner.prototype.visitAccessMember = function visitAccessMember(access) {
      return new AccessMember(access.object.accept(this), access.name);
    };

    ExpressionCloner.prototype.visitAccessKeyed = function visitAccessKeyed(access) {
      return new AccessKeyed(access.object.accept(this), access.key.accept(this));
    };

    ExpressionCloner.prototype.visitCallScope = function visitCallScope(call) {
      return new CallScope(call.name, this.cloneExpressionArray(call.args), call.ancestor);
    };

    ExpressionCloner.prototype.visitCallFunction = function visitCallFunction(call) {
      return new CallFunction(call.func.accept(this), this.cloneExpressionArray(call.args));
    };

    ExpressionCloner.prototype.visitCallMember = function visitCallMember(call) {
      return new CallMember(call.object.accept(this), call.name, this.cloneExpressionArray(call.args));
    };

    ExpressionCloner.prototype.visitUnary = function visitUnary(unary) {
      return new Unary(prefix.operation, prefix.expression.accept(this));
    };

    ExpressionCloner.prototype.visitBinary = function visitBinary(binary) {
      return new Binary(binary.operation, binary.left.accept(this), binary.right.accept(this));
    };

    ExpressionCloner.prototype.visitLiteralPrimitive = function visitLiteralPrimitive(literal) {
      return new LiteralPrimitive(literal);
    };

    ExpressionCloner.prototype.visitLiteralArray = function visitLiteralArray(literal) {
      return new LiteralArray(this.cloneExpressionArray(literal.elements));
    };

    ExpressionCloner.prototype.visitLiteralObject = function visitLiteralObject(literal) {
      return new LiteralObject(literal.keys, this.cloneExpressionArray(literal.values));
    };

    ExpressionCloner.prototype.visitLiteralString = function visitLiteralString(literal) {
      return new LiteralString(literal.value);
    };

    ExpressionCloner.prototype.visitLiteralTemplate = function visitLiteralTemplate(literal) {
      return new LiteralTemplate(literal.cooked, this.cloneExpressionArray(literal.expressions), literal.raw, literal.tag && literal.tag.accept(this));
    };

    return ExpressionCloner;
  }();

  function cloneExpression(expression) {
    var visitor = new ExpressionCloner();
    return expression.accept(visitor);
  }

  var bindingMode = exports.bindingMode = {
    oneTime: 0,
    toView: 1,
    oneWay: 1,
    twoWay: 2,
    fromView: 3
  };

  var Parser = exports.Parser = function () {
    function Parser() {


      this.cache = Object.create(null);
    }

    Parser.prototype.parse = function parse(src) {
      src = src || '';

      return this.cache[src] || (this.cache[src] = new ParserImplementation(src).parseBindingBehavior());
    };

    return Parser;
  }();

  var fromCharCode = String.fromCharCode;

  var ParserImplementation = exports.ParserImplementation = function () {
    _createClass(ParserImplementation, [{
      key: 'raw',
      get: function get() {
        return this.src.slice(this.start, this.idx);
      }
    }]);

    function ParserImplementation(src) {


      this.idx = 0;

      this.start = 0;

      this.src = src;
      this.len = src.length;

      this.tkn = T$EOF;

      this.val = undefined;

      this.ch = src.charCodeAt(0);
    }

    ParserImplementation.prototype.parseBindingBehavior = function parseBindingBehavior() {
      this.nextToken();
      if (this.tkn & T$ExpressionTerminal) {
        this.err('Invalid start of expression');
      }
      var result = this.parseValueConverter();
      while (this.opt(T$Ampersand)) {
        result = new BindingBehavior(result, this.val, this.parseVariadicArgs());
      }
      if (this.tkn !== T$EOF) {
        this.err('Unconsumed token ' + this.raw);
      }
      return result;
    };

    ParserImplementation.prototype.parseValueConverter = function parseValueConverter() {
      var result = this.parseExpression();
      while (this.opt(T$Bar)) {
        result = new ValueConverter(result, this.val, this.parseVariadicArgs());
      }
      return result;
    };

    ParserImplementation.prototype.parseVariadicArgs = function parseVariadicArgs() {
      this.nextToken();
      var result = [];
      while (this.opt(T$Colon)) {
        result.push(this.parseExpression());
      }
      return result;
    };

    ParserImplementation.prototype.parseExpression = function parseExpression() {
      var exprStart = this.idx;
      var result = this.parseConditional();

      while (this.tkn === T$Eq) {
        if (!result.isAssignable) {
          this.err('Expression ' + this.src.slice(exprStart, this.start) + ' is not assignable');
        }
        this.nextToken();
        exprStart = this.idx;
        result = new Assign(result, this.parseConditional());
      }
      return result;
    };

    ParserImplementation.prototype.parseConditional = function parseConditional() {
      var result = this.parseBinary(0);

      if (this.opt(T$Question)) {
        var yes = this.parseExpression();
        this.expect(T$Colon);
        result = new Conditional(result, yes, this.parseExpression());
      }
      return result;
    };

    ParserImplementation.prototype.parseBinary = function parseBinary(minPrecedence) {
      var left = this.parseLeftHandSide(0);

      while (this.tkn & T$BinaryOp) {
        var opToken = this.tkn;
        if ((opToken & T$Precedence) <= minPrecedence) {
          break;
        }
        this.nextToken();
        left = new Binary(TokenValues[opToken & T$TokenMask], left, this.parseBinary(opToken & T$Precedence));
      }
      return left;
    };

    ParserImplementation.prototype.parseLeftHandSide = function parseLeftHandSide(context) {
      var result = void 0;

      primary: switch (this.tkn) {
        case T$Plus:
          this.nextToken();
          return this.parseLeftHandSide(0);
        case T$Minus:
          this.nextToken();
          return new Binary('-', new LiteralPrimitive(0), this.parseLeftHandSide(0));
        case T$Bang:
        case T$TypeofKeyword:
        case T$VoidKeyword:
          var op = TokenValues[this.tkn & T$TokenMask];
          this.nextToken();
          return new Unary(op, this.parseLeftHandSide(0));
        case T$ParentScope:
          {
            do {
              this.nextToken();
              context++;
              if (this.opt(T$Period)) {
                if (this.tkn === T$Period) {
                  this.err();
                }
                continue;
              } else if (this.tkn & T$AccessScopeTerminal) {
                result = new AccessThis(context & C$Ancestor);

                context = context & C$ShorthandProp | C$This;
                break primary;
              } else {
                this.err();
              }
            } while (this.tkn === T$ParentScope);
          }

        case T$Identifier:
          {
            result = new AccessScope(this.val, context & C$Ancestor);
            this.nextToken();
            context = context & C$ShorthandProp | C$Scope;
            break;
          }
        case T$ThisScope:
          this.nextToken();
          result = new AccessThis(0);
          context = context & C$ShorthandProp | C$This;
          break;
        case T$LParen:
          this.nextToken();
          result = this.parseExpression();
          this.expect(T$RParen);
          context = C$Primary;
          break;
        case T$LBracket:
          {
            this.nextToken();
            var _elements = [];
            if (this.tkn !== T$RBracket) {
              do {
                _elements.push(this.parseExpression());
              } while (this.opt(T$Comma));
            }
            this.expect(T$RBracket);
            result = new LiteralArray(_elements);
            context = C$Primary;
            break;
          }
        case T$LBrace:
          {
            var keys = [];
            var values = [];
            this.nextToken();
            while (this.tkn !== T$RBrace) {
              if (this.tkn & T$IdentifierOrKeyword) {
                var ch = this.ch,
                    tkn = this.tkn,
                    idx = this.idx;

                keys.push(this.val);
                this.nextToken();
                if (this.opt(T$Colon)) {
                  values.push(this.parseExpression());
                } else {
                  this.ch = ch;
                  this.tkn = tkn;
                  this.idx = idx;
                  values.push(this.parseLeftHandSide(C$ShorthandProp));
                }
              } else if (this.tkn & T$Literal) {
                keys.push(this.val);
                this.nextToken();
                this.expect(T$Colon);
                values.push(this.parseExpression());
              } else {
                this.err();
              }
              if (this.tkn !== T$RBrace) {
                this.expect(T$Comma);
              }
            }
            this.expect(T$RBrace);
            result = new LiteralObject(keys, values);
            context = C$Primary;
            break;
          }
        case T$StringLiteral:
          result = new LiteralString(this.val);
          this.nextToken();
          context = C$Primary;
          break;
        case T$TemplateTail:
          result = new LiteralTemplate([this.val]);
          this.nextToken();
          context = C$Primary;
          break;
        case T$TemplateContinuation:
          result = this.parseTemplate(0);
          context = C$Primary;
          break;
        case T$NumericLiteral:
          {
            result = new LiteralPrimitive(this.val);
            this.nextToken();

            break;
          }
        case T$NullKeyword:
        case T$UndefinedKeyword:
        case T$TrueKeyword:
        case T$FalseKeyword:
          result = new LiteralPrimitive(TokenValues[this.tkn & T$TokenMask]);
          this.nextToken();
          context = C$Primary;
          break;
        default:
          if (this.idx >= this.len) {
            this.err('Unexpected end of expression');
          } else {
            this.err();
          }
      }

      if (context & C$ShorthandProp) {
        return result;
      }

      var name = this.val;
      while (this.tkn & T$MemberOrCallExpression) {
        switch (this.tkn) {
          case T$Period:
            this.nextToken();
            if (!(this.tkn & T$IdentifierOrKeyword)) {
              this.err();
            }
            name = this.val;
            this.nextToken();

            context = context & C$Primary | (context & (C$This | C$Scope)) << 1 | context & C$Member | (context & C$Keyed) >> 1 | (context & C$Call) >> 2;
            if (this.tkn === T$LParen) {
              continue;
            }
            if (context & C$Scope) {
              result = new AccessScope(name, result.ancestor);
            } else {
              result = new AccessMember(result, name);
            }
            continue;
          case T$LBracket:
            this.nextToken();
            context = C$Keyed;
            result = new AccessKeyed(result, this.parseExpression());
            this.expect(T$RBracket);
            break;
          case T$LParen:
            this.nextToken();
            var args = [];
            while (this.tkn !== T$RParen) {
              args.push(this.parseExpression());
              if (!this.opt(T$Comma)) {
                break;
              }
            }
            this.expect(T$RParen);
            if (context & C$Scope) {
              result = new CallScope(name, args, result.ancestor);
            } else if (context & (C$Member | C$Primary)) {
              result = new CallMember(result, name, args);
            } else {
              result = new CallFunction(result, args);
            }
            context = C$Call;
            break;
          case T$TemplateTail:
            result = new LiteralTemplate([this.val], [], [this.raw], result);
            this.nextToken();
            break;
          case T$TemplateContinuation:
            result = this.parseTemplate(context | C$Tagged, result);
        }
      }

      return result;
    };

    ParserImplementation.prototype.parseTemplate = function parseTemplate(context, func) {
      var cooked = [this.val];
      var raw = context & C$Tagged ? [this.raw] : undefined;
      this.expect(T$TemplateContinuation);
      var expressions = [this.parseExpression()];

      while ((this.tkn = this.scanTemplateTail()) !== T$TemplateTail) {
        cooked.push(this.val);
        if (context & C$Tagged) {
          raw.push(this.raw);
        }
        this.expect(T$TemplateContinuation);
        expressions.push(this.parseExpression());
      }

      cooked.push(this.val);
      if (context & C$Tagged) {
        raw.push(this.raw);
      }
      this.nextToken();
      return new LiteralTemplate(cooked, expressions, raw, func);
    };

    ParserImplementation.prototype.nextToken = function nextToken() {
      while (this.idx < this.len) {
        if (this.ch <= 0x20) {
          this.next();
          continue;
        }
        this.start = this.idx;
        if (this.ch === 0x24 || this.ch >= 0x61 && this.ch <= 0x7A) {
          this.tkn = this.scanIdentifier();
          return;
        }

        if ((this.tkn = CharScanners[this.ch](this)) !== null) {
          return;
        }
      }
      this.tkn = T$EOF;
    };

    ParserImplementation.prototype.next = function next() {
      return this.ch = this.src.charCodeAt(++this.idx);
    };

    ParserImplementation.prototype.scanIdentifier = function scanIdentifier() {
      while (AsciiIdParts.has(this.next()) || this.ch > 0x7F && IdParts[this.ch]) {}

      return KeywordLookup[this.val = this.raw] || T$Identifier;
    };

    ParserImplementation.prototype.scanNumber = function scanNumber(isFloat) {
      if (isFloat) {
        this.val = 0;
      } else {
        this.val = this.ch - 0x30;
        while (this.next() <= 0x39 && this.ch >= 0x30) {
          this.val = this.val * 10 + this.ch - 0x30;
        }
      }

      if (isFloat || this.ch === 0x2E) {
        if (!isFloat) {
          this.next();
        }
        var start = this.idx;
        var value = this.ch - 0x30;
        while (this.next() <= 0x39 && this.ch >= 0x30) {
          value = value * 10 + this.ch - 0x30;
        }
        this.val = this.val + value / Math.pow(10, this.idx - start);
      }

      if (this.ch === 0x65 || this.ch === 0x45) {
        var _start = this.idx;

        this.next();
        if (this.ch === 0x2D || this.ch === 0x2B) {
          this.next();
        }

        if (!(this.ch >= 0x30 && this.ch <= 0x39)) {
          this.idx = _start;
          this.err('Invalid exponent');
        }
        while (this.next() <= 0x39 && this.ch >= 0x30) {}
        this.val = parseFloat(this.src.slice(this.start, this.idx));
      }

      return T$NumericLiteral;
    };

    ParserImplementation.prototype.scanString = function scanString() {
      var quote = this.ch;
      this.next();

      var buffer = void 0;
      var marker = this.idx;

      while (this.ch !== quote) {
        if (this.ch === 0x5C) {
          if (!buffer) {
            buffer = [];
          }

          buffer.push(this.src.slice(marker, this.idx));

          this.next();

          var _unescaped = void 0;

          if (this.ch === 0x75) {
            this.next();

            if (this.idx + 4 < this.len) {
              var hex = this.src.slice(this.idx, this.idx + 4);

              if (!/[A-Z0-9]{4}/i.test(hex)) {
                this.err('Invalid unicode escape [\\u' + hex + ']');
              }

              _unescaped = parseInt(hex, 16);
              this.idx += 4;
              this.ch = this.src.charCodeAt(this.idx);
            } else {
              this.err();
            }
          } else {
            _unescaped = unescape(this.ch);
            this.next();
          }

          buffer.push(fromCharCode(_unescaped));
          marker = this.idx;
        } else if (this.ch === 0 || this.idx >= this.len) {
          this.err('Unterminated quote');
        } else {
          this.next();
        }
      }

      var last = this.src.slice(marker, this.idx);
      this.next();
      var unescaped = last;

      if (buffer !== null && buffer !== undefined) {
        buffer.push(last);
        unescaped = buffer.join('');
      }

      this.val = unescaped;
      return T$StringLiteral;
    };

    ParserImplementation.prototype.scanTemplate = function scanTemplate() {
      var tail = true;
      var result = '';

      while (this.next() !== 0x60) {
        if (this.ch === 0x24) {
          if (this.idx + 1 < this.len && this.src.charCodeAt(this.idx + 1) === 0x7B) {
            this.idx++;
            tail = false;
            break;
          } else {
            result += '$';
          }
        } else if (this.ch === 0x5C) {
          result += fromCharCode(unescape(this.next()));
        } else if (this.ch === 0 || this.idx >= this.len) {
          this.err('Unterminated template literal');
        } else {
          result += fromCharCode(this.ch);
        }
      }

      this.next();
      this.val = result;
      if (tail) {
        return T$TemplateTail;
      }
      return T$TemplateContinuation;
    };

    ParserImplementation.prototype.scanTemplateTail = function scanTemplateTail() {
      if (this.idx >= this.len) {
        this.err('Unterminated template');
      }
      this.idx--;
      return this.scanTemplate();
    };

    ParserImplementation.prototype.err = function err() {
      var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Unexpected token ' + this.raw;
      var column = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.start;

      throw new Error('Parser Error: ' + message + ' at column ' + column + ' in expression [' + this.src + ']');
    };

    ParserImplementation.prototype.opt = function opt(token) {
      if (this.tkn === token) {
        this.nextToken();
        return true;
      }

      return false;
    };

    ParserImplementation.prototype.expect = function expect(token) {
      if (this.tkn === token) {
        this.nextToken();
      } else {
        this.err('Missing expected token ' + TokenValues[token & T$TokenMask], this.idx);
      }
    };

    return ParserImplementation;
  }();

  function unescape(code) {
    switch (code) {
      case 0x66:
        return 0xC;
      case 0x6E:
        return 0xA;
      case 0x72:
        return 0xD;
      case 0x74:
        return 0x9;
      case 0x76:
        return 0xB;
      default:
        return code;
    }
  }

  var C$This = 1 << 10;
  var C$Scope = 1 << 11;
  var C$Member = 1 << 12;
  var C$Keyed = 1 << 13;
  var C$Call = 1 << 14;
  var C$Primary = 1 << 15;
  var C$ShorthandProp = 1 << 16;
  var C$Tagged = 1 << 17;

  var C$Ancestor = (1 << 9) - 1;

  var T$TokenMask = (1 << 6) - 1;

  var T$PrecShift = 6;

  var T$Precedence = 7 << T$PrecShift;

  var T$ExpressionTerminal = 1 << 11;

  var T$ClosingToken = 1 << 12;

  var T$OpeningToken = 1 << 13;

  var T$AccessScopeTerminal = 1 << 14;
  var T$Keyword = 1 << 15;
  var T$EOF = 1 << 16 | T$AccessScopeTerminal | T$ExpressionTerminal;
  var T$Identifier = 1 << 17;
  var T$IdentifierOrKeyword = T$Identifier | T$Keyword;
  var T$Literal = 1 << 18;
  var T$NumericLiteral = 1 << 19 | T$Literal;
  var T$StringLiteral = 1 << 20 | T$Literal;
  var T$BinaryOp = 1 << 21;

  var T$UnaryOp = 1 << 22;

  var T$MemberExpression = 1 << 23;

  var T$MemberOrCallExpression = 1 << 24;
  var T$TemplateTail = 1 << 25 | T$MemberOrCallExpression;
  var T$TemplateContinuation = 1 << 26 | T$MemberOrCallExpression;

  var T$FalseKeyword = 0 | T$Keyword | T$Literal;
  var T$TrueKeyword = 1 | T$Keyword | T$Literal;
  var T$NullKeyword = 2 | T$Keyword | T$Literal;
  var T$UndefinedKeyword = 3 | T$Keyword | T$Literal;
  var T$ThisScope = 4 | T$IdentifierOrKeyword;
  var T$ParentScope = 5 | T$IdentifierOrKeyword;

  var T$LParen = 6 | T$OpeningToken | T$AccessScopeTerminal | T$MemberOrCallExpression;
  var T$LBrace = 7 | T$OpeningToken;
  var T$Period = 8 | T$MemberExpression | T$MemberOrCallExpression;
  var T$RBrace = 9 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
  var T$RParen = 10 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
  var T$Comma = 11 | T$AccessScopeTerminal;
  var T$LBracket = 12 | T$OpeningToken | T$AccessScopeTerminal | T$MemberExpression | T$MemberOrCallExpression;
  var T$RBracket = 13 | T$ClosingToken | T$ExpressionTerminal;
  var T$Colon = 14 | T$AccessScopeTerminal;
  var T$Question = 15;

  var T$Ampersand = 18 | T$AccessScopeTerminal;
  var T$Bar = 19 | T$AccessScopeTerminal;
  var T$BarBar = 20 | 1 << T$PrecShift | T$BinaryOp;
  var T$AmpersandAmpersand = 21 | 2 << T$PrecShift | T$BinaryOp;
  var T$Caret = 22 | 3 << T$PrecShift | T$BinaryOp;
  var T$EqEq = 23 | 4 << T$PrecShift | T$BinaryOp;
  var T$BangEq = 24 | 4 << T$PrecShift | T$BinaryOp;
  var T$EqEqEq = 25 | 4 << T$PrecShift | T$BinaryOp;
  var T$BangEqEq = 26 | 4 << T$PrecShift | T$BinaryOp;
  var T$Lt = 27 | 5 << T$PrecShift | T$BinaryOp;
  var T$Gt = 28 | 5 << T$PrecShift | T$BinaryOp;
  var T$LtEq = 29 | 5 << T$PrecShift | T$BinaryOp;
  var T$GtEq = 30 | 5 << T$PrecShift | T$BinaryOp;
  var T$InKeyword = 31 | 5 << T$PrecShift | T$BinaryOp | T$Keyword;
  var T$InstanceOfKeyword = 32 | 5 << T$PrecShift | T$BinaryOp | T$Keyword;
  var T$Plus = 33 | 6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
  var T$Minus = 34 | 6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
  var T$TypeofKeyword = 35 | T$UnaryOp | T$Keyword;
  var T$VoidKeyword = 36 | T$UnaryOp | T$Keyword;
  var T$Star = 37 | 7 << T$PrecShift | T$BinaryOp;
  var T$Percent = 38 | 7 << T$PrecShift | T$BinaryOp;
  var T$Slash = 39 | 7 << T$PrecShift | T$BinaryOp;
  var T$Eq = 40;
  var T$Bang = 41 | T$UnaryOp;

  var KeywordLookup = Object.create(null);
  KeywordLookup.true = T$TrueKeyword;
  KeywordLookup.null = T$NullKeyword;
  KeywordLookup.false = T$FalseKeyword;
  KeywordLookup.undefined = T$UndefinedKeyword;
  KeywordLookup.$this = T$ThisScope;
  KeywordLookup.$parent = T$ParentScope;
  KeywordLookup.in = T$InKeyword;
  KeywordLookup.instanceof = T$InstanceOfKeyword;
  KeywordLookup.typeof = T$TypeofKeyword;
  KeywordLookup.void = T$VoidKeyword;

  var TokenValues = [false, true, null, undefined, '$this', '$parent', '(', '{', '.', '}', ')', ',', '[', ']', ':', '?', '\'', '"', '&', '|', '||', '&&', '^', '==', '!=', '===', '!==', '<', '>', '<=', '>=', 'in', 'instanceof', '+', '-', 'typeof', 'void', '*', '%', '/', '=', '!'];

  var codes = {
    AsciiIdPart: [0x24, 0, 0x30, 0x3A, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B],
    IdStart: [0x24, 0, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B, 0xAA, 0, 0xBA, 0, 0xC0, 0xD7, 0xD8, 0xF7, 0xF8, 0x2B9, 0x2E0, 0x2E5, 0x1D00, 0x1D26, 0x1D2C, 0x1D5D, 0x1D62, 0x1D66, 0x1D6B, 0x1D78, 0x1D79, 0x1DBF, 0x1E00, 0x1F00, 0x2071, 0, 0x207F, 0, 0x2090, 0x209D, 0x212A, 0x212C, 0x2132, 0, 0x214E, 0, 0x2160, 0x2189, 0x2C60, 0x2C80, 0xA722, 0xA788, 0xA78B, 0xA7AF, 0xA7B0, 0xA7B8, 0xA7F7, 0xA800, 0xAB30, 0xAB5B, 0xAB5C, 0xAB65, 0xFB00, 0xFB07, 0xFF21, 0xFF3B, 0xFF41, 0xFF5B],
    Digit: [0x30, 0x3A],
    Skip: [0, 0x21, 0x7F, 0xA1]
  };

  function decompress(lookup, set, compressed, value) {
    var rangeCount = compressed.length;
    for (var i = 0; i < rangeCount; i += 2) {
      var start = compressed[i];
      var end = compressed[i + 1];
      end = end > 0 ? end : start + 1;
      if (lookup) {
        var j = start;
        while (j < end) {
          lookup[j] = value;
          j++;
        }
      }
      if (set) {
        for (var ch = start; ch < end; ch++) {
          set.add(ch);
        }
      }
    }
  }

  function returnToken(token) {
    return function (p) {
      p.next();
      return token;
    };
  }
  function unexpectedCharacter(p) {
    p.err('Unexpected character [' + fromCharCode(p.ch) + ']');
    return null;
  }

  var AsciiIdParts = new Set();
  decompress(null, AsciiIdParts, codes.AsciiIdPart, true);

  var IdParts = new Uint8Array(0xFFFF);
  decompress(IdParts, null, codes.IdStart, 1);
  decompress(IdParts, null, codes.Digit, 1);

  var CharScanners = new Array(0xFFFF);
  var ci = 0;
  while (ci < 0xFFFF) {
    CharScanners[ci] = unexpectedCharacter;
    ci++;
  }

  decompress(CharScanners, null, codes.Skip, function (p) {
    p.next();
    return null;
  });
  decompress(CharScanners, null, codes.IdStart, function (p) {
    return p.scanIdentifier();
  });
  decompress(CharScanners, null, codes.Digit, function (p) {
    return p.scanNumber(false);
  });

  CharScanners[0x22] = CharScanners[0x27] = function (p) {
    return p.scanString();
  };
  CharScanners[0x60] = function (p) {
    return p.scanTemplate();
  };

  CharScanners[0x21] = function (p) {
    if (p.next() !== 0x3D) {
      return T$Bang;
    }
    if (p.next() !== 0x3D) {
      return T$BangEq;
    }
    p.next();
    return T$BangEqEq;
  };

  CharScanners[0x3D] = function (p) {
    if (p.next() !== 0x3D) {
      return T$Eq;
    }
    if (p.next() !== 0x3D) {
      return T$EqEq;
    }
    p.next();
    return T$EqEqEq;
  };

  CharScanners[0x26] = function (p) {
    if (p.next() !== 0x26) {
      return T$Ampersand;
    }
    p.next();
    return T$AmpersandAmpersand;
  };

  CharScanners[0x7C] = function (p) {
    if (p.next() !== 0x7C) {
      return T$Bar;
    }
    p.next();
    return T$BarBar;
  };

  CharScanners[0x2E] = function (p) {
    if (p.next() <= 0x39 && p.ch >= 0x30) {
      return p.scanNumber(true);
    }
    return T$Period;
  };

  CharScanners[0x3C] = function (p) {
    if (p.next() !== 0x3D) {
      return T$Lt;
    }
    p.next();
    return T$LtEq;
  };

  CharScanners[0x3E] = function (p) {
    if (p.next() !== 0x3D) {
      return T$Gt;
    }
    p.next();
    return T$GtEq;
  };

  CharScanners[0x25] = returnToken(T$Percent);
  CharScanners[0x28] = returnToken(T$LParen);
  CharScanners[0x29] = returnToken(T$RParen);
  CharScanners[0x2A] = returnToken(T$Star);
  CharScanners[0x2B] = returnToken(T$Plus);
  CharScanners[0x2C] = returnToken(T$Comma);
  CharScanners[0x2D] = returnToken(T$Minus);
  CharScanners[0x2F] = returnToken(T$Slash);
  CharScanners[0x3A] = returnToken(T$Colon);
  CharScanners[0x3F] = returnToken(T$Question);
  CharScanners[0x5B] = returnToken(T$LBracket);
  CharScanners[0x5D] = returnToken(T$RBracket);
  CharScanners[0x5E] = returnToken(T$Caret);
  CharScanners[0x7B] = returnToken(T$LBrace);
  CharScanners[0x7D] = returnToken(T$RBrace);

  var mapProto = Map.prototype;

  function _getMapObserver(taskQueue, map) {
    return ModifyMapObserver.for(taskQueue, map);
  }

  exports.getMapObserver = _getMapObserver;

  var ModifyMapObserver = function (_ModifyCollectionObse2) {
    _inherits(ModifyMapObserver, _ModifyCollectionObse2);

    function ModifyMapObserver(taskQueue, map) {


      return _possibleConstructorReturn(this, _ModifyCollectionObse2.call(this, taskQueue, map));
    }

    ModifyMapObserver.for = function _for(taskQueue, map) {
      if (!('__map_observer__' in map)) {
        Reflect.defineProperty(map, '__map_observer__', {
          value: ModifyMapObserver.create(taskQueue, map),
          enumerable: false, configurable: false
        });
      }
      return map.__map_observer__;
    };

    ModifyMapObserver.create = function create(taskQueue, map) {
      var observer = new ModifyMapObserver(taskQueue, map);

      var proto = mapProto;
      if (proto.set !== map.set || proto.delete !== map.delete || proto.clear !== map.clear) {
        proto = {
          set: map.set,
          delete: map.delete,
          clear: map.clear
        };
      }

      map.set = function () {
        var hasValue = map.has(arguments[0]);
        var type = hasValue ? 'update' : 'add';
        var oldValue = map.get(arguments[0]);
        var methodCallResult = proto.set.apply(map, arguments);
        if (!hasValue || oldValue !== map.get(arguments[0])) {
          observer.addChangeRecord({
            type: type,
            object: map,
            key: arguments[0],
            oldValue: oldValue
          });
        }
        return methodCallResult;
      };

      map.delete = function () {
        var hasValue = map.has(arguments[0]);
        var oldValue = map.get(arguments[0]);
        var methodCallResult = proto.delete.apply(map, arguments);
        if (hasValue) {
          observer.addChangeRecord({
            type: 'delete',
            object: map,
            key: arguments[0],
            oldValue: oldValue
          });
        }
        return methodCallResult;
      };

      map.clear = function () {
        var methodCallResult = proto.clear.apply(map, arguments);
        observer.addChangeRecord({
          type: 'clear',
          object: map
        });
        return methodCallResult;
      };

      return observer;
    };

    return ModifyMapObserver;
  }(ModifyCollectionObserver);

  var emLogger = LogManager.getLogger('event-manager');

  function findOriginalEventTarget(event) {
    return event.path && event.path[0] || event.deepPath && event.deepPath[0] || event.target;
  }

  function stopPropagation() {
    this.standardStopPropagation();
    this.propagationStopped = true;
  }

  function handleCapturedEvent(event) {
    event.propagationStopped = false;
    var target = findOriginalEventTarget(event);

    var orderedCallbacks = [];

    while (target) {
      if (target.capturedCallbacks) {
        var callback = target.capturedCallbacks[event.type];
        if (callback) {
          if (event.stopPropagation !== stopPropagation) {
            event.standardStopPropagation = event.stopPropagation;
            event.stopPropagation = stopPropagation;
          }
          orderedCallbacks.push(callback);
        }
      }
      target = target.parentNode;
    }
    for (var i = orderedCallbacks.length - 1; i >= 0 && !event.propagationStopped; i--) {
      var orderedCallback = orderedCallbacks[i];
      if ('handleEvent' in orderedCallback) {
        orderedCallback.handleEvent(event);
      } else {
        orderedCallback(event);
      }
    }
  }

  var CapturedHandlerEntry = function () {
    function CapturedHandlerEntry(eventName) {


      this.eventName = eventName;
      this.count = 0;
    }

    CapturedHandlerEntry.prototype.increment = function increment() {
      this.count++;

      if (this.count === 1) {
        _aureliaPal.DOM.addEventListener(this.eventName, handleCapturedEvent, true);
      }
    };

    CapturedHandlerEntry.prototype.decrement = function decrement() {
      if (this.count === 0) {
        emLogger.warn('The same EventListener was disposed multiple times.');
      } else if (--this.count === 0) {
        _aureliaPal.DOM.removeEventListener(this.eventName, handleCapturedEvent, true);
      }
    };

    return CapturedHandlerEntry;
  }();

  var DelegateHandlerEntry = function () {
    function DelegateHandlerEntry(eventName, eventManager) {


      this.eventName = eventName;
      this.count = 0;
      this.eventManager = eventManager;
    }

    DelegateHandlerEntry.prototype.handleEvent = function handleEvent(event) {
      event.propagationStopped = false;
      var target = findOriginalEventTarget(event);

      while (target && !event.propagationStopped) {
        if (target.delegatedCallbacks) {
          var callback = target.delegatedCallbacks[event.type];
          if (callback) {
            if (event.stopPropagation !== stopPropagation) {
              event.standardStopPropagation = event.stopPropagation;
              event.stopPropagation = stopPropagation;
            }
            if ('handleEvent' in callback) {
              callback.handleEvent(event);
            } else {
              callback(event);
            }
          }
        }

        var parent = target.parentNode;
        var shouldEscapeShadowRoot = this.eventManager.escapeShadowRoot && parent instanceof ShadowRoot;

        target = shouldEscapeShadowRoot ? parent.host : parent;
      }
    };

    DelegateHandlerEntry.prototype.increment = function increment() {
      this.count++;

      if (this.count === 1) {
        _aureliaPal.DOM.addEventListener(this.eventName, this, false);
      }
    };

    DelegateHandlerEntry.prototype.decrement = function decrement() {
      if (this.count === 0) {
        emLogger.warn('The same EventListener was disposed multiple times.');
      } else if (--this.count === 0) {
        _aureliaPal.DOM.removeEventListener(this.eventName, this, false);
      }
    };

    return DelegateHandlerEntry;
  }();

  var DelegationEntryHandler = function () {
    function DelegationEntryHandler(entry, lookup, targetEvent) {


      this.entry = entry;
      this.lookup = lookup;
      this.targetEvent = targetEvent;
    }

    DelegationEntryHandler.prototype.dispose = function dispose() {
      if (this.lookup[this.targetEvent]) {
        this.entry.decrement();
        this.lookup[this.targetEvent] = null;
      } else {
        emLogger.warn('Calling .dispose() on already disposed eventListener');
      }
    };

    return DelegationEntryHandler;
  }();

  var EventHandler = function () {
    function EventHandler(target, targetEvent, callback) {


      this.target = target;
      this.targetEvent = targetEvent;
      this.callback = callback;
    }

    EventHandler.prototype.dispose = function dispose() {
      this.target.removeEventListener(this.targetEvent, this.callback);
    };

    return EventHandler;
  }();

  var DefaultEventStrategy = function () {
    function DefaultEventStrategy(eventManager) {


      this.delegatedHandlers = {};
      this.capturedHandlers = {};

      this.eventManager = eventManager;
    }

    DefaultEventStrategy.prototype.subscribe = function subscribe(target, targetEvent, callback, strategy, disposable) {
      var delegatedHandlers = void 0;
      var capturedHandlers = void 0;
      var handlerEntry = void 0;

      if (strategy === delegationStrategy.bubbling) {
        delegatedHandlers = this.delegatedHandlers;
        handlerEntry = delegatedHandlers[targetEvent] || (delegatedHandlers[targetEvent] = new DelegateHandlerEntry(targetEvent, this.eventManager));
        var delegatedCallbacks = target.delegatedCallbacks || (target.delegatedCallbacks = {});
        if (!delegatedCallbacks[targetEvent]) {
          handlerEntry.increment();
        } else {
          emLogger.warn('Overriding previous callback for event listener', { event: targetEvent, callback: callback, previousCallback: delegatedCallbacks[targetEvent] });
        }
        delegatedCallbacks[targetEvent] = callback;

        if (disposable === true) {
          return new DelegationEntryHandler(handlerEntry, delegatedCallbacks, targetEvent);
        }

        return function () {
          handlerEntry.decrement();
          delegatedCallbacks[targetEvent] = null;
        };
      }
      if (strategy === delegationStrategy.capturing) {
        capturedHandlers = this.capturedHandlers;
        handlerEntry = capturedHandlers[targetEvent] || (capturedHandlers[targetEvent] = new CapturedHandlerEntry(targetEvent));
        var capturedCallbacks = target.capturedCallbacks || (target.capturedCallbacks = {});
        if (!capturedCallbacks[targetEvent]) {
          handlerEntry.increment();
        } else {
          emLogger.error('already have a callback for event', { event: targetEvent, callback: callback });
        }
        capturedCallbacks[targetEvent] = callback;

        if (disposable === true) {
          return new DelegationEntryHandler(handlerEntry, capturedCallbacks, targetEvent);
        }

        return function () {
          handlerEntry.decrement();
          capturedCallbacks[targetEvent] = null;
        };
      }

      target.addEventListener(targetEvent, callback);

      if (disposable === true) {
        return new EventHandler(target, targetEvent, callback);
      }

      return function () {
        target.removeEventListener(targetEvent, callback);
      };
    };

    return DefaultEventStrategy;
  }();

  var delegationStrategy = exports.delegationStrategy = {
    none: 0,
    capturing: 1,
    bubbling: 2
  };

  var EventManager = exports.EventManager = function () {
    function EventManager() {
      var escapeShadowRoot = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;



      this.elementHandlerLookup = {};
      this.eventStrategyLookup = {};
      this.escapeShadowRoot = escapeShadowRoot;

      this.registerElementConfig({
        tagName: 'input',
        properties: {
          value: ['change', 'input'],
          checked: ['change', 'input'],
          files: ['change', 'input']
        }
      });

      this.registerElementConfig({
        tagName: 'textarea',
        properties: {
          value: ['change', 'input']
        }
      });

      this.registerElementConfig({
        tagName: 'select',
        properties: {
          value: ['change']
        }
      });

      this.registerElementConfig({
        tagName: 'content editable',
        properties: {
          value: ['change', 'input', 'blur', 'keyup', 'paste']
        }
      });

      this.registerElementConfig({
        tagName: 'scrollable element',
        properties: {
          scrollTop: ['scroll'],
          scrollLeft: ['scroll']
        }
      });

      this.defaultEventStrategy = new DefaultEventStrategy(this);
    }

    EventManager.prototype.registerElementConfig = function registerElementConfig(config) {
      var tagName = config.tagName.toLowerCase();
      var properties = config.properties;
      var propertyName = void 0;

      var lookup = this.elementHandlerLookup[tagName] = {};

      for (propertyName in properties) {
        if (properties.hasOwnProperty(propertyName)) {
          lookup[propertyName] = properties[propertyName];
        }
      }
    };

    EventManager.prototype.registerEventStrategy = function registerEventStrategy(eventName, strategy) {
      this.eventStrategyLookup[eventName] = strategy;
    };

    EventManager.prototype.getElementHandler = function getElementHandler(target, propertyName) {
      var tagName = void 0;
      var lookup = this.elementHandlerLookup;

      if (target.tagName) {
        tagName = target.tagName.toLowerCase();

        if (lookup[tagName] && lookup[tagName][propertyName]) {
          return new EventSubscriber(lookup[tagName][propertyName]);
        }

        if (propertyName === 'textContent' || propertyName === 'innerHTML') {
          return new EventSubscriber(lookup['content editable'].value);
        }

        if (propertyName === 'scrollTop' || propertyName === 'scrollLeft') {
          return new EventSubscriber(lookup['scrollable element'][propertyName]);
        }
      }

      return null;
    };

    EventManager.prototype.addEventListener = function addEventListener(target, targetEvent, callbackOrListener, delegate, disposable) {
      return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy).subscribe(target, targetEvent, callbackOrListener, delegate, disposable);
    };

    return EventManager;
  }();

  var EventSubscriber = exports.EventSubscriber = function () {
    function EventSubscriber(events) {


      this.events = events;
      this.element = null;
      this.handler = null;
    }

    EventSubscriber.prototype.subscribe = function subscribe(element, callbackOrListener) {
      this.element = element;
      this.handler = callbackOrListener;

      var events = this.events;
      for (var i = 0, ii = events.length; ii > i; ++i) {
        element.addEventListener(events[i], callbackOrListener);
      }
    };

    EventSubscriber.prototype.dispose = function dispose() {
      if (this.element === null) {
        return;
      }
      var element = this.element;
      var callbackOrListener = this.handler;
      var events = this.events;
      for (var i = 0, ii = events.length; ii > i; ++i) {
        element.removeEventListener(events[i], callbackOrListener);
      }
      this.element = this.handler = null;
    };

    return EventSubscriber;
  }();

  var DirtyChecker = exports.DirtyChecker = function () {
    function DirtyChecker() {


      this.tracked = [];
      this.checkDelay = 120;
    }

    DirtyChecker.prototype.addProperty = function addProperty(property) {
      var tracked = this.tracked;

      tracked.push(property);

      if (tracked.length === 1) {
        this.scheduleDirtyCheck();
      }
    };

    DirtyChecker.prototype.removeProperty = function removeProperty(property) {
      var tracked = this.tracked;
      tracked.splice(tracked.indexOf(property), 1);
    };

    DirtyChecker.prototype.scheduleDirtyCheck = function scheduleDirtyCheck() {
      var _this22 = this;

      setTimeout(function () {
        return _this22.check();
      }, this.checkDelay);
    };

    DirtyChecker.prototype.check = function check() {
      var tracked = this.tracked;
      var i = tracked.length;

      while (i--) {
        var current = tracked[i];

        if (current.isDirty()) {
          current.call();
        }
      }

      if (tracked.length) {
        this.scheduleDirtyCheck();
      }
    };

    return DirtyChecker;
  }();

  var DirtyCheckProperty = exports.DirtyCheckProperty = (_dec5 = subscriberCollection(), _dec5(_class5 = function () {
    function DirtyCheckProperty(dirtyChecker, obj, propertyName) {


      this.dirtyChecker = dirtyChecker;
      this.obj = obj;
      this.propertyName = propertyName;
    }

    DirtyCheckProperty.prototype.getValue = function getValue() {
      return this.obj[this.propertyName];
    };

    DirtyCheckProperty.prototype.setValue = function setValue(newValue) {
      this.obj[this.propertyName] = newValue;
    };

    DirtyCheckProperty.prototype.call = function call() {
      var oldValue = this.oldValue;
      var newValue = this.getValue();

      this.callSubscribers(newValue, oldValue);

      this.oldValue = newValue;
    };

    DirtyCheckProperty.prototype.isDirty = function isDirty() {
      return this.oldValue !== this.obj[this.propertyName];
    };

    DirtyCheckProperty.prototype.subscribe = function subscribe(context, callable) {
      if (!this.hasSubscribers()) {
        this.oldValue = this.getValue();
        this.dirtyChecker.addProperty(this);
      }
      this.addSubscriber(context, callable);
    };

    DirtyCheckProperty.prototype.unsubscribe = function unsubscribe(context, callable) {
      if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
        this.dirtyChecker.removeProperty(this);
      }
    };

    return DirtyCheckProperty;
  }()) || _class5);


  var logger = LogManager.getLogger('property-observation');

  var propertyAccessor = exports.propertyAccessor = {
    getValue: function getValue(obj, propertyName) {
      return obj[propertyName];
    },
    setValue: function setValue(value, obj, propertyName) {
      obj[propertyName] = value;
    }
  };

  var PrimitiveObserver = exports.PrimitiveObserver = function () {
    function PrimitiveObserver(primitive, propertyName) {


      this.doNotCache = true;

      this.primitive = primitive;
      this.propertyName = propertyName;
    }

    PrimitiveObserver.prototype.getValue = function getValue() {
      return this.primitive[this.propertyName];
    };

    PrimitiveObserver.prototype.setValue = function setValue() {
      var type = _typeof(this.primitive);
      throw new Error('The ' + this.propertyName + ' property of a ' + type + ' (' + this.primitive + ') cannot be assigned.');
    };

    PrimitiveObserver.prototype.subscribe = function subscribe() {};

    PrimitiveObserver.prototype.unsubscribe = function unsubscribe() {};

    return PrimitiveObserver;
  }();

  var SetterObserver = exports.SetterObserver = (_dec6 = subscriberCollection(), _dec6(_class7 = function () {
    function SetterObserver(taskQueue, obj, propertyName) {


      this.taskQueue = taskQueue;
      this.obj = obj;
      this.propertyName = propertyName;
      this.queued = false;
      this.observing = false;
    }

    SetterObserver.prototype.getValue = function getValue() {
      return this.obj[this.propertyName];
    };

    SetterObserver.prototype.setValue = function setValue(newValue) {
      this.obj[this.propertyName] = newValue;
    };

    SetterObserver.prototype.getterValue = function getterValue() {
      return this.currentValue;
    };

    SetterObserver.prototype.setterValue = function setterValue(newValue) {
      var oldValue = this.currentValue;

      if (oldValue !== newValue) {
        if (!this.queued) {
          this.oldValue = oldValue;
          this.queued = true;
          this.taskQueue.queueMicroTask(this);
        }

        this.currentValue = newValue;
      }
    };

    SetterObserver.prototype.call = function call() {
      var oldValue = this.oldValue;
      var newValue = this.currentValue;

      this.queued = false;

      this.callSubscribers(newValue, oldValue);
    };

    SetterObserver.prototype.subscribe = function subscribe(context, callable) {
      if (!this.observing) {
        this.convertProperty();
      }
      this.addSubscriber(context, callable);
    };

    SetterObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      this.removeSubscriber(context, callable);
    };

    SetterObserver.prototype.convertProperty = function convertProperty() {
      this.observing = true;
      this.currentValue = this.obj[this.propertyName];
      this.setValue = this.setterValue;
      this.getValue = this.getterValue;

      if (!Reflect.defineProperty(this.obj, this.propertyName, {
        configurable: true,
        enumerable: this.propertyName in this.obj ? this.obj.propertyIsEnumerable(this.propertyName) : true,
        get: this.getValue.bind(this),
        set: this.setValue.bind(this)
      })) {
        logger.warn('Cannot observe property \'' + this.propertyName + '\' of object', this.obj);
      }
    };

    return SetterObserver;
  }()) || _class7);

  var XLinkAttributeObserver = exports.XLinkAttributeObserver = function () {
    function XLinkAttributeObserver(element, propertyName, attributeName) {


      this.element = element;
      this.propertyName = propertyName;
      this.attributeName = attributeName;
    }

    XLinkAttributeObserver.prototype.getValue = function getValue() {
      return this.element.getAttributeNS('http://www.w3.org/1999/xlink', this.attributeName);
    };

    XLinkAttributeObserver.prototype.setValue = function setValue(newValue) {
      return this.element.setAttributeNS('http://www.w3.org/1999/xlink', this.attributeName, newValue);
    };

    XLinkAttributeObserver.prototype.subscribe = function subscribe() {
      throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "' + this.propertyName + '" property is not supported.');
    };

    return XLinkAttributeObserver;
  }();

  var dataAttributeAccessor = exports.dataAttributeAccessor = {
    getValue: function getValue(obj, propertyName) {
      return obj.getAttribute(propertyName);
    },
    setValue: function setValue(value, obj, propertyName) {
      if (value === null || value === undefined) {
        obj.removeAttribute(propertyName);
      } else {
        obj.setAttribute(propertyName, value);
      }
    }
  };

  var DataAttributeObserver = exports.DataAttributeObserver = function () {
    function DataAttributeObserver(element, propertyName) {


      this.element = element;
      this.propertyName = propertyName;
    }

    DataAttributeObserver.prototype.getValue = function getValue() {
      return this.element.getAttribute(this.propertyName);
    };

    DataAttributeObserver.prototype.setValue = function setValue(newValue) {
      if (newValue === null || newValue === undefined) {
        return this.element.removeAttribute(this.propertyName);
      }
      return this.element.setAttribute(this.propertyName, newValue);
    };

    DataAttributeObserver.prototype.subscribe = function subscribe() {
      throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "' + this.propertyName + '" property is not supported.');
    };

    return DataAttributeObserver;
  }();

  var StyleObserver = exports.StyleObserver = function () {
    function StyleObserver(element, propertyName) {


      this.element = element;
      this.propertyName = propertyName;

      this.styles = null;
      this.version = 0;
    }

    StyleObserver.prototype.getValue = function getValue() {
      return this.element.style.cssText;
    };

    StyleObserver.prototype._setProperty = function _setProperty(style, value) {
      var priority = '';

      if (value !== null && value !== undefined && typeof value.indexOf === 'function' && value.indexOf('!important') !== -1) {
        priority = 'important';
        value = value.replace('!important', '');
      }
      this.element.style.setProperty(style, value, priority);
    };

    StyleObserver.prototype.setValue = function setValue(newValue) {
      var styles = this.styles || {};
      var style = void 0;
      var version = this.version;

      if (newValue !== null && newValue !== undefined) {
        if (newValue instanceof Object) {
          var value = void 0;
          for (style in newValue) {
            if (newValue.hasOwnProperty(style)) {
              value = newValue[style];
              style = style.replace(/([A-Z])/g, function (m) {
                return '-' + m.toLowerCase();
              });
              styles[style] = version;
              this._setProperty(style, value);
            }
          }
        } else if (newValue.length) {
          var rx = /\s*([\w\-]+)\s*:\s*((?:(?:[\w\-]+\(\s*(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[\w\-]+\(\s*(?:^"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\)]*)\),?|[^\)]*)\),?|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^;]*),?\s*)+);?/g;
          var pair = void 0;
          while ((pair = rx.exec(newValue)) !== null) {
            style = pair[1];
            if (!style) {
              continue;
            }

            styles[style] = version;
            this._setProperty(style, pair[2]);
          }
        }
      }

      this.styles = styles;
      this.version += 1;

      if (version === 0) {
        return;
      }

      version -= 1;
      for (style in styles) {
        if (!styles.hasOwnProperty(style) || styles[style] !== version) {
          continue;
        }

        this.element.style.removeProperty(style);
      }
    };

    StyleObserver.prototype.subscribe = function subscribe() {
      throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "' + this.propertyName + '" property is not supported.');
    };

    return StyleObserver;
  }();

  var ValueAttributeObserver = exports.ValueAttributeObserver = (_dec7 = subscriberCollection(), _dec7(_class8 = function () {
    function ValueAttributeObserver(element, propertyName, handler) {


      this.element = element;
      this.propertyName = propertyName;
      this.handler = handler;
      if (propertyName === 'files') {
        this.setValue = function () {};
      }
    }

    ValueAttributeObserver.prototype.getValue = function getValue() {
      return this.element[this.propertyName];
    };

    ValueAttributeObserver.prototype.setValue = function setValue(newValue) {
      newValue = newValue === undefined || newValue === null ? '' : newValue;
      if (this.element[this.propertyName] !== newValue) {
        this.element[this.propertyName] = newValue;
        this.notify();
      }
    };

    ValueAttributeObserver.prototype.notify = function notify() {
      var oldValue = this.oldValue;
      var newValue = this.getValue();

      this.callSubscribers(newValue, oldValue);

      this.oldValue = newValue;
    };

    ValueAttributeObserver.prototype.handleEvent = function handleEvent() {
      this.notify();
    };

    ValueAttributeObserver.prototype.subscribe = function subscribe(context, callable) {
      if (!this.hasSubscribers()) {
        this.oldValue = this.getValue();
        this.handler.subscribe(this.element, this);
      }

      this.addSubscriber(context, callable);
    };

    ValueAttributeObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
        this.handler.dispose();
      }
    };

    return ValueAttributeObserver;
  }()) || _class8);


  var checkedArrayContext = 'CheckedObserver:array';
  var checkedValueContext = 'CheckedObserver:value';

  var CheckedObserver = exports.CheckedObserver = (_dec8 = subscriberCollection(), _dec8(_class9 = function () {
    function CheckedObserver(element, handler, observerLocator) {


      this.element = element;
      this.handler = handler;
      this.observerLocator = observerLocator;
    }

    CheckedObserver.prototype.getValue = function getValue() {
      return this.value;
    };

    CheckedObserver.prototype.setValue = function setValue(newValue) {
      if (this.initialSync && this.value === newValue) {
        return;
      }

      if (this.arrayObserver) {
        this.arrayObserver.unsubscribe(checkedArrayContext, this);
        this.arrayObserver = null;
      }

      if (this.element.type === 'checkbox' && Array.isArray(newValue)) {
        this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
        this.arrayObserver.subscribe(checkedArrayContext, this);
      }

      this.oldValue = this.value;
      this.value = newValue;
      this.synchronizeElement();
      this.notify();

      if (!this.initialSync) {
        this.initialSync = true;
        this.observerLocator.taskQueue.queueMicroTask(this);
      }
    };

    CheckedObserver.prototype.call = function call(context, splices) {
      this.synchronizeElement();

      if (!this.valueObserver) {
        this.valueObserver = this.element.__observers__.model || this.element.__observers__.value;
        if (this.valueObserver) {
          this.valueObserver.subscribe(checkedValueContext, this);
        }
      }
    };

    CheckedObserver.prototype.synchronizeElement = function synchronizeElement() {
      var value = this.value;
      var element = this.element;
      var elementValue = element.hasOwnProperty('model') ? element.model : element.value;
      var isRadio = element.type === 'radio';
      var matcher = element.matcher || function (a, b) {
        return a === b;
      };

      element.checked = isRadio && !!matcher(value, elementValue) || !isRadio && value === true || !isRadio && Array.isArray(value) && value.findIndex(function (item) {
        return !!matcher(item, elementValue);
      }) !== -1;
    };

    CheckedObserver.prototype.synchronizeValue = function synchronizeValue() {
      var value = this.value;
      var element = this.element;
      var elementValue = element.hasOwnProperty('model') ? element.model : element.value;
      var index = void 0;
      var matcher = element.matcher || function (a, b) {
        return a === b;
      };

      if (element.type === 'checkbox') {
        if (Array.isArray(value)) {
          index = value.findIndex(function (item) {
            return !!matcher(item, elementValue);
          });
          if (element.checked && index === -1) {
            value.push(elementValue);
          } else if (!element.checked && index !== -1) {
            value.splice(index, 1);
          }

          return;
        }

        value = element.checked;
      } else if (element.checked) {
        value = elementValue;
      } else {
        return;
      }

      this.oldValue = this.value;
      this.value = value;
      this.notify();
    };

    CheckedObserver.prototype.notify = function notify() {
      var oldValue = this.oldValue;
      var newValue = this.value;

      if (newValue === oldValue) {
        return;
      }

      this.callSubscribers(newValue, oldValue);
    };

    CheckedObserver.prototype.handleEvent = function handleEvent() {
      this.synchronizeValue();
    };

    CheckedObserver.prototype.subscribe = function subscribe(context, callable) {
      if (!this.hasSubscribers()) {
        this.handler.subscribe(this.element, this);
      }
      this.addSubscriber(context, callable);
    };

    CheckedObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
        this.handler.dispose();
      }
    };

    CheckedObserver.prototype.unbind = function unbind() {
      if (this.arrayObserver) {
        this.arrayObserver.unsubscribe(checkedArrayContext, this);
        this.arrayObserver = null;
      }
      if (this.valueObserver) {
        this.valueObserver.unsubscribe(checkedValueContext, this);
      }
    };

    return CheckedObserver;
  }()) || _class9);


  var selectArrayContext = 'SelectValueObserver:array';

  var SelectValueObserver = exports.SelectValueObserver = (_dec9 = subscriberCollection(), _dec9(_class10 = function () {
    function SelectValueObserver(element, handler, observerLocator) {


      this.element = element;
      this.handler = handler;
      this.observerLocator = observerLocator;
    }

    SelectValueObserver.prototype.getValue = function getValue() {
      return this.value;
    };

    SelectValueObserver.prototype.setValue = function setValue(newValue) {
      if (newValue !== null && newValue !== undefined && this.element.multiple && !Array.isArray(newValue)) {
        throw new Error('Only null or Array instances can be bound to a multi-select.');
      }
      if (this.value === newValue) {
        return;
      }

      if (this.arrayObserver) {
        this.arrayObserver.unsubscribe(selectArrayContext, this);
        this.arrayObserver = null;
      }

      if (Array.isArray(newValue)) {
        this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
        this.arrayObserver.subscribe(selectArrayContext, this);
      }

      this.oldValue = this.value;
      this.value = newValue;
      this.synchronizeOptions();
      this.notify();

      if (!this.initialSync) {
        this.initialSync = true;
        this.observerLocator.taskQueue.queueMicroTask(this);
      }
    };

    SelectValueObserver.prototype.call = function call(context, splices) {
      this.synchronizeOptions();
    };

    SelectValueObserver.prototype.synchronizeOptions = function synchronizeOptions() {
      var value = this.value;
      var isArray = void 0;

      if (Array.isArray(value)) {
        isArray = true;
      }

      var options = this.element.options;
      var i = options.length;
      var matcher = this.element.matcher || function (a, b) {
        return a === b;
      };

      var _loop = function _loop() {
        var option = options.item(i);
        var optionValue = option.hasOwnProperty('model') ? option.model : option.value;
        if (isArray) {
          option.selected = value.findIndex(function (item) {
            return !!matcher(optionValue, item);
          }) !== -1;
          return 'continue';
        }
        option.selected = !!matcher(optionValue, value);
      };

      while (i--) {
        var _ret = _loop();

        if (_ret === 'continue') continue;
      }
    };

    SelectValueObserver.prototype.synchronizeValue = function synchronizeValue() {
      var _this23 = this;

      var options = this.element.options;
      var count = 0;
      var value = [];

      for (var i = 0, ii = options.length; i < ii; i++) {
        var _option = options.item(i);
        if (!_option.selected) {
          continue;
        }
        value.push(_option.hasOwnProperty('model') ? _option.model : _option.value);
        count++;
      }

      if (this.element.multiple) {
        if (Array.isArray(this.value)) {
          var _ret2 = function () {
            var matcher = _this23.element.matcher || function (a, b) {
              return a === b;
            };

            var i = 0;

            var _loop2 = function _loop2() {
              var a = _this23.value[i];
              if (value.findIndex(function (b) {
                return matcher(a, b);
              }) === -1) {
                _this23.value.splice(i, 1);
              } else {
                i++;
              }
            };

            while (i < _this23.value.length) {
              _loop2();
            }

            i = 0;

            var _loop3 = function _loop3() {
              var a = value[i];
              if (_this23.value.findIndex(function (b) {
                return matcher(a, b);
              }) === -1) {
                _this23.value.push(a);
              }
              i++;
            };

            while (i < value.length) {
              _loop3();
            }
            return {
              v: void 0
            };
          }();

          if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
        }
      } else {
        if (count === 0) {
          value = null;
        } else {
          value = value[0];
        }
      }

      if (value !== this.value) {
        this.oldValue = this.value;
        this.value = value;
        this.notify();
      }
    };

    SelectValueObserver.prototype.notify = function notify() {
      var oldValue = this.oldValue;
      var newValue = this.value;

      this.callSubscribers(newValue, oldValue);
    };

    SelectValueObserver.prototype.handleEvent = function handleEvent() {
      this.synchronizeValue();
    };

    SelectValueObserver.prototype.subscribe = function subscribe(context, callable) {
      if (!this.hasSubscribers()) {
        this.handler.subscribe(this.element, this);
      }
      this.addSubscriber(context, callable);
    };

    SelectValueObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
        this.handler.dispose();
      }
    };

    SelectValueObserver.prototype.bind = function bind() {
      var _this24 = this;

      this.domObserver = _aureliaPal.DOM.createMutationObserver(function () {
        _this24.synchronizeOptions();
        _this24.synchronizeValue();
      });
      this.domObserver.observe(this.element, { childList: true, subtree: true, characterData: true });
    };

    SelectValueObserver.prototype.unbind = function unbind() {
      this.domObserver.disconnect();
      this.domObserver = null;

      if (this.arrayObserver) {
        this.arrayObserver.unsubscribe(selectArrayContext, this);
        this.arrayObserver = null;
      }
    };

    return SelectValueObserver;
  }()) || _class10);

  var ClassObserver = exports.ClassObserver = function () {
    function ClassObserver(element) {


      this.element = element;
      this.doNotCache = true;
      this.value = '';
      this.version = 0;
    }

    ClassObserver.prototype.getValue = function getValue() {
      return this.value;
    };

    ClassObserver.prototype.setValue = function setValue(newValue) {
      var nameIndex = this.nameIndex || {};
      var version = this.version;
      var names = void 0;
      var name = void 0;

      if (newValue !== null && newValue !== undefined && newValue.length) {
        names = newValue.split(/\s+/);
        for (var i = 0, length = names.length; i < length; i++) {
          name = names[i];
          if (name === '') {
            continue;
          }
          nameIndex[name] = version;
          this.element.classList.add(name);
        }
      }

      this.value = newValue;
      this.nameIndex = nameIndex;
      this.version += 1;

      if (version === 0) {
        return;
      }

      version -= 1;
      for (name in nameIndex) {
        if (!nameIndex.hasOwnProperty(name) || nameIndex[name] !== version) {
          continue;
        }
        this.element.classList.remove(name);
      }
    };

    ClassObserver.prototype.subscribe = function subscribe() {
      throw new Error('Observation of a "' + this.element.nodeName + '" element\'s "class" property is not supported.');
    };

    return ClassObserver;
  }();

  function hasDeclaredDependencies(descriptor) {
    return !!(descriptor && descriptor.get && descriptor.get.dependencies);
  }

  function declarePropertyDependencies(ctor, propertyName, dependencies) {
    var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
    descriptor.get.dependencies = dependencies;
  }

  function computedFrom() {
    for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
      rest[_key] = arguments[_key];
    }

    return function (target, key, descriptor) {
      descriptor.get.dependencies = rest;
      return descriptor;
    };
  }

  var ComputedExpression = exports.ComputedExpression = function (_Expression19) {
    _inherits(ComputedExpression, _Expression19);

    function ComputedExpression(name, dependencies) {


      var _this25 = _possibleConstructorReturn(this, _Expression19.call(this));

      _this25.name = name;
      _this25.dependencies = dependencies;
      _this25.isAssignable = true;
      return _this25;
    }

    ComputedExpression.prototype.evaluate = function evaluate(scope, lookupFunctions) {
      return scope.bindingContext[this.name];
    };

    ComputedExpression.prototype.assign = function assign(scope, value) {
      scope.bindingContext[this.name] = value;
    };

    ComputedExpression.prototype.accept = function accept(visitor) {
      throw new Error('not implemented');
    };

    ComputedExpression.prototype.connect = function connect(binding, scope) {
      var dependencies = this.dependencies;
      var i = dependencies.length;
      while (i--) {
        dependencies[i].connect(binding, scope);
      }
    };

    return ComputedExpression;
  }(Expression);

  function createComputedObserver(obj, propertyName, descriptor, observerLocator) {
    var dependencies = descriptor.get.dependencies;
    if (!(dependencies instanceof ComputedExpression)) {
      var i = dependencies.length;
      while (i--) {
        dependencies[i] = observerLocator.parser.parse(dependencies[i]);
      }
      dependencies = descriptor.get.dependencies = new ComputedExpression(propertyName, dependencies);
    }

    var scope = { bindingContext: obj, overrideContext: createOverrideContext(obj) };
    return new ExpressionObserver(scope, dependencies, observerLocator);
  }

  var svgElements = void 0;
  var svgPresentationElements = void 0;
  var svgPresentationAttributes = void 0;
  var svgAnalyzer = void 0;

  if (typeof FEATURE_NO_SVG === 'undefined') {
    svgElements = {
      a: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'target', 'transform', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      altGlyph: ['class', 'dx', 'dy', 'externalResourcesRequired', 'format', 'glyphRef', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      altGlyphDef: ['id', 'xml:base', 'xml:lang', 'xml:space'],
      altGlyphItem: ['id', 'xml:base', 'xml:lang', 'xml:space'],
      animate: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      animateColor: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      animateMotion: ['accumulate', 'additive', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keyPoints', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'origin', 'path', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'rotate', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      animateTransform: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'type', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      circle: ['class', 'cx', 'cy', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'r', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      clipPath: ['class', 'clipPathUnits', 'externalResourcesRequired', 'id', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      'color-profile': ['id', 'local', 'name', 'rendering-intent', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      cursor: ['externalResourcesRequired', 'id', 'requiredExtensions', 'requiredFeatures', 'systemLanguage', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      defs: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      desc: ['class', 'id', 'style', 'xml:base', 'xml:lang', 'xml:space'],
      ellipse: ['class', 'cx', 'cy', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rx', 'ry', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      feBlend: ['class', 'height', 'id', 'in', 'in2', 'mode', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feColorMatrix: ['class', 'height', 'id', 'in', 'result', 'style', 'type', 'values', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feComponentTransfer: ['class', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feComposite: ['class', 'height', 'id', 'in', 'in2', 'k1', 'k2', 'k3', 'k4', 'operator', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feConvolveMatrix: ['bias', 'class', 'divisor', 'edgeMode', 'height', 'id', 'in', 'kernelMatrix', 'kernelUnitLength', 'order', 'preserveAlpha', 'result', 'style', 'targetX', 'targetY', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feDiffuseLighting: ['class', 'diffuseConstant', 'height', 'id', 'in', 'kernelUnitLength', 'result', 'style', 'surfaceScale', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feDisplacementMap: ['class', 'height', 'id', 'in', 'in2', 'result', 'scale', 'style', 'width', 'x', 'xChannelSelector', 'xml:base', 'xml:lang', 'xml:space', 'y', 'yChannelSelector'],
      feDistantLight: ['azimuth', 'elevation', 'id', 'xml:base', 'xml:lang', 'xml:space'],
      feFlood: ['class', 'height', 'id', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feFuncA: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
      feFuncB: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
      feFuncG: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
      feFuncR: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
      feGaussianBlur: ['class', 'height', 'id', 'in', 'result', 'stdDeviation', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feImage: ['class', 'externalResourcesRequired', 'height', 'id', 'preserveAspectRatio', 'result', 'style', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feMerge: ['class', 'height', 'id', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feMergeNode: ['id', 'xml:base', 'xml:lang', 'xml:space'],
      feMorphology: ['class', 'height', 'id', 'in', 'operator', 'radius', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feOffset: ['class', 'dx', 'dy', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      fePointLight: ['id', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'z'],
      feSpecularLighting: ['class', 'height', 'id', 'in', 'kernelUnitLength', 'result', 'specularConstant', 'specularExponent', 'style', 'surfaceScale', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feSpotLight: ['id', 'limitingConeAngle', 'pointsAtX', 'pointsAtY', 'pointsAtZ', 'specularExponent', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'z'],
      feTile: ['class', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      feTurbulence: ['baseFrequency', 'class', 'height', 'id', 'numOctaves', 'result', 'seed', 'stitchTiles', 'style', 'type', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      filter: ['class', 'externalResourcesRequired', 'filterRes', 'filterUnits', 'height', 'id', 'primitiveUnits', 'style', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      font: ['class', 'externalResourcesRequired', 'horiz-adv-x', 'horiz-origin-x', 'horiz-origin-y', 'id', 'style', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
      'font-face': ['accent-height', 'alphabetic', 'ascent', 'bbox', 'cap-height', 'descent', 'font-family', 'font-size', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'hanging', 'id', 'ideographic', 'mathematical', 'overline-position', 'overline-thickness', 'panose-1', 'slope', 'stemh', 'stemv', 'strikethrough-position', 'strikethrough-thickness', 'underline-position', 'underline-thickness', 'unicode-range', 'units-per-em', 'v-alphabetic', 'v-hanging', 'v-ideographic', 'v-mathematical', 'widths', 'x-height', 'xml:base', 'xml:lang', 'xml:space'],
      'font-face-format': ['id', 'string', 'xml:base', 'xml:lang', 'xml:space'],
      'font-face-name': ['id', 'name', 'xml:base', 'xml:lang', 'xml:space'],
      'font-face-src': ['id', 'xml:base', 'xml:lang', 'xml:space'],
      'font-face-uri': ['id', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      foreignObject: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      g: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      glyph: ['arabic-form', 'class', 'd', 'glyph-name', 'horiz-adv-x', 'id', 'lang', 'orientation', 'style', 'unicode', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
      glyphRef: ['class', 'dx', 'dy', 'format', 'glyphRef', 'id', 'style', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      hkern: ['g1', 'g2', 'id', 'k', 'u1', 'u2', 'xml:base', 'xml:lang', 'xml:space'],
      image: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      line: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'x1', 'x2', 'xml:base', 'xml:lang', 'xml:space', 'y1', 'y2'],
      linearGradient: ['class', 'externalResourcesRequired', 'gradientTransform', 'gradientUnits', 'id', 'spreadMethod', 'style', 'x1', 'x2', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y1', 'y2'],
      marker: ['class', 'externalResourcesRequired', 'id', 'markerHeight', 'markerUnits', 'markerWidth', 'orient', 'preserveAspectRatio', 'refX', 'refY', 'style', 'viewBox', 'xml:base', 'xml:lang', 'xml:space'],
      mask: ['class', 'externalResourcesRequired', 'height', 'id', 'maskContentUnits', 'maskUnits', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      metadata: ['id', 'xml:base', 'xml:lang', 'xml:space'],
      'missing-glyph': ['class', 'd', 'horiz-adv-x', 'id', 'style', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
      mpath: ['externalResourcesRequired', 'id', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      path: ['class', 'd', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'pathLength', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      pattern: ['class', 'externalResourcesRequired', 'height', 'id', 'patternContentUnits', 'patternTransform', 'patternUnits', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'viewBox', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      polygon: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'points', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      polyline: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'points', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      radialGradient: ['class', 'cx', 'cy', 'externalResourcesRequired', 'fx', 'fy', 'gradientTransform', 'gradientUnits', 'id', 'r', 'spreadMethod', 'style', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      rect: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rx', 'ry', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      script: ['externalResourcesRequired', 'id', 'type', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      set: ['attributeName', 'attributeType', 'begin', 'dur', 'end', 'externalResourcesRequired', 'fill', 'id', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      stop: ['class', 'id', 'offset', 'style', 'xml:base', 'xml:lang', 'xml:space'],
      style: ['id', 'media', 'title', 'type', 'xml:base', 'xml:lang', 'xml:space'],
      svg: ['baseProfile', 'class', 'contentScriptType', 'contentStyleType', 'externalResourcesRequired', 'height', 'id', 'onabort', 'onactivate', 'onclick', 'onerror', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onresize', 'onscroll', 'onunload', 'onzoom', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'version', 'viewBox', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'zoomAndPan'],
      switch: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
      symbol: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'preserveAspectRatio', 'style', 'viewBox', 'xml:base', 'xml:lang', 'xml:space'],
      text: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'transform', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      textPath: ['class', 'externalResourcesRequired', 'id', 'lengthAdjust', 'method', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'spacing', 'startOffset', 'style', 'systemLanguage', 'textLength', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
      title: ['class', 'id', 'style', 'xml:base', 'xml:lang', 'xml:space'],
      tref: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'x', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      tspan: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      use: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
      view: ['externalResourcesRequired', 'id', 'preserveAspectRatio', 'viewBox', 'viewTarget', 'xml:base', 'xml:lang', 'xml:space', 'zoomAndPan'],
      vkern: ['g1', 'g2', 'id', 'k', 'u1', 'u2', 'xml:base', 'xml:lang', 'xml:space']
    };


    svgPresentationElements = {
      'a': true,
      'altGlyph': true,
      'animate': true,
      'animateColor': true,
      'circle': true,
      'clipPath': true,
      'defs': true,
      'ellipse': true,
      'feBlend': true,
      'feColorMatrix': true,
      'feComponentTransfer': true,
      'feComposite': true,
      'feConvolveMatrix': true,
      'feDiffuseLighting': true,
      'feDisplacementMap': true,
      'feFlood': true,
      'feGaussianBlur': true,
      'feImage': true,
      'feMerge': true,
      'feMorphology': true,
      'feOffset': true,
      'feSpecularLighting': true,
      'feTile': true,
      'feTurbulence': true,
      'filter': true,
      'font': true,
      'foreignObject': true,
      'g': true,
      'glyph': true,
      'glyphRef': true,
      'image': true,
      'line': true,
      'linearGradient': true,
      'marker': true,
      'mask': true,
      'missing-glyph': true,
      'path': true,
      'pattern': true,
      'polygon': true,
      'polyline': true,
      'radialGradient': true,
      'rect': true,
      'stop': true,
      'svg': true,
      'switch': true,
      'symbol': true,
      'text': true,
      'textPath': true,
      'tref': true,
      'tspan': true,
      'use': true
    };

    svgPresentationAttributes = {
      'alignment-baseline': true,
      'baseline-shift': true,
      'clip-path': true,
      'clip-rule': true,
      'clip': true,
      'color-interpolation-filters': true,
      'color-interpolation': true,
      'color-profile': true,
      'color-rendering': true,
      'color': true,
      'cursor': true,
      'direction': true,
      'display': true,
      'dominant-baseline': true,
      'enable-background': true,
      'fill-opacity': true,
      'fill-rule': true,
      'fill': true,
      'filter': true,
      'flood-color': true,
      'flood-opacity': true,
      'font-family': true,
      'font-size-adjust': true,
      'font-size': true,
      'font-stretch': true,
      'font-style': true,
      'font-variant': true,
      'font-weight': true,
      'glyph-orientation-horizontal': true,
      'glyph-orientation-vertical': true,
      'image-rendering': true,
      'kerning': true,
      'letter-spacing': true,
      'lighting-color': true,
      'marker-end': true,
      'marker-mid': true,
      'marker-start': true,
      'mask': true,
      'opacity': true,
      'overflow': true,
      'pointer-events': true,
      'shape-rendering': true,
      'stop-color': true,
      'stop-opacity': true,
      'stroke-dasharray': true,
      'stroke-dashoffset': true,
      'stroke-linecap': true,
      'stroke-linejoin': true,
      'stroke-miterlimit': true,
      'stroke-opacity': true,
      'stroke-width': true,
      'stroke': true,
      'text-anchor': true,
      'text-decoration': true,
      'text-rendering': true,
      'unicode-bidi': true,
      'visibility': true,
      'word-spacing': true,
      'writing-mode': true
    };

    var createElement = function createElement(html) {
      var div = _aureliaPal.DOM.createElement('div');
      div.innerHTML = html;
      return div.firstChild;
    };

    svgAnalyzer = function () {
      function SVGAnalyzer() {


        if (createElement('<svg><altGlyph /></svg>').firstElementChild.nodeName === 'altglyph' && elements.altGlyph) {
          elements.altglyph = elements.altGlyph;
          delete elements.altGlyph;
          elements.altglyphdef = elements.altGlyphDef;
          delete elements.altGlyphDef;
          elements.altglyphitem = elements.altGlyphItem;
          delete elements.altGlyphItem;
          elements.glyphref = elements.glyphRef;
          delete elements.glyphRef;
        }
      }

      SVGAnalyzer.prototype.isStandardSvgAttribute = function isStandardSvgAttribute(nodeName, attributeName) {
        return presentationElements[nodeName] && presentationAttributes[attributeName] || elements[nodeName] && elements[nodeName].indexOf(attributeName) !== -1;
      };

      return SVGAnalyzer;
    }();
  }

  var elements = exports.elements = svgElements;
  var presentationElements = exports.presentationElements = svgPresentationElements;
  var presentationAttributes = exports.presentationAttributes = svgPresentationAttributes;
  var SVGAnalyzer = exports.SVGAnalyzer = svgAnalyzer || function () {
    function _class11() {

    }

    _class11.prototype.isStandardSvgAttribute = function isStandardSvgAttribute() {
      return false;
    };

    return _class11;
  }();

  var ObserverLocator = exports.ObserverLocator = (_temp = _class12 = function () {
    function ObserverLocator(taskQueue, eventManager, dirtyChecker, svgAnalyzer, parser) {


      this.taskQueue = taskQueue;
      this.eventManager = eventManager;
      this.dirtyChecker = dirtyChecker;
      this.svgAnalyzer = svgAnalyzer;
      this.parser = parser;

      this.adapters = [];
      this.logger = LogManager.getLogger('observer-locator');
    }

    ObserverLocator.prototype.getObserver = function getObserver(obj, propertyName) {
      var observersLookup = obj.__observers__;
      var observer = void 0;

      if (observersLookup && propertyName in observersLookup) {
        return observersLookup[propertyName];
      }

      observer = this.createPropertyObserver(obj, propertyName);

      if (!observer.doNotCache) {
        if (observersLookup === undefined) {
          observersLookup = this.getOrCreateObserversLookup(obj);
        }

        observersLookup[propertyName] = observer;
      }

      return observer;
    };

    ObserverLocator.prototype.getOrCreateObserversLookup = function getOrCreateObserversLookup(obj) {
      return obj.__observers__ || this.createObserversLookup(obj);
    };

    ObserverLocator.prototype.createObserversLookup = function createObserversLookup(obj) {
      var value = {};

      if (!Reflect.defineProperty(obj, '__observers__', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: value
      })) {
        this.logger.warn('Cannot add observers to object', obj);
      }

      return value;
    };

    ObserverLocator.prototype.addAdapter = function addAdapter(adapter) {
      this.adapters.push(adapter);
    };

    ObserverLocator.prototype.getAdapterObserver = function getAdapterObserver(obj, propertyName, descriptor) {
      for (var i = 0, ii = this.adapters.length; i < ii; i++) {
        var adapter = this.adapters[i];
        var observer = adapter.getObserver(obj, propertyName, descriptor);
        if (observer) {
          return observer;
        }
      }
      return null;
    };

    ObserverLocator.prototype.createPropertyObserver = function createPropertyObserver(obj, propertyName) {
      var descriptor = void 0;
      var handler = void 0;
      var xlinkResult = void 0;

      if (!(obj instanceof Object)) {
        return new PrimitiveObserver(obj, propertyName);
      }

      if (obj instanceof _aureliaPal.DOM.Element) {
        if (propertyName === 'class') {
          return new ClassObserver(obj);
        }
        if (propertyName === 'style' || propertyName === 'css') {
          return new StyleObserver(obj, propertyName);
        }
        handler = this.eventManager.getElementHandler(obj, propertyName);
        if (propertyName === 'value' && obj.tagName.toLowerCase() === 'select') {
          return new SelectValueObserver(obj, handler, this);
        }
        if (propertyName === 'checked' && obj.tagName.toLowerCase() === 'input') {
          return new CheckedObserver(obj, handler, this);
        }
        if (handler) {
          return new ValueAttributeObserver(obj, propertyName, handler);
        }
        xlinkResult = /^xlink:(.+)$/.exec(propertyName);
        if (xlinkResult) {
          return new XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
        }
        if (propertyName === 'role' && (obj instanceof _aureliaPal.DOM.Element || obj instanceof _aureliaPal.DOM.SVGElement) || /^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof _aureliaPal.DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
          return new DataAttributeObserver(obj, propertyName);
        }
      }

      descriptor = Object.getPropertyDescriptor(obj, propertyName);

      if (hasDeclaredDependencies(descriptor)) {
        return createComputedObserver(obj, propertyName, descriptor, this);
      }

      if (descriptor) {
        var existingGetterOrSetter = descriptor.get || descriptor.set;
        if (existingGetterOrSetter) {
          if (existingGetterOrSetter.getObserver) {
            return existingGetterOrSetter.getObserver(obj);
          }

          var adapterObserver = this.getAdapterObserver(obj, propertyName, descriptor);
          if (adapterObserver) {
            return adapterObserver;
          }
          return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
        }
      }

      if (obj instanceof Array) {
        if (propertyName === 'length') {
          return this.getArrayObserver(obj).getLengthObserver();
        }

        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      } else if (obj instanceof Map) {
        if (propertyName === 'size') {
          return this.getMapObserver(obj).getLengthObserver();
        }

        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      } else if (obj instanceof Set) {
        if (propertyName === 'size') {
          return this.getSetObserver(obj).getLengthObserver();
        }

        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }

      return new SetterObserver(this.taskQueue, obj, propertyName);
    };

    ObserverLocator.prototype.getAccessor = function getAccessor(obj, propertyName) {
      if (obj instanceof _aureliaPal.DOM.Element) {
        if (propertyName === 'class' || propertyName === 'style' || propertyName === 'css' || propertyName === 'value' && (obj.tagName.toLowerCase() === 'input' || obj.tagName.toLowerCase() === 'select') || propertyName === 'checked' && obj.tagName.toLowerCase() === 'input' || propertyName === 'model' && obj.tagName.toLowerCase() === 'input' || /^xlink:.+$/.exec(propertyName)) {
          return this.getObserver(obj, propertyName);
        }
        if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof _aureliaPal.DOM.SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName) || obj.tagName.toLowerCase() === 'img' && propertyName === 'src' || obj.tagName.toLowerCase() === 'a' && propertyName === 'href') {
          return dataAttributeAccessor;
        }
      }
      return propertyAccessor;
    };

    ObserverLocator.prototype.getArrayObserver = function getArrayObserver(array) {
      return _getArrayObserver(this.taskQueue, array);
    };

    ObserverLocator.prototype.getMapObserver = function getMapObserver(map) {
      return _getMapObserver(this.taskQueue, map);
    };

    ObserverLocator.prototype.getSetObserver = function getSetObserver(set) {
      return _getSetObserver(this.taskQueue, set);
    };

    return ObserverLocator;
  }(), _class12.inject = [_aureliaTaskQueue.TaskQueue, EventManager, DirtyChecker, SVGAnalyzer, Parser], _temp);

  var ObjectObservationAdapter = exports.ObjectObservationAdapter = function () {
    function ObjectObservationAdapter() {

    }

    ObjectObservationAdapter.prototype.getObserver = function getObserver(object, propertyName, descriptor) {
      throw new Error('BindingAdapters must implement getObserver(object, propertyName).');
    };

    return ObjectObservationAdapter;
  }();

  var BindingExpression = exports.BindingExpression = function () {
    function BindingExpression(observerLocator, targetProperty, sourceExpression, mode, lookupFunctions, attribute) {


      this.observerLocator = observerLocator;
      this.targetProperty = targetProperty;
      this.sourceExpression = sourceExpression;
      this.mode = mode;
      this.lookupFunctions = lookupFunctions;
      this.attribute = attribute;
      this.discrete = false;
    }

    BindingExpression.prototype.createBinding = function createBinding(target) {
      return new Binding(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.mode, this.lookupFunctions);
    };

    return BindingExpression;
  }();

  var Binding = exports.Binding = (_dec10 = connectable(), _dec10(_class13 = function () {
    function Binding(observerLocator, sourceExpression, target, targetProperty, mode, lookupFunctions) {


      this.observerLocator = observerLocator;
      this.sourceExpression = sourceExpression;
      this.target = target;
      this.targetProperty = targetProperty;
      this.mode = mode;
      this.lookupFunctions = lookupFunctions;
    }

    Binding.prototype.updateTarget = function updateTarget(value) {
      this.targetObserver.setValue(value, this.target, this.targetProperty);
    };

    Binding.prototype.updateSource = function updateSource(value) {
      this.sourceExpression.assign(this.source, value, this.lookupFunctions);
    };

    Binding.prototype.call = function call(context, newValue, oldValue) {
      if (!this.isBound) {
        return;
      }
      if (context === sourceContext) {
        oldValue = this.targetObserver.getValue(this.target, this.targetProperty);
        newValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
        if (newValue !== oldValue) {
          this.updateTarget(newValue);
        }
        if (this.mode !== bindingMode.oneTime) {
          this._version++;
          this.sourceExpression.connect(this, this.source);
          this.unobserve(false);
        }
        return;
      }
      if (context === targetContext) {
        if (newValue !== this.sourceExpression.evaluate(this.source, this.lookupFunctions)) {
          this.updateSource(newValue);
        }
        return;
      }
      throw new Error('Unexpected call context ' + context);
    };

    Binding.prototype.bind = function bind(source) {
      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }
      this.isBound = true;
      this.source = source;

      if (this.sourceExpression.bind) {
        this.sourceExpression.bind(this, source, this.lookupFunctions);
      }

      var mode = this.mode;
      if (!this.targetObserver) {
        var method = mode === bindingMode.twoWay || mode === bindingMode.fromView ? 'getObserver' : 'getAccessor';
        this.targetObserver = this.observerLocator[method](this.target, this.targetProperty);
      }

      if ('bind' in this.targetObserver) {
        this.targetObserver.bind();
      }
      if (this.mode !== bindingMode.fromView) {
        var value = this.sourceExpression.evaluate(source, this.lookupFunctions);
        this.updateTarget(value);
      }

      if (mode === bindingMode.oneTime) {
        return;
      } else if (mode === bindingMode.toView) {
        enqueueBindingConnect(this);
      } else if (mode === bindingMode.twoWay) {
        this.sourceExpression.connect(this, source);
        this.targetObserver.subscribe(targetContext, this);
      } else if (mode === bindingMode.fromView) {
        this.targetObserver.subscribe(targetContext, this);
      }
    };

    Binding.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      if (this.sourceExpression.unbind) {
        this.sourceExpression.unbind(this, this.source);
      }
      this.source = null;
      if ('unbind' in this.targetObserver) {
        this.targetObserver.unbind();
      }
      if (this.targetObserver.unsubscribe) {
        this.targetObserver.unsubscribe(targetContext, this);
      }
      this.unobserve(true);
    };

    Binding.prototype.connect = function connect(evaluate) {
      if (!this.isBound) {
        return;
      }
      if (evaluate) {
        var value = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
        this.updateTarget(value);
      }
      this.sourceExpression.connect(this, this.source);
    };

    return Binding;
  }()) || _class13);

  var CallExpression = exports.CallExpression = function () {
    function CallExpression(observerLocator, targetProperty, sourceExpression, lookupFunctions) {


      this.observerLocator = observerLocator;
      this.targetProperty = targetProperty;
      this.sourceExpression = sourceExpression;
      this.lookupFunctions = lookupFunctions;
    }

    CallExpression.prototype.createBinding = function createBinding(target) {
      return new Call(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.lookupFunctions);
    };

    return CallExpression;
  }();

  var Call = exports.Call = function () {
    function Call(observerLocator, sourceExpression, target, targetProperty, lookupFunctions) {


      this.sourceExpression = sourceExpression;
      this.target = target;
      this.targetProperty = observerLocator.getObserver(target, targetProperty);
      this.lookupFunctions = lookupFunctions;
    }

    Call.prototype.callSource = function callSource($event) {
      var overrideContext = this.source.overrideContext;
      Object.assign(overrideContext, $event);
      overrideContext.$event = $event;
      var mustEvaluate = true;
      var result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
      delete overrideContext.$event;
      for (var prop in $event) {
        delete overrideContext[prop];
      }
      return result;
    };

    Call.prototype.bind = function bind(source) {
      var _this26 = this;

      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }
      this.isBound = true;
      this.source = source;

      if (this.sourceExpression.bind) {
        this.sourceExpression.bind(this, source, this.lookupFunctions);
      }
      this.targetProperty.setValue(function ($event) {
        return _this26.callSource($event);
      });
    };

    Call.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      if (this.sourceExpression.unbind) {
        this.sourceExpression.unbind(this, this.source);
      }
      this.source = null;
      this.targetProperty.setValue(null);
    };

    return Call;
  }();

  var ValueConverterResource = exports.ValueConverterResource = function () {
    function ValueConverterResource(name) {


      this.name = name;
    }

    ValueConverterResource.convention = function convention(name) {
      if (name.endsWith('ValueConverter')) {
        return new ValueConverterResource(camelCase(name.substring(0, name.length - 14)));
      }
    };

    ValueConverterResource.prototype.initialize = function initialize(container, target) {
      this.instance = container.get(target);
    };

    ValueConverterResource.prototype.register = function register(registry, name) {
      registry.registerValueConverter(name || this.name, this.instance);
    };

    ValueConverterResource.prototype.load = function load(container, target) {};

    return ValueConverterResource;
  }();

  function valueConverter(nameOrTarget) {
    if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
      return function (target) {
        _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, new ValueConverterResource(nameOrTarget), target);
      };
    }

    _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, new ValueConverterResource(), nameOrTarget);
  }

  var BindingBehaviorResource = exports.BindingBehaviorResource = function () {
    function BindingBehaviorResource(name) {


      this.name = name;
    }

    BindingBehaviorResource.convention = function convention(name) {
      if (name.endsWith('BindingBehavior')) {
        return new BindingBehaviorResource(camelCase(name.substring(0, name.length - 15)));
      }
    };

    BindingBehaviorResource.prototype.initialize = function initialize(container, target) {
      this.instance = container.get(target);
    };

    BindingBehaviorResource.prototype.register = function register(registry, name) {
      registry.registerBindingBehavior(name || this.name, this.instance);
    };

    BindingBehaviorResource.prototype.load = function load(container, target) {};

    return BindingBehaviorResource;
  }();

  function bindingBehavior(nameOrTarget) {
    if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
      return function (target) {
        _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, new BindingBehaviorResource(nameOrTarget), target);
      };
    }

    _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, new BindingBehaviorResource(), nameOrTarget);
  }

  var ListenerExpression = exports.ListenerExpression = function () {
    function ListenerExpression(eventManager, targetEvent, sourceExpression, delegationStrategy, preventDefault, lookupFunctions) {


      this.eventManager = eventManager;
      this.targetEvent = targetEvent;
      this.sourceExpression = sourceExpression;
      this.delegationStrategy = delegationStrategy;
      this.discrete = true;
      this.preventDefault = preventDefault;
      this.lookupFunctions = lookupFunctions;
    }

    ListenerExpression.prototype.createBinding = function createBinding(target) {
      return new Listener(this.eventManager, this.targetEvent, this.delegationStrategy, this.sourceExpression, target, this.preventDefault, this.lookupFunctions);
    };

    return ListenerExpression;
  }();

  var Listener = exports.Listener = function () {
    function Listener(eventManager, targetEvent, delegationStrategy, sourceExpression, target, preventDefault, lookupFunctions) {


      this.eventManager = eventManager;
      this.targetEvent = targetEvent;
      this.delegationStrategy = delegationStrategy;
      this.sourceExpression = sourceExpression;
      this.target = target;
      this.preventDefault = preventDefault;
      this.lookupFunctions = lookupFunctions;
    }

    Listener.prototype.callSource = function callSource(event) {
      var overrideContext = this.source.overrideContext;
      overrideContext.$event = event;
      var mustEvaluate = true;
      var result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
      delete overrideContext.$event;
      if (result !== true && this.preventDefault) {
        event.preventDefault();
      }
      return result;
    };

    Listener.prototype.handleEvent = function handleEvent(event) {
      this.callSource(event);
    };

    Listener.prototype.bind = function bind(source) {
      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }
      this.isBound = true;
      this.source = source;

      if (this.sourceExpression.bind) {
        this.sourceExpression.bind(this, source, this.lookupFunctions);
      }
      this._handler = this.eventManager.addEventListener(this.target, this.targetEvent, this, this.delegationStrategy, true);
    };

    Listener.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      if (this.sourceExpression.unbind) {
        this.sourceExpression.unbind(this, this.source);
      }
      this.source = null;
      this._handler.dispose();
      this._handler = null;
    };

    return Listener;
  }();

  function getAU(element) {
    var au = element.au;

    if (au === undefined) {
      throw new Error('No Aurelia APIs are defined for the element: "' + element.tagName + '".');
    }

    return au;
  }

  var NameExpression = exports.NameExpression = function () {
    function NameExpression(sourceExpression, apiName, lookupFunctions) {


      this.sourceExpression = sourceExpression;
      this.apiName = apiName;
      this.lookupFunctions = lookupFunctions;
      this.discrete = true;
    }

    NameExpression.prototype.createBinding = function createBinding(target) {
      return new NameBinder(this.sourceExpression, NameExpression.locateAPI(target, this.apiName), this.lookupFunctions);
    };

    NameExpression.locateAPI = function locateAPI(element, apiName) {
      switch (apiName) {
        case 'element':
          return element;
        case 'controller':
          return getAU(element).controller;
        case 'view-model':
          return getAU(element).controller.viewModel;
        case 'view':
          return getAU(element).controller.view;
        default:
          var target = getAU(element)[apiName];

          if (target === undefined) {
            throw new Error('Attempted to reference "' + apiName + '", but it was not found amongst the target\'s API.');
          }

          return target.viewModel;
      }
    };

    return NameExpression;
  }();

  var NameBinder = function () {
    function NameBinder(sourceExpression, target, lookupFunctions) {


      this.sourceExpression = sourceExpression;
      this.target = target;
      this.lookupFunctions = lookupFunctions;
    }

    NameBinder.prototype.bind = function bind(source) {
      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }
      this.isBound = true;
      this.source = source;
      if (this.sourceExpression.bind) {
        this.sourceExpression.bind(this, source, this.lookupFunctions);
      }
      this.sourceExpression.assign(this.source, this.target, this.lookupFunctions);
    };

    NameBinder.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      if (this.sourceExpression.evaluate(this.source, this.lookupFunctions) === this.target) {
        this.sourceExpression.assign(this.source, null, this.lookupFunctions);
      }
      if (this.sourceExpression.unbind) {
        this.sourceExpression.unbind(this, this.source);
      }
      this.source = null;
    };

    return NameBinder;
  }();

  var LookupFunctions = {
    bindingBehaviors: function bindingBehaviors(name) {
      return null;
    },
    valueConverters: function valueConverters(name) {
      return null;
    }
  };

  var BindingEngine = exports.BindingEngine = (_temp2 = _class14 = function () {
    function BindingEngine(observerLocator, parser) {


      this.observerLocator = observerLocator;
      this.parser = parser;
    }

    BindingEngine.prototype.createBindingExpression = function createBindingExpression(targetProperty, sourceExpression) {
      var mode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : bindingMode.toView;
      var lookupFunctions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : LookupFunctions;

      return new BindingExpression(this.observerLocator, targetProperty, this.parser.parse(sourceExpression), mode, lookupFunctions);
    };

    BindingEngine.prototype.propertyObserver = function propertyObserver(obj, propertyName) {
      var _this27 = this;

      return {
        subscribe: function subscribe(callback) {
          var observer = _this27.observerLocator.getObserver(obj, propertyName);
          observer.subscribe(callback);
          return {
            dispose: function dispose() {
              return observer.unsubscribe(callback);
            }
          };
        }
      };
    };

    BindingEngine.prototype.collectionObserver = function collectionObserver(collection) {
      var _this28 = this;

      return {
        subscribe: function subscribe(callback) {
          var observer = void 0;
          if (collection instanceof Array) {
            observer = _this28.observerLocator.getArrayObserver(collection);
          } else if (collection instanceof Map) {
            observer = _this28.observerLocator.getMapObserver(collection);
          } else if (collection instanceof Set) {
            observer = _this28.observerLocator.getSetObserver(collection);
          } else {
            throw new Error('collection must be an instance of Array, Map or Set.');
          }
          observer.subscribe(callback);
          return {
            dispose: function dispose() {
              return observer.unsubscribe(callback);
            }
          };
        }
      };
    };

    BindingEngine.prototype.expressionObserver = function expressionObserver(bindingContext, expression) {
      var scope = { bindingContext: bindingContext, overrideContext: createOverrideContext(bindingContext) };
      return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator, LookupFunctions);
    };

    BindingEngine.prototype.parseExpression = function parseExpression(expression) {
      return this.parser.parse(expression);
    };

    BindingEngine.prototype.registerAdapter = function registerAdapter(adapter) {
      this.observerLocator.addAdapter(adapter);
    };

    return BindingEngine;
  }(), _class14.inject = [ObserverLocator, Parser], _temp2);


  var setProto = Set.prototype;

  function _getSetObserver(taskQueue, set) {
    return ModifySetObserver.for(taskQueue, set);
  }

  exports.getSetObserver = _getSetObserver;

  var ModifySetObserver = function (_ModifyCollectionObse3) {
    _inherits(ModifySetObserver, _ModifyCollectionObse3);

    function ModifySetObserver(taskQueue, set) {


      return _possibleConstructorReturn(this, _ModifyCollectionObse3.call(this, taskQueue, set));
    }

    ModifySetObserver.for = function _for(taskQueue, set) {
      if (!('__set_observer__' in set)) {
        Reflect.defineProperty(set, '__set_observer__', {
          value: ModifySetObserver.create(taskQueue, set),
          enumerable: false, configurable: false
        });
      }
      return set.__set_observer__;
    };

    ModifySetObserver.create = function create(taskQueue, set) {
      var observer = new ModifySetObserver(taskQueue, set);

      var proto = setProto;
      if (proto.add !== set.add || proto.delete !== set.delete || proto.clear !== set.clear) {
        proto = {
          add: set.add,
          delete: set.delete,
          clear: set.clear
        };
      }

      set.add = function () {
        var type = 'add';
        var oldSize = set.size;
        var methodCallResult = proto.add.apply(set, arguments);
        var hasValue = set.size === oldSize;
        if (!hasValue) {
          observer.addChangeRecord({
            type: type,
            object: set,
            value: Array.from(set).pop()
          });
        }
        return methodCallResult;
      };

      set.delete = function () {
        var hasValue = set.has(arguments[0]);
        var methodCallResult = proto.delete.apply(set, arguments);
        if (hasValue) {
          observer.addChangeRecord({
            type: 'delete',
            object: set,
            value: arguments[0]
          });
        }
        return methodCallResult;
      };

      set.clear = function () {
        var methodCallResult = proto.clear.apply(set, arguments);
        observer.addChangeRecord({
          type: 'clear',
          object: set
        });
        return methodCallResult;
      };

      return observer;
    };

    return ModifySetObserver;
  }(ModifyCollectionObserver);

  function observable(targetOrConfig, key, descriptor) {
    function deco(target, key, descriptor, config) {
      var isClassDecorator = key === undefined;
      if (isClassDecorator) {
        target = target.prototype;
        key = typeof config === 'string' ? config : config.name;
      }

      var innerPropertyName = '_' + key;
      var innerPropertyDescriptor = {
        configurable: true,
        enumerable: false,
        writable: true
      };

      var callbackName = config && config.changeHandler || key + 'Changed';

      if (descriptor) {
        if (typeof descriptor.initializer === 'function') {
          innerPropertyDescriptor.value = descriptor.initializer();
        }
      } else {
        descriptor = {};
      }

      if (!('enumerable' in descriptor)) {
        descriptor.enumerable = true;
      }

      delete descriptor.value;
      delete descriptor.writable;
      delete descriptor.initializer;

      Reflect.defineProperty(target, innerPropertyName, innerPropertyDescriptor);

      descriptor.get = function () {
        return this[innerPropertyName];
      };
      descriptor.set = function (newValue) {
        var oldValue = this[innerPropertyName];
        if (newValue === oldValue) {
          return;
        }

        this[innerPropertyName] = newValue;
        Reflect.defineProperty(this, innerPropertyName, { enumerable: false });

        if (this[callbackName]) {
          this[callbackName](newValue, oldValue, key);
        }
      };

      descriptor.get.dependencies = [innerPropertyName];

      if (isClassDecorator) {
        Reflect.defineProperty(target, key, descriptor);
      } else {
        return descriptor;
      }
    }

    if (key === undefined) {
      return function (t, k, d) {
        return deco(t, k, d, targetOrConfig);
      };
    }
    return deco(targetOrConfig, key, descriptor);
  }

  var signals = {};

  function connectBindingToSignal(binding, name) {
    if (!signals.hasOwnProperty(name)) {
      signals[name] = 0;
    }
    binding.observeProperty(signals, name);
  }

  function signalBindings(name) {
    if (signals.hasOwnProperty(name)) {
      signals[name]++;
    }
  }
});;define('aurelia-binding', ['aurelia-binding/aurelia-binding'], function (main) { return main; });

define('aurelia-bootstrapper/aurelia-bootstrapper',['exports', 'aurelia-pal', 'aurelia-pal-browser', 'aurelia-polyfills'], function (exports, _aureliaPal, _aureliaPalBrowser) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.bootstrap = bootstrap;


  var bootstrapQueue = [];
  var sharedLoader = null;
  var Aurelia = null;

  function onBootstrap(callback) {
    return new Promise(function (resolve, reject) {
      if (sharedLoader) {
        resolve(callback(sharedLoader));
      } else {
        bootstrapQueue.push(function () {
          try {
            resolve(callback(sharedLoader));
          } catch (e) {
            reject(e);
          }
        });
      }
    });
  }

  function ready(global) {
    return new Promise(function (resolve, reject) {
      if (global.document.readyState === 'complete') {
        resolve(global.document);
      } else {
        global.document.addEventListener('DOMContentLoaded', completed);
        global.addEventListener('load', completed);
      }

      function completed() {
        global.document.removeEventListener('DOMContentLoaded', completed);
        global.removeEventListener('load', completed);
        resolve(global.document);
      }
    });
  }

  function createLoader() {
    if (_aureliaPal.PLATFORM.Loader) {
      return Promise.resolve(new _aureliaPal.PLATFORM.Loader());
    }

    if (window.System && typeof window.System.import === 'function') {
      return System.normalize('aurelia-bootstrapper').then(function (bootstrapperName) {
        return System.normalize('aurelia-loader-default', bootstrapperName);
      }).then(function (loaderName) {
        return System.import(loaderName).then(function (m) {
          return new m.DefaultLoader();
        });
      });
    }

    if (typeof window.require === 'function') {
      return new Promise(function (resolve, reject) {
        return require(['aurelia-loader-default'], function (m) {
          return resolve(new m.DefaultLoader());
        }, reject);
      });
    }

    return Promise.reject('No PLATFORM.Loader is defined and there is neither a System API (ES6) or a Require API (AMD) globally available to load your app.');
  }

  function preparePlatform(loader) {
    return loader.normalize('aurelia-bootstrapper').then(function (bootstrapperName) {
      return loader.normalize('aurelia-framework', bootstrapperName).then(function (frameworkName) {
        loader.map('aurelia-framework', frameworkName);

        return Promise.all([loader.normalize('aurelia-dependency-injection', frameworkName).then(function (diName) {
          return loader.map('aurelia-dependency-injection', diName);
        }), loader.normalize('aurelia-router', bootstrapperName).then(function (routerName) {
          return loader.map('aurelia-router', routerName);
        }), loader.normalize('aurelia-logging-console', bootstrapperName).then(function (loggingConsoleName) {
          return loader.map('aurelia-logging-console', loggingConsoleName);
        })]).then(function () {
          return loader.loadModule(frameworkName).then(function (m) {
            return Aurelia = m.Aurelia;
          });
        });
      });
    });
  }

  function handleApp(loader, appHost) {
    var moduleId = appHost.getAttribute('aurelia-app') || appHost.getAttribute('data-aurelia-app');
    return config(loader, appHost, moduleId);
  }

  function config(loader, appHost, configModuleId) {
    var aurelia = new Aurelia(loader);
    aurelia.host = appHost;
    aurelia.configModuleId = configModuleId || null;

    if (configModuleId) {
      return loader.loadModule(configModuleId).then(function (customConfig) {
        if (!customConfig.configure) {
          throw new Error("Cannot initialize module '" + configModuleId + "' without a configure function.");
        }

        customConfig.configure(aurelia);
      });
    }

    aurelia.use.standardConfiguration().developmentLogging();

    return aurelia.start().then(function () {
      return aurelia.setRoot();
    });
  }

  function run() {
    return ready(window).then(function (doc) {
      (0, _aureliaPalBrowser.initialize)();

      var appHost = doc.querySelectorAll('[aurelia-app],[data-aurelia-app]');
      return createLoader().then(function (loader) {
        return preparePlatform(loader).then(function () {
          for (var i = 0, ii = appHost.length; i < ii; ++i) {
            handleApp(loader, appHost[i]).catch(console.error.bind(console));
          }

          sharedLoader = loader;
          for (var _i = 0, _ii = bootstrapQueue.length; _i < _ii; ++_i) {
            bootstrapQueue[_i]();
          }
          bootstrapQueue = null;
        });
      });
    });
  }

  function bootstrap(configure) {
    return onBootstrap(function (loader) {
      var aurelia = new Aurelia(loader);
      return configure(aurelia);
    });
  }

  run();
});;define('aurelia-bootstrapper', ['aurelia-bootstrapper/aurelia-bootstrapper'], function (main) { return main; });

define('aurelia-dependency-injection', ['exports', 'aurelia-metadata', 'aurelia-pal'], function (exports, aureliaMetadata, aureliaPal) { 'use strict';

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */

  function __decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  function __metadata(metadataKey, metadataValue) {
      if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
  }

  function isInjectable(potentialTarget) {
      return !!potentialTarget;
  }
  function autoinject(potentialTarget) {
      var deco = function (target) {
          if (!target.hasOwnProperty('inject')) {
              target.inject = (aureliaMetadata.metadata.getOwn(aureliaMetadata.metadata.paramTypes, target) ||
                  _emptyParameters).slice();
              if (target.inject && target.inject.length > 0) {
                  if (target.inject[target.inject.length - 1] === Object) {
                      target.inject.splice(-1, 1);
                  }
              }
          }
      };
      if (isInjectable(potentialTarget)) {
          return deco(potentialTarget);
      }
      return deco;
  }
  function inject() {
      var rest = [];
      for (var _i = 0; _i < arguments.length; _i++) {
          rest[_i] = arguments[_i];
      }
      return function (target, _key, descriptor) {
          if (typeof descriptor === 'number') {
              autoinject(target);
              if (rest.length === 1) {
                  target.inject[descriptor] = rest[0];
              }
              return;
          }
          if (descriptor) {
              var fn = descriptor.value;
              fn.inject = rest;
          }
          else {
              target.inject = rest;
          }
      };
  }

  var resolver = aureliaMetadata.protocol.create('aurelia:resolver', function (target) {
      if (!(typeof target.get === 'function')) {
          return 'Resolvers must implement: get(container: Container, key: any): any';
      }
      return true;
  });
  function isStrategy(actual, expected, state) {
      return actual === expected;
  }
  var StrategyResolver = (function () {
      function StrategyResolver(strategy, state) {
          this.strategy = strategy;
          this.state = state;
      }
      StrategyResolver.prototype.get = function (container, key) {
          if (isStrategy(this.strategy, 0, this.state)) {
              return this.state;
          }
          if (isStrategy(this.strategy, 1, this.state)) {
              var singleton = container.invoke(this.state);
              this.state = singleton;
              this.strategy = 0;
              return singleton;
          }
          if (isStrategy(this.strategy, 2, this.state)) {
              return container.invoke(this.state);
          }
          if (isStrategy(this.strategy, 3, this.state)) {
              return this.state(container, key, this);
          }
          if (isStrategy(this.strategy, 4, this.state)) {
              return this.state[0].get(container, key);
          }
          if (isStrategy(this.strategy, 5, this.state)) {
              return container.get(this.state);
          }
          throw new Error('Invalid strategy: ' + this.strategy);
      };
      StrategyResolver = __decorate([
          resolver(),
          __metadata("design:paramtypes", [Number, Object])
      ], StrategyResolver);
      return StrategyResolver;
  }());
  var Lazy = (function () {
      function Lazy(key) {
          this._key = key;
      }
      Lazy_1 = Lazy;
      Lazy.prototype.get = function (container) {
          var _this = this;
          return function () { return container.get(_this._key); };
      };
      Lazy.of = function (key) {
          return new Lazy_1(key);
      };
      var Lazy_1;
      Lazy = Lazy_1 = __decorate([
          resolver(),
          __metadata("design:paramtypes", [Object])
      ], Lazy);
      return Lazy;
  }());
  var All = (function () {
      function All(key) {
          this._key = key;
      }
      All_1 = All;
      All.prototype.get = function (container) {
          return container.getAll(this._key);
      };
      All.of = function (key) {
          return new All_1(key);
      };
      var All_1;
      All = All_1 = __decorate([
          resolver(),
          __metadata("design:paramtypes", [Object])
      ], All);
      return All;
  }());
  var Optional = (function () {
      function Optional(key, checkParent) {
          if (checkParent === void 0) { checkParent = true; }
          this._key = key;
          this._checkParent = checkParent;
      }
      Optional_1 = Optional;
      Optional.prototype.get = function (container) {
          if (container.hasResolver(this._key, this._checkParent)) {
              return container.get(this._key);
          }
          return null;
      };
      Optional.of = function (key, checkParent) {
          if (checkParent === void 0) { checkParent = true; }
          return new Optional_1(key, checkParent);
      };
      var Optional_1;
      Optional = Optional_1 = __decorate([
          resolver(),
          __metadata("design:paramtypes", [Object, Boolean])
      ], Optional);
      return Optional;
  }());
  var Parent = (function () {
      function Parent(key) {
          this._key = key;
      }
      Parent_1 = Parent;
      Parent.prototype.get = function (container) {
          return container.parent ? container.parent.get(this._key) : null;
      };
      Parent.of = function (key) {
          return new Parent_1(key);
      };
      var Parent_1;
      Parent = Parent_1 = __decorate([
          resolver(),
          __metadata("design:paramtypes", [Object])
      ], Parent);
      return Parent;
  }());
  var Factory = (function () {
      function Factory(key) {
          this._key = key;
      }
      Factory_1 = Factory;
      Factory.prototype.get = function (container) {
          var fn = this._key;
          var resolver = container.getResolver(fn);
          if (resolver && resolver.strategy === 3) {
              fn = resolver.state;
          }
          return function () {
              var rest = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  rest[_i] = arguments[_i];
              }
              return container.invoke(fn, rest);
          };
      };
      Factory.of = function (key) {
          return new Factory_1(key);
      };
      var Factory_1;
      Factory = Factory_1 = __decorate([
          resolver(),
          __metadata("design:paramtypes", [Object])
      ], Factory);
      return Factory;
  }());
  var NewInstance = (function () {
      function NewInstance(key) {
          var dynamicDependencies = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              dynamicDependencies[_i - 1] = arguments[_i];
          }
          this.key = key;
          this.asKey = key;
          this.dynamicDependencies = dynamicDependencies;
      }
      NewInstance_1 = NewInstance;
      NewInstance.prototype.get = function (container) {
          var dynamicDependencies = this.dynamicDependencies.length > 0
              ? this.dynamicDependencies.map(function (dependency) {
                  return dependency['protocol:aurelia:resolver']
                      ? dependency.get(container)
                      : container.get(dependency);
              })
              : undefined;
          var fn = this.key;
          var resolver = container.getResolver(fn);
          if (resolver && resolver.strategy === 3) {
              fn = resolver.state;
          }
          var instance = container.invoke(fn, dynamicDependencies);
          container.registerInstance(this.asKey, instance);
          return instance;
      };
      NewInstance.prototype.as = function (key) {
          this.asKey = key;
          return this;
      };
      NewInstance.of = function (key) {
          var dynamicDependencies = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              dynamicDependencies[_i - 1] = arguments[_i];
          }
          return new (NewInstance_1.bind.apply(NewInstance_1, [void 0, key].concat(dynamicDependencies)))();
      };
      var NewInstance_1;
      NewInstance = NewInstance_1 = __decorate([
          resolver(),
          __metadata("design:paramtypes", [Object, Object])
      ], NewInstance);
      return NewInstance;
  }());
  function getDecoratorDependencies(target) {
      autoinject(target);
      return target.inject;
  }
  function lazy(keyValue) {
      return function (target, _key, index) {
          var inject$$1 = getDecoratorDependencies(target);
          inject$$1[index] = Lazy.of(keyValue);
      };
  }
  function all(keyValue) {
      return function (target, _key, index) {
          var inject$$1 = getDecoratorDependencies(target);
          inject$$1[index] = All.of(keyValue);
      };
  }
  function optional(checkParentOrTarget) {
      if (checkParentOrTarget === void 0) { checkParentOrTarget = true; }
      var deco = function (checkParent) {
          return function (target, _key, index) {
              var inject$$1 = getDecoratorDependencies(target);
              inject$$1[index] = Optional.of(inject$$1[index], checkParent);
          };
      };
      if (typeof checkParentOrTarget === 'boolean') {
          return deco(checkParentOrTarget);
      }
      return deco(true);
  }
  function parent(target, _key, index) {
      var inject$$1 = getDecoratorDependencies(target);
      inject$$1[index] = Parent.of(inject$$1[index]);
  }
  function factory(keyValue) {
      return function (target, _key, index) {
          var inject$$1 = getDecoratorDependencies(target);
          inject$$1[index] = Factory.of(keyValue);
      };
  }
  function newInstance(asKeyOrTarget) {
      var dynamicDependencies = [];
      for (var _i = 1; _i < arguments.length; _i++) {
          dynamicDependencies[_i - 1] = arguments[_i];
      }
      var deco = function (asKey) {
          return function (target, _key, index) {
              var inject$$1 = getDecoratorDependencies(target);
              inject$$1[index] = NewInstance.of.apply(NewInstance, [inject$$1[index]].concat(dynamicDependencies));
              if (!!asKey) {
                  inject$$1[index].as(asKey);
              }
          };
      };
      if (arguments.length >= 1) {
          return deco(asKeyOrTarget);
      }
      return deco();
  }

  function validateKey(key) {
      if (key === null || key === undefined) {
          throw new Error('key/value cannot be null or undefined. Are you trying to inject/register something that doesn\'t exist with DI?');
      }
  }
  var _emptyParameters = Object.freeze([]);
  aureliaMetadata.metadata.registration = 'aurelia:registration';
  aureliaMetadata.metadata.invoker = 'aurelia:invoker';
  var resolverDecorates = resolver.decorates;
  var InvocationHandler = (function () {
      function InvocationHandler(fn, invoker, dependencies) {
          this.fn = fn;
          this.invoker = invoker;
          this.dependencies = dependencies;
      }
      InvocationHandler.prototype.invoke = function (container, dynamicDependencies) {
          return dynamicDependencies !== undefined
              ? this.invoker.invokeWithDynamicDependencies(container, this.fn, this.dependencies, dynamicDependencies)
              : this.invoker.invoke(container, this.fn, this.dependencies);
      };
      return InvocationHandler;
  }());
  function invokeWithDynamicDependencies(container, fn, staticDependencies, dynamicDependencies) {
      var i = staticDependencies.length;
      var args = new Array(i);
      var lookup;
      while (i--) {
          lookup = staticDependencies[i];
          if (lookup === null || lookup === undefined) {
              throw new Error('Constructor Parameter with index ' +
                  i +
                  ' cannot be null or undefined. Are you trying to inject/register something that doesn\'t exist with DI?');
          }
          else {
              args[i] = container.get(lookup);
          }
      }
      if (dynamicDependencies !== undefined) {
          args = args.concat(dynamicDependencies);
      }
      return Reflect.construct(fn, args);
  }
  var classInvoker = {
      invoke: function (container, Type, deps) {
          var instances = deps.map(function (dep) { return container.get(dep); });
          return Reflect.construct(Type, instances);
      },
      invokeWithDynamicDependencies: invokeWithDynamicDependencies
  };
  function getDependencies(f) {
      if (!f.hasOwnProperty('inject')) {
          return [];
      }
      if (typeof f.inject === 'function') {
          return f.inject();
      }
      return f.inject;
  }
  var Container = (function () {
      function Container(configuration) {
          if (configuration === undefined) {
              configuration = {};
          }
          this._configuration = configuration;
          this._onHandlerCreated = configuration.onHandlerCreated;
          this._handlers =
              configuration.handlers || (configuration.handlers = new Map());
          this._resolvers = new Map();
          this.root = this;
          this.parent = null;
      }
      Container.prototype.makeGlobal = function () {
          Container.instance = this;
          return this;
      };
      Container.prototype.setHandlerCreatedCallback = function (onHandlerCreated) {
          this._onHandlerCreated = onHandlerCreated;
          this._configuration.onHandlerCreated = onHandlerCreated;
      };
      Container.prototype.registerInstance = function (key, instance) {
          return this.registerResolver(key, new StrategyResolver(0, instance === undefined ? key : instance));
      };
      Container.prototype.registerSingleton = function (key, fn) {
          return this.registerResolver(key, new StrategyResolver(1, fn === undefined ? key : fn));
      };
      Container.prototype.registerTransient = function (key, fn) {
          return this.registerResolver(key, new StrategyResolver(2, fn === undefined ? key : fn));
      };
      Container.prototype.registerHandler = function (key, handler) {
          return this.registerResolver(key, new StrategyResolver(3, handler));
      };
      Container.prototype.registerAlias = function (originalKey, aliasKey) {
          return this.registerResolver(aliasKey, new StrategyResolver(5, originalKey));
      };
      Container.prototype.registerResolver = function (key, resolver$$1) {
          validateKey(key);
          var allResolvers = this._resolvers;
          var result = allResolvers.get(key);
          if (result === undefined) {
              allResolvers.set(key, resolver$$1);
          }
          else if (result.strategy === 4) {
              result.state.push(resolver$$1);
          }
          else {
              allResolvers.set(key, new StrategyResolver(4, [result, resolver$$1]));
          }
          return resolver$$1;
      };
      Container.prototype.autoRegister = function (key, fn) {
          fn = fn === undefined ? key : fn;
          if (typeof fn === 'function') {
              var registration = aureliaMetadata.metadata.get(aureliaMetadata.metadata.registration, fn);
              if (registration === undefined) {
                  return this.registerResolver(key, new StrategyResolver(1, fn));
              }
              return registration.registerResolver(this, key, fn);
          }
          return this.registerResolver(key, new StrategyResolver(0, fn));
      };
      Container.prototype.autoRegisterAll = function (fns) {
          var i = fns.length;
          while (i--) {
              this.autoRegister(fns[i]);
          }
      };
      Container.prototype.unregister = function (key) {
          this._resolvers.delete(key);
      };
      Container.prototype.hasResolver = function (key, checkParent) {
          if (checkParent === void 0) { checkParent = false; }
          validateKey(key);
          return (this._resolvers.has(key) ||
              (checkParent &&
                  this.parent !== null &&
                  this.parent.hasResolver(key, checkParent)));
      };
      Container.prototype.getResolver = function (key) {
          return this._resolvers.get(key);
      };
      Container.prototype.get = function (key) {
          validateKey(key);
          if (key === Container) {
              return this;
          }
          if (resolverDecorates(key)) {
              return key.get(this, key);
          }
          var resolver$$1 = this._resolvers.get(key);
          if (resolver$$1 === undefined) {
              if (this.parent === null) {
                  return this.autoRegister(key).get(this, key);
              }
              var registration = aureliaMetadata.metadata.get(aureliaMetadata.metadata.registration, key);
              if (registration === undefined) {
                  return this.parent._get(key);
              }
              return registration.registerResolver(this, key, key).get(this, key);
          }
          return resolver$$1.get(this, key);
      };
      Container.prototype._get = function (key) {
          var resolver$$1 = this._resolvers.get(key);
          if (resolver$$1 === undefined) {
              if (this.parent === null) {
                  return this.autoRegister(key).get(this, key);
              }
              return this.parent._get(key);
          }
          return resolver$$1.get(this, key);
      };
      Container.prototype.getAll = function (key) {
          validateKey(key);
          var resolver$$1 = this._resolvers.get(key);
          if (resolver$$1 === undefined) {
              if (this.parent === null) {
                  return _emptyParameters;
              }
              return this.parent.getAll(key);
          }
          if (resolver$$1.strategy === 4) {
              var state = resolver$$1.state;
              var i = state.length;
              var results = new Array(i);
              while (i--) {
                  results[i] = state[i].get(this, key);
              }
              return results;
          }
          return [resolver$$1.get(this, key)];
      };
      Container.prototype.createChild = function () {
          var child = new Container(this._configuration);
          child.root = this.root;
          child.parent = this;
          return child;
      };
      Container.prototype.invoke = function (fn, dynamicDependencies) {
          try {
              var handler = this._handlers.get(fn);
              if (handler === undefined) {
                  handler = this._createInvocationHandler(fn);
                  this._handlers.set(fn, handler);
              }
              return handler.invoke(this, dynamicDependencies);
          }
          catch (e) {
              throw new aureliaPal.AggregateError("Error invoking " + fn.name + ". Check the inner error for details.", e, true);
          }
      };
      Container.prototype._createInvocationHandler = function (fn) {
          var dependencies;
          if (fn.inject === undefined) {
              dependencies =
                  aureliaMetadata.metadata.getOwn(aureliaMetadata.metadata.paramTypes, fn) || _emptyParameters;
          }
          else {
              dependencies = [];
              var ctor = fn;
              while (typeof ctor === 'function') {
                  dependencies.push.apply(dependencies, getDependencies(ctor));
                  ctor = Object.getPrototypeOf(ctor);
              }
          }
          var invoker = aureliaMetadata.metadata.getOwn(aureliaMetadata.metadata.invoker, fn) || classInvoker;
          var handler = new InvocationHandler(fn, invoker, dependencies);
          return this._onHandlerCreated !== undefined
              ? this._onHandlerCreated(handler)
              : handler;
      };
      return Container;
  }());

  function invoker(value) {
      return function (target) {
          aureliaMetadata.metadata.define(aureliaMetadata.metadata.invoker, value, target);
      };
  }
  function invokeAsFactory(potentialTarget) {
      var deco = function (target) {
          aureliaMetadata.metadata.define(aureliaMetadata.metadata.invoker, FactoryInvoker.instance, target);
      };
      return potentialTarget ? deco(potentialTarget) : deco;
  }
  var FactoryInvoker = (function () {
      function FactoryInvoker() {
      }
      FactoryInvoker.prototype.invoke = function (container, fn, dependencies) {
          var i = dependencies.length;
          var args = new Array(i);
          while (i--) {
              args[i] = container.get(dependencies[i]);
          }
          return fn.apply(undefined, args);
      };
      FactoryInvoker.prototype.invokeWithDynamicDependencies = function (container, fn, staticDependencies, dynamicDependencies) {
          var i = staticDependencies.length;
          var args = new Array(i);
          while (i--) {
              args[i] = container.get(staticDependencies[i]);
          }
          if (dynamicDependencies !== undefined) {
              args = args.concat(dynamicDependencies);
          }
          return fn.apply(undefined, args);
      };
      return FactoryInvoker;
  }());
  FactoryInvoker.instance = new FactoryInvoker();

  function registration(value) {
      return function (target) {
          aureliaMetadata.metadata.define(aureliaMetadata.metadata.registration, value, target);
      };
  }
  function transient(key) {
      return registration(new TransientRegistration(key));
  }
  function singleton(keyOrRegisterInChild, registerInChild) {
      if (registerInChild === void 0) { registerInChild = false; }
      return registration(new SingletonRegistration(keyOrRegisterInChild, registerInChild));
  }
  var TransientRegistration = (function () {
      function TransientRegistration(key) {
          this._key = key;
      }
      TransientRegistration.prototype.registerResolver = function (container, key, fn) {
          var existingResolver = container.getResolver(this._key || key);
          return existingResolver === undefined
              ? container.registerTransient((this._key || key), fn)
              : existingResolver;
      };
      return TransientRegistration;
  }());
  var SingletonRegistration = (function () {
      function SingletonRegistration(keyOrRegisterInChild, registerInChild) {
          if (registerInChild === void 0) { registerInChild = false; }
          if (typeof keyOrRegisterInChild === 'boolean') {
              this._registerInChild = keyOrRegisterInChild;
          }
          else {
              this._key = keyOrRegisterInChild;
              this._registerInChild = registerInChild;
          }
      }
      SingletonRegistration.prototype.registerResolver = function (container, key, fn) {
          var targetContainer = this._registerInChild ? container : container.root;
          var existingResolver = targetContainer.getResolver(this._key || key);
          return existingResolver === undefined
              ? targetContainer.registerSingleton(this._key || key, fn)
              : existingResolver;
      };
      return SingletonRegistration;
  }());

  exports._emptyParameters = _emptyParameters;
  exports.InvocationHandler = InvocationHandler;
  exports.Container = Container;
  exports.autoinject = autoinject;
  exports.inject = inject;
  exports.invoker = invoker;
  exports.invokeAsFactory = invokeAsFactory;
  exports.FactoryInvoker = FactoryInvoker;
  exports.registration = registration;
  exports.transient = transient;
  exports.singleton = singleton;
  exports.TransientRegistration = TransientRegistration;
  exports.SingletonRegistration = SingletonRegistration;
  exports.resolver = resolver;
  exports.StrategyResolver = StrategyResolver;
  exports.Lazy = Lazy;
  exports.All = All;
  exports.Optional = Optional;
  exports.Parent = Parent;
  exports.Factory = Factory;
  exports.NewInstance = NewInstance;
  exports.getDecoratorDependencies = getDecoratorDependencies;
  exports.lazy = lazy;
  exports.all = all;
  exports.optional = optional;
  exports.parent = parent;
  exports.factory = factory;
  exports.newInstance = newInstance;

  Object.defineProperty(exports, '__esModule', { value: true });

});

define("aurelia-dependency-injection/aurelia-dependency-injection", [],function(){});

define('aurelia-event-aggregator/aurelia-event-aggregator',['exports', 'aurelia-logging'], function (exports, _aureliaLogging) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.EventAggregator = undefined;
  exports.includeEventsIn = includeEventsIn;
  exports.configure = configure;

  var LogManager = _interopRequireWildcard(_aureliaLogging);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }



  var logger = LogManager.getLogger('event-aggregator');

  var Handler = function () {
    function Handler(messageType, callback) {


      this.messageType = messageType;
      this.callback = callback;
    }

    Handler.prototype.handle = function handle(message) {
      if (message instanceof this.messageType) {
        this.callback.call(null, message);
      }
    };

    return Handler;
  }();

  function invokeCallback(callback, data, event) {
    try {
      callback(data, event);
    } catch (e) {
      logger.error(e);
    }
  }

  function invokeHandler(handler, data) {
    try {
      handler.handle(data);
    } catch (e) {
      logger.error(e);
    }
  }

  var EventAggregator = exports.EventAggregator = function () {
    function EventAggregator() {


      this.eventLookup = {};
      this.messageHandlers = [];
    }

    EventAggregator.prototype.publish = function publish(event, data) {
      var subscribers = void 0;
      var i = void 0;

      if (!event) {
        throw new Error('Event was invalid.');
      }

      if (typeof event === 'string') {
        subscribers = this.eventLookup[event];
        if (subscribers) {
          subscribers = subscribers.slice();
          i = subscribers.length;

          while (i--) {
            invokeCallback(subscribers[i], data, event);
          }
        }
      } else {
        subscribers = this.messageHandlers.slice();
        i = subscribers.length;

        while (i--) {
          invokeHandler(subscribers[i], event);
        }
      }
    };

    EventAggregator.prototype.subscribe = function subscribe(event, callback) {
      var handler = void 0;
      var subscribers = void 0;

      if (!event) {
        throw new Error('Event channel/type was invalid.');
      }

      if (typeof event === 'string') {
        handler = callback;
        subscribers = this.eventLookup[event] || (this.eventLookup[event] = []);
      } else {
        handler = new Handler(event, callback);
        subscribers = this.messageHandlers;
      }

      subscribers.push(handler);

      return {
        dispose: function dispose() {
          var idx = subscribers.indexOf(handler);
          if (idx !== -1) {
            subscribers.splice(idx, 1);
          }
        }
      };
    };

    EventAggregator.prototype.subscribeOnce = function subscribeOnce(event, callback) {
      var sub = this.subscribe(event, function (a, b) {
        sub.dispose();
        return callback(a, b);
      });

      return sub;
    };

    return EventAggregator;
  }();

  function includeEventsIn(obj) {
    var ea = new EventAggregator();

    obj.subscribeOnce = function (event, callback) {
      return ea.subscribeOnce(event, callback);
    };

    obj.subscribe = function (event, callback) {
      return ea.subscribe(event, callback);
    };

    obj.publish = function (event, data) {
      ea.publish(event, data);
    };

    return ea;
  }

  function configure(config) {
    config.instance(EventAggregator, includeEventsIn(config.aurelia));
  }
});;define('aurelia-event-aggregator', ['aurelia-event-aggregator/aurelia-event-aggregator'], function (main) { return main; });

define('aurelia-framework/aurelia-framework',['exports', 'aurelia-dependency-injection', 'aurelia-binding', 'aurelia-metadata', 'aurelia-templating', 'aurelia-loader', 'aurelia-task-queue', 'aurelia-path', 'aurelia-pal', 'aurelia-logging'], function (exports, _aureliaDependencyInjection, _aureliaBinding, _aureliaMetadata, _aureliaTemplating, _aureliaLoader, _aureliaTaskQueue, _aureliaPath, _aureliaPal, _aureliaLogging) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.LogManager = exports.FrameworkConfiguration = exports.Aurelia = undefined;
  Object.keys(_aureliaDependencyInjection).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaDependencyInjection[key];
      }
    });
  });
  Object.keys(_aureliaBinding).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaBinding[key];
      }
    });
  });
  Object.keys(_aureliaMetadata).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaMetadata[key];
      }
    });
  });
  Object.keys(_aureliaTemplating).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaTemplating[key];
      }
    });
  });
  Object.keys(_aureliaLoader).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaLoader[key];
      }
    });
  });
  Object.keys(_aureliaTaskQueue).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaTaskQueue[key];
      }
    });
  });
  Object.keys(_aureliaPath).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaPath[key];
      }
    });
  });
  Object.keys(_aureliaPal).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaPal[key];
      }
    });
  });

  var TheLogManager = _interopRequireWildcard(_aureliaLogging);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };



  function preventActionlessFormSubmit() {
    _aureliaPal.DOM.addEventListener('submit', function (evt) {
      var target = evt.target;
      var action = target.action;

      if (target.tagName.toLowerCase() === 'form' && !action) {
        evt.preventDefault();
      }
    });
  }

  var Aurelia = exports.Aurelia = function () {
    function Aurelia(loader, container, resources) {


      this.loader = loader || new _aureliaPal.PLATFORM.Loader();
      this.container = container || new _aureliaDependencyInjection.Container().makeGlobal();
      this.resources = resources || new _aureliaTemplating.ViewResources();
      this.use = new FrameworkConfiguration(this);
      this.logger = TheLogManager.getLogger('aurelia');
      this.hostConfigured = false;
      this.host = null;

      this.use.instance(Aurelia, this);
      this.use.instance(_aureliaLoader.Loader, this.loader);
      this.use.instance(_aureliaTemplating.ViewResources, this.resources);
    }

    Aurelia.prototype.start = function start() {
      var _this = this;

      if (this._started) {
        return this._started;
      }

      this.logger.info('Aurelia Starting');
      return this._started = this.use.apply().then(function () {
        preventActionlessFormSubmit();

        if (!_this.container.hasResolver(_aureliaTemplating.BindingLanguage)) {
          var message = 'You must configure Aurelia with a BindingLanguage implementation.';
          _this.logger.error(message);
          throw new Error(message);
        }

        _this.logger.info('Aurelia Started');
        var evt = _aureliaPal.DOM.createCustomEvent('aurelia-started', { bubbles: true, cancelable: true });
        _aureliaPal.DOM.dispatchEvent(evt);
        return _this;
      });
    };

    Aurelia.prototype.enhance = function enhance() {
      var _this2 = this;

      var bindingContext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var applicationHost = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      this._configureHost(applicationHost || _aureliaPal.DOM.querySelectorAll('body')[0]);

      return new Promise(function (resolve) {
        var engine = _this2.container.get(_aureliaTemplating.TemplatingEngine);
        _this2.root = engine.enhance({ container: _this2.container, element: _this2.host, resources: _this2.resources, bindingContext: bindingContext });
        _this2.root.attached();
        _this2._onAureliaComposed();
        resolve(_this2);
      });
    };

    Aurelia.prototype.setRoot = function setRoot() {
      var _this3 = this;

      var root = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var applicationHost = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var instruction = {};

      if (this.root && this.root.viewModel && this.root.viewModel.router) {
        this.root.viewModel.router.deactivate();
        this.root.viewModel.router.reset();
      }

      this._configureHost(applicationHost);

      var engine = this.container.get(_aureliaTemplating.TemplatingEngine);
      var transaction = this.container.get(_aureliaTemplating.CompositionTransaction);
      delete transaction.initialComposition;

      if (!root) {
        if (this.configModuleId) {
          root = (0, _aureliaPath.relativeToFile)('./app', this.configModuleId);
        } else {
          root = 'app';
        }
      }

      instruction.viewModel = root;
      instruction.container = instruction.childContainer = this.container;
      instruction.viewSlot = this.hostSlot;
      instruction.host = this.host;

      return engine.compose(instruction).then(function (r) {
        _this3.root = r;
        instruction.viewSlot.attached();
        _this3._onAureliaComposed();
        return _this3;
      });
    };

    Aurelia.prototype._configureHost = function _configureHost(applicationHost) {
      if (this.hostConfigured) {
        return;
      }
      applicationHost = applicationHost || this.host;

      if (!applicationHost || typeof applicationHost === 'string') {
        this.host = _aureliaPal.DOM.getElementById(applicationHost || 'applicationHost');
      } else {
        this.host = applicationHost;
      }

      if (!this.host) {
        throw new Error('No applicationHost was specified.');
      }

      this.hostConfigured = true;
      this.host.aurelia = this;
      this.hostSlot = new _aureliaTemplating.ViewSlot(this.host, true);
      this.hostSlot.transformChildNodesIntoView();
      this.container.registerInstance(_aureliaPal.DOM.boundary, this.host);
    };

    Aurelia.prototype._onAureliaComposed = function _onAureliaComposed() {
      var evt = _aureliaPal.DOM.createCustomEvent('aurelia-composed', { bubbles: true, cancelable: true });
      setTimeout(function () {
        return _aureliaPal.DOM.dispatchEvent(evt);
      }, 1);
    };

    return Aurelia;
  }();

  var logger = TheLogManager.getLogger('aurelia');
  var extPattern = /\.[^/.]+$/;

  function runTasks(config, tasks) {
    var current = void 0;
    var next = function next() {
      current = tasks.shift();
      if (current) {
        return Promise.resolve(current(config)).then(next);
      }

      return Promise.resolve();
    };

    return next();
  }

  function loadPlugin(fwConfig, loader, info) {
    logger.debug('Loading plugin ' + info.moduleId + '.');
    if (typeof info.moduleId === 'string') {
      fwConfig.resourcesRelativeTo = info.resourcesRelativeTo;

      var id = info.moduleId;

      if (info.resourcesRelativeTo.length > 1) {
        return loader.normalize(info.moduleId, info.resourcesRelativeTo[1]).then(function (normalizedId) {
          return _loadPlugin(normalizedId);
        });
      }

      return _loadPlugin(id);
    } else if (typeof info.configure === 'function') {
      if (fwConfig.configuredPlugins.indexOf(info.configure) !== -1) {
        return Promise.resolve();
      }
      fwConfig.configuredPlugins.push(info.configure);

      return Promise.resolve(info.configure.call(null, fwConfig, info.config || {}));
    }
    throw new Error(invalidConfigMsg(info.moduleId || info.configure, 'plugin'));

    function _loadPlugin(moduleId) {
      return loader.loadModule(moduleId).then(function (m) {
        if ('configure' in m) {
          if (fwConfig.configuredPlugins.indexOf(m.configure) !== -1) {
            return Promise.resolve();
          }
          return Promise.resolve(m.configure(fwConfig, info.config || {})).then(function () {
            fwConfig.configuredPlugins.push(m.configure);
            fwConfig.resourcesRelativeTo = null;
            logger.debug('Configured plugin ' + info.moduleId + '.');
          });
        }

        fwConfig.resourcesRelativeTo = null;
        logger.debug('Loaded plugin ' + info.moduleId + '.');
      });
    }
  }

  function loadResources(aurelia, resourcesToLoad, appResources) {
    if (Object.keys(resourcesToLoad).length === 0) {
      return Promise.resolve();
    }
    var viewEngine = aurelia.container.get(_aureliaTemplating.ViewEngine);

    return Promise.all(Object.keys(resourcesToLoad).map(function (n) {
      return _normalize(resourcesToLoad[n]);
    })).then(function (loads) {
      var names = [];
      var importIds = [];

      loads.forEach(function (l) {
        names.push(undefined);
        importIds.push(l.importId);
      });

      return viewEngine.importViewResources(importIds, names, appResources);
    });

    function _normalize(load) {
      var moduleId = load.moduleId;
      var ext = getExt(moduleId);

      if (isOtherResource(moduleId)) {
        moduleId = removeExt(moduleId);
      }

      return aurelia.loader.normalize(moduleId, load.relativeTo).then(function (normalized) {
        return {
          name: load.moduleId,
          importId: isOtherResource(load.moduleId) ? addOriginalExt(normalized, ext) : normalized
        };
      });
    }

    function isOtherResource(name) {
      var ext = getExt(name);
      if (!ext) return false;
      if (ext === '') return false;
      if (ext === '.js' || ext === '.ts') return false;
      return true;
    }

    function removeExt(name) {
      return name.replace(extPattern, '');
    }

    function addOriginalExt(normalized, ext) {
      return removeExt(normalized) + '.' + ext;
    }
  }

  function getExt(name) {
    var match = name.match(extPattern);
    if (match && match.length > 0) {
      return match[0].split('.')[1];
    }
  }

  function loadBehaviors(config) {
    return Promise.all(config.behaviorsToLoad.map(function (m) {
      return m.load(config.container, m.target);
    })).then(function () {
      config.behaviorsToLoad = null;
    });
  }

  function assertProcessed(plugins) {
    if (plugins.processed) {
      throw new Error('This config instance has already been applied. To load more plugins or global resources, create a new FrameworkConfiguration instance.');
    }
  }

  function invalidConfigMsg(cfg, type) {
    return 'Invalid ' + type + ' [' + cfg + '], ' + type + ' must be specified as functions or relative module IDs.';
  }

  var FrameworkConfiguration = function () {
    function FrameworkConfiguration(aurelia) {
      var _this4 = this;



      this.aurelia = aurelia;
      this.container = aurelia.container;

      this.info = [];
      this.processed = false;
      this.preTasks = [];
      this.postTasks = [];

      this.behaviorsToLoad = [];

      this.configuredPlugins = [];
      this.resourcesToLoad = {};
      this.preTask(function () {
        return aurelia.loader.normalize('aurelia-bootstrapper').then(function (name) {
          return _this4.bootstrapperName = name;
        });
      });
      this.postTask(function () {
        return loadResources(aurelia, _this4.resourcesToLoad, aurelia.resources);
      });
    }

    FrameworkConfiguration.prototype.instance = function instance(type, _instance) {
      this.container.registerInstance(type, _instance);
      return this;
    };

    FrameworkConfiguration.prototype.singleton = function singleton(type, implementation) {
      this.container.registerSingleton(type, implementation);
      return this;
    };

    FrameworkConfiguration.prototype.transient = function transient(type, implementation) {
      this.container.registerTransient(type, implementation);
      return this;
    };

    FrameworkConfiguration.prototype.preTask = function preTask(task) {
      assertProcessed(this);
      this.preTasks.push(task);
      return this;
    };

    FrameworkConfiguration.prototype.postTask = function postTask(task) {
      assertProcessed(this);
      this.postTasks.push(task);
      return this;
    };

    FrameworkConfiguration.prototype.feature = function feature(plugin) {
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      switch (typeof plugin === 'undefined' ? 'undefined' : _typeof(plugin)) {
        case 'string':
          var hasIndex = /\/index$/i.test(plugin);
          var _moduleId = hasIndex || getExt(plugin) ? plugin : plugin + '/index';
          var root = hasIndex ? plugin.substr(0, plugin.length - 6) : plugin;
          this.info.push({ moduleId: _moduleId, resourcesRelativeTo: [root, ''], config: config });
          break;

        case 'function':
          this.info.push({ configure: plugin, config: config || {} });
          break;
        default:
          throw new Error(invalidConfigMsg(plugin, 'feature'));
      }
      return this;
    };

    FrameworkConfiguration.prototype.globalResources = function globalResources(resources) {
      var _this5 = this;

      assertProcessed(this);

      var toAdd = Array.isArray(resources) ? resources : arguments;
      var resource = void 0;
      var resourcesRelativeTo = this.resourcesRelativeTo || ['', ''];

      for (var i = 0, ii = toAdd.length; i < ii; ++i) {
        resource = toAdd[i];
        switch (typeof resource === 'undefined' ? 'undefined' : _typeof(resource)) {
          case 'string':
            var parent = resourcesRelativeTo[0];
            var grandParent = resourcesRelativeTo[1];
            var name = resource;

            if ((resource.startsWith('./') || resource.startsWith('../')) && parent !== '') {
              name = (0, _aureliaPath.join)(parent, resource);
            }

            this.resourcesToLoad[name] = { moduleId: name, relativeTo: grandParent };
            break;
          case 'function':
            var meta = this.aurelia.resources.autoRegister(this.container, resource);
            if (meta instanceof _aureliaTemplating.HtmlBehaviorResource && meta.elementName !== null) {
              if (this.behaviorsToLoad.push(meta) === 1) {
                this.postTask(function () {
                  return loadBehaviors(_this5);
                });
              }
            }
            break;
          default:
            throw new Error(invalidConfigMsg(resource, 'resource'));
        }
      }

      return this;
    };

    FrameworkConfiguration.prototype.globalName = function globalName(resourcePath, newName) {
      assertProcessed(this);
      this.resourcesToLoad[resourcePath] = { moduleId: newName, relativeTo: '' };
      return this;
    };

    FrameworkConfiguration.prototype.plugin = function plugin(_plugin, pluginConfig) {
      assertProcessed(this);

      var info = void 0;
      switch (typeof _plugin === 'undefined' ? 'undefined' : _typeof(_plugin)) {
        case 'string':
          info = { moduleId: _plugin, resourcesRelativeTo: [_plugin, ''], config: pluginConfig || {} };
          break;
        case 'function':
          info = { configure: _plugin, config: pluginConfig || {} };
          break;
        default:
          throw new Error(invalidConfigMsg(_plugin, 'plugin'));
      }
      this.info.push(info);
      return this;
    };

    FrameworkConfiguration.prototype._addNormalizedPlugin = function _addNormalizedPlugin(name, config) {
      var _this6 = this;

      var plugin = { moduleId: name, resourcesRelativeTo: [name, ''], config: config || {} };
      this.info.push(plugin);

      this.preTask(function () {
        var relativeTo = [name, _this6.bootstrapperName];
        plugin.moduleId = name;
        plugin.resourcesRelativeTo = relativeTo;
        return Promise.resolve();
      });

      return this;
    };

    FrameworkConfiguration.prototype.defaultBindingLanguage = function defaultBindingLanguage() {
      return this._addNormalizedPlugin('aurelia-templating-binding');
    };

    FrameworkConfiguration.prototype.router = function router() {
      return this._addNormalizedPlugin('aurelia-templating-router');
    };

    FrameworkConfiguration.prototype.history = function history() {
      return this._addNormalizedPlugin('aurelia-history-browser');
    };

    FrameworkConfiguration.prototype.defaultResources = function defaultResources() {
      return this._addNormalizedPlugin('aurelia-templating-resources');
    };

    FrameworkConfiguration.prototype.eventAggregator = function eventAggregator() {
      return this._addNormalizedPlugin('aurelia-event-aggregator');
    };

    FrameworkConfiguration.prototype.basicConfiguration = function basicConfiguration() {
      return this.defaultBindingLanguage().defaultResources().eventAggregator();
    };

    FrameworkConfiguration.prototype.standardConfiguration = function standardConfiguration() {
      return this.basicConfiguration().history().router();
    };

    FrameworkConfiguration.prototype.developmentLogging = function developmentLogging(level) {
      var _this7 = this;

      var logLevel = level ? TheLogManager.logLevel[level] : undefined;

      if (logLevel === undefined) {
        logLevel = TheLogManager.logLevel.debug;
      }

      this.preTask(function () {
        return _this7.aurelia.loader.normalize('aurelia-logging-console', _this7.bootstrapperName).then(function (name) {
          return _this7.aurelia.loader.loadModule(name).then(function (m) {
            TheLogManager.addAppender(new m.ConsoleAppender());
            TheLogManager.setLevel(logLevel);
          });
        });
      });

      return this;
    };

    FrameworkConfiguration.prototype.apply = function apply() {
      var _this8 = this;

      if (this.processed) {
        return Promise.resolve();
      }

      return runTasks(this, this.preTasks).then(function () {
        var loader = _this8.aurelia.loader;
        var info = _this8.info;
        var current = void 0;

        var next = function next() {
          current = info.shift();
          if (current) {
            return loadPlugin(_this8, loader, current).then(next);
          }

          _this8.processed = true;
          _this8.configuredPlugins = null;
          return Promise.resolve();
        };

        return next().then(function () {
          return runTasks(_this8, _this8.postTasks);
        });
      });
    };

    return FrameworkConfiguration;
  }();

  exports.FrameworkConfiguration = FrameworkConfiguration;
  var LogManager = exports.LogManager = TheLogManager;
});;define('aurelia-framework', ['aurelia-framework/aurelia-framework'], function (main) { return main; });

define('aurelia-history/aurelia-history',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });



  function mi(name) {
    throw new Error('History must implement ' + name + '().');
  }

  var History = exports.History = function () {
    function History() {

    }

    History.prototype.activate = function activate(options) {
      mi('activate');
    };

    History.prototype.deactivate = function deactivate() {
      mi('deactivate');
    };

    History.prototype.getAbsoluteRoot = function getAbsoluteRoot() {
      mi('getAbsoluteRoot');
    };

    History.prototype.navigate = function navigate(fragment, options) {
      mi('navigate');
    };

    History.prototype.navigateBack = function navigateBack() {
      mi('navigateBack');
    };

    History.prototype.setTitle = function setTitle(title) {
      mi('setTitle');
    };

    History.prototype.setState = function setState(key, value) {
      mi('setState');
    };

    History.prototype.getState = function getState(key) {
      mi('getState');
    };

    History.prototype.getHistoryIndex = function getHistoryIndex() {
      mi('getHistoryIndex');
    };

    History.prototype.go = function go(movement) {
      mi('go');
    };

    return History;
  }();
});;define('aurelia-history', ['aurelia-history/aurelia-history'], function (main) { return main; });

define('aurelia-history-browser/aurelia-history-browser',['exports', 'aurelia-history', 'aurelia-pal'], function (exports, aureliaHistory, aureliaPal) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var LinkHandler = (function () {
        function LinkHandler() {
        }
        LinkHandler.prototype.activate = function (history) { };
        LinkHandler.prototype.deactivate = function () { };
        return LinkHandler;
    }());
    var DefaultLinkHandler = (function (_super) {
        __extends(DefaultLinkHandler, _super);
        function DefaultLinkHandler() {
            var _this = _super.call(this) || this;
            _this.handler = function (e) {
                var _a = DefaultLinkHandler.getEventInfo(e), shouldHandleEvent = _a.shouldHandleEvent, href = _a.href;
                if (shouldHandleEvent) {
                    e.preventDefault();
                    _this.history.navigate(href);
                }
            };
            return _this;
        }
        DefaultLinkHandler.prototype.activate = function (history) {
            if (history._hasPushState) {
                this.history = history;
                aureliaPal.DOM.addEventListener('click', this.handler, true);
            }
        };
        DefaultLinkHandler.prototype.deactivate = function () {
            aureliaPal.DOM.removeEventListener('click', this.handler, true);
        };
        DefaultLinkHandler.getEventInfo = function (event) {
            var $event = event;
            var info = {
                shouldHandleEvent: false,
                href: null,
                anchor: null
            };
            var target = DefaultLinkHandler.findClosestAnchor($event.target);
            if (!target || !DefaultLinkHandler.targetIsThisWindow(target)) {
                return info;
            }
            if (hasAttribute(target, 'download')
                || hasAttribute(target, 'router-ignore')
                || hasAttribute(target, 'data-router-ignore')) {
                return info;
            }
            if ($event.altKey || $event.ctrlKey || $event.metaKey || $event.shiftKey) {
                return info;
            }
            var href = target.getAttribute('href');
            info.anchor = target;
            info.href = href;
            var leftButtonClicked = $event.which === 1;
            var isRelative = href && !(href.charAt(0) === '#' || (/^[a-z]+:/i).test(href));
            info.shouldHandleEvent = leftButtonClicked && isRelative;
            return info;
        };
        DefaultLinkHandler.findClosestAnchor = function (el) {
            while (el) {
                if (el.tagName === 'A') {
                    return el;
                }
                el = el.parentNode;
            }
        };
        DefaultLinkHandler.targetIsThisWindow = function (target) {
            var targetWindow = target.getAttribute('target');
            var win = aureliaPal.PLATFORM.global;
            return !targetWindow ||
                targetWindow === win.name ||
                targetWindow === '_self';
        };
        return DefaultLinkHandler;
    }(LinkHandler));
    var hasAttribute = function (el, attr) { return el.hasAttribute(attr); };

    var BrowserHistory = (function (_super) {
        __extends(BrowserHistory, _super);
        function BrowserHistory(linkHandler) {
            var _this = _super.call(this) || this;
            _this._isActive = false;
            _this._checkUrlCallback = _this._checkUrl.bind(_this);
            _this.location = aureliaPal.PLATFORM.location;
            _this.history = aureliaPal.PLATFORM.history;
            _this.linkHandler = linkHandler;
            return _this;
        }
        BrowserHistory.prototype.activate = function (options) {
            if (this._isActive) {
                throw new Error('History has already been activated.');
            }
            var $history = this.history;
            var wantsPushState = !!options.pushState;
            this._isActive = true;
            var normalizedOptions = this.options = Object.assign({}, { root: '/' }, this.options, options);
            var rootUrl = this.root = ('/' + normalizedOptions.root + '/').replace(rootStripper, '/');
            var wantsHashChange = this._wantsHashChange = normalizedOptions.hashChange !== false;
            var hasPushState = this._hasPushState = !!(normalizedOptions.pushState && $history && $history.pushState);
            var eventName;
            if (hasPushState) {
                eventName = 'popstate';
            }
            else if (wantsHashChange) {
                eventName = 'hashchange';
            }
            aureliaPal.PLATFORM.addEventListener(eventName, this._checkUrlCallback);
            if (wantsHashChange && wantsPushState) {
                var $location = this.location;
                var atRoot = $location.pathname.replace(/[^\/]$/, '$&/') === rootUrl;
                if (!hasPushState && !atRoot) {
                    var fragment = this.fragment = this._getFragment(null, true);
                    $location.replace(rootUrl + $location.search + '#' + fragment);
                    return true;
                }
                else if (hasPushState && atRoot && $location.hash) {
                    var fragment = this.fragment = this._getHash().replace(routeStripper, '');
                    $history.replaceState({}, aureliaPal.DOM.title, rootUrl + fragment + $location.search);
                }
            }
            if (!this.fragment) {
                this.fragment = this._getFragment('');
            }
            this.linkHandler.activate(this);
            if (!normalizedOptions.silent) {
                return this._loadUrl('');
            }
        };
        BrowserHistory.prototype.deactivate = function () {
            var handler = this._checkUrlCallback;
            aureliaPal.PLATFORM.removeEventListener('popstate', handler);
            aureliaPal.PLATFORM.removeEventListener('hashchange', handler);
            this._isActive = false;
            this.linkHandler.deactivate();
        };
        BrowserHistory.prototype.getAbsoluteRoot = function () {
            var $location = this.location;
            var origin = createOrigin($location.protocol, $location.hostname, $location.port);
            return "" + origin + this.root;
        };
        BrowserHistory.prototype.navigate = function (fragment, _a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.trigger, trigger = _c === void 0 ? true : _c, _d = _b.replace, replace = _d === void 0 ? false : _d;
            var location = this.location;
            if (fragment && absoluteUrl.test(fragment)) {
                location.href = fragment;
                return true;
            }
            if (!this._isActive) {
                return false;
            }
            fragment = this._getFragment(fragment || '');
            if (this.fragment === fragment && !replace) {
                return false;
            }
            this.fragment = fragment;
            var url = this.root + fragment;
            if (fragment === '' && url !== '/') {
                url = url.slice(0, -1);
            }
            if (this._hasPushState) {
                url = url.replace('//', '/');
                this.history[replace ? 'replaceState' : 'pushState']({}, aureliaPal.DOM.title, url);
            }
            else if (this._wantsHashChange) {
                updateHash(location, fragment, replace);
            }
            else {
                location.assign(url);
            }
            if (trigger) {
                return this._loadUrl(fragment);
            }
            return true;
        };
        BrowserHistory.prototype.navigateBack = function () {
            this.history.back();
        };
        BrowserHistory.prototype.setTitle = function (title) {
            aureliaPal.DOM.title = title;
        };
        BrowserHistory.prototype.setState = function (key, value) {
            var $history = this.history;
            var state = Object.assign({}, $history.state);
            var _a = this.location, pathname = _a.pathname, search = _a.search, hash = _a.hash;
            state[key] = value;
            $history.replaceState(state, null, "" + pathname + search + hash);
        };
        BrowserHistory.prototype.getState = function (key) {
            var state = Object.assign({}, this.history.state);
            return state[key];
        };
        BrowserHistory.prototype.getHistoryIndex = function () {
            var historyIndex = this.getState('HistoryIndex');
            if (historyIndex === undefined) {
                historyIndex = this.history.length - 1;
                this.setState('HistoryIndex', historyIndex);
            }
            return historyIndex;
        };
        BrowserHistory.prototype.go = function (movement) {
            this.history.go(movement);
        };
        BrowserHistory.prototype._getHash = function () {
            return this.location.hash.substr(1);
        };
        BrowserHistory.prototype._getFragment = function (fragment, forcePushState) {
            var rootUrl;
            if (!fragment) {
                if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                    var location_1 = this.location;
                    fragment = location_1.pathname + location_1.search;
                    rootUrl = this.root.replace(trailingSlash, '');
                    if (!fragment.indexOf(rootUrl)) {
                        fragment = fragment.substr(rootUrl.length);
                    }
                }
                else {
                    fragment = this._getHash();
                }
            }
            return '/' + fragment.replace(routeStripper, '');
        };
        BrowserHistory.prototype._checkUrl = function () {
            var current = this._getFragment('');
            if (current !== this.fragment) {
                this._loadUrl('');
            }
        };
        BrowserHistory.prototype._loadUrl = function (fragmentOverride) {
            var fragment = this.fragment = this._getFragment(fragmentOverride);
            return this.options.routeHandler ?
                this.options.routeHandler(fragment) :
                false;
        };
        BrowserHistory.inject = [LinkHandler];
        return BrowserHistory;
    }(aureliaHistory.History));
    var routeStripper = /^#?\/*|\s+$/g;
    var rootStripper = /^\/+|\/+$/g;
    var trailingSlash = /\/$/;
    var absoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;
    function updateHash($location, fragment, replace) {
        if (replace) {
            var href = $location.href.replace(/(javascript:|#).*$/, '');
            $location.replace(href + '#' + fragment);
        }
        else {
            $location.hash = '#' + fragment;
        }
    }
    function createOrigin(protocol, hostname, port) {
        return protocol + "//" + hostname + (port ? ':' + port : '');
    }

    function configure(config) {
        var $config = config;
        $config.singleton(aureliaHistory.History, BrowserHistory);
        $config.transient(LinkHandler, DefaultLinkHandler);
    }

    exports.BrowserHistory = BrowserHistory;
    exports.DefaultLinkHandler = DefaultLinkHandler;
    exports.LinkHandler = LinkHandler;
    exports.configure = configure;

    Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=aurelia-history-browser.js.map
;define('aurelia-history-browser', ['aurelia-history-browser/aurelia-history-browser'], function (main) { return main; });

define('aurelia-loader/aurelia-loader',['exports', 'aurelia-path', 'aurelia-metadata'], function (exports, _aureliaPath, _aureliaMetadata) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Loader = exports.TemplateRegistryEntry = exports.TemplateDependency = undefined;

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();



  var TemplateDependency = exports.TemplateDependency = function TemplateDependency(src, name) {


    this.src = src;
    this.name = name;
  };

  var TemplateRegistryEntry = exports.TemplateRegistryEntry = function () {
    function TemplateRegistryEntry(address) {


      this.templateIsLoaded = false;
      this.factoryIsReady = false;
      this.resources = null;
      this.dependencies = null;

      this.address = address;
      this.onReady = null;
      this._template = null;
      this._factory = null;
    }

    TemplateRegistryEntry.prototype.addDependency = function addDependency(src, name) {
      var finalSrc = typeof src === 'string' ? (0, _aureliaPath.relativeToFile)(src, this.address) : _aureliaMetadata.Origin.get(src).moduleId;

      this.dependencies.push(new TemplateDependency(finalSrc, name));
    };

    _createClass(TemplateRegistryEntry, [{
      key: 'template',
      get: function get() {
        return this._template;
      },
      set: function set(value) {
        var address = this.address;
        var requires = void 0;
        var current = void 0;
        var src = void 0;
        var dependencies = void 0;

        this._template = value;
        this.templateIsLoaded = true;

        requires = value.content.querySelectorAll('require');
        dependencies = this.dependencies = new Array(requires.length);

        for (var i = 0, ii = requires.length; i < ii; ++i) {
          current = requires[i];
          src = current.getAttribute('from');

          if (!src) {
            throw new Error('<require> element in ' + address + ' has no "from" attribute.');
          }

          dependencies[i] = new TemplateDependency((0, _aureliaPath.relativeToFile)(src, address), current.getAttribute('as'));

          if (current.parentNode) {
            current.parentNode.removeChild(current);
          }
        }
      }
    }, {
      key: 'factory',
      get: function get() {
        return this._factory;
      },
      set: function set(value) {
        this._factory = value;
        this.factoryIsReady = true;
      }
    }]);

    return TemplateRegistryEntry;
  }();

  var Loader = exports.Loader = function () {
    function Loader() {


      this.templateRegistry = {};
    }

    Loader.prototype.map = function map(id, source) {
      throw new Error('Loaders must implement map(id, source).');
    };

    Loader.prototype.normalizeSync = function normalizeSync(moduleId, relativeTo) {
      throw new Error('Loaders must implement normalizeSync(moduleId, relativeTo).');
    };

    Loader.prototype.normalize = function normalize(moduleId, relativeTo) {
      throw new Error('Loaders must implement normalize(moduleId: string, relativeTo: string): Promise<string>.');
    };

    Loader.prototype.loadModule = function loadModule(id) {
      throw new Error('Loaders must implement loadModule(id).');
    };

    Loader.prototype.loadAllModules = function loadAllModules(ids) {
      throw new Error('Loader must implement loadAllModules(ids).');
    };

    Loader.prototype.loadTemplate = function loadTemplate(url) {
      throw new Error('Loader must implement loadTemplate(url).');
    };

    Loader.prototype.loadText = function loadText(url) {
      throw new Error('Loader must implement loadText(url).');
    };

    Loader.prototype.applyPluginToUrl = function applyPluginToUrl(url, pluginName) {
      throw new Error('Loader must implement applyPluginToUrl(url, pluginName).');
    };

    Loader.prototype.addPlugin = function addPlugin(pluginName, implementation) {
      throw new Error('Loader must implement addPlugin(pluginName, implementation).');
    };

    Loader.prototype.getOrCreateTemplateRegistryEntry = function getOrCreateTemplateRegistryEntry(address) {
      return this.templateRegistry[address] || (this.templateRegistry[address] = new TemplateRegistryEntry(address));
    };

    return Loader;
  }();
});;define('aurelia-loader', ['aurelia-loader/aurelia-loader'], function (main) { return main; });

define('aurelia-loader-default/aurelia-loader-default',['exports', 'aurelia-loader', 'aurelia-pal', 'aurelia-metadata'], function (exports, _aureliaLoader, _aureliaPal, _aureliaMetadata) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.DefaultLoader = exports.TextTemplateLoader = undefined;

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }



  var TextTemplateLoader = exports.TextTemplateLoader = function () {
    function TextTemplateLoader() {

    }

    TextTemplateLoader.prototype.loadTemplate = function loadTemplate(loader, entry) {
      return loader.loadText(entry.address).then(function (text) {
        entry.template = _aureliaPal.DOM.createTemplateFromMarkup(text);
      });
    };

    return TextTemplateLoader;
  }();

  function ensureOriginOnExports(executed, name) {
    var target = executed;
    var key = void 0;
    var exportedValue = void 0;

    if (target.__useDefault) {
      target = target['default'];
    }

    _aureliaMetadata.Origin.set(target, new _aureliaMetadata.Origin(name, 'default'));

    for (key in target) {
      exportedValue = target[key];

      if (typeof exportedValue === 'function') {
        _aureliaMetadata.Origin.set(exportedValue, new _aureliaMetadata.Origin(name, key));
      }
    }

    return executed;
  }

  var DefaultLoader = exports.DefaultLoader = function (_Loader) {
    _inherits(DefaultLoader, _Loader);

    function DefaultLoader() {


      var _this = _possibleConstructorReturn(this, _Loader.call(this));

      _this.textPluginName = 'text';


      _this.moduleRegistry = Object.create(null);
      _this.useTemplateLoader(new TextTemplateLoader());

      var that = _this;

      _this.addPlugin('template-registry-entry', {
        'fetch': function fetch(address) {
          var entry = that.getOrCreateTemplateRegistryEntry(address);
          return entry.templateIsLoaded ? entry : that.templateLoader.loadTemplate(that, entry).then(function (x) {
            return entry;
          });
        }
      });
      return _this;
    }

    DefaultLoader.prototype.useTemplateLoader = function useTemplateLoader(templateLoader) {
      this.templateLoader = templateLoader;
    };

    DefaultLoader.prototype.loadAllModules = function loadAllModules(ids) {
      var loads = [];

      for (var i = 0, ii = ids.length; i < ii; ++i) {
        loads.push(this.loadModule(ids[i]));
      }

      return Promise.all(loads);
    };

    DefaultLoader.prototype.loadTemplate = function loadTemplate(url) {
      return this._import(this.applyPluginToUrl(url, 'template-registry-entry'));
    };

    DefaultLoader.prototype.loadText = function loadText(url) {
      return this._import(this.applyPluginToUrl(url, this.textPluginName)).then(function (textOrModule) {
        if (typeof textOrModule === 'string') {
          return textOrModule;
        }

        return textOrModule['default'];
      });
    };

    return DefaultLoader;
  }(_aureliaLoader.Loader);

  _aureliaPal.PLATFORM.Loader = DefaultLoader;

  if (!_aureliaPal.PLATFORM.global.System || !_aureliaPal.PLATFORM.global.System.import) {
    if (_aureliaPal.PLATFORM.global.requirejs) {
      var getDefined = void 0;
      if (_typeof(_aureliaPal.PLATFORM.global.requirejs.s) === 'object') {
        getDefined = function getDefined() {
          return _aureliaPal.PLATFORM.global.requirejs.s.contexts._.defined;
        };
      } else if (_typeof(_aureliaPal.PLATFORM.global.requirejs.contexts) === 'object') {
        getDefined = function getDefined() {
          return _aureliaPal.PLATFORM.global.requirejs.contexts._.defined;
        };
      } else if (typeof _aureliaPal.PLATFORM.global.requirejs.definedValues === 'function') {
        getDefined = function getDefined() {
          return _aureliaPal.PLATFORM.global.requirejs.definedValues();
        };
      } else {
        getDefined = function getDefined() {
          return {};
        };
      }
      _aureliaPal.PLATFORM.eachModule = function (callback) {
        var defined = getDefined();
        for (var key in defined) {
          try {
            if (callback(key, defined[key])) return;
          } catch (e) {}
        }
      };
    } else {
      _aureliaPal.PLATFORM.eachModule = function (callback) {};
    }

    DefaultLoader.prototype._import = function (moduleId) {
      return new Promise(function (resolve, reject) {
        _aureliaPal.PLATFORM.global.require([moduleId], resolve, reject);
      });
    };

    DefaultLoader.prototype.loadModule = function (id) {
      var _this2 = this;

      var existing = this.moduleRegistry[id];
      if (existing !== undefined) {
        return Promise.resolve(existing);
      }

      return new Promise(function (resolve, reject) {
        _aureliaPal.PLATFORM.global.require([id], function (m) {
          _this2.moduleRegistry[id] = m;
          resolve(ensureOriginOnExports(m, id));
        }, reject);
      });
    };

    DefaultLoader.prototype.map = function (id, source) {};

    DefaultLoader.prototype.normalize = function (moduleId, relativeTo) {
      return Promise.resolve(moduleId);
    };

    DefaultLoader.prototype.normalizeSync = function (moduleId, relativeTo) {
      return moduleId;
    };

    DefaultLoader.prototype.applyPluginToUrl = function (url, pluginName) {
      return pluginName + '!' + url;
    };

    DefaultLoader.prototype.addPlugin = function (pluginName, implementation) {
      var nonAnonDefine = define;
      nonAnonDefine(pluginName, [], {
        'load': function load(name, req, onload) {
          var result = implementation.fetch(name);
          Promise.resolve(result).then(onload);
        }
      });
    };
  } else {
    _aureliaPal.PLATFORM.eachModule = function (callback) {
      if (System.registry) {
        var keys = Array.from(System.registry.keys());
        for (var i = 0; i < keys.length; i++) {
          try {
            var key = keys[i];
            if (callback(key, System.registry.get(key))) {
              return;
            }
          } catch (e) {}
        }
        return;
      }

      var modules = System._loader.modules;

      for (var _key in modules) {
        try {
          if (callback(_key, modules[_key].module)) return;
        } catch (e) {}
      }
    };

    DefaultLoader.prototype._import = function (moduleId) {
      return System.import(moduleId);
    };

    DefaultLoader.prototype.loadModule = function (id) {
      var _this3 = this;

      return System.normalize(id).then(function (newId) {
        var existing = _this3.moduleRegistry[newId];
        if (existing !== undefined) {
          return Promise.resolve(existing);
        }

        return System.import(newId).then(function (m) {
          _this3.moduleRegistry[newId] = m;
          return ensureOriginOnExports(m, newId);
        });
      });
    };

    DefaultLoader.prototype.map = function (id, source) {
      var _map;

      System.config({ map: (_map = {}, _map[id] = source, _map) });
    };

    DefaultLoader.prototype.normalizeSync = function (moduleId, relativeTo) {
      return System.normalizeSync(moduleId, relativeTo);
    };

    DefaultLoader.prototype.normalize = function (moduleId, relativeTo) {
      return System.normalize(moduleId, relativeTo);
    };

    DefaultLoader.prototype.applyPluginToUrl = function (url, pluginName) {
      return url + '!' + pluginName;
    };

    DefaultLoader.prototype.addPlugin = function (pluginName, implementation) {
      System.set(pluginName, System.newModule({
        'fetch': function fetch(load, _fetch) {
          var result = implementation.fetch(load.address);
          return Promise.resolve(result).then(function (x) {
            load.metadata.result = x;
            return '';
          });
        },
        'instantiate': function instantiate(load) {
          return load.metadata.result;
        }
      }));
    };
  }
});;define('aurelia-loader-default', ['aurelia-loader-default/aurelia-loader-default'], function (main) { return main; });

define('aurelia-logging/aurelia-logging',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.getLogger = getLogger;
  exports.addAppender = addAppender;
  exports.removeAppender = removeAppender;
  exports.getAppenders = getAppenders;
  exports.clearAppenders = clearAppenders;
  exports.addCustomLevel = addCustomLevel;
  exports.removeCustomLevel = removeCustomLevel;
  exports.setLevel = setLevel;
  exports.getLevel = getLevel;



  var logLevel = exports.logLevel = {
    none: 0,
    error: 10,
    warn: 20,
    info: 30,
    debug: 40
  };

  var loggers = {};
  var appenders = [];
  var globalDefaultLevel = logLevel.none;

  var standardLevels = ['none', 'error', 'warn', 'info', 'debug'];
  function isStandardLevel(level) {
    return standardLevels.filter(function (l) {
      return l === level;
    }).length > 0;
  }

  function appendArgs() {
    return [this].concat(Array.prototype.slice.call(arguments));
  }

  function logFactory(level) {
    var threshold = logLevel[level];
    return function () {
      if (this.level < threshold) {
        return;
      }

      var args = appendArgs.apply(this, arguments);
      var i = appenders.length;
      while (i--) {
        var _appenders$i;

        (_appenders$i = appenders[i])[level].apply(_appenders$i, args);
      }
    };
  }

  function logFactoryCustom(level) {
    var threshold = logLevel[level];
    return function () {
      if (this.level < threshold) {
        return;
      }

      var args = appendArgs.apply(this, arguments);
      var i = appenders.length;
      while (i--) {
        var appender = appenders[i];
        if (appender[level] !== undefined) {
          appender[level].apply(appender, args);
        }
      }
    };
  }

  function connectLoggers() {
    var proto = Logger.prototype;
    for (var _level in logLevel) {
      if (isStandardLevel(_level)) {
        if (_level !== 'none') {
          proto[_level] = logFactory(_level);
        }
      } else {
        proto[_level] = logFactoryCustom(_level);
      }
    }
  }

  function disconnectLoggers() {
    var proto = Logger.prototype;
    for (var _level2 in logLevel) {
      if (_level2 !== 'none') {
        proto[_level2] = function () {};
      }
    }
  }

  function getLogger(id) {
    return loggers[id] || new Logger(id);
  }

  function addAppender(appender) {
    if (appenders.push(appender) === 1) {
      connectLoggers();
    }
  }

  function removeAppender(appender) {
    appenders = appenders.filter(function (a) {
      return a !== appender;
    });
  }

  function getAppenders() {
    return [].concat(appenders);
  }

  function clearAppenders() {
    appenders = [];
    disconnectLoggers();
  }

  function addCustomLevel(name, value) {
    if (logLevel[name] !== undefined) {
      throw Error('Log level "' + name + '" already exists.');
    }

    if (isNaN(value)) {
      throw Error('Value must be a number.');
    }

    logLevel[name] = value;

    if (appenders.length > 0) {
      connectLoggers();
    } else {
      Logger.prototype[name] = function () {};
    }
  }

  function removeCustomLevel(name) {
    if (logLevel[name] === undefined) {
      return;
    }

    if (isStandardLevel(name)) {
      throw Error('Built-in log level "' + name + '" cannot be removed.');
    }

    delete logLevel[name];
    delete Logger.prototype[name];
  }

  function setLevel(level) {
    globalDefaultLevel = level;
    for (var key in loggers) {
      loggers[key].setLevel(level);
    }
  }

  function getLevel() {
    return globalDefaultLevel;
  }

  var Logger = exports.Logger = function () {
    function Logger(id) {


      var cached = loggers[id];
      if (cached) {
        return cached;
      }

      loggers[id] = this;
      this.id = id;
      this.level = globalDefaultLevel;
    }

    Logger.prototype.debug = function debug(message) {};

    Logger.prototype.info = function info(message) {};

    Logger.prototype.warn = function warn(message) {};

    Logger.prototype.error = function error(message) {};

    Logger.prototype.setLevel = function setLevel(level) {
      this.level = level;
    };

    Logger.prototype.isDebugEnabled = function isDebugEnabled() {
      return this.level === logLevel.debug;
    };

    return Logger;
  }();
});;define('aurelia-logging', ['aurelia-logging/aurelia-logging'], function (main) { return main; });

define('aurelia-logging-console/aurelia-logging-console',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });



  var ConsoleAppender = exports.ConsoleAppender = function () {
    function ConsoleAppender() {

    }

    ConsoleAppender.prototype.debug = function debug(logger) {
      var _console;

      for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        rest[_key - 1] = arguments[_key];
      }

      (_console = console).debug.apply(_console, ["DEBUG [" + logger.id + "]"].concat(rest));
    };

    ConsoleAppender.prototype.info = function info(logger) {
      var _console2;

      for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        rest[_key2 - 1] = arguments[_key2];
      }

      (_console2 = console).info.apply(_console2, ["INFO [" + logger.id + "]"].concat(rest));
    };

    ConsoleAppender.prototype.warn = function warn(logger) {
      var _console3;

      for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        rest[_key3 - 1] = arguments[_key3];
      }

      (_console3 = console).warn.apply(_console3, ["WARN [" + logger.id + "]"].concat(rest));
    };

    ConsoleAppender.prototype.error = function error(logger) {
      var _console4;

      for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        rest[_key4 - 1] = arguments[_key4];
      }

      (_console4 = console).error.apply(_console4, ["ERROR [" + logger.id + "]"].concat(rest));
    };

    return ConsoleAppender;
  }();
});;define('aurelia-logging-console', ['aurelia-logging-console/aurelia-logging-console'], function (main) { return main; });

define('aurelia-metadata/aurelia-metadata',['exports', 'aurelia-pal'], function (exports, _aureliaPal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Origin = exports.metadata = undefined;
  exports.decorators = decorators;
  exports.deprecated = deprecated;
  exports.mixin = mixin;
  exports.protocol = protocol;

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };



  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function isObject(val) {
    return val && (typeof val === 'function' || (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object');
  }

  var metadata = exports.metadata = {
    resource: 'aurelia:resource',
    paramTypes: 'design:paramtypes',
    propertyType: 'design:type',
    properties: 'design:properties',
    get: function get(metadataKey, target, targetKey) {
      if (!isObject(target)) {
        return undefined;
      }
      var result = metadata.getOwn(metadataKey, target, targetKey);
      return result === undefined ? metadata.get(metadataKey, Object.getPrototypeOf(target), targetKey) : result;
    },
    getOwn: function getOwn(metadataKey, target, targetKey) {
      if (!isObject(target)) {
        return undefined;
      }
      return Reflect.getOwnMetadata(metadataKey, target, targetKey);
    },
    define: function define(metadataKey, metadataValue, target, targetKey) {
      Reflect.defineMetadata(metadataKey, metadataValue, target, targetKey);
    },
    getOrCreateOwn: function getOrCreateOwn(metadataKey, Type, target, targetKey) {
      var result = metadata.getOwn(metadataKey, target, targetKey);

      if (result === undefined) {
        result = new Type();
        Reflect.defineMetadata(metadataKey, result, target, targetKey);
      }

      return result;
    }
  };

  var originStorage = new Map();
  var unknownOrigin = Object.freeze({ moduleId: undefined, moduleMember: undefined });

  var Origin = exports.Origin = function () {
    function Origin(moduleId, moduleMember) {


      this.moduleId = moduleId;
      this.moduleMember = moduleMember;
    }

    Origin.get = function get(fn) {
      var origin = originStorage.get(fn);

      if (origin === undefined) {
        _aureliaPal.PLATFORM.eachModule(function (key, value) {
          if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            for (var name in value) {
              try {
                var exp = value[name];
                if (exp === fn) {
                  originStorage.set(fn, origin = new Origin(key, name));
                  return true;
                }
              } catch (e) {}
            }
          }

          if (value === fn) {
            originStorage.set(fn, origin = new Origin(key, 'default'));
            return true;
          }

          return false;
        });
      }

      return origin || unknownOrigin;
    };

    Origin.set = function set(fn, origin) {
      originStorage.set(fn, origin);
    };

    return Origin;
  }();

  function decorators() {
    for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
      rest[_key] = arguments[_key];
    }

    var applicator = function applicator(target, key, descriptor) {
      var i = rest.length;

      if (key) {
        descriptor = descriptor || {
          value: target[key],
          writable: true,
          configurable: true,
          enumerable: true
        };

        while (i--) {
          descriptor = rest[i](target, key, descriptor) || descriptor;
        }

        Object.defineProperty(target, key, descriptor);
      } else {
        while (i--) {
          target = rest[i](target) || target;
        }
      }

      return target;
    };

    applicator.on = applicator;
    return applicator;
  }

  function deprecated(optionsOrTarget, maybeKey, maybeDescriptor) {
    function decorator(target, key, descriptor) {
      var methodSignature = target.constructor.name + '#' + key;
      var options = maybeKey ? {} : optionsOrTarget || {};
      var message = 'DEPRECATION - ' + methodSignature;

      if (typeof descriptor.value !== 'function') {
        throw new SyntaxError('Only methods can be marked as deprecated.');
      }

      if (options.message) {
        message += ' - ' + options.message;
      }

      return _extends({}, descriptor, {
        value: function deprecationWrapper() {
          if (options.error) {
            throw new Error(message);
          } else {
            console.warn(message);
          }

          return descriptor.value.apply(this, arguments);
        }
      });
    }

    return maybeKey ? decorator(optionsOrTarget, maybeKey, maybeDescriptor) : decorator;
  }

  function mixin(behavior) {
    var instanceKeys = Object.keys(behavior);

    function _mixin(possible) {
      var decorator = function decorator(target) {
        var resolvedTarget = typeof target === 'function' ? target.prototype : target;

        var i = instanceKeys.length;
        while (i--) {
          var property = instanceKeys[i];
          Object.defineProperty(resolvedTarget, property, {
            value: behavior[property],
            writable: true
          });
        }
      };

      return possible ? decorator(possible) : decorator;
    }

    return _mixin;
  }

  function alwaysValid() {
    return true;
  }
  function noCompose() {}

  function ensureProtocolOptions(options) {
    if (options === undefined) {
      options = {};
    } else if (typeof options === 'function') {
      options = {
        validate: options
      };
    }

    if (!options.validate) {
      options.validate = alwaysValid;
    }

    if (!options.compose) {
      options.compose = noCompose;
    }

    return options;
  }

  function createProtocolValidator(validate) {
    return function (target) {
      var result = validate(target);
      return result === true;
    };
  }

  function createProtocolAsserter(name, validate) {
    return function (target) {
      var result = validate(target);
      if (result !== true) {
        throw new Error(result || name + ' was not correctly implemented.');
      }
    };
  }

  function protocol(name, options) {
    options = ensureProtocolOptions(options);

    var result = function result(target) {
      var resolvedTarget = typeof target === 'function' ? target.prototype : target;

      options.compose(resolvedTarget);
      result.assert(resolvedTarget);

      Object.defineProperty(resolvedTarget, 'protocol:' + name, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: true
      });
    };

    result.validate = createProtocolValidator(options.validate);
    result.assert = createProtocolAsserter(name, options.validate);

    return result;
  }

  protocol.create = function (name, options) {
    options = ensureProtocolOptions(options);
    var hidden = 'protocol:' + name;
    var result = function result(target) {
      var decorator = protocol(name, options);
      return target ? decorator(target) : decorator;
    };

    result.decorates = function (obj) {
      return obj[hidden] === true;
    };
    result.validate = createProtocolValidator(options.validate);
    result.assert = createProtocolAsserter(name, options.validate);

    return result;
  };
});;define('aurelia-metadata', ['aurelia-metadata/aurelia-metadata'], function (main) { return main; });

define('aurelia-pal/aurelia-pal',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.AggregateError = AggregateError;
  exports.initializePAL = initializePAL;
  exports.reset = reset;
  function AggregateError(message, innerError, skipIfAlreadyAggregate) {
    if (innerError) {
      if (innerError.innerError && skipIfAlreadyAggregate) {
        return innerError;
      }

      var separator = '\n------------------------------------------------\n';

      message += separator + 'Inner Error:\n';

      if (typeof innerError === 'string') {
        message += 'Message: ' + innerError;
      } else {
        if (innerError.message) {
          message += 'Message: ' + innerError.message;
        } else {
          message += 'Unknown Inner Error Type. Displaying Inner Error as JSON:\n ' + JSON.stringify(innerError, null, '  ');
        }

        if (innerError.stack) {
          message += '\nInner Error Stack:\n' + innerError.stack;
          message += '\nEnd Inner Error Stack';
        }
      }

      message += separator;
    }

    var e = new Error(message);
    if (innerError) {
      e.innerError = innerError;
    }

    return e;
  }

  var FEATURE = exports.FEATURE = {};

  var PLATFORM = exports.PLATFORM = {
    noop: function noop() {},
    eachModule: function eachModule() {},
    moduleName: function (_moduleName) {
      function moduleName(_x) {
        return _moduleName.apply(this, arguments);
      }

      moduleName.toString = function () {
        return _moduleName.toString();
      };

      return moduleName;
    }(function (moduleName) {
      return moduleName;
    })
  };

  PLATFORM.global = function () {
    if (typeof self !== 'undefined') {
      return self;
    }

    if (typeof global !== 'undefined') {
      return global;
    }

    return new Function('return this')();
  }();

  var DOM = exports.DOM = {};
  var isInitialized = exports.isInitialized = false;
  function initializePAL(callback) {
    if (isInitialized) {
      return;
    }
    exports.isInitialized = isInitialized = true;
    if (typeof Object.getPropertyDescriptor !== 'function') {
      Object.getPropertyDescriptor = function (subject, name) {
        var pd = Object.getOwnPropertyDescriptor(subject, name);
        var proto = Object.getPrototypeOf(subject);
        while (typeof pd === 'undefined' && proto !== null) {
          pd = Object.getOwnPropertyDescriptor(proto, name);
          proto = Object.getPrototypeOf(proto);
        }
        return pd;
      };
    }

    callback(PLATFORM, FEATURE, DOM);
  }
  function reset() {
    exports.isInitialized = isInitialized = false;
  }
});;define('aurelia-pal', ['aurelia-pal/aurelia-pal'], function (main) { return main; });

define('aurelia-pal-browser/aurelia-pal-browser',['exports', 'aurelia-pal'], function (exports, _aureliaPal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports._DOM = exports._FEATURE = exports._PLATFORM = undefined;
  exports.initialize = initialize;

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var _PLATFORM = exports._PLATFORM = {
    location: window.location,
    history: window.history,
    addEventListener: function addEventListener(eventName, callback, capture) {
      this.global.addEventListener(eventName, callback, capture);
    },
    removeEventListener: function removeEventListener(eventName, callback, capture) {
      this.global.removeEventListener(eventName, callback, capture);
    },

    performance: window.performance,
    requestAnimationFrame: function requestAnimationFrame(callback) {
      return this.global.requestAnimationFrame(callback);
    }
  };

  if (typeof FEATURE_NO_IE === 'undefined') {
    var test = function test() {};

    if (test.name === undefined) {
      Object.defineProperty(Function.prototype, 'name', {
        get: function get() {
          var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];

          Object.defineProperty(this, 'name', { value: name });
          return name;
        }
      });
    }
  }

  if (typeof FEATURE_NO_IE === 'undefined') {
    if (!('classList' in document.createElement('_')) || document.createElementNS && !('classList' in document.createElementNS('http://www.w3.org/2000/svg', 'g'))) {
      var protoProp = 'prototype';
      var strTrim = String.prototype.trim;
      var arrIndexOf = Array.prototype.indexOf;
      var emptyArray = [];

      var DOMEx = function DOMEx(type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
      };

      var checkTokenAndGetIndex = function checkTokenAndGetIndex(classList, token) {
        if (token === '') {
          throw new DOMEx('SYNTAX_ERR', 'An invalid or illegal string was specified');
        }

        if (/\s/.test(token)) {
          throw new DOMEx('INVALID_CHARACTER_ERR', 'String contains an invalid character');
        }

        return arrIndexOf.call(classList, token);
      };

      var ClassList = function ClassList(elem) {
        var trimmedClasses = strTrim.call(elem.getAttribute('class') || '');
        var classes = trimmedClasses ? trimmedClasses.split(/\s+/) : emptyArray;

        for (var i = 0, ii = classes.length; i < ii; ++i) {
          this.push(classes[i]);
        }

        this._updateClassName = function () {
          elem.setAttribute('class', this.toString());
        };
      };

      var classListProto = ClassList[protoProp] = [];

      DOMEx[protoProp] = Error[protoProp];

      classListProto.item = function (i) {
        return this[i] || null;
      };

      classListProto.contains = function (token) {
        token += '';
        return checkTokenAndGetIndex(this, token) !== -1;
      };

      classListProto.add = function () {
        var tokens = arguments;
        var i = 0;
        var ii = tokens.length;
        var token = void 0;
        var updated = false;

        do {
          token = tokens[i] + '';
          if (checkTokenAndGetIndex(this, token) === -1) {
            this.push(token);
            updated = true;
          }
        } while (++i < ii);

        if (updated) {
          this._updateClassName();
        }
      };

      classListProto.remove = function () {
        var tokens = arguments;
        var i = 0;
        var ii = tokens.length;
        var token = void 0;
        var updated = false;
        var index = void 0;

        do {
          token = tokens[i] + '';
          index = checkTokenAndGetIndex(this, token);
          while (index !== -1) {
            this.splice(index, 1);
            updated = true;
            index = checkTokenAndGetIndex(this, token);
          }
        } while (++i < ii);

        if (updated) {
          this._updateClassName();
        }
      };

      classListProto.toggle = function (token, force) {
        token += '';

        var result = this.contains(token);
        var method = result ? force !== true && 'remove' : force !== false && 'add';

        if (method) {
          this[method](token);
        }

        if (force === true || force === false) {
          return force;
        }

        return !result;
      };

      classListProto.toString = function () {
        return this.join(' ');
      };

      Object.defineProperty(Element.prototype, 'classList', {
        get: function get() {
          return new ClassList(this);
        },
        enumerable: true,
        configurable: true
      });
    } else {
      var testElement = document.createElement('_');
      testElement.classList.add('c1', 'c2');

      if (!testElement.classList.contains('c2')) {
        var createMethod = function createMethod(method) {
          var original = DOMTokenList.prototype[method];

          DOMTokenList.prototype[method] = function (token) {
            for (var i = 0, ii = arguments.length; i < ii; ++i) {
              token = arguments[i];
              original.call(this, token);
            }
          };
        };

        createMethod('add');
        createMethod('remove');
      }

      testElement.classList.toggle('c3', false);

      if (testElement.classList.contains('c3')) {
        var _toggle = DOMTokenList.prototype.toggle;

        DOMTokenList.prototype.toggle = function (token, force) {
          if (1 in arguments && !this.contains(token) === !force) {
            return force;
          }

          return _toggle.call(this, token);
        };
      }

      testElement = null;
    }
  }

  if (typeof FEATURE_NO_IE === 'undefined') {
    var _filterEntries = function _filterEntries(key, value) {
      var i = 0,
          n = _entries.length,
          result = [];
      for (; i < n; i++) {
        if (_entries[i][key] == value) {
          result.push(_entries[i]);
        }
      }
      return result;
    };

    var _clearEntries = function _clearEntries(type, name) {
      var i = _entries.length,
          entry;
      while (i--) {
        entry = _entries[i];
        if (entry.entryType == type && (name === void 0 || entry.name == name)) {
          _entries.splice(i, 1);
        }
      }
    };

    // @license http://opensource.org/licenses/MIT
    if ('performance' in window === false) {
      window.performance = {};
    }

    if ('now' in window.performance === false) {
      var nowOffset = Date.now();

      if (performance.timing && performance.timing.navigationStart) {
        nowOffset = performance.timing.navigationStart;
      }

      window.performance.now = function now() {
        return Date.now() - nowOffset;
      };
    }

    var startOffset = Date.now ? Date.now() : +new Date();
    var _entries = [];
    var _marksIndex = {};

    ;

    if (!window.performance.mark) {
      window.performance.mark = window.performance.webkitMark || function (name) {
        var mark = {
          name: name,
          entryType: "mark",
          startTime: window.performance.now(),
          duration: 0
        };

        _entries.push(mark);
        _marksIndex[name] = mark;
      };
    }

    if (!window.performance.measure) {
      window.performance.measure = window.performance.webkitMeasure || function (name, startMark, endMark) {
        startMark = _marksIndex[startMark].startTime;
        endMark = _marksIndex[endMark].startTime;

        _entries.push({
          name: name,
          entryType: "measure",
          startTime: startMark,
          duration: endMark - startMark
        });
      };
    }

    if (!window.performance.getEntriesByType) {
      window.performance.getEntriesByType = window.performance.webkitGetEntriesByType || function (type) {
        return _filterEntries("entryType", type);
      };
    }

    if (!window.performance.getEntriesByName) {
      window.performance.getEntriesByName = window.performance.webkitGetEntriesByName || function (name) {
        return _filterEntries("name", name);
      };
    }

    if (!window.performance.clearMarks) {
      window.performance.clearMarks = window.performance.webkitClearMarks || function (name) {
        _clearEntries("mark", name);
      };
    }

    if (!window.performance.clearMeasures) {
      window.performance.clearMeasures = window.performance.webkitClearMeasures || function (name) {
        _clearEntries("measure", name);
      };
    }

    _PLATFORM.performance = window.performance;
  }

  if (typeof FEATURE_NO_IE === 'undefined') {
    var con = window.console = window.console || {};
    var nop = function nop() {};

    if (!con.memory) con.memory = {};
    ('assert,clear,count,debug,dir,dirxml,error,exception,group,' + 'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' + 'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',').forEach(function (m) {
      if (!con[m]) con[m] = nop;
    });

    if (_typeof(con.log) === 'object') {
      'log,info,warn,error,assert,dir,clear,profile,profileEnd'.split(',').forEach(function (method) {
        console[method] = this.bind(console[method], console);
      }, Function.prototype.call);
    }
  }

  if (typeof FEATURE_NO_IE === 'undefined') {
    if (!window.CustomEvent || typeof window.CustomEvent !== 'function') {
      var _CustomEvent = function _CustomEvent(event, params) {
        params = params || {
          bubbles: false,
          cancelable: false,
          detail: undefined
        };

        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      };

      _CustomEvent.prototype = window.Event.prototype;
      window.CustomEvent = _CustomEvent;
    }
  }

  if (Element && !Element.prototype.matches) {
    var proto = Element.prototype;
    proto.matches = proto.matchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector || proto.webkitMatchesSelector;
  }

  var _FEATURE = exports._FEATURE = {
    shadowDOM: !!HTMLElement.prototype.attachShadow,
    scopedCSS: 'scoped' in document.createElement('style'),
    htmlTemplateElement: function () {
      var d = document.createElement('div');
      d.innerHTML = '<template></template>';
      return 'content' in d.children[0];
    }(),
    mutationObserver: !!(window.MutationObserver || window.WebKitMutationObserver),
    ensureHTMLTemplateElement: function ensureHTMLTemplateElement(t) {
      return t;
    }
  };

  if (typeof FEATURE_NO_IE === 'undefined') {
    var isSVGTemplate = function isSVGTemplate(el) {
      return el.tagName === 'template' && el.namespaceURI === 'http://www.w3.org/2000/svg';
    };

    var fixSVGTemplateElement = function fixSVGTemplateElement(el) {
      var template = el.ownerDocument.createElement('template');
      var attrs = el.attributes;
      var length = attrs.length;
      var attr = void 0;

      el.parentNode.insertBefore(template, el);

      while (length-- > 0) {
        attr = attrs[length];
        template.setAttribute(attr.name, attr.value);
        el.removeAttribute(attr.name);
      }

      el.parentNode.removeChild(el);

      return fixHTMLTemplateElement(template);
    };

    var fixHTMLTemplateElement = function fixHTMLTemplateElement(template) {
      var content = template.content = document.createDocumentFragment();
      var child = void 0;

      while (child = template.firstChild) {
        content.appendChild(child);
      }

      return template;
    };

    var fixHTMLTemplateElementRoot = function fixHTMLTemplateElementRoot(template) {
      var content = fixHTMLTemplateElement(template).content;
      var childTemplates = content.querySelectorAll('template');

      for (var i = 0, ii = childTemplates.length; i < ii; ++i) {
        var child = childTemplates[i];

        if (isSVGTemplate(child)) {
          fixSVGTemplateElement(child);
        } else {
          fixHTMLTemplateElement(child);
        }
      }

      return template;
    };

    if (!_FEATURE.htmlTemplateElement) {
      _FEATURE.ensureHTMLTemplateElement = fixHTMLTemplateElementRoot;
    }
  }

  var shadowPoly = window.ShadowDOMPolyfill || null;

  var _DOM = exports._DOM = {
    Element: Element,
    NodeList: NodeList,
    SVGElement: SVGElement,
    boundary: 'aurelia-dom-boundary',
    addEventListener: function addEventListener(eventName, callback, capture) {
      document.addEventListener(eventName, callback, capture);
    },
    removeEventListener: function removeEventListener(eventName, callback, capture) {
      document.removeEventListener(eventName, callback, capture);
    },
    adoptNode: function adoptNode(node) {
      return document.adoptNode(node);
    },
    createAttribute: function createAttribute(name) {
      return document.createAttribute(name);
    },
    createElement: function createElement(tagName) {
      return document.createElement(tagName);
    },
    createTextNode: function createTextNode(text) {
      return document.createTextNode(text);
    },
    createComment: function createComment(text) {
      return document.createComment(text);
    },
    createDocumentFragment: function createDocumentFragment() {
      return document.createDocumentFragment();
    },
    createTemplateElement: function createTemplateElement() {
      var template = document.createElement('template');
      return _FEATURE.ensureHTMLTemplateElement(template);
    },
    createMutationObserver: function createMutationObserver(callback) {
      return new (window.MutationObserver || window.WebKitMutationObserver)(callback);
    },
    createCustomEvent: function createCustomEvent(eventType, options) {
      return new window.CustomEvent(eventType, options);
    },
    dispatchEvent: function dispatchEvent(evt) {
      document.dispatchEvent(evt);
    },
    getComputedStyle: function getComputedStyle(element) {
      return window.getComputedStyle(element);
    },
    getElementById: function getElementById(id) {
      return document.getElementById(id);
    },
    querySelector: function querySelector(query) {
      return document.querySelector(query);
    },
    querySelectorAll: function querySelectorAll(query) {
      return document.querySelectorAll(query);
    },
    nextElementSibling: function nextElementSibling(element) {
      if (element.nextElementSibling) {
        return element.nextElementSibling;
      }
      do {
        element = element.nextSibling;
      } while (element && element.nodeType !== 1);
      return element;
    },
    createTemplateFromMarkup: function createTemplateFromMarkup(markup) {
      var parser = document.createElement('div');
      parser.innerHTML = markup;

      var temp = parser.firstElementChild;
      if (!temp || temp.nodeName !== 'TEMPLATE') {
        throw new Error('Template markup must be wrapped in a <template> element e.g. <template> <!-- markup here --> </template>');
      }

      return _FEATURE.ensureHTMLTemplateElement(temp);
    },
    appendNode: function appendNode(newNode, parentNode) {
      (parentNode || document.body).appendChild(newNode);
    },
    replaceNode: function replaceNode(newNode, node, parentNode) {
      if (node.parentNode) {
        node.parentNode.replaceChild(newNode, node);
      } else if (shadowPoly !== null) {
        shadowPoly.unwrap(parentNode).replaceChild(shadowPoly.unwrap(newNode), shadowPoly.unwrap(node));
      } else {
        parentNode.replaceChild(newNode, node);
      }
    },
    removeNode: function removeNode(node, parentNode) {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      } else if (parentNode) {
        if (shadowPoly !== null) {
          shadowPoly.unwrap(parentNode).removeChild(shadowPoly.unwrap(node));
        } else {
          parentNode.removeChild(node);
        }
      }
    },
    injectStyles: function injectStyles(styles, destination, prepend, id) {
      if (id) {
        var oldStyle = document.getElementById(id);
        if (oldStyle) {
          var isStyleTag = oldStyle.tagName.toLowerCase() === 'style';

          if (isStyleTag) {
            oldStyle.innerHTML = styles;
            return;
          }

          throw new Error('The provided id does not indicate a style tag.');
        }
      }

      var node = document.createElement('style');
      node.innerHTML = styles;
      node.type = 'text/css';

      if (id) {
        node.id = id;
      }

      destination = destination || document.head;

      if (prepend && destination.childNodes.length > 0) {
        destination.insertBefore(node, destination.childNodes[0]);
      } else {
        destination.appendChild(node);
      }

      return node;
    }
  };

  function initialize() {
    if (_aureliaPal.isInitialized) {
      return;
    }

    (0, _aureliaPal.initializePAL)(function (platform, feature, dom) {
      Object.assign(platform, _PLATFORM);
      Object.assign(feature, _FEATURE);
      Object.assign(dom, _DOM);

      Object.defineProperty(dom, 'title', {
        get: function get() {
          return document.title;
        },
        set: function set(value) {
          document.title = value;
        }
      });

      Object.defineProperty(dom, 'activeElement', {
        get: function get() {
          return document.activeElement;
        }
      });

      Object.defineProperty(platform, 'XMLHttpRequest', {
        get: function get() {
          return platform.global.XMLHttpRequest;
        }
      });
    });
  }
});;define('aurelia-pal-browser', ['aurelia-pal-browser/aurelia-pal-browser'], function (main) { return main; });

define('aurelia-path/aurelia-path',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.relativeToFile = relativeToFile;
  exports.join = join;
  exports.buildQueryString = buildQueryString;
  exports.parseQueryString = parseQueryString;

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function trimDots(ary) {
    for (var i = 0; i < ary.length; ++i) {
      var part = ary[i];
      if (part === '.') {
        ary.splice(i, 1);
        i -= 1;
      } else if (part === '..') {
        if (i === 0 || i === 1 && ary[2] === '..' || ary[i - 1] === '..') {
          continue;
        } else if (i > 0) {
          ary.splice(i - 1, 2);
          i -= 2;
        }
      }
    }
  }

  function relativeToFile(name, file) {
    var fileParts = file && file.split('/');
    var nameParts = name.trim().split('/');

    if (nameParts[0].charAt(0) === '.' && fileParts) {
      var normalizedBaseParts = fileParts.slice(0, fileParts.length - 1);
      nameParts.unshift.apply(nameParts, normalizedBaseParts);
    }

    trimDots(nameParts);

    return nameParts.join('/');
  }

  function join(path1, path2) {
    if (!path1) {
      return path2;
    }

    if (!path2) {
      return path1;
    }

    var schemeMatch = path1.match(/^([^/]*?:)\//);
    var scheme = schemeMatch && schemeMatch.length > 0 ? schemeMatch[1] : '';
    path1 = path1.substr(scheme.length);

    var urlPrefix = void 0;
    if (path1.indexOf('///') === 0 && scheme === 'file:') {
      urlPrefix = '///';
    } else if (path1.indexOf('//') === 0) {
      urlPrefix = '//';
    } else if (path1.indexOf('/') === 0) {
      urlPrefix = '/';
    } else {
      urlPrefix = '';
    }

    var trailingSlash = path2.slice(-1) === '/' ? '/' : '';

    var url1 = path1.split('/');
    var url2 = path2.split('/');
    var url3 = [];

    for (var i = 0, ii = url1.length; i < ii; ++i) {
      if (url1[i] === '..') {
        if (url3.length && url3[url3.length - 1] !== '..') {
          url3.pop();
        } else {
          url3.push(url1[i]);
        }
      } else if (url1[i] === '.' || url1[i] === '') {
        continue;
      } else {
        url3.push(url1[i]);
      }
    }

    for (var _i = 0, _ii = url2.length; _i < _ii; ++_i) {
      if (url2[_i] === '..') {
        if (url3.length && url3[url3.length - 1] !== '..') {
          url3.pop();
        } else {
          url3.push(url2[_i]);
        }
      } else if (url2[_i] === '.' || url2[_i] === '') {
        continue;
      } else {
        url3.push(url2[_i]);
      }
    }

    return scheme + urlPrefix + url3.join('/') + trailingSlash;
  }

  var encode = encodeURIComponent;
  var encodeKey = function encodeKey(k) {
    return encode(k).replace('%24', '$');
  };

  function buildParam(key, value, traditional) {
    var result = [];
    if (value === null || value === undefined) {
      return result;
    }
    if (Array.isArray(value)) {
      for (var i = 0, l = value.length; i < l; i++) {
        if (traditional) {
          result.push(encodeKey(key) + '=' + encode(value[i]));
        } else {
          var arrayKey = key + '[' + (_typeof(value[i]) === 'object' && value[i] !== null ? i : '') + ']';
          result = result.concat(buildParam(arrayKey, value[i]));
        }
      }
    } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !traditional) {
      for (var propertyName in value) {
        result = result.concat(buildParam(key + '[' + propertyName + ']', value[propertyName]));
      }
    } else {
      result.push(encodeKey(key) + '=' + encode(value));
    }
    return result;
  }

  function buildQueryString(params, traditional) {
    var pairs = [];
    var keys = Object.keys(params || {}).sort();
    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];
      pairs = pairs.concat(buildParam(key, params[key], traditional));
    }

    if (pairs.length === 0) {
      return '';
    }

    return pairs.join('&');
  }

  function processScalarParam(existedParam, value) {
    if (Array.isArray(existedParam)) {
      existedParam.push(value);
      return existedParam;
    }
    if (existedParam !== undefined) {
      return [existedParam, value];
    }

    return value;
  }

  function parseComplexParam(queryParams, keys, value) {
    var currentParams = queryParams;
    var keysLastIndex = keys.length - 1;
    for (var j = 0; j <= keysLastIndex; j++) {
      var key = keys[j] === '' ? currentParams.length : keys[j];
      if (j < keysLastIndex) {
        var prevValue = !currentParams[key] || _typeof(currentParams[key]) === 'object' ? currentParams[key] : [currentParams[key]];
        currentParams = currentParams[key] = prevValue || (isNaN(keys[j + 1]) ? {} : []);
      } else {
        currentParams = currentParams[key] = value;
      }
    }
  }

  function parseQueryString(queryString) {
    var queryParams = {};
    if (!queryString || typeof queryString !== 'string') {
      return queryParams;
    }

    var query = queryString;
    if (query.charAt(0) === '?') {
      query = query.substr(1);
    }

    var pairs = query.replace(/\+/g, ' ').split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
      var key = decodeURIComponent(pair[0]);
      if (!key) {
        continue;
      }

      var keys = key.split('][');
      var keysLastIndex = keys.length - 1;

      if (/\[/.test(keys[0]) && /\]$/.test(keys[keysLastIndex])) {
        keys[keysLastIndex] = keys[keysLastIndex].replace(/\]$/, '');
        keys = keys.shift().split('[').concat(keys);
        keysLastIndex = keys.length - 1;
      } else {
        keysLastIndex = 0;
      }

      if (pair.length >= 2) {
        var value = pair[1] ? decodeURIComponent(pair[1]) : '';
        if (keysLastIndex) {
          parseComplexParam(queryParams, keys, value);
        } else {
          queryParams[key] = processScalarParam(queryParams[key], value);
        }
      } else {
        queryParams[key] = true;
      }
    }
    return queryParams;
  }
});;define('aurelia-path', ['aurelia-path/aurelia-path'], function (main) { return main; });

define('aurelia-polyfills/aurelia-polyfills',['aurelia-pal'], function (_aureliaPal) {
  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  if (typeof FEATURE_NO_ES2015 === 'undefined') {

    (function (Object, GOPS) {
      'use strict';

      if (GOPS in Object) return;

      var setDescriptor,
          G = _aureliaPal.PLATFORM.global,
          id = 0,
          random = '' + Math.random(),
          prefix = '__\x01symbol:',
          prefixLength = prefix.length,
          internalSymbol = '__\x01symbol@@' + random,
          DP = 'defineProperty',
          DPies = 'defineProperties',
          GOPN = 'getOwnPropertyNames',
          GOPD = 'getOwnPropertyDescriptor',
          PIE = 'propertyIsEnumerable',
          gOPN = Object[GOPN],
          gOPD = Object[GOPD],
          create = Object.create,
          keys = Object.keys,
          defineProperty = Object[DP],
          $defineProperties = Object[DPies],
          descriptor = gOPD(Object, GOPN),
          ObjectProto = Object.prototype,
          hOP = ObjectProto.hasOwnProperty,
          pIE = ObjectProto[PIE],
          toString = ObjectProto.toString,
          indexOf = Array.prototype.indexOf || function (v) {
        for (var i = this.length; i-- && this[i] !== v;) {}
        return i;
      },
          addInternalIfNeeded = function addInternalIfNeeded(o, uid, enumerable) {
        if (!hOP.call(o, internalSymbol)) {
          defineProperty(o, internalSymbol, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {}
          });
        }
        o[internalSymbol]['@@' + uid] = enumerable;
      },
          createWithSymbols = function createWithSymbols(proto, descriptors) {
        var self = create(proto);
        if (descriptors !== null && (typeof descriptors === 'undefined' ? 'undefined' : _typeof(descriptors)) === 'object') {
          gOPN(descriptors).forEach(function (key) {
            if (propertyIsEnumerable.call(descriptors, key)) {
              $defineProperty(self, key, descriptors[key]);
            }
          });
        }
        return self;
      },
          copyAsNonEnumerable = function copyAsNonEnumerable(descriptor) {
        var newDescriptor = create(descriptor);
        newDescriptor.enumerable = false;
        return newDescriptor;
      },
          get = function get() {},
          onlyNonSymbols = function onlyNonSymbols(name) {
        return name != internalSymbol && !hOP.call(source, name);
      },
          onlySymbols = function onlySymbols(name) {
        return name != internalSymbol && hOP.call(source, name);
      },
          propertyIsEnumerable = function propertyIsEnumerable(key) {
        var uid = '' + key;
        return onlySymbols(uid) ? hOP.call(this, uid) && this[internalSymbol] && this[internalSymbol]['@@' + uid] : pIE.call(this, key);
      },
          setAndGetSymbol = function setAndGetSymbol(uid) {
        var descriptor = {
          enumerable: false,
          configurable: true,
          get: get,
          set: function set(value) {
            setDescriptor(this, uid, {
              enumerable: false,
              configurable: true,
              writable: true,
              value: value
            });
            addInternalIfNeeded(this, uid, true);
          }
        };
        defineProperty(ObjectProto, uid, descriptor);
        return source[uid] = defineProperty(Object(uid), 'constructor', sourceConstructor);
      },
          _Symbol = function _Symbol2(description) {
        if (this && this !== G) {
          throw new TypeError('Symbol is not a constructor');
        }
        return setAndGetSymbol(prefix.concat(description || '', random, ++id));
      },
          source = create(null),
          sourceConstructor = { value: _Symbol },
          sourceMap = function sourceMap(uid) {
        return source[uid];
      },
          $defineProperty = function defineProp(o, key, descriptor) {
        var uid = '' + key;
        if (onlySymbols(uid)) {
          setDescriptor(o, uid, descriptor.enumerable ? copyAsNonEnumerable(descriptor) : descriptor);
          addInternalIfNeeded(o, uid, !!descriptor.enumerable);
        } else {
          defineProperty(o, key, descriptor);
        }
        return o;
      },
          $getOwnPropertySymbols = function getOwnPropertySymbols(o) {
        var cof = toString.call(o);
        o = cof === '[object String]' ? o.split('') : Object(o);
        return gOPN(o).filter(onlySymbols).map(sourceMap);
      };

      descriptor.value = $defineProperty;
      defineProperty(Object, DP, descriptor);

      descriptor.value = $getOwnPropertySymbols;
      defineProperty(Object, GOPS, descriptor);

      var cachedWindowNames = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? Object.getOwnPropertyNames(window) : [];
      var originalObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
      descriptor.value = function getOwnPropertyNames(o) {
        if (toString.call(o) === '[object Window]') {
          try {
            return originalObjectGetOwnPropertyNames(o);
          } catch (e) {
            return [].concat([], cachedWindowNames);
          }
        }
        return gOPN(o).filter(onlyNonSymbols);
      };
      defineProperty(Object, GOPN, descriptor);

      descriptor.value = function defineProperties(o, descriptors) {
        var symbols = $getOwnPropertySymbols(descriptors);
        if (symbols.length) {
          keys(descriptors).concat(symbols).forEach(function (uid) {
            if (propertyIsEnumerable.call(descriptors, uid)) {
              $defineProperty(o, uid, descriptors[uid]);
            }
          });
        } else {
          $defineProperties(o, descriptors);
        }
        return o;
      };
      defineProperty(Object, DPies, descriptor);

      descriptor.value = propertyIsEnumerable;
      defineProperty(ObjectProto, PIE, descriptor);

      descriptor.value = _Symbol;
      defineProperty(G, 'Symbol', descriptor);

      descriptor.value = function (key) {
        var uid = prefix.concat(prefix, key, random);
        return uid in ObjectProto ? source[uid] : setAndGetSymbol(uid);
      };
      defineProperty(_Symbol, 'for', descriptor);

      descriptor.value = function (symbol) {
        return hOP.call(source, symbol) ? symbol.slice(prefixLength * 2, -random.length) : void 0;
      };
      defineProperty(_Symbol, 'keyFor', descriptor);

      descriptor.value = function getOwnPropertyDescriptor(o, key) {
        var descriptor = gOPD(o, key);
        if (descriptor && onlySymbols(key)) {
          descriptor.enumerable = propertyIsEnumerable.call(o, key);
        }
        return descriptor;
      };
      defineProperty(Object, GOPD, descriptor);

      descriptor.value = function (proto, descriptors) {
        return arguments.length === 1 ? create(proto) : createWithSymbols(proto, descriptors);
      };
      defineProperty(Object, 'create', descriptor);

      descriptor.value = function () {
        var str = toString.call(this);
        return str === '[object String]' && onlySymbols(this) ? '[object Symbol]' : str;
      };
      defineProperty(ObjectProto, 'toString', descriptor);

      try {
        setDescriptor = create(defineProperty({}, prefix, {
          get: function get() {
            return defineProperty(this, prefix, { value: false })[prefix];
          }
        }))[prefix] || defineProperty;
      } catch (o_O) {
        setDescriptor = function setDescriptor(o, key, descriptor) {
          var protoDescriptor = gOPD(ObjectProto, key);
          delete ObjectProto[key];
          defineProperty(o, key, descriptor);
          defineProperty(ObjectProto, key, protoDescriptor);
        };
      }
    })(Object, 'getOwnPropertySymbols');

    (function (O, S) {
      var dP = O.defineProperty,
          ObjectProto = O.prototype,
          toString = ObjectProto.toString,
          toStringTag = 'toStringTag',
          descriptor;
      ['iterator', 'match', 'replace', 'search', 'split', 'hasInstance', 'isConcatSpreadable', 'unscopables', 'species', 'toPrimitive', toStringTag].forEach(function (name) {
        if (!(name in Symbol)) {
          dP(Symbol, name, { value: Symbol(name) });
          switch (name) {
            case toStringTag:
              descriptor = O.getOwnPropertyDescriptor(ObjectProto, 'toString');
              descriptor.value = function () {
                var str = toString.call(this),
                    tst = typeof this === 'undefined' || this === null ? undefined : this[Symbol.toStringTag];
                return typeof tst === 'undefined' ? str : '[object ' + tst + ']';
              };
              dP(ObjectProto, 'toString', descriptor);
              break;
          }
        }
      });
    })(Object, Symbol);

    (function (Si, AP, SP) {

      function returnThis() {
        return this;
      }

      if (!AP[Si]) AP[Si] = function () {
        var i = 0,
            self = this,
            iterator = {
          next: function next() {
            var done = self.length <= i;
            return done ? { done: done } : { done: done, value: self[i++] };
          }
        };
        iterator[Si] = returnThis;
        return iterator;
      };

      if (!SP[Si]) SP[Si] = function () {
        var fromCodePoint = String.fromCodePoint,
            self = this,
            i = 0,
            length = self.length,
            iterator = {
          next: function next() {
            var done = length <= i,
                c = done ? '' : fromCodePoint(self.codePointAt(i));
            i += c.length;
            return done ? { done: done } : { done: done, value: c };
          }
        };
        iterator[Si] = returnThis;
        return iterator;
      };
    })(Symbol.iterator, Array.prototype, String.prototype);
  }

  if (typeof FEATURE_NO_ES2015 === 'undefined') {

    Number.isNaN = Number.isNaN || function (value) {
      return value !== value;
    };

    Number.isFinite = Number.isFinite || function (value) {
      return typeof value === "number" && isFinite(value);
    };
  }

  if (!String.prototype.endsWith || function () {
    try {
      return !"ab".endsWith("a", 1);
    } catch (e) {
      return true;
    }
  }()) {
    String.prototype.endsWith = function (searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };
  }

  if (!String.prototype.startsWith || function () {
    try {
      return !"ab".startsWith("b", 1);
    } catch (e) {
      return true;
    }
  }()) {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    };
  }

  if (typeof FEATURE_NO_ES2015 === 'undefined') {

    if (!Array.from) {
      Array.from = function () {
        var toInteger = function toInteger(it) {
          return isNaN(it = +it) ? 0 : (it > 0 ? Math.floor : Math.ceil)(it);
        };
        var toLength = function toLength(it) {
          return it > 0 ? Math.min(toInteger(it), 0x1fffffffffffff) : 0;
        };
        var iterCall = function iterCall(iter, fn, val, index) {
          try {
            return fn(val, index);
          } catch (E) {
            if (typeof iter.return == 'function') iter.return();
            throw E;
          }
        };

        return function from(arrayLike) {
          var O = Object(arrayLike),
              C = typeof this == 'function' ? this : Array,
              aLen = arguments.length,
              mapfn = aLen > 1 ? arguments[1] : undefined,
              mapping = mapfn !== undefined,
              index = 0,
              iterFn = O[Symbol.iterator],
              length,
              result,
              step,
              iterator;
          if (mapping) mapfn = mapfn.bind(aLen > 2 ? arguments[2] : undefined);
          if (iterFn != undefined && !Array.isArray(arrayLike)) {
            for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
              result[index] = mapping ? iterCall(iterator, mapfn, step.value, index) : step.value;
            }
          } else {
            length = toLength(O.length);
            for (result = new C(length); length > index; index++) {
              result[index] = mapping ? mapfn(O[index], index) : O[index];
            }
          }
          result.length = index;
          return result;
        };
      }();
    }

    if (!Array.prototype.find) {
      Object.defineProperty(Array.prototype, 'find', {
        configurable: true,
        writable: true,
        enumerable: false,
        value: function value(predicate) {
          if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
          }
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }
          var list = Object(this);
          var length = list.length >>> 0;
          var thisArg = arguments[1];
          var value;

          for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return value;
            }
          }
          return undefined;
        }
      });
    }

    if (!Array.prototype.findIndex) {
      Object.defineProperty(Array.prototype, 'findIndex', {
        configurable: true,
        writable: true,
        enumerable: false,
        value: function value(predicate) {
          if (this === null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
          }
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }
          var list = Object(this);
          var length = list.length >>> 0;
          var thisArg = arguments[1];
          var value;

          for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return i;
            }
          }
          return -1;
        }
      });
    }
  }

  if (typeof FEATURE_NO_ES2016 === 'undefined' && !Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      configurable: true,
      writable: true,
      enumerable: false,
      value: function value(searchElement) {
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (len === 0) {
          return false;
        }
        var n = parseInt(arguments[1]) || 0;
        var k;
        if (n >= 0) {
          k = n;
        } else {
          k = len + n;
          if (k < 0) {
            k = 0;
          }
        }
        var currentElement;
        while (k < len) {
          currentElement = O[k];
          if (searchElement === currentElement || searchElement !== searchElement && currentElement !== currentElement) {
            return true;
          }
          k++;
        }
        return false;
      }
    });
  }

  if (typeof FEATURE_NO_ES2015 === 'undefined') {

    (function () {
      var needsFix = false;

      try {
        var s = Object.keys('a');
        needsFix = s.length !== 1 || s[0] !== '0';
      } catch (e) {
        needsFix = true;
      }

      if (needsFix) {
        Object.keys = function () {
          var hasOwnProperty = Object.prototype.hasOwnProperty,
              hasDontEnumBug = !{ toString: null }.propertyIsEnumerable('toString'),
              dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
              dontEnumsLength = dontEnums.length;

          return function (obj) {
            if (obj === undefined || obj === null) {
              throw TypeError('Cannot convert undefined or null to object');
            }

            obj = Object(obj);

            var result = [],
                prop,
                i;

            for (prop in obj) {
              if (hasOwnProperty.call(obj, prop)) {
                result.push(prop);
              }
            }

            if (hasDontEnumBug) {
              for (i = 0; i < dontEnumsLength; i++) {
                if (hasOwnProperty.call(obj, dontEnums[i])) {
                  result.push(dontEnums[i]);
                }
              }
            }

            return result;
          };
        }();
      }
    })();

    (function (O) {
      if ('assign' in O) {
        return;
      }

      O.defineProperty(O, 'assign', {
        configurable: true,
        writable: true,
        value: function () {
          var gOPS = O.getOwnPropertySymbols,
              pIE = O.propertyIsEnumerable,
              filterOS = gOPS ? function (self) {
            return gOPS(self).filter(pIE, self);
          } : function () {
            return Array.prototype;
          };

          return function assign(where) {
            if (gOPS && !(where instanceof O)) {
              console.warn('problematic Symbols', where);
            }

            function set(keyOrSymbol) {
              where[keyOrSymbol] = arg[keyOrSymbol];
            }

            for (var i = 1, ii = arguments.length; i < ii; ++i) {
              var arg = arguments[i];

              if (arg === null || arg === undefined) {
                continue;
              }

              O.keys(arg).concat(filterOS(arg)).forEach(set);
            }

            return where;
          };
        }()
      });
    })(Object);

    if (!Object.is) {
      Object.is = function (x, y) {
        if (x === y) {
          return x !== 0 || 1 / x === 1 / y;
        } else {
          return x !== x && y !== y;
        }
      };
    }
  }

  if (typeof FEATURE_NO_ES2015 === 'undefined') {

    (function (global) {
      var i;

      var defineProperty = Object.defineProperty,
          is = function is(a, b) {
        return a === b || a !== a && b !== b;
      };

      if (typeof WeakMap == 'undefined') {
        global.WeakMap = createCollection({
          'delete': sharedDelete,

          clear: sharedClear,

          get: sharedGet,

          has: mapHas,

          set: sharedSet
        }, true);
      }

      if (typeof Map == 'undefined' || typeof new Map().values !== 'function' || !new Map().values().next) {
        var _createCollection;

        global.Map = createCollection((_createCollection = {
          'delete': sharedDelete,

          has: mapHas,

          get: sharedGet,

          set: sharedSet,

          keys: sharedKeys,

          values: sharedValues,

          entries: mapEntries,

          forEach: sharedForEach,

          clear: sharedClear
        }, _createCollection[Symbol.iterator] = mapEntries, _createCollection));
      }

      if (typeof Set == 'undefined' || typeof new Set().values !== 'function' || !new Set().values().next) {
        var _createCollection2;

        global.Set = createCollection((_createCollection2 = {
          has: setHas,

          add: sharedAdd,

          'delete': sharedDelete,

          clear: sharedClear,

          keys: sharedValues,
          values: sharedValues,

          entries: setEntries,

          forEach: sharedForEach
        }, _createCollection2[Symbol.iterator] = sharedValues, _createCollection2));
      }

      if (typeof WeakSet == 'undefined') {
        global.WeakSet = createCollection({
          'delete': sharedDelete,

          add: sharedAdd,

          clear: sharedClear,

          has: setHas
        }, true);
      }

      function createCollection(proto, objectOnly) {
        function Collection(a) {
          if (!this || this.constructor !== Collection) return new Collection(a);
          this._keys = [];
          this._values = [];
          this._itp = [];
          this.objectOnly = objectOnly;

          if (a) init.call(this, a);
        }

        if (!objectOnly) {
          defineProperty(proto, 'size', {
            get: sharedSize
          });
        }

        proto.constructor = Collection;
        Collection.prototype = proto;

        return Collection;
      }

      function init(a) {
        var i;

        if (this.add) a.forEach(this.add, this);else a.forEach(function (a) {
            this.set(a[0], a[1]);
          }, this);
      }

      function sharedDelete(key) {
        if (this.has(key)) {
          this._keys.splice(i, 1);
          this._values.splice(i, 1);

          this._itp.forEach(function (p) {
            if (i < p[0]) p[0]--;
          });
        }

        return -1 < i;
      };

      function sharedGet(key) {
        return this.has(key) ? this._values[i] : undefined;
      }

      function has(list, key) {
        if (this.objectOnly && key !== Object(key)) throw new TypeError("Invalid value used as weak collection key");

        if (key != key || key === 0) for (i = list.length; i-- && !is(list[i], key);) {} else i = list.indexOf(key);
        return -1 < i;
      }

      function setHas(value) {
        return has.call(this, this._values, value);
      }

      function mapHas(value) {
        return has.call(this, this._keys, value);
      }

      function sharedSet(key, value) {
        this.has(key) ? this._values[i] = value : this._values[this._keys.push(key) - 1] = value;
        return this;
      }

      function sharedAdd(value) {
        if (!this.has(value)) this._values.push(value);
        return this;
      }

      function sharedClear() {
        (this._keys || 0).length = this._values.length = 0;
      }

      function sharedKeys() {
        return sharedIterator(this._itp, this._keys);
      }

      function sharedValues() {
        return sharedIterator(this._itp, this._values);
      }

      function mapEntries() {
        return sharedIterator(this._itp, this._keys, this._values);
      }

      function setEntries() {
        return sharedIterator(this._itp, this._values, this._values);
      }

      function sharedIterator(itp, array, array2) {
        var _ref;

        var p = [0],
            done = false;
        itp.push(p);
        return _ref = {}, _ref[Symbol.iterator] = function () {
          return this;
        }, _ref.next = function next() {
          var v,
              k = p[0];
          if (!done && k < array.length) {
            v = array2 ? [array[k], array2[k]] : array[k];
            p[0]++;
          } else {
            done = true;
            itp.splice(itp.indexOf(p), 1);
          }
          return { done: done, value: v };
        }, _ref;
      }

      function sharedSize() {
        return this._values.length;
      }

      function sharedForEach(callback, context) {
        var it = this.entries();
        for (;;) {
          var r = it.next();
          if (r.done) break;
          callback.call(context, r.value[1], r.value[0], this);
        }
      }
    })(_aureliaPal.PLATFORM.global);
  }

  if (typeof FEATURE_NO_ES2015 === 'undefined') {

    var bind = Function.prototype.bind;

    if (typeof _aureliaPal.PLATFORM.global.Reflect === 'undefined') {
      _aureliaPal.PLATFORM.global.Reflect = {};
    }

    if (typeof Reflect.defineProperty !== 'function') {
      Reflect.defineProperty = function (target, propertyKey, descriptor) {
        if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object' ? target === null : typeof target !== 'function') {
          throw new TypeError('Reflect.defineProperty called on non-object');
        }
        try {
          Object.defineProperty(target, propertyKey, descriptor);
          return true;
        } catch (e) {
          return false;
        }
      };
    }

    if (typeof Reflect.construct !== 'function') {
      Reflect.construct = function (Target, args) {
        if (args) {
          switch (args.length) {
            case 0:
              return new Target();
            case 1:
              return new Target(args[0]);
            case 2:
              return new Target(args[0], args[1]);
            case 3:
              return new Target(args[0], args[1], args[2]);
            case 4:
              return new Target(args[0], args[1], args[2], args[3]);
          }
        }

        var a = [null];
        a.push.apply(a, args);
        return new (bind.apply(Target, a))();
      };
    }

    if (typeof Reflect.ownKeys !== 'function') {
      Reflect.ownKeys = function (o) {
        return Object.getOwnPropertyNames(o).concat(Object.getOwnPropertySymbols(o));
      };
    }
  }

  if (typeof FEATURE_NO_ESNEXT === 'undefined') {

    var emptyMetadata = Object.freeze({});
    var metadataContainerKey = '__metadata__';

    if (typeof Reflect.getOwnMetadata !== 'function') {
      Reflect.getOwnMetadata = function (metadataKey, target, targetKey) {
        if (target.hasOwnProperty(metadataContainerKey)) {
          return (target[metadataContainerKey][targetKey] || emptyMetadata)[metadataKey];
        }
      };
    }

    if (typeof Reflect.defineMetadata !== 'function') {
      Reflect.defineMetadata = function (metadataKey, metadataValue, target, targetKey) {
        var metadataContainer = target.hasOwnProperty(metadataContainerKey) ? target[metadataContainerKey] : target[metadataContainerKey] = {};
        var targetContainer = metadataContainer[targetKey] || (metadataContainer[targetKey] = {});
        targetContainer[metadataKey] = metadataValue;
      };
    }

    if (typeof Reflect.metadata !== 'function') {
      Reflect.metadata = function (metadataKey, metadataValue) {
        return function (target, targetKey) {
          Reflect.defineMetadata(metadataKey, metadataValue, target, targetKey);
        };
      };
    }
  }
});;define('aurelia-polyfills', ['aurelia-polyfills/aurelia-polyfills'], function (main) { return main; });

define('aurelia-route-recognizer/aurelia-route-recognizer',['exports', 'aurelia-path'], function (exports, _aureliaPath) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.RouteRecognizer = exports.EpsilonSegment = exports.StarSegment = exports.DynamicSegment = exports.StaticSegment = exports.State = undefined;



  var State = exports.State = function () {
    function State(charSpec) {


      this.charSpec = charSpec;
      this.nextStates = [];
    }

    State.prototype.get = function get(charSpec) {
      for (var _iterator = this.nextStates, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var child = _ref;

        var isEqual = child.charSpec.validChars === charSpec.validChars && child.charSpec.invalidChars === charSpec.invalidChars;

        if (isEqual) {
          return child;
        }
      }

      return undefined;
    };

    State.prototype.put = function put(charSpec) {
      var state = this.get(charSpec);

      if (state) {
        return state;
      }

      state = new State(charSpec);

      this.nextStates.push(state);

      if (charSpec.repeat) {
        state.nextStates.push(state);
      }

      return state;
    };

    State.prototype.match = function match(ch) {
      var nextStates = this.nextStates;
      var results = [];

      for (var i = 0, l = nextStates.length; i < l; i++) {
        var child = nextStates[i];
        var charSpec = child.charSpec;

        if (charSpec.validChars !== undefined) {
          if (charSpec.validChars.indexOf(ch) !== -1) {
            results.push(child);
          }
        } else if (charSpec.invalidChars !== undefined) {
          if (charSpec.invalidChars.indexOf(ch) === -1) {
            results.push(child);
          }
        }
      }

      return results;
    };

    return State;
  }();

  var specials = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'];

  var escapeRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');

  var StaticSegment = exports.StaticSegment = function () {
    function StaticSegment(string, caseSensitive) {


      this.string = string;
      this.caseSensitive = caseSensitive;
    }

    StaticSegment.prototype.eachChar = function eachChar(callback) {
      var s = this.string;
      for (var i = 0, ii = s.length; i < ii; ++i) {
        var ch = s[i];
        callback({ validChars: this.caseSensitive ? ch : ch.toUpperCase() + ch.toLowerCase() });
      }
    };

    StaticSegment.prototype.regex = function regex() {
      return this.string.replace(escapeRegex, '\\$1');
    };

    StaticSegment.prototype.generate = function generate() {
      return this.string;
    };

    return StaticSegment;
  }();

  var DynamicSegment = exports.DynamicSegment = function () {
    function DynamicSegment(name, optional) {


      this.name = name;
      this.optional = optional;
    }

    DynamicSegment.prototype.eachChar = function eachChar(callback) {
      callback({ invalidChars: '/', repeat: true });
    };

    DynamicSegment.prototype.regex = function regex() {
      return '([^/]+)';
    };

    DynamicSegment.prototype.generate = function generate(params, consumed) {
      consumed[this.name] = true;
      return params[this.name];
    };

    return DynamicSegment;
  }();

  var StarSegment = exports.StarSegment = function () {
    function StarSegment(name) {


      this.name = name;
    }

    StarSegment.prototype.eachChar = function eachChar(callback) {
      callback({ invalidChars: '', repeat: true });
    };

    StarSegment.prototype.regex = function regex() {
      return '(.+)';
    };

    StarSegment.prototype.generate = function generate(params, consumed) {
      consumed[this.name] = true;
      return params[this.name];
    };

    return StarSegment;
  }();

  var EpsilonSegment = exports.EpsilonSegment = function () {
    function EpsilonSegment() {

    }

    EpsilonSegment.prototype.eachChar = function eachChar() {};

    EpsilonSegment.prototype.regex = function regex() {
      return '';
    };

    EpsilonSegment.prototype.generate = function generate() {
      return '';
    };

    return EpsilonSegment;
  }();

  var RouteRecognizer = exports.RouteRecognizer = function () {
    function RouteRecognizer() {


      this.rootState = new State();
      this.names = {};
      this.routes = new Map();
    }

    RouteRecognizer.prototype.add = function add(route) {
      var _this = this;

      if (Array.isArray(route)) {
        route.forEach(function (r) {
          return _this.add(r);
        });
        return undefined;
      }

      var currentState = this.rootState;
      var skippableStates = [];
      var regex = '^';
      var types = { statics: 0, dynamics: 0, stars: 0 };
      var names = [];
      var routeName = route.handler.name;
      var isEmpty = true;
      var segments = parse(route.path, names, types, route.caseSensitive);

      for (var i = 0, ii = segments.length; i < ii; i++) {
        var segment = segments[i];
        if (segment instanceof EpsilonSegment) {
          continue;
        }

        var _addSegment = addSegment(currentState, segment),
            firstState = _addSegment[0],
            nextState = _addSegment[1];

        for (var j = 0, jj = skippableStates.length; j < jj; j++) {
          skippableStates[j].nextStates.push(firstState);
        }

        if (segment.optional) {
          skippableStates.push(nextState);
          regex += '(?:/' + segment.regex() + ')?';
        } else {
          currentState = nextState;
          regex += '/' + segment.regex();
          skippableStates.length = 0;
          isEmpty = false;
        }
      }

      if (isEmpty) {
        currentState = currentState.put({ validChars: '/' });
        regex += '/?';
      }

      var handlers = [{ handler: route.handler, names: names }];

      this.routes.set(route.handler, { segments: segments, handlers: handlers });
      if (routeName) {
        var routeNames = Array.isArray(routeName) ? routeName : [routeName];
        for (var _i2 = 0; _i2 < routeNames.length; _i2++) {
          if (!(routeNames[_i2] in this.names)) {
            this.names[routeNames[_i2]] = { segments: segments, handlers: handlers };
          }
        }
      }

      for (var _i3 = 0; _i3 < skippableStates.length; _i3++) {
        var state = skippableStates[_i3];
        state.handlers = handlers;
        state.regex = new RegExp(regex + '$', route.caseSensitive ? '' : 'i');
        state.types = types;
      }

      currentState.handlers = handlers;
      currentState.regex = new RegExp(regex + '$', route.caseSensitive ? '' : 'i');
      currentState.types = types;

      return currentState;
    };

    RouteRecognizer.prototype.getRoute = function getRoute(nameOrRoute) {
      return typeof nameOrRoute === 'string' ? this.names[nameOrRoute] : this.routes.get(nameOrRoute);
    };

    RouteRecognizer.prototype.handlersFor = function handlersFor(nameOrRoute) {
      var route = this.getRoute(nameOrRoute);
      if (!route) {
        throw new Error('There is no route named ' + nameOrRoute);
      }

      return [].concat(route.handlers);
    };

    RouteRecognizer.prototype.hasRoute = function hasRoute(nameOrRoute) {
      return !!this.getRoute(nameOrRoute);
    };

    RouteRecognizer.prototype.generate = function generate(nameOrRoute, params) {
      var route = this.getRoute(nameOrRoute);
      if (!route) {
        throw new Error('There is no route named ' + nameOrRoute);
      }

      var handler = route.handlers[0].handler;
      if (handler.generationUsesHref) {
        return handler.href;
      }

      var routeParams = Object.assign({}, params);
      var segments = route.segments;
      var consumed = {};
      var output = '';

      for (var i = 0, l = segments.length; i < l; i++) {
        var segment = segments[i];

        if (segment instanceof EpsilonSegment) {
          continue;
        }

        var segmentValue = segment.generate(routeParams, consumed);
        if (segmentValue === null || segmentValue === undefined) {
          if (!segment.optional) {
            throw new Error('A value is required for route parameter \'' + segment.name + '\' in route \'' + nameOrRoute + '\'.');
          }
        } else {
          output += '/';
          output += segmentValue;
        }
      }

      if (output.charAt(0) !== '/') {
        output = '/' + output;
      }

      for (var param in consumed) {
        delete routeParams[param];
      }

      var queryString = (0, _aureliaPath.buildQueryString)(routeParams);
      output += queryString ? '?' + queryString : '';

      return output;
    };

    RouteRecognizer.prototype.recognize = function recognize(path) {
      var states = [this.rootState];
      var queryParams = {};
      var isSlashDropped = false;
      var normalizedPath = path;

      var queryStart = normalizedPath.indexOf('?');
      if (queryStart !== -1) {
        var queryString = normalizedPath.substr(queryStart + 1, normalizedPath.length);
        normalizedPath = normalizedPath.substr(0, queryStart);
        queryParams = (0, _aureliaPath.parseQueryString)(queryString);
      }

      normalizedPath = decodeURI(normalizedPath);

      if (normalizedPath.charAt(0) !== '/') {
        normalizedPath = '/' + normalizedPath;
      }

      var pathLen = normalizedPath.length;
      if (pathLen > 1 && normalizedPath.charAt(pathLen - 1) === '/') {
        normalizedPath = normalizedPath.substr(0, pathLen - 1);
        isSlashDropped = true;
      }

      for (var i = 0, l = normalizedPath.length; i < l; i++) {
        states = recognizeChar(states, normalizedPath.charAt(i));
        if (!states.length) {
          break;
        }
      }

      var solutions = [];
      for (var _i4 = 0, _l = states.length; _i4 < _l; _i4++) {
        if (states[_i4].handlers) {
          solutions.push(states[_i4]);
        }
      }

      states = sortSolutions(solutions);

      var state = solutions[0];
      if (state && state.handlers) {
        if (isSlashDropped && state.regex.source.slice(-5) === '(.+)$') {
          normalizedPath = normalizedPath + '/';
        }

        return findHandler(state, normalizedPath, queryParams);
      }
    };

    return RouteRecognizer;
  }();

  var RecognizeResults = function RecognizeResults(queryParams) {


    this.splice = Array.prototype.splice;
    this.slice = Array.prototype.slice;
    this.push = Array.prototype.push;
    this.length = 0;
    this.queryParams = queryParams || {};
  };

  function parse(route, names, types, caseSensitive) {
    var normalizedRoute = route;
    if (route.charAt(0) === '/') {
      normalizedRoute = route.substr(1);
    }

    var results = [];

    var splitRoute = normalizedRoute.split('/');
    for (var i = 0, ii = splitRoute.length; i < ii; ++i) {
      var segment = splitRoute[i];

      var match = segment.match(/^:([^?]+)(\?)?$/);
      if (match) {
        var _match = match,
            _name = _match[1],
            optional = _match[2];

        if (_name.indexOf('=') !== -1) {
          throw new Error('Parameter ' + _name + ' in route ' + route + ' has a default value, which is not supported.');
        }
        results.push(new DynamicSegment(_name, !!optional));
        names.push(_name);
        types.dynamics++;
        continue;
      }

      match = segment.match(/^\*(.+)$/);
      if (match) {
        results.push(new StarSegment(match[1]));
        names.push(match[1]);
        types.stars++;
      } else if (segment === '') {
        results.push(new EpsilonSegment());
      } else {
        results.push(new StaticSegment(segment, caseSensitive));
        types.statics++;
      }
    }

    return results;
  }

  function sortSolutions(states) {
    return states.sort(function (a, b) {
      if (a.types.stars !== b.types.stars) {
        return a.types.stars - b.types.stars;
      }

      if (a.types.stars) {
        if (a.types.statics !== b.types.statics) {
          return b.types.statics - a.types.statics;
        }
        if (a.types.dynamics !== b.types.dynamics) {
          return b.types.dynamics - a.types.dynamics;
        }
      }

      if (a.types.dynamics !== b.types.dynamics) {
        return a.types.dynamics - b.types.dynamics;
      }

      if (a.types.statics !== b.types.statics) {
        return b.types.statics - a.types.statics;
      }

      return 0;
    });
  }

  function recognizeChar(states, ch) {
    var nextStates = [];

    for (var i = 0, l = states.length; i < l; i++) {
      var state = states[i];
      nextStates.push.apply(nextStates, state.match(ch));
    }

    return nextStates;
  }

  function findHandler(state, path, queryParams) {
    var handlers = state.handlers;
    var regex = state.regex;
    var captures = path.match(regex);
    var currentCapture = 1;
    var result = new RecognizeResults(queryParams);

    for (var i = 0, l = handlers.length; i < l; i++) {
      var _handler = handlers[i];
      var _names = _handler.names;
      var _params = {};

      for (var j = 0, m = _names.length; j < m; j++) {
        _params[_names[j]] = captures[currentCapture++];
      }

      result.push({ handler: _handler.handler, params: _params, isDynamic: !!_names.length });
    }

    return result;
  }

  function addSegment(currentState, segment) {
    var firstState = currentState.put({ validChars: '/' });
    var nextState = firstState;
    segment.eachChar(function (ch) {
      nextState = nextState.put(ch);
    });

    return [firstState, nextState];
  }
});;define('aurelia-route-recognizer', ['aurelia-route-recognizer/aurelia-route-recognizer'], function (main) { return main; });

define('aurelia-router', ['exports', 'aurelia-logging', 'aurelia-dependency-injection', 'aurelia-history', 'aurelia-route-recognizer', 'aurelia-event-aggregator'], function (exports, LogManager, aureliaDependencyInjection, aureliaHistory, aureliaRouteRecognizer, aureliaEventAggregator) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    /**
     * Class used to represent an instruction during a navigation.
     */
    var NavigationInstruction = /** @class */ (function () {
        function NavigationInstruction(init) {
            /**
             * Current built viewport plan of this nav instruction
             */
            this.plan = null;
            this.options = {};
            Object.assign(this, init);
            this.params = this.params || {};
            this.viewPortInstructions = {};
            var ancestorParams = [];
            var current = this;
            do {
                var currentParams = Object.assign({}, current.params);
                if (current.config && current.config.hasChildRouter) {
                    // remove the param for the injected child route segment
                    delete currentParams[current.getWildCardName()];
                }
                ancestorParams.unshift(currentParams);
                current = current.parentInstruction;
            } while (current);
            var allParams = Object.assign.apply(Object, [{}, this.queryParams].concat(ancestorParams));
            this.lifecycleArgs = [allParams, this.config, this];
        }
        /**
         * Gets an array containing this instruction and all child instructions for the current navigation.
         */
        NavigationInstruction.prototype.getAllInstructions = function () {
            var instructions = [this];
            var viewPortInstructions = this.viewPortInstructions;
            for (var key in viewPortInstructions) {
                var childInstruction = viewPortInstructions[key].childNavigationInstruction;
                if (childInstruction) {
                    instructions.push.apply(instructions, childInstruction.getAllInstructions());
                }
            }
            return instructions;
        };
        /**
         * Gets an array containing the instruction and all child instructions for the previous navigation.
         * Previous instructions are no longer available after navigation completes.
         */
        NavigationInstruction.prototype.getAllPreviousInstructions = function () {
            return this.getAllInstructions().map(function (c) { return c.previousInstruction; }).filter(function (c) { return c; });
        };
        NavigationInstruction.prototype.addViewPortInstruction = function (nameOrInitOptions, strategy, moduleId, component) {
            var viewPortInstruction;
            var viewPortName = typeof nameOrInitOptions === 'string' ? nameOrInitOptions : nameOrInitOptions.name;
            var lifecycleArgs = this.lifecycleArgs;
            var config = Object.assign({}, lifecycleArgs[1], { currentViewPort: viewPortName });
            if (typeof nameOrInitOptions === 'string') {
                viewPortInstruction = {
                    name: nameOrInitOptions,
                    strategy: strategy,
                    moduleId: moduleId,
                    component: component,
                    childRouter: component.childRouter,
                    lifecycleArgs: [lifecycleArgs[0], config, lifecycleArgs[2]]
                };
            }
            else {
                viewPortInstruction = {
                    name: viewPortName,
                    strategy: nameOrInitOptions.strategy,
                    component: nameOrInitOptions.component,
                    moduleId: nameOrInitOptions.moduleId,
                    childRouter: nameOrInitOptions.component.childRouter,
                    lifecycleArgs: [lifecycleArgs[0], config, lifecycleArgs[2]]
                };
            }
            return this.viewPortInstructions[viewPortName] = viewPortInstruction;
        };
        /**
         * Gets the name of the route pattern's wildcard parameter, if applicable.
         */
        NavigationInstruction.prototype.getWildCardName = function () {
            // todo: potential issue, or at least unsafe typings
            var configRoute = this.config.route;
            var wildcardIndex = configRoute.lastIndexOf('*');
            return configRoute.substr(wildcardIndex + 1);
        };
        /**
         * Gets the path and query string created by filling the route
         * pattern's wildcard parameter with the matching param.
         */
        NavigationInstruction.prototype.getWildcardPath = function () {
            var wildcardName = this.getWildCardName();
            var path = this.params[wildcardName] || '';
            var queryString = this.queryString;
            if (queryString) {
                path += '?' + queryString;
            }
            return path;
        };
        /**
         * Gets the instruction's base URL, accounting for wildcard route parameters.
         */
        NavigationInstruction.prototype.getBaseUrl = function () {
            var _this = this;
            var $encodeURI = encodeURI;
            var fragment = decodeURI(this.fragment);
            if (fragment === '') {
                var nonEmptyRoute = this.router.routes.find(function (route) {
                    return route.name === _this.config.name &&
                        route.route !== '';
                });
                if (nonEmptyRoute) {
                    fragment = nonEmptyRoute.route;
                }
            }
            if (!this.params) {
                return $encodeURI(fragment);
            }
            var wildcardName = this.getWildCardName();
            var path = this.params[wildcardName] || '';
            if (!path) {
                return $encodeURI(fragment);
            }
            return $encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
        };
        /**
         * Finalize a viewport instruction
         * @internal
         */
        NavigationInstruction.prototype._commitChanges = function (waitToSwap) {
            var _this = this;
            var router = this.router;
            router.currentInstruction = this;
            var previousInstruction = this.previousInstruction;
            if (previousInstruction) {
                previousInstruction.config.navModel.isActive = false;
            }
            this.config.navModel.isActive = true;
            router.refreshNavigation();
            var loads = [];
            var delaySwaps = [];
            var viewPortInstructions = this.viewPortInstructions;
            var _loop_1 = function (viewPortName) {
                var viewPortInstruction = viewPortInstructions[viewPortName];
                var viewPort = router.viewPorts[viewPortName];
                if (!viewPort) {
                    throw new Error("There was no router-view found in the view for " + viewPortInstruction.moduleId + ".");
                }
                var childNavInstruction = viewPortInstruction.childNavigationInstruction;
                if (viewPortInstruction.strategy === "replace" /* Replace */) {
                    if (childNavInstruction && childNavInstruction.parentCatchHandler) {
                        loads.push(childNavInstruction._commitChanges(waitToSwap));
                    }
                    else {
                        if (waitToSwap) {
                            delaySwaps.push({ viewPort: viewPort, viewPortInstruction: viewPortInstruction });
                        }
                        loads.push(viewPort
                            .process(viewPortInstruction, waitToSwap)
                            .then(function () { return childNavInstruction
                            ? childNavInstruction._commitChanges(waitToSwap)
                            : Promise.resolve(); }));
                    }
                }
                else {
                    if (childNavInstruction) {
                        loads.push(childNavInstruction._commitChanges(waitToSwap));
                    }
                }
            };
            for (var viewPortName in viewPortInstructions) {
                _loop_1(viewPortName);
            }
            return Promise
                .all(loads)
                .then(function () {
                delaySwaps.forEach(function (x) { return x.viewPort.swap(x.viewPortInstruction); });
                return null;
            })
                .then(function () { return prune(_this); });
        };
        /**@internal */
        NavigationInstruction.prototype._updateTitle = function () {
            var router = this.router;
            var title = this._buildTitle(router.titleSeparator);
            if (title) {
                router.history.setTitle(title);
            }
        };
        /**@internal */
        NavigationInstruction.prototype._buildTitle = function (separator) {
            if (separator === void 0) { separator = ' | '; }
            var title = '';
            var childTitles = [];
            var navModelTitle = this.config.navModel.title;
            var instructionRouter = this.router;
            var viewPortInstructions = this.viewPortInstructions;
            if (navModelTitle) {
                title = instructionRouter.transformTitle(navModelTitle);
            }
            for (var viewPortName in viewPortInstructions) {
                var viewPortInstruction = viewPortInstructions[viewPortName];
                var child_nav_instruction = viewPortInstruction.childNavigationInstruction;
                if (child_nav_instruction) {
                    var childTitle = child_nav_instruction._buildTitle(separator);
                    if (childTitle) {
                        childTitles.push(childTitle);
                    }
                }
            }
            if (childTitles.length) {
                title = childTitles.join(separator) + (title ? separator : '') + title;
            }
            if (instructionRouter.title) {
                title += (title ? separator : '') + instructionRouter.transformTitle(instructionRouter.title);
            }
            return title;
        };
        return NavigationInstruction;
    }());
    var prune = function (instruction) {
        instruction.previousInstruction = null;
        instruction.plan = null;
    };

    /**
    * Class for storing and interacting with a route's navigation settings.
    */
    var NavModel = /** @class */ (function () {
        function NavModel(router, relativeHref) {
            /**
            * True if this nav item is currently active.
            */
            this.isActive = false;
            /**
            * The title.
            */
            this.title = null;
            /**
            * This nav item's absolute href.
            */
            this.href = null;
            /**
            * This nav item's relative href.
            */
            this.relativeHref = null;
            /**
            * Data attached to the route at configuration time.
            */
            this.settings = {};
            /**
            * The route config.
            */
            this.config = null;
            this.router = router;
            this.relativeHref = relativeHref;
        }
        /**
        * Sets the route's title and updates document.title.
        *  If the a navigation is in progress, the change will be applied
        *  to document.title when the navigation completes.
        *
        * @param title The new title.
        */
        NavModel.prototype.setTitle = function (title) {
            this.title = title;
            if (this.isActive) {
                this.router.updateTitle();
            }
        };
        return NavModel;
    }());

    function _normalizeAbsolutePath(path, hasPushState, absolute) {
        if (absolute === void 0) { absolute = false; }
        if (!hasPushState && path[0] !== '#') {
            path = '#' + path;
        }
        if (hasPushState && absolute) {
            path = path.substring(1, path.length);
        }
        return path;
    }
    function _createRootedPath(fragment, baseUrl, hasPushState, absolute) {
        if (isAbsoluteUrl.test(fragment)) {
            return fragment;
        }
        var path = '';
        if (baseUrl.length && baseUrl[0] !== '/') {
            path += '/';
        }
        path += baseUrl;
        if ((!path.length || path[path.length - 1] !== '/') && fragment[0] !== '/') {
            path += '/';
        }
        if (path.length && path[path.length - 1] === '/' && fragment[0] === '/') {
            path = path.substring(0, path.length - 1);
        }
        return _normalizeAbsolutePath(path + fragment, hasPushState, absolute);
    }
    function _resolveUrl(fragment, baseUrl, hasPushState) {
        if (isRootedPath.test(fragment)) {
            return _normalizeAbsolutePath(fragment, hasPushState);
        }
        return _createRootedPath(fragment, baseUrl, hasPushState);
    }
    function _ensureArrayWithSingleRoutePerConfig(config) {
        var routeConfigs = [];
        if (Array.isArray(config.route)) {
            for (var i = 0, ii = config.route.length; i < ii; ++i) {
                var current = Object.assign({}, config);
                current.route = config.route[i];
                routeConfigs.push(current);
            }
        }
        else {
            routeConfigs.push(Object.assign({}, config));
        }
        return routeConfigs;
    }
    var isRootedPath = /^#?\//;
    var isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

    /**
     * Class used to configure a [[Router]] instance.
     *
     * @constructor
     */
    var RouterConfiguration = /** @class */ (function () {
        function RouterConfiguration() {
            this.instructions = [];
            this.options = {};
            this.pipelineSteps = [];
        }
        /**
         * Adds a step to be run during the [[Router]]'s navigation pipeline.
         *
         * @param name The name of the pipeline slot to insert the step into.
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPipelineStep = function (name, step) {
            if (step === null || step === undefined) {
                throw new Error('Pipeline step cannot be null or undefined.');
            }
            this.pipelineSteps.push({ name: name, step: step });
            return this;
        };
        /**
         * Adds a step to be run during the [[Router]]'s authorize pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addAuthorizeStep = function (step) {
            return this.addPipelineStep("authorize" /* Authorize */, step);
        };
        /**
         * Adds a step to be run during the [[Router]]'s preActivate pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPreActivateStep = function (step) {
            return this.addPipelineStep("preActivate" /* PreActivate */, step);
        };
        /**
         * Adds a step to be run during the [[Router]]'s preRender pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPreRenderStep = function (step) {
            return this.addPipelineStep("preRender" /* PreRender */, step);
        };
        /**
         * Adds a step to be run during the [[Router]]'s postRender pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPostRenderStep = function (step) {
            return this.addPipelineStep("postRender" /* PostRender */, step);
        };
        /**
         * Configures a route that will be used if there is no previous location available on navigation cancellation.
         *
         * @param fragment The URL fragment to use as the navigation destination.
         * @chainable
         */
        RouterConfiguration.prototype.fallbackRoute = function (fragment) {
            this._fallbackRoute = fragment;
            return this;
        };
        /**
         * Maps one or more routes to be registered with the router.
         *
         * @param route The [[RouteConfig]] to map, or an array of [[RouteConfig]] to map.
         * @chainable
         */
        RouterConfiguration.prototype.map = function (route) {
            var _this = this;
            if (Array.isArray(route)) {
                route.forEach(function (r) { return _this.map(r); });
                return this;
            }
            return this.mapRoute(route);
        };
        /**
         * Configures defaults to use for any view ports.
         *
         * @param viewPortConfig a view port configuration object to use as a
         *  default, of the form { viewPortName: { moduleId } }.
         * @chainable
         */
        RouterConfiguration.prototype.useViewPortDefaults = function (viewPortConfig) {
            this.viewPortDefaults = viewPortConfig;
            return this;
        };
        /**
         * Maps a single route to be registered with the router.
         *
         * @param route The [[RouteConfig]] to map.
         * @chainable
         */
        RouterConfiguration.prototype.mapRoute = function (config) {
            this.instructions.push(function (router) {
                var routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);
                var navModel;
                for (var i = 0, ii = routeConfigs.length; i < ii; ++i) {
                    var routeConfig = routeConfigs[i];
                    routeConfig.settings = routeConfig.settings || {};
                    if (!navModel) {
                        navModel = router.createNavModel(routeConfig);
                    }
                    router.addRoute(routeConfig, navModel);
                }
            });
            return this;
        };
        /**
         * Registers an unknown route handler to be run when the URL fragment doesn't match any registered routes.
         *
         * @param config A string containing a moduleId to load, or a [[RouteConfig]], or a function that takes the
         *  [[NavigationInstruction]] and selects a moduleId to load.
         * @chainable
         */
        RouterConfiguration.prototype.mapUnknownRoutes = function (config) {
            this.unknownRouteConfig = config;
            return this;
        };
        /**
         * Applies the current configuration to the specified [[Router]].
         *
         * @param router The [[Router]] to apply the configuration to.
         */
        RouterConfiguration.prototype.exportToRouter = function (router) {
            var instructions = this.instructions;
            for (var i = 0, ii = instructions.length; i < ii; ++i) {
                instructions[i](router);
            }
            var _a = this, title = _a.title, titleSeparator = _a.titleSeparator, unknownRouteConfig = _a.unknownRouteConfig, _fallbackRoute = _a._fallbackRoute, viewPortDefaults = _a.viewPortDefaults;
            if (title) {
                router.title = title;
            }
            if (titleSeparator) {
                router.titleSeparator = titleSeparator;
            }
            if (unknownRouteConfig) {
                router.handleUnknownRoutes(unknownRouteConfig);
            }
            if (_fallbackRoute) {
                router.fallbackRoute = _fallbackRoute;
            }
            if (viewPortDefaults) {
                router.useViewPortDefaults(viewPortDefaults);
            }
            Object.assign(router.options, this.options);
            var pipelineSteps = this.pipelineSteps;
            var pipelineStepCount = pipelineSteps.length;
            if (pipelineStepCount) {
                if (!router.isRoot) {
                    throw new Error('Pipeline steps can only be added to the root router');
                }
                var pipelineProvider = router.pipelineProvider;
                for (var i = 0, ii = pipelineStepCount; i < ii; ++i) {
                    var _b = pipelineSteps[i], name_1 = _b.name, step = _b.step;
                    pipelineProvider.addStep(name_1, step);
                }
            }
        };
        return RouterConfiguration;
    }());

    /**
     * The primary class responsible for handling routing and navigation.
     */
    var Router = /** @class */ (function () {
        /**
         * @param container The [[Container]] to use when child routers.
         * @param history The [[History]] implementation to delegate navigation requests to.
         */
        function Router(container, history) {
            var _this = this;
            /**
             * The parent router, or null if this instance is not a child router.
             */
            this.parent = null;
            this.options = {};
            /**
             * The defaults used when a viewport lacks specified content
             */
            this.viewPortDefaults = {};
            /**
             * Extension point to transform the document title before it is built and displayed.
             * By default, child routers delegate to the parent router, and the app router
             * returns the title unchanged.
             */
            this.transformTitle = function (title) {
                if (_this.parent) {
                    return _this.parent.transformTitle(title);
                }
                return title;
            };
            this.container = container;
            this.history = history;
            this.reset();
        }
        /**
         * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
         * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
         */
        Router.prototype.reset = function () {
            var _this = this;
            this.viewPorts = {};
            this.routes = [];
            this.baseUrl = '';
            this.isConfigured = false;
            this.isNavigating = false;
            this.isExplicitNavigation = false;
            this.isExplicitNavigationBack = false;
            this.isNavigatingFirst = false;
            this.isNavigatingNew = false;
            this.isNavigatingRefresh = false;
            this.isNavigatingForward = false;
            this.isNavigatingBack = false;
            this.couldDeactivate = false;
            this.navigation = [];
            this.currentInstruction = null;
            this.viewPortDefaults = {};
            this._fallbackOrder = 100;
            this._recognizer = new aureliaRouteRecognizer.RouteRecognizer();
            this._childRecognizer = new aureliaRouteRecognizer.RouteRecognizer();
            this._configuredPromise = new Promise(function (resolve) {
                _this._resolveConfiguredPromise = resolve;
            });
        };
        Object.defineProperty(Router.prototype, "isRoot", {
            /**
             * Gets a value indicating whether or not this [[Router]] is the root in the router tree. I.e., it has no parent.
             */
            get: function () {
                return !this.parent;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Registers a viewPort to be used as a rendering target for activated routes.
         *
         * @param viewPort The viewPort.
         * @param name The name of the viewPort. 'default' if unspecified.
         */
        Router.prototype.registerViewPort = function (viewPort, name) {
            name = name || 'default';
            this.viewPorts[name] = viewPort;
        };
        /**
         * Returns a Promise that resolves when the router is configured.
         */
        Router.prototype.ensureConfigured = function () {
            return this._configuredPromise;
        };
        /**
         * Configures the router.
         *
         * @param callbackOrConfig The [[RouterConfiguration]] or a callback that takes a [[RouterConfiguration]].
         */
        Router.prototype.configure = function (callbackOrConfig) {
            var _this = this;
            this.isConfigured = true;
            var result = callbackOrConfig;
            var config;
            if (typeof callbackOrConfig === 'function') {
                config = new RouterConfiguration();
                result = callbackOrConfig(config);
            }
            return Promise
                .resolve(result)
                .then(function (c) {
                if (c && c.exportToRouter) {
                    config = c;
                }
                config.exportToRouter(_this);
                _this.isConfigured = true;
                _this._resolveConfiguredPromise();
            });
        };
        /**
         * Navigates to a new location.
         *
         * @param fragment The URL fragment to use as the navigation destination.
         * @param options The navigation options.
         */
        Router.prototype.navigate = function (fragment, options) {
            if (!this.isConfigured && this.parent) {
                return this.parent.navigate(fragment, options);
            }
            this.isExplicitNavigation = true;
            return this.history.navigate(_resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
        };
        /**
         * Navigates to a new location corresponding to the route and params specified. Equivallent to [[Router.generate]] followed
         * by [[Router.navigate]].
         *
         * @param route The name of the route to use when generating the navigation location.
         * @param params The route parameters to be used when populating the route pattern.
         * @param options The navigation options.
         */
        Router.prototype.navigateToRoute = function (route, params, options) {
            var path = this.generate(route, params);
            return this.navigate(path, options);
        };
        /**
         * Navigates back to the most recent location in history.
         */
        Router.prototype.navigateBack = function () {
            this.isExplicitNavigationBack = true;
            this.history.navigateBack();
        };
        /**
         * Creates a child router of the current router.
         *
         * @param container The [[Container]] to provide to the child router. Uses the current [[Router]]'s [[Container]] if unspecified.
         * @returns {Router} The new child Router.
         */
        Router.prototype.createChild = function (container) {
            var childRouter = new Router(container || this.container.createChild(), this.history);
            childRouter.parent = this;
            return childRouter;
        };
        /**
         * Generates a URL fragment matching the specified route pattern.
         *
         * @param name The name of the route whose pattern should be used to generate the fragment.
         * @param params The route params to be used to populate the route pattern.
         * @param options If options.absolute = true, then absolute url will be generated; otherwise, it will be relative url.
         * @returns {string} A string containing the generated URL fragment.
         */
        Router.prototype.generate = function (nameOrRoute, params, options) {
            if (params === void 0) { params = {}; }
            if (options === void 0) { options = {}; }
            // A child recognizer generates routes for potential child routes. Any potential child route is added
            // to the childRoute property of params for the childRouter to recognize. When generating routes, we
            // use the childRecognizer when childRoute params are available to generate a child router enabled route.
            var recognizer = 'childRoute' in params ? this._childRecognizer : this._recognizer;
            var hasRoute = recognizer.hasRoute(nameOrRoute);
            if (!hasRoute) {
                if (this.parent) {
                    return this.parent.generate(nameOrRoute, params, options);
                }
                throw new Error("A route with name '" + nameOrRoute + "' could not be found. Check that `name: '" + nameOrRoute + "'` was specified in the route's config.");
            }
            var path = recognizer.generate(nameOrRoute, params);
            var rootedPath = _createRootedPath(path, this.baseUrl, this.history._hasPushState, options.absolute);
            return options.absolute ? "" + this.history.getAbsoluteRoot() + rootedPath : rootedPath;
        };
        /**
         * Creates a [[NavModel]] for the specified route config.
         *
         * @param config The route config.
         */
        Router.prototype.createNavModel = function (config) {
            var navModel = new NavModel(this, 'href' in config
                ? config.href
                // potential error when config.route is a string[] ?
                : config.route);
            navModel.title = config.title;
            navModel.order = config.nav;
            navModel.href = config.href;
            navModel.settings = config.settings;
            navModel.config = config;
            return navModel;
        };
        /**
         * Registers a new route with the router.
         *
         * @param config The [[RouteConfig]].
         * @param navModel The [[NavModel]] to use for the route. May be omitted for single-pattern routes.
         */
        Router.prototype.addRoute = function (config, navModel) {
            if (Array.isArray(config.route)) {
                var routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);
                // the following is wrong. todo: fix this after TS refactoring release
                routeConfigs.forEach(this.addRoute.bind(this));
                return;
            }
            validateRouteConfig(config);
            if (!('viewPorts' in config) && !config.navigationStrategy) {
                config.viewPorts = {
                    'default': {
                        moduleId: config.moduleId,
                        view: config.view
                    }
                };
            }
            if (!navModel) {
                navModel = this.createNavModel(config);
            }
            this.routes.push(config);
            var path = config.route;
            if (path.charAt(0) === '/') {
                path = path.substr(1);
            }
            var caseSensitive = config.caseSensitive === true;
            var state = this._recognizer.add({
                path: path,
                handler: config,
                caseSensitive: caseSensitive
            });
            if (path) {
                var settings = config.settings;
                delete config.settings;
                var withChild = JSON.parse(JSON.stringify(config));
                config.settings = settings;
                withChild.route = path + "/*childRoute";
                withChild.hasChildRouter = true;
                this._childRecognizer.add({
                    path: withChild.route,
                    handler: withChild,
                    caseSensitive: caseSensitive
                });
                withChild.navModel = navModel;
                withChild.settings = config.settings;
                withChild.navigationStrategy = config.navigationStrategy;
            }
            config.navModel = navModel;
            var navigation = this.navigation;
            if ((navModel.order || navModel.order === 0) && navigation.indexOf(navModel) === -1) {
                if ((!navModel.href && navModel.href !== '') && (state.types.dynamics || state.types.stars)) {
                    throw new Error('Invalid route config for "' + config.route + '" : dynamic routes must specify an "href:" to be included in the navigation model.');
                }
                if (typeof navModel.order !== 'number') {
                    navModel.order = ++this._fallbackOrder;
                }
                navigation.push(navModel);
                // this is a potential error / inconsistency between browsers
                //
                // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
                // If compareFunction(a, b) returns 0, leave a and b unchanged with respect to each other,
                // but sorted with respect to all different elements.
                // Note: the ECMAscript standard does not guarantee this behaviour,
                // and thus not all browsers (e.g. Mozilla versions dating back to at least 2003) respect this.
                navigation.sort(function (a, b) { return a.order - b.order; });
            }
        };
        /**
         * Gets a value indicating whether or not this [[Router]] or one of its ancestors has a route registered with the specified name.
         *
         * @param name The name of the route to check.
         */
        Router.prototype.hasRoute = function (name) {
            return !!(this._recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
        };
        /**
         * Gets a value indicating whether or not this [[Router]] has a route registered with the specified name.
         *
         * @param name The name of the route to check.
         */
        Router.prototype.hasOwnRoute = function (name) {
            return this._recognizer.hasRoute(name);
        };
        /**
         * Register a handler to use when the incoming URL fragment doesn't match any registered routes.
         *
         * @param config The moduleId, or a function that selects the moduleId, or a [[RouteConfig]].
         */
        Router.prototype.handleUnknownRoutes = function (config) {
            var _this = this;
            if (!config) {
                throw new Error('Invalid unknown route handler');
            }
            this.catchAllHandler = function (instruction) {
                return _this
                    ._createRouteConfig(config, instruction)
                    .then(function (c) {
                    instruction.config = c;
                    return instruction;
                });
            };
        };
        /**
         * Updates the document title using the current navigation instruction.
         */
        Router.prototype.updateTitle = function () {
            var parentRouter = this.parent;
            if (parentRouter) {
                return parentRouter.updateTitle();
            }
            var currentInstruction = this.currentInstruction;
            if (currentInstruction) {
                currentInstruction._updateTitle();
            }
            return undefined;
        };
        /**
         * Updates the navigation routes with hrefs relative to the current location.
         * Note: This method will likely move to a plugin in a future release.
         */
        Router.prototype.refreshNavigation = function () {
            var nav = this.navigation;
            for (var i = 0, length_1 = nav.length; i < length_1; i++) {
                var current = nav[i];
                if (!current.config.href) {
                    current.href = _createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
                }
                else {
                    current.href = _normalizeAbsolutePath(current.config.href, this.history._hasPushState);
                }
            }
        };
        /**
         * Sets the default configuration for the view ports. This specifies how to
         *  populate a view port for which no module is specified. The default is
         *  an empty view/view-model pair.
         */
        Router.prototype.useViewPortDefaults = function ($viewPortDefaults) {
            // a workaround to have strong typings while not requiring to expose interface ViewPortInstruction
            var viewPortDefaults = $viewPortDefaults;
            for (var viewPortName in viewPortDefaults) {
                var viewPortConfig = viewPortDefaults[viewPortName];
                this.viewPortDefaults[viewPortName] = {
                    moduleId: viewPortConfig.moduleId
                };
            }
        };
        /**@internal */
        Router.prototype._refreshBaseUrl = function () {
            var parentRouter = this.parent;
            if (parentRouter) {
                this.baseUrl = generateBaseUrl(parentRouter, parentRouter.currentInstruction);
            }
        };
        /**@internal */
        Router.prototype._createNavigationInstruction = function (url, parentInstruction) {
            if (url === void 0) { url = ''; }
            if (parentInstruction === void 0) { parentInstruction = null; }
            var fragment = url;
            var queryString = '';
            var queryIndex = url.indexOf('?');
            if (queryIndex !== -1) {
                fragment = url.substr(0, queryIndex);
                queryString = url.substr(queryIndex + 1);
            }
            var urlRecognizationResults = this._recognizer.recognize(url);
            if (!urlRecognizationResults || !urlRecognizationResults.length) {
                urlRecognizationResults = this._childRecognizer.recognize(url);
            }
            var instructionInit = {
                fragment: fragment,
                queryString: queryString,
                config: null,
                parentInstruction: parentInstruction,
                previousInstruction: this.currentInstruction,
                router: this,
                options: {
                    compareQueryParams: this.options.compareQueryParams
                }
            };
            var result;
            if (urlRecognizationResults && urlRecognizationResults.length) {
                var first = urlRecognizationResults[0];
                var instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
                    params: first.params,
                    queryParams: first.queryParams || urlRecognizationResults.queryParams,
                    config: first.config || first.handler
                }));
                if (typeof first.handler === 'function') {
                    result = evaluateNavigationStrategy(instruction, first.handler, first);
                }
                else if (first.handler && typeof first.handler.navigationStrategy === 'function') {
                    result = evaluateNavigationStrategy(instruction, first.handler.navigationStrategy, first.handler);
                }
                else {
                    result = Promise.resolve(instruction);
                }
            }
            else if (this.catchAllHandler) {
                var instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
                    params: { path: fragment },
                    queryParams: urlRecognizationResults ? urlRecognizationResults.queryParams : {},
                    config: null // config will be created by the catchAllHandler
                }));
                result = evaluateNavigationStrategy(instruction, this.catchAllHandler);
            }
            else if (this.parent) {
                var router = this._parentCatchAllHandler(this.parent);
                if (router) {
                    var newParentInstruction = this._findParentInstructionFromRouter(router, parentInstruction);
                    var instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
                        params: { path: fragment },
                        queryParams: urlRecognizationResults ? urlRecognizationResults.queryParams : {},
                        router: router,
                        parentInstruction: newParentInstruction,
                        parentCatchHandler: true,
                        config: null // config will be created by the chained parent catchAllHandler
                    }));
                    result = evaluateNavigationStrategy(instruction, router.catchAllHandler);
                }
            }
            if (result && parentInstruction) {
                this.baseUrl = generateBaseUrl(this.parent, parentInstruction);
            }
            return result || Promise.reject(new Error("Route not found: " + url));
        };
        /**@internal */
        Router.prototype._findParentInstructionFromRouter = function (router, instruction) {
            if (instruction.router === router) {
                instruction.fragment = router.baseUrl; // need to change the fragment in case of a redirect instead of moduleId
                return instruction;
            }
            else if (instruction.parentInstruction) {
                return this._findParentInstructionFromRouter(router, instruction.parentInstruction);
            }
            return undefined;
        };
        /**@internal */
        Router.prototype._parentCatchAllHandler = function (router) {
            if (router.catchAllHandler) {
                return router;
            }
            else if (router.parent) {
                return this._parentCatchAllHandler(router.parent);
            }
            return false;
        };
        /**
         * @internal
         */
        Router.prototype._createRouteConfig = function (config, instruction) {
            var _this = this;
            return Promise
                .resolve(config)
                .then(function (c) {
                if (typeof c === 'string') {
                    return { moduleId: c };
                }
                else if (typeof c === 'function') {
                    return c(instruction);
                }
                return c;
            })
                // typing here could be either RouteConfig or RedirectConfig
                // but temporarily treat both as RouteConfig
                // todo: improve typings precision
                .then(function (c) { return typeof c === 'string' ? { moduleId: c } : c; })
                .then(function (c) {
                c.route = instruction.params.path;
                validateRouteConfig(c);
                if (!c.navModel) {
                    c.navModel = _this.createNavModel(c);
                }
                return c;
            });
        };
        return Router;
    }());
    /* @internal exported for unit testing */
    var generateBaseUrl = function (router, instruction) {
        return "" + (router.baseUrl || '') + (instruction.getBaseUrl() || '');
    };
    /* @internal exported for unit testing */
    var validateRouteConfig = function (config) {
        if (typeof config !== 'object') {
            throw new Error('Invalid Route Config');
        }
        if (typeof config.route !== 'string') {
            var name_1 = config.name || '(no name)';
            throw new Error('Invalid Route Config for "' + name_1 + '": You must specify a "route:" pattern.');
        }
        if (!('redirect' in config || config.moduleId || config.navigationStrategy || config.viewPorts)) {
            throw new Error('Invalid Route Config for "' + config.route + '": You must specify a "moduleId:", "redirect:", "navigationStrategy:", or "viewPorts:".');
        }
    };
    /* @internal exported for unit testing */
    var evaluateNavigationStrategy = function (instruction, evaluator, context) {
        return Promise
            .resolve(evaluator.call(context, instruction))
            .then(function () {
            if (!('viewPorts' in instruction.config)) {
                instruction.config.viewPorts = {
                    'default': {
                        moduleId: instruction.config.moduleId
                    }
                };
            }
            return instruction;
        });
    };

    /**@internal exported for unit testing */
    var createNextFn = function (instruction, steps) {
        var index = -1;
        var next = function () {
            index++;
            if (index < steps.length) {
                var currentStep = steps[index];
                try {
                    return currentStep(instruction, next);
                }
                catch (e) {
                    return next.reject(e);
                }
            }
            else {
                return next.complete();
            }
        };
        next.complete = createCompletionHandler(next, "completed" /* Completed */);
        next.cancel = createCompletionHandler(next, "canceled" /* Canceled */);
        next.reject = createCompletionHandler(next, "rejected" /* Rejected */);
        return next;
    };
    /**@internal exported for unit testing */
    var createCompletionHandler = function (next, status) {
        return function (output) { return Promise
            .resolve({
            status: status,
            output: output,
            completed: status === "completed" /* Completed */
        }); };
    };

    /**
     * The class responsible for managing and processing the navigation pipeline.
     */
    var Pipeline = /** @class */ (function () {
        function Pipeline() {
            /**
             * The pipeline steps. And steps added via addStep will be converted to a function
             * The actualy running functions with correct step contexts of this pipeline
             */
            this.steps = [];
        }
        /**
         * Adds a step to the pipeline.
         *
         * @param step The pipeline step.
         */
        Pipeline.prototype.addStep = function (step) {
            var run;
            if (typeof step === 'function') {
                run = step;
            }
            else if (typeof step.getSteps === 'function') {
                // getSteps is to enable support open slots
                // where devs can add multiple steps into the same slot name
                var steps = step.getSteps();
                for (var i = 0, l = steps.length; i < l; i++) {
                    this.addStep(steps[i]);
                }
                return this;
            }
            else {
                run = step.run.bind(step);
            }
            this.steps.push(run);
            return this;
        };
        /**
         * Runs the pipeline.
         *
         * @param instruction The navigation instruction to process.
         */
        Pipeline.prototype.run = function (instruction) {
            var nextFn = createNextFn(instruction, this.steps);
            return nextFn();
        };
        return Pipeline;
    }());

    /**
    * Determines if the provided object is a navigation command.
    * A navigation command is anything with a navigate method.
    *
    * @param obj The object to check.
    */
    function isNavigationCommand(obj) {
        return obj && typeof obj.navigate === 'function';
    }
    /**
    * Used during the activation lifecycle to cause a redirect.
    */
    var Redirect = /** @class */ (function () {
        /**
         * @param url The URL fragment to use as the navigation destination.
         * @param options The navigation options.
         */
        function Redirect(url, options) {
            if (options === void 0) { options = {}; }
            this.url = url;
            this.options = Object.assign({ trigger: true, replace: true }, options);
            this.shouldContinueProcessing = false;
        }
        /**
         * Called by the activation system to set the child router.
         *
         * @param router The router.
         */
        Redirect.prototype.setRouter = function (router) {
            this.router = router;
        };
        /**
         * Called by the navigation pipeline to navigate.
         *
         * @param appRouter The router to be redirected.
         */
        Redirect.prototype.navigate = function (appRouter) {
            var navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
            navigatingRouter.navigate(this.url, this.options);
        };
        return Redirect;
    }());
    /**
     * Used during the activation lifecycle to cause a redirect to a named route.
     */
    var RedirectToRoute = /** @class */ (function () {
        /**
         * @param route The name of the route.
         * @param params The parameters to be sent to the activation method.
         * @param options The options to use for navigation.
         */
        function RedirectToRoute(route, params, options) {
            if (params === void 0) { params = {}; }
            if (options === void 0) { options = {}; }
            this.route = route;
            this.params = params;
            this.options = Object.assign({ trigger: true, replace: true }, options);
            this.shouldContinueProcessing = false;
        }
        /**
         * Called by the activation system to set the child router.
         *
         * @param router The router.
         */
        RedirectToRoute.prototype.setRouter = function (router) {
            this.router = router;
        };
        /**
         * Called by the navigation pipeline to navigate.
         *
         * @param appRouter The router to be redirected.
         */
        RedirectToRoute.prototype.navigate = function (appRouter) {
            var navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
            navigatingRouter.navigateToRoute(this.route, this.params, this.options);
        };
        return RedirectToRoute;
    }());

    /**
     * @internal exported for unit testing
     */
    function _buildNavigationPlan(instruction, forceLifecycleMinimum) {
        var config = instruction.config;
        if ('redirect' in config) {
            return buildRedirectPlan(instruction);
        }
        var prevInstruction = instruction.previousInstruction;
        var defaultViewPortConfigs = instruction.router.viewPortDefaults;
        if (prevInstruction) {
            return buildTransitionPlans(instruction, prevInstruction, defaultViewPortConfigs, forceLifecycleMinimum);
        }
        // first navigation, only need to prepare a few information for each viewport plan
        var viewPortPlans = {};
        var viewPortConfigs = config.viewPorts;
        for (var viewPortName in viewPortConfigs) {
            var viewPortConfig = viewPortConfigs[viewPortName];
            if (viewPortConfig.moduleId === null && viewPortName in defaultViewPortConfigs) {
                viewPortConfig = defaultViewPortConfigs[viewPortName];
            }
            viewPortPlans[viewPortName] = {
                name: viewPortName,
                strategy: "replace" /* Replace */,
                config: viewPortConfig
            };
        }
        return Promise.resolve(viewPortPlans);
    }
    /**
     * Build redirect plan based on config of a navigation instruction
     * @internal exported for unit testing
     */
    var buildRedirectPlan = function (instruction) {
        var config = instruction.config;
        var router = instruction.router;
        return router
            ._createNavigationInstruction(config.redirect)
            .then(function (redirectInstruction) {
            var params = {};
            var originalInstructionParams = instruction.params;
            var redirectInstructionParams = redirectInstruction.params;
            for (var key in redirectInstructionParams) {
                // If the param on the redirect points to another param, e.g. { route: first/:this, redirect: second/:this }
                var val = redirectInstructionParams[key];
                if (typeof val === 'string' && val[0] === ':') {
                    val = val.slice(1);
                    // And if that param is found on the original instruction then use it
                    if (val in originalInstructionParams) {
                        params[key] = originalInstructionParams[val];
                    }
                }
                else {
                    params[key] = redirectInstructionParams[key];
                }
            }
            var redirectLocation = router.generate(redirectInstruction.config, params, instruction.options);
            // Special handling for child routes
            for (var key in originalInstructionParams) {
                redirectLocation = redirectLocation.replace(":" + key, originalInstructionParams[key]);
            }
            var queryString = instruction.queryString;
            if (queryString) {
                redirectLocation += '?' + queryString;
            }
            return Promise.resolve(new Redirect(redirectLocation));
        });
    };
    /**
     * @param viewPortPlans the Plan record that holds information about built plans
     * @internal exported for unit testing
     */
    var buildTransitionPlans = function (currentInstruction, previousInstruction, defaultViewPortConfigs, forceLifecycleMinimum) {
        var viewPortPlans = {};
        var newInstructionConfig = currentInstruction.config;
        var hasNewParams = hasDifferentParameterValues(previousInstruction, currentInstruction);
        var pending = [];
        var previousViewPortInstructions = previousInstruction.viewPortInstructions;
        var _loop_1 = function (viewPortName) {
            var prevViewPortInstruction = previousViewPortInstructions[viewPortName];
            var prevViewPortComponent = prevViewPortInstruction.component;
            var newInstructionViewPortConfigs = newInstructionConfig.viewPorts;
            // if this is invoked on a viewport without any changes, based on new url,
            // newViewPortConfig will be the existing viewport instruction
            var nextViewPortConfig = viewPortName in newInstructionViewPortConfigs
                ? newInstructionViewPortConfigs[viewPortName]
                : prevViewPortInstruction;
            if (nextViewPortConfig.moduleId === null && viewPortName in defaultViewPortConfigs) {
                nextViewPortConfig = defaultViewPortConfigs[viewPortName];
            }
            var viewPortActivationStrategy = determineActivationStrategy(currentInstruction, prevViewPortInstruction, nextViewPortConfig, hasNewParams, forceLifecycleMinimum);
            var viewPortPlan = viewPortPlans[viewPortName] = {
                name: viewPortName,
                // ViewPortInstruction can quack like a RouteConfig
                config: nextViewPortConfig,
                prevComponent: prevViewPortComponent,
                prevModuleId: prevViewPortInstruction.moduleId,
                strategy: viewPortActivationStrategy
            };
            // recursively build nav plans for all existing child routers/viewports of this viewport
            // this is possible because existing child viewports and routers already have necessary information
            // to process the wildcard path from parent instruction
            if (viewPortActivationStrategy !== "replace" /* Replace */ && prevViewPortInstruction.childRouter) {
                var path = currentInstruction.getWildcardPath();
                var task = prevViewPortInstruction
                    .childRouter
                    ._createNavigationInstruction(path, currentInstruction)
                    .then(function (childInstruction) {
                    viewPortPlan.childNavigationInstruction = childInstruction;
                    return _buildNavigationPlan(childInstruction,
                    // is it safe to assume viewPortPlan has not been changed from previous assignment?
                    // if so, can just use local variable viewPortPlanStrategy
                    // there could be user code modifying viewport plan during _createNavigationInstruction?
                    viewPortPlan.strategy === "invoke-lifecycle" /* InvokeLifecycle */)
                        .then(function (childPlan) {
                        if (childPlan instanceof Redirect) {
                            return Promise.reject(childPlan);
                        }
                        childInstruction.plan = childPlan;
                        // for bluebird ?
                        return null;
                    });
                });
                pending.push(task);
            }
        };
        for (var viewPortName in previousViewPortInstructions) {
            _loop_1(viewPortName);
        }
        return Promise.all(pending).then(function () { return viewPortPlans; });
    };
    /**
     * @param newViewPortConfig if this is invoked on a viewport without any changes, based on new url, newViewPortConfig will be the existing viewport instruction
     * @internal exported for unit testing
     */
    var determineActivationStrategy = function (currentNavInstruction, prevViewPortInstruction, newViewPortConfig,
    // indicates whether there is difference between old and new url params
    hasNewParams, forceLifecycleMinimum) {
        var newInstructionConfig = currentNavInstruction.config;
        var prevViewPortViewModel = prevViewPortInstruction.component.viewModel;
        var viewPortPlanStrategy;
        if (prevViewPortInstruction.moduleId !== newViewPortConfig.moduleId) {
            viewPortPlanStrategy = "replace" /* Replace */;
        }
        else if ('determineActivationStrategy' in prevViewPortViewModel) {
            viewPortPlanStrategy = prevViewPortViewModel.determineActivationStrategy.apply(prevViewPortViewModel, currentNavInstruction.lifecycleArgs);
        }
        else if (newInstructionConfig.activationStrategy) {
            viewPortPlanStrategy = newInstructionConfig.activationStrategy;
        }
        else if (hasNewParams || forceLifecycleMinimum) {
            viewPortPlanStrategy = "invoke-lifecycle" /* InvokeLifecycle */;
        }
        else {
            viewPortPlanStrategy = "no-change" /* NoChange */;
        }
        return viewPortPlanStrategy;
    };
    /**@internal exported for unit testing */
    var hasDifferentParameterValues = function (prev, next) {
        var prevParams = prev.params;
        var nextParams = next.params;
        var nextWildCardName = next.config.hasChildRouter ? next.getWildCardName() : null;
        for (var key in nextParams) {
            if (key === nextWildCardName) {
                continue;
            }
            if (prevParams[key] !== nextParams[key]) {
                return true;
            }
        }
        for (var key in prevParams) {
            if (key === nextWildCardName) {
                continue;
            }
            if (prevParams[key] !== nextParams[key]) {
                return true;
            }
        }
        if (!next.options.compareQueryParams) {
            return false;
        }
        var prevQueryParams = prev.queryParams;
        var nextQueryParams = next.queryParams;
        for (var key in nextQueryParams) {
            if (prevQueryParams[key] !== nextQueryParams[key]) {
                return true;
            }
        }
        for (var key in prevQueryParams) {
            if (prevQueryParams[key] !== nextQueryParams[key]) {
                return true;
            }
        }
        return false;
    };

    /**
     * Transform a navigation instruction into viewport plan record object,
     * or a redirect request if user viewmodel demands
     */
    var BuildNavigationPlanStep = /** @class */ (function () {
        function BuildNavigationPlanStep() {
        }
        BuildNavigationPlanStep.prototype.run = function (navigationInstruction, next) {
            return _buildNavigationPlan(navigationInstruction)
                .then(function (plan) {
                if (plan instanceof Redirect) {
                    return next.cancel(plan);
                }
                navigationInstruction.plan = plan;
                return next();
            })
                .catch(next.cancel);
        };
        return BuildNavigationPlanStep;
    }());

    /**
     * @internal Exported for unit testing
     */
    var loadNewRoute = function (routeLoader, navigationInstruction) {
        var loadingPlans = determineLoadingPlans(navigationInstruction);
        var loadPromises = loadingPlans.map(function (loadingPlan) { return loadRoute(routeLoader, loadingPlan.navigationInstruction, loadingPlan.viewPortPlan); });
        return Promise.all(loadPromises);
    };
    /**
     * @internal Exported for unit testing
     */
    var determineLoadingPlans = function (navigationInstruction, loadingPlans) {
        if (loadingPlans === void 0) { loadingPlans = []; }
        var viewPortPlans = navigationInstruction.plan;
        for (var viewPortName in viewPortPlans) {
            var viewPortPlan = viewPortPlans[viewPortName];
            var childNavInstruction = viewPortPlan.childNavigationInstruction;
            if (viewPortPlan.strategy === "replace" /* Replace */) {
                loadingPlans.push({ viewPortPlan: viewPortPlan, navigationInstruction: navigationInstruction });
                if (childNavInstruction) {
                    determineLoadingPlans(childNavInstruction, loadingPlans);
                }
            }
            else {
                var viewPortInstruction = navigationInstruction.addViewPortInstruction({
                    name: viewPortName,
                    strategy: viewPortPlan.strategy,
                    moduleId: viewPortPlan.prevModuleId,
                    component: viewPortPlan.prevComponent
                });
                if (childNavInstruction) {
                    viewPortInstruction.childNavigationInstruction = childNavInstruction;
                    determineLoadingPlans(childNavInstruction, loadingPlans);
                }
            }
        }
        return loadingPlans;
    };
    /**
     * @internal Exported for unit testing
     */
    var loadRoute = function (routeLoader, navigationInstruction, viewPortPlan) {
        var planConfig = viewPortPlan.config;
        var moduleId = planConfig ? planConfig.moduleId : null;
        return loadComponent(routeLoader, navigationInstruction, planConfig)
            .then(function (component) {
            var viewPortInstruction = navigationInstruction.addViewPortInstruction({
                name: viewPortPlan.name,
                strategy: viewPortPlan.strategy,
                moduleId: moduleId,
                component: component
            });
            var childRouter = component.childRouter;
            if (childRouter) {
                var path = navigationInstruction.getWildcardPath();
                return childRouter
                    ._createNavigationInstruction(path, navigationInstruction)
                    .then(function (childInstruction) {
                    viewPortPlan.childNavigationInstruction = childInstruction;
                    return _buildNavigationPlan(childInstruction)
                        .then(function (childPlan) {
                        if (childPlan instanceof Redirect) {
                            return Promise.reject(childPlan);
                        }
                        childInstruction.plan = childPlan;
                        viewPortInstruction.childNavigationInstruction = childInstruction;
                        return loadNewRoute(routeLoader, childInstruction);
                    });
                });
            }
            // ts complains without this, though they are same
            return void 0;
        });
    };
    /**
     * Load a routed-component based on navigation instruction and route config
     * @internal exported for unit testing only
     */
    var loadComponent = function (routeLoader, navigationInstruction, config) {
        var router = navigationInstruction.router;
        var lifecycleArgs = navigationInstruction.lifecycleArgs;
        return Promise.resolve()
            .then(function () { return routeLoader.loadRoute(router, config, navigationInstruction); })
            .then(
        /**
         * @param component an object carrying information about loaded route
         * typically contains information about view model, childContainer, view and router
         */
        function (component) {
            var viewModel = component.viewModel, childContainer = component.childContainer;
            component.router = router;
            component.config = config;
            if ('configureRouter' in viewModel) {
                var childRouter_1 = childContainer.getChildRouter();
                component.childRouter = childRouter_1;
                return childRouter_1
                    .configure(function (c) { return viewModel.configureRouter(c, childRouter_1, lifecycleArgs[0], lifecycleArgs[1], lifecycleArgs[2]); })
                    .then(function () { return component; });
            }
            return component;
        });
    };

    /**
     * Abstract class that is responsible for loading view / view model from a route config
     * The default implementation can be found in `aurelia-templating-router`
     */
    var RouteLoader = /** @class */ (function () {
        function RouteLoader() {
        }
        /**
         * Load a route config based on its viewmodel / view configuration
         */
        // return typing: return typings used to be never
        // as it was a throw. Changing it to Promise<any> should not cause any issues
        RouteLoader.prototype.loadRoute = function (router, config, navigationInstruction) {
            throw new Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
        };
        return RouteLoader;
    }());

    /**
     * A pipeline step responsible for loading a route config of a navigation instruction
     */
    var LoadRouteStep = /** @class */ (function () {
        function LoadRouteStep(routeLoader) {
            this.routeLoader = routeLoader;
        }
        /**@internal */
        LoadRouteStep.inject = function () { return [RouteLoader]; };
        /**
         * Run the internal to load route config of a navigation instruction to prepare for next steps in the pipeline
         */
        LoadRouteStep.prototype.run = function (navigationInstruction, next) {
            return loadNewRoute(this.routeLoader, navigationInstruction)
                .then(next, next.cancel);
        };
        return LoadRouteStep;
    }());

    /**
     * A pipeline step for instructing a piepline to commit changes on a navigation instruction
     */
    var CommitChangesStep = /** @class */ (function () {
        function CommitChangesStep() {
        }
        CommitChangesStep.prototype.run = function (navigationInstruction, next) {
            return navigationInstruction
                ._commitChanges(/*wait to swap?*/ true)
                .then(function () {
                navigationInstruction._updateTitle();
                return next();
            });
        };
        return CommitChangesStep;
    }());

    /**
     * An optional interface describing the available activation strategies.
     * @internal Used internally.
     */
    var InternalActivationStrategy;
    (function (InternalActivationStrategy) {
        /**
         * Reuse the existing view model, without invoking Router lifecycle hooks.
         */
        InternalActivationStrategy["NoChange"] = "no-change";
        /**
         * Reuse the existing view model, invoking Router lifecycle hooks.
         */
        InternalActivationStrategy["InvokeLifecycle"] = "invoke-lifecycle";
        /**
         * Replace the existing view model, invoking Router lifecycle hooks.
         */
        InternalActivationStrategy["Replace"] = "replace";
    })(InternalActivationStrategy || (InternalActivationStrategy = {}));
    /**
     * The strategy to use when activating modules during navigation.
     */
    // kept for compat reason
    var activationStrategy = {
        noChange: "no-change" /* NoChange */,
        invokeLifecycle: "invoke-lifecycle" /* InvokeLifecycle */,
        replace: "replace" /* Replace */
    };

    /**
     * Recursively find list of deactivate-able view models
     * and invoke the either 'canDeactivate' or 'deactivate' on each
     * @internal exported for unit testing
     */
    var processDeactivatable = function (navigationInstruction, callbackName, next, ignoreResult) {
        var plan = navigationInstruction.plan;
        var infos = findDeactivatable(plan, callbackName);
        var i = infos.length; // query from inside out
        function inspect(val) {
            if (ignoreResult || shouldContinue(val)) {
                return iterate();
            }
            return next.cancel(val);
        }
        function iterate() {
            if (i--) {
                try {
                    var viewModel = infos[i];
                    var result = viewModel[callbackName](navigationInstruction);
                    return processPotential(result, inspect, next.cancel);
                }
                catch (error) {
                    return next.cancel(error);
                }
            }
            navigationInstruction.router.couldDeactivate = true;
            return next();
        }
        return iterate();
    };
    /**
     * Recursively find and returns a list of deactivate-able view models
     * @internal exported for unit testing
     */
    var findDeactivatable = function (plan, callbackName, list) {
        if (list === void 0) { list = []; }
        for (var viewPortName in plan) {
            var viewPortPlan = plan[viewPortName];
            var prevComponent = viewPortPlan.prevComponent;
            if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace)
                && prevComponent) {
                var viewModel = prevComponent.viewModel;
                if (callbackName in viewModel) {
                    list.push(viewModel);
                }
            }
            if (viewPortPlan.strategy === activationStrategy.replace && prevComponent) {
                addPreviousDeactivatable(prevComponent, callbackName, list);
            }
            else if (viewPortPlan.childNavigationInstruction) {
                findDeactivatable(viewPortPlan.childNavigationInstruction.plan, callbackName, list);
            }
        }
        return list;
    };
    /**
     * @internal exported for unit testing
     */
    var addPreviousDeactivatable = function (component, callbackName, list) {
        var childRouter = component.childRouter;
        if (childRouter && childRouter.currentInstruction) {
            var viewPortInstructions = childRouter.currentInstruction.viewPortInstructions;
            for (var viewPortName in viewPortInstructions) {
                var viewPortInstruction = viewPortInstructions[viewPortName];
                var prevComponent = viewPortInstruction.component;
                var prevViewModel = prevComponent.viewModel;
                if (callbackName in prevViewModel) {
                    list.push(prevViewModel);
                }
                addPreviousDeactivatable(prevComponent, callbackName, list);
            }
        }
    };
    /**
     * @internal exported for unit testing
     */
    var processActivatable = function (navigationInstruction, callbackName, next, ignoreResult) {
        var infos = findActivatable(navigationInstruction, callbackName);
        var length = infos.length;
        var i = -1; // query from top down
        function inspect(val, router) {
            if (ignoreResult || shouldContinue(val, router)) {
                return iterate();
            }
            return next.cancel(val);
        }
        function iterate() {
            var _a;
            i++;
            if (i < length) {
                try {
                    var current_1 = infos[i];
                    var result = (_a = current_1.viewModel)[callbackName].apply(_a, current_1.lifecycleArgs);
                    return processPotential(result, function (val) { return inspect(val, current_1.router); }, next.cancel);
                }
                catch (error) {
                    return next.cancel(error);
                }
            }
            return next();
        }
        return iterate();
    };
    /**
     * Find list of activatable view model and add to list (3rd parameter)
     * @internal exported for unit testing
     */
    var findActivatable = function (navigationInstruction, callbackName, list, router) {
        if (list === void 0) { list = []; }
        var plan = navigationInstruction.plan;
        Object
            .keys(plan)
            .forEach(function (viewPortName) {
            var viewPortPlan = plan[viewPortName];
            var viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
            var viewPortComponent = viewPortInstruction.component;
            var viewModel = viewPortComponent.viewModel;
            if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle
                || viewPortPlan.strategy === activationStrategy.replace)
                && callbackName in viewModel) {
                list.push({
                    viewModel: viewModel,
                    lifecycleArgs: viewPortInstruction.lifecycleArgs,
                    router: router
                });
            }
            var childNavInstruction = viewPortPlan.childNavigationInstruction;
            if (childNavInstruction) {
                findActivatable(childNavInstruction, callbackName, list, viewPortComponent.childRouter || router);
            }
        });
        return list;
    };
    var shouldContinue = function (output, router) {
        if (output instanceof Error) {
            return false;
        }
        if (isNavigationCommand(output)) {
            if (typeof output.setRouter === 'function') {
                output.setRouter(router);
            }
            return !!output.shouldContinueProcessing;
        }
        if (output === undefined) {
            return true;
        }
        return output;
    };
    /**
     * wraps a subscription, allowing unsubscribe calls even if
     * the first value comes synchronously
     */
    var SafeSubscription = /** @class */ (function () {
        function SafeSubscription(subscriptionFunc) {
            this._subscribed = true;
            this._subscription = subscriptionFunc(this);
            if (!this._subscribed) {
                this.unsubscribe();
            }
        }
        Object.defineProperty(SafeSubscription.prototype, "subscribed", {
            get: function () {
                return this._subscribed;
            },
            enumerable: true,
            configurable: true
        });
        SafeSubscription.prototype.unsubscribe = function () {
            if (this._subscribed && this._subscription) {
                this._subscription.unsubscribe();
            }
            this._subscribed = false;
        };
        return SafeSubscription;
    }());
    /**
     * A function to process return value from `activate`/`canActivate` steps
     * Supports observable/promise
     *
     * For observable, resolve at first next() or on complete()
     */
    var processPotential = function (obj, resolve, reject) {
        // if promise like
        if (obj && typeof obj.then === 'function') {
            return Promise.resolve(obj).then(resolve).catch(reject);
        }
        // if observable
        if (obj && typeof obj.subscribe === 'function') {
            var obs_1 = obj;
            return new SafeSubscription(function (sub) { return obs_1.subscribe({
                next: function () {
                    if (sub.subscribed) {
                        sub.unsubscribe();
                        resolve(obj);
                    }
                },
                error: function (error) {
                    if (sub.subscribed) {
                        sub.unsubscribe();
                        reject(error);
                    }
                },
                complete: function () {
                    if (sub.subscribed) {
                        sub.unsubscribe();
                        resolve(obj);
                    }
                }
            }); });
        }
        // else just resolve
        try {
            return resolve(obj);
        }
        catch (error) {
            return reject(error);
        }
    };

    /**
     * A pipeline step responsible for finding and activating method `canDeactivate` on a view model of a route
     */
    var CanDeactivatePreviousStep = /** @class */ (function () {
        function CanDeactivatePreviousStep() {
        }
        CanDeactivatePreviousStep.prototype.run = function (navigationInstruction, next) {
            return processDeactivatable(navigationInstruction, 'canDeactivate', next);
        };
        return CanDeactivatePreviousStep;
    }());
    /**
     * A pipeline step responsible for finding and activating method `canActivate` on a view model of a route
     */
    var CanActivateNextStep = /** @class */ (function () {
        function CanActivateNextStep() {
        }
        CanActivateNextStep.prototype.run = function (navigationInstruction, next) {
            return processActivatable(navigationInstruction, 'canActivate', next);
        };
        return CanActivateNextStep;
    }());
    /**
     * A pipeline step responsible for finding and activating method `deactivate` on a view model of a route
     */
    var DeactivatePreviousStep = /** @class */ (function () {
        function DeactivatePreviousStep() {
        }
        DeactivatePreviousStep.prototype.run = function (navigationInstruction, next) {
            return processDeactivatable(navigationInstruction, 'deactivate', next, true);
        };
        return DeactivatePreviousStep;
    }());
    /**
     * A pipeline step responsible for finding and activating method `activate` on a view model of a route
     */
    var ActivateNextStep = /** @class */ (function () {
        function ActivateNextStep() {
        }
        ActivateNextStep.prototype.run = function (navigationInstruction, next) {
            return processActivatable(navigationInstruction, 'activate', next, true);
        };
        return ActivateNextStep;
    }());

    /**
     * A multi-slots Pipeline Placeholder Step for hooking into a pipeline execution
     */
    var PipelineSlot = /** @class */ (function () {
        function PipelineSlot(container, name, alias) {
            this.steps = [];
            this.container = container;
            this.slotName = name;
            this.slotAlias = alias;
        }
        PipelineSlot.prototype.getSteps = function () {
            var _this = this;
            return this.steps.map(function (x) { return _this.container.get(x); });
        };
        return PipelineSlot;
    }());
    /**
     * Class responsible for creating the navigation pipeline.
     */
    var PipelineProvider = /** @class */ (function () {
        function PipelineProvider(container) {
            this.container = container;
            this.steps = [
                BuildNavigationPlanStep,
                CanDeactivatePreviousStep,
                LoadRouteStep,
                createPipelineSlot(container, "authorize" /* Authorize */),
                CanActivateNextStep,
                createPipelineSlot(container, "preActivate" /* PreActivate */, 'modelbind'),
                // NOTE: app state changes start below - point of no return
                DeactivatePreviousStep,
                ActivateNextStep,
                createPipelineSlot(container, "preRender" /* PreRender */, 'precommit'),
                CommitChangesStep,
                createPipelineSlot(container, "postRender" /* PostRender */, 'postcomplete')
            ];
        }
        /**@internal */
        PipelineProvider.inject = function () { return [aureliaDependencyInjection.Container]; };
        /**
         * Create the navigation pipeline.
         */
        PipelineProvider.prototype.createPipeline = function (useCanDeactivateStep) {
            var _this = this;
            if (useCanDeactivateStep === void 0) { useCanDeactivateStep = true; }
            var pipeline = new Pipeline();
            this.steps.forEach(function (step) {
                if (useCanDeactivateStep || step !== CanDeactivatePreviousStep) {
                    pipeline.addStep(_this.container.get(step));
                }
            });
            return pipeline;
        };
        /**@internal */
        PipelineProvider.prototype._findStep = function (name) {
            // Steps that are not PipelineSlots are constructor functions, and they will automatically fail. Probably.
            return this.steps.find(function (x) { return x.slotName === name || x.slotAlias === name; });
        };
        /**
         * Adds a step into the pipeline at a known slot location.
         */
        PipelineProvider.prototype.addStep = function (name, step) {
            var found = this._findStep(name);
            if (found) {
                var slotSteps = found.steps;
                // prevent duplicates
                if (!slotSteps.includes(step)) {
                    slotSteps.push(step);
                }
            }
            else {
                throw new Error("Invalid pipeline slot name: " + name + ".");
            }
        };
        /**
         * Removes a step from a slot in the pipeline
         */
        PipelineProvider.prototype.removeStep = function (name, step) {
            var slot = this._findStep(name);
            if (slot) {
                var slotSteps = slot.steps;
                slotSteps.splice(slotSteps.indexOf(step), 1);
            }
        };
        /**
         * Clears all steps from a slot in the pipeline
         * @internal
         */
        PipelineProvider.prototype._clearSteps = function (name) {
            if (name === void 0) { name = ''; }
            var slot = this._findStep(name);
            if (slot) {
                slot.steps = [];
            }
        };
        /**
         * Resets all pipeline slots
         */
        PipelineProvider.prototype.reset = function () {
            this._clearSteps("authorize" /* Authorize */);
            this._clearSteps("preActivate" /* PreActivate */);
            this._clearSteps("preRender" /* PreRender */);
            this._clearSteps("postRender" /* PostRender */);
        };
        return PipelineProvider;
    }());
    /**@internal */
    var createPipelineSlot = function (container, name, alias) {
        return new PipelineSlot(container, name, alias);
    };

    var logger = LogManager.getLogger('app-router');
    /**
     * The main application router.
     */
    var AppRouter = /** @class */ (function (_super) {
        __extends(AppRouter, _super);
        function AppRouter(container, history, pipelineProvider, events) {
            var _this = _super.call(this, container, history) || this;
            _this.pipelineProvider = pipelineProvider;
            _this.events = events;
            return _this;
        }
        /**@internal */
        AppRouter.inject = function () { return [aureliaDependencyInjection.Container, aureliaHistory.History, PipelineProvider, aureliaEventAggregator.EventAggregator]; };
        /**
         * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
         * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
         */
        AppRouter.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.maxInstructionCount = 10;
            if (!this._queue) {
                this._queue = [];
            }
            else {
                this._queue.length = 0;
            }
        };
        /**
         * Loads the specified URL.
         *
         * @param url The URL fragment to load.
         */
        AppRouter.prototype.loadUrl = function (url) {
            var _this = this;
            return this
                ._createNavigationInstruction(url)
                .then(function (instruction) { return _this._queueInstruction(instruction); })
                .catch(function (error) {
                logger.error(error);
                restorePreviousLocation(_this);
            });
        };
        /**
         * Registers a viewPort to be used as a rendering target for activated routes.
         *
         * @param viewPort The viewPort. This is typically a <router-view/> element in Aurelia default impl
         * @param name The name of the viewPort. 'default' if unspecified.
         */
        AppRouter.prototype.registerViewPort = function (viewPort, name) {
            var _this = this;
            // having strong typing without changing public API
            var $viewPort = viewPort;
            _super.prototype.registerViewPort.call(this, $viewPort, name);
            // beside adding viewport to the registry of this instance
            // AppRouter also configure routing/history to start routing functionality
            // There are situation where there are more than 1 <router-view/> element at root view
            // in that case, still only activate once via the following guard
            if (!this.isActive) {
                var viewModel_1 = this._findViewModel($viewPort);
                if ('configureRouter' in viewModel_1) {
                    // If there are more than one <router-view/> element at root view
                    // use this flag to guard against configure method being invoked multiple times
                    // this flag is set inside method configure
                    if (!this.isConfigured) {
                        // replace the real resolve with a noop to guarantee that any action in base class Router
                        // won't resolve the configurePromise prematurely
                        var resolveConfiguredPromise_1 = this._resolveConfiguredPromise;
                        this._resolveConfiguredPromise = function () { };
                        return this
                            .configure(function (config) {
                            return Promise
                                .resolve(viewModel_1.configureRouter(config, _this))
                                // an issue with configure interface. Should be fixed there
                                // todo: fix this via configure interface in router
                                .then(function () { return config; });
                        })
                            .then(function () {
                            _this.activate();
                            resolveConfiguredPromise_1();
                        });
                    }
                }
                else {
                    this.activate();
                }
            }
            // when a viewport is added dynamically to a root view that is already activated
            // just process the navigation instruction
            else {
                this._dequeueInstruction();
            }
            return Promise.resolve();
        };
        /**
         * Activates the router. This instructs the router to begin listening for history changes and processing instructions.
         *
         * @params options The set of options to activate the router with.
         */
        AppRouter.prototype.activate = function (options) {
            if (this.isActive) {
                return;
            }
            this.isActive = true;
            // route handler property is responsible for handling url change
            // the interface of aurelia-history isn't clear on this perspective
            this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
            this.history.activate(this.options);
            this._dequeueInstruction();
        };
        /**
         * Deactivates the router.
         */
        AppRouter.prototype.deactivate = function () {
            this.isActive = false;
            this.history.deactivate();
        };
        /**@internal */
        AppRouter.prototype._queueInstruction = function (instruction) {
            var _this = this;
            return new Promise(function (resolve) {
                instruction.resolve = resolve;
                _this._queue.unshift(instruction);
                _this._dequeueInstruction();
            });
        };
        /**@internal */
        AppRouter.prototype._dequeueInstruction = function (instructionCount) {
            var _this = this;
            if (instructionCount === void 0) { instructionCount = 0; }
            return Promise.resolve().then(function () {
                if (_this.isNavigating && !instructionCount) {
                    // ts complains about inconsistent returns without void 0
                    return void 0;
                }
                var instruction = _this._queue.shift();
                _this._queue.length = 0;
                if (!instruction) {
                    // ts complains about inconsistent returns without void 0
                    return void 0;
                }
                _this.isNavigating = true;
                var navtracker = _this.history.getState('NavigationTracker');
                var currentNavTracker = _this.currentNavigationTracker;
                if (!navtracker && !currentNavTracker) {
                    _this.isNavigatingFirst = true;
                    _this.isNavigatingNew = true;
                }
                else if (!navtracker) {
                    _this.isNavigatingNew = true;
                }
                else if (!currentNavTracker) {
                    _this.isNavigatingRefresh = true;
                }
                else if (currentNavTracker < navtracker) {
                    _this.isNavigatingForward = true;
                }
                else if (currentNavTracker > navtracker) {
                    _this.isNavigatingBack = true;
                }
                if (!navtracker) {
                    navtracker = Date.now();
                    _this.history.setState('NavigationTracker', navtracker);
                }
                _this.currentNavigationTracker = navtracker;
                instruction.previousInstruction = _this.currentInstruction;
                var maxInstructionCount = _this.maxInstructionCount;
                if (!instructionCount) {
                    _this.events.publish("router:navigation:processing" /* Processing */, { instruction: instruction });
                }
                else if (instructionCount === maxInstructionCount - 1) {
                    logger.error(instructionCount + 1 + " navigation instructions have been attempted without success. Restoring last known good location.");
                    restorePreviousLocation(_this);
                    return _this._dequeueInstruction(instructionCount + 1);
                }
                else if (instructionCount > maxInstructionCount) {
                    throw new Error('Maximum navigation attempts exceeded. Giving up.');
                }
                var pipeline = _this.pipelineProvider.createPipeline(!_this.couldDeactivate);
                return pipeline
                    .run(instruction)
                    .then(function (result) { return processResult(instruction, result, instructionCount, _this); })
                    .catch(function (error) {
                    return { output: error instanceof Error ? error : new Error(error) };
                })
                    .then(function (result) { return resolveInstruction(instruction, result, !!instructionCount, _this); });
            });
        };
        /**@internal */
        AppRouter.prototype._findViewModel = function (viewPort) {
            if (this.container.viewModel) {
                return this.container.viewModel;
            }
            if (viewPort.container) {
                var container = viewPort.container;
                while (container) {
                    if (container.viewModel) {
                        this.container.viewModel = container.viewModel;
                        return container.viewModel;
                    }
                    container = container.parent;
                }
            }
            return undefined;
        };
        return AppRouter;
    }(Router));
    var processResult = function (instruction, result, instructionCount, router) {
        if (!(result && 'completed' in result && 'output' in result)) {
            result = result || {};
            result.output = new Error("Expected router pipeline to return a navigation result, but got [" + JSON.stringify(result) + "] instead.");
        }
        var finalResult = null;
        var navigationCommandResult = null;
        if (isNavigationCommand(result.output)) {
            navigationCommandResult = result.output.navigate(router);
        }
        else {
            finalResult = result;
            if (!result.completed) {
                if (result.output instanceof Error) {
                    logger.error(result.output.toString());
                }
                restorePreviousLocation(router);
            }
        }
        return Promise.resolve(navigationCommandResult)
            .then(function (_) { return router._dequeueInstruction(instructionCount + 1); })
            .then(function (innerResult) { return finalResult || innerResult || result; });
    };
    var resolveInstruction = function (instruction, result, isInnerInstruction, router) {
        instruction.resolve(result);
        var eventAggregator = router.events;
        var eventArgs = { instruction: instruction, result: result };
        if (!isInnerInstruction) {
            router.isNavigating = false;
            router.isExplicitNavigation = false;
            router.isExplicitNavigationBack = false;
            router.isNavigatingFirst = false;
            router.isNavigatingNew = false;
            router.isNavigatingRefresh = false;
            router.isNavigatingForward = false;
            router.isNavigatingBack = false;
            router.couldDeactivate = false;
            var eventName = void 0;
            if (result.output instanceof Error) {
                eventName = "router:navigation:error" /* Error */;
            }
            else if (!result.completed) {
                eventName = "router:navigation:canceled" /* Canceled */;
            }
            else {
                var queryString = instruction.queryString ? ('?' + instruction.queryString) : '';
                router.history.previousLocation = instruction.fragment + queryString;
                eventName = "router:navigation:success" /* Success */;
            }
            eventAggregator.publish(eventName, eventArgs);
            eventAggregator.publish("router:navigation:complete" /* Complete */, eventArgs);
        }
        else {
            eventAggregator.publish("router:navigation:child:complete" /* ChildComplete */, eventArgs);
        }
        return result;
    };
    var restorePreviousLocation = function (router) {
        var previousLocation = router.history.previousLocation;
        if (previousLocation) {
            router.navigate(previousLocation, { trigger: false, replace: true });
        }
        else if (router.fallbackRoute) {
            router.navigate(router.fallbackRoute, { trigger: true, replace: true });
        }
        else {
            logger.error('Router navigation failed, and no previous location or fallbackRoute could be restored.');
        }
    };

    /**
    * The status of a Pipeline.
    */
    (function (PipelineStatus) {
        PipelineStatus["Completed"] = "completed";
        PipelineStatus["Canceled"] = "canceled";
        PipelineStatus["Rejected"] = "rejected";
        PipelineStatus["Running"] = "running";
    })(exports.PipelineStatus || (exports.PipelineStatus = {}));

    /**
     * A list of known router events used by the Aurelia router
     * to signal the pipeline has come to a certain state
     */
    (function (RouterEvent) {
        RouterEvent["Processing"] = "router:navigation:processing";
        RouterEvent["Error"] = "router:navigation:error";
        RouterEvent["Canceled"] = "router:navigation:canceled";
        RouterEvent["Complete"] = "router:navigation:complete";
        RouterEvent["Success"] = "router:navigation:success";
        RouterEvent["ChildComplete"] = "router:navigation:child:complete";
    })(exports.RouterEvent || (exports.RouterEvent = {}));

    /**
     * Available pipeline slot names to insert interceptor into router pipeline
     */
    (function (PipelineSlotName) {
        /**
         * Authorization slot. Invoked early in the pipeline,
         * before `canActivate` hook of incoming route
         */
        PipelineSlotName["Authorize"] = "authorize";
        /**
         * Pre-activation slot. Invoked early in the pipeline,
         * Invoked timing:
         *   - after Authorization slot
         *   - after canActivate hook on new view model
         *   - before deactivate hook on old view model
         *   - before activate hook on new view model
         */
        PipelineSlotName["PreActivate"] = "preActivate";
        /**
         * Pre-render slot. Invoked later in the pipeline
         * Invokcation timing:
         *   - after activate hook on new view model
         *   - before commit step on new navigation instruction
         */
        PipelineSlotName["PreRender"] = "preRender";
        /**
         * Post-render slot. Invoked last in the pipeline
         */
        PipelineSlotName["PostRender"] = "postRender";
    })(exports.PipelineSlotName || (exports.PipelineSlotName = {}));

    exports.ActivateNextStep = ActivateNextStep;
    exports.AppRouter = AppRouter;
    exports.BuildNavigationPlanStep = BuildNavigationPlanStep;
    exports.CanActivateNextStep = CanActivateNextStep;
    exports.CanDeactivatePreviousStep = CanDeactivatePreviousStep;
    exports.CommitChangesStep = CommitChangesStep;
    exports.DeactivatePreviousStep = DeactivatePreviousStep;
    exports.LoadRouteStep = LoadRouteStep;
    exports.NavModel = NavModel;
    exports.NavigationInstruction = NavigationInstruction;
    exports.Pipeline = Pipeline;
    exports.PipelineProvider = PipelineProvider;
    exports.Redirect = Redirect;
    exports.RedirectToRoute = RedirectToRoute;
    exports.RouteLoader = RouteLoader;
    exports.Router = Router;
    exports.RouterConfiguration = RouterConfiguration;
    exports.activationStrategy = activationStrategy;
    exports.isNavigationCommand = isNavigationCommand;

    Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=aurelia-router.js.map

define("aurelia-router/aurelia-router", [],function(){});

define('aurelia-task-queue/aurelia-task-queue',['exports', 'aurelia-pal'], function (exports, _aureliaPal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.TaskQueue = undefined;



  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var stackSeparator = '\nEnqueued in TaskQueue by:\n';
  var microStackSeparator = '\nEnqueued in MicroTaskQueue by:\n';

  function makeRequestFlushFromMutationObserver(flush) {
    var observer = _aureliaPal.DOM.createMutationObserver(flush);
    var val = 'a';
    var node = _aureliaPal.DOM.createTextNode('a');
    var values = Object.create(null);
    values.a = 'b';
    values.b = 'a';
    observer.observe(node, { characterData: true });
    return function requestFlush() {
      node.data = val = values[val];
    };
  }

  function makeRequestFlushFromTimer(flush) {
    return function requestFlush() {
      var timeoutHandle = setTimeout(handleFlushTimer, 0);

      var intervalHandle = setInterval(handleFlushTimer, 50);
      function handleFlushTimer() {
        clearTimeout(timeoutHandle);
        clearInterval(intervalHandle);
        flush();
      }
    };
  }

  function onError(error, task, longStacks) {
    if (longStacks && task.stack && (typeof error === 'undefined' ? 'undefined' : _typeof(error)) === 'object' && error !== null) {
      error.stack = filterFlushStack(error.stack) + task.stack;
    }

    if ('onError' in task) {
      task.onError(error);
    } else {
      setTimeout(function () {
        throw error;
      }, 0);
    }
  }

  var TaskQueue = exports.TaskQueue = function () {
    function TaskQueue() {
      var _this = this;



      this.flushing = false;
      this.longStacks = false;

      this.microTaskQueue = [];
      this.microTaskQueueCapacity = 1024;
      this.taskQueue = [];

      if (_aureliaPal.FEATURE.mutationObserver) {
        this.requestFlushMicroTaskQueue = makeRequestFlushFromMutationObserver(function () {
          return _this.flushMicroTaskQueue();
        });
      } else {
        this.requestFlushMicroTaskQueue = makeRequestFlushFromTimer(function () {
          return _this.flushMicroTaskQueue();
        });
      }

      this.requestFlushTaskQueue = makeRequestFlushFromTimer(function () {
        return _this.flushTaskQueue();
      });
    }

    TaskQueue.prototype._flushQueue = function _flushQueue(queue, capacity) {
      var index = 0;
      var task = void 0;

      try {
        this.flushing = true;
        while (index < queue.length) {
          task = queue[index];
          if (this.longStacks) {
            this.stack = typeof task.stack === 'string' ? task.stack : undefined;
          }
          task.call();
          index++;

          if (index > capacity) {
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
              queue[scan] = queue[scan + index];
            }

            queue.length -= index;
            index = 0;
          }
        }
      } catch (error) {
        onError(error, task, this.longStacks);
      } finally {
        this.flushing = false;
      }
    };

    TaskQueue.prototype.queueMicroTask = function queueMicroTask(task) {
      if (this.microTaskQueue.length < 1) {
        this.requestFlushMicroTaskQueue();
      }

      if (this.longStacks) {
        task.stack = this.prepareQueueStack(microStackSeparator);
      }

      this.microTaskQueue.push(task);
    };

    TaskQueue.prototype.queueTask = function queueTask(task) {
      if (this.taskQueue.length < 1) {
        this.requestFlushTaskQueue();
      }

      if (this.longStacks) {
        task.stack = this.prepareQueueStack(stackSeparator);
      }

      this.taskQueue.push(task);
    };

    TaskQueue.prototype.flushTaskQueue = function flushTaskQueue() {
      var queue = this.taskQueue;
      this.taskQueue = [];
      this._flushQueue(queue, Number.MAX_VALUE);
    };

    TaskQueue.prototype.flushMicroTaskQueue = function flushMicroTaskQueue() {
      var queue = this.microTaskQueue;
      this._flushQueue(queue, this.microTaskQueueCapacity);
      queue.length = 0;
    };

    TaskQueue.prototype.prepareQueueStack = function prepareQueueStack(separator) {
      var stack = separator + filterQueueStack(captureStack());

      if (typeof this.stack === 'string') {
        stack = filterFlushStack(stack) + this.stack;
      }

      return stack;
    };

    return TaskQueue;
  }();

  function captureStack() {
    var error = new Error();

    if (error.stack) {
      return error.stack;
    }

    try {
      throw error;
    } catch (e) {
      return e.stack;
    }
  }

  function filterQueueStack(stack) {
    return stack.replace(/^[\s\S]*?\bqueue(Micro)?Task\b[^\n]*\n/, '');
  }

  function filterFlushStack(stack) {
    var index = stack.lastIndexOf('flushMicroTaskQueue');

    if (index < 0) {
      index = stack.lastIndexOf('flushTaskQueue');
      if (index < 0) {
        return stack;
      }
    }

    index = stack.lastIndexOf('\n', index);

    return index < 0 ? stack : stack.substr(0, index);
  }
});;define('aurelia-task-queue', ['aurelia-task-queue/aurelia-task-queue'], function (main) { return main; });

define('aurelia-templating/aurelia-templating',['exports', 'aurelia-logging', 'aurelia-metadata', 'aurelia-pal', 'aurelia-loader', 'aurelia-path', 'aurelia-binding', 'aurelia-dependency-injection', 'aurelia-task-queue'], function (exports, _aureliaLogging, _aureliaMetadata, _aureliaPal, _aureliaLoader, _aureliaPath, _aureliaBinding, _aureliaDependencyInjection, _aureliaTaskQueue) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.TemplatingEngine = exports.ElementConfigResource = exports.CompositionEngine = exports.SwapStrategies = exports.HtmlBehaviorResource = exports.BindableProperty = exports.BehaviorPropertyObserver = exports.Controller = exports.ViewEngine = exports.ModuleAnalyzer = exports.ResourceDescription = exports.ResourceModule = exports.ViewCompiler = exports.ViewFactory = exports.BoundViewFactory = exports.ViewSlot = exports.View = exports.ViewResources = exports.ShadowDOM = exports.ShadowSlot = exports.PassThroughSlot = exports.SlotCustomAttribute = exports.BindingLanguage = exports.ViewLocator = exports.StaticViewStrategy = exports.InlineViewStrategy = exports.TemplateRegistryViewStrategy = exports.NoViewStrategy = exports.ConventionalViewStrategy = exports.RelativeViewStrategy = exports.viewStrategy = exports.TargetInstruction = exports.BehaviorInstruction = exports.ViewCompileInstruction = exports.ResourceLoadContext = exports.ElementEvents = exports.ViewEngineHooksResource = exports.CompositionTransaction = exports.CompositionTransactionOwnershipToken = exports.CompositionTransactionNotifier = exports.Animator = exports.animationEvent = undefined;
  exports._hyphenate = _hyphenate;
  exports._isAllWhitespace = _isAllWhitespace;
  exports.viewEngineHooks = viewEngineHooks;
  exports.validateBehaviorName = validateBehaviorName;
  exports.children = children;
  exports.child = child;
  exports.resource = resource;
  exports.behavior = behavior;
  exports.customElement = customElement;
  exports.customAttribute = customAttribute;
  exports.templateController = templateController;
  exports.bindable = bindable;
  exports.dynamicOptions = dynamicOptions;
  exports.useShadowDOM = useShadowDOM;
  exports.processAttributes = processAttributes;
  exports.processContent = processContent;
  exports.containerless = containerless;
  exports.useViewStrategy = useViewStrategy;
  exports.useView = useView;
  exports.inlineView = inlineView;
  exports.noView = noView;
  exports.view = view;
  exports.elementConfig = elementConfig;
  exports.viewResources = viewResources;

  var LogManager = _interopRequireWildcard(_aureliaLogging);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var _class, _temp, _class2, _temp2, _dec, _class3, _dec2, _class4, _dec3, _class5, _dec4, _class6, _dec5, _class7, _dec6, _class8, _class9, _temp3, _class10, _temp4, _class12, _dec7, _class14, _dec8, _class15, _class16, _temp5, _dec9, _class17, _dec10, _class18, _dec11, _class19;



  var animationEvent = exports.animationEvent = {
    enterBegin: 'animation:enter:begin',
    enterActive: 'animation:enter:active',
    enterDone: 'animation:enter:done',
    enterTimeout: 'animation:enter:timeout',

    leaveBegin: 'animation:leave:begin',
    leaveActive: 'animation:leave:active',
    leaveDone: 'animation:leave:done',
    leaveTimeout: 'animation:leave:timeout',

    staggerNext: 'animation:stagger:next',

    removeClassBegin: 'animation:remove-class:begin',
    removeClassActive: 'animation:remove-class:active',
    removeClassDone: 'animation:remove-class:done',
    removeClassTimeout: 'animation:remove-class:timeout',

    addClassBegin: 'animation:add-class:begin',
    addClassActive: 'animation:add-class:active',
    addClassDone: 'animation:add-class:done',
    addClassTimeout: 'animation:add-class:timeout',

    animateBegin: 'animation:animate:begin',
    animateActive: 'animation:animate:active',
    animateDone: 'animation:animate:done',
    animateTimeout: 'animation:animate:timeout',

    sequenceBegin: 'animation:sequence:begin',
    sequenceDone: 'animation:sequence:done'
  };

  var Animator = exports.Animator = function () {
    function Animator() {

    }

    Animator.prototype.enter = function enter(element) {
      return Promise.resolve(false);
    };

    Animator.prototype.leave = function leave(element) {
      return Promise.resolve(false);
    };

    Animator.prototype.removeClass = function removeClass(element, className) {
      element.classList.remove(className);
      return Promise.resolve(false);
    };

    Animator.prototype.addClass = function addClass(element, className) {
      element.classList.add(className);
      return Promise.resolve(false);
    };

    Animator.prototype.animate = function animate(element, className) {
      return Promise.resolve(false);
    };

    Animator.prototype.runSequence = function runSequence(animations) {};

    Animator.prototype.registerEffect = function registerEffect(effectName, properties) {};

    Animator.prototype.unregisterEffect = function unregisterEffect(effectName) {};

    return Animator;
  }();

  var CompositionTransactionNotifier = exports.CompositionTransactionNotifier = function () {
    function CompositionTransactionNotifier(owner) {


      this.owner = owner;
      this.owner._compositionCount++;
    }

    CompositionTransactionNotifier.prototype.done = function done() {
      this.owner._compositionCount--;
      this.owner._tryCompleteTransaction();
    };

    return CompositionTransactionNotifier;
  }();

  var CompositionTransactionOwnershipToken = exports.CompositionTransactionOwnershipToken = function () {
    function CompositionTransactionOwnershipToken(owner) {


      this.owner = owner;
      this.owner._ownershipToken = this;
      this.thenable = this._createThenable();
    }

    CompositionTransactionOwnershipToken.prototype.waitForCompositionComplete = function waitForCompositionComplete() {
      this.owner._tryCompleteTransaction();
      return this.thenable;
    };

    CompositionTransactionOwnershipToken.prototype.resolve = function resolve() {
      this._resolveCallback();
    };

    CompositionTransactionOwnershipToken.prototype._createThenable = function _createThenable() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this._resolveCallback = resolve;
      });
    };

    return CompositionTransactionOwnershipToken;
  }();

  var CompositionTransaction = exports.CompositionTransaction = function () {
    function CompositionTransaction() {


      this._ownershipToken = null;
      this._compositionCount = 0;
    }

    CompositionTransaction.prototype.tryCapture = function tryCapture() {
      return this._ownershipToken === null ? new CompositionTransactionOwnershipToken(this) : null;
    };

    CompositionTransaction.prototype.enlist = function enlist() {
      return new CompositionTransactionNotifier(this);
    };

    CompositionTransaction.prototype._tryCompleteTransaction = function _tryCompleteTransaction() {
      if (this._compositionCount <= 0) {
        this._compositionCount = 0;

        if (this._ownershipToken !== null) {
          var token = this._ownershipToken;
          this._ownershipToken = null;
          token.resolve();
        }
      }
    };

    return CompositionTransaction;
  }();

  var capitalMatcher = /([A-Z])/g;

  function addHyphenAndLower(char) {
    return '-' + char.toLowerCase();
  }

  function _hyphenate(name) {
    return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
  }

  function _isAllWhitespace(node) {
    return !(node.auInterpolationTarget || /[^\t\n\r ]/.test(node.textContent));
  }

  var ViewEngineHooksResource = exports.ViewEngineHooksResource = function () {
    function ViewEngineHooksResource() {

    }

    ViewEngineHooksResource.prototype.initialize = function initialize(container, target) {
      this.instance = container.get(target);
    };

    ViewEngineHooksResource.prototype.register = function register(registry, name) {
      registry.registerViewEngineHooks(this.instance);
    };

    ViewEngineHooksResource.prototype.load = function load(container, target) {};

    ViewEngineHooksResource.convention = function convention(name) {
      if (name.endsWith('ViewEngineHooks')) {
        return new ViewEngineHooksResource();
      }
    };

    return ViewEngineHooksResource;
  }();

  function viewEngineHooks(target) {
    var deco = function deco(t) {
      _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, new ViewEngineHooksResource(), t);
    };

    return target ? deco(target) : deco;
  }

  var ElementEvents = exports.ElementEvents = (_temp = _class = function () {
    function ElementEvents(element) {


      this.element = element;
      this.subscriptions = {};
    }

    ElementEvents.prototype._enqueueHandler = function _enqueueHandler(handler) {
      this.subscriptions[handler.eventName] = this.subscriptions[handler.eventName] || [];
      this.subscriptions[handler.eventName].push(handler);
    };

    ElementEvents.prototype._dequeueHandler = function _dequeueHandler(handler) {
      var index = void 0;
      var subscriptions = this.subscriptions[handler.eventName];
      if (subscriptions) {
        index = subscriptions.indexOf(handler);
        if (index > -1) {
          subscriptions.splice(index, 1);
        }
      }
      return handler;
    };

    ElementEvents.prototype.publish = function publish(eventName) {
      var detail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var bubbles = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var cancelable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var event = _aureliaPal.DOM.createCustomEvent(eventName, { cancelable: cancelable, bubbles: bubbles, detail: detail });
      this.element.dispatchEvent(event);
    };

    ElementEvents.prototype.subscribe = function subscribe(eventName, handler, captureOrOptions) {
      if (typeof handler === 'function') {
        if (captureOrOptions === undefined) {
          captureOrOptions = ElementEvents.defaultListenerOptions;
        }
        var eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, false);
        return eventHandler;
      }

      return undefined;
    };

    ElementEvents.prototype.subscribeOnce = function subscribeOnce(eventName, handler, captureOrOptions) {
      if (typeof handler === 'function') {
        if (captureOrOptions === undefined) {
          captureOrOptions = ElementEvents.defaultListenerOptions;
        }
        var eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, true);
        return eventHandler;
      }

      return undefined;
    };

    ElementEvents.prototype.dispose = function dispose(eventName) {
      if (eventName && typeof eventName === 'string') {
        var subscriptions = this.subscriptions[eventName];
        if (subscriptions) {
          while (subscriptions.length) {
            var subscription = subscriptions.pop();
            if (subscription) {
              subscription.dispose();
            }
          }
        }
      } else {
        this.disposeAll();
      }
    };

    ElementEvents.prototype.disposeAll = function disposeAll() {
      for (var _key in this.subscriptions) {
        this.dispose(_key);
      }
    };

    return ElementEvents;
  }(), _class.defaultListenerOptions = true, _temp);

  var EventHandlerImpl = function () {
    function EventHandlerImpl(owner, eventName, handler, captureOrOptions, once) {


      this.owner = owner;
      this.eventName = eventName;
      this.handler = handler;

      this.capture = typeof captureOrOptions === 'boolean' ? captureOrOptions : captureOrOptions.capture;
      this.bubbles = !this.capture;
      this.captureOrOptions = captureOrOptions;
      this.once = once;
      owner.element.addEventListener(eventName, this, captureOrOptions);
      owner._enqueueHandler(this);
    }

    EventHandlerImpl.prototype.handleEvent = function handleEvent(e) {
      var fn = this.handler;
      fn(e);
      if (this.once) {
        this.dispose();
      }
    };

    EventHandlerImpl.prototype.dispose = function dispose() {
      this.owner.element.removeEventListener(this.eventName, this, this.captureOrOptions);
      this.owner._dequeueHandler(this);
      this.owner = this.handler = null;
    };

    return EventHandlerImpl;
  }();

  var ResourceLoadContext = exports.ResourceLoadContext = function () {
    function ResourceLoadContext() {


      this.dependencies = {};
    }

    ResourceLoadContext.prototype.addDependency = function addDependency(url) {
      this.dependencies[url] = true;
    };

    ResourceLoadContext.prototype.hasDependency = function hasDependency(url) {
      return url in this.dependencies;
    };

    return ResourceLoadContext;
  }();

  var ViewCompileInstruction = exports.ViewCompileInstruction = function ViewCompileInstruction() {
    var targetShadowDOM = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var compileSurrogate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;



    this.targetShadowDOM = targetShadowDOM;
    this.compileSurrogate = compileSurrogate;
    this.associatedModuleId = null;
  };

  ViewCompileInstruction.normal = new ViewCompileInstruction();

  var BehaviorInstruction = exports.BehaviorInstruction = function () {
    function BehaviorInstruction() {

    }

    BehaviorInstruction.enhance = function enhance() {
      var instruction = new BehaviorInstruction();
      instruction.enhance = true;
      return instruction;
    };

    BehaviorInstruction.unitTest = function unitTest(type, attributes) {
      var instruction = new BehaviorInstruction();
      instruction.type = type;
      instruction.attributes = attributes || {};
      return instruction;
    };

    BehaviorInstruction.element = function element(node, type) {
      var instruction = new BehaviorInstruction();
      instruction.type = type;
      instruction.attributes = {};
      instruction.anchorIsContainer = !(node.hasAttribute('containerless') || type.containerless);
      instruction.initiatedByBehavior = true;
      return instruction;
    };

    BehaviorInstruction.attribute = function attribute(attrName, type) {
      var instruction = new BehaviorInstruction();
      instruction.attrName = attrName;
      instruction.type = type || null;
      instruction.attributes = {};
      return instruction;
    };

    BehaviorInstruction.dynamic = function dynamic(host, viewModel, viewFactory) {
      var instruction = new BehaviorInstruction();
      instruction.host = host;
      instruction.viewModel = viewModel;
      instruction.viewFactory = viewFactory;
      instruction.inheritBindingContext = true;
      return instruction;
    };

    return BehaviorInstruction;
  }();

  var biProto = BehaviorInstruction.prototype;
  biProto.initiatedByBehavior = false;
  biProto.enhance = false;
  biProto.partReplacements = null;
  biProto.viewFactory = null;
  biProto.originalAttrName = null;
  biProto.skipContentProcessing = false;
  biProto.contentFactory = null;
  biProto.viewModel = null;
  biProto.anchorIsContainer = false;
  biProto.host = null;
  biProto.attributes = null;
  biProto.type = null;
  biProto.attrName = null;
  biProto.inheritBindingContext = false;

  BehaviorInstruction.normal = new BehaviorInstruction();

  var TargetInstruction = exports.TargetInstruction = (_temp2 = _class2 = function () {
    function TargetInstruction() {

    }

    TargetInstruction.shadowSlot = function shadowSlot(parentInjectorId) {
      var instruction = new TargetInstruction();
      instruction.parentInjectorId = parentInjectorId;
      instruction.shadowSlot = true;
      return instruction;
    };

    TargetInstruction.contentExpression = function contentExpression(expression) {
      var instruction = new TargetInstruction();
      instruction.contentExpression = expression;
      return instruction;
    };

    TargetInstruction.letElement = function letElement(expressions) {
      var instruction = new TargetInstruction();
      instruction.expressions = expressions;
      instruction.letElement = true;
      return instruction;
    };

    TargetInstruction.lifting = function lifting(parentInjectorId, liftingInstruction) {
      var instruction = new TargetInstruction();
      instruction.parentInjectorId = parentInjectorId;
      instruction.expressions = TargetInstruction.noExpressions;
      instruction.behaviorInstructions = [liftingInstruction];
      instruction.viewFactory = liftingInstruction.viewFactory;
      instruction.providers = [liftingInstruction.type.target];
      instruction.lifting = true;
      return instruction;
    };

    TargetInstruction.normal = function normal(injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction) {
      var instruction = new TargetInstruction();
      instruction.injectorId = injectorId;
      instruction.parentInjectorId = parentInjectorId;
      instruction.providers = providers;
      instruction.behaviorInstructions = behaviorInstructions;
      instruction.expressions = expressions;
      instruction.anchorIsContainer = elementInstruction ? elementInstruction.anchorIsContainer : true;
      instruction.elementInstruction = elementInstruction;
      return instruction;
    };

    TargetInstruction.surrogate = function surrogate(providers, behaviorInstructions, expressions, values) {
      var instruction = new TargetInstruction();
      instruction.expressions = expressions;
      instruction.behaviorInstructions = behaviorInstructions;
      instruction.providers = providers;
      instruction.values = values;
      return instruction;
    };

    return TargetInstruction;
  }(), _class2.noExpressions = Object.freeze([]), _temp2);


  var tiProto = TargetInstruction.prototype;

  tiProto.injectorId = null;
  tiProto.parentInjectorId = null;

  tiProto.shadowSlot = false;
  tiProto.slotName = null;
  tiProto.slotFallbackFactory = null;

  tiProto.contentExpression = null;
  tiProto.letElement = false;

  tiProto.expressions = null;
  tiProto.expressions = null;
  tiProto.providers = null;

  tiProto.viewFactory = null;

  tiProto.anchorIsContainer = false;
  tiProto.elementInstruction = null;
  tiProto.lifting = false;

  tiProto.values = null;

  var viewStrategy = exports.viewStrategy = _aureliaMetadata.protocol.create('aurelia:view-strategy', {
    validate: function validate(target) {
      if (!(typeof target.loadViewFactory === 'function')) {
        return 'View strategies must implement: loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory>';
      }

      return true;
    },
    compose: function compose(target) {
      if (!(typeof target.makeRelativeTo === 'function')) {
        target.makeRelativeTo = _aureliaPal.PLATFORM.noop;
      }
    }
  });

  var RelativeViewStrategy = exports.RelativeViewStrategy = (_dec = viewStrategy(), _dec(_class3 = function () {
    function RelativeViewStrategy(path) {


      this.path = path;
      this.absolutePath = null;
    }

    RelativeViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
      if (this.absolutePath === null && this.moduleId) {
        this.absolutePath = (0, _aureliaPath.relativeToFile)(this.path, this.moduleId);
      }

      compileInstruction.associatedModuleId = this.moduleId;
      return viewEngine.loadViewFactory(this.absolutePath || this.path, compileInstruction, loadContext, target);
    };

    RelativeViewStrategy.prototype.makeRelativeTo = function makeRelativeTo(file) {
      if (this.absolutePath === null) {
        this.absolutePath = (0, _aureliaPath.relativeToFile)(this.path, file);
      }
    };

    return RelativeViewStrategy;
  }()) || _class3);
  var ConventionalViewStrategy = exports.ConventionalViewStrategy = (_dec2 = viewStrategy(), _dec2(_class4 = function () {
    function ConventionalViewStrategy(viewLocator, origin) {


      this.moduleId = origin.moduleId;
      this.viewUrl = viewLocator.convertOriginToViewUrl(origin);
    }

    ConventionalViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
      compileInstruction.associatedModuleId = this.moduleId;
      return viewEngine.loadViewFactory(this.viewUrl, compileInstruction, loadContext, target);
    };

    return ConventionalViewStrategy;
  }()) || _class4);
  var NoViewStrategy = exports.NoViewStrategy = (_dec3 = viewStrategy(), _dec3(_class5 = function () {
    function NoViewStrategy(dependencies, dependencyBaseUrl) {


      this.dependencies = dependencies || null;
      this.dependencyBaseUrl = dependencyBaseUrl || '';
    }

    NoViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
      var entry = this.entry;
      var dependencies = this.dependencies;

      if (entry && entry.factoryIsReady) {
        return Promise.resolve(null);
      }

      this.entry = entry = new _aureliaLoader.TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);

      entry.dependencies = [];
      entry.templateIsLoaded = true;

      if (dependencies !== null) {
        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
          var current = dependencies[i];

          if (typeof current === 'string' || typeof current === 'function') {
            entry.addDependency(current);
          } else {
            entry.addDependency(current.from, current.as);
          }
        }
      }

      compileInstruction.associatedModuleId = this.moduleId;

      return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
    };

    return NoViewStrategy;
  }()) || _class5);
  var TemplateRegistryViewStrategy = exports.TemplateRegistryViewStrategy = (_dec4 = viewStrategy(), _dec4(_class6 = function () {
    function TemplateRegistryViewStrategy(moduleId, entry) {


      this.moduleId = moduleId;
      this.entry = entry;
    }

    TemplateRegistryViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
      var entry = this.entry;

      if (entry.factoryIsReady) {
        return Promise.resolve(entry.factory);
      }

      compileInstruction.associatedModuleId = this.moduleId;
      return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
    };

    return TemplateRegistryViewStrategy;
  }()) || _class6);
  var InlineViewStrategy = exports.InlineViewStrategy = (_dec5 = viewStrategy(), _dec5(_class7 = function () {
    function InlineViewStrategy(markup, dependencies, dependencyBaseUrl) {


      this.markup = markup;
      this.dependencies = dependencies || null;
      this.dependencyBaseUrl = dependencyBaseUrl || '';
    }

    InlineViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
      var entry = this.entry;
      var dependencies = this.dependencies;

      if (entry && entry.factoryIsReady) {
        return Promise.resolve(entry.factory);
      }

      this.entry = entry = new _aureliaLoader.TemplateRegistryEntry(this.moduleId || this.dependencyBaseUrl);
      entry.template = _aureliaPal.DOM.createTemplateFromMarkup(this.markup);

      if (dependencies !== null) {
        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
          var current = dependencies[i];

          if (typeof current === 'string' || typeof current === 'function') {
            entry.addDependency(current);
          } else {
            entry.addDependency(current.from, current.as);
          }
        }
      }

      compileInstruction.associatedModuleId = this.moduleId;
      return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
    };

    return InlineViewStrategy;
  }()) || _class7);
  var StaticViewStrategy = exports.StaticViewStrategy = (_dec6 = viewStrategy(), _dec6(_class8 = function () {
    function StaticViewStrategy(config) {


      if (typeof config === 'string' || config instanceof _aureliaPal.DOM.Element && config.tagName === 'TEMPLATE') {
        config = {
          template: config
        };
      }
      this.template = config.template;
      this.dependencies = config.dependencies || [];
      this.factoryIsReady = false;
      this.onReady = null;
      this.moduleId = 'undefined';
    }

    StaticViewStrategy.prototype.loadViewFactory = function loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
      var _this2 = this;

      if (this.factoryIsReady) {
        return Promise.resolve(this.factory);
      }
      var deps = this.dependencies;
      deps = typeof deps === 'function' ? deps() : deps;
      deps = deps ? deps : [];
      deps = Array.isArray(deps) ? deps : [deps];

      return Promise.all(deps).then(function (dependencies) {
        var container = viewEngine.container;
        var appResources = viewEngine.appResources;
        var viewCompiler = viewEngine.viewCompiler;
        var viewResources = new ViewResources(appResources);

        var resource = void 0;
        var elDeps = [];

        if (target) {
          viewResources.autoRegister(container, target);
        }

        for (var _iterator = dependencies, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var dep = _ref;

          if (typeof dep === 'function') {
            resource = viewResources.autoRegister(container, dep);
            if (resource.elementName !== null) {
              elDeps.push(resource);
            }
          } else if (dep && (typeof dep === 'undefined' ? 'undefined' : _typeof(dep)) === 'object') {
            for (var _key2 in dep) {
              var exported = dep[_key2];
              if (typeof exported === 'function') {
                resource = viewResources.autoRegister(container, exported);
                if (resource.elementName !== null) {
                  elDeps.push(resource);
                }
              }
            }
          } else {
            throw new Error('dependency neither function nor object. Received: "' + (typeof dep === 'undefined' ? 'undefined' : _typeof(dep)) + '"');
          }
        }

        return Promise.all(elDeps.map(function (el) {
          return el.load(container, el.target);
        })).then(function () {
          var factory = _this2.template !== null ? viewCompiler.compile(_this2.template, viewResources, compileInstruction) : null;
          _this2.factoryIsReady = true;
          _this2.factory = factory;
          return factory;
        });
      });
    };

    return StaticViewStrategy;
  }()) || _class8);
  var ViewLocator = exports.ViewLocator = (_temp3 = _class9 = function () {
    function ViewLocator() {

    }

    ViewLocator.prototype.getViewStrategy = function getViewStrategy(value) {
      if (!value) {
        return null;
      }

      if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && 'getViewStrategy' in value) {
        var _origin = _aureliaMetadata.Origin.get(value.constructor);

        value = value.getViewStrategy();

        if (typeof value === 'string') {
          value = new RelativeViewStrategy(value);
        }

        viewStrategy.assert(value);

        if (_origin.moduleId) {
          value.makeRelativeTo(_origin.moduleId);
        }

        return value;
      }

      if (typeof value === 'string') {
        value = new RelativeViewStrategy(value);
      }

      if (viewStrategy.validate(value)) {
        return value;
      }

      if (typeof value !== 'function') {
        value = value.constructor;
      }

      if ('$view' in value) {
        var c = value.$view;
        var _view = void 0;
        c = typeof c === 'function' ? c.call(value) : c;
        if (c === null) {
          _view = new NoViewStrategy();
        } else {
          _view = c instanceof StaticViewStrategy ? c : new StaticViewStrategy(c);
        }
        _aureliaMetadata.metadata.define(ViewLocator.viewStrategyMetadataKey, _view, value);
        return _view;
      }

      var origin = _aureliaMetadata.Origin.get(value);
      var strategy = _aureliaMetadata.metadata.get(ViewLocator.viewStrategyMetadataKey, value);

      if (!strategy) {
        if (!origin.moduleId) {
          throw new Error('Cannot determine default view strategy for object.', value);
        }

        strategy = this.createFallbackViewStrategy(origin);
      } else if (origin.moduleId) {
        strategy.moduleId = origin.moduleId;
      }

      return strategy;
    };

    ViewLocator.prototype.createFallbackViewStrategy = function createFallbackViewStrategy(origin) {
      return new ConventionalViewStrategy(this, origin);
    };

    ViewLocator.prototype.convertOriginToViewUrl = function convertOriginToViewUrl(origin) {
      var moduleId = origin.moduleId;
      var id = moduleId.endsWith('.js') || moduleId.endsWith('.ts') ? moduleId.substring(0, moduleId.length - 3) : moduleId;
      return id + '.html';
    };

    return ViewLocator;
  }(), _class9.viewStrategyMetadataKey = 'aurelia:view-strategy', _temp3);


  function mi(name) {
    throw new Error('BindingLanguage must implement ' + name + '().');
  }

  var BindingLanguage = exports.BindingLanguage = function () {
    function BindingLanguage() {

    }

    BindingLanguage.prototype.inspectAttribute = function inspectAttribute(resources, elementName, attrName, attrValue) {
      mi('inspectAttribute');
    };

    BindingLanguage.prototype.createAttributeInstruction = function createAttributeInstruction(resources, element, info, existingInstruction) {
      mi('createAttributeInstruction');
    };

    BindingLanguage.prototype.createLetExpressions = function createLetExpressions(resources, element) {
      mi('createLetExpressions');
    };

    BindingLanguage.prototype.inspectTextContent = function inspectTextContent(resources, value) {
      mi('inspectTextContent');
    };

    return BindingLanguage;
  }();

  var noNodes = Object.freeze([]);

  var SlotCustomAttribute = exports.SlotCustomAttribute = function () {
    SlotCustomAttribute.inject = function inject() {
      return [_aureliaPal.DOM.Element];
    };

    function SlotCustomAttribute(element) {


      this.element = element;
      this.element.auSlotAttribute = this;
    }

    SlotCustomAttribute.prototype.valueChanged = function valueChanged(newValue, oldValue) {};

    return SlotCustomAttribute;
  }();

  var PassThroughSlot = exports.PassThroughSlot = function () {
    function PassThroughSlot(anchor, name, destinationName, fallbackFactory) {


      this.anchor = anchor;
      this.anchor.viewSlot = this;
      this.name = name;
      this.destinationName = destinationName;
      this.fallbackFactory = fallbackFactory;
      this.destinationSlot = null;
      this.projections = 0;
      this.contentView = null;

      var attr = new SlotCustomAttribute(this.anchor);
      attr.value = this.destinationName;
    }

    PassThroughSlot.prototype.renderFallbackContent = function renderFallbackContent(view, nodes, projectionSource, index) {
      if (this.contentView === null) {
        this.contentView = this.fallbackFactory.create(this.ownerView.container);
        this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);

        var slots = Object.create(null);
        slots[this.destinationSlot.name] = this.destinationSlot;

        ShadowDOM.distributeView(this.contentView, slots, projectionSource, index, this.destinationSlot.name);
      }
    };

    PassThroughSlot.prototype.passThroughTo = function passThroughTo(destinationSlot) {
      this.destinationSlot = destinationSlot;
    };

    PassThroughSlot.prototype.addNode = function addNode(view, node, projectionSource, index) {
      if (this.contentView !== null) {
        this.contentView.removeNodes();
        this.contentView.detached();
        this.contentView.unbind();
        this.contentView = null;
      }

      if (node.viewSlot instanceof PassThroughSlot) {
        node.viewSlot.passThroughTo(this);
        return;
      }

      this.projections++;
      this.destinationSlot.addNode(view, node, projectionSource, index);
    };

    PassThroughSlot.prototype.removeView = function removeView(view, projectionSource) {
      this.projections--;
      this.destinationSlot.removeView(view, projectionSource);

      if (this.needsFallbackRendering) {
        this.renderFallbackContent(null, noNodes, projectionSource);
      }
    };

    PassThroughSlot.prototype.removeAll = function removeAll(projectionSource) {
      this.projections = 0;
      this.destinationSlot.removeAll(projectionSource);

      if (this.needsFallbackRendering) {
        this.renderFallbackContent(null, noNodes, projectionSource);
      }
    };

    PassThroughSlot.prototype.projectFrom = function projectFrom(view, projectionSource) {
      this.destinationSlot.projectFrom(view, projectionSource);
    };

    PassThroughSlot.prototype.created = function created(ownerView) {
      this.ownerView = ownerView;
    };

    PassThroughSlot.prototype.bind = function bind(view) {
      if (this.contentView) {
        this.contentView.bind(view.bindingContext, view.overrideContext);
      }
    };

    PassThroughSlot.prototype.attached = function attached() {
      if (this.contentView) {
        this.contentView.attached();
      }
    };

    PassThroughSlot.prototype.detached = function detached() {
      if (this.contentView) {
        this.contentView.detached();
      }
    };

    PassThroughSlot.prototype.unbind = function unbind() {
      if (this.contentView) {
        this.contentView.unbind();
      }
    };

    _createClass(PassThroughSlot, [{
      key: 'needsFallbackRendering',
      get: function get() {
        return this.fallbackFactory && this.projections === 0;
      }
    }]);

    return PassThroughSlot;
  }();

  var ShadowSlot = exports.ShadowSlot = function () {
    function ShadowSlot(anchor, name, fallbackFactory) {


      this.anchor = anchor;
      this.anchor.isContentProjectionSource = true;
      this.anchor.viewSlot = this;
      this.name = name;
      this.fallbackFactory = fallbackFactory;
      this.contentView = null;
      this.projections = 0;
      this.children = [];
      this.projectFromAnchors = null;
      this.destinationSlots = null;
    }

    ShadowSlot.prototype.addNode = function addNode(view, node, projectionSource, index, destination) {
      if (this.contentView !== null) {
        this.contentView.removeNodes();
        this.contentView.detached();
        this.contentView.unbind();
        this.contentView = null;
      }

      if (node.viewSlot instanceof PassThroughSlot) {
        node.viewSlot.passThroughTo(this);
        return;
      }

      if (this.destinationSlots !== null) {
        ShadowDOM.distributeNodes(view, [node], this.destinationSlots, this, index);
      } else {
        node.auOwnerView = view;
        node.auProjectionSource = projectionSource;
        node.auAssignedSlot = this;

        var anchor = this._findAnchor(view, node, projectionSource, index);
        var parent = anchor.parentNode;

        parent.insertBefore(node, anchor);
        this.children.push(node);
        this.projections++;
      }
    };

    ShadowSlot.prototype.removeView = function removeView(view, projectionSource) {
      if (this.destinationSlots !== null) {
        ShadowDOM.undistributeView(view, this.destinationSlots, this);
      } else if (this.contentView && this.contentView.hasSlots) {
        ShadowDOM.undistributeView(view, this.contentView.slots, projectionSource);
      } else {
        var found = this.children.find(function (x) {
          return x.auSlotProjectFrom === projectionSource;
        });
        if (found) {
          var _children = found.auProjectionChildren;

          for (var i = 0, ii = _children.length; i < ii; ++i) {
            var _child = _children[i];

            if (_child.auOwnerView === view) {
              _children.splice(i, 1);
              view.fragment.appendChild(_child);
              i--;ii--;
              this.projections--;
            }
          }

          if (this.needsFallbackRendering) {
            this.renderFallbackContent(view, noNodes, projectionSource);
          }
        }
      }
    };

    ShadowSlot.prototype.removeAll = function removeAll(projectionSource) {
      if (this.destinationSlots !== null) {
        ShadowDOM.undistributeAll(this.destinationSlots, this);
      } else if (this.contentView && this.contentView.hasSlots) {
        ShadowDOM.undistributeAll(this.contentView.slots, projectionSource);
      } else {
        var found = this.children.find(function (x) {
          return x.auSlotProjectFrom === projectionSource;
        });

        if (found) {
          var _children2 = found.auProjectionChildren;
          for (var i = 0, ii = _children2.length; i < ii; ++i) {
            var _child2 = _children2[i];
            _child2.auOwnerView.fragment.appendChild(_child2);
            this.projections--;
          }

          found.auProjectionChildren = [];

          if (this.needsFallbackRendering) {
            this.renderFallbackContent(null, noNodes, projectionSource);
          }
        }
      }
    };

    ShadowSlot.prototype._findAnchor = function _findAnchor(view, node, projectionSource, index) {
      if (projectionSource) {
        var found = this.children.find(function (x) {
          return x.auSlotProjectFrom === projectionSource;
        });
        if (found) {
          if (index !== undefined) {
            var _children3 = found.auProjectionChildren;
            var viewIndex = -1;
            var lastView = void 0;

            for (var i = 0, ii = _children3.length; i < ii; ++i) {
              var current = _children3[i];

              if (current.auOwnerView !== lastView) {
                viewIndex++;
                lastView = current.auOwnerView;

                if (viewIndex >= index && lastView !== view) {
                  _children3.splice(i, 0, node);
                  return current;
                }
              }
            }
          }

          found.auProjectionChildren.push(node);
          return found;
        }
      }

      return this.anchor;
    };

    ShadowSlot.prototype.projectTo = function projectTo(slots) {
      this.destinationSlots = slots;
    };

    ShadowSlot.prototype.projectFrom = function projectFrom(view, projectionSource) {
      var anchor = _aureliaPal.DOM.createComment('anchor');
      var parent = this.anchor.parentNode;
      anchor.auSlotProjectFrom = projectionSource;
      anchor.auOwnerView = view;
      anchor.auProjectionChildren = [];
      parent.insertBefore(anchor, this.anchor);
      this.children.push(anchor);

      if (this.projectFromAnchors === null) {
        this.projectFromAnchors = [];
      }

      this.projectFromAnchors.push(anchor);
    };

    ShadowSlot.prototype.renderFallbackContent = function renderFallbackContent(view, nodes, projectionSource, index) {
      if (this.contentView === null) {
        this.contentView = this.fallbackFactory.create(this.ownerView.container);
        this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
        this.contentView.insertNodesBefore(this.anchor);
      }

      if (this.contentView.hasSlots) {
        var slots = this.contentView.slots;
        var projectFromAnchors = this.projectFromAnchors;

        if (projectFromAnchors !== null) {
          for (var slotName in slots) {
            var slot = slots[slotName];

            for (var i = 0, ii = projectFromAnchors.length; i < ii; ++i) {
              var anchor = projectFromAnchors[i];
              slot.projectFrom(anchor.auOwnerView, anchor.auSlotProjectFrom);
            }
          }
        }

        this.fallbackSlots = slots;
        ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index);
      }
    };

    ShadowSlot.prototype.created = function created(ownerView) {
      this.ownerView = ownerView;
    };

    ShadowSlot.prototype.bind = function bind(view) {
      if (this.contentView) {
        this.contentView.bind(view.bindingContext, view.overrideContext);
      }
    };

    ShadowSlot.prototype.attached = function attached() {
      if (this.contentView) {
        this.contentView.attached();
      }
    };

    ShadowSlot.prototype.detached = function detached() {
      if (this.contentView) {
        this.contentView.detached();
      }
    };

    ShadowSlot.prototype.unbind = function unbind() {
      if (this.contentView) {
        this.contentView.unbind();
      }
    };

    _createClass(ShadowSlot, [{
      key: 'needsFallbackRendering',
      get: function get() {
        return this.fallbackFactory && this.projections === 0;
      }
    }]);

    return ShadowSlot;
  }();

  var ShadowDOM = exports.ShadowDOM = (_temp4 = _class10 = function () {
    function ShadowDOM() {

    }

    ShadowDOM.getSlotName = function getSlotName(node) {
      if (node.auSlotAttribute === undefined) {
        return ShadowDOM.defaultSlotKey;
      }

      return node.auSlotAttribute.value;
    };

    ShadowDOM.distributeView = function distributeView(view, slots, projectionSource, index, destinationOverride) {
      var nodes = void 0;

      if (view === null) {
        nodes = noNodes;
      } else {
        var childNodes = view.fragment.childNodes;
        var ii = childNodes.length;
        nodes = new Array(ii);

        for (var i = 0; i < ii; ++i) {
          nodes[i] = childNodes[i];
        }
      }

      ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index, destinationOverride);
    };

    ShadowDOM.undistributeView = function undistributeView(view, slots, projectionSource) {
      for (var slotName in slots) {
        slots[slotName].removeView(view, projectionSource);
      }
    };

    ShadowDOM.undistributeAll = function undistributeAll(slots, projectionSource) {
      for (var slotName in slots) {
        slots[slotName].removeAll(projectionSource);
      }
    };

    ShadowDOM.distributeNodes = function distributeNodes(view, nodes, slots, projectionSource, index, destinationOverride) {
      for (var i = 0, ii = nodes.length; i < ii; ++i) {
        var currentNode = nodes[i];
        var nodeType = currentNode.nodeType;

        if (currentNode.isContentProjectionSource) {
          currentNode.viewSlot.projectTo(slots);

          for (var slotName in slots) {
            slots[slotName].projectFrom(view, currentNode.viewSlot);
          }

          nodes.splice(i, 1);
          ii--;i--;
        } else if (nodeType === 1 || nodeType === 3 || currentNode.viewSlot instanceof PassThroughSlot) {
          if (nodeType === 3 && _isAllWhitespace(currentNode)) {
            nodes.splice(i, 1);
            ii--;i--;
          } else {
            var found = slots[destinationOverride || ShadowDOM.getSlotName(currentNode)];

            if (found) {
              found.addNode(view, currentNode, projectionSource, index);
              nodes.splice(i, 1);
              ii--;i--;
            }
          }
        } else {
          nodes.splice(i, 1);
          ii--;i--;
        }
      }

      for (var _slotName in slots) {
        var slot = slots[_slotName];

        if (slot.needsFallbackRendering) {
          slot.renderFallbackContent(view, nodes, projectionSource, index);
        }
      }
    };

    return ShadowDOM;
  }(), _class10.defaultSlotKey = '__au-default-slot-key__', _temp4);


  function register(lookup, name, resource, type) {
    if (!name) {
      return;
    }

    var existing = lookup[name];
    if (existing) {
      if (existing !== resource) {
        throw new Error('Attempted to register ' + type + ' when one with the same name already exists. Name: ' + name + '.');
      }

      return;
    }

    lookup[name] = resource;
  }

  function validateBehaviorName(name, type) {
    if (/[A-Z]/.test(name)) {
      var newName = _hyphenate(name);
      LogManager.getLogger('templating').warn('\'' + name + '\' is not a valid ' + type + ' name and has been converted to \'' + newName + '\'. Upper-case letters are not allowed because the DOM is not case-sensitive.');
      return newName;
    }
    return name;
  }

  var conventionMark = '__au_resource__';

  var ViewResources = exports.ViewResources = function () {
    ViewResources.convention = function convention(target, existing) {
      var resource = void 0;

      if (existing && conventionMark in existing) {
        return existing;
      }
      if ('$resource' in target) {
        var config = target.$resource;

        if (typeof config === 'string') {
          resource = existing || new HtmlBehaviorResource();
          resource[conventionMark] = true;
          if (!resource.elementName) {
            resource.elementName = validateBehaviorName(config, 'custom element');
          }
        } else {
          if (typeof config === 'function') {
            config = config.call(target);
          }
          if (typeof config === 'string') {
            config = { name: config };
          }

          config = Object.assign({}, config);

          var resourceType = config.type || 'element';

          var _name = config.name;
          switch (resourceType) {
            case 'element':case 'attribute':
              resource = existing || new HtmlBehaviorResource();
              resource[conventionMark] = true;
              if (resourceType === 'element') {
                if (!resource.elementName) {
                  resource.elementName = _name ? validateBehaviorName(_name, 'custom element') : _hyphenate(target.name);
                }
              } else {
                if (!resource.attributeName) {
                  resource.attributeName = _name ? validateBehaviorName(_name, 'custom attribute') : _hyphenate(target.name);
                }
              }
              if ('templateController' in config) {
                config.liftsContent = config.templateController;
                delete config.templateController;
              }
              if ('defaultBindingMode' in config && resource.attributeDefaultBindingMode !== undefined) {
                config.attributeDefaultBindingMode = config.defaultBindingMode;
                delete config.defaultBindingMode;
              }

              delete config.name;

              Object.assign(resource, config);
              break;
            case 'valueConverter':
              resource = new _aureliaBinding.ValueConverterResource((0, _aureliaBinding.camelCase)(_name || target.name));
              break;
            case 'bindingBehavior':
              resource = new _aureliaBinding.BindingBehaviorResource((0, _aureliaBinding.camelCase)(_name || target.name));
              break;
            case 'viewEngineHooks':
              resource = new ViewEngineHooksResource();
              break;
          }
        }

        if (resource instanceof HtmlBehaviorResource) {
          var _bindables = typeof config === 'string' ? undefined : config.bindables;
          var currentProps = resource.properties;
          if (Array.isArray(_bindables)) {
            for (var i = 0, ii = _bindables.length; ii > i; ++i) {
              var prop = _bindables[i];
              if (!prop || typeof prop !== 'string' && !prop.name) {
                throw new Error('Invalid bindable property at "' + i + '" for class "' + target.name + '". Expected either a string or an object with "name" property.');
              }
              var newProp = new BindableProperty(prop);

              var existed = false;
              for (var j = 0, jj = currentProps.length; jj > j; ++j) {
                if (currentProps[j].name === newProp.name) {
                  existed = true;
                  break;
                }
              }
              if (existed) {
                continue;
              }
              newProp.registerWith(target, resource);
            }
          }
        }
      }
      return resource;
    };

    function ViewResources(parent, viewUrl) {


      this.bindingLanguage = null;

      this.parent = parent || null;
      this.hasParent = this.parent !== null;
      this.viewUrl = viewUrl || '';
      this.lookupFunctions = {
        valueConverters: this.getValueConverter.bind(this),
        bindingBehaviors: this.getBindingBehavior.bind(this)
      };
      this.attributes = Object.create(null);
      this.elements = Object.create(null);
      this.valueConverters = Object.create(null);
      this.bindingBehaviors = Object.create(null);
      this.attributeMap = Object.create(null);
      this.values = Object.create(null);
      this.beforeCompile = this.afterCompile = this.beforeCreate = this.afterCreate = this.beforeBind = this.beforeUnbind = false;
    }

    ViewResources.prototype._tryAddHook = function _tryAddHook(obj, name) {
      if (typeof obj[name] === 'function') {
        var func = obj[name].bind(obj);
        var counter = 1;
        var callbackName = void 0;

        while (this[callbackName = name + counter.toString()] !== undefined) {
          counter++;
        }

        this[name] = true;
        this[callbackName] = func;
      }
    };

    ViewResources.prototype._invokeHook = function _invokeHook(name, one, two, three, four) {
      if (this.hasParent) {
        this.parent._invokeHook(name, one, two, three, four);
      }

      if (this[name]) {
        this[name + '1'](one, two, three, four);

        var callbackName = name + '2';
        if (this[callbackName]) {
          this[callbackName](one, two, three, four);

          callbackName = name + '3';
          if (this[callbackName]) {
            this[callbackName](one, two, three, four);

            var counter = 4;

            while (this[callbackName = name + counter.toString()] !== undefined) {
              this[callbackName](one, two, three, four);
              counter++;
            }
          }
        }
      }
    };

    ViewResources.prototype.registerViewEngineHooks = function registerViewEngineHooks(hooks) {
      this._tryAddHook(hooks, 'beforeCompile');
      this._tryAddHook(hooks, 'afterCompile');
      this._tryAddHook(hooks, 'beforeCreate');
      this._tryAddHook(hooks, 'afterCreate');
      this._tryAddHook(hooks, 'beforeBind');
      this._tryAddHook(hooks, 'beforeUnbind');
    };

    ViewResources.prototype.getBindingLanguage = function getBindingLanguage(bindingLanguageFallback) {
      return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
    };

    ViewResources.prototype.patchInParent = function patchInParent(newParent) {
      var originalParent = this.parent;

      this.parent = newParent || null;
      this.hasParent = this.parent !== null;

      if (newParent.parent === null) {
        newParent.parent = originalParent;
        newParent.hasParent = originalParent !== null;
      }
    };

    ViewResources.prototype.relativeToView = function relativeToView(path) {
      return (0, _aureliaPath.relativeToFile)(path, this.viewUrl);
    };

    ViewResources.prototype.registerElement = function registerElement(tagName, behavior) {
      register(this.elements, tagName, behavior, 'an Element');
    };

    ViewResources.prototype.getElement = function getElement(tagName) {
      return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
    };

    ViewResources.prototype.mapAttribute = function mapAttribute(attribute) {
      return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
    };

    ViewResources.prototype.registerAttribute = function registerAttribute(attribute, behavior, knownAttribute) {
      this.attributeMap[attribute] = knownAttribute;
      register(this.attributes, attribute, behavior, 'an Attribute');
    };

    ViewResources.prototype.getAttribute = function getAttribute(attribute) {
      return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
    };

    ViewResources.prototype.registerValueConverter = function registerValueConverter(name, valueConverter) {
      register(this.valueConverters, name, valueConverter, 'a ValueConverter');
    };

    ViewResources.prototype.getValueConverter = function getValueConverter(name) {
      return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
    };

    ViewResources.prototype.registerBindingBehavior = function registerBindingBehavior(name, bindingBehavior) {
      register(this.bindingBehaviors, name, bindingBehavior, 'a BindingBehavior');
    };

    ViewResources.prototype.getBindingBehavior = function getBindingBehavior(name) {
      return this.bindingBehaviors[name] || (this.hasParent ? this.parent.getBindingBehavior(name) : null);
    };

    ViewResources.prototype.registerValue = function registerValue(name, value) {
      register(this.values, name, value, 'a value');
    };

    ViewResources.prototype.getValue = function getValue(name) {
      return this.values[name] || (this.hasParent ? this.parent.getValue(name) : null);
    };

    ViewResources.prototype.autoRegister = function autoRegister(container, impl) {
      var resourceTypeMeta = _aureliaMetadata.metadata.getOwn(_aureliaMetadata.metadata.resource, impl);
      if (resourceTypeMeta) {
        if (resourceTypeMeta instanceof HtmlBehaviorResource) {
          ViewResources.convention(impl, resourceTypeMeta);

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            HtmlBehaviorResource.convention(impl.name, resourceTypeMeta);
          }
          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            resourceTypeMeta.elementName = _hyphenate(impl.name);
          }
        }
      } else {
        resourceTypeMeta = ViewResources.convention(impl) || HtmlBehaviorResource.convention(impl.name) || _aureliaBinding.ValueConverterResource.convention(impl.name) || _aureliaBinding.BindingBehaviorResource.convention(impl.name) || ViewEngineHooksResource.convention(impl.name);
        if (!resourceTypeMeta) {
          resourceTypeMeta = new HtmlBehaviorResource();
          resourceTypeMeta.elementName = _hyphenate(impl.name);
        }
        _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, resourceTypeMeta, impl);
      }
      resourceTypeMeta.initialize(container, impl);
      resourceTypeMeta.register(this);
      return resourceTypeMeta;
    };

    return ViewResources;
  }();

  var View = exports.View = function () {
    function View(container, viewFactory, fragment, controllers, bindings, children, slots) {


      this.container = container;
      this.viewFactory = viewFactory;
      this.resources = viewFactory.resources;
      this.fragment = fragment;
      this.firstChild = fragment.firstChild;
      this.lastChild = fragment.lastChild;
      this.controllers = controllers;
      this.bindings = bindings;
      this.children = children;
      this.slots = slots;
      this.hasSlots = false;
      this.fromCache = false;
      this.isBound = false;
      this.isAttached = false;
      this.bindingContext = null;
      this.overrideContext = null;
      this.controller = null;
      this.viewModelScope = null;
      this.animatableElement = undefined;
      this._isUserControlled = false;
      this.contentView = null;

      for (var _key3 in slots) {
        this.hasSlots = true;
        break;
      }
    }

    View.prototype.returnToCache = function returnToCache() {
      this.viewFactory.returnViewToCache(this);
    };

    View.prototype.created = function created() {
      var i = void 0;
      var ii = void 0;
      var controllers = this.controllers;

      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].created(this);
      }
    };

    View.prototype.bind = function bind(bindingContext, overrideContext, _systemUpdate) {
      var controllers = void 0;
      var bindings = void 0;
      var children = void 0;
      var i = void 0;
      var ii = void 0;

      if (_systemUpdate && this._isUserControlled) {
        return;
      }

      if (this.isBound) {
        if (this.bindingContext === bindingContext) {
          return;
        }

        this.unbind();
      }

      this.isBound = true;
      this.bindingContext = bindingContext;
      this.overrideContext = overrideContext || (0, _aureliaBinding.createOverrideContext)(bindingContext);

      this.resources._invokeHook('beforeBind', this);

      bindings = this.bindings;
      for (i = 0, ii = bindings.length; i < ii; ++i) {
        bindings[i].bind(this);
      }

      if (this.viewModelScope !== null) {
        bindingContext.bind(this.viewModelScope.bindingContext, this.viewModelScope.overrideContext);
        this.viewModelScope = null;
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].bind(this);
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].bind(bindingContext, overrideContext, true);
      }

      if (this.hasSlots) {
        ShadowDOM.distributeView(this.contentView, this.slots);
      }
    };

    View.prototype.addBinding = function addBinding(binding) {
      this.bindings.push(binding);

      if (this.isBound) {
        binding.bind(this);
      }
    };

    View.prototype.unbind = function unbind() {
      var controllers = void 0;
      var bindings = void 0;
      var children = void 0;
      var i = void 0;
      var ii = void 0;

      if (this.isBound) {
        this.isBound = false;
        this.resources._invokeHook('beforeUnbind', this);

        if (this.controller !== null) {
          this.controller.unbind();
        }

        bindings = this.bindings;
        for (i = 0, ii = bindings.length; i < ii; ++i) {
          bindings[i].unbind();
        }

        controllers = this.controllers;
        for (i = 0, ii = controllers.length; i < ii; ++i) {
          controllers[i].unbind();
        }

        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].unbind();
        }

        this.bindingContext = null;
        this.overrideContext = null;
      }
    };

    View.prototype.insertNodesBefore = function insertNodesBefore(refNode) {
      refNode.parentNode.insertBefore(this.fragment, refNode);
    };

    View.prototype.appendNodesTo = function appendNodesTo(parent) {
      parent.appendChild(this.fragment);
    };

    View.prototype.removeNodes = function removeNodes() {
      var fragment = this.fragment;
      var current = this.firstChild;
      var end = this.lastChild;
      var next = void 0;

      while (current) {
        next = current.nextSibling;
        fragment.appendChild(current);

        if (current === end) {
          break;
        }

        current = next;
      }
    };

    View.prototype.attached = function attached() {
      var controllers = void 0;
      var children = void 0;
      var i = void 0;
      var ii = void 0;

      if (this.isAttached) {
        return;
      }

      this.isAttached = true;

      if (this.controller !== null) {
        this.controller.attached();
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].attached();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].attached();
      }
    };

    View.prototype.detached = function detached() {
      var controllers = void 0;
      var children = void 0;
      var i = void 0;
      var ii = void 0;

      if (this.isAttached) {
        this.isAttached = false;

        if (this.controller !== null) {
          this.controller.detached();
        }

        controllers = this.controllers;
        for (i = 0, ii = controllers.length; i < ii; ++i) {
          controllers[i].detached();
        }

        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].detached();
        }
      }
    };

    return View;
  }();

  function getAnimatableElement(view) {
    if (view.animatableElement !== undefined) {
      return view.animatableElement;
    }

    var current = view.firstChild;

    while (current && current.nodeType !== 1) {
      current = current.nextSibling;
    }

    if (current && current.nodeType === 1) {
      return view.animatableElement = current.classList.contains('au-animate') ? current : null;
    }

    return view.animatableElement = null;
  }

  var ViewSlot = exports.ViewSlot = function () {
    function ViewSlot(anchor, anchorIsContainer) {
      var animator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Animator.instance;



      this.anchor = anchor;
      this.anchorIsContainer = anchorIsContainer;
      this.bindingContext = null;
      this.overrideContext = null;
      this.animator = animator;
      this.children = [];
      this.isBound = false;
      this.isAttached = false;
      this.contentSelectors = null;
      anchor.viewSlot = this;
      anchor.isContentProjectionSource = false;
    }

    ViewSlot.prototype.animateView = function animateView(view) {
      var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'enter';

      var animatableElement = getAnimatableElement(view);

      if (animatableElement !== null) {
        switch (direction) {
          case 'enter':
            return this.animator.enter(animatableElement);
          case 'leave':
            return this.animator.leave(animatableElement);
          default:
            throw new Error('Invalid animation direction: ' + direction);
        }
      }
    };

    ViewSlot.prototype.transformChildNodesIntoView = function transformChildNodesIntoView() {
      var parent = this.anchor;

      this.children.push({
        fragment: parent,
        firstChild: parent.firstChild,
        lastChild: parent.lastChild,
        returnToCache: function returnToCache() {},
        removeNodes: function removeNodes() {
          var last = void 0;

          while (last = parent.lastChild) {
            parent.removeChild(last);
          }
        },
        created: function created() {},
        bind: function bind() {},
        unbind: function unbind() {},
        attached: function attached() {},
        detached: function detached() {}
      });
    };

    ViewSlot.prototype.bind = function bind(bindingContext, overrideContext) {
      var i = void 0;
      var ii = void 0;
      var children = void 0;

      if (this.isBound) {
        if (this.bindingContext === bindingContext) {
          return;
        }

        this.unbind();
      }

      this.isBound = true;
      this.bindingContext = bindingContext = bindingContext || this.bindingContext;
      this.overrideContext = overrideContext = overrideContext || this.overrideContext;

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].bind(bindingContext, overrideContext, true);
      }
    };

    ViewSlot.prototype.unbind = function unbind() {
      if (this.isBound) {
        var i = void 0;
        var ii = void 0;
        var _children4 = this.children;

        this.isBound = false;
        this.bindingContext = null;
        this.overrideContext = null;

        for (i = 0, ii = _children4.length; i < ii; ++i) {
          _children4[i].unbind();
        }
      }
    };

    ViewSlot.prototype.add = function add(view) {
      if (this.anchorIsContainer) {
        view.appendNodesTo(this.anchor);
      } else {
        view.insertNodesBefore(this.anchor);
      }

      this.children.push(view);

      if (this.isAttached) {
        view.attached();
        return this.animateView(view, 'enter');
      }
    };

    ViewSlot.prototype.insert = function insert(index, view) {
      var children = this.children;
      var length = children.length;

      if (index === 0 && length === 0 || index >= length) {
        return this.add(view);
      }

      view.insertNodesBefore(children[index].firstChild);
      children.splice(index, 0, view);

      if (this.isAttached) {
        view.attached();
        return this.animateView(view, 'enter');
      }
    };

    ViewSlot.prototype.move = function move(sourceIndex, targetIndex) {
      if (sourceIndex === targetIndex) {
        return;
      }

      var children = this.children;
      var view = children[sourceIndex];

      view.removeNodes();
      view.insertNodesBefore(children[targetIndex].firstChild);
      children.splice(sourceIndex, 1);
      children.splice(targetIndex, 0, view);
    };

    ViewSlot.prototype.remove = function remove(view, returnToCache, skipAnimation) {
      return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
    };

    ViewSlot.prototype.removeMany = function removeMany(viewsToRemove, returnToCache, skipAnimation) {
      var _this3 = this;

      var children = this.children;
      var ii = viewsToRemove.length;
      var i = void 0;
      var rmPromises = [];

      viewsToRemove.forEach(function (child) {
        if (skipAnimation) {
          child.removeNodes();
          return;
        }

        var animation = _this3.animateView(child, 'leave');
        if (animation) {
          rmPromises.push(animation.then(function () {
            return child.removeNodes();
          }));
        } else {
          child.removeNodes();
        }
      });

      var removeAction = function removeAction() {
        if (_this3.isAttached) {
          for (i = 0; i < ii; ++i) {
            viewsToRemove[i].detached();
          }
        }

        if (returnToCache) {
          for (i = 0; i < ii; ++i) {
            viewsToRemove[i].returnToCache();
          }
        }

        for (i = 0; i < ii; ++i) {
          var index = children.indexOf(viewsToRemove[i]);
          if (index >= 0) {
            children.splice(index, 1);
          }
        }
      };

      if (rmPromises.length > 0) {
        return Promise.all(rmPromises).then(function () {
          return removeAction();
        });
      }

      return removeAction();
    };

    ViewSlot.prototype.removeAt = function removeAt(index, returnToCache, skipAnimation) {
      var _this4 = this;

      var view = this.children[index];

      var removeAction = function removeAction() {
        index = _this4.children.indexOf(view);
        view.removeNodes();
        _this4.children.splice(index, 1);

        if (_this4.isAttached) {
          view.detached();
        }

        if (returnToCache) {
          view.returnToCache();
        }

        return view;
      };

      if (!skipAnimation) {
        var animation = this.animateView(view, 'leave');
        if (animation) {
          return animation.then(function () {
            return removeAction();
          });
        }
      }

      return removeAction();
    };

    ViewSlot.prototype.removeAll = function removeAll(returnToCache, skipAnimation) {
      var _this5 = this;

      var children = this.children;
      var ii = children.length;
      var i = void 0;
      var rmPromises = [];

      children.forEach(function (child) {
        if (skipAnimation) {
          child.removeNodes();
          return;
        }

        var animation = _this5.animateView(child, 'leave');
        if (animation) {
          rmPromises.push(animation.then(function () {
            return child.removeNodes();
          }));
        } else {
          child.removeNodes();
        }
      });

      var removeAction = function removeAction() {
        if (_this5.isAttached) {
          for (i = 0; i < ii; ++i) {
            children[i].detached();
          }
        }

        if (returnToCache) {
          for (i = 0; i < ii; ++i) {
            var _child3 = children[i];

            if (_child3) {
              _child3.returnToCache();
            }
          }
        }

        _this5.children = [];
      };

      if (rmPromises.length > 0) {
        return Promise.all(rmPromises).then(function () {
          return removeAction();
        });
      }

      return removeAction();
    };

    ViewSlot.prototype.attached = function attached() {
      var i = void 0;
      var ii = void 0;
      var children = void 0;
      var child = void 0;

      if (this.isAttached) {
        return;
      }

      this.isAttached = true;

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        child = children[i];
        child.attached();
        this.animateView(child, 'enter');
      }
    };

    ViewSlot.prototype.detached = function detached() {
      var i = void 0;
      var ii = void 0;
      var children = void 0;

      if (this.isAttached) {
        this.isAttached = false;
        children = this.children;
        for (i = 0, ii = children.length; i < ii; ++i) {
          children[i].detached();
        }
      }
    };

    ViewSlot.prototype.projectTo = function projectTo(slots) {
      var _this6 = this;

      this.projectToSlots = slots;
      this.add = this._projectionAdd;
      this.insert = this._projectionInsert;
      this.move = this._projectionMove;
      this.remove = this._projectionRemove;
      this.removeAt = this._projectionRemoveAt;
      this.removeMany = this._projectionRemoveMany;
      this.removeAll = this._projectionRemoveAll;
      this.children.forEach(function (view) {
        return ShadowDOM.distributeView(view, slots, _this6);
      });
    };

    ViewSlot.prototype._projectionAdd = function _projectionAdd(view) {
      ShadowDOM.distributeView(view, this.projectToSlots, this);

      this.children.push(view);

      if (this.isAttached) {
        view.attached();
      }
    };

    ViewSlot.prototype._projectionInsert = function _projectionInsert(index, view) {
      if (index === 0 && !this.children.length || index >= this.children.length) {
        this.add(view);
      } else {
        ShadowDOM.distributeView(view, this.projectToSlots, this, index);

        this.children.splice(index, 0, view);

        if (this.isAttached) {
          view.attached();
        }
      }
    };

    ViewSlot.prototype._projectionMove = function _projectionMove(sourceIndex, targetIndex) {
      if (sourceIndex === targetIndex) {
        return;
      }

      var children = this.children;
      var view = children[sourceIndex];

      ShadowDOM.undistributeView(view, this.projectToSlots, this);
      ShadowDOM.distributeView(view, this.projectToSlots, this, targetIndex);

      children.splice(sourceIndex, 1);
      children.splice(targetIndex, 0, view);
    };

    ViewSlot.prototype._projectionRemove = function _projectionRemove(view, returnToCache) {
      ShadowDOM.undistributeView(view, this.projectToSlots, this);
      this.children.splice(this.children.indexOf(view), 1);

      if (this.isAttached) {
        view.detached();
      }
      if (returnToCache) {
        view.returnToCache();
      }
    };

    ViewSlot.prototype._projectionRemoveAt = function _projectionRemoveAt(index, returnToCache) {
      var view = this.children[index];

      ShadowDOM.undistributeView(view, this.projectToSlots, this);
      this.children.splice(index, 1);

      if (this.isAttached) {
        view.detached();
      }
      if (returnToCache) {
        view.returnToCache();
      }
    };

    ViewSlot.prototype._projectionRemoveMany = function _projectionRemoveMany(viewsToRemove, returnToCache) {
      var _this7 = this;

      viewsToRemove.forEach(function (view) {
        return _this7.remove(view, returnToCache);
      });
    };

    ViewSlot.prototype._projectionRemoveAll = function _projectionRemoveAll(returnToCache) {
      ShadowDOM.undistributeAll(this.projectToSlots, this);

      var children = this.children;
      var ii = children.length;

      for (var i = 0; i < ii; ++i) {
        if (returnToCache) {
          children[i].returnToCache();
        } else if (this.isAttached) {
          children[i].detached();
        }
      }

      this.children = [];
    };

    return ViewSlot;
  }();

  var ProviderResolver = (0, _aureliaDependencyInjection.resolver)(_class12 = function () {
    function ProviderResolver() {

    }

    ProviderResolver.prototype.get = function get(container, key) {
      var id = key.__providerId__;
      return id in container ? container[id] : container[id] = container.invoke(key);
    };

    return ProviderResolver;
  }()) || _class12;

  var providerResolverInstance = new ProviderResolver();

  function elementContainerGet(key) {
    if (key === _aureliaPal.DOM.Element) {
      return this.element;
    }

    if (key === BoundViewFactory) {
      if (this.boundViewFactory) {
        return this.boundViewFactory;
      }

      var factory = this.instruction.viewFactory;
      var _partReplacements = this.partReplacements;

      if (_partReplacements) {
        factory = _partReplacements[factory.part] || factory;
      }

      this.boundViewFactory = new BoundViewFactory(this, factory, _partReplacements);
      return this.boundViewFactory;
    }

    if (key === ViewSlot) {
      if (this.viewSlot === undefined) {
        this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer);
        this.element.isContentProjectionSource = this.instruction.lifting;
        this.children.push(this.viewSlot);
      }

      return this.viewSlot;
    }

    if (key === ElementEvents) {
      return this.elementEvents || (this.elementEvents = new ElementEvents(this.element));
    }

    if (key === CompositionTransaction) {
      return this.compositionTransaction || (this.compositionTransaction = this.parent.get(key));
    }

    if (key === ViewResources) {
      return this.viewResources;
    }

    if (key === TargetInstruction) {
      return this.instruction;
    }

    return this.superGet(key);
  }

  function createElementContainer(parent, element, instruction, children, partReplacements, resources) {
    var container = parent.createChild();
    var providers = void 0;
    var i = void 0;

    container.element = element;
    container.instruction = instruction;
    container.children = children;
    container.viewResources = resources;
    container.partReplacements = partReplacements;

    providers = instruction.providers;
    i = providers.length;

    while (i--) {
      container._resolvers.set(providers[i], providerResolverInstance);
    }

    container.superGet = container.get;
    container.get = elementContainerGet;

    return container;
  }

  function hasAttribute(name) {
    return this._element.hasAttribute(name);
  }

  function getAttribute(name) {
    return this._element.getAttribute(name);
  }

  function setAttribute(name, value) {
    this._element.setAttribute(name, value);
  }

  function makeElementIntoAnchor(element, elementInstruction) {
    var anchor = _aureliaPal.DOM.createComment('anchor');

    if (elementInstruction) {
      var firstChild = element.firstChild;

      if (firstChild && firstChild.tagName === 'AU-CONTENT') {
        anchor.contentElement = firstChild;
      }

      anchor._element = element;

      anchor.hasAttribute = hasAttribute;
      anchor.getAttribute = getAttribute;
      anchor.setAttribute = setAttribute;
    }

    _aureliaPal.DOM.replaceNode(anchor, element);

    return anchor;
  }

  function applyInstructions(containers, element, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources) {
    var behaviorInstructions = instruction.behaviorInstructions;
    var expressions = instruction.expressions;
    var elementContainer = void 0;
    var i = void 0;
    var ii = void 0;
    var current = void 0;
    var instance = void 0;

    if (instruction.contentExpression) {
      bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
      element.nextSibling.auInterpolationTarget = true;
      element.parentNode.removeChild(element);
      return;
    }

    if (instruction.shadowSlot) {
      var commentAnchor = _aureliaPal.DOM.createComment('slot');
      var slot = void 0;

      if (instruction.slotDestination) {
        slot = new PassThroughSlot(commentAnchor, instruction.slotName, instruction.slotDestination, instruction.slotFallbackFactory);
      } else {
        slot = new ShadowSlot(commentAnchor, instruction.slotName, instruction.slotFallbackFactory);
      }

      _aureliaPal.DOM.replaceNode(commentAnchor, element);
      shadowSlots[instruction.slotName] = slot;
      controllers.push(slot);
      return;
    }

    if (instruction.letElement) {
      for (i = 0, ii = expressions.length; i < ii; ++i) {
        bindings.push(expressions[i].createBinding());
      }
      element.parentNode.removeChild(element);
      return;
    }

    if (behaviorInstructions.length) {
      if (!instruction.anchorIsContainer) {
        element = makeElementIntoAnchor(element, instruction.elementInstruction);
      }

      containers[instruction.injectorId] = elementContainer = createElementContainer(containers[instruction.parentInjectorId], element, instruction, children, partReplacements, resources);

      for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
        current = behaviorInstructions[i];
        instance = current.type.create(elementContainer, current, element, bindings);
        controllers.push(instance);
      }
    }

    for (i = 0, ii = expressions.length; i < ii; ++i) {
      bindings.push(expressions[i].createBinding(element));
    }
  }

  function styleStringToObject(style, target) {
    var attributes = style.split(';');
    var firstIndexOfColon = void 0;
    var i = void 0;
    var current = void 0;
    var key = void 0;
    var value = void 0;

    target = target || {};

    for (i = 0; i < attributes.length; i++) {
      current = attributes[i];
      firstIndexOfColon = current.indexOf(':');
      key = current.substring(0, firstIndexOfColon).trim();
      value = current.substring(firstIndexOfColon + 1).trim();
      target[key] = value;
    }

    return target;
  }

  function styleObjectToString(obj) {
    var result = '';

    for (var _key4 in obj) {
      result += _key4 + ':' + obj[_key4] + ';';
    }

    return result;
  }

  function applySurrogateInstruction(container, element, instruction, controllers, bindings, children) {
    var behaviorInstructions = instruction.behaviorInstructions;
    var expressions = instruction.expressions;
    var providers = instruction.providers;
    var values = instruction.values;
    var i = void 0;
    var ii = void 0;
    var current = void 0;
    var instance = void 0;
    var currentAttributeValue = void 0;

    i = providers.length;
    while (i--) {
      container._resolvers.set(providers[i], providerResolverInstance);
    }

    for (var _key5 in values) {
      currentAttributeValue = element.getAttribute(_key5);

      if (currentAttributeValue) {
        if (_key5 === 'class') {
          element.setAttribute('class', currentAttributeValue + ' ' + values[_key5]);
        } else if (_key5 === 'style') {
          var styleObject = styleStringToObject(values[_key5]);
          styleStringToObject(currentAttributeValue, styleObject);
          element.setAttribute('style', styleObjectToString(styleObject));
        }
      } else {
        element.setAttribute(_key5, values[_key5]);
      }
    }

    if (behaviorInstructions.length) {
      for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
        current = behaviorInstructions[i];
        instance = current.type.create(container, current, element, bindings);

        if (instance.contentView) {
          children.push(instance.contentView);
        }

        controllers.push(instance);
      }
    }

    for (i = 0, ii = expressions.length; i < ii; ++i) {
      bindings.push(expressions[i].createBinding(element));
    }
  }

  var BoundViewFactory = exports.BoundViewFactory = function () {
    function BoundViewFactory(parentContainer, viewFactory, partReplacements) {


      this.parentContainer = parentContainer;
      this.viewFactory = viewFactory;
      this.factoryCreateInstruction = { partReplacements: partReplacements };
    }

    BoundViewFactory.prototype.create = function create() {
      var view = this.viewFactory.create(this.parentContainer.createChild(), this.factoryCreateInstruction);
      view._isUserControlled = true;
      return view;
    };

    BoundViewFactory.prototype.setCacheSize = function setCacheSize(size, doNotOverrideIfAlreadySet) {
      this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
    };

    BoundViewFactory.prototype.getCachedView = function getCachedView() {
      return this.viewFactory.getCachedView();
    };

    BoundViewFactory.prototype.returnViewToCache = function returnViewToCache(view) {
      this.viewFactory.returnViewToCache(view);
    };

    _createClass(BoundViewFactory, [{
      key: 'isCaching',
      get: function get() {
        return this.viewFactory.isCaching;
      }
    }]);

    return BoundViewFactory;
  }();

  var ViewFactory = exports.ViewFactory = function () {
    function ViewFactory(template, instructions, resources) {


      this.isCaching = false;

      this.template = template;
      this.instructions = instructions;
      this.resources = resources;
      this.cacheSize = -1;
      this.cache = null;
    }

    ViewFactory.prototype.setCacheSize = function setCacheSize(size, doNotOverrideIfAlreadySet) {
      if (size) {
        if (size === '*') {
          size = Number.MAX_VALUE;
        } else if (typeof size === 'string') {
          size = parseInt(size, 10);
        }
      }

      if (this.cacheSize === -1 || !doNotOverrideIfAlreadySet) {
        this.cacheSize = size;
      }

      if (this.cacheSize > 0) {
        this.cache = [];
      } else {
        this.cache = null;
      }

      this.isCaching = this.cacheSize > 0;
    };

    ViewFactory.prototype.getCachedView = function getCachedView() {
      return this.cache !== null ? this.cache.pop() || null : null;
    };

    ViewFactory.prototype.returnViewToCache = function returnViewToCache(view) {
      if (view.isAttached) {
        view.detached();
      }

      if (view.isBound) {
        view.unbind();
      }

      if (this.cache !== null && this.cache.length < this.cacheSize) {
        view.fromCache = true;
        this.cache.push(view);
      }
    };

    ViewFactory.prototype.create = function create(container, createInstruction, element) {
      createInstruction = createInstruction || BehaviorInstruction.normal;

      var cachedView = this.getCachedView();
      if (cachedView !== null) {
        return cachedView;
      }

      var fragment = createInstruction.enhance ? this.template : this.template.cloneNode(true);
      var instructables = fragment.querySelectorAll('.au-target');
      var instructions = this.instructions;
      var resources = this.resources;
      var controllers = [];
      var bindings = [];
      var children = [];
      var shadowSlots = Object.create(null);
      var containers = { root: container };
      var partReplacements = createInstruction.partReplacements;
      var i = void 0;
      var ii = void 0;
      var view = void 0;
      var instructable = void 0;
      var instruction = void 0;

      this.resources._invokeHook('beforeCreate', this, container, fragment, createInstruction);

      if (element && this.surrogateInstruction !== null) {
        applySurrogateInstruction(container, element, this.surrogateInstruction, controllers, bindings, children);
      }

      if (createInstruction.enhance && fragment.hasAttribute('au-target-id')) {
        instructable = fragment;
        instruction = instructions[instructable.getAttribute('au-target-id')];
        applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
      }

      for (i = 0, ii = instructables.length; i < ii; ++i) {
        instructable = instructables[i];
        instruction = instructions[instructable.getAttribute('au-target-id')];
        applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
      }

      view = new View(container, this, fragment, controllers, bindings, children, shadowSlots);

      if (!createInstruction.initiatedByBehavior) {
        view.created();
      }

      this.resources._invokeHook('afterCreate', view);

      return view;
    };

    return ViewFactory;
  }();

  var nextInjectorId = 0;
  function getNextInjectorId() {
    return ++nextInjectorId;
  }

  var lastAUTargetID = 0;
  function getNextAUTargetID() {
    return (++lastAUTargetID).toString();
  }

  function makeIntoInstructionTarget(element) {
    var value = element.getAttribute('class');
    var auTargetID = getNextAUTargetID();

    element.setAttribute('class', value ? value + ' au-target' : 'au-target');
    element.setAttribute('au-target-id', auTargetID);

    return auTargetID;
  }

  function makeShadowSlot(compiler, resources, node, instructions, parentInjectorId) {
    var auShadowSlot = _aureliaPal.DOM.createElement('au-shadow-slot');
    _aureliaPal.DOM.replaceNode(auShadowSlot, node);

    var auTargetID = makeIntoInstructionTarget(auShadowSlot);
    var instruction = TargetInstruction.shadowSlot(parentInjectorId);

    instruction.slotName = node.getAttribute('name') || ShadowDOM.defaultSlotKey;
    instruction.slotDestination = node.getAttribute('slot');

    if (node.innerHTML.trim()) {
      var fragment = _aureliaPal.DOM.createDocumentFragment();
      var _child4 = void 0;

      while (_child4 = node.firstChild) {
        fragment.appendChild(_child4);
      }

      instruction.slotFallbackFactory = compiler.compile(fragment, resources);
    }

    instructions[auTargetID] = instruction;

    return auShadowSlot;
  }

  var defaultLetHandler = BindingLanguage.prototype.createLetExpressions;

  var ViewCompiler = exports.ViewCompiler = (_dec7 = (0, _aureliaDependencyInjection.inject)(BindingLanguage, ViewResources), _dec7(_class14 = function () {
    function ViewCompiler(bindingLanguage, resources) {


      this.bindingLanguage = bindingLanguage;
      this.resources = resources;
    }

    ViewCompiler.prototype.compile = function compile(source, resources, compileInstruction) {
      resources = resources || this.resources;
      compileInstruction = compileInstruction || ViewCompileInstruction.normal;
      source = typeof source === 'string' ? _aureliaPal.DOM.createTemplateFromMarkup(source) : source;

      var content = void 0;
      var part = void 0;
      var cacheSize = void 0;

      if (source.content) {
        part = source.getAttribute('part');
        cacheSize = source.getAttribute('view-cache');
        content = _aureliaPal.DOM.adoptNode(source.content);
      } else {
        content = source;
      }

      compileInstruction.targetShadowDOM = compileInstruction.targetShadowDOM && _aureliaPal.FEATURE.shadowDOM;
      resources._invokeHook('beforeCompile', content, resources, compileInstruction);

      var instructions = {};
      this._compileNode(content, resources, instructions, source, 'root', !compileInstruction.targetShadowDOM);

      var firstChild = content.firstChild;
      if (firstChild && firstChild.nodeType === 1) {
        var targetId = firstChild.getAttribute('au-target-id');
        if (targetId) {
          var ins = instructions[targetId];

          if (ins.shadowSlot || ins.lifting || ins.elementInstruction && !ins.elementInstruction.anchorIsContainer) {
            content.insertBefore(_aureliaPal.DOM.createComment('view'), firstChild);
          }
        }
      }

      var factory = new ViewFactory(content, instructions, resources);

      factory.surrogateInstruction = compileInstruction.compileSurrogate ? this._compileSurrogate(source, resources) : null;
      factory.part = part;

      if (cacheSize) {
        factory.setCacheSize(cacheSize);
      }

      resources._invokeHook('afterCompile', factory);

      return factory;
    };

    ViewCompiler.prototype._compileNode = function _compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      switch (node.nodeType) {
        case 1:
          return this._compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
        case 3:
          var expression = resources.getBindingLanguage(this.bindingLanguage).inspectTextContent(resources, node.wholeText);
          if (expression) {
            var marker = _aureliaPal.DOM.createElement('au-marker');
            var auTargetID = makeIntoInstructionTarget(marker);
            (node.parentNode || parentNode).insertBefore(marker, node);
            node.textContent = ' ';
            instructions[auTargetID] = TargetInstruction.contentExpression(expression);

            while (node.nextSibling && node.nextSibling.nodeType === 3) {
              (node.parentNode || parentNode).removeChild(node.nextSibling);
            }
          } else {
            while (node.nextSibling && node.nextSibling.nodeType === 3) {
              node = node.nextSibling;
            }
          }
          return node.nextSibling;
        case 11:
          var currentChild = node.firstChild;
          while (currentChild) {
            currentChild = this._compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
          }
          break;
        default:
          break;
      }

      return node.nextSibling;
    };

    ViewCompiler.prototype._compileSurrogate = function _compileSurrogate(node, resources) {
      var tagName = node.tagName.toLowerCase();
      var attributes = node.attributes;
      var bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
      var knownAttribute = void 0;
      var property = void 0;
      var instruction = void 0;
      var i = void 0;
      var ii = void 0;
      var attr = void 0;
      var attrName = void 0;
      var attrValue = void 0;
      var info = void 0;
      var type = void 0;
      var expressions = [];
      var expression = void 0;
      var behaviorInstructions = [];
      var values = {};
      var hasValues = false;
      var providers = [];

      for (i = 0, ii = attributes.length; i < ii; ++i) {
        attr = attributes[i];
        attrName = attr.name;
        attrValue = attr.value;

        info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);
        type = resources.getAttribute(info.attrName);

        if (type) {
          knownAttribute = resources.mapAttribute(info.attrName);
          if (knownAttribute) {
            property = type.attributes[knownAttribute];

            if (property) {
              info.defaultBindingMode = property.defaultBindingMode;

              if (!info.command && !info.expression) {
                info.command = property.hasOptions ? 'options' : null;
              }

              if (info.command && info.command !== 'options' && type.primaryProperty) {
                var _primaryProperty = type.primaryProperty;
                attrName = info.attrName = _primaryProperty.attribute;

                info.defaultBindingMode = _primaryProperty.defaultBindingMode;
              }
            }
          }
        }

        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);

        if (instruction) {
          if (instruction.alteredAttr) {
            type = resources.getAttribute(instruction.attrName);
          }

          if (instruction.discrete) {
            expressions.push(instruction);
          } else {
            if (type) {
              instruction.type = type;
              this._configureProperties(instruction, resources);

              if (type.liftsContent) {
                throw new Error('You cannot place a template controller on a surrogate element.');
              } else {
                behaviorInstructions.push(instruction);
              }
            } else {
              expressions.push(instruction.attributes[instruction.attrName]);
            }
          }
        } else {
          if (type) {
            instruction = BehaviorInstruction.attribute(attrName, type);
            instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

            if (type.liftsContent) {
              throw new Error('You cannot place a template controller on a surrogate element.');
            } else {
              behaviorInstructions.push(instruction);
            }
          } else if (attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part') {
            hasValues = true;
            values[attrName] = attrValue;
          }
        }
      }

      if (expressions.length || behaviorInstructions.length || hasValues) {
        for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction);
          providers.push(instruction.type.target);
        }

        for (i = 0, ii = expressions.length; i < ii; ++i) {
          expression = expressions[i];
          if (expression.attrToRemove !== undefined) {
            node.removeAttribute(expression.attrToRemove);
          }
        }

        return TargetInstruction.surrogate(providers, behaviorInstructions, expressions, values);
      }

      return null;
    };

    ViewCompiler.prototype._compileElement = function _compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      var tagName = node.tagName.toLowerCase();
      var attributes = node.attributes;
      var expressions = [];
      var expression = void 0;
      var behaviorInstructions = [];
      var providers = [];
      var bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
      var liftingInstruction = void 0;
      var viewFactory = void 0;
      var type = void 0;
      var elementInstruction = void 0;
      var elementProperty = void 0;
      var i = void 0;
      var ii = void 0;
      var attr = void 0;
      var attrName = void 0;
      var attrValue = void 0;
      var originalAttrName = void 0;
      var instruction = void 0;
      var info = void 0;
      var property = void 0;
      var knownAttribute = void 0;
      var auTargetID = void 0;
      var injectorId = void 0;

      if (tagName === 'slot') {
        if (targetLightDOM) {
          node = makeShadowSlot(this, resources, node, instructions, parentInjectorId);
        }
        return node.nextSibling;
      } else if (tagName === 'template') {
        if (!('content' in node)) {
          throw new Error('You cannot place a template element within ' + node.namespaceURI + ' namespace');
        }
        viewFactory = this.compile(node, resources);
        viewFactory.part = node.getAttribute('part');
      } else {
        type = resources.getElement(node.getAttribute('as-element') || tagName);

        if (tagName === 'let' && !type && bindingLanguage.createLetExpressions !== defaultLetHandler) {
          expressions = bindingLanguage.createLetExpressions(resources, node);
          auTargetID = makeIntoInstructionTarget(node);
          instructions[auTargetID] = TargetInstruction.letElement(expressions);
          return node.nextSibling;
        }
        if (type) {
          elementInstruction = BehaviorInstruction.element(node, type);
          type.processAttributes(this, resources, node, attributes, elementInstruction);
          behaviorInstructions.push(elementInstruction);
        }
      }

      for (i = 0, ii = attributes.length; i < ii; ++i) {
        attr = attributes[i];
        originalAttrName = attrName = attr.name;
        attrValue = attr.value;
        info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);

        if (targetLightDOM && info.attrName === 'slot') {
          info.attrName = attrName = 'au-slot';
        }

        type = resources.getAttribute(info.attrName);
        elementProperty = null;

        if (type) {
          knownAttribute = resources.mapAttribute(info.attrName);
          if (knownAttribute) {
            property = type.attributes[knownAttribute];

            if (property) {
              info.defaultBindingMode = property.defaultBindingMode;

              if (!info.command && !info.expression) {
                info.command = property.hasOptions ? 'options' : null;
              }

              if (info.command && info.command !== 'options' && type.primaryProperty) {
                var _primaryProperty2 = type.primaryProperty;
                attrName = info.attrName = _primaryProperty2.attribute;

                info.defaultBindingMode = _primaryProperty2.defaultBindingMode;
              }
            }
          }
        } else if (elementInstruction) {
          elementProperty = elementInstruction.type.attributes[info.attrName];
          if (elementProperty) {
            info.defaultBindingMode = elementProperty.defaultBindingMode;
          }
        }

        if (elementProperty) {
          instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
        } else {
          instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);
        }

        if (instruction) {
          if (instruction.alteredAttr) {
            type = resources.getAttribute(instruction.attrName);
          }

          if (instruction.discrete) {
            expressions.push(instruction);
          } else {
            if (type) {
              instruction.type = type;
              this._configureProperties(instruction, resources);

              if (type.liftsContent) {
                instruction.originalAttrName = originalAttrName;
                liftingInstruction = instruction;
                break;
              } else {
                behaviorInstructions.push(instruction);
              }
            } else if (elementProperty) {
              elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
            } else {
              expressions.push(instruction.attributes[instruction.attrName]);
            }
          }
        } else {
          if (type) {
            instruction = BehaviorInstruction.attribute(attrName, type);
            instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

            if (type.liftsContent) {
              instruction.originalAttrName = originalAttrName;
              liftingInstruction = instruction;
              break;
            } else {
              behaviorInstructions.push(instruction);
            }
          } else if (elementProperty) {
            elementInstruction.attributes[attrName] = attrValue;
          }
        }
      }

      if (liftingInstruction) {
        liftingInstruction.viewFactory = viewFactory;
        node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.lifting(parentInjectorId, liftingInstruction);
      } else {
        var skipContentProcessing = false;

        if (expressions.length || behaviorInstructions.length) {
          injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

          for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
            instruction = behaviorInstructions[i];
            instruction.type.compile(this, resources, node, instruction, parentNode);
            providers.push(instruction.type.target);
            skipContentProcessing = skipContentProcessing || instruction.skipContentProcessing;
          }

          for (i = 0, ii = expressions.length; i < ii; ++i) {
            expression = expressions[i];
            if (expression.attrToRemove !== undefined) {
              node.removeAttribute(expression.attrToRemove);
            }
          }

          auTargetID = makeIntoInstructionTarget(node);
          instructions[auTargetID] = TargetInstruction.normal(injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction);
        }

        if (skipContentProcessing) {
          return node.nextSibling;
        }

        var currentChild = node.firstChild;
        while (currentChild) {
          currentChild = this._compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
        }
      }

      return node.nextSibling;
    };

    ViewCompiler.prototype._configureProperties = function _configureProperties(instruction, resources) {
      var type = instruction.type;
      var attrName = instruction.attrName;
      var attributes = instruction.attributes;
      var property = void 0;
      var key = void 0;
      var value = void 0;

      var knownAttribute = resources.mapAttribute(attrName);
      if (knownAttribute && attrName in attributes && knownAttribute !== attrName) {
        attributes[knownAttribute] = attributes[attrName];
        delete attributes[attrName];
      }

      for (key in attributes) {
        value = attributes[key];

        if (value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
          property = type.attributes[key];

          if (property !== undefined) {
            value.targetProperty = property.name;
          } else {
            value.targetProperty = key;
          }
        }
      }
    };

    return ViewCompiler;
  }()) || _class14);

  var ResourceModule = exports.ResourceModule = function () {
    function ResourceModule(moduleId) {


      this.id = moduleId;
      this.moduleInstance = null;
      this.mainResource = null;
      this.resources = null;
      this.viewStrategy = null;
      this.isInitialized = false;
      this.onLoaded = null;
      this.loadContext = null;
    }

    ResourceModule.prototype.initialize = function initialize(container) {
      var current = this.mainResource;
      var resources = this.resources;
      var vs = this.viewStrategy;

      if (this.isInitialized) {
        return;
      }

      this.isInitialized = true;

      if (current !== undefined) {
        current.metadata.viewStrategy = vs;
        current.initialize(container);
      }

      for (var i = 0, ii = resources.length; i < ii; ++i) {
        current = resources[i];
        current.metadata.viewStrategy = vs;
        current.initialize(container);
      }
    };

    ResourceModule.prototype.register = function register(registry, name) {
      var main = this.mainResource;
      var resources = this.resources;

      if (main !== undefined) {
        main.register(registry, name);
        name = null;
      }

      for (var i = 0, ii = resources.length; i < ii; ++i) {
        resources[i].register(registry, name);
        name = null;
      }
    };

    ResourceModule.prototype.load = function load(container, loadContext) {
      if (this.onLoaded !== null) {
        return this.loadContext === loadContext ? Promise.resolve() : this.onLoaded;
      }

      var main = this.mainResource;
      var resources = this.resources;
      var loads = void 0;

      if (main !== undefined) {
        loads = new Array(resources.length + 1);
        loads[0] = main.load(container, loadContext);
        for (var i = 0, ii = resources.length; i < ii; ++i) {
          loads[i + 1] = resources[i].load(container, loadContext);
        }
      } else {
        loads = new Array(resources.length);
        for (var _i2 = 0, _ii = resources.length; _i2 < _ii; ++_i2) {
          loads[_i2] = resources[_i2].load(container, loadContext);
        }
      }

      this.loadContext = loadContext;
      this.onLoaded = Promise.all(loads);
      return this.onLoaded;
    };

    return ResourceModule;
  }();

  var ResourceDescription = exports.ResourceDescription = function () {
    function ResourceDescription(key, exportedValue, resourceTypeMeta) {


      if (!resourceTypeMeta) {
        resourceTypeMeta = _aureliaMetadata.metadata.get(_aureliaMetadata.metadata.resource, exportedValue);

        if (!resourceTypeMeta) {
          resourceTypeMeta = new HtmlBehaviorResource();
          resourceTypeMeta.elementName = _hyphenate(key);
          _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, resourceTypeMeta, exportedValue);
        }
      }

      if (resourceTypeMeta instanceof HtmlBehaviorResource) {
        if (resourceTypeMeta.elementName === undefined) {
          resourceTypeMeta.elementName = _hyphenate(key);
        } else if (resourceTypeMeta.attributeName === undefined) {
          resourceTypeMeta.attributeName = _hyphenate(key);
        } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          HtmlBehaviorResource.convention(key, resourceTypeMeta);
        }
      } else if (!resourceTypeMeta.name) {
        resourceTypeMeta.name = _hyphenate(key);
      }

      this.metadata = resourceTypeMeta;
      this.value = exportedValue;
    }

    ResourceDescription.prototype.initialize = function initialize(container) {
      this.metadata.initialize(container, this.value);
    };

    ResourceDescription.prototype.register = function register(registry, name) {
      this.metadata.register(registry, name);
    };

    ResourceDescription.prototype.load = function load(container, loadContext) {
      return this.metadata.load(container, this.value, loadContext);
    };

    return ResourceDescription;
  }();

  var ModuleAnalyzer = exports.ModuleAnalyzer = function () {
    function ModuleAnalyzer() {


      this.cache = Object.create(null);
    }

    ModuleAnalyzer.prototype.getAnalysis = function getAnalysis(moduleId) {
      return this.cache[moduleId];
    };

    ModuleAnalyzer.prototype.analyze = function analyze(moduleId, moduleInstance, mainResourceKey) {
      var mainResource = void 0;
      var fallbackValue = void 0;
      var fallbackKey = void 0;
      var resourceTypeMeta = void 0;
      var key = void 0;
      var exportedValue = void 0;
      var resources = [];
      var conventional = void 0;
      var vs = void 0;
      var resourceModule = void 0;

      resourceModule = this.cache[moduleId];
      if (resourceModule) {
        return resourceModule;
      }

      resourceModule = new ResourceModule(moduleId);
      this.cache[moduleId] = resourceModule;

      if (typeof moduleInstance === 'function') {
        moduleInstance = { 'default': moduleInstance };
      }

      if (mainResourceKey) {
        mainResource = new ResourceDescription(mainResourceKey, moduleInstance[mainResourceKey]);
      }

      for (key in moduleInstance) {
        exportedValue = moduleInstance[key];

        if (key === mainResourceKey || typeof exportedValue !== 'function') {
          continue;
        }

        resourceTypeMeta = _aureliaMetadata.metadata.get(_aureliaMetadata.metadata.resource, exportedValue);

        if (resourceTypeMeta) {
          if (resourceTypeMeta instanceof HtmlBehaviorResource) {
            ViewResources.convention(exportedValue, resourceTypeMeta);

            if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
              HtmlBehaviorResource.convention(key, resourceTypeMeta);
            }

            if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
              resourceTypeMeta.elementName = _hyphenate(key);
            }
          }

          if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
            mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
          }
        } else if (viewStrategy.decorates(exportedValue)) {
          vs = exportedValue;
        } else if (exportedValue instanceof _aureliaLoader.TemplateRegistryEntry) {
          vs = new TemplateRegistryViewStrategy(moduleId, exportedValue);
        } else {
          if (conventional = ViewResources.convention(exportedValue)) {
            if (conventional.elementName !== null && !mainResource) {
              mainResource = new ResourceDescription(key, exportedValue, conventional);
            } else {
              resources.push(new ResourceDescription(key, exportedValue, conventional));
            }
            _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, conventional, exportedValue);
          } else if (conventional = HtmlBehaviorResource.convention(key)) {
            if (conventional.elementName !== null && !mainResource) {
              mainResource = new ResourceDescription(key, exportedValue, conventional);
            } else {
              resources.push(new ResourceDescription(key, exportedValue, conventional));
            }

            _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, conventional, exportedValue);
          } else if (conventional = _aureliaBinding.ValueConverterResource.convention(key) || _aureliaBinding.BindingBehaviorResource.convention(key) || ViewEngineHooksResource.convention(key)) {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
            _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, conventional, exportedValue);
          } else if (!fallbackValue) {
            fallbackValue = exportedValue;
            fallbackKey = key;
          }
        }
      }

      if (!mainResource && fallbackValue) {
        mainResource = new ResourceDescription(fallbackKey, fallbackValue);
      }

      resourceModule.moduleInstance = moduleInstance;
      resourceModule.mainResource = mainResource;
      resourceModule.resources = resources;
      resourceModule.viewStrategy = vs;

      return resourceModule;
    };

    return ModuleAnalyzer;
  }();

  var logger = LogManager.getLogger('templating');

  function ensureRegistryEntry(loader, urlOrRegistryEntry) {
    if (urlOrRegistryEntry instanceof _aureliaLoader.TemplateRegistryEntry) {
      return Promise.resolve(urlOrRegistryEntry);
    }

    return loader.loadTemplate(urlOrRegistryEntry);
  }

  var ProxyViewFactory = function () {
    function ProxyViewFactory(promise) {
      var _this8 = this;



      promise.then(function (x) {
        return _this8.viewFactory = x;
      });
    }

    ProxyViewFactory.prototype.create = function create(container, bindingContext, createInstruction, element) {
      return this.viewFactory.create(container, bindingContext, createInstruction, element);
    };

    ProxyViewFactory.prototype.setCacheSize = function setCacheSize(size, doNotOverrideIfAlreadySet) {
      this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
    };

    ProxyViewFactory.prototype.getCachedView = function getCachedView() {
      return this.viewFactory.getCachedView();
    };

    ProxyViewFactory.prototype.returnViewToCache = function returnViewToCache(view) {
      this.viewFactory.returnViewToCache(view);
    };

    _createClass(ProxyViewFactory, [{
      key: 'isCaching',
      get: function get() {
        return this.viewFactory.isCaching;
      }
    }]);

    return ProxyViewFactory;
  }();

  var auSlotBehavior = null;

  var ViewEngine = exports.ViewEngine = (_dec8 = (0, _aureliaDependencyInjection.inject)(_aureliaLoader.Loader, _aureliaDependencyInjection.Container, ViewCompiler, ModuleAnalyzer, ViewResources), _dec8(_class15 = (_temp5 = _class16 = function () {
    function ViewEngine(loader, container, viewCompiler, moduleAnalyzer, appResources) {


      this.loader = loader;
      this.container = container;
      this.viewCompiler = viewCompiler;
      this.moduleAnalyzer = moduleAnalyzer;
      this.appResources = appResources;
      this._pluginMap = {};

      if (auSlotBehavior === null) {
        auSlotBehavior = new HtmlBehaviorResource();
        auSlotBehavior.attributeName = 'au-slot';
        _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, auSlotBehavior, SlotCustomAttribute);
      }

      auSlotBehavior.initialize(container, SlotCustomAttribute);
      auSlotBehavior.register(appResources);
    }

    ViewEngine.prototype.addResourcePlugin = function addResourcePlugin(extension, implementation) {
      var name = extension.replace('.', '') + '-resource-plugin';
      this._pluginMap[extension] = name;
      this.loader.addPlugin(name, implementation);
    };

    ViewEngine.prototype.loadViewFactory = function loadViewFactory(urlOrRegistryEntry, compileInstruction, loadContext, target) {
      var _this9 = this;

      loadContext = loadContext || new ResourceLoadContext();

      return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(function (registryEntry) {
        var url = registryEntry.address;

        if (registryEntry.onReady) {
          if (!loadContext.hasDependency(url)) {
            loadContext.addDependency(url);
            return registryEntry.onReady;
          }

          if (registryEntry.template === null) {
            return registryEntry.onReady;
          }

          return Promise.resolve(new ProxyViewFactory(registryEntry.onReady));
        }

        loadContext.addDependency(url);

        registryEntry.onReady = _this9.loadTemplateResources(registryEntry, compileInstruction, loadContext, target).then(function (resources) {
          registryEntry.resources = resources;

          if (registryEntry.template === null) {
            return registryEntry.factory = null;
          }

          var viewFactory = _this9.viewCompiler.compile(registryEntry.template, resources, compileInstruction);
          return registryEntry.factory = viewFactory;
        });

        return registryEntry.onReady;
      });
    };

    ViewEngine.prototype.loadTemplateResources = function loadTemplateResources(registryEntry, compileInstruction, loadContext, target) {
      var resources = new ViewResources(this.appResources, registryEntry.address);
      var dependencies = registryEntry.dependencies;
      var importIds = void 0;
      var names = void 0;

      compileInstruction = compileInstruction || ViewCompileInstruction.normal;

      if (dependencies.length === 0 && !compileInstruction.associatedModuleId) {
        return Promise.resolve(resources);
      }

      importIds = dependencies.map(function (x) {
        return x.src;
      });
      names = dependencies.map(function (x) {
        return x.name;
      });
      logger.debug('importing resources for ' + registryEntry.address, importIds);

      if (target) {
        var viewModelRequires = _aureliaMetadata.metadata.get(ViewEngine.viewModelRequireMetadataKey, target);
        if (viewModelRequires) {
          var templateImportCount = importIds.length;
          for (var i = 0, ii = viewModelRequires.length; i < ii; ++i) {
            var req = viewModelRequires[i];
            var importId = typeof req === 'function' ? _aureliaMetadata.Origin.get(req).moduleId : (0, _aureliaPath.relativeToFile)(req.src || req, registryEntry.address);

            if (importIds.indexOf(importId) === -1) {
              importIds.push(importId);
              names.push(req.as);
            }
          }
          logger.debug('importing ViewModel resources for ' + compileInstruction.associatedModuleId, importIds.slice(templateImportCount));
        }
      }

      return this.importViewResources(importIds, names, resources, compileInstruction, loadContext);
    };

    ViewEngine.prototype.importViewModelResource = function importViewModelResource(moduleImport, moduleMember) {
      var _this10 = this;

      return this.loader.loadModule(moduleImport).then(function (viewModelModule) {
        var normalizedId = _aureliaMetadata.Origin.get(viewModelModule).moduleId;
        var resourceModule = _this10.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

        if (!resourceModule.mainResource) {
          throw new Error('No view model found in module "' + moduleImport + '".');
        }

        resourceModule.initialize(_this10.container);

        return resourceModule.mainResource;
      });
    };

    ViewEngine.prototype.importViewResources = function importViewResources(moduleIds, names, resources, compileInstruction, loadContext) {
      var _this11 = this;

      loadContext = loadContext || new ResourceLoadContext();
      compileInstruction = compileInstruction || ViewCompileInstruction.normal;

      moduleIds = moduleIds.map(function (x) {
        return _this11._applyLoaderPlugin(x);
      });

      return this.loader.loadAllModules(moduleIds).then(function (imports) {
        var i = void 0;
        var ii = void 0;
        var analysis = void 0;
        var normalizedId = void 0;
        var current = void 0;
        var associatedModule = void 0;
        var container = _this11.container;
        var moduleAnalyzer = _this11.moduleAnalyzer;
        var allAnalysis = new Array(imports.length);

        for (i = 0, ii = imports.length; i < ii; ++i) {
          current = imports[i];
          normalizedId = _aureliaMetadata.Origin.get(current).moduleId;

          analysis = moduleAnalyzer.analyze(normalizedId, current);
          analysis.initialize(container);
          analysis.register(resources, names[i]);

          allAnalysis[i] = analysis;
        }

        if (compileInstruction.associatedModuleId) {
          associatedModule = moduleAnalyzer.getAnalysis(compileInstruction.associatedModuleId);

          if (associatedModule) {
            associatedModule.register(resources);
          }
        }

        for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
          allAnalysis[i] = allAnalysis[i].load(container, loadContext);
        }

        return Promise.all(allAnalysis).then(function () {
          return resources;
        });
      });
    };

    ViewEngine.prototype._applyLoaderPlugin = function _applyLoaderPlugin(id) {
      var index = id.lastIndexOf('.');
      if (index !== -1) {
        var ext = id.substring(index);
        var pluginName = this._pluginMap[ext];

        if (pluginName === undefined) {
          return id;
        }

        return this.loader.applyPluginToUrl(id, pluginName);
      }

      return id;
    };

    return ViewEngine;
  }(), _class16.viewModelRequireMetadataKey = 'aurelia:view-model-require', _temp5)) || _class15);

  var Controller = exports.Controller = function () {
    function Controller(behavior, instruction, viewModel, container) {


      this.behavior = behavior;
      this.instruction = instruction;
      this.viewModel = viewModel;
      this.isAttached = false;
      this.view = null;
      this.isBound = false;
      this.scope = null;
      this.container = container;
      this.elementEvents = container.elementEvents || null;

      var observerLookup = behavior.observerLocator.getOrCreateObserversLookup(viewModel);
      var handlesBind = behavior.handlesBind;
      var attributes = instruction.attributes;
      var boundProperties = this.boundProperties = [];
      var properties = behavior.properties;
      var i = void 0;
      var ii = void 0;

      behavior._ensurePropertiesDefined(viewModel, observerLookup);

      for (i = 0, ii = properties.length; i < ii; ++i) {
        properties[i]._initialize(viewModel, observerLookup, attributes, handlesBind, boundProperties);
      }
    }

    Controller.prototype.created = function created(owningView) {
      if (this.behavior.handlesCreated) {
        this.viewModel.created(owningView, this.view);
      }
    };

    Controller.prototype.automate = function automate(overrideContext, owningView) {
      this.view.bindingContext = this.viewModel;
      this.view.overrideContext = overrideContext || (0, _aureliaBinding.createOverrideContext)(this.viewModel);
      this.view._isUserControlled = true;

      if (this.behavior.handlesCreated) {
        this.viewModel.created(owningView || null, this.view);
      }

      this.bind(this.view);
    };

    Controller.prototype.bind = function bind(scope) {
      var skipSelfSubscriber = this.behavior.handlesBind;
      var boundProperties = this.boundProperties;
      var i = void 0;
      var ii = void 0;
      var x = void 0;
      var observer = void 0;
      var selfSubscriber = void 0;

      if (this.isBound) {
        if (this.scope === scope) {
          return;
        }

        this.unbind();
      }

      this.isBound = true;
      this.scope = scope;

      for (i = 0, ii = boundProperties.length; i < ii; ++i) {
        x = boundProperties[i];
        observer = x.observer;
        selfSubscriber = observer.selfSubscriber;
        observer.publishing = false;

        if (skipSelfSubscriber) {
          observer.selfSubscriber = null;
        }

        x.binding.bind(scope);
        observer.call();

        observer.publishing = true;
        observer.selfSubscriber = selfSubscriber;
      }

      var overrideContext = void 0;
      if (this.view !== null) {
        if (skipSelfSubscriber) {
          this.view.viewModelScope = scope;
        }

        if (this.viewModel === scope.overrideContext.bindingContext) {
          overrideContext = scope.overrideContext;
        } else if (this.instruction.inheritBindingContext) {
          overrideContext = (0, _aureliaBinding.createOverrideContext)(this.viewModel, scope.overrideContext);
        } else {
          overrideContext = (0, _aureliaBinding.createOverrideContext)(this.viewModel);
          overrideContext.__parentOverrideContext = scope.overrideContext;
        }

        this.view.bind(this.viewModel, overrideContext);
      } else if (skipSelfSubscriber) {
        overrideContext = scope.overrideContext;

        if (scope.overrideContext.__parentOverrideContext !== undefined && this.viewModel.viewFactory && this.viewModel.viewFactory.factoryCreateInstruction.partReplacements) {
          overrideContext = Object.assign({}, scope.overrideContext);
          overrideContext.parentOverrideContext = scope.overrideContext.__parentOverrideContext;
        }
        this.viewModel.bind(scope.bindingContext, overrideContext);
      }
    };

    Controller.prototype.unbind = function unbind() {
      if (this.isBound) {
        var _boundProperties = this.boundProperties;
        var _i3 = void 0;
        var _ii2 = void 0;

        this.isBound = false;
        this.scope = null;

        if (this.view !== null) {
          this.view.unbind();
        }

        if (this.behavior.handlesUnbind) {
          this.viewModel.unbind();
        }

        if (this.elementEvents !== null) {
          this.elementEvents.disposeAll();
        }

        for (_i3 = 0, _ii2 = _boundProperties.length; _i3 < _ii2; ++_i3) {
          _boundProperties[_i3].binding.unbind();
        }
      }
    };

    Controller.prototype.attached = function attached() {
      if (this.isAttached) {
        return;
      }

      this.isAttached = true;

      if (this.behavior.handlesAttached) {
        this.viewModel.attached();
      }

      if (this.view !== null) {
        this.view.attached();
      }
    };

    Controller.prototype.detached = function detached() {
      if (this.isAttached) {
        this.isAttached = false;

        if (this.view !== null) {
          this.view.detached();
        }

        if (this.behavior.handlesDetached) {
          this.viewModel.detached();
        }
      }
    };

    return Controller;
  }();

  var BehaviorPropertyObserver = exports.BehaviorPropertyObserver = (_dec9 = (0, _aureliaBinding.subscriberCollection)(), _dec9(_class17 = function () {
    function BehaviorPropertyObserver(taskQueue, obj, propertyName, selfSubscriber, initialValue) {


      this.taskQueue = taskQueue;
      this.obj = obj;
      this.propertyName = propertyName;
      this.notqueued = true;
      this.publishing = false;
      this.selfSubscriber = selfSubscriber;
      this.currentValue = this.oldValue = initialValue;
    }

    BehaviorPropertyObserver.prototype.getValue = function getValue() {
      return this.currentValue;
    };

    BehaviorPropertyObserver.prototype.setValue = function setValue(newValue) {
      var oldValue = this.currentValue;

      if (!Object.is(newValue, oldValue)) {
        this.oldValue = oldValue;
        this.currentValue = newValue;

        if (this.publishing && this.notqueued) {
          if (this.taskQueue.flushing) {
            this.call();
          } else {
            this.notqueued = false;
            this.taskQueue.queueMicroTask(this);
          }
        }
      }
    };

    BehaviorPropertyObserver.prototype.call = function call() {
      var oldValue = this.oldValue;
      var newValue = this.currentValue;

      this.notqueued = true;

      if (Object.is(newValue, oldValue)) {
        return;
      }

      if (this.selfSubscriber) {
        this.selfSubscriber(newValue, oldValue);
      }

      this.callSubscribers(newValue, oldValue);
      this.oldValue = newValue;
    };

    BehaviorPropertyObserver.prototype.subscribe = function subscribe(context, callable) {
      this.addSubscriber(context, callable);
    };

    BehaviorPropertyObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
      this.removeSubscriber(context, callable);
    };

    return BehaviorPropertyObserver;
  }()) || _class17);


  function getObserver(instance, name) {
    var lookup = instance.__observers__;

    if (lookup === undefined) {
      var ctor = Object.getPrototypeOf(instance).constructor;
      var _behavior = _aureliaMetadata.metadata.get(_aureliaMetadata.metadata.resource, ctor);
      if (!_behavior.isInitialized) {
        _behavior.initialize(_aureliaDependencyInjection.Container.instance || new _aureliaDependencyInjection.Container(), instance.constructor);
      }

      lookup = _behavior.observerLocator.getOrCreateObserversLookup(instance);
      _behavior._ensurePropertiesDefined(instance, lookup);
    }

    return lookup[name];
  }

  var BindableProperty = exports.BindableProperty = function () {
    function BindableProperty(nameOrConfig) {


      if (typeof nameOrConfig === 'string') {
        this.name = nameOrConfig;
      } else {
        Object.assign(this, nameOrConfig);
      }

      this.attribute = this.attribute || _hyphenate(this.name);
      var defaultBindingMode = this.defaultBindingMode;
      if (defaultBindingMode === null || defaultBindingMode === undefined) {
        this.defaultBindingMode = _aureliaBinding.bindingMode.oneWay;
      } else if (typeof defaultBindingMode === 'string') {
        this.defaultBindingMode = _aureliaBinding.bindingMode[defaultBindingMode] || _aureliaBinding.bindingMode.oneWay;
      }
      this.changeHandler = this.changeHandler || null;
      this.owner = null;
      this.descriptor = null;
    }

    BindableProperty.prototype.registerWith = function registerWith(target, behavior, descriptor) {
      behavior.properties.push(this);
      behavior.attributes[this.attribute] = this;
      this.owner = behavior;

      if (descriptor) {
        this.descriptor = descriptor;
        return this._configureDescriptor(descriptor);
      }

      return undefined;
    };

    BindableProperty.prototype._configureDescriptor = function _configureDescriptor(descriptor) {
      var name = this.name;

      descriptor.configurable = true;
      descriptor.enumerable = true;

      if ('initializer' in descriptor) {
        this.defaultValue = descriptor.initializer;
        delete descriptor.initializer;
        delete descriptor.writable;
      }

      if ('value' in descriptor) {
        this.defaultValue = descriptor.value;
        delete descriptor.value;
        delete descriptor.writable;
      }

      descriptor.get = function () {
        return getObserver(this, name).getValue();
      };

      descriptor.set = function (value) {
        getObserver(this, name).setValue(value);
      };

      descriptor.get.getObserver = function (obj) {
        return getObserver(obj, name);
      };

      return descriptor;
    };

    BindableProperty.prototype.defineOn = function defineOn(target, behavior) {
      var name = this.name;
      var handlerName = void 0;

      if (this.changeHandler === null) {
        handlerName = name + 'Changed';
        if (handlerName in target.prototype) {
          this.changeHandler = handlerName;
        }
      }

      if (this.descriptor === null) {
        Object.defineProperty(target.prototype, name, this._configureDescriptor(behavior, {}));
      }
    };

    BindableProperty.prototype.createObserver = function createObserver(viewModel) {
      var selfSubscriber = null;
      var defaultValue = this.defaultValue;
      var changeHandlerName = this.changeHandler;
      var name = this.name;
      var initialValue = void 0;

      if (this.hasOptions) {
        return undefined;
      }

      if (changeHandlerName in viewModel) {
        if ('propertyChanged' in viewModel) {
          selfSubscriber = function selfSubscriber(newValue, oldValue) {
            viewModel[changeHandlerName](newValue, oldValue);
            viewModel.propertyChanged(name, newValue, oldValue);
          };
        } else {
          selfSubscriber = function selfSubscriber(newValue, oldValue) {
            return viewModel[changeHandlerName](newValue, oldValue);
          };
        }
      } else if ('propertyChanged' in viewModel) {
        selfSubscriber = function selfSubscriber(newValue, oldValue) {
          return viewModel.propertyChanged(name, newValue, oldValue);
        };
      } else if (changeHandlerName !== null) {
        throw new Error('Change handler ' + changeHandlerName + ' was specified but not declared on the class.');
      }

      if (defaultValue !== undefined) {
        initialValue = typeof defaultValue === 'function' ? defaultValue.call(viewModel) : defaultValue;
      }

      return new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, this.name, selfSubscriber, initialValue);
    };

    BindableProperty.prototype._initialize = function _initialize(viewModel, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
      var selfSubscriber = void 0;
      var observer = void 0;
      var attribute = void 0;
      var defaultValue = this.defaultValue;

      if (this.isDynamic) {
        for (var _key6 in attributes) {
          this._createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, _key6, attributes[_key6], boundProperties);
        }
      } else if (!this.hasOptions) {
        observer = observerLookup[this.name];

        if (attributes !== null) {
          selfSubscriber = observer.selfSubscriber;
          attribute = attributes[this.attribute];

          if (behaviorHandlesBind) {
            observer.selfSubscriber = null;
          }

          if (typeof attribute === 'string') {
            viewModel[this.name] = attribute;
            observer.call();
          } else if (attribute) {
            boundProperties.push({ observer: observer, binding: attribute.createBinding(viewModel) });
          } else if (defaultValue !== undefined) {
            observer.call();
          }

          observer.selfSubscriber = selfSubscriber;
        }

        observer.publishing = true;
      }
    };

    BindableProperty.prototype._createDynamicProperty = function _createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
      var changeHandlerName = name + 'Changed';
      var selfSubscriber = null;
      var observer = void 0;
      var info = void 0;

      if (changeHandlerName in viewModel) {
        if ('propertyChanged' in viewModel) {
          selfSubscriber = function selfSubscriber(newValue, oldValue) {
            viewModel[changeHandlerName](newValue, oldValue);
            viewModel.propertyChanged(name, newValue, oldValue);
          };
        } else {
          selfSubscriber = function selfSubscriber(newValue, oldValue) {
            return viewModel[changeHandlerName](newValue, oldValue);
          };
        }
      } else if ('propertyChanged' in viewModel) {
        selfSubscriber = function selfSubscriber(newValue, oldValue) {
          return viewModel.propertyChanged(name, newValue, oldValue);
        };
      }

      observer = observerLookup[name] = new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, name, selfSubscriber);

      Object.defineProperty(viewModel, name, {
        configurable: true,
        enumerable: true,
        get: observer.getValue.bind(observer),
        set: observer.setValue.bind(observer)
      });

      if (behaviorHandlesBind) {
        observer.selfSubscriber = null;
      }

      if (typeof attribute === 'string') {
        viewModel[name] = attribute;
        observer.call();
      } else if (attribute) {
        info = { observer: observer, binding: attribute.createBinding(viewModel) };
        boundProperties.push(info);
      }

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    };

    return BindableProperty;
  }();

  var lastProviderId = 0;

  function nextProviderId() {
    return ++lastProviderId;
  }

  function doProcessContent() {
    return true;
  }
  function doProcessAttributes() {}

  var HtmlBehaviorResource = exports.HtmlBehaviorResource = function () {
    function HtmlBehaviorResource() {


      this.elementName = null;
      this.attributeName = null;
      this.attributeDefaultBindingMode = undefined;
      this.liftsContent = false;
      this.targetShadowDOM = false;
      this.shadowDOMOptions = null;
      this.processAttributes = doProcessAttributes;
      this.processContent = doProcessContent;
      this.usesShadowDOM = false;
      this.childBindings = null;
      this.hasDynamicOptions = false;
      this.containerless = false;
      this.properties = [];
      this.attributes = {};
      this.isInitialized = false;
      this.primaryProperty = null;
    }

    HtmlBehaviorResource.convention = function convention(name, existing) {
      var behavior = void 0;

      if (name.endsWith('CustomAttribute')) {
        behavior = existing || new HtmlBehaviorResource();
        behavior.attributeName = _hyphenate(name.substring(0, name.length - 15));
      }

      if (name.endsWith('CustomElement')) {
        behavior = existing || new HtmlBehaviorResource();
        behavior.elementName = _hyphenate(name.substring(0, name.length - 13));
      }

      return behavior;
    };

    HtmlBehaviorResource.prototype.addChildBinding = function addChildBinding(behavior) {
      if (this.childBindings === null) {
        this.childBindings = [];
      }

      this.childBindings.push(behavior);
    };

    HtmlBehaviorResource.prototype.initialize = function initialize(container, target) {
      var proto = target.prototype;
      var properties = this.properties;
      var attributeName = this.attributeName;
      var attributeDefaultBindingMode = this.attributeDefaultBindingMode;
      var i = void 0;
      var ii = void 0;
      var current = void 0;

      if (this.isInitialized) {
        return;
      }

      this.isInitialized = true;
      target.__providerId__ = nextProviderId();

      this.observerLocator = container.get(_aureliaBinding.ObserverLocator);
      this.taskQueue = container.get(_aureliaTaskQueue.TaskQueue);

      this.target = target;
      this.usesShadowDOM = this.targetShadowDOM && _aureliaPal.FEATURE.shadowDOM;
      this.handlesCreated = 'created' in proto;
      this.handlesBind = 'bind' in proto;
      this.handlesUnbind = 'unbind' in proto;
      this.handlesAttached = 'attached' in proto;
      this.handlesDetached = 'detached' in proto;
      this.htmlName = this.elementName || this.attributeName;

      if (attributeName !== null) {
        if (properties.length === 0) {
          new BindableProperty({
            name: 'value',
            changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
            attribute: attributeName,
            defaultBindingMode: attributeDefaultBindingMode
          }).registerWith(target, this);
        }

        current = properties[0];

        if (properties.length === 1 && current.name === 'value') {
          current.isDynamic = current.hasOptions = this.hasDynamicOptions;
          current.defineOn(target, this);
        } else {
          for (i = 0, ii = properties.length; i < ii; ++i) {
            properties[i].defineOn(target, this);
            if (properties[i].primaryProperty) {
              if (this.primaryProperty) {
                throw new Error('Only one bindable property on a custom element can be defined as the default');
              }
              this.primaryProperty = properties[i];
            }
          }

          current = new BindableProperty({
            name: 'value',
            changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
            attribute: attributeName,
            defaultBindingMode: attributeDefaultBindingMode
          });

          current.hasOptions = true;
          current.registerWith(target, this);
        }
      } else {
        for (i = 0, ii = properties.length; i < ii; ++i) {
          properties[i].defineOn(target, this);
        }

        this._copyInheritedProperties(container, target);
      }
    };

    HtmlBehaviorResource.prototype.register = function register(registry, name) {
      var _this12 = this;

      if (this.attributeName !== null) {
        registry.registerAttribute(name || this.attributeName, this, this.attributeName);

        if (Array.isArray(this.aliases)) {
          this.aliases.forEach(function (alias) {
            registry.registerAttribute(alias, _this12, _this12.attributeName);
          });
        }
      }

      if (this.elementName !== null) {
        registry.registerElement(name || this.elementName, this);
      }
    };

    HtmlBehaviorResource.prototype.load = function load(container, target, loadContext, viewStrategy, transientView) {
      var _this13 = this;

      var options = void 0;

      if (this.elementName !== null) {
        viewStrategy = container.get(ViewLocator).getViewStrategy(viewStrategy || this.viewStrategy || target);
        options = new ViewCompileInstruction(this.targetShadowDOM, true);

        if (!viewStrategy.moduleId) {
          viewStrategy.moduleId = _aureliaMetadata.Origin.get(target).moduleId;
        }

        return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext, target).then(function (viewFactory) {
          if (!transientView || !_this13.viewFactory) {
            _this13.viewFactory = viewFactory;
          }

          return viewFactory;
        });
      }

      return Promise.resolve(this);
    };

    HtmlBehaviorResource.prototype.compile = function compile(compiler, resources, node, instruction, parentNode) {
      if (this.liftsContent) {
        if (!instruction.viewFactory) {
          var _template = _aureliaPal.DOM.createElement('template');
          var fragment = _aureliaPal.DOM.createDocumentFragment();
          var cacheSize = node.getAttribute('view-cache');
          var part = node.getAttribute('part');

          node.removeAttribute(instruction.originalAttrName);
          _aureliaPal.DOM.replaceNode(_template, node, parentNode);
          fragment.appendChild(node);
          instruction.viewFactory = compiler.compile(fragment, resources);

          if (part) {
            instruction.viewFactory.part = part;
            node.removeAttribute('part');
          }

          if (cacheSize) {
            instruction.viewFactory.setCacheSize(cacheSize);
            node.removeAttribute('view-cache');
          }

          node = _template;
        }
      } else if (this.elementName !== null) {
        var _partReplacements2 = {};

        if (this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()) {
          var currentChild = node.firstChild;
          var contentElement = this.usesShadowDOM ? null : _aureliaPal.DOM.createElement('au-content');
          var nextSibling = void 0;
          var toReplace = void 0;

          while (currentChild) {
            nextSibling = currentChild.nextSibling;

            if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
              _partReplacements2[toReplace] = compiler.compile(currentChild, resources);
              _aureliaPal.DOM.removeNode(currentChild, parentNode);
              instruction.partReplacements = _partReplacements2;
            } else if (contentElement !== null) {
              if (currentChild.nodeType === 3 && _isAllWhitespace(currentChild)) {
                _aureliaPal.DOM.removeNode(currentChild, parentNode);
              } else {
                contentElement.appendChild(currentChild);
              }
            }

            currentChild = nextSibling;
          }

          if (contentElement !== null && contentElement.hasChildNodes()) {
            node.appendChild(contentElement);
          }

          instruction.skipContentProcessing = false;
        } else {
          instruction.skipContentProcessing = true;
        }
      } else if (!this.processContent(compiler, resources, node, instruction)) {
        instruction.skipContentProcessing = true;
      }

      return node;
    };

    HtmlBehaviorResource.prototype.create = function create(container, instruction, element, bindings) {
      var viewHost = void 0;
      var au = null;

      instruction = instruction || BehaviorInstruction.normal;
      element = element || null;
      bindings = bindings || null;

      if (this.elementName !== null && element) {
        if (this.usesShadowDOM) {
          viewHost = element.attachShadow(this.shadowDOMOptions);
          container.registerInstance(_aureliaPal.DOM.boundary, viewHost);
        } else {
          viewHost = element;
          if (this.targetShadowDOM) {
            container.registerInstance(_aureliaPal.DOM.boundary, viewHost);
          }
        }
      }

      if (element !== null) {
        element.au = au = element.au || {};
      }

      var viewModel = instruction.viewModel || container.get(this.target);
      var controller = new Controller(this, instruction, viewModel, container);
      var childBindings = this.childBindings;
      var viewFactory = void 0;

      if (this.liftsContent) {
        au.controller = controller;
      } else if (this.elementName !== null) {
        viewFactory = instruction.viewFactory || this.viewFactory;
        container.viewModel = viewModel;

        if (viewFactory) {
          controller.view = viewFactory.create(container, instruction, element);
        }

        if (element !== null) {
          au.controller = controller;

          if (controller.view) {
            if (!this.usesShadowDOM && (element.childNodes.length === 1 || element.contentElement)) {
              var contentElement = element.childNodes[0] || element.contentElement;
              controller.view.contentView = { fragment: contentElement };
              contentElement.parentNode && _aureliaPal.DOM.removeNode(contentElement);
            }

            if (instruction.anchorIsContainer) {
              if (childBindings !== null) {
                for (var _i4 = 0, _ii3 = childBindings.length; _i4 < _ii3; ++_i4) {
                  controller.view.addBinding(childBindings[_i4].create(element, viewModel, controller));
                }
              }

              controller.view.appendNodesTo(viewHost);
            } else {
              controller.view.insertNodesBefore(viewHost);
            }
          } else if (childBindings !== null) {
            for (var _i5 = 0, _ii4 = childBindings.length; _i5 < _ii4; ++_i5) {
              bindings.push(childBindings[_i5].create(element, viewModel, controller));
            }
          }
        } else if (controller.view) {
          controller.view.controller = controller;

          if (childBindings !== null) {
            for (var _i6 = 0, _ii5 = childBindings.length; _i6 < _ii5; ++_i6) {
              controller.view.addBinding(childBindings[_i6].create(instruction.host, viewModel, controller));
            }
          }
        } else if (childBindings !== null) {
          for (var _i7 = 0, _ii6 = childBindings.length; _i7 < _ii6; ++_i7) {
            bindings.push(childBindings[_i7].create(instruction.host, viewModel, controller));
          }
        }
      } else if (childBindings !== null) {
        for (var _i8 = 0, _ii7 = childBindings.length; _i8 < _ii7; ++_i8) {
          bindings.push(childBindings[_i8].create(element, viewModel, controller));
        }
      }

      if (au !== null) {
        au[this.htmlName] = controller;
      }

      if (instruction.initiatedByBehavior && viewFactory) {
        controller.view.created();
      }

      return controller;
    };

    HtmlBehaviorResource.prototype._ensurePropertiesDefined = function _ensurePropertiesDefined(instance, lookup) {
      var properties = void 0;
      var i = void 0;
      var ii = void 0;
      var observer = void 0;

      if ('__propertiesDefined__' in lookup) {
        return;
      }

      lookup.__propertiesDefined__ = true;
      properties = this.properties;

      for (i = 0, ii = properties.length; i < ii; ++i) {
        observer = properties[i].createObserver(instance);

        if (observer !== undefined) {
          lookup[observer.propertyName] = observer;
        }
      }
    };

    HtmlBehaviorResource.prototype._copyInheritedProperties = function _copyInheritedProperties(container, target) {
      var _this14 = this;

      var behavior = void 0;
      var derived = target;

      while (true) {
        var proto = Object.getPrototypeOf(target.prototype);
        target = proto && proto.constructor;
        if (!target) {
          return;
        }
        behavior = _aureliaMetadata.metadata.getOwn(_aureliaMetadata.metadata.resource, target);
        if (behavior) {
          break;
        }
      }
      behavior.initialize(container, target);

      var _loop = function _loop(_i9, _ii8) {
        var prop = behavior.properties[_i9];

        if (_this14.properties.some(function (p) {
          return p.name === prop.name;
        })) {
          return 'continue';
        }

        new BindableProperty(prop).registerWith(derived, _this14);
      };

      for (var _i9 = 0, _ii8 = behavior.properties.length; _i9 < _ii8; ++_i9) {
        var _ret = _loop(_i9, _ii8);

        if (_ret === 'continue') continue;
      }
    };

    return HtmlBehaviorResource;
  }();

  function createChildObserverDecorator(selectorOrConfig, all) {
    return function (target, key, descriptor) {
      var actualTarget = typeof key === 'string' ? target.constructor : target;
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, actualTarget);

      if (typeof selectorOrConfig === 'string') {
        selectorOrConfig = {
          selector: selectorOrConfig,
          name: key
        };
      }

      if (descriptor) {
        descriptor.writable = true;
        descriptor.configurable = true;
      }

      selectorOrConfig.all = all;
      r.addChildBinding(new ChildObserver(selectorOrConfig));
    };
  }

  function children(selectorOrConfig) {
    return createChildObserverDecorator(selectorOrConfig, true);
  }

  function child(selectorOrConfig) {
    return createChildObserverDecorator(selectorOrConfig, false);
  }

  var ChildObserver = function () {
    function ChildObserver(config) {


      this.name = config.name;
      this.changeHandler = config.changeHandler || this.name + 'Changed';
      this.selector = config.selector;
      this.all = config.all;
    }

    ChildObserver.prototype.create = function create(viewHost, viewModel, controller) {
      return new ChildObserverBinder(this.selector, viewHost, this.name, viewModel, controller, this.changeHandler, this.all);
    };

    return ChildObserver;
  }();

  var noMutations = [];

  function trackMutation(groupedMutations, binder, record) {
    var mutations = groupedMutations.get(binder);

    if (!mutations) {
      mutations = [];
      groupedMutations.set(binder, mutations);
    }

    mutations.push(record);
  }

  function onChildChange(mutations, observer) {
    var binders = observer.binders;
    var bindersLength = binders.length;
    var groupedMutations = new Map();

    for (var _i10 = 0, _ii9 = mutations.length; _i10 < _ii9; ++_i10) {
      var record = mutations[_i10];
      var added = record.addedNodes;
      var removed = record.removedNodes;

      for (var j = 0, jj = removed.length; j < jj; ++j) {
        var _node = removed[j];
        if (_node.nodeType === 1) {
          for (var k = 0; k < bindersLength; ++k) {
            var binder = binders[k];
            if (binder.onRemove(_node)) {
              trackMutation(groupedMutations, binder, record);
            }
          }
        }
      }

      for (var _j = 0, _jj = added.length; _j < _jj; ++_j) {
        var _node2 = added[_j];
        if (_node2.nodeType === 1) {
          for (var _k = 0; _k < bindersLength; ++_k) {
            var _binder = binders[_k];
            if (_binder.onAdd(_node2)) {
              trackMutation(groupedMutations, _binder, record);
            }
          }
        }
      }
    }

    groupedMutations.forEach(function (value, key) {
      if (key.changeHandler !== null) {
        key.viewModel[key.changeHandler](value);
      }
    });
  }

  var ChildObserverBinder = function () {
    function ChildObserverBinder(selector, viewHost, property, viewModel, controller, changeHandler, all) {


      this.selector = selector;
      this.viewHost = viewHost;
      this.property = property;
      this.viewModel = viewModel;
      this.controller = controller;
      this.changeHandler = changeHandler in viewModel ? changeHandler : null;
      this.usesShadowDOM = controller.behavior.usesShadowDOM;
      this.all = all;

      if (!this.usesShadowDOM && controller.view && controller.view.contentView) {
        this.contentView = controller.view.contentView;
      } else {
        this.contentView = null;
      }
    }

    ChildObserverBinder.prototype.matches = function matches(element) {
      if (element.matches(this.selector)) {
        if (this.contentView === null) {
          return true;
        }

        var contentView = this.contentView;
        var assignedSlot = element.auAssignedSlot;

        if (assignedSlot && assignedSlot.projectFromAnchors) {
          var anchors = assignedSlot.projectFromAnchors;

          for (var _i11 = 0, _ii10 = anchors.length; _i11 < _ii10; ++_i11) {
            if (anchors[_i11].auOwnerView === contentView) {
              return true;
            }
          }

          return false;
        }

        return element.auOwnerView === contentView;
      }

      return false;
    };

    ChildObserverBinder.prototype.bind = function bind(source) {
      var viewHost = this.viewHost;
      var viewModel = this.viewModel;
      var observer = viewHost.__childObserver__;

      if (!observer) {
        observer = viewHost.__childObserver__ = _aureliaPal.DOM.createMutationObserver(onChildChange);

        var options = {
          childList: true,
          subtree: !this.usesShadowDOM
        };

        observer.observe(viewHost, options);
        observer.binders = [];
      }

      observer.binders.push(this);

      if (this.usesShadowDOM) {
        var current = viewHost.firstElementChild;

        if (this.all) {
          var items = viewModel[this.property];
          if (!items) {
            items = viewModel[this.property] = [];
          } else {
            items.splice(0);
          }

          while (current) {
            if (this.matches(current)) {
              items.push(current.au && current.au.controller ? current.au.controller.viewModel : current);
            }

            current = current.nextElementSibling;
          }

          if (this.changeHandler !== null) {
            this.viewModel[this.changeHandler](noMutations);
          }
        } else {
          while (current) {
            if (this.matches(current)) {
              var _value = current.au && current.au.controller ? current.au.controller.viewModel : current;
              this.viewModel[this.property] = _value;

              if (this.changeHandler !== null) {
                this.viewModel[this.changeHandler](_value);
              }

              break;
            }

            current = current.nextElementSibling;
          }
        }
      }
    };

    ChildObserverBinder.prototype.onRemove = function onRemove(element) {
      if (this.matches(element)) {
        var _value2 = element.au && element.au.controller ? element.au.controller.viewModel : element;

        if (this.all) {
          var items = this.viewModel[this.property] || (this.viewModel[this.property] = []);
          var index = items.indexOf(_value2);

          if (index !== -1) {
            items.splice(index, 1);
          }

          return true;
        }

        return false;
      }

      return false;
    };

    ChildObserverBinder.prototype.onAdd = function onAdd(element) {
      if (this.matches(element)) {
        var _value3 = element.au && element.au.controller ? element.au.controller.viewModel : element;

        if (this.all) {
          var items = this.viewModel[this.property] || (this.viewModel[this.property] = []);

          if (this.selector === '*') {
            items.push(_value3);
            return true;
          }

          var index = 0;
          var prev = element.previousElementSibling;

          while (prev) {
            if (this.matches(prev)) {
              index++;
            }

            prev = prev.previousElementSibling;
          }

          items.splice(index, 0, _value3);
          return true;
        }

        this.viewModel[this.property] = _value3;

        if (this.changeHandler !== null) {
          this.viewModel[this.changeHandler](_value3);
        }
      }

      return false;
    };

    ChildObserverBinder.prototype.unbind = function unbind() {
      if (this.viewHost.__childObserver__) {
        this.viewHost.__childObserver__.disconnect();
        this.viewHost.__childObserver__ = null;
        this.viewModel[this.property] = null;
      }
    };

    return ChildObserverBinder;
  }();

  function remove(viewSlot, previous) {
    return Array.isArray(previous) ? viewSlot.removeMany(previous, true) : viewSlot.remove(previous, true);
  }

  var SwapStrategies = exports.SwapStrategies = {
    before: function before(viewSlot, previous, callback) {
      return previous === undefined ? callback() : callback().then(function () {
        return remove(viewSlot, previous);
      });
    },
    with: function _with(viewSlot, previous, callback) {
      return previous === undefined ? callback() : Promise.all([remove(viewSlot, previous), callback()]);
    },
    after: function after(viewSlot, previous, callback) {
      return Promise.resolve(viewSlot.removeAll(true)).then(callback);
    }
  };

  function tryActivateViewModel(context) {
    if (context.skipActivation || typeof context.viewModel.activate !== 'function') {
      return Promise.resolve();
    }

    return context.viewModel.activate(context.model) || Promise.resolve();
  }

  var CompositionEngine = exports.CompositionEngine = (_dec10 = (0, _aureliaDependencyInjection.inject)(ViewEngine, ViewLocator), _dec10(_class18 = function () {
    function CompositionEngine(viewEngine, viewLocator) {


      this.viewEngine = viewEngine;
      this.viewLocator = viewLocator;
    }

    CompositionEngine.prototype._swap = function _swap(context, view) {
      var swapStrategy = SwapStrategies[context.swapOrder] || SwapStrategies.after;
      var previousViews = context.viewSlot.children.slice();

      return swapStrategy(context.viewSlot, previousViews, function () {
        return Promise.resolve(context.viewSlot.add(view)).then(function () {
          if (context.currentController) {
            context.currentController.unbind();
          }
        });
      }).then(function () {
        if (context.compositionTransactionNotifier) {
          context.compositionTransactionNotifier.done();
        }
      });
    };

    CompositionEngine.prototype._createControllerAndSwap = function _createControllerAndSwap(context) {
      var _this15 = this;

      return this.createController(context).then(function (controller) {
        if (context.compositionTransactionOwnershipToken) {
          return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(function () {
            controller.automate(context.overrideContext, context.owningView);

            return _this15._swap(context, controller.view);
          }).then(function () {
            return controller;
          });
        }

        controller.automate(context.overrideContext, context.owningView);

        return _this15._swap(context, controller.view).then(function () {
          return controller;
        });
      });
    };

    CompositionEngine.prototype.createController = function createController(context) {
      var _this16 = this;

      var childContainer = void 0;
      var viewModel = void 0;
      var viewModelResource = void 0;

      var m = void 0;

      return this.ensureViewModel(context).then(tryActivateViewModel).then(function () {
        childContainer = context.childContainer;
        viewModel = context.viewModel;
        viewModelResource = context.viewModelResource;
        m = viewModelResource.metadata;

        var viewStrategy = _this16.viewLocator.getViewStrategy(context.view || viewModel);

        if (context.viewResources) {
          viewStrategy.makeRelativeTo(context.viewResources.viewUrl);
        }

        return m.load(childContainer, viewModelResource.value, null, viewStrategy, true);
      }).then(function (viewFactory) {
        return m.create(childContainer, BehaviorInstruction.dynamic(context.host, viewModel, viewFactory));
      });
    };

    CompositionEngine.prototype.ensureViewModel = function ensureViewModel(context) {
      var childContainer = context.childContainer = context.childContainer || context.container.createChild();

      if (typeof context.viewModel === 'string') {
        context.viewModel = context.viewResources ? context.viewResources.relativeToView(context.viewModel) : context.viewModel;

        return this.viewEngine.importViewModelResource(context.viewModel).then(function (viewModelResource) {
          childContainer.autoRegister(viewModelResource.value);

          if (context.host) {
            childContainer.registerInstance(_aureliaPal.DOM.Element, context.host);
          }

          context.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
          context.viewModelResource = viewModelResource;
          return context;
        });
      }

      var ctor = context.viewModel.constructor;
      var isClass = typeof context.viewModel === 'function';
      if (isClass) {
        ctor = context.viewModel;
        childContainer.autoRegister(ctor);
      }
      var m = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, ctor);

      m.elementName = m.elementName || 'dynamic-element';

      m.initialize(isClass ? childContainer : context.container || childContainer, ctor);

      context.viewModelResource = { metadata: m, value: ctor };

      if (context.host) {
        childContainer.registerInstance(_aureliaPal.DOM.Element, context.host);
      }
      childContainer.viewModel = context.viewModel = isClass ? childContainer.get(ctor) : context.viewModel;
      return Promise.resolve(context);
    };

    CompositionEngine.prototype.compose = function compose(context) {
      var _this17 = this;

      context.childContainer = context.childContainer || context.container.createChild();
      context.view = this.viewLocator.getViewStrategy(context.view);

      var transaction = context.childContainer.get(CompositionTransaction);
      var compositionTransactionOwnershipToken = transaction.tryCapture();

      if (compositionTransactionOwnershipToken) {
        context.compositionTransactionOwnershipToken = compositionTransactionOwnershipToken;
      } else {
        context.compositionTransactionNotifier = transaction.enlist();
      }

      if (context.viewModel) {
        return this._createControllerAndSwap(context);
      } else if (context.view) {
        if (context.viewResources) {
          context.view.makeRelativeTo(context.viewResources.viewUrl);
        }

        return context.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(function (viewFactory) {
          var result = viewFactory.create(context.childContainer);
          result.bind(context.bindingContext, context.overrideContext);

          if (context.compositionTransactionOwnershipToken) {
            return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(function () {
              return _this17._swap(context, result);
            }).then(function () {
              return result;
            });
          }

          return _this17._swap(context, result).then(function () {
            return result;
          });
        });
      } else if (context.viewSlot) {
        context.viewSlot.removeAll();

        if (context.compositionTransactionNotifier) {
          context.compositionTransactionNotifier.done();
        }

        return Promise.resolve(null);
      }

      return Promise.resolve(null);
    };

    return CompositionEngine;
  }()) || _class18);

  var ElementConfigResource = exports.ElementConfigResource = function () {
    function ElementConfigResource() {

    }

    ElementConfigResource.prototype.initialize = function initialize(container, target) {};

    ElementConfigResource.prototype.register = function register(registry, name) {};

    ElementConfigResource.prototype.load = function load(container, target) {
      var config = new target();
      var eventManager = container.get(_aureliaBinding.EventManager);
      eventManager.registerElementConfig(config);
    };

    return ElementConfigResource;
  }();

  function resource(instanceOrConfig) {
    return function (target) {
      var isConfig = typeof instanceOrConfig === 'string' || Object.getPrototypeOf(instanceOrConfig) === Object.prototype;
      if (isConfig) {
        target.$resource = instanceOrConfig;
      } else {
        _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, instanceOrConfig, target);
      }
    };
  }

  function behavior(override) {
    return function (target) {
      if (override instanceof HtmlBehaviorResource) {
        _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, override, target);
      } else {
        var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, target);
        Object.assign(r, override);
      }
    };
  }

  function customElement(name) {
    return function (target) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, target);
      r.elementName = validateBehaviorName(name, 'custom element');
    };
  }

  function customAttribute(name, defaultBindingMode, aliases) {
    return function (target) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, target);
      r.attributeName = validateBehaviorName(name, 'custom attribute');
      r.attributeDefaultBindingMode = defaultBindingMode;
      r.aliases = aliases;
    };
  }

  function templateController(target) {
    var deco = function deco(t) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, t);
      r.liftsContent = true;
    };

    return target ? deco(target) : deco;
  }

  function bindable(nameOrConfigOrTarget, key, descriptor) {
    var deco = function deco(target, key2, descriptor2) {
      var actualTarget = key2 ? target.constructor : target;
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, actualTarget);
      var prop = void 0;

      if (key2) {
        nameOrConfigOrTarget = nameOrConfigOrTarget || {};
        nameOrConfigOrTarget.name = key2;
      }

      prop = new BindableProperty(nameOrConfigOrTarget);
      return prop.registerWith(actualTarget, r, descriptor2);
    };

    if (!nameOrConfigOrTarget) {
      return deco;
    }

    if (key) {
      var _target = nameOrConfigOrTarget;
      nameOrConfigOrTarget = null;
      return deco(_target, key, descriptor);
    }

    return deco;
  }

  function dynamicOptions(target) {
    var deco = function deco(t) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, t);
      r.hasDynamicOptions = true;
    };

    return target ? deco(target) : deco;
  }

  var defaultShadowDOMOptions = { mode: 'open' };
  function useShadowDOM(targetOrOptions) {
    var options = typeof targetOrOptions === 'function' || !targetOrOptions ? defaultShadowDOMOptions : targetOrOptions;

    var deco = function deco(t) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, t);
      r.targetShadowDOM = true;
      r.shadowDOMOptions = options;
    };

    return typeof targetOrOptions === 'function' ? deco(targetOrOptions) : deco;
  }

  function processAttributes(processor) {
    return function (t) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, t);
      r.processAttributes = function (compiler, resources, node, attributes, elementInstruction) {
        try {
          processor(compiler, resources, node, attributes, elementInstruction);
        } catch (error) {
          LogManager.getLogger('templating').error(error);
        }
      };
    };
  }

  function doNotProcessContent() {
    return false;
  }

  function processContent(processor) {
    return function (t) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, t);
      r.processContent = processor ? function (compiler, resources, node, instruction) {
        try {
          return processor(compiler, resources, node, instruction);
        } catch (error) {
          LogManager.getLogger('templating').error(error);
          return false;
        }
      } : doNotProcessContent;
    };
  }

  function containerless(target) {
    var deco = function deco(t) {
      var r = _aureliaMetadata.metadata.getOrCreateOwn(_aureliaMetadata.metadata.resource, HtmlBehaviorResource, t);
      r.containerless = true;
    };

    return target ? deco(target) : deco;
  }

  function useViewStrategy(strategy) {
    return function (target) {
      _aureliaMetadata.metadata.define(ViewLocator.viewStrategyMetadataKey, strategy, target);
    };
  }

  function useView(path) {
    return useViewStrategy(new RelativeViewStrategy(path));
  }

  function inlineView(markup, dependencies, dependencyBaseUrl) {
    return useViewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
  }

  function noView(targetOrDependencies, dependencyBaseUrl) {
    var target = void 0;
    var dependencies = void 0;
    if (typeof targetOrDependencies === 'function') {
      target = targetOrDependencies;
    } else {
      dependencies = targetOrDependencies;
      target = undefined;
    }

    var deco = function deco(t) {
      _aureliaMetadata.metadata.define(ViewLocator.viewStrategyMetadataKey, new NoViewStrategy(dependencies, dependencyBaseUrl), t);
    };

    return target ? deco(target) : deco;
  }

  function view(templateOrConfig) {
    return function (target) {
      target.$view = templateOrConfig;
    };
  }

  function elementConfig(target) {
    var deco = function deco(t) {
      _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.resource, new ElementConfigResource(), t);
    };

    return target ? deco(target) : deco;
  }

  function viewResources() {
    for (var _len = arguments.length, resources = Array(_len), _key7 = 0; _key7 < _len; _key7++) {
      resources[_key7] = arguments[_key7];
    }

    return function (target) {
      _aureliaMetadata.metadata.define(ViewEngine.viewModelRequireMetadataKey, resources, target);
    };
  }

  var TemplatingEngine = exports.TemplatingEngine = (_dec11 = (0, _aureliaDependencyInjection.inject)(_aureliaDependencyInjection.Container, ModuleAnalyzer, ViewCompiler, CompositionEngine), _dec11(_class19 = function () {
    function TemplatingEngine(container, moduleAnalyzer, viewCompiler, compositionEngine) {


      this._container = container;
      this._moduleAnalyzer = moduleAnalyzer;
      this._viewCompiler = viewCompiler;
      this._compositionEngine = compositionEngine;
      container.registerInstance(Animator, Animator.instance = new Animator());
    }

    TemplatingEngine.prototype.configureAnimator = function configureAnimator(animator) {
      this._container.unregister(Animator);
      this._container.registerInstance(Animator, Animator.instance = animator);
    };

    TemplatingEngine.prototype.compose = function compose(context) {
      return this._compositionEngine.compose(context);
    };

    TemplatingEngine.prototype.enhance = function enhance(instruction) {
      if (instruction instanceof _aureliaPal.DOM.Element) {
        instruction = { element: instruction };
      }

      var compilerInstructions = { letExpressions: [] };
      var resources = instruction.resources || this._container.get(ViewResources);

      this._viewCompiler._compileNode(instruction.element, resources, compilerInstructions, instruction.element.parentNode, 'root', true);

      var factory = new ViewFactory(instruction.element, compilerInstructions, resources);
      var container = instruction.container || this._container.createChild();
      var view = factory.create(container, BehaviorInstruction.enhance());

      view.bind(instruction.bindingContext || {}, instruction.overrideContext);

      view.firstChild = view.lastChild = view.fragment;
      view.fragment = _aureliaPal.DOM.createDocumentFragment();
      view.attached();

      return view;
    };

    return TemplatingEngine;
  }()) || _class19);
});;define('aurelia-templating', ['aurelia-templating/aurelia-templating'], function (main) { return main; });

define('aurelia-templating-binding/aurelia-templating-binding',['exports', 'aurelia-logging', 'aurelia-binding', 'aurelia-templating'], function (exports, _aureliaLogging, _aureliaBinding, _aureliaTemplating) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.TemplatingBindingLanguage = exports.SyntaxInterpreter = exports.LetInterpolationBinding = exports.LetInterpolationBindingExpression = exports.LetBinding = exports.LetExpression = exports.ChildInterpolationBinding = exports.InterpolationBinding = exports.InterpolationBindingExpression = exports.AttributeMap = undefined;
  exports.configure = configure;

  var LogManager = _interopRequireWildcard(_aureliaLogging);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }



  var _class, _temp, _dec, _class2, _dec2, _class3, _class4, _temp2, _class5, _temp3;

  var AttributeMap = exports.AttributeMap = (_temp = _class = function () {
    function AttributeMap(svg) {


      this.elements = Object.create(null);
      this.allElements = Object.create(null);

      this.svg = svg;

      this.registerUniversal('accesskey', 'accessKey');
      this.registerUniversal('contenteditable', 'contentEditable');
      this.registerUniversal('tabindex', 'tabIndex');
      this.registerUniversal('textcontent', 'textContent');
      this.registerUniversal('innerhtml', 'innerHTML');
      this.registerUniversal('scrolltop', 'scrollTop');
      this.registerUniversal('scrollleft', 'scrollLeft');
      this.registerUniversal('readonly', 'readOnly');

      this.register('label', 'for', 'htmlFor');

      this.register('img', 'usemap', 'useMap');

      this.register('input', 'maxlength', 'maxLength');
      this.register('input', 'minlength', 'minLength');
      this.register('input', 'formaction', 'formAction');
      this.register('input', 'formenctype', 'formEncType');
      this.register('input', 'formmethod', 'formMethod');
      this.register('input', 'formnovalidate', 'formNoValidate');
      this.register('input', 'formtarget', 'formTarget');

      this.register('textarea', 'maxlength', 'maxLength');

      this.register('td', 'rowspan', 'rowSpan');
      this.register('td', 'colspan', 'colSpan');
      this.register('th', 'rowspan', 'rowSpan');
      this.register('th', 'colspan', 'colSpan');
    }

    AttributeMap.prototype.register = function register(elementName, attributeName, propertyName) {
      elementName = elementName.toLowerCase();
      attributeName = attributeName.toLowerCase();
      var element = this.elements[elementName] = this.elements[elementName] || Object.create(null);
      element[attributeName] = propertyName;
    };

    AttributeMap.prototype.registerUniversal = function registerUniversal(attributeName, propertyName) {
      attributeName = attributeName.toLowerCase();
      this.allElements[attributeName] = propertyName;
    };

    AttributeMap.prototype.map = function map(elementName, attributeName) {
      if (this.svg.isStandardSvgAttribute(elementName, attributeName)) {
        return attributeName;
      }
      elementName = elementName.toLowerCase();
      attributeName = attributeName.toLowerCase();
      var element = this.elements[elementName];
      if (element !== undefined && attributeName in element) {
        return element[attributeName];
      }
      if (attributeName in this.allElements) {
        return this.allElements[attributeName];
      }

      if (/(?:^data-)|(?:^aria-)|:/.test(attributeName)) {
        return attributeName;
      }
      return (0, _aureliaBinding.camelCase)(attributeName);
    };

    return AttributeMap;
  }(), _class.inject = [_aureliaBinding.SVGAnalyzer], _temp);

  var InterpolationBindingExpression = exports.InterpolationBindingExpression = function () {
    function InterpolationBindingExpression(observerLocator, targetProperty, parts, mode, lookupFunctions, attribute) {


      this.observerLocator = observerLocator;
      this.targetProperty = targetProperty;
      this.parts = parts;
      this.mode = mode;
      this.lookupFunctions = lookupFunctions;
      this.attribute = this.attrToRemove = attribute;
      this.discrete = false;
    }

    InterpolationBindingExpression.prototype.createBinding = function createBinding(target) {
      if (this.parts.length === 3) {
        return new ChildInterpolationBinding(target, this.observerLocator, this.parts[1], this.mode, this.lookupFunctions, this.targetProperty, this.parts[0], this.parts[2]);
      }
      return new InterpolationBinding(this.observerLocator, this.parts, target, this.targetProperty, this.mode, this.lookupFunctions);
    };

    return InterpolationBindingExpression;
  }();

  function validateTarget(target, propertyName) {
    if (propertyName === 'style') {
      LogManager.getLogger('templating-binding').info('Internet Explorer does not support interpolation in "style" attributes.  Use the style attribute\'s alias, "css" instead.');
    } else if (target.parentElement && target.parentElement.nodeName === 'TEXTAREA' && propertyName === 'textContent') {
      throw new Error('Interpolation binding cannot be used in the content of a textarea element.  Use <textarea value.bind="expression"></textarea> instead.');
    }
  }

  var InterpolationBinding = exports.InterpolationBinding = function () {
    function InterpolationBinding(observerLocator, parts, target, targetProperty, mode, lookupFunctions) {


      validateTarget(target, targetProperty);
      this.observerLocator = observerLocator;
      this.parts = parts;
      this.target = target;
      this.targetProperty = targetProperty;
      this.targetAccessor = observerLocator.getAccessor(target, targetProperty);
      this.mode = mode;
      this.lookupFunctions = lookupFunctions;
    }

    InterpolationBinding.prototype.interpolate = function interpolate() {
      if (this.isBound) {
        var value = '';
        var parts = this.parts;
        for (var i = 0, ii = parts.length; i < ii; i++) {
          value += i % 2 === 0 ? parts[i] : this['childBinding' + i].value;
        }
        this.targetAccessor.setValue(value, this.target, this.targetProperty);
      }
    };

    InterpolationBinding.prototype.updateOneTimeBindings = function updateOneTimeBindings() {
      for (var i = 1, ii = this.parts.length; i < ii; i += 2) {
        var child = this['childBinding' + i];
        if (child.mode === _aureliaBinding.bindingMode.oneTime) {
          child.call();
        }
      }
    };

    InterpolationBinding.prototype.bind = function bind(source) {
      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }
      this.source = source;

      var parts = this.parts;
      for (var i = 1, ii = parts.length; i < ii; i += 2) {
        var binding = new ChildInterpolationBinding(this, this.observerLocator, parts[i], this.mode, this.lookupFunctions);
        binding.bind(source);
        this['childBinding' + i] = binding;
      }

      this.isBound = true;
      this.interpolate();
    };

    InterpolationBinding.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      this.source = null;
      var parts = this.parts;
      for (var i = 1, ii = parts.length; i < ii; i += 2) {
        var name = 'childBinding' + i;
        this[name].unbind();
      }
    };

    return InterpolationBinding;
  }();

  var ChildInterpolationBinding = exports.ChildInterpolationBinding = (_dec = (0, _aureliaBinding.connectable)(), _dec(_class2 = function () {
    function ChildInterpolationBinding(target, observerLocator, sourceExpression, mode, lookupFunctions, targetProperty, left, right) {


      if (target instanceof InterpolationBinding) {
        this.parent = target;
      } else {
        validateTarget(target, targetProperty);
        this.target = target;
        this.targetProperty = targetProperty;
        this.targetAccessor = observerLocator.getAccessor(target, targetProperty);
      }
      this.observerLocator = observerLocator;
      this.sourceExpression = sourceExpression;
      this.mode = mode;
      this.lookupFunctions = lookupFunctions;
      this.left = left;
      this.right = right;
    }

    ChildInterpolationBinding.prototype.updateTarget = function updateTarget(value) {
      value = value === null || value === undefined ? '' : value.toString();
      if (value !== this.value) {
        this.value = value;
        if (this.parent) {
          this.parent.interpolate();
        } else {
          this.targetAccessor.setValue(this.left + value + this.right, this.target, this.targetProperty);
        }
      }
    };

    ChildInterpolationBinding.prototype.call = function call() {
      if (!this.isBound) {
        return;
      }

      this.rawValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      this.updateTarget(this.rawValue);

      if (this.mode !== _aureliaBinding.bindingMode.oneTime) {
        this._version++;
        this.sourceExpression.connect(this, this.source);
        if (this.rawValue instanceof Array) {
          this.observeArray(this.rawValue);
        }
        this.unobserve(false);
      }
    };

    ChildInterpolationBinding.prototype.bind = function bind(source) {
      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }
      this.isBound = true;
      this.source = source;

      var sourceExpression = this.sourceExpression;
      if (sourceExpression.bind) {
        sourceExpression.bind(this, source, this.lookupFunctions);
      }

      this.rawValue = sourceExpression.evaluate(source, this.lookupFunctions);
      this.updateTarget(this.rawValue);

      if (this.mode === _aureliaBinding.bindingMode.oneWay) {
        (0, _aureliaBinding.enqueueBindingConnect)(this);
      }
    };

    ChildInterpolationBinding.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      var sourceExpression = this.sourceExpression;
      if (sourceExpression.unbind) {
        sourceExpression.unbind(this, this.source);
      }
      this.source = null;
      this.value = null;
      this.rawValue = null;
      this.unobserve(true);
    };

    ChildInterpolationBinding.prototype.connect = function connect(evaluate) {
      if (!this.isBound) {
        return;
      }
      if (evaluate) {
        this.rawValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
        this.updateTarget(this.rawValue);
      }
      this.sourceExpression.connect(this, this.source);
      if (this.rawValue instanceof Array) {
        this.observeArray(this.rawValue);
      }
    };

    return ChildInterpolationBinding;
  }()) || _class2);

  var LetExpression = exports.LetExpression = function () {
    function LetExpression(observerLocator, targetProperty, sourceExpression, lookupFunctions, toBindingContext) {


      this.observerLocator = observerLocator;
      this.sourceExpression = sourceExpression;
      this.targetProperty = targetProperty;
      this.lookupFunctions = lookupFunctions;
      this.toBindingContext = toBindingContext;
    }

    LetExpression.prototype.createBinding = function createBinding() {
      return new LetBinding(this.observerLocator, this.sourceExpression, this.targetProperty, this.lookupFunctions, this.toBindingContext);
    };

    return LetExpression;
  }();

  var LetBinding = exports.LetBinding = (_dec2 = (0, _aureliaBinding.connectable)(), _dec2(_class3 = function () {
    function LetBinding(observerLocator, sourceExpression, targetProperty, lookupFunctions, toBindingContext) {


      this.observerLocator = observerLocator;
      this.sourceExpression = sourceExpression;
      this.targetProperty = targetProperty;
      this.lookupFunctions = lookupFunctions;
      this.source = null;
      this.target = null;
      this.toBindingContext = toBindingContext;
    }

    LetBinding.prototype.updateTarget = function updateTarget() {
      var value = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      this.target[this.targetProperty] = value;
    };

    LetBinding.prototype.call = function call(context) {
      if (!this.isBound) {
        return;
      }
      if (context === _aureliaBinding.sourceContext) {
        this.updateTarget();
        return;
      }
      throw new Error('Unexpected call context ' + context);
    };

    LetBinding.prototype.bind = function bind(source) {
      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }

      this.isBound = true;
      this.source = source;
      this.target = this.toBindingContext ? source.bindingContext : source.overrideContext;

      if (this.sourceExpression.bind) {
        this.sourceExpression.bind(this, source, this.lookupFunctions);
      }

      (0, _aureliaBinding.enqueueBindingConnect)(this);
    };

    LetBinding.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      if (this.sourceExpression.unbind) {
        this.sourceExpression.unbind(this, this.source);
      }
      this.source = null;
      this.target = null;
      this.unobserve(true);
    };

    LetBinding.prototype.connect = function connect() {
      if (!this.isBound) {
        return;
      }
      this.updateTarget();
      this.sourceExpression.connect(this, this.source);
    };

    return LetBinding;
  }()) || _class3);

  var LetInterpolationBindingExpression = exports.LetInterpolationBindingExpression = function () {
    function LetInterpolationBindingExpression(observerLocator, targetProperty, parts, lookupFunctions, toBindingContext) {


      this.observerLocator = observerLocator;
      this.targetProperty = targetProperty;
      this.parts = parts;
      this.lookupFunctions = lookupFunctions;
      this.toBindingContext = toBindingContext;
    }

    LetInterpolationBindingExpression.prototype.createBinding = function createBinding() {
      return new LetInterpolationBinding(this.observerLocator, this.targetProperty, this.parts, this.lookupFunctions, this.toBindingContext);
    };

    return LetInterpolationBindingExpression;
  }();

  var LetInterpolationBinding = exports.LetInterpolationBinding = function () {
    function LetInterpolationBinding(observerLocator, targetProperty, parts, lookupFunctions, toBindingContext) {


      this.observerLocator = observerLocator;
      this.parts = parts;
      this.targetProperty = targetProperty;
      this.lookupFunctions = lookupFunctions;
      this.toBindingContext = toBindingContext;
      this.target = null;
    }

    LetInterpolationBinding.prototype.bind = function bind(source) {
      if (this.isBound) {
        if (this.source === source) {
          return;
        }
        this.unbind();
      }

      this.isBound = true;
      this.source = source;
      this.target = this.toBindingContext ? source.bindingContext : source.overrideContext;

      this.interpolationBinding = this.createInterpolationBinding();
      this.interpolationBinding.bind(source);
    };

    LetInterpolationBinding.prototype.unbind = function unbind() {
      if (!this.isBound) {
        return;
      }
      this.isBound = false;
      this.source = null;
      this.target = null;
      this.interpolationBinding.unbind();
      this.interpolationBinding = null;
    };

    LetInterpolationBinding.prototype.createInterpolationBinding = function createInterpolationBinding() {
      if (this.parts.length === 3) {
        return new ChildInterpolationBinding(this.target, this.observerLocator, this.parts[1], _aureliaBinding.bindingMode.oneWay, this.lookupFunctions, this.targetProperty, this.parts[0], this.parts[2]);
      }
      return new InterpolationBinding(this.observerLocator, this.parts, this.target, this.targetProperty, _aureliaBinding.bindingMode.oneWay, this.lookupFunctions);
    };

    return LetInterpolationBinding;
  }();

  var SyntaxInterpreter = exports.SyntaxInterpreter = (_temp2 = _class4 = function () {
    function SyntaxInterpreter(parser, observerLocator, eventManager, attributeMap) {


      this.parser = parser;
      this.observerLocator = observerLocator;
      this.eventManager = eventManager;
      this.attributeMap = attributeMap;
    }

    SyntaxInterpreter.prototype.interpret = function interpret(resources, element, info, existingInstruction, context) {
      if (info.command in this) {
        return this[info.command](resources, element, info, existingInstruction, context);
      }

      return this.handleUnknownCommand(resources, element, info, existingInstruction, context);
    };

    SyntaxInterpreter.prototype.handleUnknownCommand = function handleUnknownCommand(resources, element, info, existingInstruction, context) {
      LogManager.getLogger('templating-binding').warn('Unknown binding command.', info);
      return existingInstruction;
    };

    SyntaxInterpreter.prototype.determineDefaultBindingMode = function determineDefaultBindingMode(element, attrName, context) {
      var tagName = element.tagName.toLowerCase();

      if (tagName === 'input' && (attrName === 'value' || attrName === 'files') && element.type !== 'checkbox' && element.type !== 'radio' || tagName === 'input' && attrName === 'checked' && (element.type === 'checkbox' || element.type === 'radio') || (tagName === 'textarea' || tagName === 'select') && attrName === 'value' || (attrName === 'textcontent' || attrName === 'innerhtml') && element.contentEditable === 'true' || attrName === 'scrolltop' || attrName === 'scrollleft') {
        return _aureliaBinding.bindingMode.twoWay;
      }

      if (context && attrName in context.attributes && context.attributes[attrName] && context.attributes[attrName].defaultBindingMode >= _aureliaBinding.bindingMode.oneTime) {
        return context.attributes[attrName].defaultBindingMode;
      }

      return _aureliaBinding.bindingMode.oneWay;
    };

    SyntaxInterpreter.prototype.bind = function bind(resources, element, info, existingInstruction, context) {
      var instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);

      instruction.attributes[info.attrName] = new _aureliaBinding.BindingExpression(this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), info.defaultBindingMode === undefined || info.defaultBindingMode === null ? this.determineDefaultBindingMode(element, info.attrName, context) : info.defaultBindingMode, resources.lookupFunctions);

      return instruction;
    };

    SyntaxInterpreter.prototype.trigger = function trigger(resources, element, info) {
      return new _aureliaBinding.ListenerExpression(this.eventManager, info.attrName, this.parser.parse(info.attrValue), _aureliaBinding.delegationStrategy.none, true, resources.lookupFunctions);
    };

    SyntaxInterpreter.prototype.capture = function capture(resources, element, info) {
      return new _aureliaBinding.ListenerExpression(this.eventManager, info.attrName, this.parser.parse(info.attrValue), _aureliaBinding.delegationStrategy.capturing, true, resources.lookupFunctions);
    };

    SyntaxInterpreter.prototype.delegate = function delegate(resources, element, info) {
      return new _aureliaBinding.ListenerExpression(this.eventManager, info.attrName, this.parser.parse(info.attrValue), _aureliaBinding.delegationStrategy.bubbling, true, resources.lookupFunctions);
    };

    SyntaxInterpreter.prototype.call = function call(resources, element, info, existingInstruction) {
      var instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);

      instruction.attributes[info.attrName] = new _aureliaBinding.CallExpression(this.observerLocator, info.attrName, this.parser.parse(info.attrValue), resources.lookupFunctions);

      return instruction;
    };

    SyntaxInterpreter.prototype.options = function options(resources, element, info, existingInstruction, context) {
      var instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);
      var attrValue = info.attrValue;
      var language = this.language;
      var name = null;
      var target = '';
      var current = void 0;
      var i = void 0;
      var ii = void 0;
      var inString = false;
      var inEscape = false;
      var foundName = false;

      for (i = 0, ii = attrValue.length; i < ii; ++i) {
        current = attrValue[i];

        if (current === ';' && !inString) {
          if (!foundName) {
            name = this._getPrimaryPropertyName(resources, context);
          }
          info = language.inspectAttribute(resources, '?', name, target.trim());
          language.createAttributeInstruction(resources, element, info, instruction, context);

          if (!instruction.attributes[info.attrName]) {
            instruction.attributes[info.attrName] = info.attrValue;
          }

          target = '';
          name = null;
        } else if (current === ':' && name === null) {
          foundName = true;
          name = target.trim();
          target = '';
        } else if (current === '\\') {
          target += current;
          inEscape = true;
          continue;
        } else {
          target += current;

          if (name !== null && inEscape === false && current === '\'') {
            inString = !inString;
          }
        }

        inEscape = false;
      }

      if (!foundName) {
        name = this._getPrimaryPropertyName(resources, context);
      }

      if (name !== null) {
        info = language.inspectAttribute(resources, '?', name, target.trim());
        language.createAttributeInstruction(resources, element, info, instruction, context);

        if (!instruction.attributes[info.attrName]) {
          instruction.attributes[info.attrName] = info.attrValue;
        }
      }

      return instruction;
    };

    SyntaxInterpreter.prototype._getPrimaryPropertyName = function _getPrimaryPropertyName(resources, context) {
      var type = resources.getAttribute(context.attributeName);
      if (type && type.primaryProperty) {
        return type.primaryProperty.attribute;
      }
      return null;
    };

    SyntaxInterpreter.prototype['for'] = function _for(resources, element, info, existingInstruction) {
      var parts = void 0;
      var keyValue = void 0;
      var instruction = void 0;
      var attrValue = void 0;
      var isDestructuring = void 0;

      attrValue = info.attrValue;
      isDestructuring = attrValue.match(/^ *[[].+[\]]/);
      parts = isDestructuring ? attrValue.split('of ') : attrValue.split(' of ');

      if (parts.length !== 2) {
        throw new Error('Incorrect syntax for "for". The form is: "$local of $items" or "[$key, $value] of $items".');
      }

      instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);

      if (isDestructuring) {
        keyValue = parts[0].replace(/[[\]]/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
        instruction.attributes.key = keyValue[0];
        instruction.attributes.value = keyValue[1];
      } else {
        instruction.attributes.local = parts[0];
      }

      instruction.attributes.items = new _aureliaBinding.BindingExpression(this.observerLocator, 'items', this.parser.parse(parts[1]), _aureliaBinding.bindingMode.oneWay, resources.lookupFunctions);

      return instruction;
    };

    SyntaxInterpreter.prototype['two-way'] = function twoWay(resources, element, info, existingInstruction) {
      var instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);

      instruction.attributes[info.attrName] = new _aureliaBinding.BindingExpression(this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), _aureliaBinding.bindingMode.twoWay, resources.lookupFunctions);

      return instruction;
    };

    SyntaxInterpreter.prototype['to-view'] = function toView(resources, element, info, existingInstruction) {
      var instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);

      instruction.attributes[info.attrName] = new _aureliaBinding.BindingExpression(this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), _aureliaBinding.bindingMode.toView, resources.lookupFunctions);

      return instruction;
    };

    SyntaxInterpreter.prototype['from-view'] = function fromView(resources, element, info, existingInstruction) {
      var instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);

      instruction.attributes[info.attrName] = new _aureliaBinding.BindingExpression(this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), _aureliaBinding.bindingMode.fromView, resources.lookupFunctions);

      return instruction;
    };

    SyntaxInterpreter.prototype['one-time'] = function oneTime(resources, element, info, existingInstruction) {
      var instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(info.attrName);

      instruction.attributes[info.attrName] = new _aureliaBinding.BindingExpression(this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), _aureliaBinding.bindingMode.oneTime, resources.lookupFunctions);

      return instruction;
    };

    return SyntaxInterpreter;
  }(), _class4.inject = [_aureliaBinding.Parser, _aureliaBinding.ObserverLocator, _aureliaBinding.EventManager, AttributeMap], _temp2);


  SyntaxInterpreter.prototype['one-way'] = SyntaxInterpreter.prototype['to-view'];

  var info = {};

  var TemplatingBindingLanguage = exports.TemplatingBindingLanguage = (_temp3 = _class5 = function (_BindingLanguage) {
    _inherits(TemplatingBindingLanguage, _BindingLanguage);

    function TemplatingBindingLanguage(parser, observerLocator, syntaxInterpreter, attributeMap) {


      var _this = _possibleConstructorReturn(this, _BindingLanguage.call(this));

      _this.parser = parser;
      _this.observerLocator = observerLocator;
      _this.syntaxInterpreter = syntaxInterpreter;
      _this.emptyStringExpression = _this.parser.parse('\'\'');
      syntaxInterpreter.language = _this;
      _this.attributeMap = attributeMap;
      _this.toBindingContextAttr = 'to-binding-context';
      return _this;
    }

    TemplatingBindingLanguage.prototype.inspectAttribute = function inspectAttribute(resources, elementName, attrName, attrValue) {
      var parts = attrName.split('.');

      info.defaultBindingMode = null;

      if (parts.length === 2) {
        info.attrName = parts[0].trim();
        info.attrValue = attrValue;
        info.command = parts[1].trim();

        if (info.command === 'ref') {
          info.expression = new _aureliaBinding.NameExpression(this.parser.parse(attrValue), info.attrName, resources.lookupFunctions);
          info.command = null;
          info.attrName = 'ref';
        } else {
          info.expression = null;
        }
      } else if (attrName === 'ref') {
        info.attrName = attrName;
        info.attrValue = attrValue;
        info.command = null;
        info.expression = new _aureliaBinding.NameExpression(this.parser.parse(attrValue), 'element', resources.lookupFunctions);
      } else {
        info.attrName = attrName;
        info.attrValue = attrValue;
        info.command = null;
        var interpolationParts = this.parseInterpolation(resources, attrValue);
        if (interpolationParts === null) {
          info.expression = null;
        } else {
          info.expression = new InterpolationBindingExpression(this.observerLocator, this.attributeMap.map(elementName, attrName), interpolationParts, _aureliaBinding.bindingMode.oneWay, resources.lookupFunctions, attrName);
        }
      }

      return info;
    };

    TemplatingBindingLanguage.prototype.createAttributeInstruction = function createAttributeInstruction(resources, element, theInfo, existingInstruction, context) {
      var instruction = void 0;

      if (theInfo.expression) {
        if (theInfo.attrName === 'ref') {
          return theInfo.expression;
        }

        instruction = existingInstruction || _aureliaTemplating.BehaviorInstruction.attribute(theInfo.attrName);
        instruction.attributes[theInfo.attrName] = theInfo.expression;
      } else if (theInfo.command) {
        instruction = this.syntaxInterpreter.interpret(resources, element, theInfo, existingInstruction, context);
      }

      return instruction;
    };

    TemplatingBindingLanguage.prototype.createLetExpressions = function createLetExpressions(resources, letElement) {
      var expressions = [];
      var attributes = letElement.attributes;

      var attr = void 0;

      var parts = void 0;
      var attrName = void 0;
      var attrValue = void 0;
      var command = void 0;
      var toBindingContextAttr = this.toBindingContextAttr;
      var toBindingContext = letElement.hasAttribute(toBindingContextAttr);
      for (var i = 0, ii = attributes.length; ii > i; ++i) {
        attr = attributes[i];
        attrName = attr.name;
        attrValue = attr.nodeValue;
        parts = attrName.split('.');

        if (attrName === toBindingContextAttr) {
          continue;
        }

        if (parts.length === 2) {
          command = parts[1];
          if (command !== 'bind') {
            LogManager.getLogger('templating-binding-language').warn('Detected invalid let command. Expected "' + parts[0] + '.bind", given "' + attrName + '"');
            continue;
          }
          expressions.push(new LetExpression(this.observerLocator, (0, _aureliaBinding.camelCase)(parts[0]), this.parser.parse(attrValue), resources.lookupFunctions, toBindingContext));
        } else {
          attrName = (0, _aureliaBinding.camelCase)(attrName);
          parts = this.parseInterpolation(resources, attrValue);
          if (parts === null) {
            LogManager.getLogger('templating-binding-language').warn('Detected string literal in let bindings. Did you mean "' + attrName + '.bind=' + attrValue + '" or "' + attrName + '=${' + attrValue + '}" ?');
          }
          if (parts) {
            expressions.push(new LetInterpolationBindingExpression(this.observerLocator, attrName, parts, resources.lookupFunctions, toBindingContext));
          } else {
            expressions.push(new LetExpression(this.observerLocator, attrName, new _aureliaBinding.LiteralString(attrValue), resources.lookupFunctions, toBindingContext));
          }
        }
      }
      return expressions;
    };

    TemplatingBindingLanguage.prototype.inspectTextContent = function inspectTextContent(resources, value) {
      var parts = this.parseInterpolation(resources, value);
      if (parts === null) {
        return null;
      }
      return new InterpolationBindingExpression(this.observerLocator, 'textContent', parts, _aureliaBinding.bindingMode.oneWay, resources.lookupFunctions, 'textContent');
    };

    TemplatingBindingLanguage.prototype.parseInterpolation = function parseInterpolation(resources, value) {
      var i = value.indexOf('${', 0);
      var ii = value.length;
      var char = void 0;
      var pos = 0;
      var open = 0;
      var quote = null;
      var interpolationStart = void 0;
      var parts = void 0;
      var partIndex = 0;

      while (i >= 0 && i < ii - 2) {
        open = 1;
        interpolationStart = i;
        i += 2;

        do {
          char = value[i];
          i++;

          if (char === "'" || char === '"') {
            if (quote === null) {
              quote = char;
            } else if (quote === char) {
              quote = null;
            }
            continue;
          }

          if (char === '\\') {
            i++;
            continue;
          }

          if (quote !== null) {
            continue;
          }

          if (char === '{') {
            open++;
          } else if (char === '}') {
            open--;
          }
        } while (open > 0 && i < ii);

        if (open === 0) {
          parts = parts || [];
          if (value[interpolationStart - 1] === '\\' && value[interpolationStart - 2] !== '\\') {
            parts[partIndex] = value.substring(pos, interpolationStart - 1) + value.substring(interpolationStart, i);
            partIndex++;
            parts[partIndex] = this.emptyStringExpression;
            partIndex++;
          } else {
            parts[partIndex] = value.substring(pos, interpolationStart);
            partIndex++;
            parts[partIndex] = this.parser.parse(value.substring(interpolationStart + 2, i - 1));
            partIndex++;
          }
          pos = i;
          i = value.indexOf('${', i);
        } else {
          break;
        }
      }

      if (partIndex === 0) {
        return null;
      }

      parts[partIndex] = value.substr(pos);
      return parts;
    };

    return TemplatingBindingLanguage;
  }(_aureliaTemplating.BindingLanguage), _class5.inject = [_aureliaBinding.Parser, _aureliaBinding.ObserverLocator, SyntaxInterpreter, AttributeMap], _temp3);
  function configure(config) {
    config.container.registerSingleton(_aureliaTemplating.BindingLanguage, TemplatingBindingLanguage);
    config.container.registerAlias(_aureliaTemplating.BindingLanguage, TemplatingBindingLanguage);
  }
});;define('aurelia-templating-binding', ['aurelia-templating-binding/aurelia-templating-binding'], function (main) { return main; });

define('text',{});
define('aurelia-templating-resources/aurelia-templating-resources',['exports', 'aurelia-dependency-injection', 'aurelia-pal', 'aurelia-task-queue', 'aurelia-templating', 'aurelia-binding', 'aurelia-logging', 'aurelia-loader', 'aurelia-path', 'aurelia-metadata'], function (exports, aureliaDependencyInjection, aureliaPal, aureliaTaskQueue, aureliaTemplating, aureliaBinding, aureliaLogging, aureliaLoader, aureliaPath, aureliaMetadata) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    var ActivationStrategy;
    (function (ActivationStrategy) {
        ActivationStrategy["InvokeLifecycle"] = "invoke-lifecycle";
        ActivationStrategy["Replace"] = "replace";
    })(ActivationStrategy || (ActivationStrategy = {}));
    var Compose = (function () {
        function Compose(element, container, compositionEngine, viewSlot, viewResources, taskQueue) {
            this.activationStrategy = ActivationStrategy.InvokeLifecycle;
            this.element = element;
            this.container = container;
            this.compositionEngine = compositionEngine;
            this.viewSlot = viewSlot;
            this.viewResources = viewResources;
            this.taskQueue = taskQueue;
            this.currentController = null;
            this.currentViewModel = null;
            this.changes = Object.create(null);
        }
        Compose.inject = function () {
            return [aureliaPal.DOM.Element, aureliaDependencyInjection.Container, aureliaTemplating.CompositionEngine, aureliaTemplating.ViewSlot, aureliaTemplating.ViewResources, aureliaTaskQueue.TaskQueue];
        };
        Compose.prototype.created = function (owningView) {
            this.owningView = owningView;
        };
        Compose.prototype.bind = function (bindingContext, overrideContext) {
            this.bindingContext = bindingContext;
            this.overrideContext = overrideContext;
            var changes = this.changes;
            changes.view = this.view;
            changes.viewModel = this.viewModel;
            changes.model = this.model;
            if (!this.pendingTask) {
                processChanges(this);
            }
        };
        Compose.prototype.unbind = function () {
            this.changes = Object.create(null);
            this.bindingContext = null;
            this.overrideContext = null;
            var returnToCache = true;
            var skipAnimation = true;
            this.viewSlot.removeAll(returnToCache, skipAnimation);
        };
        Compose.prototype.modelChanged = function (newValue, oldValue) {
            this.changes.model = newValue;
            requestUpdate(this);
        };
        Compose.prototype.viewChanged = function (newValue, oldValue) {
            this.changes.view = newValue;
            requestUpdate(this);
        };
        Compose.prototype.viewModelChanged = function (newValue, oldValue) {
            this.changes.viewModel = newValue;
            requestUpdate(this);
        };
        __decorate([
            aureliaTemplating.bindable
        ], Compose.prototype, "model", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], Compose.prototype, "view", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], Compose.prototype, "viewModel", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], Compose.prototype, "activationStrategy", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], Compose.prototype, "swapOrder", void 0);
        Compose = __decorate([
            aureliaTemplating.noView,
            aureliaTemplating.customElement('compose')
        ], Compose);
        return Compose;
    }());
    function isEmpty(obj) {
        for (var _ in obj) {
            return false;
        }
        return true;
    }
    function tryActivateViewModel(vm, model) {
        if (vm && typeof vm.activate === 'function') {
            return Promise.resolve(vm.activate(model));
        }
    }
    function createInstruction(composer, instruction) {
        return Object.assign(instruction, {
            bindingContext: composer.bindingContext,
            overrideContext: composer.overrideContext,
            owningView: composer.owningView,
            container: composer.container,
            viewSlot: composer.viewSlot,
            viewResources: composer.viewResources,
            currentController: composer.currentController,
            host: composer.element,
            swapOrder: composer.swapOrder
        });
    }
    function processChanges(composer) {
        var changes = composer.changes;
        composer.changes = Object.create(null);
        if (needsReInitialization(composer, changes)) {
            var instruction = {
                view: composer.view,
                viewModel: composer.currentViewModel || composer.viewModel,
                model: composer.model
            };
            instruction = Object.assign(instruction, changes);
            instruction = createInstruction(composer, instruction);
            composer.pendingTask = composer.compositionEngine.compose(instruction).then(function (controller) {
                composer.currentController = controller;
                composer.currentViewModel = controller ? controller.viewModel : null;
            });
        }
        else {
            composer.pendingTask = tryActivateViewModel(composer.currentViewModel, changes.model);
            if (!composer.pendingTask) {
                return;
            }
        }
        composer.pendingTask = composer.pendingTask
            .then(function () {
            completeCompositionTask(composer);
        }, function (reason) {
            completeCompositionTask(composer);
            throw reason;
        });
    }
    function completeCompositionTask(composer) {
        composer.pendingTask = null;
        if (!isEmpty(composer.changes)) {
            processChanges(composer);
        }
    }
    function requestUpdate(composer) {
        if (composer.pendingTask || composer.updateRequested) {
            return;
        }
        composer.updateRequested = true;
        composer.taskQueue.queueMicroTask(function () {
            composer.updateRequested = false;
            processChanges(composer);
        });
    }
    function needsReInitialization(composer, changes) {
        var activationStrategy = composer.activationStrategy;
        var vm = composer.currentViewModel;
        if (vm && typeof vm.determineActivationStrategy === 'function') {
            activationStrategy = vm.determineActivationStrategy();
        }
        return 'view' in changes
            || 'viewModel' in changes
            || activationStrategy === ActivationStrategy.Replace;
    }

    var IfCore = (function () {
        function IfCore(viewFactory, viewSlot) {
            this.viewFactory = viewFactory;
            this.viewSlot = viewSlot;
            this.view = null;
            this.bindingContext = null;
            this.overrideContext = null;
            this.showing = false;
            this.cache = true;
        }
        IfCore.prototype.bind = function (bindingContext, overrideContext) {
            this.bindingContext = bindingContext;
            this.overrideContext = overrideContext;
        };
        IfCore.prototype.unbind = function () {
            if (this.view === null) {
                return;
            }
            this.view.unbind();
            if (!this.viewFactory.isCaching) {
                return;
            }
            if (this.showing) {
                this.showing = false;
                this.viewSlot.remove(this.view, true, true);
            }
            else {
                this.view.returnToCache();
            }
            this.view = null;
        };
        IfCore.prototype._show = function () {
            if (this.showing) {
                if (!this.view.isBound) {
                    this.view.bind(this.bindingContext, this.overrideContext);
                }
                return;
            }
            if (this.view === null) {
                this.view = this.viewFactory.create();
            }
            if (!this.view.isBound) {
                this.view.bind(this.bindingContext, this.overrideContext);
            }
            this.showing = true;
            return this.viewSlot.add(this.view);
        };
        IfCore.prototype._hide = function () {
            var _this = this;
            if (!this.showing) {
                return;
            }
            this.showing = false;
            var removed = this.viewSlot.remove(this.view);
            if (removed instanceof Promise) {
                return removed.then(function () {
                    _this._unbindView();
                });
            }
            this._unbindView();
        };
        IfCore.prototype._unbindView = function () {
            var cache = this.cache === 'false' ? false : !!this.cache;
            this.view.unbind();
            if (!cache) {
                this.view = null;
            }
        };
        return IfCore;
    }());

    var If = (function (_super) {
        __extends(If, _super);
        function If() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.cache = true;
            return _this;
        }
        If.prototype.bind = function (bindingContext, overrideContext) {
            _super.prototype.bind.call(this, bindingContext, overrideContext);
            if (this.condition) {
                this._show();
            }
            else {
                this._hide();
            }
        };
        If.prototype.conditionChanged = function (newValue) {
            this._update(newValue);
        };
        If.prototype._update = function (show) {
            var _this = this;
            if (this.animating) {
                return;
            }
            var promise;
            if (this.elseVm) {
                promise = show ? this._swap(this.elseVm, this) : this._swap(this, this.elseVm);
            }
            else {
                promise = show ? this._show() : this._hide();
            }
            if (promise) {
                this.animating = true;
                promise.then(function () {
                    _this.animating = false;
                    if (_this.condition !== _this.showing) {
                        _this._update(_this.condition);
                    }
                });
            }
        };
        If.prototype._swap = function (remove, add) {
            switch (this.swapOrder) {
                case 'before':
                    return Promise.resolve(add._show()).then(function () { return remove._hide(); });
                case 'with':
                    return Promise.all([remove._hide(), add._show()]);
                default:
                    var promise = remove._hide();
                    return promise ? promise.then(function () { return add._show(); }) : add._show();
            }
        };
        __decorate([
            aureliaTemplating.bindable({ primaryProperty: true })
        ], If.prototype, "condition", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], If.prototype, "swapOrder", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], If.prototype, "cache", void 0);
        If = __decorate([
            aureliaTemplating.customAttribute('if'),
            aureliaTemplating.templateController,
            aureliaDependencyInjection.inject(aureliaTemplating.BoundViewFactory, aureliaTemplating.ViewSlot)
        ], If);
        return If;
    }(IfCore));

    var Else = (function (_super) {
        __extends(Else, _super);
        function Else(viewFactory, viewSlot) {
            var _this = _super.call(this, viewFactory, viewSlot) || this;
            _this._registerInIf();
            return _this;
        }
        Else.prototype.bind = function (bindingContext, overrideContext) {
            _super.prototype.bind.call(this, bindingContext, overrideContext);
            if (this.ifVm.condition) {
                this._hide();
            }
            else {
                this._show();
            }
        };
        Else.prototype._registerInIf = function () {
            var previous = this.viewSlot.anchor.previousSibling;
            while (previous && !previous.au) {
                previous = previous.previousSibling;
            }
            if (!previous || !previous.au.if) {
                throw new Error("Can't find matching If for Else custom attribute.");
            }
            this.ifVm = previous.au.if.viewModel;
            this.ifVm.elseVm = this;
        };
        Else = __decorate([
            aureliaTemplating.customAttribute('else'),
            aureliaTemplating.templateController,
            aureliaDependencyInjection.inject(aureliaTemplating.BoundViewFactory, aureliaTemplating.ViewSlot)
        ], Else);
        return Else;
    }(IfCore));

    var With = (function () {
        function With(viewFactory, viewSlot) {
            this.viewFactory = viewFactory;
            this.viewSlot = viewSlot;
            this.parentOverrideContext = null;
            this.view = null;
        }
        With.prototype.bind = function (bindingContext, overrideContext) {
            this.parentOverrideContext = overrideContext;
            this.valueChanged(this.value);
        };
        With.prototype.valueChanged = function (newValue) {
            var overrideContext = aureliaBinding.createOverrideContext(newValue, this.parentOverrideContext);
            var view = this.view;
            if (!view) {
                view = this.view = this.viewFactory.create();
                view.bind(newValue, overrideContext);
                this.viewSlot.add(view);
            }
            else {
                view.bind(newValue, overrideContext);
            }
        };
        With.prototype.unbind = function () {
            var view = this.view;
            this.parentOverrideContext = null;
            if (view) {
                view.unbind();
            }
        };
        With = __decorate([
            aureliaTemplating.customAttribute('with'),
            aureliaTemplating.templateController,
            aureliaDependencyInjection.inject(aureliaTemplating.BoundViewFactory, aureliaTemplating.ViewSlot)
        ], With);
        return With;
    }());

    var oneTime = aureliaBinding.bindingMode.oneTime;
    function updateOverrideContexts(views, startIndex) {
        var length = views.length;
        if (startIndex > 0) {
            startIndex = startIndex - 1;
        }
        for (; startIndex < length; ++startIndex) {
            updateOverrideContext(views[startIndex].overrideContext, startIndex, length);
        }
    }
    function createFullOverrideContext(repeat, data, index, length, key) {
        var bindingContext = {};
        var overrideContext = aureliaBinding.createOverrideContext(bindingContext, repeat.scope.overrideContext);
        if (typeof key !== 'undefined') {
            bindingContext[repeat.key] = key;
            bindingContext[repeat.value] = data;
        }
        else {
            bindingContext[repeat.local] = data;
        }
        updateOverrideContext(overrideContext, index, length);
        return overrideContext;
    }
    function updateOverrideContext(overrideContext, index, length) {
        var first = (index === 0);
        var last = (index === length - 1);
        var even = index % 2 === 0;
        overrideContext.$index = index;
        overrideContext.$first = first;
        overrideContext.$last = last;
        overrideContext.$middle = !(first || last);
        overrideContext.$odd = !even;
        overrideContext.$even = even;
    }
    function getItemsSourceExpression(instruction, attrName) {
        return instruction.behaviorInstructions
            .filter(function (bi) { return bi.originalAttrName === attrName; })[0]
            .attributes
            .items
            .sourceExpression;
    }
    function unwrapExpression(expression) {
        var unwrapped = false;
        while (expression instanceof aureliaBinding.BindingBehavior) {
            expression = expression.expression;
        }
        while (expression instanceof aureliaBinding.ValueConverter) {
            expression = expression.expression;
            unwrapped = true;
        }
        return unwrapped ? expression : null;
    }
    function isOneTime(expression) {
        while (expression instanceof aureliaBinding.BindingBehavior) {
            if (expression.name === 'oneTime') {
                return true;
            }
            expression = expression.expression;
        }
        return false;
    }
    function updateOneTimeBinding(binding) {
        if (binding.call && binding.mode === oneTime) {
            binding.call(aureliaBinding.sourceContext);
        }
        else if (binding.updateOneTimeBindings) {
            binding.updateOneTimeBindings();
        }
    }
    function indexOf(array, item, matcher, startIndex) {
        if (!matcher) {
            return array.indexOf(item);
        }
        var length = array.length;
        for (var index = startIndex || 0; index < length; index++) {
            if (matcher(array[index], item)) {
                return index;
            }
        }
        return -1;
    }

    var ArrayRepeatStrategy = (function () {
        function ArrayRepeatStrategy() {
        }
        ArrayRepeatStrategy.prototype.getCollectionObserver = function (observerLocator, items) {
            return observerLocator.getArrayObserver(items);
        };
        ArrayRepeatStrategy.prototype.instanceChanged = function (repeat, items) {
            var _this = this;
            var $repeat = repeat;
            var itemsLength = items.length;
            if (!items || itemsLength === 0) {
                $repeat.removeAllViews(true, !$repeat.viewsRequireLifecycle);
                return;
            }
            var children = $repeat.views();
            var viewsLength = children.length;
            if (viewsLength === 0) {
                this._standardProcessInstanceChanged($repeat, items);
                return;
            }
            if ($repeat.viewsRequireLifecycle) {
                var childrenSnapshot = children.slice(0);
                var itemNameInBindingContext = $repeat.local;
                var matcher_1 = $repeat.matcher();
                var itemsPreviouslyInViews_1 = [];
                var viewsToRemove = [];
                for (var index = 0; index < viewsLength; index++) {
                    var view = childrenSnapshot[index];
                    var oldItem = view.bindingContext[itemNameInBindingContext];
                    if (indexOf(items, oldItem, matcher_1) === -1) {
                        viewsToRemove.push(view);
                    }
                    else {
                        itemsPreviouslyInViews_1.push(oldItem);
                    }
                }
                var updateViews = void 0;
                var removePromise = void 0;
                if (itemsPreviouslyInViews_1.length > 0) {
                    removePromise = $repeat.removeViews(viewsToRemove, true, !$repeat.viewsRequireLifecycle);
                    updateViews = function () {
                        for (var index = 0; index < itemsLength; index++) {
                            var item = items[index];
                            var indexOfView = indexOf(itemsPreviouslyInViews_1, item, matcher_1, index);
                            var view = void 0;
                            if (indexOfView === -1) {
                                var overrideContext = createFullOverrideContext($repeat, items[index], index, itemsLength);
                                $repeat.insertView(index, overrideContext.bindingContext, overrideContext);
                                itemsPreviouslyInViews_1.splice(index, 0, undefined);
                            }
                            else if (indexOfView === index) {
                                view = children[indexOfView];
                                itemsPreviouslyInViews_1[indexOfView] = undefined;
                            }
                            else {
                                view = children[indexOfView];
                                $repeat.moveView(indexOfView, index);
                                itemsPreviouslyInViews_1.splice(indexOfView, 1);
                                itemsPreviouslyInViews_1.splice(index, 0, undefined);
                            }
                            if (view) {
                                updateOverrideContext(view.overrideContext, index, itemsLength);
                            }
                        }
                        _this._inPlaceProcessItems($repeat, items);
                    };
                }
                else {
                    removePromise = $repeat.removeAllViews(true, !$repeat.viewsRequireLifecycle);
                    updateViews = function () { return _this._standardProcessInstanceChanged($repeat, items); };
                }
                if (removePromise instanceof Promise) {
                    removePromise.then(updateViews);
                }
                else {
                    updateViews();
                }
            }
            else {
                this._inPlaceProcessItems($repeat, items);
            }
        };
        ArrayRepeatStrategy.prototype._standardProcessInstanceChanged = function (repeat, items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                var overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
                repeat.addView(overrideContext.bindingContext, overrideContext);
            }
        };
        ArrayRepeatStrategy.prototype._inPlaceProcessItems = function (repeat, items) {
            var itemsLength = items.length;
            var viewsLength = repeat.viewCount();
            while (viewsLength > itemsLength) {
                viewsLength--;
                repeat.removeView(viewsLength, true, !repeat.viewsRequireLifecycle);
            }
            var local = repeat.local;
            for (var i = 0; i < viewsLength; i++) {
                var view = repeat.view(i);
                var last = i === itemsLength - 1;
                var middle = i !== 0 && !last;
                var bindingContext = view.bindingContext;
                var overrideContext = view.overrideContext;
                if (bindingContext[local] === items[i]
                    && overrideContext.$middle === middle
                    && overrideContext.$last === last) {
                    continue;
                }
                bindingContext[local] = items[i];
                overrideContext.$middle = middle;
                overrideContext.$last = last;
                repeat.updateBindings(view);
            }
            for (var i = viewsLength; i < itemsLength; i++) {
                var overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
                repeat.addView(overrideContext.bindingContext, overrideContext);
            }
        };
        ArrayRepeatStrategy.prototype.instanceMutated = function (repeat, array, splices) {
            var _this = this;
            if (repeat.__queuedSplices) {
                for (var i = 0, ii = splices.length; i < ii; ++i) {
                    var _a = splices[i], index = _a.index, removed = _a.removed, addedCount = _a.addedCount;
                    aureliaBinding.mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
                }
                repeat.__array = array.slice(0);
                return;
            }
            var maybePromise = this._runSplices(repeat, array.slice(0), splices);
            if (maybePromise instanceof Promise) {
                var queuedSplices_1 = repeat.__queuedSplices = [];
                var runQueuedSplices_1 = function () {
                    if (!queuedSplices_1.length) {
                        repeat.__queuedSplices = undefined;
                        repeat.__array = undefined;
                        return;
                    }
                    var nextPromise = _this._runSplices(repeat, repeat.__array, queuedSplices_1) || Promise.resolve();
                    queuedSplices_1 = repeat.__queuedSplices = [];
                    nextPromise.then(runQueuedSplices_1);
                };
                maybePromise.then(runQueuedSplices_1);
            }
        };
        ArrayRepeatStrategy.prototype._runSplices = function (repeat, array, splices) {
            var _this = this;
            var removeDelta = 0;
            var rmPromises = [];
            for (var i = 0, ii = splices.length; i < ii; ++i) {
                var splice = splices[i];
                var removed = splice.removed;
                for (var j = 0, jj = removed.length; j < jj; ++j) {
                    var viewOrPromise = repeat.removeView(splice.index + removeDelta + rmPromises.length, true);
                    if (viewOrPromise instanceof Promise) {
                        rmPromises.push(viewOrPromise);
                    }
                }
                removeDelta -= splice.addedCount;
            }
            if (rmPromises.length > 0) {
                return Promise.all(rmPromises).then(function () {
                    var spliceIndexLow = _this._handleAddedSplices(repeat, array, splices);
                    updateOverrideContexts(repeat.views(), spliceIndexLow);
                });
            }
            var spliceIndexLow = this._handleAddedSplices(repeat, array, splices);
            updateOverrideContexts(repeat.views(), spliceIndexLow);
            return undefined;
        };
        ArrayRepeatStrategy.prototype._handleAddedSplices = function (repeat, array, splices) {
            var spliceIndex;
            var spliceIndexLow;
            var arrayLength = array.length;
            for (var i = 0, ii = splices.length; i < ii; ++i) {
                var splice = splices[i];
                var addIndex = spliceIndex = splice.index;
                var end = splice.index + splice.addedCount;
                if (typeof spliceIndexLow === 'undefined' || spliceIndexLow === null || spliceIndexLow > splice.index) {
                    spliceIndexLow = spliceIndex;
                }
                for (; addIndex < end; ++addIndex) {
                    var overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
                    repeat.insertView(addIndex, overrideContext.bindingContext, overrideContext);
                }
            }
            return spliceIndexLow;
        };
        return ArrayRepeatStrategy;
    }());

    var MapRepeatStrategy = (function () {
        function MapRepeatStrategy() {
        }
        MapRepeatStrategy.prototype.getCollectionObserver = function (observerLocator, items) {
            return observerLocator.getMapObserver(items);
        };
        MapRepeatStrategy.prototype.instanceChanged = function (repeat, items) {
            var _this = this;
            var removePromise = repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
            if (removePromise instanceof Promise) {
                removePromise.then(function () { return _this._standardProcessItems(repeat, items); });
                return;
            }
            this._standardProcessItems(repeat, items);
        };
        MapRepeatStrategy.prototype._standardProcessItems = function (repeat, items) {
            var index = 0;
            var overrideContext;
            items.forEach(function (value, key) {
                overrideContext = createFullOverrideContext(repeat, value, index, items.size, key);
                repeat.addView(overrideContext.bindingContext, overrideContext);
                ++index;
            });
        };
        MapRepeatStrategy.prototype.instanceMutated = function (repeat, map, records) {
            var key;
            var i;
            var ii;
            var overrideContext;
            var removeIndex;
            var addIndex;
            var record;
            var rmPromises = [];
            var viewOrPromise;
            for (i = 0, ii = records.length; i < ii; ++i) {
                record = records[i];
                key = record.key;
                switch (record.type) {
                    case 'update':
                        removeIndex = this._getViewIndexByKey(repeat, key);
                        viewOrPromise = repeat.removeView(removeIndex, true, !repeat.viewsRequireLifecycle);
                        if (viewOrPromise instanceof Promise) {
                            rmPromises.push(viewOrPromise);
                        }
                        overrideContext = createFullOverrideContext(repeat, map.get(key), removeIndex, map.size, key);
                        repeat.insertView(removeIndex, overrideContext.bindingContext, overrideContext);
                        break;
                    case 'add':
                        addIndex = repeat.viewCount() <= map.size - 1 ? repeat.viewCount() : map.size - 1;
                        overrideContext = createFullOverrideContext(repeat, map.get(key), addIndex, map.size, key);
                        repeat.insertView(map.size - 1, overrideContext.bindingContext, overrideContext);
                        break;
                    case 'delete':
                        if (record.oldValue === undefined) {
                            return;
                        }
                        removeIndex = this._getViewIndexByKey(repeat, key);
                        viewOrPromise = repeat.removeView(removeIndex, true, !repeat.viewsRequireLifecycle);
                        if (viewOrPromise instanceof Promise) {
                            rmPromises.push(viewOrPromise);
                        }
                        break;
                    case 'clear':
                        repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
                        break;
                    default:
                        continue;
                }
            }
            if (rmPromises.length > 0) {
                Promise.all(rmPromises).then(function () {
                    updateOverrideContexts(repeat.views(), 0);
                });
            }
            else {
                updateOverrideContexts(repeat.views(), 0);
            }
        };
        MapRepeatStrategy.prototype._getViewIndexByKey = function (repeat, key) {
            var i;
            var ii;
            var child;
            for (i = 0, ii = repeat.viewCount(); i < ii; ++i) {
                child = repeat.view(i);
                if (child.bindingContext[repeat.key] === key) {
                    return i;
                }
            }
            return undefined;
        };
        return MapRepeatStrategy;
    }());

    var NullRepeatStrategy = (function () {
        function NullRepeatStrategy() {
        }
        NullRepeatStrategy.prototype.instanceChanged = function (repeat, items) {
            repeat.removeAllViews(true);
        };
        NullRepeatStrategy.prototype.getCollectionObserver = function (observerLocator, items) {
        };
        return NullRepeatStrategy;
    }());

    var NumberRepeatStrategy = (function () {
        function NumberRepeatStrategy() {
        }
        NumberRepeatStrategy.prototype.getCollectionObserver = function () {
            return null;
        };
        NumberRepeatStrategy.prototype.instanceChanged = function (repeat, value) {
            var _this = this;
            var removePromise = repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
            if (removePromise instanceof Promise) {
                removePromise.then(function () { return _this._standardProcessItems(repeat, value); });
                return;
            }
            this._standardProcessItems(repeat, value);
        };
        NumberRepeatStrategy.prototype._standardProcessItems = function (repeat, value) {
            var childrenLength = repeat.viewCount();
            var i;
            var ii;
            var overrideContext;
            var viewsToRemove;
            value = Math.floor(value);
            viewsToRemove = childrenLength - value;
            if (viewsToRemove > 0) {
                if (viewsToRemove > childrenLength) {
                    viewsToRemove = childrenLength;
                }
                for (i = 0, ii = viewsToRemove; i < ii; ++i) {
                    repeat.removeView(childrenLength - (i + 1), true, !repeat.viewsRequireLifecycle);
                }
                return;
            }
            for (i = childrenLength, ii = value; i < ii; ++i) {
                overrideContext = createFullOverrideContext(repeat, i, i, ii);
                repeat.addView(overrideContext.bindingContext, overrideContext);
            }
            updateOverrideContexts(repeat.views(), 0);
        };
        return NumberRepeatStrategy;
    }());

    var SetRepeatStrategy = (function () {
        function SetRepeatStrategy() {
        }
        SetRepeatStrategy.prototype.getCollectionObserver = function (observerLocator, items) {
            return observerLocator.getSetObserver(items);
        };
        SetRepeatStrategy.prototype.instanceChanged = function (repeat, items) {
            var _this = this;
            var removePromise = repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
            if (removePromise instanceof Promise) {
                removePromise.then(function () { return _this._standardProcessItems(repeat, items); });
                return;
            }
            this._standardProcessItems(repeat, items);
        };
        SetRepeatStrategy.prototype._standardProcessItems = function (repeat, items) {
            var index = 0;
            var overrideContext;
            items.forEach(function (value) {
                overrideContext = createFullOverrideContext(repeat, value, index, items.size);
                repeat.addView(overrideContext.bindingContext, overrideContext);
                ++index;
            });
        };
        SetRepeatStrategy.prototype.instanceMutated = function (repeat, set, records) {
            var value;
            var i;
            var ii;
            var overrideContext;
            var removeIndex;
            var record;
            var rmPromises = [];
            var viewOrPromise;
            for (i = 0, ii = records.length; i < ii; ++i) {
                record = records[i];
                value = record.value;
                switch (record.type) {
                    case 'add':
                        var size = Math.max(set.size - 1, 0);
                        overrideContext = createFullOverrideContext(repeat, value, size, set.size);
                        repeat.insertView(size, overrideContext.bindingContext, overrideContext);
                        break;
                    case 'delete':
                        removeIndex = this._getViewIndexByValue(repeat, value);
                        viewOrPromise = repeat.removeView(removeIndex, true, !repeat.viewsRequireLifecycle);
                        if (viewOrPromise instanceof Promise) {
                            rmPromises.push(viewOrPromise);
                        }
                        break;
                    case 'clear':
                        repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
                        break;
                    default:
                        continue;
                }
            }
            if (rmPromises.length > 0) {
                Promise.all(rmPromises).then(function () {
                    updateOverrideContexts(repeat.views(), 0);
                });
            }
            else {
                updateOverrideContexts(repeat.views(), 0);
            }
        };
        SetRepeatStrategy.prototype._getViewIndexByValue = function (repeat, value) {
            var i;
            var ii;
            var child;
            for (i = 0, ii = repeat.viewCount(); i < ii; ++i) {
                child = repeat.view(i);
                if (child.bindingContext[repeat.local] === value) {
                    return i;
                }
            }
            return undefined;
        };
        return SetRepeatStrategy;
    }());

    var RepeatStrategyLocator = (function () {
        function RepeatStrategyLocator() {
            this.matchers = [];
            this.strategies = [];
            this.addStrategy(function (items) { return items === null || items === undefined; }, new NullRepeatStrategy());
            this.addStrategy(function (items) { return items instanceof Array; }, new ArrayRepeatStrategy());
            this.addStrategy(function (items) { return items instanceof Map; }, new MapRepeatStrategy());
            this.addStrategy(function (items) { return items instanceof Set; }, new SetRepeatStrategy());
            this.addStrategy(function (items) { return typeof items === 'number'; }, new NumberRepeatStrategy());
        }
        RepeatStrategyLocator.prototype.addStrategy = function (matcher, strategy) {
            this.matchers.push(matcher);
            this.strategies.push(strategy);
        };
        RepeatStrategyLocator.prototype.getStrategy = function (items) {
            var matchers = this.matchers;
            for (var i = 0, ii = matchers.length; i < ii; ++i) {
                if (matchers[i](items)) {
                    return this.strategies[i];
                }
            }
            return null;
        };
        return RepeatStrategyLocator;
    }());

    var lifecycleOptionalBehaviors = ['focus', 'if', 'else', 'repeat', 'show', 'hide', 'with'];
    function behaviorRequiresLifecycle(instruction) {
        var t = instruction.type;
        var name = t.elementName !== null ? t.elementName : t.attributeName;
        return lifecycleOptionalBehaviors.indexOf(name) === -1 && (t.handlesAttached || t.handlesBind || t.handlesCreated || t.handlesDetached || t.handlesUnbind)
            || t.viewFactory && viewsRequireLifecycle(t.viewFactory)
            || instruction.viewFactory && viewsRequireLifecycle(instruction.viewFactory);
    }
    function targetRequiresLifecycle(instruction) {
        var behaviors = instruction.behaviorInstructions;
        if (behaviors) {
            var i = behaviors.length;
            while (i--) {
                if (behaviorRequiresLifecycle(behaviors[i])) {
                    return true;
                }
            }
        }
        return instruction.viewFactory && viewsRequireLifecycle(instruction.viewFactory);
    }
    function viewsRequireLifecycle(viewFactory) {
        if ('_viewsRequireLifecycle' in viewFactory) {
            return viewFactory._viewsRequireLifecycle;
        }
        viewFactory._viewsRequireLifecycle = false;
        if (viewFactory.viewFactory) {
            viewFactory._viewsRequireLifecycle = viewsRequireLifecycle(viewFactory.viewFactory);
            return viewFactory._viewsRequireLifecycle;
        }
        if (viewFactory.template.querySelector('.au-animate')) {
            viewFactory._viewsRequireLifecycle = true;
            return true;
        }
        for (var id in viewFactory.instructions) {
            if (targetRequiresLifecycle(viewFactory.instructions[id])) {
                viewFactory._viewsRequireLifecycle = true;
                return true;
            }
        }
        viewFactory._viewsRequireLifecycle = false;
        return false;
    }

    var AbstractRepeater = (function () {
        function AbstractRepeater(options) {
            Object.assign(this, {
                local: 'items',
                viewsRequireLifecycle: true
            }, options);
        }
        AbstractRepeater.prototype.viewCount = function () {
            throw new Error('subclass must implement `viewCount`');
        };
        AbstractRepeater.prototype.views = function () {
            throw new Error('subclass must implement `views`');
        };
        AbstractRepeater.prototype.view = function (index) {
            throw new Error('subclass must implement `view`');
        };
        AbstractRepeater.prototype.matcher = function () {
            throw new Error('subclass must implement `matcher`');
        };
        AbstractRepeater.prototype.addView = function (bindingContext, overrideContext) {
            throw new Error('subclass must implement `addView`');
        };
        AbstractRepeater.prototype.insertView = function (index, bindingContext, overrideContext) {
            throw new Error('subclass must implement `insertView`');
        };
        AbstractRepeater.prototype.moveView = function (sourceIndex, targetIndex) {
            throw new Error('subclass must implement `moveView`');
        };
        AbstractRepeater.prototype.removeAllViews = function (returnToCache, skipAnimation) {
            throw new Error('subclass must implement `removeAllViews`');
        };
        AbstractRepeater.prototype.removeViews = function (viewsToRemove, returnToCache, skipAnimation) {
            throw new Error('subclass must implement `removeView`');
        };
        AbstractRepeater.prototype.removeView = function (index, returnToCache, skipAnimation) {
            throw new Error('subclass must implement `removeView`');
        };
        AbstractRepeater.prototype.updateBindings = function (view) {
            throw new Error('subclass must implement `updateBindings`');
        };
        return AbstractRepeater;
    }());

    var Repeat = (function (_super) {
        __extends(Repeat, _super);
        function Repeat(viewFactory, instruction, viewSlot, viewResources, observerLocator, strategyLocator) {
            var _this = _super.call(this, {
                local: 'item',
                viewsRequireLifecycle: viewsRequireLifecycle(viewFactory)
            }) || this;
            _this.viewFactory = viewFactory;
            _this.instruction = instruction;
            _this.viewSlot = viewSlot;
            _this.lookupFunctions = viewResources.lookupFunctions;
            _this.observerLocator = observerLocator;
            _this.key = 'key';
            _this.value = 'value';
            _this.strategyLocator = strategyLocator;
            _this.ignoreMutation = false;
            _this.sourceExpression = getItemsSourceExpression(_this.instruction, 'repeat.for');
            _this.isOneTime = isOneTime(_this.sourceExpression);
            _this.viewsRequireLifecycle = viewsRequireLifecycle(viewFactory);
            return _this;
        }
        Repeat_1 = Repeat;
        Repeat.prototype.call = function (context, changes) {
            this[context](this.items, changes);
        };
        Repeat.prototype.bind = function (bindingContext, overrideContext) {
            this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
            this.matcherBinding = this._captureAndRemoveMatcherBinding();
            this.itemsChanged();
        };
        Repeat.prototype.unbind = function () {
            this.scope = null;
            this.items = null;
            this.matcherBinding = null;
            this.viewSlot.removeAll(true, true);
            this._unsubscribeCollection();
        };
        Repeat.prototype._unsubscribeCollection = function () {
            if (this.collectionObserver) {
                this.collectionObserver.unsubscribe(this.callContext, this);
                this.collectionObserver = null;
                this.callContext = null;
            }
        };
        Repeat.prototype.itemsChanged = function () {
            var _this = this;
            this._unsubscribeCollection();
            if (!this.scope) {
                return;
            }
            var items = this.items;
            this.strategy = this.strategyLocator.getStrategy(items);
            if (!this.strategy) {
                throw new Error("Value for '" + this.sourceExpression + "' is non-repeatable");
            }
            if (!this.isOneTime && !this._observeInnerCollection()) {
                this._observeCollection();
            }
            this.ignoreMutation = true;
            this.strategy.instanceChanged(this, items);
            this.observerLocator.taskQueue.queueMicroTask(function () {
                _this.ignoreMutation = false;
            });
        };
        Repeat.prototype._getInnerCollection = function () {
            var expression = unwrapExpression(this.sourceExpression);
            if (!expression) {
                return null;
            }
            return expression.evaluate(this.scope, null);
        };
        Repeat.prototype.handleCollectionMutated = function (collection, changes) {
            if (!this.collectionObserver) {
                return;
            }
            if (this.ignoreMutation) {
                return;
            }
            this.strategy.instanceMutated(this, collection, changes);
        };
        Repeat.prototype.handleInnerCollectionMutated = function (collection, changes) {
            var _this = this;
            if (!this.collectionObserver) {
                return;
            }
            if (this.ignoreMutation) {
                return;
            }
            this.ignoreMutation = true;
            var newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
            this.observerLocator.taskQueue.queueMicroTask(function () { return _this.ignoreMutation = false; });
            if (newItems === this.items) {
                this.itemsChanged();
            }
            else {
                this.items = newItems;
            }
        };
        Repeat.prototype._observeInnerCollection = function () {
            var items = this._getInnerCollection();
            var strategy = this.strategyLocator.getStrategy(items);
            if (!strategy) {
                return false;
            }
            this.collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
            if (!this.collectionObserver) {
                return false;
            }
            this.callContext = 'handleInnerCollectionMutated';
            this.collectionObserver.subscribe(this.callContext, this);
            return true;
        };
        Repeat.prototype._observeCollection = function () {
            var items = this.items;
            this.collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, items);
            if (this.collectionObserver) {
                this.callContext = 'handleCollectionMutated';
                this.collectionObserver.subscribe(this.callContext, this);
            }
        };
        Repeat.prototype._captureAndRemoveMatcherBinding = function () {
            var viewFactory = this.viewFactory.viewFactory;
            if (viewFactory) {
                var template = viewFactory.template;
                var instructions = viewFactory.instructions;
                if (Repeat_1.useInnerMatcher) {
                    return extractMatcherBindingExpression(instructions);
                }
                if (template.children.length > 1) {
                    return undefined;
                }
                var repeatedElement = template.firstElementChild;
                if (!repeatedElement.hasAttribute('au-target-id')) {
                    return undefined;
                }
                var repeatedElementTargetId = repeatedElement.getAttribute('au-target-id');
                return extractMatcherBindingExpression(instructions, repeatedElementTargetId);
            }
            return undefined;
        };
        Repeat.prototype.viewCount = function () { return this.viewSlot.children.length; };
        Repeat.prototype.views = function () { return this.viewSlot.children; };
        Repeat.prototype.view = function (index) { return this.viewSlot.children[index]; };
        Repeat.prototype.matcher = function () {
            var matcherBinding = this.matcherBinding;
            return matcherBinding
                ? matcherBinding.sourceExpression.evaluate(this.scope, matcherBinding.lookupFunctions)
                : null;
        };
        Repeat.prototype.addView = function (bindingContext, overrideContext) {
            var view = this.viewFactory.create();
            view.bind(bindingContext, overrideContext);
            this.viewSlot.add(view);
        };
        Repeat.prototype.insertView = function (index, bindingContext, overrideContext) {
            var view = this.viewFactory.create();
            view.bind(bindingContext, overrideContext);
            this.viewSlot.insert(index, view);
        };
        Repeat.prototype.moveView = function (sourceIndex, targetIndex) {
            this.viewSlot.move(sourceIndex, targetIndex);
        };
        Repeat.prototype.removeAllViews = function (returnToCache, skipAnimation) {
            return this.viewSlot.removeAll(returnToCache, skipAnimation);
        };
        Repeat.prototype.removeViews = function (viewsToRemove, returnToCache, skipAnimation) {
            return this.viewSlot.removeMany(viewsToRemove, returnToCache, skipAnimation);
        };
        Repeat.prototype.removeView = function (index, returnToCache, skipAnimation) {
            return this.viewSlot.removeAt(index, returnToCache, skipAnimation);
        };
        Repeat.prototype.updateBindings = function (view) {
            var $view = view;
            var j = $view.bindings.length;
            while (j--) {
                updateOneTimeBinding($view.bindings[j]);
            }
            j = $view.controllers.length;
            while (j--) {
                var k = $view.controllers[j].boundProperties.length;
                while (k--) {
                    var binding = $view.controllers[j].boundProperties[k].binding;
                    updateOneTimeBinding(binding);
                }
            }
        };
        var Repeat_1;
        Repeat.useInnerMatcher = true;
        __decorate([
            aureliaTemplating.bindable
        ], Repeat.prototype, "items", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], Repeat.prototype, "local", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], Repeat.prototype, "key", void 0);
        __decorate([
            aureliaTemplating.bindable
        ], Repeat.prototype, "value", void 0);
        Repeat = Repeat_1 = __decorate([
            aureliaTemplating.customAttribute('repeat'),
            aureliaTemplating.templateController,
            aureliaDependencyInjection.inject(aureliaTemplating.BoundViewFactory, aureliaTemplating.TargetInstruction, aureliaTemplating.ViewSlot, aureliaTemplating.ViewResources, aureliaBinding.ObserverLocator, RepeatStrategyLocator)
        ], Repeat);
        return Repeat;
    }(AbstractRepeater));
    var extractMatcherBindingExpression = function (instructions, targetedElementId) {
        var instructionIds = Object.keys(instructions);
        for (var i = 0; i < instructionIds.length; i++) {
            var instructionId = instructionIds[i];
            if (targetedElementId !== undefined && instructionId !== targetedElementId) {
                continue;
            }
            var expressions = instructions[instructionId].expressions;
            if (expressions) {
                for (var ii = 0; ii < expressions.length; ii++) {
                    if (expressions[ii].targetProperty === 'matcher') {
                        var matcherBindingExpression = expressions[ii];
                        expressions.splice(ii, 1);
                        return matcherBindingExpression;
                    }
                }
            }
        }
    };

    var aureliaHideClassName = 'aurelia-hide';
    var aureliaHideClass = "." + aureliaHideClassName + " { display:none !important; }";
    function injectAureliaHideStyleAtHead() {
        aureliaPal.DOM.injectStyles(aureliaHideClass);
    }
    function injectAureliaHideStyleAtBoundary(domBoundary) {
        if (aureliaPal.FEATURE.shadowDOM && domBoundary && !domBoundary.hasAureliaHideStyle) {
            domBoundary.hasAureliaHideStyle = true;
            aureliaPal.DOM.injectStyles(aureliaHideClass, domBoundary);
        }
    }

    var Show = (function () {
        function Show(element, animator, domBoundary) {
            this.element = element;
            this.animator = animator;
            this.domBoundary = domBoundary;
        }
        Show.inject = function () {
            return [aureliaPal.DOM.Element, aureliaTemplating.Animator, aureliaDependencyInjection.Optional.of(aureliaPal.DOM.boundary, true)];
        };
        Show.prototype.created = function () {
            injectAureliaHideStyleAtBoundary(this.domBoundary);
        };
        Show.prototype.valueChanged = function (newValue) {
            var element = this.element;
            var animator = this.animator;
            if (newValue) {
                animator.removeClass(element, aureliaHideClassName);
            }
            else {
                animator.addClass(element, aureliaHideClassName);
            }
        };
        Show.prototype.bind = function (bindingContext) {
            this.valueChanged(this.value);
        };
        Show = __decorate([
            aureliaTemplating.customAttribute('show')
        ], Show);
        return Show;
    }());

    var Hide = (function () {
        function Hide(element, animator, domBoundary) {
            this.element = element;
            this.animator = animator;
            this.domBoundary = domBoundary;
        }
        Hide.inject = function () {
            return [aureliaPal.DOM.Element, aureliaTemplating.Animator, aureliaDependencyInjection.Optional.of(aureliaPal.DOM.boundary, true)];
        };
        Hide.prototype.created = function () {
            injectAureliaHideStyleAtBoundary(this.domBoundary);
        };
        Hide.prototype.valueChanged = function (newValue) {
            if (newValue) {
                this.animator.addClass(this.element, aureliaHideClassName);
            }
            else {
                this.animator.removeClass(this.element, aureliaHideClassName);
            }
        };
        Hide.prototype.bind = function (bindingContext) {
            this.valueChanged(this.value);
        };
        Hide.prototype.value = function (value) {
            throw new Error('Method not implemented.');
        };
        Hide = __decorate([
            aureliaTemplating.customAttribute('hide')
        ], Hide);
        return Hide;
    }());

    var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    var needsToWarn = true;
    var HTMLSanitizer = (function () {
        function HTMLSanitizer() {
        }
        HTMLSanitizer.prototype.sanitize = function (input) {
            if (needsToWarn) {
                needsToWarn = false;
                aureliaLogging.getLogger('html-sanitizer')
                    .warn("CAUTION: The default HTMLSanitizer does NOT provide security against a wide variety of sophisticated XSS attacks,\nand should not be relied on for sanitizing input from unknown sources.\nPlease see https://aurelia.io/docs/binding/basics#element-content for instructions on how to use a secure solution like DOMPurify or sanitize-html.");
            }
            return input.replace(SCRIPT_REGEX, '');
        };
        return HTMLSanitizer;
    }());

    var SanitizeHTMLValueConverter = (function () {
        function SanitizeHTMLValueConverter(sanitizer) {
            this.sanitizer = sanitizer;
        }
        SanitizeHTMLValueConverter.prototype.toView = function (untrustedMarkup) {
            if (untrustedMarkup === null || untrustedMarkup === undefined) {
                return null;
            }
            return this.sanitizer.sanitize(untrustedMarkup);
        };
        SanitizeHTMLValueConverter = __decorate([
            aureliaBinding.valueConverter('sanitizeHTML'),
            aureliaDependencyInjection.inject(HTMLSanitizer)
        ], SanitizeHTMLValueConverter);
        return SanitizeHTMLValueConverter;
    }());

    var Replaceable = (function () {
        function Replaceable(viewFactory, viewSlot) {
            this.viewFactory = viewFactory;
            this.viewSlot = viewSlot;
            this.view = null;
        }
        Replaceable.prototype.bind = function (bindingContext, overrideContext) {
            if (this.view === null) {
                this.view = this.viewFactory.create();
                this.viewSlot.add(this.view);
            }
            this.view.bind(bindingContext, overrideContext);
        };
        Replaceable.prototype.unbind = function () {
            this.view.unbind();
        };
        Replaceable = __decorate([
            aureliaTemplating.customAttribute('replaceable'),
            aureliaTemplating.templateController,
            aureliaDependencyInjection.inject(aureliaTemplating.BoundViewFactory, aureliaTemplating.ViewSlot)
        ], Replaceable);
        return Replaceable;
    }());

    var Focus = (function () {
        function Focus(element, taskQueue) {
            this.element = element;
            this.taskQueue = taskQueue;
            this.isAttached = false;
            this.needsApply = false;
        }
        Focus.inject = function () {
            return [aureliaPal.DOM.Element, aureliaTaskQueue.TaskQueue];
        };
        Focus.prototype.valueChanged = function (newValue) {
            if (this.isAttached) {
                this._apply();
            }
            else {
                this.needsApply = true;
            }
        };
        Focus.prototype._apply = function () {
            var _this = this;
            if (this.value) {
                this.taskQueue.queueMicroTask(function () {
                    if (_this.value) {
                        _this.element.focus();
                    }
                });
            }
            else {
                this.element.blur();
            }
        };
        Focus.prototype.attached = function () {
            this.isAttached = true;
            if (this.needsApply) {
                this.needsApply = false;
                this._apply();
            }
            this.element.addEventListener('focus', this);
            this.element.addEventListener('blur', this);
        };
        Focus.prototype.detached = function () {
            this.isAttached = false;
            this.element.removeEventListener('focus', this);
            this.element.removeEventListener('blur', this);
        };
        Focus.prototype.handleEvent = function (e) {
            if (e.type === 'focus') {
                this.value = true;
            }
            else if (aureliaPal.DOM.activeElement !== this.element) {
                this.value = false;
            }
        };
        Focus = __decorate([
            aureliaTemplating.customAttribute('focus', aureliaBinding.bindingMode.twoWay)
        ], Focus);
        return Focus;
    }());

    var cssUrlMatcher = /url\((?!['"]data)([^)]+)\)/gi;
    function fixupCSSUrls(address, css) {
        if (typeof css !== 'string') {
            throw new Error("Failed loading required CSS file: " + address);
        }
        return css.replace(cssUrlMatcher, function (match, p1) {
            var quote = p1.charAt(0);
            if (quote === '\'' || quote === '"') {
                p1 = p1.substr(1, p1.length - 2);
            }
            return 'url(\'' + aureliaPath.relativeToFile(p1, address) + '\')';
        });
    }
    var CSSResource = (function () {
        function CSSResource(address) {
            this.address = address;
            this._scoped = null;
            this._global = false;
            this._alreadyGloballyInjected = false;
        }
        CSSResource.prototype.initialize = function (container, Target) {
            this._scoped = new Target(this);
        };
        CSSResource.prototype.register = function (registry, name) {
            if (name === 'scoped') {
                registry.registerViewEngineHooks(this._scoped);
            }
            else {
                this._global = true;
            }
        };
        CSSResource.prototype.load = function (container) {
            var _this = this;
            return container.get(aureliaLoader.Loader)
                .loadText(this.address)
                .catch(function (err) { return null; })
                .then(function (text) {
                text = fixupCSSUrls(_this.address, text);
                _this._scoped.css = text;
                if (_this._global) {
                    _this._alreadyGloballyInjected = true;
                    aureliaPal.DOM.injectStyles(text);
                }
            });
        };
        return CSSResource;
    }());
    var CSSViewEngineHooks = (function () {
        function CSSViewEngineHooks(owner) {
            this.owner = owner;
            this.css = null;
        }
        CSSViewEngineHooks.prototype.beforeCompile = function (content, resources, instruction) {
            if (instruction.targetShadowDOM) {
                aureliaPal.DOM.injectStyles(this.css, content, true);
            }
            else if (aureliaPal.FEATURE.scopedCSS) {
                var styleNode = aureliaPal.DOM.injectStyles(this.css, content, true);
                styleNode.setAttribute('scoped', 'scoped');
            }
            else if (this._global && !this.owner._alreadyGloballyInjected) {
                aureliaPal.DOM.injectStyles(this.css);
                this.owner._alreadyGloballyInjected = true;
            }
        };
        return CSSViewEngineHooks;
    }());
    function _createCSSResource(address) {
        var ViewCSS = (function (_super) {
            __extends(ViewCSS, _super);
            function ViewCSS() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ViewCSS = __decorate([
                aureliaTemplating.resource(new CSSResource(address))
            ], ViewCSS);
            return ViewCSS;
        }(CSSViewEngineHooks));
        return ViewCSS;
    }

    var AttrBindingBehavior = (function () {
        function AttrBindingBehavior() {
        }
        AttrBindingBehavior.prototype.bind = function (binding, source) {
            binding.targetObserver = new aureliaBinding.DataAttributeObserver(binding.target, binding.targetProperty);
        };
        AttrBindingBehavior.prototype.unbind = function (binding, source) {
        };
        AttrBindingBehavior = __decorate([
            aureliaBinding.bindingBehavior('attr')
        ], AttrBindingBehavior);
        return AttrBindingBehavior;
    }());

    var modeBindingBehavior = {
        bind: function (binding, source, lookupFunctions) {
            binding.originalMode = binding.mode;
            binding.mode = this.mode;
        },
        unbind: function (binding, source) {
            binding.mode = binding.originalMode;
            binding.originalMode = null;
        }
    };
    var OneTimeBindingBehavior = (function () {
        function OneTimeBindingBehavior() {
            this.mode = aureliaBinding.bindingMode.oneTime;
        }
        OneTimeBindingBehavior = __decorate([
            aureliaMetadata.mixin(modeBindingBehavior),
            aureliaBinding.bindingBehavior('oneTime')
        ], OneTimeBindingBehavior);
        return OneTimeBindingBehavior;
    }());
    var OneWayBindingBehavior = (function () {
        function OneWayBindingBehavior() {
            this.mode = aureliaBinding.bindingMode.toView;
        }
        OneWayBindingBehavior = __decorate([
            aureliaMetadata.mixin(modeBindingBehavior),
            aureliaBinding.bindingBehavior('oneWay')
        ], OneWayBindingBehavior);
        return OneWayBindingBehavior;
    }());
    var ToViewBindingBehavior = (function () {
        function ToViewBindingBehavior() {
            this.mode = aureliaBinding.bindingMode.toView;
        }
        ToViewBindingBehavior = __decorate([
            aureliaMetadata.mixin(modeBindingBehavior),
            aureliaBinding.bindingBehavior('toView')
        ], ToViewBindingBehavior);
        return ToViewBindingBehavior;
    }());
    var FromViewBindingBehavior = (function () {
        function FromViewBindingBehavior() {
            this.mode = aureliaBinding.bindingMode.fromView;
        }
        FromViewBindingBehavior = __decorate([
            aureliaMetadata.mixin(modeBindingBehavior),
            aureliaBinding.bindingBehavior('fromView')
        ], FromViewBindingBehavior);
        return FromViewBindingBehavior;
    }());
    var TwoWayBindingBehavior = (function () {
        function TwoWayBindingBehavior() {
            this.mode = aureliaBinding.bindingMode.twoWay;
        }
        TwoWayBindingBehavior = __decorate([
            aureliaMetadata.mixin(modeBindingBehavior),
            aureliaBinding.bindingBehavior('twoWay')
        ], TwoWayBindingBehavior);
        return TwoWayBindingBehavior;
    }());

    function throttle(newValue) {
        var _this = this;
        var state = this.throttleState;
        var elapsed = +new Date() - state.last;
        if (elapsed >= state.delay) {
            clearTimeout(state.timeoutId);
            state.timeoutId = null;
            state.last = +new Date();
            this.throttledMethod(newValue);
            return;
        }
        state.newValue = newValue;
        if (state.timeoutId === null) {
            state.timeoutId = setTimeout(function () {
                state.timeoutId = null;
                state.last = +new Date();
                _this.throttledMethod(state.newValue);
            }, state.delay - elapsed);
        }
    }
    var ThrottleBindingBehavior = (function () {
        function ThrottleBindingBehavior() {
        }
        ThrottleBindingBehavior.prototype.bind = function (binding, source, delay) {
            if (delay === void 0) { delay = 200; }
            var methodToThrottle = 'updateTarget';
            if (binding.callSource) {
                methodToThrottle = 'callSource';
            }
            else if (binding.updateSource && binding.mode === aureliaBinding.bindingMode.twoWay) {
                methodToThrottle = 'updateSource';
            }
            binding.throttledMethod = binding[methodToThrottle];
            binding.throttledMethod.originalName = methodToThrottle;
            binding[methodToThrottle] = throttle;
            binding.throttleState = {
                delay: delay,
                last: 0,
                timeoutId: null
            };
        };
        ThrottleBindingBehavior.prototype.unbind = function (binding, source) {
            var methodToRestore = binding.throttledMethod.originalName;
            binding[methodToRestore] = binding.throttledMethod;
            binding.throttledMethod = null;
            clearTimeout(binding.throttleState.timeoutId);
            binding.throttleState = null;
        };
        ThrottleBindingBehavior = __decorate([
            aureliaBinding.bindingBehavior('throttle')
        ], ThrottleBindingBehavior);
        return ThrottleBindingBehavior;
    }());

    var unset = {};
    function debounceCallSource(event) {
        var _this = this;
        var state = this.debounceState;
        clearTimeout(state.timeoutId);
        state.timeoutId = setTimeout(function () { return _this.debouncedMethod(event); }, state.delay);
    }
    function debounceCall(context, newValue, oldValue) {
        var _this = this;
        var state = this.debounceState;
        clearTimeout(state.timeoutId);
        if (context !== state.callContextToDebounce) {
            state.oldValue = unset;
            this.debouncedMethod(context, newValue, oldValue);
            return;
        }
        if (state.oldValue === unset) {
            state.oldValue = oldValue;
        }
        state.timeoutId = setTimeout(function () {
            var _oldValue = state.oldValue;
            state.oldValue = unset;
            _this.debouncedMethod(context, newValue, _oldValue);
        }, state.delay);
    }
    var DebounceBindingBehavior = (function () {
        function DebounceBindingBehavior() {
        }
        DebounceBindingBehavior.prototype.bind = function (binding, source, delay) {
            if (delay === void 0) { delay = 200; }
            var isCallSource = binding.callSource !== undefined;
            var methodToDebounce = isCallSource ? 'callSource' : 'call';
            var debouncer = isCallSource ? debounceCallSource : debounceCall;
            var mode = binding.mode;
            var callContextToDebounce = mode === aureliaBinding.bindingMode.twoWay || mode === aureliaBinding.bindingMode.fromView ? aureliaBinding.targetContext : aureliaBinding.sourceContext;
            binding.debouncedMethod = binding[methodToDebounce];
            binding.debouncedMethod.originalName = methodToDebounce;
            binding[methodToDebounce] = debouncer;
            binding.debounceState = {
                callContextToDebounce: callContextToDebounce,
                delay: delay,
                timeoutId: 0,
                oldValue: unset
            };
        };
        DebounceBindingBehavior.prototype.unbind = function (binding, source) {
            var methodToRestore = binding.debouncedMethod.originalName;
            binding[methodToRestore] = binding.debouncedMethod;
            binding.debouncedMethod = null;
            clearTimeout(binding.debounceState.timeoutId);
            binding.debounceState = null;
        };
        DebounceBindingBehavior = __decorate([
            aureliaBinding.bindingBehavior('debounce')
        ], DebounceBindingBehavior);
        return DebounceBindingBehavior;
    }());

    function findOriginalEventTarget(event) {
        return (event.path && event.path[0]) || (event.deepPath && event.deepPath[0]) || event.target;
    }
    function handleSelfEvent(event) {
        var target = findOriginalEventTarget(event);
        if (this.target !== target) {
            return;
        }
        this.selfEventCallSource(event);
    }
    var SelfBindingBehavior = (function () {
        function SelfBindingBehavior() {
        }
        SelfBindingBehavior.prototype.bind = function (binding, source) {
            if (!binding.callSource || !binding.targetEvent) {
                throw new Error('Self binding behavior only supports event.');
            }
            binding.selfEventCallSource = binding.callSource;
            binding.callSource = handleSelfEvent;
        };
        SelfBindingBehavior.prototype.unbind = function (binding, source) {
            binding.callSource = binding.selfEventCallSource;
            binding.selfEventCallSource = null;
        };
        SelfBindingBehavior = __decorate([
            aureliaBinding.bindingBehavior('self')
        ], SelfBindingBehavior);
        return SelfBindingBehavior;
    }());

    var BindingSignaler = (function () {
        function BindingSignaler() {
            this.signals = {};
        }
        BindingSignaler.prototype.signal = function (name) {
            var bindings = this.signals[name];
            if (!bindings) {
                return;
            }
            var i = bindings.length;
            while (i--) {
                bindings[i].call(aureliaBinding.sourceContext);
            }
        };
        return BindingSignaler;
    }());

    var SignalBindingBehavior = (function () {
        function SignalBindingBehavior(bindingSignaler) {
            this.signals = bindingSignaler.signals;
        }
        SignalBindingBehavior.inject = function () { return [BindingSignaler]; };
        SignalBindingBehavior.prototype.bind = function (binding, source) {
            var names = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                names[_i - 2] = arguments[_i];
            }
            if (!binding.updateTarget) {
                throw new Error('Only property bindings and string interpolation bindings can be signaled.  Trigger, delegate and call bindings cannot be signaled.');
            }
            var signals = this.signals;
            if (names.length === 1) {
                var name_1 = names[0];
                var bindings = signals[name_1] || (signals[name_1] = []);
                bindings.push(binding);
                binding.signalName = name_1;
            }
            else if (names.length > 1) {
                var i = names.length;
                while (i--) {
                    var name_2 = names[i];
                    var bindings = signals[name_2] || (signals[name_2] = []);
                    bindings.push(binding);
                }
                binding.signalName = names;
            }
            else {
                throw new Error('Signal name is required.');
            }
        };
        SignalBindingBehavior.prototype.unbind = function (binding, source) {
            var signals = this.signals;
            var name = binding.signalName;
            binding.signalName = null;
            if (Array.isArray(name)) {
                var names = name;
                var i = names.length;
                while (i--) {
                    var n = names[i];
                    var bindings = signals[n];
                    bindings.splice(bindings.indexOf(binding), 1);
                }
            }
            else {
                var bindings = signals[name];
                bindings.splice(bindings.indexOf(binding), 1);
            }
        };
        SignalBindingBehavior = __decorate([
            aureliaBinding.bindingBehavior('signal')
        ], SignalBindingBehavior);
        return SignalBindingBehavior;
    }());

    var eventNamesRequired = 'The updateTrigger binding behavior requires at least one event name argument: eg <input value.bind="firstName & updateTrigger:\'blur\'">';
    var notApplicableMessage = 'The updateTrigger binding behavior can only be applied to two-way/ from-view bindings on input/select elements.';
    var UpdateTriggerBindingBehavior = (function () {
        function UpdateTriggerBindingBehavior() {
        }
        UpdateTriggerBindingBehavior.prototype.bind = function (binding, source) {
            var events = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                events[_i - 2] = arguments[_i];
            }
            if (events.length === 0) {
                throw new Error(eventNamesRequired);
            }
            if (binding.mode !== aureliaBinding.bindingMode.twoWay && binding.mode !== aureliaBinding.bindingMode.fromView) {
                throw new Error(notApplicableMessage);
            }
            var targetObserver = binding.observerLocator.getObserver(binding.target, binding.targetProperty);
            if (!targetObserver.handler) {
                throw new Error(notApplicableMessage);
            }
            binding.targetObserver = targetObserver;
            targetObserver.originalHandler = binding.targetObserver.handler;
            var handler = new aureliaBinding.EventSubscriber(events);
            targetObserver.handler = handler;
        };
        UpdateTriggerBindingBehavior.prototype.unbind = function (binding, source) {
            var targetObserver = binding.targetObserver;
            targetObserver.handler.dispose();
            targetObserver.handler = targetObserver.originalHandler;
            targetObserver.originalHandler = null;
        };
        UpdateTriggerBindingBehavior = __decorate([
            aureliaBinding.bindingBehavior('updateTrigger')
        ], UpdateTriggerBindingBehavior);
        return UpdateTriggerBindingBehavior;
    }());

    function _createDynamicElement(_a) {
        var name = _a.name, viewUrl = _a.viewUrl, bindableNames = _a.bindableNames, useShadowDOMmode = _a.useShadowDOMmode;
        var DynamicElement = (function () {
            function DynamicElement() {
            }
            DynamicElement.prototype.bind = function (bindingContext) {
                this.$parent = bindingContext;
            };
            DynamicElement = __decorate([
                aureliaTemplating.customElement(name),
                aureliaTemplating.useView(viewUrl)
            ], DynamicElement);
            return DynamicElement;
        }());
        for (var i = 0, ii = bindableNames.length; i < ii; ++i) {
            aureliaTemplating.bindable(bindableNames[i])(DynamicElement);
        }
        switch (useShadowDOMmode) {
            case 'open':
                aureliaTemplating.useShadowDOM({ mode: 'open' })(DynamicElement);
                break;
            case 'closed':
                aureliaTemplating.useShadowDOM({ mode: 'closed' })(DynamicElement);
                break;
            case '':
                aureliaTemplating.useShadowDOM(DynamicElement);
                break;
            case null:
                break;
            default:
                aureliaLogging.getLogger('aurelia-html-only-element')
                    .warn("Expected 'use-shadow-dom' value to be \"close\", \"open\" or \"\", received " + useShadowDOMmode);
                break;
        }
        return DynamicElement;
    }

    function getElementName(address) {
        return /([^\/^\?]+)\.html/i.exec(address)[1].toLowerCase();
    }
    function configure(config) {
        var viewEngine = config.container.get(aureliaTemplating.ViewEngine);
        var loader = config.aurelia.loader;
        viewEngine.addResourcePlugin('.html', {
            'fetch': function (viewUrl) {
                return loader.loadTemplate(viewUrl).then(function (registryEntry) {
                    var _a;
                    var bindableNames = registryEntry.template.getAttribute('bindable');
                    var useShadowDOMmode = registryEntry.template.getAttribute('use-shadow-dom');
                    var name = getElementName(viewUrl);
                    if (bindableNames) {
                        bindableNames = bindableNames.split(',').map(function (x) { return x.trim(); });
                        registryEntry.template.removeAttribute('bindable');
                    }
                    else {
                        bindableNames = [];
                    }
                    return _a = {}, _a[name] = _createDynamicElement({ name: name, viewUrl: viewUrl, bindableNames: bindableNames, useShadowDOMmode: useShadowDOMmode }), _a;
                });
            }
        });
    }

    function configure$1(config) {
        injectAureliaHideStyleAtHead();
        config.globalResources(Compose, If, Else, With, Repeat, Show, Hide, Replaceable, Focus, SanitizeHTMLValueConverter, OneTimeBindingBehavior, OneWayBindingBehavior, ToViewBindingBehavior, FromViewBindingBehavior, TwoWayBindingBehavior, ThrottleBindingBehavior, DebounceBindingBehavior, SelfBindingBehavior, SignalBindingBehavior, UpdateTriggerBindingBehavior, AttrBindingBehavior);
        configure(config);
        var viewEngine = config.container.get(aureliaTemplating.ViewEngine);
        var styleResourcePlugin = {
            fetch: function (address) {
                var _a;
                return _a = {}, _a[address] = _createCSSResource(address), _a;
            }
        };
        ['.css', '.less', '.sass', '.scss', '.styl'].forEach(function (ext) { return viewEngine.addResourcePlugin(ext, styleResourcePlugin); });
    }

    exports.AbstractRepeater = AbstractRepeater;
    exports.ArrayRepeatStrategy = ArrayRepeatStrategy;
    exports.AttrBindingBehavior = AttrBindingBehavior;
    exports.BindingSignaler = BindingSignaler;
    exports.Compose = Compose;
    exports.DebounceBindingBehavior = DebounceBindingBehavior;
    exports.Else = Else;
    exports.Focus = Focus;
    exports.FromViewBindingBehavior = FromViewBindingBehavior;
    exports.HTMLSanitizer = HTMLSanitizer;
    exports.Hide = Hide;
    exports.If = If;
    exports.MapRepeatStrategy = MapRepeatStrategy;
    exports.NullRepeatStrategy = NullRepeatStrategy;
    exports.NumberRepeatStrategy = NumberRepeatStrategy;
    exports.OneTimeBindingBehavior = OneTimeBindingBehavior;
    exports.OneWayBindingBehavior = OneWayBindingBehavior;
    exports.Repeat = Repeat;
    exports.RepeatStrategyLocator = RepeatStrategyLocator;
    exports.Replaceable = Replaceable;
    exports.SanitizeHTMLValueConverter = SanitizeHTMLValueConverter;
    exports.SelfBindingBehavior = SelfBindingBehavior;
    exports.SetRepeatStrategy = SetRepeatStrategy;
    exports.Show = Show;
    exports.SignalBindingBehavior = SignalBindingBehavior;
    exports.ThrottleBindingBehavior = ThrottleBindingBehavior;
    exports.ToViewBindingBehavior = ToViewBindingBehavior;
    exports.TwoWayBindingBehavior = TwoWayBindingBehavior;
    exports.UpdateTriggerBindingBehavior = UpdateTriggerBindingBehavior;
    exports.With = With;
    exports.configure = configure$1;
    exports.createFullOverrideContext = createFullOverrideContext;
    exports.getItemsSourceExpression = getItemsSourceExpression;
    exports.isOneTime = isOneTime;
    exports.unwrapExpression = unwrapExpression;
    exports.updateOneTimeBinding = updateOneTimeBinding;
    exports.updateOverrideContext = updateOverrideContext;
    exports.viewsRequireLifecycle = viewsRequireLifecycle;

    Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=aurelia-templating-resources.js.map
;define('aurelia-templating-resources', ['aurelia-templating-resources/aurelia-templating-resources'], function (main) { return main; });

define('aurelia-templating-router', ['exports', 'aurelia-router', 'aurelia-metadata', 'aurelia-path', 'aurelia-templating', 'aurelia-dependency-injection', 'aurelia-binding', 'aurelia-pal', 'aurelia-logging'], function (exports, aureliaRouter, aureliaMetadata, aureliaPath, aureliaTemplating, aureliaDependencyInjection, aureliaBinding, aureliaPal, LogManager) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var EmptyLayoutViewModel = /** @class */ (function () {
        function EmptyLayoutViewModel() {
        }
        return EmptyLayoutViewModel;
    }());
    /**
     * Implementation of Aurelia Router ViewPort. Responsible for loading route, composing and swapping routes views
     */
    var RouterView = /** @class */ (function () {
        function RouterView(element, container, viewSlot, router, viewLocator, compositionTransaction, compositionEngine) {
            this.element = element;
            this.container = container;
            this.viewSlot = viewSlot;
            this.router = router;
            this.viewLocator = viewLocator;
            this.compositionTransaction = compositionTransaction;
            this.compositionEngine = compositionEngine;
            // add this <router-view/> to router view ports lookup based on name attribute
            // when this router is the root router-view
            // also trigger AppRouter registerViewPort extra flow
            this.router.registerViewPort(this, this.element.getAttribute('name'));
            // Each <router-view/> process its instruction as a composition transaction
            // there are differences between intial composition and subsequent compositions
            // also there are differences between root composition and child <router-view/> composition
            // mark the first composition transaction with a property initialComposition to distinguish it
            // when the root <router-view/> gets new instruction for the first time
            if (!('initialComposition' in compositionTransaction)) {
                compositionTransaction.initialComposition = true;
                this.compositionTransactionNotifier = compositionTransaction.enlist();
            }
        }
        /**@internal */
        RouterView.inject = function () {
            return [aureliaPal.DOM.Element, aureliaDependencyInjection.Container, aureliaTemplating.ViewSlot, aureliaRouter.Router, aureliaTemplating.ViewLocator, aureliaTemplating.CompositionTransaction, aureliaTemplating.CompositionEngine];
        };
        RouterView.prototype.created = function (owningView) {
            this.owningView = owningView;
        };
        RouterView.prototype.bind = function (bindingContext, overrideContext) {
            // router needs to get access to view model of current route parent
            // doing it in generic way via viewModel property on container
            this.container.viewModel = bindingContext;
            this.overrideContext = overrideContext;
        };
        /**
         * Implementation of `aurelia-router` ViewPort interface, responsible for templating related part in routing Pipeline
         */
        RouterView.prototype.process = function ($viewPortInstruction, waitToSwap) {
            var _this = this;
            // have strong typings without exposing it in public typings, this is to ensure maximum backward compat
            var viewPortInstruction = $viewPortInstruction;
            var component = viewPortInstruction.component;
            var childContainer = component.childContainer;
            var viewModel = component.viewModel;
            var viewModelResource = component.viewModelResource;
            var metadata = viewModelResource.metadata;
            var config = component.router.currentInstruction.config;
            var viewPortConfig = config.viewPorts ? (config.viewPorts[viewPortInstruction.name] || {}) : {};
            childContainer.get(RouterViewLocator)._notify(this);
            // layoutInstruction is our layout viewModel
            var layoutInstruction = {
                viewModel: viewPortConfig.layoutViewModel || config.layoutViewModel || this.layoutViewModel,
                view: viewPortConfig.layoutView || config.layoutView || this.layoutView,
                model: viewPortConfig.layoutModel || config.layoutModel || this.layoutModel,
                router: viewPortInstruction.component.router,
                childContainer: childContainer,
                viewSlot: this.viewSlot
            };
            // viewport will be a thin wrapper around composition engine
            // to process instruction/configuration from users
            // preparing all information related to a composition process
            // first by getting view strategy of a ViewPortComponent View
            var viewStrategy = this.viewLocator.getViewStrategy(component.view || viewModel);
            if (viewStrategy && component.view) {
                viewStrategy.makeRelativeTo(aureliaMetadata.Origin.get(component.router.container.viewModel.constructor).moduleId);
            }
            // using metadata of a custom element view model to load appropriate view-factory instance
            return metadata
                .load(childContainer, viewModelResource.value, null, viewStrategy, true)
                // for custom element, viewFactory typing is always ViewFactory
                // for custom attribute, it will be HtmlBehaviorResource
                .then(function (viewFactory) {
                // if this is not the first time that this <router-view/> is composing its instruction
                // try to capture ownership of the composition transaction
                // child <router-view/> will not be able to capture, since root <router-view/> typically captures
                // the ownership token
                if (!_this.compositionTransactionNotifier) {
                    _this.compositionTransactionOwnershipToken = _this.compositionTransaction.tryCapture();
                }
                if (layoutInstruction.viewModel || layoutInstruction.view) {
                    viewPortInstruction.layoutInstruction = layoutInstruction;
                }
                var viewPortComponentBehaviorInstruction = aureliaTemplating.BehaviorInstruction.dynamic(_this.element, viewModel, viewFactory);
                viewPortInstruction.controller = metadata.create(childContainer, viewPortComponentBehaviorInstruction);
                if (waitToSwap) {
                    return null;
                }
                _this.swap(viewPortInstruction);
            });
        };
        RouterView.prototype.swap = function ($viewPortInstruction) {
            var _this = this;
            // have strong typings without exposing it in public typings, this is to ensure maximum backward compat
            var viewPortInstruction = $viewPortInstruction;
            var viewPortController = viewPortInstruction.controller;
            var layoutInstruction = viewPortInstruction.layoutInstruction;
            var previousView = this.view;
            // Final step of swapping a <router-view/> ViewPortComponent
            var work = function () {
                var swapStrategy = aureliaTemplating.SwapStrategies[_this.swapOrder] || aureliaTemplating.SwapStrategies.after;
                var viewSlot = _this.viewSlot;
                swapStrategy(viewSlot, previousView, function () { return Promise.resolve(viewSlot.add(_this.view)); }).then(function () {
                    _this._notify();
                });
            };
            // Ensure all users setups have been completed
            var ready = function (owningView_or_layoutView) {
                viewPortController.automate(_this.overrideContext, owningView_or_layoutView);
                var transactionOwnerShipToken = _this.compositionTransactionOwnershipToken;
                // if this router-view is the root <router-view/> of a normal startup via aurelia.setRoot
                // attemp to take control of the transaction
                // if ownership can be taken
                // wait for transaction to complete before swapping
                if (transactionOwnerShipToken) {
                    return transactionOwnerShipToken
                        .waitForCompositionComplete()
                        .then(function () {
                        _this.compositionTransactionOwnershipToken = null;
                        return work();
                    });
                }
                // otherwise, just swap
                return work();
            };
            // If there is layout instruction, new to compose layout before processing ViewPortComponent
            // layout controller/view/view-model is composed using composition engine APIs
            if (layoutInstruction) {
                if (!layoutInstruction.viewModel) {
                    // createController chokes if there's no viewmodel, so create a dummy one
                    // but avoid using a POJO as it creates unwanted metadata in Object constructor
                    layoutInstruction.viewModel = new EmptyLayoutViewModel();
                }
                // using composition engine to create compose layout
                return this.compositionEngine
                    // first create controller from layoutInstruction
                    // and treat it as CompositionContext
                    // then emulate slot projection with ViewPortComponent view
                    .createController(layoutInstruction)
                    .then(function (layoutController) {
                    var layoutView = layoutController.view;
                    aureliaTemplating.ShadowDOM.distributeView(viewPortController.view, layoutController.slots || layoutView.slots);
                    // when there is a layout
                    // view hierarchy is: <router-view/> owner view -> layout view -> ViewPortComponent view
                    layoutController.automate(aureliaBinding.createOverrideContext(layoutInstruction.viewModel), _this.owningView);
                    layoutView.children.push(viewPortController.view);
                    return layoutView || layoutController;
                })
                    .then(function (newView) {
                    _this.view = newView;
                    return ready(newView);
                });
            }
            // if there is no layout, then get ViewPortComponent view ready as view property
            // and process controller/swapping
            // when there is no layout
            // view hierarchy is: <router-view/> owner view -> ViewPortComponent view
            this.view = viewPortController.view;
            return ready(this.owningView);
        };
        /**
         * Notify composition transaction that this router has finished processing
         * Happens when this <router-view/> is the root router-view
         * @internal
         */
        RouterView.prototype._notify = function () {
            var notifier = this.compositionTransactionNotifier;
            if (notifier) {
                notifier.done();
                this.compositionTransactionNotifier = null;
            }
        };
        /**
         * @internal Actively avoid using decorator to reduce the amount of code generated
         *
         * There is no view to compose by default in a router view
         * This custom element is responsible for composing its own view, based on current config
         */
        RouterView.$view = null;
        /**
         * @internal Actively avoid using decorator to reduce the amount of code generated
         */
        RouterView.$resource = {
            name: 'router-view',
            bindables: ['swapOrder', 'layoutView', 'layoutViewModel', 'layoutModel', 'inherit-binding-context']
        };
        return RouterView;
    }());
    /**
    * Locator which finds the nearest RouterView, relative to the current dependency injection container.
    */
    var RouterViewLocator = /** @class */ (function () {
        /**
        * Creates an instance of the RouterViewLocator class.
        */
        function RouterViewLocator() {
            var _this = this;
            this.promise = new Promise(function (resolve) { return _this.resolve = resolve; });
        }
        /**
        * Finds the nearest RouterView instance.
        * @returns A promise that will be resolved with the located RouterView instance.
        */
        RouterViewLocator.prototype.findNearest = function () {
            return this.promise;
        };
        /**@internal */
        RouterViewLocator.prototype._notify = function (routerView) {
            this.resolve(routerView);
        };
        return RouterViewLocator;
    }());

    /**@internal exported for unit testing */
    var EmptyClass = /** @class */ (function () {
        function EmptyClass() {
        }
        return EmptyClass;
    }());
    aureliaTemplating.inlineView('<template></template>')(EmptyClass);
    /**
     * Default implementation of `RouteLoader` used for loading component based on a route config
     */
    var TemplatingRouteLoader = /** @class */ (function (_super) {
        __extends(TemplatingRouteLoader, _super);
        function TemplatingRouteLoader(compositionEngine) {
            var _this = _super.call(this) || this;
            _this.compositionEngine = compositionEngine;
            return _this;
        }
        /**
         * Resolve a view model from a RouteConfig
         * Throws when there is neither "moduleId" nor "viewModel" property
         * @internal
         */
        TemplatingRouteLoader.prototype.resolveViewModel = function (router, config) {
            return new Promise(function (resolve, reject) {
                var viewModel;
                if ('moduleId' in config) {
                    var moduleId = config.moduleId;
                    if (moduleId === null) {
                        viewModel = EmptyClass;
                    }
                    else {
                        // this requires container of router has passes a certain point
                        // where a view model has been setup on the container
                        // it will fail in enhance scenario because no viewport has been registered
                        moduleId = aureliaPath.relativeToFile(moduleId, aureliaMetadata.Origin.get(router.container.viewModel.constructor).moduleId);
                        if (/\.html/i.test(moduleId)) {
                            viewModel = createDynamicClass(moduleId);
                        }
                        else {
                            viewModel = moduleId;
                        }
                    }
                    return resolve(viewModel);
                }
                // todo: add if ('viewModel' in config) to support static view model resolution
                reject(new Error('Invalid route config. No "moduleId" found.'));
            });
        };
        /**
         * Create child container based on a router container
         * Also ensures that child router are properly constructed in the newly created child container
         * @internal
         */
        TemplatingRouteLoader.prototype.createChildContainer = function (router) {
            var childContainer = router.container.createChild();
            childContainer.registerSingleton(RouterViewLocator);
            childContainer.getChildRouter = function () {
                var childRouter;
                childContainer.registerHandler(aureliaRouter.Router, function () { return childRouter || (childRouter = router.createChild(childContainer)); });
                return childContainer.get(aureliaRouter.Router);
            };
            return childContainer;
        };
        /**
         * Load corresponding component of a route config of a navigation instruction
         */
        TemplatingRouteLoader.prototype.loadRoute = function (router, config, _navInstruction) {
            var _this = this;
            return this
                .resolveViewModel(router, config)
                .then(function (viewModel) { return _this.compositionEngine.ensureViewModel({
                viewModel: viewModel,
                childContainer: _this.createChildContainer(router),
                view: config.view || config.viewStrategy,
                router: router
            }); });
        };
        /**@internal */
        TemplatingRouteLoader.inject = [aureliaTemplating.CompositionEngine];
        return TemplatingRouteLoader;
    }(aureliaRouter.RouteLoader));
    /**@internal exported for unit testing */
    function createDynamicClass(moduleId) {
        var name = /([^\/^\?]+)\.html/i.exec(moduleId)[1];
        var DynamicClass = /** @class */ (function () {
            function DynamicClass() {
            }
            DynamicClass.prototype.bind = function (bindingContext) {
                this.$parent = bindingContext;
            };
            return DynamicClass;
        }());
        aureliaTemplating.customElement(name)(DynamicClass);
        aureliaTemplating.useView(moduleId)(DynamicClass);
        return DynamicClass;
    }

    var logger = LogManager.getLogger('route-href');
    /**
     * Helper custom attribute to help associate an element with a route by name
     */
    var RouteHref = /** @class */ (function () {
        function RouteHref(router, element) {
            this.router = router;
            this.element = element;
            this.attribute = 'href';
        }
        /*@internal */
        RouteHref.inject = function () {
            return [aureliaRouter.Router, aureliaPal.DOM.Element];
        };
        RouteHref.prototype.bind = function () {
            this.isActive = true;
            this.processChange();
        };
        RouteHref.prototype.unbind = function () {
            this.isActive = false;
        };
        RouteHref.prototype.attributeChanged = function (value, previous) {
            if (previous) {
                this.element.removeAttribute(previous);
            }
            return this.processChange();
        };
        RouteHref.prototype.processChange = function () {
            var _this = this;
            return this.router
                .ensureConfigured()
                .then(function () {
                if (!_this.isActive) {
                    // returning null to avoid Bluebird warning
                    return null;
                }
                var element = _this.element;
                var href = _this.router.generate(_this.route, _this.params);
                if (element.au.controller) {
                    element.au.controller.viewModel[_this.attribute] = href;
                }
                else {
                    element.setAttribute(_this.attribute, href);
                }
                // returning null to avoid Bluebird warning
                return null;
            })
                .catch(function (reason) {
                logger.error(reason);
            });
        };
        /**
         * @internal Actively avoid using decorator to reduce the amount of code generated
         */
        RouteHref.$resource = {
            type: 'attribute',
            name: 'route-href',
            bindables: [
                { name: 'route', changeHandler: 'processChange', primaryProperty: true },
                { name: 'params', changeHandler: 'processChange' },
                'attribute'
            ] // type definition of Aurelia templating is wrong
        };
        return RouteHref;
    }());

    function configure(config) {
        config
            .singleton(aureliaRouter.RouteLoader, TemplatingRouteLoader)
            .singleton(aureliaRouter.Router, aureliaRouter.AppRouter)
            .globalResources(RouterView, RouteHref);
        config.container.registerAlias(aureliaRouter.Router, aureliaRouter.AppRouter);
    }

    exports.RouteHref = RouteHref;
    exports.RouterView = RouterView;
    exports.TemplatingRouteLoader = TemplatingRouteLoader;
    exports.configure = configure;

    Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=aurelia-templating-router.js.map

define("aurelia-templating-router/aurelia-templating-router", [],function(){});
