'use strict';

// ax5.ui.toast
(function (root, _SUPER_) {

    /**
     * @class ax5.ui.toast
     * @classdesc
     * @version v0.0.1
     * @author tom@axisj.com
     * @logs
     * 2014-06-17 tom : 시작
     * @example
     * ```
     * var my_toast = new ax5.ui.toast();
     * ```
     */

    var U = ax5.util;

    //== UI Class
    var axClass = function axClass() {
        var self = this,
            cfg;

        if (_SUPER_) _SUPER_.call(this); // 부모호출
        this.toastContainer = null;
        this.queue = [];
        this.config = {
            clickEventName: "click", //(('ontouchstart' in document.documentElement) ? "touchstart" : "click"),
            theme: 'default',
            width: 300,
            icon: '',
            closeIcon: '',
            msg: '',
            lang: {
                "ok": "ok", "cancel": "cancel"
            },
            displayTime: 3000,
            animateTime: 250,
            containerPosition: "bottom-left"
        };
        cfg = this.config;

        var onStateChanged = function onStateChanged(opts, that) {
            if (opts && opts.onStateChanged) {
                opts.onStateChanged.call(that, that);
            } else if (this.onStateChanged) {
                this.onStateChanged.call(that, that);
            }
            return true;
        };

        /**
         * Preferences of toast UI
         * @method ax5.ui.toast.set_config
         * @param {Object} config - 클래스 속성값
         * @returns {ax5.ui.toast}
         * @example
         * ```
         * ```
         */
        //== class body start
        this.init = function () {
            this.onStateChanged = cfg.onStateChanged;
            // after set_config();
            self.containerId = ax5.getGuid();
            var styles = [];
            if (cfg.zIndex) {
                styles.push("z-index:" + cfg.zIndex);
            }
            jQuery(document.body).append('<div class="ax5-ui-toast-container ' + cfg.containerPosition + '" data-toast-container="' + '' + self.containerId + '" style="' + styles.join(";") + '"></div>');
            this.toastContainer = jQuery('[data-toast-container="' + self.containerId + '"]');
        };

        this.push = function (opts, callBack) {
            if (!self.containerId) {
                this.init();
            }
            if (U.isString(opts)) {
                opts = {
                    title: cfg.title,
                    msg: opts
                };
            }
            opts.toastType = "push";

            self.dialogConfig = {};
            jQuery.extend(true, self.dialogConfig, cfg, opts);
            opts = self.dialogConfig;

            this.open(opts, callBack);
            return this;
        };

        this.confirm = function (opts, callBack) {
            if (!self.containerId) {
                this.init();
            }
            if (U.isString(opts)) {
                opts = {
                    title: cfg.title,
                    msg: opts
                };
            }
            opts.toastType = "confirm";

            self.dialogConfig = {};
            jQuery.extend(true, self.dialogConfig, cfg, opts);
            opts = self.dialogConfig;

            if (typeof opts.btns === "undefined") {
                opts.btns = {
                    ok: { label: cfg.lang["ok"], theme: opts.theme }
                };
            }
            this.open(opts, callBack);
            return this;
        };

        this.getContent = function (toastId, opts) {
            var po = [];
            po.push('<div id="' + toastId + '" data-ax5-ui="toast" class="ax5-ui-toast ' + opts.theme + '">');
            if (opts.icon) {
                po.push('<div class="ax-toast-icon">');
                po.push(opts.icon || "");
                po.push('</div>');
            }
            po.push('<div class="ax-toast-body">');
            po.push((opts.msg || "").replace(/\n/g, "<br/>"));
            po.push('</div>');

            if (opts.btns) {
                po.push('<div class="ax-toast-buttons">');
                po.push('<div class="ax-button-wrap">');
                U.each(opts.btns, function (k, v) {
                    po.push('<button type="button" data-ax-toast-btn="' + k + '" class="btn btn-' + (this.theme || "default") + '">' + this.label + '</button>');
                });
                po.push('</div>');
                po.push('</div>');
            } else {
                po.push('<a class="ax-toast-close" data-ax-toast-btn="ok">' + (opts.closeIcon || '') + '</a>');
            }

            po.push('<div style="clear:both;"></div>');
            po.push('</div>');
            return po.join('');
        };

        this.open = function (opts, callBack) {
            var toastBox,
                box = {
                width: opts.width
            };

            opts.id = 'ax5-toast-' + self.containerId + '-' + this.queue.length;

            if (U.left(cfg.containerPosition, '-') == 'bottom') {
                this.toastContainer.append(this.getContent(opts.id, opts));
            } else {
                this.toastContainer.prepend(this.getContent(opts.id, opts));
            }

            toastBox = jQuery('#' + opts.id);
            toastBox.css({ width: box.width });
            opts.toastBox = toastBox;
            this.queue.push(opts);

            onStateChanged.call(this, opts, {
                self: this,
                state: "open",
                toastId: opts.id
            });

            if (opts.toastType === "push") {
                // 자동 제거 타이머 시작
                setTimeout(function () {
                    this.close(opts, toastBox, callBack);
                }.bind(this), cfg.displayTime);

                toastBox.find("[data-ax-toast-btn]").on(cfg.clickEventName, function (e) {
                    this.btnOnClick(e || window.event, opts, toastBox, callBack);
                }.bind(this));
            } else if (opts.toastType === "confirm") {
                toastBox.find("[data-ax-toast-btn]").on(cfg.clickEventName, function (e) {
                    this.btnOnClick(e || window.event, opts, toastBox, callBack);
                }.bind(this));
            }
        };

        this.btnOnClick = function (e, opts, toastBox, callBack, target, k) {

            target = U.findParentNode(e.target, function (target) {
                if (target.getAttribute("data-ax-toast-btn")) {
                    return true;
                }
            });

            if (target) {
                k = target.getAttribute("data-ax-toast-btn");

                var that = {
                    key: k, value: opts.btns ? opts.btns[k] : k,
                    toastId: opts.id,
                    btn_target: target
                };

                if (opts.btns && opts.btns[k].onClick) {
                    opts.btns[k].onClick.call(that, k);
                } else if (opts.toastType === "push") {
                    if (callBack) callBack.call(that, k);
                    this.close(opts, toastBox);
                } else if (opts.toastType === "confirm") {
                    if (callBack) callBack.call(that, k);
                    this.close(opts, toastBox);
                }
            }
        };

        this.onKeyup = function (e, opts, callBack, target, k) {
            if (e.keyCode == ax5.info.eventKeys.ESC) {
                if (this.queue.length > 0) this.close();
            }
        };

        /**
         * close the toast
         * @method ax5.ui.toast.close
         * @returns {ax5.ui.toast}
         * @example
         * ```
         * my_toast.close();
         * ```
         */
        this.close = function (opts, toastBox, callBack) {
            if (typeof toastBox === "undefined") {
                opts = U.last(this.queue);
                toastBox = opts.toastBox;
            }

            toastBox.addClass(opts.toastType == "push" ? "removed" : "destroy");
            this.queue = U.filter(this.queue, function () {
                return opts.id != this.id;
            });
            setTimeout(function () {
                var that = {
                    toastId: opts.id
                };

                toastBox.remove();
                if (callBack) callBack.call(that);

                that = {
                    self: this,
                    state: "close",
                    toastId: opts.id
                };
                onStateChanged.call(this, opts, that);
            }.bind(this), cfg.animateTime);
            return this;
        };

        // 클래스 생성자
        this.main = function () {
            if (arguments && U.isObject(arguments[0])) {
                this.setConfig(arguments[0]);
            }
        }.apply(this, arguments);
    };
    //== UI Class

    root.toast = function () {
        if (U.isFunction(_SUPER_)) axClass.prototype = new _SUPER_(); // 상속
        return axClass;
    }(); // ax5.ui에 연결
})(ax5.ui, ax5.ui.root);