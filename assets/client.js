define('client/src/environment',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: true
  };
});
define('client/src/elems/form',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.FormCustomAttribute = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var FormCustomAttribute = exports.FormCustomAttribute = (_dec = (0, _aureliaFramework.inject)(Element), _dec(_class = function () {
    function FormCustomAttribute(element) {
      _classCallCheck(this, FormCustomAttribute);

      this.element = element;
      this.change = this.change.bind(this);
    }

    FormCustomAttribute.prototype.change = function change() {
      if (this.value == 'onchange' && this.serialize() == this.initialValue) return this.inputElement.disabled = true;

      this.inputElement.disabled = this.formElement && !this.formElement.checkValidity();
    };

    FormCustomAttribute.prototype.attached = function attached() {
      this.formElement = this.element.closest('form');
      this.formElement.addEventListener('change', this.change);
      this.formElement.addEventListener('input', this.change);

      this.inputElement = this.element.querySelector('input,button,select') || this.element;

      this.initialValue = this.serialize();

      setTimeout(this.change);
    };

    FormCustomAttribute.prototype.serialize = function serialize() {
      var s = [];
      for (var _iterator = this.formElement.elements, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var field = _ref;

        if (field.type != 'select-multiple') s.push(field.value);else {
          for (var _iterator2 = field.options, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            var _ref2;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref2 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref2 = _i2.value;
            }

            var _option = _ref2;

            if (_option.selected) s.push(_option.value);
          }
        }
      }
      return s.join('&');
    };

    return FormCustomAttribute;
  }()) || _class);
});
define('client/src/elems/md-autocomplete',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdAutocompleteCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _dec3, _class;

  var MdAutocompleteCustomElement = exports.MdAutocompleteCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'value', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('disabled'), _dec3 = (0, _aureliaFramework.bindable)('placeholder'), _dec(_class = _dec2(_class = _dec3(_class = function () {
    function MdAutocompleteCustomElement() {
      _classCallCheck(this, MdAutocompleteCustomElement);
    }

    MdAutocompleteCustomElement.prototype.toggleResults = function toggleResults($event) {
      var _this = this;

      setTimeout(function () {
        return _this.showResults = !_this.showResults;
      }, 200);
    };

    return MdAutocompleteCustomElement;
  }()) || _class) || _class) || _class);
});
define('client/src/elems/md-button',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdButtonCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class;

  var MdButtonCustomElement = exports.MdButtonCustomElement = (_dec = (0, _aureliaFramework.bindable)('form'), _dec2 = (0, _aureliaFramework.bindable)('class'), _dec3 = (0, _aureliaFramework.bindable)('raised'), _dec4 = (0, _aureliaFramework.bindable)('fab'), _dec5 = (0, _aureliaFramework.bindable)('disabled'), _dec6 = (0, _aureliaFramework.bindable)('color'), _dec7 = (0, _aureliaFramework.inject)(Element), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = _dec6(_class = _dec7(_class = function () {
    function MdButtonCustomElement(element) {
      _classCallCheck(this, MdButtonCustomElement);

      this.element = element;
      this.change = this.change.bind(this);
    }

    MdButtonCustomElement.prototype.click = function click($event) {
      this.disabled && $event.stopPropagation();
    };

    MdButtonCustomElement.prototype.disabledChanged = function disabledChanged() {
      this.button && this.change();
    };

    MdButtonCustomElement.prototype.change = function change(input) {
      this.disabled = this.disabled || this.disabled === '';
    };

    MdButtonCustomElement.prototype.attached = function attached() {
      var _button$classList;

      setTimeout(this.change);

      this.class && (_button$classList = this.button.classList).add.apply(_button$classList, this.class.split(' '));

      if (typeof this.color == 'string' && this.color.slice(0, 4) != 'mdl-') {
        this.color = 'mdl-button--' + (this.color || 'colored');
      }

      if (this.fab > 0) {
        this.button.classList.add('mdl-button--fab');
        this.button.style.height = this.fab + 'px';
        this.button.style.width = this.fab + 'px';
        this.button.style['min-width'] = this.button.style.width;
        this.button.style['font-size'] = this.fab * .75 + 'px';
        this.button.style['line-height'] = this.fab + 'px';
      }

      if (this.element.parentElement.tagName == 'MD-DRAWER') {
        this.button.style.width = "100%";
        this.button.style.height = "auto";
        this.button.style.padding = "16px 8px";
        this.button.style['line-height'] = "18px";
      }
    };

    return MdButtonCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
});
define('client/src/elems/md-checkbox',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdCheckboxCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _dec3, _dec4, _class;

  var MdCheckboxCustomElement = exports.MdCheckboxCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'checked', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('disabled'), _dec3 = (0, _aureliaFramework.bindable)('required'), _dec4 = (0, _aureliaFramework.inject)(Element), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = function () {
    function MdCheckboxCustomElement(element) {
      var _this = this;

      _classCallCheck(this, MdCheckboxCustomElement);

      this.tabindex = element.tabIndex;

      element.addEventListener('click', function (e) {
        return _this.disabled && e.stopPropagation();
      });
    }

    MdCheckboxCustomElement.prototype.stopPropogation = function stopPropogation() {
      return true;
    };

    MdCheckboxCustomElement.prototype.checkedChanged = function checkedChanged() {
      var _this2 = this;

      this.checked = !!this.checked;
      setTimeout(function (_) {
        return _this2.label && _this2.label.MaterialCheckbox && _this2.label.MaterialCheckbox.checkToggleState();
      });
    };

    MdCheckboxCustomElement.prototype.disabledChanged = function disabledChanged() {
      var _this3 = this;

      setTimeout(function (_) {
        return _this3.label && _this3.label.MaterialCheckbox.checkDisabled();
      });
    };

    MdCheckboxCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeAllRegistered();
      this.checkedChanged();
      this.disabledChanged();
    };

    return MdCheckboxCustomElement;
  }()) || _class) || _class) || _class) || _class);
});
define('client/src/elems/md-drawer',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdDrawerCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var drawer = document.createElement('nav');
  drawer.classList.add("mdl-layout__drawer");
  var MdDrawerCustomElement = exports.MdDrawerCustomElement = (_dec = (0, _aureliaFramework.inject)(Element), _dec(_class = function () {
    function MdDrawerCustomElement(element) {
      _classCallCheck(this, MdDrawerCustomElement);

      element.classList.add("mdl-navigation");
      element.style['padding-top'] = '6px';

      this.autofocus = element.hasAttribute('autofocus');

      drawer.appendChild(element);
    }

    MdDrawerCustomElement.prototype.attached = function attached() {
      this.header = document.querySelector('.mdl-layout__header');
      this.header.parentNode.insertBefore(drawer, this.header.nextSibling);

      componentHandler.upgradeAllRegistered();


      this.button = document.querySelector('.mdl-layout__drawer-button');

      if (this.button) this.button.style.display = 'block';

      if (this.autofocus && this.header.firstChild) this.header.firstChild.click();
    };

    MdDrawerCustomElement.prototype.detached = function detached() {
      if (drawer.children.length == 1 && this.button) this.button.style.display = 'none';

      drawer.removeChild(drawer.firstChild);
    };

    return MdDrawerCustomElement;
  }()) || _class);
});
define('client/src/elems/md-input',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdInputCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _class;

  var MdInputCustomElement = exports.MdInputCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'value', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('disabled'), _dec3 = (0, _aureliaFramework.bindable)('pattern'), _dec4 = (0, _aureliaFramework.bindable)('step'), _dec5 = (0, _aureliaFramework.bindable)('type'), _dec6 = (0, _aureliaFramework.bindable)('placeholder'), _dec7 = (0, _aureliaFramework.bindable)('input'), _dec8 = (0, _aureliaFramework.bindable)('max'), _dec9 = (0, _aureliaFramework.bindable)('min'), _dec10 = (0, _aureliaFramework.bindable)('required'), _dec11 = (0, _aureliaFramework.bindable)('minlength'), _dec12 = (0, _aureliaFramework.bindable)('maxlength'), _dec13 = (0, _aureliaFramework.bindable)('autofocus'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = _dec6(_class = _dec7(_class = _dec8(_class = _dec9(_class = _dec10(_class = _dec11(_class = _dec12(_class = _dec13(_class = function () {
    function MdInputCustomElement() {
      _classCallCheck(this, MdInputCustomElement);
    }

    MdInputCustomElement.prototype.valueChanged = function valueChanged() {
      var _this = this;

      setTimeout(function (_) {
        _this.div && _this.div.MaterialTextfield && _this.div.MaterialTextfield.checkDirty();
        _this.div && _this.div.MaterialTextfield && _this.div.MaterialTextfield.checkValidity();
      });
    };

    MdInputCustomElement.prototype.disabledChanged = function disabledChanged() {
      var _this2 = this;

      setTimeout(function (_) {
        _this2.div && _this2.div.MaterialTextfield && _this2.div.MaterialTextfield.checkDisabled();
        _this2.div && _this2.div.MaterialTextfield && _this2.div.MaterialTextfield.checkValidity();
      });
    };

    MdInputCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeElement(this.div);

      if (!this.placeholder) this.div.classList.remove('has-placeholder');

      if (this.autofocus || this.autofocus === '') this.div.MaterialTextfield.input_.focus();
    };

    return MdInputCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
});
define('client/src/elems/md-loading',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdLoadingCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var MdLoadingCustomElement = exports.MdLoadingCustomElement = (_dec = (0, _aureliaFramework.bindable)('value'), _dec(_class = function () {
    function MdLoadingCustomElement() {
      _classCallCheck(this, MdLoadingCustomElement);
    }

    MdLoadingCustomElement.prototype.valueChanged = function valueChanged(val) {
      var _this = this;

      setTimeout(function (_) {
        return _this.div && _this.div.MaterialProgress.setProgress(Math.min(val, 100));
      });
    };

    MdLoadingCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeElement(this.div);
    };

    return MdLoadingCustomElement;
  }()) || _class);
});
define('client/src/elems/md-menu',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdMenuCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var MdMenuCustomElement = exports.MdMenuCustomElement = (_dec = (0, _aureliaFramework.inject)(_aureliaFramework.ObserverLocator, Element), _dec(_class = function () {
    function MdMenuCustomElement(observer, element) {
      _classCallCheck(this, MdMenuCustomElement);

      this.id = 'id' + Date.now();
      this.element = element;
      this.observer = observer;
    }

    MdMenuCustomElement.prototype.click = function click($event) {
      if ($event.target.tagName == 'INPUT' || $event.target.disabled) $event.stopImmediatePropagation();

      return true;
    };

    MdMenuCustomElement.prototype.setDisabled = function setDisabled(li, disabled) {
      disabled ? li.setAttribute('disabled', '') : li.removeAttribute('disabled');
    };

    MdMenuCustomElement.prototype.attached = function attached() {
      var _this = this;

      var _loop = function _loop() {
        if (_isArray) {
          if (_i >= _iterator.length) return 'break';
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) return 'break';
          _ref = _i.value;
        }

        var li = _ref;

        li.classList.add('mdl-menu__item');
        _this.setDisabled(li, li.disabled);
        _this.observer.getObserver(li, 'disabled').subscribe(function (disabled) {
          _this.setDisabled(li, disabled);
        });
      };

      for (var _iterator = this.element.querySelectorAll('li'), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        var _ret = _loop();

        if (_ret === 'break') break;
      }
    };

    return MdMenuCustomElement;
  }()) || _class);
});
define('client/src/elems/md-select',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdSelectCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class;

  var MdSelectCustomElement = exports.MdSelectCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'value', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('style'), _dec3 = (0, _aureliaFramework.bindable)('options'), _dec4 = (0, _aureliaFramework.bindable)('disabled'), _dec5 = (0, _aureliaFramework.bindable)('default'), _dec6 = (0, _aureliaFramework.bindable)('required'), _dec7 = (0, _aureliaFramework.bindable)('property'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = _dec6(_class = _dec7(_class = function () {
    function MdSelectCustomElement() {
      _classCallCheck(this, MdSelectCustomElement);
    }

    MdSelectCustomElement.prototype.disabledChanged = function disabledChanged() {
      var _this = this;

      setTimeout(function (_) {
        return _this.div && _this.div.MaterialTextfield && _this.div.MaterialTextfield.checkDisabled();
      });
    };

    MdSelectCustomElement.prototype.valueChanged = function valueChanged() {
      var _this2 = this;

      setTimeout(function (_) {
        return _this2.div && _this2.div.MaterialTextfield && _this2.div.MaterialTextfield.checkDirty();
      });
    };

    MdSelectCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeElement(this.div);
    };

    return MdSelectCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
});
define('client/src/elems/md-shadow',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdShadowCustomAttribute = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var MdShadowCustomAttribute = exports.MdShadowCustomAttribute = (_dec = (0, _aureliaFramework.inject)(Element), _dec(_class = function MdShadowCustomAttribute(element) {
    _classCallCheck(this, MdShadowCustomAttribute);

    element.classList.add("mdl-shadow--" + element.getAttribute('md-shadow') + "dp");
  }) || _class);
});
define('client/src/elems/md-snackbar',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdSnackbarCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _class;

  var MdSnackbarCustomElement = exports.MdSnackbarCustomElement = (_dec = (0, _aureliaFramework.bindable)('show'), _dec2 = (0, _aureliaFramework.inject)(Element), _dec(_class = _dec2(_class = function () {
    function MdSnackbarCustomElement(element) {
      _classCallCheck(this, MdSnackbarCustomElement);

      this.element = element;
    }

    MdSnackbarCustomElement.prototype.attached = function attached() {
      var _this = this;

      componentHandler.upgradeElement(this.element);
      this.element.show = function (opts) {
        if (typeof opts == 'string') opts = { message: opts, timeout: 5000 };

        _this.element.MaterialSnackbar.showSnackbar(opts);
      };
      this.element.error = function (msg, err) {
        if (!err) {
          err = msg;
          msg = '';
        }
        msg = msg + ' ' + err.message;
        _this.element.show(msg);
        console.error(msg, err);
        return err;
      };
    };

    return MdSnackbarCustomElement;
  }()) || _class) || _class);
});
define('client/src/elems/md-switch',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdSwitchCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _dec3, _dec4, _class;

  var MdSwitchCustomElement = exports.MdSwitchCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'checked', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('disabled'), _dec3 = (0, _aureliaFramework.bindable)('required'), _dec4 = (0, _aureliaFramework.inject)(Element), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = function () {
    function MdSwitchCustomElement(elem) {
      var _this = this;

      _classCallCheck(this, MdSwitchCustomElement);

      elem.addEventListener('click', function (e) {
        return _this.disabled && e.stopPropagation();
      });
    }

    MdSwitchCustomElement.prototype.stopPropogation = function stopPropogation() {
      return true;
    };

    MdSwitchCustomElement.prototype.checkedChanged = function checkedChanged() {
      var _this2 = this;

      this.checked = !!this.checked;
      setTimeout(function (_) {
        return _this2.label && _this2.label.MaterialSwitch.checkToggleState();
      });
    };

    MdSwitchCustomElement.prototype.disabledChanged = function disabledChanged() {
      var _this3 = this;

      setTimeout(function (_) {
        return _this3.label && _this3.label.MaterialSwitch.checkDisabled();
      });
    };

    MdSwitchCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeElement(this.label);
      this.checkedChanged();
      this.disabledChanged();
    };

    return MdSwitchCustomElement;
  }()) || _class) || _class) || _class) || _class);
});
define('client/src/elems/md-table',["exports", "aurelia-framework"], function (exports, _aureliaFramework) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdTableCustomAttribute = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var MdTableCustomAttribute = exports.MdTableCustomAttribute = (_dec = (0, _aureliaFramework.inject)(Element), _dec(_class = function () {
    function MdTableCustomAttribute(element) {
      _classCallCheck(this, MdTableCustomAttribute);

      element.classList.add("mdl-data-table");
      element.classList.add("mdl-js-data-table");
      element.style.border = "none";

      if (element.getAttribute('md-table')) element.classList.add("mdl-data-table--selectable");

      this.element = element;
    }

    MdTableCustomAttribute.prototype.valueChanged = function valueChanged(selectable) {

      var checkboxes = this.element.querySelectorAll('input[type="checkbox"]');

      for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].disabled = selectable == 'false';
      }
    };

    MdTableCustomAttribute.prototype.attached = function attached() {

      componentHandler.upgradeAllRegistered();
    };

    return MdTableCustomAttribute;
  }()) || _class);
});
define('client/src/elems/md-text',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MdTextCustomElement = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _dec2, _dec3, _dec4, _dec5, _class;

  var MdTextCustomElement = exports.MdTextCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'value', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('disabled'), _dec3 = (0, _aureliaFramework.bindable)('placeholder'), _dec4 = (0, _aureliaFramework.bindable)('required'), _dec5 = (0, _aureliaFramework.bindable)('autofocus'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = function () {
    function MdTextCustomElement() {
      _classCallCheck(this, MdTextCustomElement);
    }

    MdTextCustomElement.prototype.valueChanged = function valueChanged() {
      var _this = this;

      setTimeout(function (_) {
        _this.div && _this.div.MaterialTextfield && _this.div.MaterialTextfield.checkDirty();
        _this.div && _this.div.MaterialTextfield && _this.div.MaterialTextfield.checkValidity();
      });
    };

    MdTextCustomElement.prototype.disabledChanged = function disabledChanged() {
      var _this2 = this;

      setTimeout(function (_) {
        _this2.div && _this2.div.MaterialTextfield && _this2.div.MaterialTextfield.checkDisabled();
        _this2.div && _this2.div.MaterialTextfield && _this2.div.MaterialTextfield.checkValidity();
      });
    };

    MdTextCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeElement(this.div);

      if (!this.placeholder) this.div.classList.remove('has-placeholder');

      if (this.autofocus || this.autofocus === '') this.div.MaterialTextfield.input_.focus();
    };

    return MdTextCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class);
});
define('client/src/libs/csv',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var csv = exports.csv = { toJSON: toJSON, fromJSON: fromJSON };
});
define('client/src/libs/pouch',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var Pouch = exports.Pouch = function Pouch() {
    _classCallCheck(this, Pouch);

    return pouchdbClient;
  };
});
define('client/src/resources/helpers',['exports', 'aurelia-router'], function (exports, _aureliaRouter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.expShortcuts = expShortcuts;
  exports.qtyShortcuts = qtyShortcuts;
  exports.removeTransactionIfQty0 = removeTransactionIfQty0;
  exports.incrementBin = incrementBin;
  exports.saveTransaction = saveTransaction;
  exports.scrollSelect = scrollSelect;
  exports.focusInput = focusInput;
  exports.toggleDrawer = toggleDrawer;
  exports.drugSearch = drugSearch;
  exports.parseUserDate = parseUserDate;
  exports.toJsonDate = toJsonDate;
  exports.waitForDrugsToIndex = waitForDrugsToIndex;
  exports.canActivate = canActivate;
  function expShortcuts($event, $index) {
    if ($event.which == 13) return this.focusInput('#qty_' + $index);

    return true;
  }

  function qtyShortcuts($event, $index) {
    if ($event.which == 13) return this.focusInput('#bin_' + $index, 'md-autocomplete');

    return clearIfAsterick($event);
  }

  function removeTransactionIfQty0($event, $index) {

    var transaction = this.transactions[$index];
    var doneeDelete = !transaction.qty.from && transaction.qty.to === 0;
    var donorDelete = !transaction.qty.to && transaction.qty.from === 0;

    if (!donorDelete && !doneeDelete) return true;

    this.drugs = [];
    this.transactions.splice($index, 1);
    this.db.transaction.remove(transaction);
    this.focusInput('md-autocomplete');
  }

  function incrementBin($event, transaction) {
    if ($event.which == 107 || $event.which == 187) {
      transaction.bin = transaction.bin[0] + (+transaction.bin.slice(1) + 1);
      saveTransaction.call(this, transaction);
      return false;
    }

    if ($event.which == 109 || $event.which == 189) {
      transaction.bin = transaction.bin[0] + (+transaction.bin.slice(1) - 1);
      saveTransaction.call(this, transaction);
      return false;
    }

    return clearIfAsterick($event);
  }

  function clearIfAsterick($event) {
    return $event.which == 106 || $event.shiftKey && $event.which == 56 ? $event.target.value = "" : true;
  }

  function saveTransaction(transaction) {
    var _this = this;

    return this._saveTransaction = Promise.resolve(this._saveTransaction).then(function (_) {
      return _this.db.transaction.put(transaction);
    }).catch(function (err) {
      delete _this._saveTransaction;
      throw _this.snackbar.error(err);
    });
  }

  function scrollSelect($event, curr) {
    var list = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var cb = arguments[3];


    var index = list.indexOf(curr);
    var last = list.length - 1;

    if ($event.which == 38) cb.call(this, list[index > 0 ? index - 1 : last]);

    if ($event.which == 40) cb.call(this, list[index < last ? index + 1 : 0]);
  }

  function focusInput(selector, fallback) {
    var elem = document.querySelector(selector + ' input');

    if (elem && !elem.disabled) elem.focus();else if (fallback) document.querySelector(fallback + ' input').focus();else console.log('Cannot find ' + selector + ' input');

    return false;
  }

  function toggleDrawer() {
    var drawer = document.querySelector('.mdl-layout__header');
    drawer && drawer.firstChild.click();
  }

  var search = {
    generic: function generic(_generic, clearCache) {
      var start = Date.now();
      var terms = _generic.toLowerCase().replace('.', '\\.').split(/, |[, ]/g);

      if (_generic.startsWith(search._term) && !clearCache) {
        var regex = RegExp('(?=.*' + terms.join(')(?=.*( |0)') + ')', 'i');
        return search._drugs.then(function (drugs) {
          return drugs.filter(function (drug) {
            return regex.test(drug.generic);
          });
        }).then(function (drugs) {
          console.log('generic filter returned', drugs.length, 'rows and took', Date.now() - start, 'term', _generic, 'cache', search._term);
          search._term = _generic;
          return drugs;
        });
      }

      search._term = _generic;

      return search._drugs = this.db.drug.query('generics.name', search.range(terms[0])).then(search.map(start));
    },
    addPkgCode: function addPkgCode(term, drug) {
      var pkg, ndc9, upc;
      if (term.length > 8) {
        ndc9 = '^' + drug.ndc9 + '(\\d{2})$';
        upc = '^' + drug.upc + '(\\d{' + (10 - drug.upc.length) + '})$';
        pkg = term.match(RegExp(ndc9 + '|' + upc));
      }

      drug.pkg = pkg ? pkg[1] || pkg[2] : '';
      return drug;
    },
    range: function range(term) {
      return { startkey: term, endkey: term + '\uFFFF', include_docs: true };
    },
    map: function map(start) {
      return function (res) {
        console.log('query returned', res.rows.length, 'rows and took', Date.now() - start);
        return res.rows.map(function (row) {
          return row.doc;
        });
      };
    },
    ndc: function ndc(_ndc, clearCache) {
      var start = Date.now();
      var term = _ndc.replace(/-/g, '');

      if (term.length == 12 && term[0] == '3') term = term.slice(1, -1);

      var ndc9 = term.slice(0, 9);
      var upc = term.slice(0, 8);

      if (term.startsWith(search._term) && !clearCache) {
        console.log('FILTER', 'ndc9', ndc9, 'upc', upc, 'term', term, 'this.term', search._term);
        return search._drugs.then(function (drugs) {
          return drugs.filter(function (drug) {
            search.addPkgCode(term, drug);

            return drug.ndc9.startsWith(ndc9) || drug.upc.length != 9 && term.length != 11 && drug.upc.startsWith(upc);
          });
        });
      }

      console.log('QUERY', 'ndc9', ndc9, 'upc', upc, 'term', term, 'this.term', search._term);

      search._term = term;

      ndc9 = this.db.drug.query('ndc9', search.range(ndc9)).then(search.map(start));

      upc = this.db.drug.query('upc', search.range(upc)).then(search.map(start));

      return search._drugs = Promise.all([upc, ndc9]).then(function (results) {

        var deduped = {};

        for (var _iterator = results[0], _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var drug = _ref;

          if (drug.upc.length != 9 && term.length != 11) deduped[drug._id] = drug;
        }for (var _iterator2 = results[1], _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref2 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref2 = _i2.value;
          }

          var _drug = _ref2;

          deduped[_drug._id] = _drug;
        }deduped = Object.keys(deduped).map(function (key) {
          return search.addPkgCode(term, deduped[key]);
        });
        console.log('query returned', deduped.length, 'rows and took', Date.now() - start);
        return deduped;
      });
    }
  };

  function drugSearch() {
    var _this2 = this;

    if (!this.term || this.term.length < 3) return Promise.resolve([]);

    var clearCache = this._savingDrug;
    var term = this.term.trim();

    return this._search = Promise.resolve(this._search).then(function (_) {
      return search[/^[\d-]+$/.test(term) ? 'ndc' : 'generic'].call(_this2, term, clearCache);
    });
  }

  function parseUserDate(date) {
    date = (date || "").split('/');
    return {
      year: date.pop(),
      month: date.shift()
    };
  }

  function toJsonDate(_ref3) {
    var month = _ref3.month,
        year = _ref3.year;

    console.log('date', month, year, new Date('20' + year, month - 1, 1).toJSON());
    return new Date('20' + year, month - 1, 1).toJSON();
  }

  function waitForDrugsToIndex() {
    var _this3 = this;

    this.db.drug.drugIsIndexed.get().then(function (_) {
      _this3.drugsIndexed = true;
      _this3.placeholder = "Search Drugs By Generic Name Or NDC...";
    });
  }

  function canActivate(_, next, _ref4) {
    var router = _ref4.router;

    return this.db.user.session.get().then(function (session) {

      var loggedIn = session && session.account;

      for (var _iterator3 = router.navigation, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref5;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref5 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref5 = _i3.value;
        }

        var route = _ref5;

        route.isVisible = loggedIn ? route.config.roles && ~route.config.roles.indexOf('user') : !route.config.roles;
      }var canActivate = next.navModel.isVisible || !next.nav;

      return canActivate || router.currentInstruction ? canActivate : new _aureliaRouter.Redirect(loggedIn ? 'shipments' : 'login');
    }).catch(function (err) {
      return console.log('loginRequired error', err);
    });
  }
});
define('client/src/resources/value-converters',['exports', '../resources/helpers'], function (exports, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.toArrayValueConverter = exports.dateValueConverter = exports.boldValueConverter = exports.valueValueConverter = exports.userFilterValueConverter = exports.drugFilterValueConverter = exports.shipmentFilterValueConverter = exports.upperCaseValueConverter = exports.numberValueConverter = exports.jsonValueConverter = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var jsonValueConverter = exports.jsonValueConverter = function () {
    function jsonValueConverter() {
      _classCallCheck(this, jsonValueConverter);
    }

    jsonValueConverter.prototype.toView = function toView() {
      var object = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      return JSON.stringify(object, null, " ");
    };

    return jsonValueConverter;
  }();

  var numberValueConverter = exports.numberValueConverter = function () {
    function numberValueConverter() {
      _classCallCheck(this, numberValueConverter);
    }

    numberValueConverter.prototype.fromView = function fromView(str) {
      return str === '' ? null : +str;
    };

    return numberValueConverter;
  }();

  var upperCaseValueConverter = exports.upperCaseValueConverter = function () {
    function upperCaseValueConverter() {
      _classCallCheck(this, upperCaseValueConverter);
    }

    upperCaseValueConverter.prototype.fromView = function fromView(str) {
      return str == null ? null : str.toUpperCase();
    };

    return upperCaseValueConverter;
  }();

  var shipmentFilterValueConverter = exports.shipmentFilterValueConverter = function () {
    function shipmentFilterValueConverter() {
      _classCallCheck(this, shipmentFilterValueConverter);
    }

    shipmentFilterValueConverter.prototype.toView = function toView() {
      var shipments = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      filter = filter.toLowerCase();
      return shipments.filter(function (shipment) {
        return ~(shipment.account.from.name + ' ' + shipment.account.to.name + ' ' + shipment.tracking + ' ' + shipment.status + ' ' + (shipment._id && shipment._id.slice(0, 10))).toLowerCase().indexOf(filter);
      });
    };

    return shipmentFilterValueConverter;
  }();

  var drugFilterValueConverter = exports.drugFilterValueConverter = function () {
    function drugFilterValueConverter() {
      _classCallCheck(this, drugFilterValueConverter);
    }

    drugFilterValueConverter.prototype.toView = function toView() {
      var drugs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      filter = filter.replace('.', '\\.').split(/, |[, ]/g);
      var regex = RegExp('(?=.*' + filter.join(')(?=.*( |0)') + ')', 'i');
      return drugs.filter(function (drug) {
        return regex.test(drug.generic);
      });
    };

    return drugFilterValueConverter;
  }();

  var userFilterValueConverter = exports.userFilterValueConverter = function () {
    function userFilterValueConverter() {
      _classCallCheck(this, userFilterValueConverter);
    }

    userFilterValueConverter.prototype.toView = function toView() {
      var users = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      filter = filter.toLowerCase();
      var res = users.filter(function (user) {
        try {
          return ~(user.name.first + ' ' + user.name.last).toLowerCase().indexOf(filter);
        } catch (err) {
          console.log('filter err', user, err);
        }
      });
      return res;
    };

    return userFilterValueConverter;
  }();

  var valueValueConverter = exports.valueValueConverter = function () {
    function valueValueConverter() {
      _classCallCheck(this, valueValueConverter);
    }

    valueValueConverter.prototype.toView = function toView() {
      var transactions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var decimals = arguments[1];
      var trigger = arguments[2];


      transactions = Array.isArray(transactions) ? transactions : [transactions];

      return transactions.reduce(function (total, transaction) {
        if (!transaction.drug.price || !transaction.qty) return 0;
        var price = transaction.drug.price.goodrx || transaction.drug.price.nadac || 0;
        var qty = transaction.qty.to || transaction.qty.from || 0;
        return total + qty * price;
      }, 0).toFixed(decimals);
    };

    return valueValueConverter;
  }();

  var boldValueConverter = exports.boldValueConverter = function () {
    function boldValueConverter() {
      _classCallCheck(this, boldValueConverter);
    }

    boldValueConverter.prototype.toView = function toView(text, bold) {
      if (!bold || !text) return text;

      if (typeof bold == 'string') bold = RegExp('(' + bold.replace(/ /g, '|').replace('.', '( | 0)?\\.') + ')', 'gi');

      return text.replace(bold, '<strong>$1</strong>');
    };

    return boldValueConverter;
  }();

  var dateValueConverter = exports.dateValueConverter = function () {
    function dateValueConverter() {
      _classCallCheck(this, dateValueConverter);
    }

    dateValueConverter.prototype.toView = function toView(date) {
      if (!date) return '';
      return date != this.model ? date.slice(5, 7) + '/' + date.slice(2, 4) : this.view;
    };

    dateValueConverter.prototype.fromView = function fromView(date) {

      if (date.includes('*')) return null;

      var add = date.includes('+') || date.includes('=');
      var sub = date.includes('-');

      var _parseUserDate = (0, _helpers.parseUserDate)(date.replace(/\+|\-|\=/g, '')),
          month = _parseUserDate.month,
          year = _parseUserDate.year;

      if (year.length > 2) year = year.slice(0, 2);

      if (add) month++;
      if (sub) month--;

      if (month == 0) {
        month = 12;
        year--;
      }

      if (month == 13) {
        month = 1;
        year++;
      }

      this.view = ("00" + month).slice(-2) + '/' + year;

      return this.model = (0, _helpers.toJsonDate)({ month: month, year: year });
    };

    return dateValueConverter;
  }();

  var toArrayValueConverter = exports.toArrayValueConverter = function () {
    function toArrayValueConverter() {
      _classCallCheck(this, toArrayValueConverter);
    }

    toArrayValueConverter.prototype.toView = function toView() {
      var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var sort = arguments[1];


      var arr = Object.keys(obj);

      if (sort) arr.sort().reverse();

      return arr.map(function (key) {
        return { key: key, val: obj[key] };
      });
    };

    return toArrayValueConverter;
  }();
});
define('client/src/views/account',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router', '../resources/helpers'], function (exports, _aureliaFramework, _pouch, _aureliaRouter, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.account = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var account = exports.account = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router), _dec(_class = function () {
    function account(db, router) {
      _classCallCheck(this, account);

      this.db = db;
      this.router = router;
      this.canActivate = _helpers.canActivate;
      this.csvHref = window.location.protocol + '//' + window.location.hostname;
      this.csvDate = '' + new Date().toJSON().slice(0, -8);
    }

    account.prototype.activate = function activate() {
      var _this = this;

      this.db.user.session.get().then(function (session) {

        _this.session = session;

        _this.db.account.allDocs({ include_docs: true, endkey: '_design' }).then(function (accounts) {
          _this.accounts = accounts.rows.map(function (account) {
            return account.doc;
          }).filter(function (account) {
            if (account._id != session.account._id) return true;
            _this.account = account;
          });
        });

        return _this.db.user.query('account._id', { key: session.account._id, include_docs: true }).then(function (users) {
          _this.users = users.rows.map(function (user) {
            return user.doc;
          });
          _this.selectUser();
        });
      });
    };

    account.prototype.selectUser = function selectUser(user) {
      var _this2 = this;

      this.user = user || this.users.filter(function (user) {
        return user._id == _this2.session._id;
      })[0];
    };

    account.prototype.saveUser = function saveUser() {
      this.user._id && this.db.user.put(this.user);
      return true;
    };

    account.prototype.addUser = function addUser() {
      var _this3 = this;

      this.users.unshift(this.user);
      this.db.user.post(this.user).catch(function (err) {
        _this3.users.shift();
        _this3.snackbar.show(err.message || err.reason);
      });
    };

    account.prototype.deleteUser = function deleteUser() {
      var _this4 = this;

      var index = this.users.indexOf(this.user);
      this.db.user.remove(this.user).then(function (_) {
        _this4.users.splice(index, 1);
        _this4.selectUser();
      }).catch(function (err) {
        console.log(err);
        _this4.snackbar.show(err.message || err.reason);
      });
    };

    account.prototype.authorize = function authorize(_id) {
      var _this5 = this;

      console.log('account.authorize', _id, this.account.authorized);
      var index = this.account.authorized.indexOf(_id);
      var method = ~index ? 'delete' : 'post';
      this.db.account.authorized[method](_id).then(function (res) {
        return _this5.account.authorized = res.authorized;
      });
    };

    account.prototype.logout = function logout() {
      var _this6 = this;

      this.disableLogout = 'Uninstalling...';
      this.db.user.session.delete().then(function (_) {
        _this6.router.navigate('login', { trigger: true });
      }).catch(function (err) {
        return console.trace('Logout failed:', err);
      });
    };

    account.prototype.importCSV = function importCSV($event) {
      var _this7 = this;

      this.snackbar.show('Uploading CSV File');
      var elem = $event.target;
      console.log(elem.parentNode.parentNode.getAttribute('href'), elem.parentNode.parentNode.href, elem.parentNode.parentNode);
      return this.db.ajax({ method: 'post', url: elem.parentNode.parentNode.getAttribute('href'), body: elem.files[0], json: false }).then(function (rows) {
        return _this7.snackbar.show('Import Succesful');
      }).catch(function (err) {
        return _this7.snackbar.error('Import Error', err);
      });
    };

    return account;
  }()) || _class);
});
define('client/src/views/drugs',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', '../libs/csv', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _csv, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.drugs = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var drugs = exports.drugs = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router), _dec(_class = function () {
    function drugs(db, router) {
      _classCallCheck(this, drugs);

      this.csv = _csv.csv;
      this.db = db;
      this.router = router;
      this.term = '';
      this.scrollDrugs = this.scrollDrugs.bind(this);

      this.toggleDrawer = _helpers.toggleDrawer;
      this.scrollSelect = _helpers.scrollSelect;
      this.drugSearch = _helpers.drugSearch;
      this.canActivate = _helpers.canActivate;
    }

    drugs.prototype.deactivate = function deactivate() {
      removeEventListener('keyup', this.scrollDrugs);
    };

    drugs.prototype.activate = function activate(params) {
      var _this = this;

      addEventListener('keyup', this.scrollDrugs);
      return this.db.user.session.get().then(function (session) {
        return _this.db.account.get(session.account._id);
      }).then(function (account) {
        _this.account = account;
        _this.drawer = {
          ordered: Object.keys(_this.account.ordered).sort()
        };

        if (params.id) return _this.db.drug.get(params.id).then(function (drug) {
          _this.selectDrug(drug, true);
        });

        if (_this.drawer.ordered[0]) return _this.selectDrawer(_this.drawer.ordered[0]);

        return _this.selectDrug();
      });
    };

    drugs.prototype.scrollGroups = function scrollGroups($event) {
      var _this2 = this;

      Promise.resolve(this._search).then(function (_) {
        _this2.scrollSelect($event, _this2.group, _this2.groups, function (group) {
          return _this2.selectGroup(group, true);
        });

        if ($event.which == 13) _this2.selectGroup(null, true);
      });

      $event.stopPropagation();
    };

    drugs.prototype.scrollDrugs = function scrollDrugs($event) {
      this.group && this.scrollSelect($event, this.drug, this.group.drugs, this.selectDrug);
    };

    drugs.prototype.selectGroup = function selectGroup(group, autoselectDrug) {
      var _this3 = this;

      console.log('selectGroup()', group.name, this.drug && this.drug.generic);

      this.term = group.name;
      this.db.transaction.query('inventory.drug.generic', { key: [this.account._id, group.name], include_docs: true }).then(function (inventory) {
        _this3.inventory = inventory.rows[0] && inventory.rows[0].qty;
      });

      if (!group.drugs) group.drugs = this.search().then(function (_) {
          return _this3.groups.length ? _this3.groups.filter(function (group) {
            return _this3.term == group.name;
          })[0].drugs : [];
        });

      Promise.resolve(group.drugs).then(function (drugs) {
        group.drugs = drugs;
        _this3.group = group;

        if (autoselectDrug) _this3.selectDrug(group.drugs[0]);
      });
    };

    drugs.prototype.selectDrug = function selectDrug(drug, autoselectGroup) {
      console.log('selectDrug()', this.group && this.group.name, drug && drug.generic);
      this.drug = drug || {
        generics: this.drug ? this.drug.generics : [{ name: '', strength: '' }],
        form: this.drug && this.drug.form
      };

      var url = this.drug._id ? 'drugs/' + this.drug._id : 'drugs';
      this.router.navigate(url, { trigger: false });

      if (autoselectGroup) this.selectGroup({ name: this.drug.generic || this.term });
    };

    drugs.prototype.selectDrawer = function selectDrawer(generic) {
      this.selectGroup({ name: generic }, true);
      this.toggleDrawer();
    };

    drugs.prototype.search = function search() {
      var _this4 = this;

      return this.drugSearch().then(function (drugs) {
        var groups = {};
        for (var _iterator = drugs, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var drug = _ref;

          groups[drug.generic] = groups[drug.generic] || { name: drug.generic, drugs: [] };
          groups[drug.generic].drugs.push(drug);
        }
        _this4.groups = Object.keys(groups).map(function (key) {
          return groups[key];
        });
      });
    };

    drugs.prototype.order = function order() {
      var _this5 = this;

      console.log('before order()', this.group.name, this.drug.generic);

      if (this.account.ordered[this.group.name]) {
        this.drawer.ordered = this.drawer.ordered.filter(function (generic) {
          return generic != _this5.group.name;
        });

        this.account.ordered[this.group.name] = undefined;
      } else {
        this.drawer.ordered.unshift(this.group.name);
        this.account.ordered[this.group.name] = {};
      }
      console.log('after order()', this.group.name, this.drug.generic);
      this.saveOrder();
    };

    drugs.prototype.exportCSV = function exportCSV(generic) {
      var _this6 = this;

      var inventory = this.db.transaction.query('inventory', { key: [this.account._id] });
      var drugs = this.db.drug.allDocs({ include_docs: true, endkey: '_design' });
      Promise.all([inventory, drugs]).then(function (_ref2) {
        var inventory = _ref2[0],
            drugs = _ref2[1];

        console.log('Export queries run');
        var ndcMap = {};
        for (var _iterator2 = inventory.rows, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref3 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref3 = _i2.value;
          }

          var row = _ref3;

          ndcMap[row.key[2]] = row.value;
        }
        console.log('Inital map complete');
        _this6.csv.fromJSON('Drugs ' + new Date().toJSON() + '.csv', drugs.rows.map(function (row) {
          return {
            order: _this6.account.ordered[row.doc.generic],
            '': row.doc,
            upc: "UPC " + row.doc.upc,
            ndc9: "NDC9 " + row.doc.ndc9,
            generics: row.doc.generics.map(function (generic) {
              return generic.name + " " + generic.strength;
            }).join(';'),
            inventory: ndcMap[row.doc._id]
          };
        }));
      });
    };

    drugs.prototype.importCSV = function importCSV() {
      var _this7 = this;

      this.snackbar.show('Parsing csv file');
      function capitalize(text) {
        return text ? text.trim().toLowerCase().replace(/\b[a-z]/g, function (l) {
          return l.toUpperCase();
        }) : text;
      }
      function trim(text) {
        return text ? text.trim() : text;
      }

      this.csv.toJSON(this.$file.files[0], function (drugs) {
        _this7.$file.value = '';
        var errs = [];
        var chain = Promise.resolve();

        var _loop = function _loop(i) {
          chain = chain.then(function (_) {
            var drug = drugs[i];

            drug = {
              _id: trim(drug._id),
              brand: trim(drug.brand),
              form: capitalize(drug.form),
              image: trim(drug.image),
              labeler: capitalize(drug.labeler),
              generics: drug.generics.split(";").filter(function (v) {
                return v;
              }).map(function (generic) {
                var _generic$split = generic.split(/(?= [\d.]+)/),
                    name = _generic$split[0],
                    strength = _generic$split[1];

                return {
                  name: capitalize(name),
                  strength: trim(strength || '').toLowerCase().replace(/ /g, '')
                };
              }),
              price: drug.price
            };

            return _this7.db.drug.post(drug).catch(function (err) {
              drug._err = 'Upload Error: ' + JSON.stringify(err);
              errs.push(drug);
            }).then(function (_) {
              if (+i && i % 100 == 0) _this7.snackbar.show('Imported ' + i + ' of ' + drugs.length);
            });
          });
        };

        for (var i in drugs) {
          _loop(i);
        }

        return chain.then(function (_) {
          return errs;
        });
      }).then(function (rows) {
        return _this7.snackbar.show('Import Succesful');
      }).catch(function (err) {
        return _this7.snackbar.error('Import Error', err);
      });
    };

    drugs.prototype.addGeneric = function addGeneric() {
      this.drug.generics.push({ name: '', strength: '' });
      return true;
    };

    drugs.prototype.removeGeneric = function removeGeneric() {
      this.drug.generics.pop();
      setTimeout(function (_) {
        return document.forms[0].dispatchEvent(new Event('change'));
      });
      return true;
    };

    drugs.prototype.saveOrder = function saveOrder() {
      var _this8 = this;

      console.log('before saveOrder()', this.group.name, this.drug.generic);
      return this.db.account.put(this.account).catch(function (_) {
        console.log('after saveOrder()', _this8.group.name, _this8.drug.generic);
        _this8.snackbar.show('Order could not be saved: ' + (err.reason || err.message));
      });
    };

    drugs.prototype.addDrug = function addDrug() {
      var _this9 = this;

      this._savingDrug = true;
      this.db.drug.post(this.drug).then(function (res) {
        _this9.drug._rev = res.rev;
        _this9.selectDrug(_this9.drug, true);
        _this9._savingDrug = false;
      }).catch(function (err) {
        _this9._savingDrug = false;
        console.log(err);
        _this9.snackbar.show('Drug not added: ' + (err.reason || err.message || JSON.stringify(err.errors)));
      });
    };

    drugs.prototype.saveDrug = function saveDrug() {
      var _this10 = this;

      this._savingDrug = true;
      this.db.drug.put(this.drug).then(function (res) {
        if (_this10.group.name != _this10.drug.generic && _this10.group.drugs.length == 1 && _this10.account.ordered[_this10.group.name]) _this10.order();

        _this10.selectDrug(_this10.drug, true);
        _this10._savingDrug = false;
      }).catch(function (err) {
        _this10._savingDrug = false;
        _this10.snackbar.show('Drug not saved: ' + (err.reason || err.message));
      });
    };

    drugs.prototype.deleteDrug = function deleteDrug() {
      console.log('TO BE IMPLEMENETED');
    };

    return drugs;
  }()) || _class);
});
define('client/src/views/index',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;
  function configure(aurelia) {

    Promise.config({ warnings: false });
    console.log = console.log.bind(console);

    aurelia.use.standardConfiguration().plugin('aurelia-animator-css').globalResources('client/src/resources/value-converters');

    aurelia.start().then(function (a) {
      return a.setRoot('client/src/views/routes');
    });
  }
});
define('client/src/views/inventory',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router', '../libs/csv', '../resources/helpers'], function (exports, _aureliaFramework, _pouch, _aureliaRouter, _csv, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.inventoryFilterValueConverter = exports.inventory = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var inventory = exports.inventory = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router), _dec(_class = function () {
    function inventory(db, router) {
      var _this = this;

      _classCallCheck(this, inventory);

      this.db = db;
      this.router = router;
      this.csv = _csv.csv;
      this.limit = 100;
      this.repack = {};
      this.transactions = [];
      this.pending = {};

      this.placeholder = "Search by generic name, ndc, exp, or bin";
      this.waitForDrugsToIndex = _helpers.waitForDrugsToIndex;
      this.expShortcuts = _helpers.expShortcuts;
      this.qtyShortcutsKeydown = _helpers.qtyShortcuts;
      this.removeTransactionIfQty0 = _helpers.removeTransactionIfQty0;
      this.saveTransaction = _helpers.saveTransaction;
      this.incrementBin = _helpers.incrementBin;
      this.focusInput = _helpers.focusInput;
      this.scrollSelect = _helpers.scrollSelect;
      this.drugSearch = _helpers.drugSearch;
      this.canActivate = _helpers.canActivate;
      this.toggleDrawer = _helpers.toggleDrawer;
      this.reset = function ($event) {
        if ($event.newURL.slice(-9) == 'inventory') {
          _this.term = '';
          _this.setTransactions();
        }
      };
    }

    inventory.prototype.deactivate = function deactivate() {
      window.removeEventListener("hashchange", this.reset);
    };

    inventory.prototype.activate = function activate(params) {
      var _this2 = this;

      window.addEventListener("hashchange", this.reset);

      this.db.user.session.get().then(function (session) {

        _this2.user = session._id;
        _this2.account = session.account._id;

        _this2.db.transaction.query('inventory.pendingAt', { include_docs: true, startkey: [_this2.account], endkey: [_this2.account, {}] }).then(function (res) {
          for (var _iterator = res.rows, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
              if (_i >= _iterator.length) break;
              _ref = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done) break;
              _ref = _i.value;
            }

            var row = _ref;

            _this2.setPending(row.doc);
          }
        }).then(function (_) {
          var keys = Object.keys(params);
          if (keys[0]) _this2.selectTerm(keys[0], params[keys[0]]);
        });

        return _this2.db.account.get(_this2.account);
      }).then(function (account) {
        return _this2.ordered = account.ordered;
      });
    };

    inventory.prototype.scrollTerms = function scrollTerms($event) {
      var _this3 = this;

      this.scrollSelect($event, this.term, this.terms, function (term) {
        return _this3.selectTerm('drug.generic', term);
      });

      if ($event.which == 13) this.focusInput('#exp_0');
    };

    inventory.prototype.sortTransactions = function sortTransactions(transactions) {
      var _this4 = this;

      return transactions.sort(function (a, b) {

        var aPack = _this4.isRepacked(a);
        var bPack = _this4.isRepacked(b);

        if (aPack > bPack) return -1;
        if (aPack < bPack) return 1;

        var aBin = a.bin ? a.bin[0] + a.bin[2] + a.bin[1] + (a.bin[3] || '') : '';
        var bBin = b.bin ? b.bin[0] + b.bin[2] + b.bin[1] + (b.bin[3] || '') : '';

        if (aBin > bBin) return 1;
        if (aBin < bBin) return -1;

        var aExp = a.exp.to || a.exp.from || '';
        var bExp = b.exp.to || b.exp.from || '';

        if (aExp < bExp) return 1;
        if (aExp > bExp) return -1;

        var aQty = a.qty.to || a.qty.from || '';
        var bQty = b.qty.to || b.qty.from || '';

        if (aQty > bQty) return 1;
        if (aQty < bQty) return -1;

        return 0;
      });
    };

    inventory.prototype.toggleCheck = function toggleCheck(transaction) {
      this.setCheck(transaction, !transaction.isChecked);
    };

    inventory.prototype.toggleVisibleChecks = function toggleVisibleChecks() {
      this.setVisibleChecks(!this.filter.checked.visible);
    };

    inventory.prototype.setVisibleChecks = function setVisibleChecks(visible) {
      if (!this.filter) return;

      var filtered = inventoryFilterValueConverter.prototype.toView(this.transactions, this.filter);
      for (var _iterator2 = filtered, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var transaction = _ref2;

        this.setCheck(transaction, visible);
      }this.filter.checked.visible = visible;
    };

    inventory.prototype.setCheck = function setCheck(transaction, isChecked) {

      var qty = transaction.qty.to || transaction.qty.from || 0;

      if (isChecked && !transaction.isChecked) {
        this.filter.checked.qty += qty;
        this.filter.checked.count++;
      }

      if (!isChecked && transaction.isChecked) {
        this.filter.checked.qty -= qty;
        this.filter.checked.count--;
        this.filter.checked.visible = false;
      }

      return transaction.isChecked = isChecked;
    };

    inventory.prototype.isRepacked = function isRepacked(transaction) {
      return transaction.bin && transaction.bin.length == 3;
    };

    inventory.prototype.setTransactions = function setTransactions() {
      var transactions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (transactions.length == this.limit) this.snackbar.show('Displaying first 100 results');

      this.transactions = this.sortTransactions(transactions);
      this.refreshFilter();
    };

    inventory.prototype.search = function search() {
      var _this5 = this;

      if (/[A-Z][0-9]{3}/.test(this.term)) return this.selectTerm('bin', this.term);

      if (/20\d\d-\d\d-?\d?\d?/.test(this.term)) return this.selectTerm('exp', this.term, true);

      this.drugSearch().then(function (drugs) {
        _this5.terms = drugs.map(function (drug) {
          return drug.generic;
        }).filter(function (generic, index, generics) {
          return generics.indexOf(generic) == index;
        });
      });
    };

    inventory.prototype.selectPending = function selectPending(pendingKey) {
      var _pendingKey$split = pendingKey.split(': '),
          generic = _pendingKey$split[0],
          pendingAt = _pendingKey$split[1];

      var transactions = this.pending[generic] ? this.pending[generic][pendingAt] : [];

      if (transactions) this.term = 'Pending ' + generic + ': ' + pendingAt.slice(5, 19);

      console.log('select pending', this.term, transactions);
      this.setTransactions(transactions);
      this.toggleDrawer();
    };

    inventory.prototype.selectTerm = function selectTerm(type, key) {
      var _this6 = this;

      this.router.navigate('inventory?' + type + '=' + key, { trigger: false });
      this.setVisibleChecks(false);
      this.filter = {};

      if (type == 'pending') return this.selectPending(key);

      this.term = key;

      var opts = { include_docs: true, limit: this.limit };
      if (type != 'generic') {
        opts.startkey = [this.account, key];
        opts.endkey = [this.account, key + '\uFFFF'];
      } else {
        opts.key = [this.account, key];
      }
      var setTransactions = function setTransactions(res) {
        return _this6.setTransactions(res.rows.map(function (row) {
          return row.doc;
        }));
      };
      this.db.transaction.query('inventory.' + type, opts).then(setTransactions);
    };

    inventory.prototype.refreshFilter = function refreshFilter(obj) {
      if (obj) obj.val.isChecked = !obj.val.isChecked;
      this.filter = Object.assign({}, this.filter);
    };

    inventory.prototype.refreshPending = function refreshPending() {
      this.pending = Object.assign({}, this.pending);
    };

    inventory.prototype.updateSelected = function updateSelected(updateFn) {
      var _this7 = this;

      var length = this.transactions.length;
      var all = [];

      var _loop = function _loop(i) {
        var transaction = _this7.transactions[i];

        if (!transaction.isChecked) return 'continue';

        _this7.transactions.splice(i, 1);

        updateFn(transaction);

        all.unshift(_this7.db.transaction.put(transaction).catch(function (err) {
          transaction.next.pop();
          _this7.transactions.splice(i, 0, transaction);
          _this7.snackbar.error('Error removing inventory', err);
        }));
      };

      for (var i = length - 1; i >= 0; i--) {
        var _ret = _loop(i);

        if (_ret === 'continue') continue;
      }

      this.filter.checked.visible = false;

      return Promise.all(all);
    };

    inventory.prototype.unpendInventory = function unpendInventory() {
      var _this8 = this;

      var term = this.transactions[0].drug.generic;
      this.updateSelected(function (transaction) {
        _this8.unsetPending(transaction);
        transaction.isChecked = false;
        transaction.next = [];
      }).then(function (_) {
        return _this8.selectTerm('drug.generic', term);
      });

      this.refreshPending();
    };

    inventory.prototype.pendInventory = function pendInventory() {
      var _this9 = this;

      var createdAt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date().toJSON();

      var term = this.transactions[0].drug.generic + ': ' + createdAt;
      this.updateSelected(function (transaction) {
        if (transaction.next[0]) _this9.unsetPending(transaction);

        transaction.isChecked = false;
        transaction.next = [{ pending: {}, createdAt: createdAt }];
        _this9.setPending(transaction);
      });

      this.selectTerm('pending', term);

      this.refreshPending();
    };

    inventory.prototype.setPending = function setPending(transaction) {
      var generic = transaction.drug.generic;
      var pendedAt = transaction.next[0].createdAt;

      this.pending[generic] = this.pending[generic] || {};
      this.pending[generic][pendedAt] = this.pending[generic][pendedAt] || [];
      this.pending[generic][pendedAt].push(transaction);
    };

    inventory.prototype.unsetPending = function unsetPending(transaction) {
      var pendedAt = transaction.next[0].createdAt;
      var generic = transaction.drug.generic;

      if (!this.pending[generic][pendedAt].length) delete this.pending[generic][pendedAt];

      if (!Object.keys(this.pending[generic]).length) delete this.pending[generic];
    };

    inventory.prototype.dispenseInventory = function dispenseInventory() {
      var next = [{ dispensed: {}, createdAt: new Date().toJSON() }];
      this.updateSelected(function (transaction) {
        return transaction.next = next;
      });
    };

    inventory.prototype.disposeInventory = function disposeInventory() {
      this.updateSelected(function (transaction) {
        transaction.verifiedAt = null;
        transaction.bin = null;
      });
    };

    inventory.prototype.repackInventory = function repackInventory() {
      var _this10 = this;

      var newTransactions = [],
          createdAt = new Date().toJSON();

      for (var i = 0; i < this.repack.vials; i++) {
        this.transactions.unshift({
          verifiedAt: createdAt,
          exp: { to: this.repack.exp, from: null },
          qty: { to: +this.repack.vialQty, from: null },
          user: { _id: this.user },
          shipment: { _id: this.account },
          bin: this.repack.bin,
          drug: this.transactions[0].drug,
          next: this.pendingIndex != null ? [{ pending: {}, createdAt: createdAt }] : [] });

        newTransactions.push(this.db.transaction.post(this.transactions[0]));
      }

      var excess = this.repack.totalQty - this.repack.vialQty * this.repack.vials;
      if (excess > 0) {
        newTransactions.push(this.db.transaction.post({
          exp: { to: this.repack.exp, from: null },
          qty: { to: excess, from: null },
          user: { _id: this.user },
          shipment: { _id: this.account },
          drug: this.transactions[0].drug,
          next: [] }));
      }

      Promise.all(newTransactions).then(function (newTransactions) {

        var label = ['<p style="page-break-after:always;">', '<strong>' + (_this10.transactions[0].drug.generic + ' ' + _this10.transactions[0].drug.form) + '</strong>', 'Ndc ' + _this10.transactions[0].drug._id, 'Exp ' + _this10.repack.exp.slice(0, 7), 'Bin ' + _this10.repack.bin, 'Qty ' + _this10.repack.vialQty, 'Pharmacist ________________', '</p>'];

        var next = newTransactions.map(function (newTransaction) {
          return { transaction: { _id: newTransaction.id }, createdAt: createdAt };
        });

        _this10.updateSelected(function (transaction) {
          return transaction.next = next;
        });

        var win = window.open();
        if (!win) return _this10.snackbar.show('Enable browser pop-ups to print repack labels');

        win.document.write(label.join('<br>').repeat(_this10.repack.vials));
        win.print();
        win.close();
      }).catch(function (err) {
        console.error(err);
        _this10.snackbar.show('Transactions could not repackaged: ' + err.reason);
      });
    };

    inventory.prototype.setRepackVials = function setRepackVials() {
      this.repack.vials = this.repack.totalQty && +this.repack.vialQty ? Math.floor(this.repack.totalQty / this.repack.vialQty) : '';
    };

    inventory.prototype.openMenu = function openMenu($event) {
      if ($event.target.tagName != 'I' || !this.transactions.length) return true;

      console.log('openMenu', this.ordered[this.term], this.repack, this.transactions[0]);

      var term = this.term.replace('Pending ', '');

      this.repack.vialQty = this.ordered[term] && this.ordered[term].vialQty ? this.ordered[term].vialQty : 90;
      this.repack.totalQty = 0, this.repack.exp = '';
      for (var _iterator3 = this.transactions, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref3;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref3 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref3 = _i3.value;
        }

        var _transaction = _ref3;

        if (_transaction.isChecked) {
          this.repack.totalQty += _transaction.qty.to;
          this.repack.exp = this.repack.exp && this.repack.exp < _transaction.exp.to ? this.repack.exp : _transaction.exp.to;
        }
      }

      this.setRepackVials();
    };

    inventory.prototype.qtyShortcutsInput = function qtyShortcutsInput($event, $index) {
      this.removeTransactionIfQty0($event, $index);
    };

    inventory.prototype.binShortcuts = function binShortcuts($event, $index) {
      if ($event.which == 13) return this.focusInput('#exp_' + ($index + 1));

      return this.incrementBin($event, this.transactions[$index]);
    };

    return inventory;
  }()) || _class);

  var inventoryFilterValueConverter = exports.inventoryFilterValueConverter = function () {
    function inventoryFilterValueConverter() {
      _classCallCheck(this, inventoryFilterValueConverter);
    }

    inventoryFilterValueConverter.prototype.toView = function toView() {
      var transactions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var filter = arguments[1];

      var ndcFilter = {};
      var expFilter = {};
      var repackFilter = {};
      var formFilter = {};
      var checkVisible = !!transactions.length;

      filter.checked = filter.checked || {};
      filter.checked.qty = filter.checked.qty || 0;
      filter.checked.count = filter.checked.count || 0;

      transactions = transactions.filter(function (transaction, i) {
        var qty = transaction.qty.to || transaction.qty.from;
        var exp = transaction.exp.to || transaction.exp.from;
        var ndc = transaction.drug._id;
        var form = transaction.drug.form;
        var repack = inventory.prototype.isRepacked(transaction) ? 'Repacked' : 'Inventory';

        if (!expFilter[exp]) expFilter[exp] = { isChecked: filter.exp && filter.exp[exp] ? filter.exp[exp].isChecked : !i, count: 0, qty: 0 };

        if (!ndcFilter[ndc]) ndcFilter[ndc] = { isChecked: filter.ndc && filter.ndc[ndc] ? filter.ndc[ndc].isChecked : !i, count: 0, qty: 0 };

        if (!formFilter[form]) formFilter[form] = { isChecked: filter.form && filter.form[form] ? filter.form[form].isChecked : !i, count: 0, qty: 0 };

        if (!repackFilter[repack]) repackFilter[repack] = { isChecked: filter.repack && filter.repack[repack] ? filter.repack[repack].isChecked : true, count: 0, qty: 0 };

        if (!expFilter[exp].isChecked) {
          if (ndcFilter[ndc].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
            expFilter[exp].count++;
            expFilter[exp].qty += qty;
          }

          return inventory.prototype.setCheck.call({ filter: filter }, transaction, false);
        }
        if (!ndcFilter[ndc].isChecked) {
          if (expFilter[exp].isChecked && formFilter[form].isChecked && repackFilter[repack].isChecked) {
            ndcFilter[ndc].count++;
            ndcFilter[ndc].qty += qty;
          }

          return inventory.prototype.setCheck.call({ filter: filter }, transaction, false);
        }

        if (!formFilter[form].isChecked) {
          if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && repackFilter[repack].isChecked) {
            formFilter[form].count++;
            formFilter[form].qty += qty;
          }
          return inventory.prototype.setCheck.call({ filter: filter }, transaction, false);
        }

        if (!repackFilter[repack].isChecked) {
          if (expFilter[exp].isChecked && ndcFilter[ndc].isChecked && formFilter[form].isChecked) {
            repackFilter[repack].count++;
            repackFilter[repack].qty += qty;
          }

          return inventory.prototype.setCheck.call({ filter: filter }, transaction, false);
        }

        if (!transaction.isChecked) checkVisible = false;

        expFilter[exp].count++;
        expFilter[exp].qty += qty;

        ndcFilter[ndc].count++;
        ndcFilter[ndc].qty += qty;

        formFilter[form].count++;
        formFilter[form].qty += qty;

        repackFilter[repack].count++;
        repackFilter[repack].qty += qty;

        return true;
      });

      filter.exp = expFilter;
      filter.ndc = ndcFilter;
      filter.form = formFilter;
      filter.repack = repackFilter;
      filter.checked.visible = checkVisible;

      return transactions;
    };

    return inventoryFilterValueConverter;
  }();
});
define('client/src/views/join',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.join = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var join = exports.join = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
    function join(db, router, http) {
      _classCallCheck(this, join);

      this.db = db;
      this.router = router;
      this.http = http;

      this.account = {
        name: '',
        license: 'Pharmacy',
        street: '',
        city: '',
        state: '',
        zip: '',
        ordered: {}
      };

      this.user = {
        name: { first: 'Guest', last: 'User' },
        phone: '650.488.7434'
      };
      this.canActivate = _helpers.canActivate;
    }

    join.prototype.join = function join() {
      var _this = this;

      console.log('this.account.phone', this.account.phone);
      this.db.account.post(this.account).then(function (res) {
        _this.user.account = { _id: res.id };
        console.log('this.user.phone', _this.user.phone);
        var password = _this.user.password;
        return _this.db.user.post(_this.user).then(function (_) {
          return _this.user.password = password;
        });
      }).then(function (_) {
        console.log(1);

        return new Promise(function (resolve) {
          return setTimeout(resolve, 1000);
        });
      }).then(function (_) {
        console.log(2);
        return _this.db.user.session.post(_this.user);
      }).then(function (loading) {
        console.log(3);

        _this.disabled = true;
        _this.loading = loading.resources;
        _this.progress = loading.progress;

        return Promise.all(loading.syncing);
      }).then(function (_) {
        console.log('join success', _);
        return _this.router.navigate('shipments');
      }).catch(function (err) {
        return _this.snackbar.error('Join failed', { err: err, account: _this.account, user: _this.user });
      });
    };

    return join;
  }()) || _class);
});
define('client/src/views/login',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.login = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var login = exports.login = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router), _dec(_class = function () {
    function login(db, router) {
      _classCallCheck(this, login);

      this.db = db;
      this.router = router;
      this.phone = '';
      this.password = '';
      this.canActivate = _helpers.canActivate;
    }

    login.prototype.login = function login() {
      var _this = this;

      this.db.user.session.post({ phone: this.phone, password: this.password }).then(function (loading) {
        _this.disabled = true;

        _this.loading = loading.resources;
        _this.progress = loading.progress;

        return Promise.all(loading.syncing);
      }).then(function (resources) {
        _this.router.navigate('shipments');
      }).catch(function (err) {
        _this.disabled = false;
        _this.snackbar.error('Login failed', err);
      });
    };

    return login;
  }()) || _class);
});
define('client/src/views/records',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.records = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var records = exports.records = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
    function records(db, router, http) {
      _classCallCheck(this, records);

      this.db = db;
      this.router = router;
      this.http = http;
      this.history = '';
      this.days = [];
      this.scroll = this.scroll.bind(this);
      this.toggleDrawer = _helpers.toggleDrawer;
      this.canActivate = _helpers.canActivate;
      this.recordTypes = [{ label: 'Received', value: 'received' }, { label: 'Accepted', value: 'verified' }, { label: 'Dispensed', value: 'dispensed' }, { label: 'Disposed', value: 'disposed' }];
    }

    records.prototype.deactivate = function deactivate() {
      removeEventListener('keyup', this.scroll);
    };

    records.prototype.activate = function activate(params) {
      var _this = this;

      addEventListener('keyup', this.scroll);
      return this.db.user.session.get().then(function (session) {
        _this.account = session.account;
        var opts = { group_level: 3, startkey: [_this.account._id], endkey: [_this.account._id, {}] };
        return Promise.all([_this.db.transaction.query('count', opts), _this.db.transaction.query('rxs', opts), _this.db.transaction.query('value', opts)]).then(function (all) {
          return _this.months = _this.collate(all, true);
        });
      });
    };

    records.prototype.collate = function collate(_ref, reverse) {
      var count = _ref[0],
          rxs = _ref[1],
          value = _ref[2];

      var arr = count.rows.map(function (count, i) {
        return {
          date: count.key.slice(1).join('-'),
          key: count.key,
          count: count.value,
          rxs: rxs.rows[i].value,
          value: value.rows[i].value
        };
      });
      console.log('collate', arr);
      return reverse ? arr.reverse() : arr;
    };

    records.prototype.selectMonth = function selectMonth(month) {
      var _this2 = this;

      this.month = month;
      var opts = { group_level: 4, startkey: month.key, endkey: month.key.concat({}) };
      return Promise.all([this.db.transaction.query('count', opts), this.db.transaction.query('rxs', opts), this.db.transaction.query('value', opts)]).then(function (all) {
        return _this2.days = _this2.collate(all);
      });
    };

    records.prototype.selectDay = function selectDay(date, $event) {
      var _this3 = this;

      this.month = null;
      this.days = [];

      if ($event) {
        this.toggleDrawer();
        $event.stopPropagation();
      }

      var to = new Date(date);
      to.setHours(24 * 2);

      var opts = {
        startkey: [this.account._id, date],
        endkey: [this.account._id, to.toJSON().slice(0, 10)],
        include_docs: true
      };

      this.db.transaction.query('createdAt', opts).then(function (transactions) {
        _this3.transactions = transactions.rows.map(function (row) {
          return row.doc;
        });
        return _this3.selectTransaction();
      });
    };

    records.prototype.scroll = function scroll($event) {
      var index = this.transactions.indexOf(this.transaction);
      var last = this.transactions.length - 1;

      if ($event.which == 38) this.selectTransaction(this.transactions[index > 0 ? index - 1 : last]);

      if ($event.which == 40) this.selectTransaction(this.transactions[index < last ? index + 1 : 0]);
    };

    records.prototype.selectTransaction = function selectTransaction(transaction) {
      var _this4 = this;

      this.transaction = transaction || this.transactions[0];

      if (!this.transaction) return;

      this.db.transaction.history.get(this.transaction._id).then(function (history) {
        function id(k, o) {
          if (Array.isArray(o)) return o;
          return o.shipment.from.name + ' ' + o._id;
        }

        function pad(word) {
          return (word + ' '.repeat(25)).slice(0, 25);
        }
        _this4.history = JSON.stringify(history.reverse(), function (k, v) {
          if (Array.isArray(v)) return v;

          var status = _this4.status || 'pickup';
          var href = '/#/shipments/' + v.shipment._id;

          return pad('From: ' + v.shipment.account.from.name) + pad('To: ' + v.shipment.account.to.name) + "<a href='" + href + "'>" + v.type + " <i class='material-icons' style='font-size:12px; vertical-align:text-top; padding-top:1px'>exit_to_app</i></a><br>" + pad(v.shipment.account.from.street) + pad(v.shipment.account.to.street) + 'Date ' + v._id.slice(2, 10) + '<br>' + pad(v.shipment.account.from.city + ', ' + v.shipment.account.from.state + ' ' + v.shipment.account.from.zip) + pad(v.shipment.account.to.city + ', ' + v.shipment.account.to.state + ' ' + v.shipment.account.to.zip) + 'Quantity ' + (v.qty.to || v.qty.from);
        }, "   ").replace(/\[\n?\s*/g, "<div style='margin-top:-12px'>").replace(/\n?\s*\],?/g, '</div>').replace(/ *"/g, '').replace(/\n/g, '<br><br>');
      });
    };

    records.prototype.exportCSV = function exportCSV() {};

    return records;
  }()) || _class);
});
define('client/src/views/routes',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var App = exports.App = function () {
    function App() {
      _classCallCheck(this, App);
    }

    App.prototype.configureRouter = function configureRouter(config, router) {
      this.routes = router.navigation;
      config.title = 'SIRUM';
      config.map([{ route: 'login', moduleId: 'client/src/views/login', title: 'Login', nav: true }, { route: 'join', moduleId: 'client/src/views/join', title: 'Join', nav: true }, { route: 'inventory', moduleId: 'client/src/views/inventory', title: 'Inventory', nav: true, roles: ["user"] }, { route: ['shipments', 'shipments/:id', ''], moduleId: 'client/src/views/shipments', title: 'Shipments', nav: true, roles: ["user"] }, { route: ['drugs', 'drugs/:id'], moduleId: 'client/src/views/drugs', title: 'Drugs', nav: true, roles: ["user"] }, { route: ['records', 'records/:id'], moduleId: 'client/src/views/records', title: 'Records', nav: true, roles: ["user"] }, { route: 'account', moduleId: 'client/src/views/account', title: 'Account', nav: true, roles: ["user"] }]);
    };

    return App;
  }();
});
define('client/src/views/shipments',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client', '../libs/csv', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient, _csv, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.shipments = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var shipments = exports.shipments = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
    function shipments(db, router, http) {
      _classCallCheck(this, shipments);

      this.csv = _csv.csv;
      this.db = db;
      this.drugs = [];
      this.router = router;
      this.http = http;
      this.stati = ['pickup', 'shipped', 'received'];
      this.shipments = {};
      this.term = '';

      this.waitForDrugsToIndex = _helpers.waitForDrugsToIndex;
      this.expShortcutsKeydown = _helpers.expShortcuts;
      this.qtyShortcutsKeydown = _helpers.qtyShortcuts;
      this.removeTransactionIfQty0 = _helpers.removeTransactionIfQty0;
      this.incrementBin = _helpers.incrementBin;
      this.saveTransaction = _helpers.saveTransaction;
      this.focusInput = _helpers.focusInput;
      this.scrollSelect = _helpers.scrollSelect;
      this.toggleDrawer = _helpers.toggleDrawer;
      this.drugSearch = _helpers.drugSearch;
      this.canActivate = _helpers.canActivate;
    }

    shipments.prototype.activate = function activate(params) {
      var _this = this;

      return this.db.user.session.get().then(function (session) {
        _this.user = session._id;
        return _this.db.account.get(session.account._id);
      }).then(function (account) {
        var _this$ordered;

        _this.account = { _id: account._id, name: account.name };
        _this.ordered = (_this$ordered = {}, _this$ordered[account._id] = account.ordered, _this$ordered);

        var senderAccounts = _this.db.account.allDocs({ keys: account.authorized, include_docs: true });
        var shipmentsReceived = _this.db.shipment.allDocs({ startkey: account._id + '\uFFFF', endkey: account._id, descending: true, include_docs: true });
        return Promise.all([senderAccounts, shipmentsReceived]).then(function (all) {
          senderAccounts = all[0].rows;
          shipmentsReceived = all[1].rows;

          var selected = void 0,
              map = { to: {}, from: {} };

          _this.accounts = {
            from: [''].concat(senderAccounts.map(function (_ref) {
              var doc = _ref.doc;

              _this.ordered[doc._id] = doc.ordered;
              return map.from[doc._id] = { _id: doc._id, name: doc.name };
            }))
          };

          _this.shipment = {};

          var accountRef = function accountRef(role) {
            return function (_ref2) {
              var doc = _ref2.doc;

              _this.setStatus(doc);

              if (map[role][doc.account[role]._id]) doc.account[role] = map[role][doc.account[role]._id];

              if (params.id === doc._id) selected = doc;

              return doc;
            };
          };

          _this.role = selected ? { accounts: 'to', shipments: 'from' } : { accounts: 'from', shipments: 'to' };

          _this.shipments.to = shipmentsReceived.map(accountRef('from'));

          _this.selectShipment(selected);
        }).catch(function (err) {
          return console.log('promise all err', err);
        });
      });
    };

    shipments.prototype.selectShipment = function selectShipment(shipment, toggleDrawer) {
      if (toggleDrawer) this.toggleDrawer();

      if (!shipment) return this.emptyShipment();
      this.setUrl('/' + shipment._id);
      this.setShipment(shipment);
      this.setTransactions(shipment._id);
    };

    shipments.prototype.emptyShipment = function emptyShipment() {
      this.setUrl('');

      if (this.role.shipments == 'to') {
        this.setShipment({ account: { to: this.account, from: {} } });
        this.setTransactions();
      } else {
        this.setShipment({ account: { from: this.account, to: {} } });
        this.setTransactions(this.account._id);
      }
    };

    shipments.prototype.setShipment = function setShipment(shipment) {
      this.shipment = shipment;
      this.shipmentId = shipment._id;
      this.attachment = null;
    };

    shipments.prototype.setUrl = function setUrl(url) {
      this.router.navigate('shipments' + url, { trigger: false });
    };

    shipments.prototype.setTransactions = function setTransactions(shipmentId) {
      var _this2 = this;

      this.diffs = [];

      if (!shipmentId) return this.transactions = [];

      this.db.transaction.query('shipment._id', { key: [this.account._id, shipmentId], include_docs: true, descending: true }).then(function (res) {
        _this2.transactions = res.rows.map(function (row) {
          return row.doc;
        });
        _this2.setCheckboxes();
      }).catch(function (err) {
        return console.log('err', err);
      });
    };

    shipments.prototype.setCheckboxes = function setCheckboxes() {
      for (var _iterator = this.transactions, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref3;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref3 = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref3 = _i.value;
        }

        var transaction = _ref3;

        transaction.isChecked = this.shipmentId == this.shipment._id ? transaction.verifiedAt : null;
      }
    };

    shipments.prototype.setStatus = function setStatus(shipment) {
      shipment.status = this.stati.reduce(function (prev, curr) {
        return shipment[curr + 'At'] ? curr : prev;
      });
    };

    shipments.prototype.swapRole = function swapRole() {
      var _ref4 = [this.role.shipments, this.role.accounts];
      this.role.accounts = _ref4[0];
      this.role.shipments = _ref4[1];

      this.selectShipment();
      return true;
    };

    shipments.prototype.saveShipment = function saveShipment() {
      var _this3 = this;

      return this.db.shipment.put(this.shipment).then(function (res) {
        _this3.setStatus(_this3.shipment);
      });
    };

    shipments.prototype.moveTransactionsToShipment = function moveTransactionsToShipment(shipment) {
      var _this4 = this;

      Promise.all(this.transactions.map(function (transaction) {
        if (transaction.isChecked) {
          transaction.shipment = { _id: shipment._id };
          return _this4.db.transaction.put(transaction);
        }
      })).then(function (_) {
        return _this4.selectShipment(shipment);
      });
    };

    shipments.prototype.createShipment = function createShipment() {
      var _this5 = this;

      if (this.shipment.tracking == 'New Tracking #') delete this.shipment.tracking;

      this.shipments[this.role.shipments].unshift(this.shipment);
      this.setStatus(this.shipment);

      this.db.shipment.post(this.shipment).then(function (res) {
        return _this5.moveTransactionsToShipment(_this5.shipment);
      }).catch(function (err) {
        return console.error('createShipment error', err, _this5.shipment);
      });
    };

    shipments.prototype.expShortcutsInput = function expShortcutsInput($index) {
      this.autoCheck($index);
    };

    shipments.prototype.qtyShortcutsInput = function qtyShortcutsInput($event, $index) {
      this.removeTransactionIfQty0($event, $index) && this.autoCheck($index);
    };

    shipments.prototype.binShortcuts = function binShortcuts($event, $index) {
      if ($event.which == 13) return this.focusInput('md-autocomplete');

      return this.incrementBin($event, this.transactions[$index]);
    };

    shipments.prototype.getBin = function getBin(transaction) {
      return (this.getOrder(transaction) || {}).defaultBin || this._bin;
    };

    shipments.prototype.setBin = function setBin(transaction) {
      if (this.getBin(transaction) != transaction.bin) this._bin = transaction.bin;
    };

    shipments.prototype.aboveMinQty = function aboveMinQty(order, transaction) {
      var qty = transaction.qty[this.role.shipments];
      if (!qty) return false;
      console.log('aboveMinQty', transaction);
      var price = transaction.drug.price.goodrx || transaction.drug.price.nadac || 0;
      var defaultQty = price > 1 ? 1 : 1;
      var aboveMinQty = qty >= Math.min(+order.minQty || defaultQty, 10);
      if (!aboveMinQty) console.log('Ordered drug but qty', qty, 'is less than', +order.minQty || defaultQty);
      return aboveMinQty;
    };

    shipments.prototype.aboveMinExp = function aboveMinExp(order, transaction) {
      var exp = transaction.exp[this.role.shipments];
      if (!exp) return !order.minDays;
      var minDays = order.minDays || 60;
      var aboveMinExp = new Date(exp) - Date.now() >= minDays * 24 * 60 * 60 * 1000;
      if (!aboveMinExp) console.log('Ordered drug but expiration', exp, 'is before', minDays);
      return aboveMinExp;
    };

    shipments.prototype.belowMaxInventory = function belowMaxInventory(order, transaction) {
      var newInventory = transaction.qty[this.role.shipments] + order.inventory;
      var maxInventory = order.maxInventory || 3000;
      var belowMaxInventory = isNaN(newInventory) ? true : newInventory < maxInventory;
      if (!belowMaxInventory) console.log('Ordered drug but inventory', newInventory, 'would be above max of', maxInventory);
      return belowMaxInventory;
    };

    shipments.prototype.getOrder = function getOrder(transaction) {
      return this.ordered[this.shipment.account.to._id][transaction.drug.generic];
    };

    shipments.prototype.isWanted = function isWanted(order, transaction) {
      return order ? this.belowMaxInventory(order, transaction) && this.aboveMinQty(order, transaction) && this.aboveMinExp(order, transaction) : false;
    };

    shipments.prototype.setDestroyedMessage = function setDestroyedMessage(order) {
      var _this6 = this;

      if (order && order.destroyedMessage && !this.destroyedMessage) this.destroyedMessage = setTimeout(function (_) {
        delete _this6.destroyedMessage;
        _this6.snackbar.show(order.destroyedMessage);
      }, 500);
    };

    shipments.prototype.clearDestroyedMessage = function clearDestroyedMessage() {
      clearTimeout(this.destroyedMessage);
      delete this.destroyedMessage;
    };

    shipments.prototype.autoCheck = function autoCheck($index) {
      var transaction = this.transactions[$index];
      var isChecked = transaction.isChecked;
      var order = this.getOrder(transaction);

      if (this.isWanted(order, transaction) == isChecked) return !isChecked && transaction.qty.to > 0 && this.setDestroyedMessage(order);

      if (isChecked) this.setDestroyedMessage(order);

      if (!isChecked) {
        this.snackbar.show(order.verifiedMessage || 'Drug is ordered');
        this.clearDestroyedMessage();
      }

      this.manualCheck($index);
    };

    shipments.prototype.manualCheck = function manualCheck($index) {
      var transaction = this.transactions[$index];
      transaction.isChecked = !transaction.isChecked;

      this.moveItemsButton.offsetParent ? this.toggleSelectedCheck(transaction) : this.toggleVerifiedCheck(transaction);
    };

    shipments.prototype.toggleVerifiedCheck = function toggleVerifiedCheck(transaction) {

      var verifiedAt = transaction.verifiedAt;
      var bin = transaction.bin;

      if (verifiedAt) {
        transaction.verifiedAt = null;
        transaction.bin = null;
      } else {
        transaction.verifiedAt = new Date().toJSON();
        transaction.bin = this.getBin(transaction);
      }

      this.saveTransaction(transaction).catch(function (err) {
        transaction.isChecked = !transaction.isChecked;
        transaction.verifiedAt = verifiedAt;
        transaction.bin = bin;
      });
    };

    shipments.prototype.toggleSelectedCheck = function toggleSelectedCheck(transaction) {
      var index = this.diffs.indexOf(transaction);
      ~index ? this.diffs.splice(index, 1) : this.diffs.push(transaction);
    };

    shipments.prototype.search = function search() {
      var _this7 = this;

      this.drugSearch().then(function (drugs) {
        _this7.drugs = drugs;
        _this7.drug = drugs[0];
      });
    };

    shipments.prototype.autocompleteShortcuts = function autocompleteShortcuts($event) {
      var _this8 = this;

      this.scrollSelect($event, this.drug, this.drugs, function (drug) {
        return _this8.drug = drug;
      });

      if ($event.which == 13) {
        Promise.resolve(this._search).then(function (_) {
          return _this8.addTransaction(_this8.drug);
        });
        return false;
      }

      if ($event.which == 106 || $event.shiftKey && $event.which == 56) this.term = "";

      return true;
    };

    shipments.prototype.addTransaction = function addTransaction(drug, transaction) {
      var _this9 = this;

      if (!drug) return this.snackbar.show('Cannot find drug matching this search');

      this.drug = drug;

      if (drug.warning) this.dialog.showModal();

      transaction = transaction || {
        qty: { from: null, to: null },
        exp: {
          from: this.transactions[0] ? this.transactions[0].exp.from : null,
          to: this.transactions[0] ? this.transactions[0].exp.to : null
        }
      };

      transaction.drug = {
        _id: drug._id,
        brand: drug.brand,
        generic: drug.generic,
        generics: drug.generics,
        form: drug.form,
        price: drug.price,
        pkg: drug.pkg
      };

      transaction.user = { _id: this.user };
      transaction.shipment = { _id: this.shipment._id || this.account._id };

      this.term = '';
      this.transactions.unshift(transaction);

      var order = this.getOrder(transaction);
      var isPharMerica = false;
      order && this.db.transaction.query('inventory', { startkey: [drug.generic], endkey: [drug.generic + '\uFFFF'] }).then(function (inventory) {
        console.log('inventory', inventory);
        order.inventory = inventory.rows[0] ? inventory.rows[0].value.total : 0;
        console.log('order.inventory', order.inventory);
      });

      isPharMerica && !order ? this.snackbar.show('Destroy, record already exists') : setTimeout(function (_) {
        return _this9.focusInput('#exp_0');
      }, 50);

      return this._saveTransaction = Promise.resolve(this._saveTransaction).then(function (_) {
        return _this9.db.transaction.post(transaction).catch(function (err) {
          _this9.snackbar.error('Transaction could not be added: ', err);
          _this9.transactions.shift();
        });
      });
    };

    shipments.prototype.dialogClose = function dialogClose() {
      this.dialog.close();
      this.focusInput('#qty_0');
    };

    shipments.prototype.exportCSV = function exportCSV() {
      var _this10 = this;

      var name = 'Shipment ' + this.shipment._id + '.csv';
      this.csv.fromJSON(name, this.transactions.map(function (transaction) {
        return {
          '': transaction,
          'next': JSON.stringify(transaction.next || []),
          'drug._id': " " + transaction.drug._id,
          'drug.generics': transaction.drug.generics.map(function (generic) {
            return generic.name + " " + generic.strength;
          }).join(';'),
          shipment: _this10.shipment
        };
      }));
    };

    shipments.prototype.importCSV = function importCSV() {
      var _this11 = this;

      this.csv.toJSON(this.$file.files[0], function (parsed) {
        _this11.$file.value = '';
        return Promise.all(parsed.map(function (transaction) {
          transaction._err = undefined;
          transaction._id = undefined;
          transaction._rev = undefined;
          transaction.shipment._id = _this11.shipment._id;
          transaction.next = JSON.parse(transaction.next);

          return _this11.db.drug.get(transaction.drug._id).then(function (drug) {
            return _this11.addTransaction(drug, transaction);
          }).then(function (_) {
            return undefined;
          }).catch(function (err) {
            transaction._err = 'Upload Error: ' + JSON.stringify(err);
            return transaction;
          });
        }));
      }).then(function (rows) {
        return _this11.snackbar.show('Import Succesful');
      }).catch(function (err) {
        return _this11.snackbar.error('Import Error', err);
      });
    };

    return shipments;
  }()) || _class);
});
define('text!client/src/elems/md-autocomplete.html', ['module'], function(module) { module.exports = "<template style=\"box-shadow:none\">\n  <!-- z-index of 2 is > than checkboxes which have z-index of 1 -->\n  <md-autocomplete-wrap\n    ref=\"form\"\n    class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\"\n    style=\"z-index:2; width:100%; padding-top:10px\">\n    <input class=\"md-input mdl-textfield__input\"\n      name = \"pro_input_field\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled\"\n      placeholder.bind=\"placeholder || ''\"\n      focus.trigger=\"toggleResults()\"\n      focusout.delegate=\"toggleResults($event)\"\n      style=\"font-size:20px;\">\n    <div show.bind=\"showResults\"\n      tabindex=\"-1\"\n      style=\"width:100%; overflow-y:scroll; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25); max-height: 400px !important;\"\n      class=\"md-autocomplete-suggestions\">\n      <slot></slot>\n    </div>\n  </md-autocomplete-wrap>\n  <style>\n  @-webkit-keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @-webkit-keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  @keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  md-autocomplete {\n    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);\n    border-radius: 2px;\n    display: block;\n    height: 40px;\n    position: relative;\n    overflow: visible;\n    min-width: 190px; }\n    md-autocomplete[md-floating-label] {\n      padding-bottom: 26px;\n      box-shadow: none;\n      border-radius: 0;\n      background: transparent;\n      height: auto; }\n      md-autocomplete[md-floating-label] md-input-container {\n        padding-bottom: 0; }\n      md-autocomplete[md-floating-label] md-autocomplete-wrap {\n        height: auto; }\n      md-autocomplete[md-floating-label] button {\n        top: auto;\n        bottom: 5px; }\n    md-autocomplete md-autocomplete-wrap {\n      display: block;\n      position: relative;\n      overflow: visible;\n      height: 40px; }\n      md-autocomplete md-autocomplete-wrap md-progress-linear {\n        position: absolute;\n        bottom: 0;\n        left: 0;\n        width: 100%;\n        height: 3px;\n        transition: none; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear .md-container {\n          transition: none;\n          top: auto;\n          height: 3px; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter.ng-enter-active {\n            opacity: 1; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave.ng-leave-active {\n            opacity: 0; }\n    md-autocomplete input:not(.md-input) {\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: 100%;\n      box-sizing: border-box;\n      border: none;\n      box-shadow: none;\n      padding: 0 15px;\n      font-size: 14px;\n      line-height: 40px;\n      height: 40px;\n      outline: none;\n      background: transparent; }\n      md-autocomplete input:not(.md-input)::-ms-clear {\n        display: none; }\n    md-autocomplete button {\n      position: absolute;\n      top: 10px;\n      right: 10px;\n      line-height: 20px;\n      text-align: center;\n      width: 20px;\n      height: 20px;\n      cursor: pointer;\n      border: none;\n      border-radius: 50%;\n      padding: 0;\n      font-size: 12px;\n      background: transparent; }\n      md-autocomplete button:after {\n        content: '';\n        position: absolute;\n        top: -6px;\n        right: -6px;\n        bottom: -6px;\n        left: -6px;\n        border-radius: 50%;\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        opacity: 0;\n        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }\n      md-autocomplete button:focus {\n        outline: none; }\n        md-autocomplete button:focus:after {\n          -webkit-transform: scale(1);\n                  transform: scale(1);\n          opacity: 1; }\n      md-autocomplete button md-icon {\n        position: absolute;\n        top: 50%;\n        left: 50%;\n        -webkit-transform: translate3d(-50%, -50%, 0) scale(0.9);\n                transform: translate3d(-50%, -50%, 0) scale(0.9); }\n        md-autocomplete button md-icon path {\n          stroke-width: 0; }\n      md-autocomplete button.ng-enter {\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-enter.ng-enter-active {\n          -webkit-transform: scale(1);\n                  transform: scale(1); }\n      md-autocomplete button.ng-leave {\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-leave.ng-leave-active {\n          -webkit-transform: scale(0);\n                  transform: scale(0); }\n    @media screen and (-ms-high-contrast: active) {\n      md-autocomplete input {\n        border: 1px solid #fff; }\n      md-autocomplete li:focus {\n        color: #fff; } }\n\n  .md-autocomplete-suggestions table, .md-autocomplete-suggestions ul {\n    width:100%;         //added by adam\n    background:white;   //added by adam\n    position: relative;\n    margin: 0;\n    list-style: none;\n    padding: 0;\n    z-index: 100; }\n    .md-autocomplete-suggestions li {\n      line-height: 48px; //separated by adam\n    }\n    .md-autocomplete-suggestions li, .md-autocomplete-suggestions tr {\n      /*added by adam */\n      width:100%;\n      text-align: left;\n      position: static !important;\n      text-transform: none;\n      /* end addition */\n      cursor: pointer;\n      font-size: 14px;\n      overflow: hidden;\n\n      transition: background 0.15s linear;\n      text-overflow: ellipsis; }\n      .md-autocomplete-suggestions li.ng-enter, .md-autocomplete-suggestions li.ng-hide-remove {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-in 0.2s;\n                animation: md-autocomplete-list-in 0.2s; }\n      .md-autocomplete-suggestions li.ng-leave, .md-autocomplete-suggestions li.ng-hide-add {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-out 0.2s;\n                animation: md-autocomplete-list-out 0.2s; }\n      .md-autocomplete-suggestions li:focus {\n        outline: none; }\n  </style>\n</template>\n"; });
define('text!client/src/elems/md-button.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block; height:36px; line-height:36px\">\n  <button\n    ref=\"button\"\n    type=\"button\"\n    disabled.two-way=\"disabled\"\n    click.delegate=\"click($event)\"\n    class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n    style=\"width:100%; height:inherit; line-height:inherit\">\n    <slot style=\"padding:auto\"></slot>\n  </button>\n</template>\n<!-- type=\"button\" because a button inside a form has its type implicitly set to submit. And the spec says that the first button or input with type=\"submit\" is triggered on enter -->\n<!-- two-way because FormCustomAttribute can set button's disabled property directly -->\n"; });
define('text!client/src/elems/md-checkbox.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <label ref=\"label\" class=\"mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect\" style=\"width:100%; margin-right:8px\">\n    <input\n      name = \"pro_input\"\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      tabindex.one-time=\"tabindex\"\n      type=\"checkbox\"\n      class=\"mdl-checkbox__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <slot></slot>\n  </label>\n</template>\n"; });
define('text!client/src/elems/md-drawer.html', ['module'], function(module) { module.exports = "<template>\n    <slot></slot>\n</template>\n"; });
define('text!client/src/elems/md-input.html', ['module'], function(module) { module.exports = "<!-- firefox needs max-height otherwise is oversizes the parent element -->\n<template style=\"display:inline-block; box-sizing:border-box;\">\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; margin-bottom:-12px; padding-top:22px; min-height:19px; line-height:19px; font-size:inherit; text-overflow:inherit; display:block; ${ label.textContent.trim() || 'padding-top:0px'};\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height. -->\n    <input\n      if.bind=\"type != 'number'\"\n      type.bind=\"type\"\n      name=\"input\"\n      ref=\"input\"\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      pattern.bind=\"pattern || '.*'\"\n      placeholder.bind=\"placeholder || ''\"\n      minlength.bind=\"minlength\"\n      maxlength.bind=\"maxlength || 100\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    <input\n      if.bind=\"type == 'number'\"\n      type=\"number\"\n      name=\"input\"\n      ref=\"input\"\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      max.bind=\"max\"\n      min.bind=\"min\"\n      step.bind=\"step\"\n      placeholder.bind=\"placeholder || ''\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    <label ref=\"label\" class=\"mdl-textfield__label\"><slot></slot></label>\n  </div>\n</template>\n"; });
define('text!client/src/elems/md-loading.html', ['module'], function(module) { module.exports = "<!-- vertical-align top is necessary for firefox -->\n<template>\n  <div ref=\"div\" class=\"mdl-progress mdl-js-progress\"></div>\n</template>\n"; });
define('text!client/src/elems/md-menu.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <style>\n    .mdl-menu a { color:inherit }\n  </style>\n  <button\n    ref=\"button\"\n    id.one-time=\"id\"\n    tabindex=\"-1\"\n    class=\"mdl-button mdl-js-button mdl-button--icon\">\n    <i class=\"material-icons\">more_vert</i>\n  </button>\n  <ul click.delegate=\"click($event)\" ref=\"ul\" class=\"mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect\" data-mdl-for.one-time=\"id\">\n    <div><slot></slot></div> <!-- the <div> is necessary for menu to close when click menu item. Not sure why -->\n  </ul>\n</template>\n"; });
define('text!client/src/elems/md-select.html', ['module'], function(module) { module.exports = "<!-- vertical-align top is necessary for firefox -->\n<template style=\"display:inline-block; box-sizing:border-box; vertical-align:top; margin-bottom:8px\">\n  <style>\n  @-moz-document url-prefix() {\n    select {\n       text-indent:-2px;\n    }\n  }\n  </style>\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; ${ label.textContent.trim() ? 'padding-top:22px' : 'padding-top:0px'}; margin-bottom:-12px; min-height:22px; line-height:22px; font-size:inherit;\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height.  Not sure why extra pixels are necessary in chrome and firefox -->\n    <select\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      required.bind=\"required || required === ''\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; border-radius:0; font-size:inherit; font-weight:inherit; text-transform:inherit; -webkit-appearance:none; -moz-appearance:none;\">\n      <option if.bind=\"default\" model.bind=\"default\">\n        ${ property ? default[property] : default }\n      </option>\n      <option model.bind=\"option\" repeat.for=\"option of options\">\n        ${ property ? option[property] : option }\n      </option>\n    </select>\n    <label ref=\"label\" class=\"mdl-textfield__label\" style=\"text-align:inherit;\">\n      <slot></slot>\n    </label>\n  </div>\n</template>\n"; });
define('text!client/src/elems/md-snackbar.html', ['module'], function(module) { module.exports = "<template class=\"mdl-js-snackbar mdl-snackbar\">\n  <div name = \"pro_text\" class=\"mdl-snackbar__text\"></div>\n  <button class=\"mdl-snackbar__action\" type=\"button\"></button>\n</template>\n"; });
define('text!client/src/elems/md-switch.html', ['module'], function(module) { module.exports = "<template>\n  <label ref=\"label\" class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect\" for=\"switch\" style=\"width:100%\">\n    <input\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      type=\"checkbox\"\n      class=\"mdl-switch__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <span class=\"mdl-switch__label\"><slot></slot></span>\n  </label>\n</template>\n"; });
define('text!client/src/elems/md-text.html', ['module'], function(module) { module.exports = "<!-- firefox needs max-height otherwise is oversizes the parent element -->\n<template style=\"display:inline-block; box-sizing:border-box;\">\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; margin-bottom:-12px; padding-top:22px; min-height:19px; line-height:19px; font-size:inherit; text-overflow:inherit; display:block; ${ label.textContent.trim() || 'padding-top:0px'};\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height. -->\n    <textarea\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      placeholder.bind=\"placeholder || ''\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    </textarea>\n    <label ref=\"label\" class=\"mdl-textfield__label\"><slot></slot></label>\n  </div>\n</template>\n"; });
define('text!client/src/views/account.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from='client/src/elems/md-table'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/form\"></require>\n\n  <md-drawer>\n    <md-input value.bind=\"filter\" style=\"padding:0 8px\">Filter Users</md-input>\n    <a\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! user.email ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser({name:{}, account:{_id:session.account._id}})\">\n      <div name = \"pro_new_user\" class=\"mdl-typography--title\">New User</div>\n    </a>\n    <a\n      name = \"existing_users\"\n      repeat.for=\"user of users | userFilter:filter\"\n      class=\"mdl-navigation__link ${ user.phone == $parent.user.phone ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser(user)\">\n      <div class=\"mdl-typography--title\">${ user.name.first+' '+user.name.last}</div>\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div class=\"mdl-card__title\">\n        <div class=\"mdl-card__title-text\">\n          User Information\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\" input.delegate=\"saveUser() & debounce:1000\">\n        <md-input style=\"width:49%\" value.bind=\"user.name.first\" name = \"pro_first_name\" required>First Name</md-input>\n        <md-input style=\"width:49%\" value.bind=\"user.name.last\" name = \"pro_last_name\" required>Last Name</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.email\" type=\"email\" name = \"pro_email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\" required>Email</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.phone\" type=\"tel\" name = \"pro_phone\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Phone</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.password\" name = \"pro_password\" if.bind=\" ! user._rev\" required>Password</md-input>\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised style=\"width:100%\" name = \"pro_create_user_button\" if.bind=\"users.length != 0 && ! user._rev\" form click.delegate=\"addUser()\">Create User</md-button>\n        <md-button color name = \"pro_uninstall_button\" raised style=\"width:100%\" if.bind=\"users.length == 0 || user._id == session._id\" click.delegate=\"logout()\" disabled.bind=\"disableLogout\">${ disableLogout || 'Uninstall' }</md-button>\n        <md-button color=\"accent\" name = \"pro_delete_user_button\" raised style=\"width:100%\" if.bind=\"user._rev && user._id != session._id\" click.delegate=\"deleteUser()\">Delete User</md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <md-menu name=\"pro_menu\" style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li style=\"width:200px\" disabled.bind=\"true\">\n          Export\n          <div style=\"width:80px; float:right;\">Import</div>\n        </li>\n        <a download=\"Transactions ${csvDate}\" href=\"${csvHref}/transaction.csv\"><li>\n          Transactions\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Shipments ${csvDate}\" href=\"${csvHref}/shipment.csv\"><li>\n          Shipments\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Accounts ${csvDate}\" href=\"${csvHref}/account.csv\"><li>\n          Accounts\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Users ${csvDate}\" href=\"${csvHref}/user.csv\"><li>\n          Users\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Drugs ${csvDate}\" href=\"${csvHref}/drug.csv\"><li>\n          Drugs\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n      </md-menu>\n      <div class=\"table-wrap\">\n        <table md-table>\n          <thead>\n            <tr>\n              <th class=\"mdl-data-table__cell--non-numeric\">Authorized</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">\n                <md-select\n                  value.bind=\"type\"\n                  options.bind=\"['From', 'To']\"\n                  style=\"width:50px; font-weight:bold; margin-bottom:-26px\">\n                </md-select>\n              </th>\n              <th class=\"mdl-data-table__cell--non-numeric\">License</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Joined</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Location</th>\n            </tr>\n          </thead>\n          <tr name = \"pro_account\" repeat.for=\"account of accounts\" if.bind=\"account != $parent.account\">\n            <td class=\"mdl-data-table__cell--non-numeric\">\n              <md-checkbox\n                name = \"pro_checkbox\"\n                if.bind=\"type != 'To'\"\n                checked.one-way=\"$parent.account.authorized.indexOf(account._id) != -1\"\n                click.delegate=\"authorize(account._id)\">\n              </md-checkbox>\n              <md-checkbox\n                if.bind=\"type == 'To'\"\n                checked.one-way=\"account.authorized.indexOf($parent.account._id) != -1\"\n                disabled.bind=\"true\">\n              </md-checkbox>\n            </td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.name }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.license }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.createdAt | date }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.city+', '+account.state }</td>\n          </tr>\n        </table>\n      </div>\n    </div>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!client/src/views/drugs.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-table'></require>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-autocomplete\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-text\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <md-drawer>\n    <md-select\n      options.bind=\"['Ordered', 'Inventory < ReorderAt', 'Inventory > ReorderTo', 'Inventory Expiring before Min Days', 'Missing Retail Price', 'Missing Wholesale Price', 'Missing Image']\"\n      style=\"padding:0 8px;\"\n      disabled.bind=\"true\">\n      Quick Search\n    </md-select>\n    <a\n      repeat.for=\"ordered of drawer.ordered\"\n      style=\"font-size:12px; line-height:18px; padding:8px 8px\"\n      class=\"mdl-navigation__link ${ ordered == group.name ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectDrawer(ordered)\">\n      ${ ordered }\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\">\n        <md-input\n          required\n          name = \"pro_ndc_field\"\n          style=\"width:49%\"\n          value.bind=\"drug._id\"\n          disabled.bind=\"drug._rev\"\n          pattern=\"\\d{4}-\\d{4}|\\d{5}-\\d{3}|\\d{5}-\\d{4}\">\n          Product NDC\n        </md-input>\n        <md-input style=\"width:49%\"\n          value.one-way=\"drug._id ? ('00000'+drug._id.split('-').slice(0,1)).slice(-5)+('0000'+drug._id.split('-').slice(1)).slice(-4) : ''\"\n          disabled=\"true\">\n          NDC9\n        </md-input>\n        <div if.bind=\"drug.generics[0].name\" style=\"position:relative\">\n          <md-button color fab=\"11\"\n            show.bind=\"drug.generics[drug.generics.length-1].name\"\n            click.delegate=\"addGeneric()\"\n            style=\"position:absolute; left:153px; margin-top:-5px; z-index:1\">\n            +\n          </md-button>\n          <md-button color fab=\"11\"\n            show.bind=\"! drug.generics[drug.generics.length-1].name\"\n            mousedown.delegate=\"removeGeneric()\"\n            style=\"position:absolute; right:153px; margin-top:-5px; z-index:1\">\n            -\n          </md-button>\n        </div>\n        <div repeat.for=\"generic of drug.generics\">\n          <!--\n          [1-9]{0,2} is for Vitamins which do not have 0 or 10 and can be up to two digits\n          -->\n          <md-input\n            required\n            name = \"pro_gen_field\"\n            style=\"width:75%\"\n            pattern=\"([A-Z][1-9]{0,2}[a-z]*\\s?)+\\b\"\n            value.bind=\"generic.name\">\n            ${ $index == 0 ? 'Generic Names & Strengths' : ''}\n          </md-input>\n          <!--\n          limit units:\n          https://stackoverflow.com/questions/2078915/a-regular-expression-to-exclude-a-word-string\n          ([0-9]+|[0-9]+\\.[0-9]+) Numerator must start with an integer or a decimal with leading digit, e.g, 0.3 not .3\n          (?!ug|gm|meq|hr)[a-z]* Numerator may have units but must substitute the following ug > mcg, gm > g, meq > ~ mg, hr > h\n          (/....)? Denominator is optional\n          ([0-9]+|[0-9]+\\.[0-9]+)? Numerator may start with an integer or a decimal with leading digit.  Unlike numerator, optional because 1 is implied e.g. 1mg/ml or 24mg/h\n          (?!ug|gm|meq|hr)[a-z]*  Numerator may have units but must substitute (see above)\n          -->\n          <md-input\n            style=\"width:23%\"\n            pattern=\"([0-9]+|[0-9]+\\.[0-9]+)(?!ug|gm|meq|hr)[a-z]*(/([0-9]+|[0-9]+\\.[0-9]+)?(?!ug|gm|meq|hr)[a-z]*)?\"\n            value.bind=\"generic.strength\">\n          </md-input>\n        </div>\n        <md-input\n          style=\"width:49%\"\n          pattern=\"([A-Z][a-z]*\\s?){1,2}\\b\"\n          value.bind=\"drug.brand\">\n          Brand Name\n        </md-input>\n        <md-input\n          required\n          name = \"pro_form_field\"\n          style=\"width:49%\"\n          pattern=\"([A-Z][a-z]+\\s?)+\\b\"\n          value.bind=\"drug.form\">\n          Form\n        </md-input>\n        <md-input\n          style=\"width:100%\"\n          value.bind=\"drug.labeler\">\n          Labeler\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.nadac | number\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:49%\">\n          Nadac Price\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.goodrx | number\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:49%\">\n          GoodRx Price\n        </md-input>\n        <md-text\n          style=\"width:100%; font-size:11px\"\n          value.bind=\"drug.warning\">\n          Warning\n        </md-text>\n        <md-input\n          pattern=\"//[a-zA-Z0-9/.\\-_%]+\"\n          value.bind=\"drug.image\"\n          style=\"width:100%; font-size:9px\">\n          ${ drug.image ? 'Image' : 'Image URL'}\n        </md-input>\n        <img\n          style=\"width:100%;\"\n          if.bind=\"drug.image\"\n          src.bind=\"drug.image\">\n      </div>\n      <div class=\"mdl-card__actions\">\n        <!-- <md-button color=\"accent\" raised\n          if.bind=\"drug._rev\"\n          style=\"width:100%;\"\n          disabled\n          click.delegate=\"deleteDrug()\">\n          Delete Drug\n        </md-button> -->\n        <md-button color raised\n          form = \"onchange\"\n          name = \"pro_drug_button\"\n          style=\"width:100%;\"\n          disabled.bind=\"_savingDrug\"\n          click.delegate=\"drug._rev ? saveDrug() : addDrug()\"\n          form>\n          ${ _savingDrug ? 'Saving Drug...' : (drug._rev ? 'Save Drug' : 'Add Drug') }\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <md-autocomplete\n        name = \"pro_searchbar\"\n        placeholder=\"Search Drugs by Generic Name or NDC...\"\n        value.bind=\"term\"\n        input.delegate=\"search() & debounce:50\"\n        keydown.delegate=\"scrollGroups($event) & debounce:50\"\n        style=\"margin:0px 24px; padding-right:15px\">\n        <table md-table>\n          <tr\n            name = \"pro_search_res\"\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectGroup(group, true)\"\n            class=\"${ group.name == $parent.group.name && 'is-selected'}\">\n            <td\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.name.replace(regex, '<strong>$1</strong>')\">\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu name = \"pro_menu\" style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li name = \"menu_add_drug\" if.bind=\"drug._rev\" click.delegate=\"selectDrug()\" class=\"mdl-menu__item\">\n          Add Drug\n        </li>\n        <li name = \"menu_add_drug\" if.bind=\" ! drug._rev\" disabled class=\"mdl-menu__item\">\n          Add Drug\n        </li>\n        <li click.delegate=\"exportCSV()\" class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n        <li click.delegate=\"$file.click()\" class=\"mdl-menu__item\">\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <md-switch\n        name = \"pro_switch\"\n        style=\"position:absolute; right:25px; top:47px; z-index:1\"\n        checked.one-way=\"account.ordered[group.name]\"\n        disabled.bind=\"! account.ordered[group.name] && ! drug._rev\"\n        click.delegate=\"order()\">\n      </md-switch>\n      <div class=\"table-wrap\">\n        <table md-table style=\"width:calc(100% - 216px)\">\n          <thead>\n            <tr>\n              <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Form</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Labeler</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Brand</th>\n              <th style=\"text-align:left; width:40px; padding-left:0;\">Nadac</th>\n              <th style=\"text-align:left; width:${ account.ordered[group.name] ? '40px' : '85px'}; padding-left:0;\">GoodRx</th>\n            </tr>\n          </thead>\n          <tr repeat.for=\"drug of group.drugs\" click.delegate=\"selectDrug(drug)\" class=\"${ drug._id == $parent.drug._id ? 'is-selected' : ''}\">\n            <td class=\"mdl-data-table__cell--non-numeric\">${ drug._id }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ drug.form }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ drug.labeler }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ drug.brand }</td>\n            <td style=\"padding:0; text-align:left\">${ drug.price.nadac | number:3 }</td>\n            <td style=\"padding:0; text-align:left\">${ drug.price.goodrx | number:3 }</td>\n          </tr>\n        </table>\n        <div show.bind=\"account.ordered[group.name]\" input.delegate=\"saveOrder() & debounce:1000\" style=\"width:200px; overflow:hidden; margin-top:10px; margin-right:16px\">\n          Ordered\n          <md-input\n            disabled\n            type=\"number\"\n            value.bind=\"inventory\"\n            style=\"width:100%\">\n            Inventory\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).maxInventory\"\n            placeholder=\"3000\"\n            style=\"width:100%\">\n            Max Inventory\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).minQty\"\n            placeholder=\"1\"\n            style=\"width:100%\">\n            Min Qty\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).minDays\"\n            placeholder=\"60\"\n            style=\"width:100%\">\n            Min Days\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.name] || {}).verifiedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Verified Message\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.name] || {}).destroyedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Destroyed Message\n          </md-input>\n          <md-input\n            pattern=\"\\w{1,4}\"\n            value.bind=\"(account.ordered[group.name] || {}).defaultBin\"\n            style=\"width:100%\">\n            Default Bin\n          </md-input>\n          <md-input\n            type=\"number\"\n            step=\"1\"\n            value.bind=\"(account.ordered[group.name] || {}).price30\"\n            style=\"width:49%\">\n            30 day price\n          </md-input>\n          <md-input\n            type=\"number\"\n            step=\"1\"\n            value.bind=\"(account.ordered[group.name] || {}).price90\"\n            style=\"width:48%\">\n            90 day price\n          </md-input>\n          <md-input\n            type=\"number\"\n            step=\"1\"\n            value.bind=\"(account.ordered[group.name] || {}).vialQty\"\n            style=\"width:48%\">\n            Vial Qty\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.name] || {}).vialSize\"\n            style=\"width:49%\">\n            Vial Size\n          </md-input>\n          <!--\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).minInventory\"\n            style=\"width:100%\">\n            Min Invntory\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).maxPrice\"\n            style=\"width:100%\">\n            Max Price\n          </md-input> -->\n        </div>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!client/src/views/index.html', ['module'], function(module) { module.exports = "<!doctype html>\n<html style=\"overflow:hidden\">\n  <head>\n    <title>Loading SIRUM...</title>\n    <script src=\"client/assets/material.1.1.3.js\"></script>\n    <link rel=\"stylesheet\" href=\"client/assets/material.icon.css\">\n    <link rel=\"stylesheet\" href=\"client/assets/material.1.1.3.css\" />\n    <link rel=\"icon\" type=\"image/x-icon\" href=\"client/assets/favicon.png\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <style>\n    body { background:#eee }\n    a { color:rgb(0,88,123); text-decoration:none }\n\n    /*table-wrap needed because overflow:scroll doesn't work directly on table.  Also it is a conveneint place to do display:flex */\n    .table-wrap { overflow-y:scroll; height:100%; display:flex}\n    /*use flex instead of height:100% because latter was causing the parent md-card to have a scroll bar */\n    [md-table]  { width:100%; flex:1;}\n    /* want hover shadow to be 100% of width, so need to do padding within the tr (which needs this hack) rather than in table-wrap */\n    [md-table] th:first-child { padding-left:24px !important}\n    [md-table] td:first-child { padding-left:24px !important}\n    [md-table] td:last-child  { padding-right:24px !important}\n\n    /*give spacing for the header and the top and bottom gullies */\n    .full-height { height:calc(100vh - 96px); overflow-y:auto}\n\n    .mdl-layout__header { background:white;}\n    .mdl-layout__header, .mdl-layout__drawer, .mdl-layout__header-row .mdl-navigation__link, .mdl-layout__header .mdl-layout__drawer-button { color:rgb(66,66,66);}\n\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link { padding:16px;}\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link--current { border-left:solid 3px red; padding-left:13px; background:#e0e0e0; color:inherit }\n\n    .mdl-layout__header-row .mdl-navigation__link { border-top:solid 3px white; }\n    .mdl-layout__header-row .mdl-navigation__link--current { font-weight:600;  border-top-color:red;}\n\n    .mdl-data-table th { height:auto; padding-top:7px; padding-bottom:0; }\n    .mdl-data-table tbody tr { height:auto }\n    .mdl-data-table td { border:none; padding-top:7px; padding-bottom:7px; height:auto }\n\n    .mdl-button--raised { box-shadow:none } /*otherwise disabled.bind has weird animaiton twitching */\n    .mdl-button--fab.mdl-button--colored{ background:rgb(0,88,123);}\n\n    .mdl-card__supporting-text { width:100%; box-sizing: border-box; overflow-y:auto; flex:1 }\n    .mdl-card__actions { padding:16px }\n    /* animate page transitions */\n    .au-enter-active { animation:slideDown .5s; }\n\n    .mdl-snackbar { left:auto; right:6px; bottom:6px; margin-right:0%; font-size:24px; font-weight:300; max-width:100% }\n    .mdl-snackbar--active { transform:translate(0, 0); -webkit-transform:translate(0, 0); }\n    .mdl-snackbar__text { padding:8px 24px; }\n\n    .mdl-checkbox__tick-outline { width:13px } /*widen by 1px to avoid pixel gap for checkboxes on small screens*/\n\n    @keyframes slideDown {\n      0% {\n        opacity:0;\n        -webkit-transform:translate3d(0, -100%, 0);\n        -ms-transform:translate3d(0, -100%, 0);\n        transform:translate3d(0, -100%, 0)\n      }\n      100% {\n        opacity:.9;\n        -webkit-transform:none;\n        -ms-transform:none;\n        transform:none\n      }\n    }\n\n    /*.au-leave-active {\n      position:absolute;\n      -webkit-animation:slideLeft .5s;\n      animation:slideLeft .5s;\n    }*/\n    </style>\n    <style media=\"print\">\n      .mdl-data-table td { padding-top:4px; padding-bottom:4px; }\n      .hide-when-printed { display:none; }\n\n      /* Start multi-page printing */\n      .table-wrap { overflow-y:visible}\n      .mdl-card { overflow:visible; }\n      .mdl-layout__container { position:static}\n      .full-height { height:100%; overflow-y:visible}\n      /* End multi-page printing */\n\n    </style>\n  </head>\n  <body aurelia-app=\"client/src/views/index\">\n    <div class=\"splash\">\n      <div class=\"message\">Loading SIRUM...</div>\n      <i class=\"fa fa-spinner fa-spin\"></i>\n    </div>\n    <script src=\"pouch/pouchdb-6.1.2.js\"></script>\n    <script src=\"pouch/pouchdb-schema.js\"></script>\n    <script src=\"pouch/pouchdb-model.js\"></script>\n    <script src=\"pouch/pouchdb-client.js\"></script>\n    <script src=\"csv/papa.min.js\"></script>\n    <script src=\"csv/index.js\"></script>\n    <script src=\"client/assets/aurelia.js\" data-main=\"aurelia-bootstrapper\"></script>\n  </body>\n</html>\n"; });
define('text!client/src/views/inventory.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from='client/src/elems/md-table'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-autocomplete\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <style>\n    .mdl-button:hover { background-color:initial }\n    .mdl-badge[data-badge]:after { font-size:9px; height:14px; width:14px; top:1px}\n  </style>\n  <md-drawer>\n    <md-input\n      autoselect\n      style=\"padding:0 8px; width:auto\">\n      Filter pending inventory\n    </md-input>\n    <div repeat.for=\"pendingDrug of pending | toArray\">\n      <div class=\"mdl-typography--title\" style=\"font-size:17px; cursor:default; color:#757575; padding:8px\">${pendingDrug.key}</div>\n      <div\n        name=\"pro_pended_items\"\n        repeat.for=\"pendingAt of pendingDrug.val | toArray\"\n        click.delegate=\"selectTerm('pending', pendingDrug.key+': '+pendingAt.key)\"\n        class=\"mdl-navigation__link ${ term == 'Pending '+pendingDrug.key+': '+pendingAt.key.slice(5, 19) ? 'mdl-navigation__link--current' : ''}\"\n        style=\"cursor:pointer; padding-top:2px; padding-bottom:2px\">\n        ${ pendingAt.key.slice(5, 16) }, ${ pendingAt.val.length } items\n      </div>\n    </div>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height hide-when-printed\"> <!-- ${ !repack || 'background:rgba(0,88,123,.3)' } -->\n      <div show.bind=\"transactions.length\" class=\"mdl-card__supporting-text\" style=\"padding-left:24px; white-space:nowrap\">\n        <div>\n          <div class=\"mdl-card__title\" style=\"padding:4px 0 8px 0\">\n            <div style=\"width:60%\"></div>\n            <div style=\"width:20%\">Qty</div>\n            <div style=\"width:20%\">Count</div>\n          </div>\n          <md-checkbox name = \"pro_checkall\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"toggleVisibleChecks()\" checked.bind=\"filter.checked.visible\">Selected</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${filter.checked.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${filter.checked.count}</div>\n        </div>\n        <div name = \"pro_ndc_filter\" repeat.for=\"ndc of filter.ndc | toArray:true\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Ndc Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(ndc)\" checked.bind=\"ndc.val.isChecked\">${ndc.key}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${ndc.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${ndc.val.count}</div>\n        </div>\n        <div name = \"pro_exp_filter\" repeat.for=\"exp of filter.exp | toArray:true\" style=\"padding:0\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Exp Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(exp)\" checked.bind=\"exp.val.isChecked\">${exp.key.slice(0, 10)}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${exp.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${exp.val.count}</div>\n        </div>\n        <div name = \"pro_repack_filter\" repeat.for=\"repack of filter.repack | toArray:true\" style=\"padding:0\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Repack Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(repack)\" checked.bind=\"repack.val.isChecked\">${repack.key}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${repack.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${repack.val.count}</div>\n        </div>\n        <div name = \"pro_form_filter\" repeat.for=\"form of filter.form | toArray:true\" style=\"padding:0\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Form Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(form)\" checked.bind=\"form.val.isChecked\">${form.key}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${form.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${form.val.count}</div>\n        </div>\n        <!-- <md-input show.bind=\"transactions.length\" input.delegate=\"refreshFilter()\" value.bind=\"filter.rx\" style=\"margin-left:16px;\" class=\"mdl-cell mdl-cell--10-col\">Rx Filter</md-input> -->\n      </div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <md-autocomplete\n        name = \"pro_searchbar\"\n        placeholder.bind=\"placeholder\"\n        value.bind=\"term\"\n        input.delegate=\"search()\"\n        keyup.delegate=\"scrollTerms($event)\"\n        style=\"margin:0px 24px; padding-right:15px\">\n        <table md-table>\n          <tr\n            name = \"pro_search_res\"\n            repeat.for=\"term of terms\"\n            click.delegate=\"selectTerm('drug.generic', term)\"\n            class=\"${ term == $parent.term && 'is-selected'}\">\n            <td\n              style=\"white-space:normal; max-width:70%\"\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"term | bold:$parent.term\">\n            </td>\n            <td style=\"max-width:30%\">\n              ${ ordered[term] ? 'Min Qty:'+(ordered[term].minQty || 10) +', Min Days:'+(ordered[term].minDays || 120) : ''}\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu name = \"pro_menu\" click.delegate=\"openMenu($event)\" style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <li\n          name = \"pro_dispense\"\n          disabled.bind=\" ! transactions.length\"\n          click.delegate=\"dispenseInventory()\">\n          Dispense Selected\n        </li>\n        <li\n          class=\"mdl-menu__item--full-bleed-divider\"\n          disabled.bind=\" ! transactions.length\"\n          click.delegate=\"disposeInventory()\">\n          Dispose Selected\n        </li>\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          name=\"pro_pend\"\n          show.bind=\"term.slice(0,7) == 'Pending'\"\n          disabled.bind=\" ! transactions.length\"\n          click.delegate=\"unpendInventory()\">\n          Unpend Selected\n        </li>\n        <li\n          repeat.for=\"group of pending[transactions[0].drug.generic] | toArray\"\n          show.bind=\"term != 'Pending '+transactions[0].drug.generic+': '+group.key.slice(5, 19)\"\n          name=\"pro_pend\"\n          class=\"mdl-menu__item\"\n          click.delegate=\"pendInventory(group.key)\">\n          Pend to ${group.key.slice(5, 16)}\n        </li>\n        <li\n          name=\"pro_pend\"\n          disabled.bind=\" ! transactions.length\"\n          click.delegate=\"pendInventory()\"\n          class=\"mdl-menu__item--full-bleed-divider\">\n          Pend to New\n        </li>\n        <form>\n          <li form\n            name = \"pro_repack_selected\"\n            click.delegate=\"repackInventory()\">\n            Repack Selected\n          </li>\n          <li>\n            <md-input\n              required\n              type=\"number\"\n              name = \"pro_repack_qty\"\n              value.bind=\"repack.vialQty\"\n              max.bind=\"repack.totalQty/(repack.vials >= 1 ? repack.vials : 1)\"\n              input.delegate=\"setRepackVials()\"\n              style=\"width:40px;\">\n              Qty\n            </md-input>\n            <md-input\n              required\n              type=\"number\"\n              name = \"pro_repack_vials\"\n              value.bind=\"repack.vials\"\n              min=\"1\"\n              style=\"width:40px;\">\n              Vials\n            </md-input>\n            <md-input\n              required\n              name = \"pro_repack_exp\"\n              value.bind=\"repack.exp | date\"\n              style=\"width:40px;\">\n              Exp\n            </md-input>\n            <md-input\n              required\n              name = \"pro_repack_bin\"\n              value.bind=\"repack.bin\"\n              pattern=\"[A-Z]\\d{2}\"\n              style=\"width:40px;\">\n              Bin\n            </md-input>\n          </li>\n        </form>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div class=\"table-wrap\">\n        <table md-table>\n          <thead>\n            <tr>\n              <th style=\"width:50px; padding:0\"></th>\n              <th class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0\">Drug</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Form</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n              <th style=\"text-align:left; width:60px;\">Exp</th>\n              <th style=\"text-align:left; width:60px;\">Qty</th>\n              <th style=\"text-align:left; width:60px;\">Bin</th>\n              <th style=\"width:60px\"></th>\n            </tr>\n          </thead>\n          <tr name = \"pro_transaction\" repeat.for=\"transaction of transactions | inventoryFilter:filter\" input.delegate=\"saveTransaction(transaction) & debounce:1000\">\n            <td style=\"padding:0\">\n              <md-checkbox name = \"pro_transaction_checkbox\" click.delegate=\"toggleCheck(transaction)\" checked.bind=\"transaction.isChecked\"></md-checkbox>\n            </td>\n            <td class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0\">${ transaction.drug.generic }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug.form }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '')}</td>\n            <td style=\"padding:0\">\n              <md-input\n                name = \"pro_transaction_exp\"\n                id.bind=\"'exp_'+$index\"\n                required\n                keydown.delegate=\"expShortcuts($event, $index)\"\n                pattern=\"(0?[1-9]|1[012])/\\d{2}\"\n                value.bind=\"transaction.exp.to | date\"\n                style=\"width:40px; margin-bottom:-8px\"\n                placeholder>\n              </md-input>\n            </td>\n            <td style=\"padding:0\">\n              <md-input\n                name = \"pro_transaction_qty\"\n                id.bind=\"'qty_'+$index\"\n                required\n                keydown.delegate=\"qtyShortcutsKeydown($event, $index)\"\n                input.trigger=\"qtyShortcutsInput($event, $index)\"\n                disabled.bind=\"transaction.next[0] && ! transaction.next[0].pending\"\n                type=\"number\"\n                value.bind=\"transaction.qty.to | number\"\n                style=\"width:40px; margin-bottom:-8px\"\n                max.bind=\"999\"\n                placeholder>\n              </md-input>\n            </td>\n            <!-- <td style=\"padding:0\">\n              <md-input\n                value.bind=\"transaction.rx.from\"\n                style=\"width:40px; margin-bottom:-8px\"\n                placeholder>\n              </md-input>\n            </td> -->\n            <td style=\"padding:0\">\n              <md-input\n                name = \"pro_transaction_bin\"\n                id.bind=\"'bin_'+$index\"\n                required\n                keydown.delegate=\"binShortcuts($event, $index)\"\n                keyup.delegate=\"saveTransaction(transaction) & debounce:1000\"\n                pattern=\"[A-Z]\\d{2,3}\"\n                value.bind=\"transaction.bin | upperCase\"\n                style=\"width:40px; margin-bottom:-8px\"\n                maxlength.bind=\"4\"\n                placeholder>\n              </md-input>\n            </td>\n            <td name=\"pro_repack_icon\" style=\"padding:0 0 0 16px\">\n              <i name=\"pro_icon\" show.bind=\"isRepacked(transaction)\" class=\"material-icons\" style=\"font-size:20px\">delete_sweep</i>\n            </td>\n          </tr>\n        </table>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!client/src/views/join.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-loading\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <style>md-input { height:65px }</style>\n  <section class=\"mdl-grid\" style=\"height:80vh;\">\n    <form class=\"mdl-cell mdl-cell--11-col mdl-cell--middle mdl-grid\" style=\"margin:0 auto; max-width:930px\">\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col\" style=\"padding:16px\">\n        <div class=\"mdl-card__title\" style=\"padding-left:0\">\n          <div class=\"mdl-card__title-text\">\n            Register Your Facility\n          </div>\n        </div>\n        <md-input value.bind=\"account.name\" name = \"pro_facility\" required>Facility</md-input>\n        <md-input value.bind=\"account.license\" name = \"pro_license\" required>License</md-input>\n        <md-input value.bind=\"account.phone\" type=\"tel\" name = \"pro_facility_phone\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Facility Phone</md-input>\n        <md-input value.bind=\"account.street\" name = \"pro_street\" required>Street</md-input>\n        <div class=\"mdl-grid\" style=\"padding:0; margin:0 -8px\">\n          <md-input value.bind=\"account.city\" name = \"pro_city\" class=\"mdl-cell mdl-cell--7-col\" required>City</md-input>\n          <md-input value.bind=\"account.state\" name = \"pro_state\" class=\"mdl-cell mdl-cell--2-col\" required>State</md-input>\n          <md-input value.bind=\"account.zip\" name = \"pro_zip\" class=\"mdl-cell mdl-cell--3-col\" required>Zip</md-input>\n        </div>\n        <span class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px; margin-bottom:-8px\">${ loading }</span>\n      </div>\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col\" style=\"padding:16px\">\n        <div class=\"mdl-grid\" style=\"padding:0; margin:-8px\">\n          <md-input value.bind=\"user.name.first\" name = \"pro_first_name\" class=\"mdl-cell mdl-cell--6-col\" required>First Name</md-input>\n          <md-input value.bind=\"user.name.last\" name = \"pro_last_name\" class=\"mdl-cell mdl-cell--6-col\" required>Last Name</md-input>\n        </div>\n        <md-input value.bind=\"user.email\" type=\"email\" name = \"pro_email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\" required>Email</md-input>\n        <md-input value.bind=\"user.phone\" type=\"tel\" name = \"pro_personal_phone\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Personal Phone</md-input>\n        <md-input value.bind=\"user.password\" name = \"pro_password\" required>Password</md-input>\n        <md-checkbox checked.bind=\"accept\" name = \"pro_checkbox\" style=\"margin:20px 0 28px\" required>I accept the terms of use</md-checkbox>\n        <md-button raised color form disabled.bind=\"disabled\" name = \"pro_install\" click.delegate=\"join()\">Install</md-button>\n        <md-loading value.bind=\"progress.last_seq/progress.update_seq * 100\"></md-loading>\n      </div>\n    </form>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!client/src/views/login.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-loading\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <section class=\"mdl-grid\" style=\"margin-top:30vh;\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col mdl-cell--middle\" style=\"width:100%; margin:-75px auto 0; padding:48px 96px 28px 96px; max-width:450px\">\n      <md-input name = \"pro_phone\" value.bind=\"phone\" type=\"tel\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Phone</md-input>\n      <md-input name = \"pro_password\" value.bind=\"password\" type=\"password\" required minlength=\"4\">Password</md-input>\n      <md-button\n        name = \"pro_button\"\n        raised color form\n        click.delegate=\"login()\"\n        disabled.bind=\"disabled\"\n        style=\"padding-top:16px\">\n        Login\n      </md-button>\n      <md-loading value.bind=\"progress.last_seq/progress.update_seq * 100\"></md-loading>\n      <p class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px\">${ loading ? (progress.last_seq/progress.update_seq * 100).toFixed(0)+'%': '' } ${ loading }</p>\n    </form>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!client/src/views/records.html', ['module'], function(module) { module.exports = "<template>\n  <style>\n    .mdl-layout__drawer {\n      width:450px;\n      transform: translateX(-550px);\n      transition-duration: 0.5s;\n    }\n    .mdl-navigation__link--current a:hover {\n      color:rgb(66, 66, 66) !important;\n      font-weight:600;\n    }\n  </style>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from='client/src/elems/md-table'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <md-drawer>\n    <md-select\n      style=\"padding:11px 8px 0; width:auto; font-size:16px; margin-bottom:0\"\n      value.bind=\"record\"\n      property=\"label\"\n      options.bind=\"recordTypes\">\n    </md-select>\n    <div style=\"padding-left:16px;\">\n      <div style=\"width:52px; display:inline-block;\">Month/Day</div>\n      <div style=\"width:90px; display:inline-block; text-align:right\">Count</div>\n      <div style=\"width:90px; display:inline-block; text-align:right\">RXs</div>\n      <div style=\"width:110px; display:inline-block; text-align:right\">Value</div>\n    </div>\n    <div\n      repeat.for=\"month of months\"\n      click.delegate=\"selectMonth(month)\"\n      class=\"mdl-navigation__link ${ month == $parent.month ? 'mdl-navigation__link--current' : ''}\">\n      <div style=\"width:52px; display:inline-block\">${ month.date.slice(0, 7) }</div>\n      <div style=\"width:90px; display:inline-block; text-align:right\">${month.count[record.value].toFixed(0)}</div>\n      <div style=\"width:90px; display:inline-block; text-align:right\">${month.rxs[record.value].toFixed(0)}</div>\n      <div style=\"width:110px; display:inline-block; text-align:right\">${month.value[record.value].toFixed(0)}</div>\n      <a\n        class=\"mdl-navigation__link\"\n        style=\"padding:0;\"\n        if.bind=\"month == $parent.month\"\n        repeat.for=\"day of days\"\n        click.delegate=\"selectDay(day.date, $event)\">\n        <div style=\"width:52px; display:inline-block; text-align:right\">${ day.date.slice(-2) }</div>\n        <div style=\"width:90px; display:inline-block; text-align:right\">${day.count[record.value].toFixed(0)}</div>\n        <div style=\"width:90px; display:inline-block; text-align:right\">${day.rxs[record.value].toFixed(0)}</div>\n        <div style=\"width:110px; display:inline-block; text-align:right\">${day.value[record.value].toFixed(0)}</div>\n      </a>\n    </div>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell full-height\" style=\"width:424px\">\n      <div class=\"mdl-card__title\" style=\"padding-left:16px\">\n        <div class=\"mdl-card__title-text\">\n          Transaction History\n        </div>\n      </div>\n      <div innerHTML.bind=\"history\" class=\"mdl-grid\" style=\"font-size:10px; font-family:Monaco; margin:0; padding:0 16px; white-space:pre; line-height:15px\"></div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell full-height\" style=\"width:calc(100% - 424px - 32px)\">\n      <button id=\"import-export\"\n        style=\"position:absolute; z-index:2; text-align:right; top:5px; right:5px;\"\n        class=\"mdl-button mdl-js-button mdl-button--icon\">\n        <i class=\"material-icons\">more_vert</i>\n      </button>\n      <ul class=\"mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect\" for=\"import-export\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          show.bind=\"false\"\n          click.delegate=\"exportCSV()\"\n          class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n        <li\n          show.bind=\"true\"\n          disabled\n          class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n      </ul>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div class=\"table-wrap\">\n        <table md-table>\n          <thead>\n            <tr>\n              <th style=\"width:15px\"></th>\n              <th style=\"text-align:left;\">Drug</th>\n              <th style=\"text-align:left;\">Ndc</th>\n              <th style=\"text-align:left; width:5%;\">Exp</th>\n              <th style=\"width:5%\">Qty</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr repeat.for=\"transaction of transactions\" class=\"${ $parent.transaction != transaction || 'is-selected'}\" click.delegate=\"selectTransaction(transaction)\">\n              <td style=\"padding:0 0 0 8px\">\n                <md-checkbox\n                  disabled.one-time=\"true\"\n                  checked.bind=\"transaction.verifiedAt\">\n                </md-checkbox>\n              </td>\n              <td style=\"text-align:left; white-space:normal;\">\n                ${ transaction.drug.generic }\n              </td>\n              <td style=\"text-align:left;\">\n                ${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') }\n              </td>\n              <td style=\"text-align:left;\">\n                ${ (transaction.exp.to || transaction.exp.from).slice(0, 10) }\n              </td>\n              <td>\n                ${ transaction.qty.to || transaction.qty.from }\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n  </section>\n</template>\n"; });
define('text!client/src/views/routes.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"mdl-layout mdl-js-layout mdl-layout--fixed-header\">\n    <header class=\"mdl-layout__header hide-when-printed\">\n      <div class=\"mdl-layout__header-row\">\n        <img src=\"client/assets/SIRUM.logo.notag.png\" style=\"width:100px; margin-left:-16px\">\n        <span class=\"mdl-layout-title\"></span>\n        <!-- Add spacer, to align navigation to the right -->\n        <div class=\"mdl-layout-spacer\"></div>\n        <nav class=\"mdl-navigation\">\n          <a repeat.for=\"route of routes\" show.bind=\"route.isVisible\" class=\"mdl-navigation__link ${route.isActive ? 'mdl-navigation__link--current' : ''}\" href.bind=\"route.href\" style=\"\">\n            ${route.title}\n          </a>\n        </nav>\n      </div>\n    </header>\n    <main class=\"mdl-layout__content\">\n      <!-- http://stackoverflow.com/questions/33636796/chrome-safari-not-filling-100-height-of-flex-parent -->\n      <router-view style=\"display:block;\"></router-view>\n    </main>\n  </div>\n</template>\n"; });
define('text!client/src/views/shipments.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from='client/src/elems/md-table'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/md-autocomplete\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <md-drawer autofocus>\n    <md-input\n      name = \"pro_filter_input\"\n      value.bind=\"filter\"\n      autoselect\n      style=\"padding:0 8px; width:auto\">\n      Filter shipments ${ role.accounts } you\n    </md-input>\n    <!-- <md-switch\n      checked.one-way=\"role.account == 'to'\"\n      click.delegate=\"swapRole()\"\n      style=\"margin:-33px 0 0 185px;\">\n    </md-switch> -->\n    <a\n      name = \"new_shipment\"\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment(null, true)\">\n      <div class=\"mdl-typography--title\">New Shipment</div>\n      or add inventory\n    </a>\n    <a\n      name = \"pro_shipments\"\n      repeat.for=\"shipment of shipments[role.shipments] | shipmentFilter:filter\"\n      class=\"mdl-navigation__link ${ shipment._id == shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment(shipment, true)\">\n      <div class=\"mdl-typography--title\" innerHtml.bind=\"shipment.account[role.accounts].name | bold:filter\"></div>\n      <div style=\"font-size:12px\" innerHtml.bind=\"shipment._id.slice(11, 21)+', '+(shipment.tracking.slice(-6) || shipment.tracking) | bold:filter\"></div>\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height\">\n      <div class=\"mdl-card__title\" style=\"display:block;\">\n        <div class=\"mdl-card__title-text\" style=\"text-transform:capitalize\">\n          ${ shipment._rev ? 'Shipment '+(shipment.tracking.slice(-6) || shipment.tracking) : 'New Shipment '+role.accounts+' You' }\n        </div>\n        <div style=\"margin-top:3px; margin-bottom:-25px\">\n          <strong>${transactions.length}</strong> items worth\n          <strong>$${ transactions | value:0:transactions.length }</strong>\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\">\n        <md-select\n          if.bind=\"role.shipments == 'from' || shipment._rev\"\n          change.delegate=\"setCheckboxes()\"\n          style=\"width:100%\"\n          value.bind=\"shipment\"\n          default.bind=\"{tracking:'New Tracking #', account:{from:account, to:account}}\"\n          options.bind=\"shipments[role.shipments]\"\n          property=\"tracking\">\n          Tracking #\n        </md-select>\n        <md-input\n          name = \"pro_tracking_input\"\n          if.bind=\"role.shipments == 'to' && ! shipment._rev\"\n          focusin.delegate=\"setCheckboxes()\"\n          autofocus\n          required\n          style=\"width:100%\"\n          pattern=\"[a-zA-Z\\d]{6,}\"\n          value.bind=\"shipment.tracking\">\n          Tracking #\n        </md-input>\n        <md-select\n          name = \"pro_from_option\"\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.from\"\n          options.bind=\"(role.accounts == 'to' || shipment._rev) ? [shipment.account.from] : accounts[role.accounts]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.accounts == 'to'\">\n          <!-- disabled is for highlighting the current role -->\n          From\n        </md-select>\n        <md-select\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.to\"\n          options.bind=\"(role.accounts == 'from' || shipment._rev) ? [shipment.account.to] : accounts[role.accounts]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.accounts == 'from'\">\n          <!-- disabled is for highlighting the current role -->\n          To\n        </md-select>\n        <md-select\n          style=\"width:32%;\"\n          value.bind=\"shipment.status\"\n          options.bind=\"stati\"\n          disabled.bind=\"! shipment._rev\">\n          Status\n        </md-select>\n        <md-input\n          type=\"date\"\n          style=\"width:64%; margin-top:20px\"\n          value.bind=\"shipment[shipment.status+'At']\"\n          disabled.bind=\"! shipment._rev\"\n          input.delegate=\"saveShipment() & debounce:1500\">\n        </md-input>\n        <!-- <md-select\n          style=\"width:100%\"\n          value.bind=\"attachment.name\"\n          change.delegate=\"getAttachment()\"\n          options.bind=\"['','Shipping Label', 'Manifest']\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Attachment\n        </md-select>\n        <md-button color\n          if.bind=\"attachment.name\"\n          click.delegate=\"upload.click()\"\n          style=\"position:absolute; right:18px; margin-top:-48px; height:24px; line-height:24px\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Upload\n        </md-button>\n        <input\n          type=\"file\"\n          ref=\"upload\"\n          change.delegate=\"setAttachment(upload.files[0])\"\n          style=\"display:none\">\n        <div if.bind=\"attachment.url\" style=\"width: 100%; padding-top:56px; padding-bottom:129%; position:relative;\">\n          <embed\n            src.bind=\"attachment.url\"\n            type.bind=\"attachment.type\"\n            style=\"position:absolute; height:100%; width:100%; top:0; bottom:0\">\n        </div> -->\n        <!-- The above padding / positioning keeps a constant aspect ratio for the embeded pdf  -->\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised form\n          name = \"pro_create_button\"\n          ref=\"newShipmentButton\"\n          style=\"width:100%\"\n          show.bind=\"shipment._id == shipmentId && ! shipment._rev\"\n          click.delegate=\"createShipment()\">\n          New Shipment Of ${ diffs.length || 'No' } Items\n        </md-button>\n        <md-button color raised\n          ref=\"moveItemsButton\"\n          style=\"width:100%\"\n          show.bind=\"shipment._id != shipmentId\"\n          disabled.bind=\"! diffs.length || ! shipment.account.to._id\"\n          click.delegate=\"shipment._rev ? moveTransactionsToShipment(shipment) : createShipment()\">\n          Move ${ diffs.length } Items\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <!-- disabled.bind=\"! searchReady\" -->\n      <md-autocomplete\n        name = \"pro_searchbar\"\n        value.bind=\"term\"\n        input.delegate=\"search() & debounce:50\"\n        keydown.delegate=\"autocompleteShortcuts($event) & debounce:50\"\n        disabled.bind=\"! shipment._rev\"\n        style=\"margin:0px 24px\">\n        <table md-table>\n          <tr\n            repeat.for=\"drug of drugs\"\n            click.delegate=\"addTransaction(drug)\"\n            class=\"${ drug._id == $parent.drug._id && 'is-selected'}\">\n            <td innerHTML.bind=\"drug.generic | bold:term\" style=\"white-space:normal; max-width:70%\" class=\"mdl-data-table__cell--non-numeric\" ></td>\n            <td innerHTML.bind=\"drug._id + (drug.pkg ? '-'+drug.pkg : '')\" style=\"max-width:30%\" class=\"mdl-data-table__cell--non-numeric\" ></td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          show.bind=\"transactions.length\"\n          click.delegate=\"exportCSV()\">\n          Export CSV\n        </li>\n        <li\n          show.bind=\"!transactions.length\"\n          disabled>\n          Export CSV\n        </li>\n        <li\n          show.bind=\"role.accounts != 'to' || shipment._rev\"\n          click.delegate=\"$file.click()\">\n          Import CSV\n        </li>\n        <li\n          show.bind=\"role.accounts == 'to' && ! shipment._rev\"\n          disabled>\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div class=\"table-wrap\">\n        <table md-table>\n          <thead>\n            <tr>\n              <th style=\"width:56px\"></th>\n              <th class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0\">Drug</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n              <th style=\"width:40px; padding-left:0; padding-right:0px\">Value</th>\n              <th style=\"text-align:left; width:60px;\">Exp</th>\n              <th style=\"text-align:left; width:60px\">Qty</th>\n              <!-- 84px account for the 24px of padding-right on index.html's css td:last-child -->\n              <th style=\"text-align:left; width:84px;\">Bin</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr style=\"padding-top:7px;\" name = \"pro_transaction\" repeat.for=\"transaction of transactions\" input.delegate=\"saveTransaction(transaction) & debounce:1500\">\n              <td style=\"padding:0 0 0 8px\">\n                <!-- if you are selecting new items you received to add to inventory, do not confuse these with the currently checked items -->\n                <!-- if you are selecting items to move to a new shipment, do not allow selection of items already verified by recipient e.g do not mix saving new items and removing old items, you must do one at a time -->\n                <!-- since undefined != false we must force both sides to be booleans just to show a simple inequality. use verifiedAt directly rather than isChecked because autocheck coerces isChecked to be out of sync -->\n                <md-checkbox\n                  name = \"pro_checkbox\"\n                  click.delegate=\"manualCheck($index)\"\n                  disabled.bind=\" ! moveItemsButton.offsetParent && ! newShipmentButton.offsetParent && transaction.next.length\"\n                  checked.bind=\"transaction.isChecked\">\n                </md-checkbox>\n              </td>\n              <td click.delegate=\"focusInput('#exp_'+$index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0\">\n                ${ transaction.drug.generic }\n              </td>\n              <td click.delegate=\"focusInput('#exp_'+$index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"padding:0\">\n                ${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') }\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction | value:2:transaction.qty[role.shipments] }\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.exp[role.accounts] | date}\n                <md-input\n                  name = \"pro_exp\"\n                  id.bind=\"'exp_'+$index\"\n                  required\n                  keydown.delegate=\"expShortcutsKeydown($event, $index)\"\n                  input.trigger=\"expShortcutsInput($index)\"\n                  disabled.bind=\"transaction.next.length\"\n                  pattern=\"(0?[1-9]|1[012])/\\d{2}\"\n                  value.bind=\"transaction.exp[role.shipments] | date\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.qty[role.accounts] }\n                  <!-- input event is not triggered on enter, so use keyup for qtyShortcutes instead   -->\n                  <!-- keyup rather than keydown because we want the new quantity not the old one -->\n                  <md-input\n                    name = \"pro_qty\"\n                    id.bind=\"'qty_'+$index\"\n                    required\n                    keydown.delegate=\"qtyShortcutsKeydown($event, $index)\"\n                    input.trigger=\"qtyShortcutsInput($event, $index)\"\n                    disabled.bind=\"transaction.next.length\"\n                    type=\"number\"\n                    value.bind=\"transaction.qty[role.shipments] | number\"\n                    style=\"width:40px; margin-bottom:-8px\"\n                    max.bind=\"999\"\n                    placeholder>\n                  </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  name = \"pro_bin\"\n                  id.bind=\"'bin_'+$index\"\n                  required\n                  disabled.bind=\" ! transaction.verifiedAt || transaction.next.length\"\n                  keyup.delegate=\"setBin(transaction) & debounce:1500\"\n                  keydown.delegate=\"binShortcuts($event, $index)\"\n                  pattern=\"[A-Z]\\d{3}\"\n                  maxlength.bind=\"4\"\n                  value.bind=\"transaction.bin | upperCase\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n    <dialog ref=\"dialog\" class=\"mdl-dialog\">\n    <h4 class=\"mdl-dialog__title\">Drug Warning</h4>\n    <div class=\"mdl-dialog__content\">${drug.warning}</div>\n    <div class=\"mdl-dialog__actions\">\n      <md-button click.delegate=\"dialogClose()\">Agree</md-button>\n    </div>\n  </dialog>\n  </section>\n</template>\n"; });
//# sourceMappingURL=assets/client.js.map