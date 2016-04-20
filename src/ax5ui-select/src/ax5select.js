/*
 * Copyright (c) 2016. tom@axisj.com
 * - github.com/thomasjang
 * - www.axisj.com
 */

// ax5.ui.select
(function (root, _SUPER_) {

    /**
     * @class ax5.ui.select
     * @classdesc
     * @version 0.4.5
     * @author tom@axisj.com
     * @example
     * ```
     * var myselect = new ax5.ui.select();
     * ```
     */
    var U = ax5.util;

    //== UI Class
    var axClass = function () {
        var
            self = this,
            cfg;

        if (_SUPER_) _SUPER_.call(this); // 부모호출

        this.queue = [];
        this.config = {
            clickEventName: "click", //(('ontouchstart' in document.documentElement) ? "touchend" : "click"),
            theme: 'default',
            title: '',
            animateTime: 250,

            lang: {
                empty: '...'
            },
            columnKeys: {
                optionValue: 'value',
                optionText: 'text',
                optionSelected: 'selected'
            }
        };

        this.activeSelectOptionGroup = null;
        this.activeSelectQueueIndex = -1;
        this.openTimer = null;
        this.closeTimer = null;

        cfg = this.config;

        var
            onStateChanged = function (opts, that) {
                if (opts && opts.onStateChanged) {
                    opts.onStateChanged.call(that, that);
                }
                else if (this.onStateChanged) {
                    this.onStateChanged.call(that, that);
                }
                return true;
            },
            getOptionGroupTmpl = function () {
                return `
                <div class="ax5-ui-select-option-group {{theme}}" data-ax5-select-option-group="{{id}}">
                    <div class="ax-select-body">
                        <div class="ax-select-option-group-content" data-select-els="content">
                        
                        </div>
                    </div>
                    <div class="ax-select-arrow"></div>
                </div>
                `;
            },
            getTmpl = function () {
                return `
                <a class="form-control {{formSize}} ax5-ui-select-display {{theme}}" data-ax5-select-display="{{id}}">
                    <div class="ax5-ui-select-display-table">
                        <div data-ax5-select-display="label">{{label}}</div>
                        <div data-ax5-select-display="addon" data-ax5-select-opened="false">
                            {{#icons}}
                            <span class="addon-icon-closed">{{clesed}}</span>
                            <span class="addon-icon-opened">{{opened}}</span>
                            {{/icons}}
                            {{^icons}}
                            <span class="addon-icon-closed"><span class="addon-icon-arrow"></span></span>
                            <span class="addon-icon-opened"><span class="addon-icon-arrow"></span></span>
                            {{/icons}}
                        </div>
                    </div>
                </a>
                `;
            },
            alignSelectDisplay = function () {
                var i = this.queue.length;
                while (i--) {
                    if (this.queue[i].$display) {
                        this.queue[i].$display.css({
                            width: this.queue[i].select.outerWidth(),
                            height: this.queue[i].select.outerHeight()
                        });
                    }
                }
                return this;
            },
            alignSelectOptionGroup = function (append) {
                if (!this.activeSelectOptionGroup) return this;

                var
                    opts = this.queue[this.activeSelectQueueIndex],
                    pos = {},
                    dim = {};

                if (append) jQuery(document.body).append(this.activeSelectOptionGroup);

                pos = opts.$target.offset();
                dim = {
                    width: opts.$target.outerWidth(),
                    height: opts.$target.outerHeight()
                };

                // picker css(width, left, top) & direction 결정
                if (!opts.direction || opts.direction === "" || opts.direction === "auto") {
                    // set direction
                    opts.direction = "top";
                }

                if (append) {
                    this.activeSelectOptionGroup
                        .addClass("direction-" + opts.direction);
                }
                this.activeSelectOptionGroup
                    .css((function () {
                        if (opts.direction == "top") {
                            return {
                                left: pos.left + dim.width / 2 - this.activeSelectOptionGroup.outerWidth() / 2,
                                top: pos.top + dim.height + 12
                            }
                        }
                        else if (opts.direction == "bottom") {
                            return {
                                left: pos.left + dim.width / 2 - this.activeSelectOptionGroup.outerWidth() / 2,
                                top: pos.top - this.activeSelectOptionGroup.outerHeight() - 12
                            }
                        }
                        else if (opts.direction == "left") {
                            return {
                                left: pos.left + dim.width + 12,
                                top: pos.top - dim.height / 2
                            }
                        }
                        else if (opts.direction == "right") {
                            return {
                                left: pos.left - this.activeSelectOptionGroup.outerWidth() - 12,
                                top: pos.top - dim.height / 2
                            }
                        }
                    }).call(this));
            },
            onBodyClick = function (e, target) {
                if (!this.activeSelectOptionGroup) return this;

                var
                    opts = this.queue[this.activeSelectQueueIndex]
                    ;

                target = U.findParentNode(e.target, function (target) {
                    if (target.getAttribute("data-picker-els")) {
                        return true;
                    }
                    else if (opts.$target.get(0) == target) {
                        return true;
                    }
                });
                if (!target) {
                    //console.log("i'm not picker");
                    this.close();
                    return this;
                }
                //console.log("i'm picker");
                return this;
            },
            onBodyKeyup = function (e) {
                if (e.keyCode == ax5.info.eventKeys.ESC) {
                    this.close();
                }
            },
            bindSelectTarget = (function () {
                var selectEvent = {
                    'click': function (opts, optIdx, e) {
                        self.open(opts, optIdx);
                    }
                };

                return function (opts, optIdx) {
                    var data = {};

                    if (!opts.$display) {
                        syncSelectOptions.call(this, opts, optIdx, opts.options);
                        data.id = opts.id;
                        data.label = opts.selected.text;
                        data.formSize = (function () {
                            if (opts.select.hasClass("input-lg")) return "input-lg";
                            if (opts.select.hasClass("input-sm")) return "input-sm";
                        })();

                        opts.$display = jQuery(ax5.mustache.render(getTmpl.call(this, opts, optIdx), data));
                        opts.$target.append(opts.$display);
                        alignSelectDisplay.call(this);

                        opts.$display
                            .unbind('click.ax5select')
                            .bind('click.ax5select', selectEvent.click.bind(this, this.queue[optIdx], optIdx));
                    }

                    data = null;
                    opts = null;
                    optIdx = null;
                    return this;
                };
            })(),
            syncSelectOptions = (function () {
                var setSelected = function (opts, optIdx, O) {
                    if (!O) {
                        opts.selected = {};
                    }
                    else {
                        if (U.isArray(opts.selected)) {
                            opts.selected.push(O);
                        }
                        else {
                            opts.selected = $.extend({}, O);
                        }
                    }
                };
                var setSelectedFirst = function (opts, optIdx) {
                    if (opts.options[0]) opts.selected = $.extend({}, opts.options[0]);
                    else  opts.selected = {text: cfg.lang.empty};
                };

                return function (opts, optIdx, options) {
                    var po, elementOptions, newOptions;
                    setSelected(opts, optIdx, false); // opts.selected 초기화

                    if (options) {
                        opts.options = [].concat(options);
                        // select options 태그 생성
                        po = [];
                        opts.options.forEach(function (O, OIndex) {
                            po.push('<option value="' + O[cfg.columnKeys.optionValue] + '" ' + (O[cfg.columnKeys.optionSelected] ? ' selected="selected"' : '') + '>' + O[cfg.columnKeys.optionText] + '</option>');
                            if (O[cfg.columnKeys.optionSelected]) setSelected(opts, optIdx, O);
                        });
                        opts.select.html(po.join(''));
                    }
                    else {
                        elementOptions = U.toArray(opts.select.get(0).options);
                        // select option 스크립트 생성
                        newOptions = [];
                        elementOptions.forEach(function (O, OIndex) {
                            var option = {};
                            option[cfg.columnKeys.optionValue] = O.value;
                            option[cfg.columnKeys.optionText] = O.text;
                            option[cfg.columnKeys.optionSelected] = O.selected;
                            option['@index'] = OIndex;
                            if (O.selected) setSelected(opts, optIdx, option);
                            newOptions.push(option);
                            option = null;
                        });
                        opts.options = newOptions;
                    }

                    if (typeof opts.selected[cfg.columnKeys.optionValue] === "undefined") {
                        // 첫번째 옵션을 선택된 값으로 처리 하기
                        setSelectedFirst(opts, optIdx);
                    }
                    po = null;
                    elementOptions = null;
                    newOptions = null;
                    return opts.options;
                }
            })();
        /// private end

        /**
         * Preferences of select UI
         * @method ax5.ui.select.setConfig
         * @param {Object} config - 클래스 속성값
         * @returns {ax5.ui.select}
         * @example
         * ```
         * ```
         */
        this.init = function () {
            this.onStateChanged = cfg.onStateChanged;
            jQuery(window).bind("resize.ax5select", (function () {
                alignSelectDisplay.call(this);
            }).bind(this));
        };

        /**
         * bind select
         * @method ax5.ui.select.bind
         * @param {Object} opts
         * @param {String} [opts.id]
         * @param {Element} opts.target
         * @param {Object[]} opts.options
         * @returns {ax5.ui.select}
         */
        this.bind = function (opts) {
            var
                selectConfig = {},
                optIdx;

            opts = jQuery.extend(true, selectConfig, cfg, opts);
            if (!opts.target) {
                console.log(ax5.info.getError("ax5select", "401", "bind"));
                return this;
            }
            opts.$target = jQuery(opts.target);
            if (!opts.id) opts.id = opts.$target.data("ax5-select");
            if (!opts.id) {
                opts.id = 'ax5-select-' + ax5.getGuid();
                opts.$target.data("ax5-select", opts.id);
            }
            opts.select = opts.$target.find('select');

            // target attribute data
            (function (data) {
                if (U.isObject(data) && !data.error) {
                    opts = jQuery.extend(true, opts, data);
                }
            })(U.parseJson(opts.$target.attr("data-ax5select"), true));

            optIdx = U.search(this.queue, function () {
                return this.id == opts.id;
            });

            if (optIdx === -1) {
                this.queue.push(opts);
                bindSelectTarget.call(this, opts, this.queue.length - 1);
            }
            else {
                jQuery.extend(true, this.queue[optIdx], opts);
                bindSelectTarget.call(this, this.queue[optIdx], optIdx);
            }

            selectConfig = null;
            optIdx = null;
            return this;
        };

        /**
         * open the optionBox of select
         * @method ax5.ui.select.open
         * @param {(Object|String)} opts
         * @param {Number} [optIdx]
         * @param {Number} [tryCount]
         * @returns {ax5.ui.select}
         */
        this.open = (function () {

            return function (opts, optIdx, tryCount) {
                var data = {};

                /**
                 * open select from the outside
                 */
                if (U.isString(opts) && typeof optIdx == "undefined") {
                    optIdx = ax5.util.search(this.queue, function () {
                        return this.id == opts;
                    });
                    opts = this.queue[optIdx];
                    if (optIdx == -1) {
                        console.log(ax5.info.getError("ax5select", "402", "open"));
                        return this;
                    }
                }

                /**
                 다른 피커가 있는 경우와 다른 피커를 닫고 다시 오픈 명령이 내려진 경우에 대한 예외 처리 구문
                 */
                if (this.openTimer) clearTimeout(this.openTimer);
                if (this.activeSelectOptionGroup) {
                    if (this.activeSelectQueueIndex == optIdx) {
                        return this;
                    }

                    if (tryCount > 2) return this;
                    this.close();
                    this.openTimer = setTimeout((function () {
                        this.open(opts, optIdx, (tryCount || 0) + 1);
                    }).bind(this), cfg.animateTime);
                    return this;
                }

                data.id = opts.id;
                data.theme = opts.theme;

                this.activeSelectOptionGroup = jQuery(ax5.mustache.render(getOptionGroupTmpl.call(this, opts, optIdx), data));
                this.activeSelectQueueIndex = optIdx;

                alignSelectOptionGroup.call(this, "append"); // alignSelectOptionGroup 에서 body append
                jQuery(window).bind("resize.ax5select", (function () {
                    alignSelectOptionGroup.call(this);
                }).bind(this));

                // bind key event
                jQuery(window).bind("keyup.ax5select", (function (e) {
                    e = e || window.event;
                    onBodyKeyup.call(this, e);
                    U.stopEvent(e);
                }).bind(this));

                jQuery(window).bind("click.ax5select", (function (e) {
                    e = e || window.event;
                    onBodyClick.call(this, e);
                    U.stopEvent(e);
                }).bind(this));

                onStateChanged.call(this, opts, {
                    self: this,
                    state: "open",
                    boundObject: opts
                });

                data = null;
                return this;
            }
        })();

        /**
         * @method ax5.ui.select.update
         * @param {(Object|String)} opts
         * @returns {ax5.ui.select}
         */
        this.update = function () {

            return this;
        };

        /**
         * @method ax5.ui.select.close
         * @returns {ax5.ui.select}
         */
        this.close = function (opts) {
            if (this.closeTimer) clearTimeout(this.closeTimer);
            if (!this.activeSelectOptionGroup) return this;

            opts = this.queue[this.activeSelectQueueIndex];

            this.activeSelectOptionGroup.addClass("destroy");
            jQuery(window).unbind("resize.ax5select");
            jQuery(window).unbind("click.ax5select");
            jQuery(window).unbind("keyup.ax5select");

            this.closeTimer = setTimeout((function () {
                if (this.activeSelectOptionGroup) this.activeSelectOptionGroup.remove();
                this.activeSelectOptionGroup = null;
                this.activeSelectQueueIndex = -1;

                onStateChanged.call(this, opts, {
                    self: this,
                    state: "close"
                });

            }).bind(this), cfg.animateTime);

            return this;
        };

        // 클래스 생성자
        this.main = (function () {
            if (arguments && U.isObject(arguments[0])) {
                this.setConfig(arguments[0]);
            }
            else {
                this.init();
            }
        }).apply(this, arguments);
    };
    //== UI Class

    root.select = (function () {
        if (U.isFunction(_SUPER_)) axClass.prototype = new _SUPER_(); // 상속
        return axClass;
    })(); // ax5.ui에 연결

})(ax5.ui, ax5.ui.root);

ax5.ui.select_instance = new ax5.ui.select();

$.fn.ax5select = (function () {
    return function (config) {
        if (typeof config == "undefined") config = {};
        $.each(this, function () {
            var defaultConfig = {
                target: this
            };
            config = $.extend(true, config, defaultConfig);
            ax5.ui.select_instance.bind(config);
        });
        return this;
    }
})();