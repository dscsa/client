define('environment',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: true
  };
});
define('elems/md-autocomplete',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
define('elems/md-button',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
      if (!this.disabledOrInvalid) this.element.dispatchEvent(new MouseEvent($event.type, $event));
    };

    MdButtonCustomElement.prototype.disabledChanged = function disabledChanged() {
      this.button && this.change();
    };

    MdButtonCustomElement.prototype.change = function change(input) {
      this.disabledOrInvalid = this.disabled || this.disabled === '' || this.formElement && !this.formElement.checkValidity();
    };

    MdButtonCustomElement.prototype.attached = function attached() {
      var _button$classList;

      if (this.form === '') {
        this.formElement = this.element.closest('form');
        this.formElement.addEventListener('change', this.change);
        this.formElement.addEventListener('input', this.change);
      }

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
        this.button.style['text-align'] = "left";
      }
    };

    return MdButtonCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
});
define('elems/md-checkbox',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
        return _this2.label && _this2.label.MaterialCheckbox.checkToggleState();
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
define('elems/md-drawer',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
define('elems/md-input',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class;

  var MdInputCustomElement = exports.MdInputCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'value', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('disabled'), _dec3 = (0, _aureliaFramework.bindable)('pattern'), _dec4 = (0, _aureliaFramework.bindable)('step'), _dec5 = (0, _aureliaFramework.bindable)('type'), _dec6 = (0, _aureliaFramework.bindable)('placeholder'), _dec7 = (0, _aureliaFramework.bindable)('input'), _dec8 = (0, _aureliaFramework.bindable)('max'), _dec9 = (0, _aureliaFramework.bindable)('required'), _dec10 = (0, _aureliaFramework.bindable)('minlength'), _dec11 = (0, _aureliaFramework.bindable)('autofocus'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = _dec6(_class = _dec7(_class = _dec8(_class = _dec9(_class = _dec10(_class = _dec11(_class = function () {
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
        return _this2.div && _this2.div.MaterialTextfield && _this2.div.MaterialTextfield.checkDisabled();
      });
    };

    MdInputCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeElement(this.div);

      if (!this.placeholder) this.div.classList.remove('has-placeholder');

      if (this.autofocus || this.autofocus === '') this.div.MaterialTextfield.input_.focus();
    };

    return MdInputCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
});
define('elems/md-loading',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
define('elems/md-menu',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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

  var MdMenuCustomElement = exports.MdMenuCustomElement = (_dec = (0, _aureliaFramework.inject)(Element), _dec(_class = function () {
    function MdMenuCustomElement(element) {
      _classCallCheck(this, MdMenuCustomElement);

      this.id = 'id' + Date.now();
      this.element = element;
    }

    MdMenuCustomElement.prototype.attached = function attached() {
      for (var _iterator = this.element.querySelectorAll('li'), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var li = _ref;

        li.classList.add('mdl-menu__item');
      }
    };

    return MdMenuCustomElement;
  }()) || _class);
});
define('elems/md-select',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
        return _this.div && _this.div.MaterialTextfield.checkDisabled();
      });
    };

    MdSelectCustomElement.prototype.valueChanged = function valueChanged() {
      var _this2 = this;

      setTimeout(function (_) {
        return _this2.div && _this2.div.MaterialTextfield.checkDirty();
      });
    };

    MdSelectCustomElement.prototype.attached = function attached() {
      componentHandler.upgradeElement(this.div);
    };

    return MdSelectCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
});
define('elems/md-shadow',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
define('elems/md-snackbar',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
    };

    return MdSnackbarCustomElement;
  }()) || _class) || _class);
});
define('elems/md-switch',['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
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
define('elems/md-table',["exports", "aurelia-framework"], function (exports, _aureliaFramework) {
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
define('libs/csv',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Csv = Csv;
});
define('libs/environment',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: true
  };
});
define('libs/pouch',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Db = Db;
});
define('resources/helpers',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.incrementBox = incrementBox;
  exports.saveTransaction = saveTransaction;
  exports.scrollSelect = scrollSelect;
  exports.focusInput = focusInput;
  exports.toggleDrawer = toggleDrawer;
  exports.drugSearch = drugSearch;
  exports.parseUserDate = parseUserDate;
  exports.toJsonDate = toJsonDate;
  function incrementBox($event, transaction) {
    if ($event.which == 107 || $event.which == 187) {
      transaction.location = transaction.location[0] + (+transaction.location.slice(1) + 1);
      return false;
    }

    if ($event.which == 109 || $event.which == 189) {
      transaction.location = transaction.location[0] + (+transaction.location.slice(1) - 1);
      return false;
    }

    return true;
  }

  function saveTransaction(transaction) {
    var _this = this;

    return Promise.resolve(this._saveTransaction).then(function (_) {
      return _this._saveTransaction = _this.db.transaction.put(transaction);
    });
  }

  function scrollSelect($event, curr) {
    var list = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
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

  function drugSearch() {
    var term = (this.term || '').trim();

    if (term.length < 3) {
      return Promise.resolve(this._search = []);
    }

    if (/^[\d-]+$/.test(term)) {
      this.regex = RegExp('(' + term + ')', 'gi');
      this._search = this.db.drug.get({ ndc: term });
    } else {
      this.regex = RegExp('(' + term.replace(/ /g, '|') + ')', 'gi');
      this._search = this.db.drug.get({ generic: term });
    }

    return this._search;
  }

  function parseUserDate(date) {
    date = (date || "").split('/');
    return {
      year: date.pop(),
      month: date.shift()
    };
  }

  function toJsonDate(_ref) {
    var month = _ref.month;
    var year = _ref.year;

    var date = new Date('20' + year, month, 1);
    date.setDate(0);
    return date.toJSON();
  }
});
define('resources/value-converters',['exports', '../resources/helpers'], function (exports, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.inventoryFilterValueConverter = exports.toArrayValueConverter = exports.dateValueConverter = exports.boldValueConverter = exports.valueValueConverter = exports.userFilterValueConverter = exports.recordFilterValueConverter = exports.shipmentFilterValueConverter = exports.numberValueConverter = exports.jsonValueConverter = undefined;

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
      var object = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      return JSON.stringify(object, null, " ");
    };

    return jsonValueConverter;
  }();

  var numberValueConverter = exports.numberValueConverter = function () {
    function numberValueConverter() {
      _classCallCheck(this, numberValueConverter);
    }

    numberValueConverter.prototype.fromView = function fromView(str, decimals) {
      return str != null && str !== '' ? +str : null;
    };

    numberValueConverter.prototype.toView = function toView(str, decimals) {
      return str != null && decimals ? (+str).toFixed(decimals) : str;
    };

    return numberValueConverter;
  }();

  var shipmentFilterValueConverter = exports.shipmentFilterValueConverter = function () {
    function shipmentFilterValueConverter() {
      _classCallCheck(this, shipmentFilterValueConverter);
    }

    shipmentFilterValueConverter.prototype.toView = function toView() {
      var shipments = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      filter = filter.toLowerCase();
      return shipments.filter(function (shipment) {
        return ~(shipment.account.from.name + ' ' + shipment.account.to.name + ' ' + shipment.tracking + ' ' + shipment.status + ' ' + shipment.createdAt.slice(0, 10)).toLowerCase().indexOf(filter);
      });
    };

    return shipmentFilterValueConverter;
  }();

  var recordFilterValueConverter = exports.recordFilterValueConverter = function () {
    function recordFilterValueConverter() {
      _classCallCheck(this, recordFilterValueConverter);
    }

    recordFilterValueConverter.prototype.toView = function toView() {
      var days = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      return days.filter(function (day) {
        return ~day.indexOf(filter);
      });
    };

    return recordFilterValueConverter;
  }();

  var userFilterValueConverter = exports.userFilterValueConverter = function () {
    function userFilterValueConverter() {
      _classCallCheck(this, userFilterValueConverter);
    }

    userFilterValueConverter.prototype.toView = function toView() {
      var users = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      filter = filter.toLowerCase();
      return users.filter(function (user) {
        return ~(user.name.first + ' ' + user.name.last).toLowerCase().indexOf(filter);
      });
    };

    return userFilterValueConverter;
  }();

  var valueValueConverter = exports.valueValueConverter = function () {
    function valueValueConverter() {
      _classCallCheck(this, valueValueConverter);
    }

    valueValueConverter.prototype.toView = function toView() {
      var transactions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
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
      bold = RegExp('(' + bold.replace(/ /g, '|') + ')', 'gi');
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
      var add = date.includes('+') || date.includes('=');
      var sub = date.includes('-');

      var _parseUserDate = (0, _helpers.parseUserDate)(date.replace(/\+|\-|\=/g, ''));

      var month = _parseUserDate.month;
      var year = _parseUserDate.year;


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
      var obj = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var sort = arguments[1];


      var arr = Object.keys(obj);

      if (sort) arr.sort();

      return arr.map(function (key) {
        return { key: key, val: obj[key] };
      });
    };

    return toArrayValueConverter;
  }();

  var inventoryFilterValueConverter = exports.inventoryFilterValueConverter = function () {
    function inventoryFilterValueConverter() {
      _classCallCheck(this, inventoryFilterValueConverter);
    }

    inventoryFilterValueConverter.prototype.toView = function toView() {
      var transactions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments[1];

      for (var _iterator = transactions, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var transaction = _ref;

        var exp = transaction.exp.to || transaction.exp.from;
        var ndc = transaction.drug._id;
        var form = transaction.drug.form;
        filter.exp[exp].count = 0;
        filter.exp[exp].qty = 0;
        filter.ndc[ndc].count = 0;
        filter.ndc[ndc].qty = 0;
        filter.form[form].count = 0;
        filter.form[form].qty = 0;
      }

      transactions = transactions.filter(function (transaction) {

        var qty = transaction.qty.to || transaction.qty.from;
        var exp = transaction.exp.to || transaction.exp.from;
        var ndc = transaction.drug._id;
        var form = transaction.drug.form;

        if (!filter.exp[exp].isChecked) {
          if (filter.ndc[ndc].isChecked && filter.form[form].isChecked) {
            filter.exp[exp].count++;
            filter.exp[exp].qty += qty;
          }
          return false;
        }
        if (!filter.ndc[ndc].isChecked) {
          if (filter.exp[exp].isChecked && filter.form[form].isChecked) {
            filter.ndc[ndc].count++;
            filter.ndc[ndc].qty += qty;
          }
          return false;
        }

        if (!filter.form[form].isChecked) {
          if (filter.exp[exp].isChecked && filter.ndc[ndc].isChecked) {
            filter.form[form].count++;
            filter.form[form].qty += qty;
          }
          return false;
        }

        filter.exp[exp].count++;
        filter.ndc[ndc].count++;
        filter.form[form].count++;
        filter.exp[exp].qty += qty;
        filter.ndc[ndc].qty += qty;
        filter.form[form].qty += qty;
        return true;
      });

      return transactions;
    };

    return inventoryFilterValueConverter;
  }();
});
define('views/account',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router'], function (exports, _aureliaFramework, _pouch, _aureliaRouter) {
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

  var account = exports.account = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router), _dec(_class = function () {
    function account(db, router) {
      _classCallCheck(this, account);

      this.db = db;
      this.router = router;
    }

    account.prototype.activate = function activate() {
      var _this = this;

      this.db.user.session.get().then(function (session) {

        _this.session = session;

        _this.db.account.get().then(function (accounts) {
          _this.accounts = accounts.filter(function (account) {
            if (account._id != session.account._id) return true;
            _this.account = account;
          });
        });

        return _this.db.user.get().then(function (users) {
          _this.users = users;
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
      this.db.user.delete(this.user).then(function (_) {
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
      var auth = this.db.account.authorized;
      ~index ? auth.delete({ _id: _id }).then(function (_) {
        return _this5.account.authorized.splice(index, 1);
      }) : auth.post({ _id: _id }).then(function (_) {
        return _this5.account.authorized.push(_id);
      });

      return true;
    };

    account.prototype.logout = function logout() {
      var _this6 = this;

      this.disableLogout = 'Uninstalling...';
      this.db.user.session.delete().then(function (_) {
        _this6.router.navigate('login', { trigger: true });
      }).catch(function (err) {
        return console.trace('Logout failed: ' + err);
      });
    };

    return account;
  }()) || _class);
});
define('views/drugs',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', '../libs/csv', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _csv, _helpers) {
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

  var drugs = exports.drugs = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router), _dec(_class = function () {
    function drugs(db, router) {
      _classCallCheck(this, drugs);

      this.csv = new _csv.Csv(['_id', 'generics', 'form'], ['brand', 'labeler', 'image']);
      this.db = db;
      this.router = router;
      this.term = '';
      this.scrollDrugs = this.scrollDrugs.bind(this);

      this.toggleDrawer = _helpers.toggleDrawer;
      this.scrollSelect = _helpers.scrollSelect;
      this.drugSearch = _helpers.drugSearch;
    }

    drugs.prototype.deactivate = function deactivate() {
      removeEventListener('keyup', this.scrollDrugs);
    };

    drugs.prototype.activate = function activate(params) {
      var _this = this;

      addEventListener('keyup', this.scrollDrugs);
      return this.db.user.session.get().then(function (session) {
        return _this.db.account.get({ _id: session.account._id });
      }).then(function (accounts) {
        _this.account = accounts[0];
        _this.drawer = {
          ordered: Object.keys(_this.account.ordered).sort()
        };

        if (!params.id) return _this.drawer.ordered[0] && _this.selectDrawer(_this.drawer.ordered[0]);

        return _this.db.drug.get({ _id: params.id }).then(function (drugs) {
          _this.selectDrug(drugs[0], true);
        });
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

      this.term = group.name;

      this.db.transaction.get({ generic: group.name, inventory: true }).then(function (transactions) {
        _this3.inventory = transactions.reduce(function (a, b) {
          return a + b.qty.to;
        }, 0);
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
      this.drug = drug || {
        generics: this.drug && this.drug.generics,
        form: this.drug && this.drug.form
      };

      var url = this.drug ? 'drugs/' + this.drug._id : 'drugs';
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

      if (this.account.ordered[this.group.name]) {
        this.drawer.ordered = this.drawer.ordered.filter(function (generic) {
          return generic != _this5.group.name;
        });

        this.account.ordered[this.group.name] = undefined;
      } else {
        this.drawer.ordered.unshift(this.group.name);
        this.account.ordered[this.group.name] = {};
      }

      this.saveOrder();
    };

    drugs.prototype.exportCSV = function exportCSV() {
      var _this6 = this;

      this.snackbar.show('Exporting drugs as csv. This may take a few minutes');
      this.db.drug.get().then(function (drugs) {
        _this6.csv.unparse('Drugs.csv', drugs.map(function (drug) {
          return {
            '': drug,
            _id: " " + drug._id,
            upc: "UPC " + drug.upc,
            ndc9: "NDC9 " + drug.ndc9,
            generics: drug.generics.map(function (generic) {
              return generic.name + " " + generic.strength;
            }).join(';'),
            ordered: _this6.account.ordered[drug.generic]
          };
        }));
      });
    };

    drugs.prototype.importCSV = function importCSV() {
      var _this7 = this;

      var start = Date.now();
      this.snackbar.show('Parsing csv file');
      function capitalize(text) {
        return text ? text.trim().toLowerCase().replace(/\b[a-z]/g, function (l) {
          return l.toUpperCase();
        }) : text;
      }
      function trim(text) {
        return text ? text.trim() : text;
      }
      this.csv.parse(this.$file.files[0]).then(function (parsed) {
        _this7.$file.value = '';
        return Promise.all(parsed.map(function (drug) {
          return {
            _id: trim(drug._id),
            brand: trim(drug.brand),
            form: capitalize(drug.form),
            image: trim(drug.image),
            labeler: capitalize(drug.labeler),
            generics: drug.generics.split(";").filter(function (v) {
              return v;
            }).map(function (generic) {
              var _generic$split = generic.split(/(?= [\d.]+)/);

              var name = _generic$split[0];
              var strength = _generic$split[1];

              return {
                name: capitalize(name),
                strength: trim(strength || '').toLowerCase().replace(/ /g, '')
              };
            })
          };
        }));
      }).then(function (rows) {
        _this7.snackbar.show('Parsed ' + rows.length + ' rows. Uploading to server');
        return _this7.db.drug.post(rows);
      }).then(function (_) {
        return _this7.snackbar.show('Drugs import completed in ' + (Date.now() - start) + 'ms');
      }).catch(function (err) {
        return _this7.snackbar.show('Drugs not imported: ' + err);
      });
    };

    drugs.prototype.addGeneric = function addGeneric() {
      this.drug.generics.push({ name: '', strength: '' });
      return true;
    };

    drugs.prototype.removeGeneric = function removeGeneric() {
      this.drug.generics.pop();
      return true;
    };

    drugs.prototype.saveOrder = function saveOrder() {
      console.log('saving Order', this.account);
      return this.db.account.put(this.account);
    };

    drugs.prototype.addDrug = function addDrug() {
      var _this8 = this;

      this.db.drug.post(this.drug).then(function (res) {
        setTimeout(function (_) {
          return _this8.selectDrug(_this8.drug, true);
        }, 500);
      }).catch(function (err) {
        return _this8.snackbar.show('Drug not added: ' + (err.reason || err.message));
      });
    };

    drugs.prototype.saveDrug = function saveDrug() {
      var _this9 = this;

      this.db.drug.put(this.drug).then(function (res) {
        if (_this9.group.name != _this9.drug.generic && _this9.group.drugs.length == 1 && _this9.account.ordered[_this9.group.name]) _this9.order();

        setTimeout(function (_) {
          return _this9.selectDrug(_this9.drug, true);
        }, 500);
      }).catch(function (err) {
        return _this9.snackbar.show('Drug not saved: ' + (err.reason || err.message));
      });
    };

    drugs.prototype.deleteDrug = function deleteDrug() {
      console.log('TO BE IMPLEMENETED');
    };

    return drugs;
  }()) || _class);
});
define('views/index',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;
  function configure(aurelia) {

    Promise.config({ warnings: false });
    console.log = console.log.bind(console);

    aurelia.use.standardConfiguration().plugin('aurelia-animator-css').globalResources('resources/value-converters');

    aurelia.start().then(function (a) {
      return a.setRoot('views/routes');
    });
  }
});
define('views/inventory',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router', '../libs/csv', '../resources/helpers'], function (exports, _aureliaFramework, _pouch, _aureliaRouter, _csv, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.inventory = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var inventory = exports.inventory = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router), _dec(_class = function () {
    function inventory(db, router) {
      _classCallCheck(this, inventory);

      this.db = db;
      this.router = router;
      this.csv = new _csv.Csv(['drug._id'], ['qty.from', 'qty.to', 'exp.from', 'exp.to', 'location', 'verifiedAt']);
      this.limit = 100;

      this.resetFilter();

      this.saveTransaction = _helpers.saveTransaction;
      this.incrementBox = _helpers.incrementBox;
      this.focusInput = _helpers.focusInput;
      this.scrollSelect = _helpers.scrollSelect;
      this.drugSearch = _helpers.drugSearch;
    }

    inventory.prototype.activate = function activate(params) {
      var _this = this;

      return this.db.user.session.get().then(function (session) {
        _this.account = session.account._id;
      });
    };

    inventory.prototype.scrollGroups = function scrollGroups($event) {
      this.scrollSelect($event, this.group, this.groups, this.selectGroup);

      if ($event.which == 13) this.focusInput('#exp_0');
    };

    inventory.prototype.selectGroup = function selectGroup() {
      var _this2 = this;

      var group = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      group.inventory = true;
      this.db.transaction.get(group, { limit: this.limit }).then(function (transactions) {
        if (transactions.length == _this2.limit) _this2.snackbar.show('Displaying first 100 results');

        if (group.generic) _this2.term = group.generic;

        _this2.group = group;
        group.transactions = transactions.sort(function (a, b) {
          var aExp = a.exp.to || a.exp.from || '';
          var bExp = b.exp.to || b.exp.from || '';
          var aQty = a.qty.to || a.qty.from || '';
          var bQty = b.qty.to || b.qty.from || '';
          var aBox = a.location || '';
          var bBox = b.location || '';

          if (aBox > bBox) return -1;
          if (aBox < bBox) return 1;
          if (aExp < bExp) return -1;
          if (aExp > bExp) return 1;
          if (aQty > bQty) return -1;
          if (aQty < bQty) return 1;
          return 0;
        });

        _this2.resetFilter();
        for (var _iterator = group.transactions, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var transaction = _ref;

          _this2.filter.exp[transaction.exp.to || transaction.exp.from] = { isChecked: true, count: 0, qty: 0 };
          _this2.filter.ndc[transaction.drug._id] = { isChecked: true, count: 0, qty: 0 };
          _this2.filter.form[transaction.drug.form] = { isChecked: true, count: 0, qty: 0 };
        }
      });
    };

    inventory.prototype.resetFilter = function resetFilter() {
      this.filter = { exp: {}, ndc: {}, form: {} };
    };

    inventory.prototype.search = function search() {
      var _this3 = this;

      if (/[A-Z][0-9]{1,3}/.test(this.term)) return this.selectGroup({ location: this.term });

      if (/20\d\d-\d\d-?\d?\d?/.test(this.term)) return this.selectGroup({ exp: this.term });

      this.drugSearch().then(function (drugs) {
        var groups = {};
        for (var _iterator2 = drugs, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref2 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref2 = _i2.value;
          }

          var drug = _ref2;

          groups[drug.generic] = groups[drug.generic] || { generic: drug.generic };
        }
        _this3.groups = Object.keys(groups).map(function (key) {
          return groups[key];
        });
      });
    };

    inventory.prototype.signalFilter = function signalFilter(obj) {
      if (obj) obj.val.isChecked = !obj.val.isChecked;
      this.filter = Object.assign({}, this.filter);
    };

    inventory.prototype.repackInventory = function repackInventory() {
      var _this4 = this;

      var repack = [];

      var _loop = function _loop() {
        if (_isArray3) {
          if (_i3 >= _iterator3.length) return 'break';
          _ref3 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) return 'break';
          _ref3 = _i3.value;
        }

        var transaction = _ref3;

        if (transaction.isChecked) {
          transaction.next = transaction.next || [];
          transaction.next.push({ qty: transaction.qty.to || transaction.qty.from, dispensed: {} });
          _this4.db.transaction.put(transaction).then(function (_) {
            _this4.group.transactions.splice(_this4.group.transactions.indexOf(transaction), 1);
          }).catch(function (err) {
            transaction.isChecked = !transaction.isChecked;
            _this4.snackbar.show('Error repacking: ' + (err.reason || err.message));
          });
        }
      };

      for (var _iterator3 = this.group.transactions, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref3;

        var _ret = _loop();

        if (_ret === 'break') break;
      }
    };

    inventory.prototype.expShortcuts = function expShortcuts($event, $index) {
      if ($event.which == 13) return this.focusInput('#qty_' + $index);

      return true;
    };

    inventory.prototype.qtyShortcuts = function qtyShortcuts($event, $index) {
      if ($event.which == 13) return this.focusInput('#box_' + $index);

      return true;
    };

    inventory.prototype.boxShortcuts = function boxShortcuts($event, $index) {
      if ($event.which == 13) return this.focusInput('#exp_' + ($index + 1));

      return this.incrementBox($event, this.group.transactions[$index]);
    };

    inventory.prototype.exportCSV = function exportCSV() {
      var _this5 = this;

      var name = 'Inventory.csv';
      this.db.transaction.get({ inventory: true }).then(function (inventory) {
        _this5.csv.unparse(name, inventory.map(function (row) {
          row.next = JSON.stringify(row.next || []);
          return row;
        }));
      });
    };

    inventory.prototype.importCSV = function importCSV() {
      var _this6 = this;

      console.log('this.$file.value', this.$file.value);
      this.csv.parse(this.$file.files[0]).then(function (parsed) {
        return Promise.all(parsed.map(function (transaction) {
          _this6.$file.value = '';
          transaction._id = undefined;
          transaction._rev = undefined;
          transaction.next = JSON.parse(transaction.next || "[]");
          return _this6.db.drug.get({ _id: transaction.drug._id }).then(function (drugs) {
            if (!drugs[0]) throw 'Cannot find drug with _id ' + transaction.drug._id;

            transaction.drug = {
              _id: drugs[0]._id,
              brand: drugs[0].brand,
              generic: drugs[0].generic,
              generics: drugs[0].generics,
              form: drugs[0].form,
              price: drugs[0].price,
              pkg: drugs[0].pkg
            };

            return transaction;
          }).catch(function (drug) {
            console.log('Missing drug', transaction.drug._id, transaction.drug);
            throw drug;
          });
        }));
      }).then(function (rows) {
        var chain = Promise.resolve();

        var _loop2 = function _loop2(i) {
          chain = chain.then(function (_) {
            var args = rows.slice(i, i + 36 * 36);
            args = args.map(function (row) {
              return _this6.db.transaction.post(row);
            });
            args.push(new Promise(function (r) {
              return setTimeout(r, 60000);
            }));
            return Promise.all(args);
          }).catch(function (err) {
            console.log('importCSV error', i, i + 36 * 36, err);
            _this6.snackbar.show('Error Importing Inventory: ' + JSON.stringify(err));
          });
        };

        for (var i = 0; i < rows.length; i += 36 * 36) {
          _loop2(i);
        }
        return chain;
      }).then(function (_) {
        return _this6.snackbar.show('Imported Inventory Items');
      });
    };

    return inventory;
  }()) || _class);
});
define('views/join',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient) {
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

  var join = exports.join = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
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
        state: 'OR',
        zip: '',
        ordered: {}
      };

      this.user = {
        name: { first: 'Guest', last: 'User' },
        email: '',
        phone: '650.488.7434',
        password: 'password'
      };
    }

    join.prototype.join = function join() {
      var _this = this;

      this.db.account.post(this.account).then(function (account) {
        _this.user.account = { _id: account._id };
        return _this.db.user.post(_this.user);
      }).then(function (_) {
        return _this.db.user.session.post({ email: _this.user.email, password: _this.user.password });
      }).then(function (loading) {
        _this.disabled = true;
        _this.loading = loading.resources;
        _this.progress = loading.progress;

        return Promise.all(loading.syncing);
      }).then(function (_) {
        console.log('join success', _);
        return _this.router.navigate('shipments');
      }).catch(function (err) {
        _this.snackbar.show('Join failed: ' + err.reason || err.message);
      });
    };

    return join;
  }()) || _class);
});
define('views/login',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch'], function (exports, _aureliaFramework, _aureliaRouter, _pouch) {
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

  var login = exports.login = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router), _dec(_class = function () {
    function login(db, router) {
      _classCallCheck(this, login);

      this.db = db;
      this.router = router;
      this.email = 'oregon@sirum.org';
      this.password = '';
    }

    login.prototype.login = function login() {
      var _this = this;

      this.db.user.session.post({ email: this.email, password: this.password }).then(function (loading) {
        _this.disabled = true;

        _this.loading = loading.resources;
        _this.progress = loading.progress;

        return Promise.all(loading.syncing);
      }).then(function (resources) {
        _this.router.navigate('shipments');
      }).catch(function (err) {
        _this.disabled = false;
        console.log('Login failed: ', err);
        _this.snackbar.show('Login failed: ' + err.reason || err.message);
      });
    };

    return login;
  }()) || _class);
});
define('views/records',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient, _helpers) {
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

  var records = exports.records = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
    function records(db, router, http) {
      _classCallCheck(this, records);

      this.db = db;
      this.router = router;
      this.http = http;
      this.history = '';
      this.days = [];
      this.scroll = this.scroll.bind(this);
      this.toggleDrawer = _helpers.toggleDrawer;

      var today = new Date();
      var start = new Date(2016, 7, 1);

      while (today > start) {
        this.days.push(today.toJSON().slice(0, 10));
        today.setHours(-24);
      }
    }

    records.prototype.deactivate = function deactivate() {
      removeEventListener('keyup', this.scroll);
    };

    records.prototype.activate = function activate(params) {
      var _this = this;

      addEventListener('keyup', this.scroll);
      this.db.user.session.get().then(function (session) {
        _this.account = session.account;
        _this.selectDay(params.id);
      });
    };

    records.prototype.selectDay = function selectDay(day, toggleDrawer) {
      var _this2 = this;

      this.day = day || this.days[0];
      this.router.navigate('records/' + this.day, { trigger: false });
      toggleDrawer && this.toggleDrawer();

      var to = new Date(this.day);
      to.setHours(24 * 2);

      var query = { createdAt: { $gte: this.day, $lte: to.toJSON().slice(0, 10) } };

      return this.db.transaction.get(query).then(function (transactions) {
        _this2.transactions = transactions;
        return _this2.selectTransaction();
      });
    };

    records.prototype.scroll = function scroll($event) {
      var index = this.transactions.indexOf(this.transaction);
      var last = this.transactions.length - 1;

      if ($event.which == 38) this.selectTransaction(this.transactions[index > 0 ? index - 1 : last]);

      if ($event.which == 40) this.selectTransaction(this.transactions[index < last ? index + 1 : 0]);
    };

    records.prototype.selectTransaction = function selectTransaction(transaction) {
      var _this3 = this;

      this.transaction = transaction || this.transactions[0];

      if (!this.transaction) return;

      this.db.transaction.get({ _id: this.transaction._id }, { history: true }).then(function (history) {
        function id(k, o) {
          if (Array.isArray(o)) return o;
          return o.shipment.from.name + ' ' + o._id;
        }

        function pad(word) {
          return (word + ' '.repeat(25)).slice(0, 25);
        }
        _this3.history = JSON.stringify(history.reverse(), function (k, v) {
          if (Array.isArray(v)) return v;

          var status = _this3.status || 'pickup';
          var href = '/#/shipments/' + v.shipment._id;

          return pad('From: ' + v.shipment.account.from.name) + pad('To: ' + v.shipment.account.to.name) + "<a href='" + href + "'>" + v.type + " <i class='material-icons' style='font-size:12px; vertical-align:text-top; padding-top:1px'>exit_to_app</i></a><br>" + pad(v.shipment.account.from.street) + pad(v.shipment.account.to.street) + 'Date ' + v.createdAt.slice(2, 10) + '<br>' + pad(v.shipment.account.from.city + ', ' + v.shipment.account.from.state + ' ' + v.shipment.account.from.zip) + pad(v.shipment.account.to.city + ', ' + v.shipment.account.to.state + ' ' + v.shipment.account.to.zip) + 'Quantity ' + (v.qty.to || v.qty.from);
        }, "   ").replace(/\[\n?\s*/g, "<div style='margin-top:-12px'>").replace(/\n?\s*\],?/g, '</div>').replace(/ *"/g, '').replace(/\n/g, '<br><br>');
      });
    };

    records.prototype.exportCSV = function exportCSV() {};

    return records;
  }()) || _class);
});
define('views/routes',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router'], function (exports, _aureliaFramework, _pouch, _aureliaRouter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.AuthorizeStep = exports.App = undefined;

  var _dec, _class;

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
      config.title = 'SIRUM';
      config.addPipelineStep('authorize', AuthorizeStep);

      config.map([{ route: 'login', moduleId: 'views/login', title: 'Login', nav: true }, { route: ['join'], moduleId: 'views/join', title: 'Join', nav: true }, { route: ['inventory', 'inventory/:id'], moduleId: 'views/inventory', title: 'Inventory', nav: true, roles: ["user"] }, { route: ['shipments', 'shipments/:id', ''], moduleId: 'views/shipments', title: 'Shipments', nav: true, roles: ["user"] }, { route: ['drugs', 'drugs/:id'], moduleId: 'views/drugs', title: 'Drugs', nav: true, roles: ["user"] }, { route: ['records', 'records/:id'], moduleId: 'views/records', title: 'Records', nav: true, roles: ["user"] }, { route: 'account', moduleId: 'views/account', title: 'Account', nav: true, roles: ["user"] }]);
      this.router = router;
    };

    return App;
  }();

  var AuthorizeStep = exports.AuthorizeStep = (_dec = (0, _aureliaFramework.inject)(_aureliaRouter.Router, _pouch.Db), _dec(_class = function () {
    function AuthorizeStep(router, db) {
      _classCallCheck(this, AuthorizeStep);

      this.db = db;

      if (!document.cookie) router.navigate('login');
    }

    AuthorizeStep.prototype.run = function run(routing, nextStep) {
      return this.db.user.session.get().then(function (session) {
        var next = routing.getAllInstructions()[0].config;
        for (var _iterator = routing.router.navigation, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var route = _ref;

          if (!session || !session.account) {
            route.isVisible = !route.config.roles;continue;
          }
          var role = session.account._id.length == 7 ? 'user' : 'admin';
          route.isVisible = route.config.roles && ~route.config.roles.indexOf(role);
        }

        if (next.navModel.isVisible) return nextStep();
        var redirect = new _aureliaRouter.Redirect(next.navModel.config.roles ? 'login' : 'shipments');
        return nextStep.cancel(redirect);
      }).catch(function (err) {
        return console.log('router error', err);
      });
    };

    return AuthorizeStep;
  }()) || _class);
});
define('views/shipments',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client', '../libs/csv', '../resources/helpers'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient, _csv, _helpers) {
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

  var shipments = exports.shipments = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
    function shipments(db, router, http) {
      _classCallCheck(this, shipments);

      this.csv = new _csv.Csv(['drug._id'], ['qty.from', 'qty.to', 'exp.from', 'exp.to', 'location', 'verifiedAt']);
      this.db = db;
      this.drugs = [];
      this.router = router;
      this.http = http;
      this.stati = ['pickup', 'shipped', 'received'];
      this.shipments = {};

      this.incrementBox = _helpers.incrementBox;
      this.saveTransaction = _helpers.saveTransaction;
      this.focusInput = _helpers.focusInput;
      this.scrollSelect = _helpers.scrollSelect;
      this.toggleDrawer = _helpers.toggleDrawer;
      this.drugSearch = _helpers.drugSearch;
    }

    shipments.prototype.activate = function activate(params) {
      var _this = this;

      return this.db.user.session.get().then(function (session) {
        _this.user = session._id;
        return _this.db.account.get({ _id: session.account._id });
      }).then(function (accounts) {
        var _this$ordered;

        _this.account = { _id: accounts[0]._id, name: accounts[0].name };
        _this.ordered = (_this$ordered = {}, _this$ordered[accounts[0]._id] = accounts[0].ordered, _this$ordered);
        return Promise.all([_this.db.account.get({ authorized: accounts[0]._id }), _this.db.account.get({ _id: { $gt: null, $in: accounts[0].authorized } }), _this.db.shipment.get({ 'account.from._id': accounts[0]._id }), _this.db.shipment.get({ 'account.to._id': accounts[0]._id })]);
      }).then(function (_ref) {
        var fromAccounts = _ref[0];
        var toAccounts = _ref[1];
        var fromShipments = _ref[2];
        var toShipments = _ref[3];

        var selected = void 0,
            fromMap = {},
            toMap = {};
        var makeMap = function makeMap(map, account) {
          map[account._id] = { _id: account._id, name: account.name };
          _this.ordered[account._id] = account.ordered;
        };

        for (var _iterator = fromAccounts, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref2 = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref2 = _i.value;
          }

          var account = _ref2;
          makeMap(fromMap, account);
        }for (var _iterator2 = toAccounts, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref3 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref3 = _i2.value;
          }

          var _account = _ref3;
          makeMap(toMap, _account);
        }_this.accounts = {
          from: [''].concat(Object.keys(fromMap).map(function (key) {
            return fromMap[key];
          })),
          to: [''].concat(Object.keys(toMap).map(function (key) {
            return toMap[key];
          }))
        };

        var makeReference = function makeReference(shipment) {
          _this.setStatus(shipment);

          if (toMap[shipment.account.from._id]) shipment.account.from = toMap[shipment.account.from._id];

          if (fromMap[shipment.account.to._id]) shipment.account.to = fromMap[shipment.account.to._id];

          if (params.id === shipment._id) selected = shipment;
        };
        fromShipments.forEach(makeReference);

        _this.role = selected ? { account: 'from', partner: 'to' } : { account: 'to', partner: 'from' };

        toShipments.forEach(makeReference);

        _this.shipments = { from: fromShipments, to: toShipments };

        _this.selectShipment(selected);
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
      if (this.role.account == 'from') {
        this.setShipment({ account: { from: this.account, to: {} } });
        this.setTransactions(this.account._id);
      } else {
        this.setShipment({ account: { to: this.account, from: {} } });
        this.setTransactions();
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

      this.db.transaction.get({ 'shipment._id': shipmentId }).then(function (transactions) {
        _this2.transactions = transactions;
        _this2.setCheckboxes();
      }).catch(console.log);
    };

    shipments.prototype.setCheckboxes = function setCheckboxes() {
      for (var _iterator3 = this.transactions, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref4;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref4 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref4 = _i3.value;
        }

        var transaction = _ref4;

        transaction.isChecked = this.shipmentId == this.shipment._id ? transaction.verifiedAt : null;
      }
    };

    shipments.prototype.setStatus = function setStatus(shipment) {
      shipment.status = this.stati.reduce(function (prev, curr) {
        return shipment[curr + 'At'] ? curr : prev;
      });
    };

    shipments.prototype.swapRole = function swapRole() {
      var _ref5 = [this.role.partner, this.role.account];
      this.role.account = _ref5[0];
      this.role.partner = _ref5[1];

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

      this.db.shipment.post(this.shipment).then(function (res) {
        _this5.setStatus(_this5.shipment);
        _this5.shipments[_this5.role.account].unshift(_this5.shipment);
        _this5.moveTransactionsToShipment(_this5.shipment);
      });
    };

    shipments.prototype.expShortcutsKeydown = function expShortcutsKeydown($event, $index) {
      return $event.which == 13 ? this.focusInput('#qty_' + $index) : true;
    };

    shipments.prototype.expShortcutsInput = function expShortcutsInput($index) {
      this.autoCheck($index);
    };

    shipments.prototype.qtyShortcutsKeydown = function qtyShortcutsKeydown($event, $index) {
      return $event.which == 13 ? this.focusInput('#box_' + $index, 'md-autocomplete') : true;
    };

    shipments.prototype.qtyShortcutsInput = function qtyShortcutsInput($event, $index) {
      this.deleteTransactionIfQty0($event, $index) && this.autoCheck($index);
    };

    shipments.prototype.deleteTransactionIfQty0 = function deleteTransactionIfQty0($event, $index) {
      var transaction = this.transactions[$index];
      var doneeDelete = !transaction.qty.from && transaction.qty.to === 0;
      var donorDelete = !transaction.qty.to && transaction.qty.from === 0;

      if (!donorDelete && !doneeDelete) return true;

      this.drugs = [];
      this.transactions.splice($index, 1);
      this.db.transaction.delete(transaction);
      this.focusInput('md-autocomplete');
    };

    shipments.prototype.boxShortcuts = function boxShortcuts($event, $index) {
      if ($event.which == 13) return this.focusInput('md-autocomplete');

      return this.incrementBox($event, this.transactions[$index]);
    };

    shipments.prototype.getLocation = function getLocation(transaction) {
      return (this.getOrder(transaction) || {}).defaultLocation || this._location;
    };

    shipments.prototype.setLocation = function setLocation(transaction) {
      var _this6 = this;

      if (this.getLocation(transaction) != transaction.location) this._location = transaction.location;

      this.saveTransaction(transaction).catch(function (err) {
        _this6.snackbar.show('Error saving transaction: ' + (err.reason || err.message));
      });
    };

    shipments.prototype.aboveMinQty = function aboveMinQty(order, transaction) {
      var qty = +transaction.qty[this.role.account];
      if (!qty) return false;
      var price = transaction.drug.price.goodrx || transaction.drug.price.nadac || 0;
      var defaultQty = price > 1 ? 1 : 10;
      var aboveMinQty = qty >= (+order.minQty || defaultQty);
      if (!aboveMinQty) console.log('Ordered drug but qty', qty, 'is less than', +order.minQty || defaultQty);
      return qty >= (+order.minQty || defaultQty);
    };

    shipments.prototype.aboveMinExp = function aboveMinExp(order, transaction) {
      var exp = transaction.exp[this.role.account];
      if (!exp) return !order.minDays;
      var minDays = order.minDays || 120;
      var aboveMinExp = new Date(exp) - Date.now() >= minDays * 24 * 60 * 60 * 1000;
      if (!aboveMinExp) console.log('Ordered drug but expiration', exp, 'is before', minDays);
      return aboveMinExp;
    };

    shipments.prototype.getOrder = function getOrder(transaction) {
      return this.ordered[this.shipment.account.to._id][transaction.drug.generic];
    };

    shipments.prototype.isOrdered = function isOrdered(order, transaction) {
      return order ? this.aboveMinQty(order, transaction) && this.aboveMinExp(order, transaction) : false;
    };

    shipments.prototype.setDestroyedMessage = function setDestroyedMessage(order) {
      var _this7 = this;

      if (order && order.destroyedMessage && !this.destroyedMessage) this.destroyedMessage = setTimeout(function (_) {
        delete _this7.destroyedMessage;
        _this7.snackbar.show(order.destroyedMessage);
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

      if (this.isOrdered(order, transaction) == isChecked) return !isChecked && transaction.qty.to > 0 && this.setDestroyedMessage(order);

      if (isChecked) this.setDestroyedMessage(order);

      if (!isChecked) {
        this.snackbar.show(order.verifiedMessage || 'Drug is ordered');
        this.clearDestroyedMessage();
      }

      this.manualCheck($index);
    };

    shipments.prototype.toggleVerified = function toggleVerified(transaction) {
      var _this8 = this;

      transaction.verifiedAt = transaction.verifiedAt ? null : new Date().toJSON();

      if (transaction.verifiedAt) transaction.location = this.getLocation(transaction);

      this.saveTransaction(transaction).catch(function (err) {
        transaction.isChecked = !transaction.isChecked;
        _this8.snackbar.show('Error saving transaction: ' + (err.reason || err.message));
      });
    };

    shipments.prototype.toggleDiff = function toggleDiff(transaction) {
      var index = this.diffs.indexOf(transaction);
      ~index ? this.diffs.splice(index, 1) : this.diffs.push(transaction);
    };

    shipments.prototype.manualCheck = function manualCheck($index) {
      var transaction = this.transactions[$index];

      if (this.moveItemsButton.offsetParent || this.newShipmentButton.offsetParent) this.toggleDiff(transaction);else this.toggleVerified(transaction);

      transaction.isChecked = !transaction.isChecked;
    };

    shipments.prototype.search = function search() {
      var _this9 = this;

      this.drugSearch().then(function (drugs) {
        _this9.drugs = drugs;
        _this9.drug = drugs[0];
      });
    };

    shipments.prototype.autocompleteShortcuts = function autocompleteShortcuts($event) {
      var _this10 = this;

      this.scrollSelect($event, this.drug, this.drugs, function (drug) {
        return _this10.drug = drug;
      });

      if ($event.which == 13) {
        Promise.resolve(this._search).then(function (_) {
          return _this10.addTransaction(_this10.drug);
        });
        return false;
      }

      if ($event.which == 106) this.term = "";

      return true;
    };

    shipments.prototype.addTransaction = function addTransaction(drug, transaction) {
      var _this11 = this;

      if (!drug) return this.snackbar.show('Cannot find drug matching this search');

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

      transaction.shipment = {
        _id: this.shipment._id
      };

      transaction.user = {
        _id: this.user
      };

      this.term = '';
      this.transactions.unshift(transaction);

      var ordered = this.getOrder(transaction);
      var pharmerica = /pharmerica.*/i.test(this.shipment.account.from.name);

      !ordered && pharmerica ? this.snackbar.show('Destroy, record already exists') : setTimeout(function (_) {
        return _this11.focusInput('#exp_0');
      }, 50);

      return this.db.transaction.post(transaction).catch(function (err) {
        console.log(JSON.stringify(transaction), err);
        _this11.snackbar.show('Transaction could not be added: ' + err.name);
        _this11.transactions.shift();
      });
    };

    shipments.prototype.exportCSV = function exportCSV() {
      var _this12 = this;

      var name = this.shipment._id ? 'Shipment ' + this.shipment._id + '.csv' : 'Inventory.csv';
      this.csv.unparse(name, this.transactions.map(function (transaction) {
        return {
          '': transaction,
          'next': JSON.stringify(row.next || []),
          'drug._id': " " + transaction.drug._id,
          'drug.generics': transaction.drug.generics.map(function (generic) {
            return generic.name + " " + generic.strength;
          }).join(';'),
          shipment: _this12.shipment
        };
      }));
    };

    shipments.prototype.importCSV = function importCSV() {
      var _this13 = this;

      console.log('this.$file.value', this.$file.value);
      this.csv.parse(this.$file.files[0]).then(function (parsed) {
        return Promise.all(parsed.map(function (transaction) {
          _this13.$file.value = '';
          transaction._id = undefined;
          transaction._rev = undefined;
          transaction.shipment._id = undefined;
          transaction.next = JSON.parse(transaction.next);
          transaction.exp.to = toJsonDate(parseUserDate(transaction.exp.to));
          transaction.exp.from = toJsonDate(parseUserDate(transaction.exp.from));
          transaction.verifiedAt = toJsonDate(parseUserDate(transaction.verifiedAt));
          return _this13.db.drug.get({ _id: transaction.drug._id }).then(function (drugs) {
            if (drugs[0]) return { drug: drugs[0], transaction: transaction };
            throw 'Cannot find drug with _id ' + transaction.drug._id;
          });
        }));
      }).then(function (rows) {
        console.log('rows', rows);
        return Promise.all(rows.map(function (row) {
          return _this13.addTransaction(row.drug, row.transaction);
        }));
      }).then(function (_) {
        return _this13.snackbar.show('All Transactions Imported');
      }).catch(function (err) {
        return _this13.snackbar.show('Transactions not imported: ' + err);
      });
    };

    return shipments;
  }()) || _class);
});
define('text!views/account.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <md-drawer>\n    <md-input value.bind=\"filter\" style=\"padding:0 8px\">Filter Users</md-input>\n    <a\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! user.email ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser({name:{}, account:{_id:session.account._id}})\">\n      <div class=\"mdl-typography--title\">New User</div>\n    </a>\n    <a\n      repeat.for=\"user of users | userFilter:filter\"\n      class=\"mdl-navigation__link ${ user.email == $parent.user.email ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser(user)\">\n      <div class=\"mdl-typography--title\">${ user.name.first+' '+user.name.last}</div>\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div class=\"mdl-card__title\">\n        <div class=\"mdl-card__title-text\">\n          User Information\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\" input.delegate=\"saveUser() & debounce:1000\">\n        <md-input style=\"width:49%\" value.bind=\"user.name.first\" required>First Name</md-input>\n        <md-input style=\"width:49%\" value.bind=\"user.name.last\" required>Last Name</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.email\" type=\"email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\" required>Email</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.phone\" type=\"tel\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Phone</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.password\" if.bind=\" ! user._id\" required>Password</md-input>\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised style=\"width:100%\" if.bind=\"users.length != 0 && ! user._id\" form click.delegate=\"addUser()\">Create User</md-button>\n        <md-button color raised style=\"width:100%\" if.bind=\"users.length == 0 || user._id == session._id\" click.delegate=\"logout()\" disabled.bind=\"disableLogout\">${ disableLogout || 'Uninstall' }</md-button>\n        <md-button color=\"accent\" raised style=\"width:100%\" if.bind=\"user._id && user._id != session._id\" click.delegate=\"deleteUser()\">Delete User</md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <table md-table style=\"margin:8px 16px; width:calc(100% - 32px)\">\n        <thead>\n          <tr>\n            <th class=\"mdl-data-table__cell--non-numeric\">Authorized</th>\n            <th class=\"mdl-data-table__cell--non-numeric\">\n              <md-select\n                value.bind=\"type\"\n                options.bind=\"['From', 'To']\"\n                style=\"width:50px; font-weight:bold; margin-bottom:-26px\">\n              </md-select>\n            </th>\n            <th class=\"mdl-data-table__cell--non-numeric\">License</th>\n            <th class=\"mdl-data-table__cell--non-numeric\">Joined</th>\n            <th class=\"mdl-data-table__cell--non-numeric\">Location</th>\n          </tr>\n        </thead>\n        <tr repeat.for=\"account of accounts\" if.bind=\"account != $parent.account\">\n          <td class=\"mdl-data-table__cell--non-numeric\">\n            <md-checkbox\n              if.bind=\"type != 'To'\"\n              checked.one-time=\"$parent.account.authorized.indexOf(account._id) != -1\"\n              click.delegate=\"authorize(account._id)\">\n            </md-checkbox>\n            <md-checkbox\n              if.bind=\"type == 'To'\"\n              checked.one-time=\"account.authorized.indexOf($parent.account._id) != -1\"\n              disabled.bind=\"true\">\n            </md-checkbox>\n          </td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.name }</td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.license }</td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.createdAt | date }</td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.city+', '+account.state }</td>\n        </tr>\n      </table>\n    </div>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!views/drugs.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-table'></require>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-menu\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-autocomplete\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <md-drawer>\n    <md-select\n      options.bind=\"['Ordered', 'Inventory < ReorderAt', 'Inventory > ReorderTo', 'Inventory Expiring before Min Days', 'Missing Retail Price', 'Missing Wholesale Price', 'Missing Image']\"\n      style=\"padding:0 8px; margin-bottom:-20px\"\n      disabled.bind=\"true\">\n      Quick Search\n    </md-select>\n    <a\n      repeat.for=\"ordered of drawer.ordered\"\n      style=\"font-size:12px; line-height:18px; padding:8px 8px\"\n      class=\"mdl-navigation__link ${ ordered == group.name ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectDrawer(ordered)\">\n      ${ ordered }\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\">\n        <md-input\n          required\n          style=\"width:49%\"\n          value.bind=\"drug._id\"\n          disabled.bind=\"drug._rev\"\n          pattern=\"\\d{4}-\\d{4}|\\d{5}-\\d{3}|\\d{5}-\\d{4}\">\n          Product NDC\n        </md-input>\n        <md-input style=\"width:49%\"\n          value.one-way=\"drug._id ? ('00000'+drug._id.split('-').slice(0,1)).slice(-5)+('0000'+drug._id.split('-').slice(1)).slice(-4) : ''\"\n          disabled=\"true\">\n          NDC9\n        </md-input>\n        <div if.bind=\"drug.generics[0].name\" style=\"position:relative\">\n          <md-button color fab=\"11\"\n            show.bind=\"drug._rev && drug.generics[drug.generics.length-1].name\"\n            click.delegate=\"addGeneric()\"\n            style=\"position:absolute; left:153px; margin-top:-5px; z-index:1\">\n            +\n          </md-button>\n          <md-button color fab=\"11\"\n            show.bind=\"drug._rev && ! drug.generics[drug.generics.length-1].name\"\n            mousedown.delegate=\"removeGeneric()\"\n            style=\"position:absolute; right:153px; margin-top:-5px; z-index:1\">\n            -\n          </md-button>\n        </div>\n        <div repeat.for=\"generic of drug.generics\">\n          <md-input\n            required\n            style=\"width:75%\"\n            pattern=\"([A-Z][0-9a-z]*\\s?)+\\b\"\n            disabled.bind=\" ! drug._rev\"\n            value.bind=\"generic.name\">\n            ${ $index == 0 ? 'Generic Names & Strengths' : ''}\n          </md-input>\n          <md-input\n            style=\"width:23%\"\n            pattern=\"[0-9][0-9a-z/.]+\"\n            disabled.bind=\" ! drug._rev\"\n            value.bind=\"generic.strength\">\n          </md-input>\n        </div>\n        <md-input\n          style=\"width:49%\"\n          pattern=\"([A-Z][a-z]*\\s?){1,2}\\b\"\n          value.bind=\"drug.brand\">\n          Brand Name\n        </md-input>\n        <md-input\n          required\n          style=\"width:49%\"\n          pattern=\"([A-Z][a-z]+\\s?)+\\b\"\n          disabled.bind=\" ! drug._rev\"\n          value.bind=\"drug.form\">\n          Form\n        </md-input>\n        <md-input\n          style=\"width:100%\"\n          value.bind=\"drug.labeler\">\n          Labeler\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.nadac\"\n          disabled.bind=\"! drug._rev\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:49%\">\n          Nadac Price\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.goodrx | number:3\"\n          disabled.bind=\"! drug._rev\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:49%\">\n          GoodRx Price\n        </md-input>\n        <md-input\n          pattern=\"//[a-zA-Z0-9/.\\-_%]+\"\n          value.bind=\"drug.image\"\n          style=\"width:100%; font-size:9px;\">\n          ${ drug.image ? 'Image' : 'Image URL'}\n        </md-input>\n        <img\n          style=\"width:100%;\"\n          if.bind=\"drug.image\"\n          src.bind=\"drug.image\">\n      </div>\n      <div class=\"mdl-card__actions\">\n        <!-- <md-button color=\"accent\" raised\n          if.bind=\"drug._rev\"\n          style=\"width:100%;\"\n          disabled\n          click.delegate=\"deleteDrug()\">\n          Delete Drug\n        </md-button> -->\n        <md-button color raised\n          style=\"width:100%;\"\n          click.delegate=\"drug._rev ? saveDrug() : addDrug()\"\n          form>\n          ${ drug._rev ? 'Save Drug' : 'Add Drug' }\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <md-autocomplete\n        placeholder=\"Search Drugs by Generic Name or NDC...\"\n        value.bind=\"term\"\n        input.delegate=\"search() & debounce:50\"\n        keydown.delegate=\"scrollGroups($event) & debounce:50\"\n        style=\"margin:0px 16px; padding-right:15px\">\n        <table md-table>\n          <tr\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectGroup(group, true)\"\n            class=\"${ group.name == $parent.group.name && 'is-selected'}\">\n            <td\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.name.replace(regex, '<strong>$1</strong>')\">\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li click.delegate=\"selectDrug()\" class=\"mdl-menu__item\">\n          Add Drug\n        </li>\n        <li click.delegate=\"exportCSV()\" class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n        <li click.delegate=\"$file.click()\" class=\"mdl-menu__item\">\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <md-switch\n        style=\"position:absolute; right:25px; top:47px; z-index:1\"\n        checked.one-way=\"account.ordered[group.name]\"\n        disabled.bind=\"! account.ordered[group.name] && ! drug._rev\"\n        click.delegate=\"order()\">\n      </md-switch>\n      <div style=\"width:100%; height:100%; display:flex\">\n        <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px; flex:1;\">\n          <table md-table style=\"width:calc(100% - 16px);\">\n            <thead>\n              <tr>\n                <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Form</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Labeler</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Brand</th>\n                <th style=\"text-align:left; width:40px; padding-left:0;\">Nadac</th>\n                <th style=\"text-align:left; width:${ account.ordered[group.name] ? '40px' : '85px'}; padding-left:0;\">GoodRx</th>\n              </tr>\n            </thead>\n            <tr repeat.for=\"drug of group.drugs\" click.delegate=\"selectDrug(drug)\" class=\"${ drug._id == $parent.drug._id ? 'is-selected' : ''}\">\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug._id }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug.form }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug.labeler }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug.brand }</td>\n              <td style=\"padding:0; text-align:left\">${ drug.price.nadac | number:3 }</td>\n              <td style=\"padding:0; text-align:left\">${ drug.price.goodrx | number:3 }</td>\n            </tr>\n          </table>\n        </div>\n        <div show.bind=\"account.ordered[group.name]\" input.delegate=\"saveOrder() & debounce:1000\" style=\"overflow:hidden; width:200px; margin-top:10px; margin-right:16px\">\n          Ordered\n          <md-input\n            disabled\n            type=\"number\"\n            value.bind=\"inventory\"\n            style=\"width:100%\">\n            Inventory\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).minQty\"\n            placeholder=\"10\"\n            style=\"width:100%\">\n            Min Qty\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).minDays\"\n            placeholder=\"120\"\n            style=\"width:100%\">\n            Min Days\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.name] || {}).verifiedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Verified Message\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.name] || {}).destroyedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Destroyed Message\n          </md-input>\n          <md-input\n            pattern=\"\\w{1,4}\"\n            value.bind=\"(account.ordered[group.name] || {}).defaultLocation\"\n            style=\"width:100%\">\n            Default Box\n          </md-input>\n          <!-- <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).maxPrice\"\n            disabled.bind=\"true\"\n            style=\"width:100%\">\n            Max Price\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).reorderAt\"\n            disabled.bind=\"true\"\n            style=\"width:100%\">\n            Reorder At\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).reorderTo\"\n            disabled.bind=\"true\"\n            style=\"width:100%\">\n            Reorder To\n          </md-input> -->\n        </div>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!views/index.html', ['module'], function(module) { module.exports = "<!doctype html>\n<html style=\"overflow:hidden\">\n  <head>\n    <title>Loading SIRUM...</title>\n    <script src=\"assets/material.1.1.3.js\"></script>\n    <link rel=\"stylesheet\" href=\"assets/material.icon.css\">\n    <link rel=\"stylesheet\" href=\"assets/material.1.1.3.css\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <style>\n    body { background:#eee }\n    a { color:rgb(0,88,123); text-decoration:none }\n\n    .full-height { height:calc(100vh - 96px); overflow-y:auto}\n\n    .mdl-layout__header { background:white;}\n    .mdl-layout__header, .mdl-layout__drawer, .mdl-layout__header-row .mdl-navigation__link, .mdl-layout__header .mdl-layout__drawer-button { color:rgb(66,66,66);}\n\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link { padding:16px;}\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link--current { border-left:solid 3px red; padding-left:13px; background:#e0e0e0; color:inherit }\n\n    .mdl-layout__header-row .mdl-navigation__link { border-top:solid 3px white; }\n    .mdl-layout__header-row .mdl-navigation__link--current { font-weight:600;  border-top-color:red;}\n\n    .mdl-data-table th { height:32px }\n    .mdl-data-table tbody tr { height:auto }\n    .mdl-data-table td { border:none; padding-top:8px; padding-bottom:8px; height:auto }\n\n    .mdl-button--raised { box-shadow:none } /*otherwise disabled.bind has weird animaiton twitching */\n    .mdl-button--fab.mdl-button--colored{ background:rgb(0,88,123);}\n\n    .mdl-card__supporting-text { width:100%; box-sizing: border-box; overflow-y:scroll; flex:1 }\n    .mdl-card__actions { padding:16px }\n    /* animate page transitions */\n    .au-enter-active { animation:slideDown .5s; }\n\n    .mdl-snackbar { left:auto; right:6px; bottom:6px; margin-right:0%; font-size:24px; font-weight:300; max-width:100% }\n    .mdl-snackbar--active { transform:translate(0, 0); -webkit-transform:translate(0, 0); }\n    .mdl-snackbar__text { padding:8px 24px; }\n\n    .mdl-checkbox__tick-outline { width:13px } /*widen by 1px to avoid pixel gap for checkboxes on small screens*/\n\n    @keyframes slideDown {\n      0% {\n        opacity:0;\n        -webkit-transform:translate3d(0, -100%, 0);\n        -ms-transform:translate3d(0, -100%, 0);\n        transform:translate3d(0, -100%, 0)\n      }\n      100% {\n        opacity:.9;\n        -webkit-transform:none;\n        -ms-transform:none;\n        transform:none\n      }\n    }\n\n    /*.au-leave-active {\n      position:absolute;\n      -webkit-animation:slideLeft .5s;\n      animation:slideLeft .5s;\n    }*/\n\n    </style>\n    <style media=\"print\">\n      .hide-when-printed { display:none; }\n      .mdl-data-table td { padding-top:4px; padding-bottom:4px; }\n    </style>\n  </head>\n  <body aurelia-app=\"views/index\">\n    <div class=\"splash\">\n      <div class=\"message\">Loading SIRUM...</div>\n      <i class=\"fa fa-spinner fa-spin\"></i>\n    </div>\n    <script src=\"assets/db/pouchdb-6.0.4.js\"></script>\n    <script src=\"assets/db/pouchdb-0.10.3.find.js\"></script>\n    <script src=\"assets/db/pouch.js\"></script>\n    <script src=\"assets/csv/papa.min.js\"></script>\n    <script src=\"assets/csv/index.js\"></script>\n    <script src=\"assets/vendor-bundle.js\" data-main=\"aurelia-bootstrapper\"></script>\n  </body>\n</html>\n"; });
define('text!views/inventory.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <require from=\"elems/md-autocomplete\"></require>\n  <require from=\"elems/md-menu\"></require>\n  <style>\n    .mdl-badge[data-badge]:after { font-size:9px; height:14px; width:14px; top:1px}\n    .mdl-textfield__label { color:black; font-size:1rem }\n  </style>\n  <md-drawer>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height hide-when-printed\"> <!-- ${ !repack || 'background:rgba(0,88,123,.3)' } -->\n      <div class=\"mdl-card__supporting-text\" style=\"padding:0\">\n        <div repeat.for=\"ndc of filter.ndc | toArray:true\" class=\"mdl-grid\" style=\"padding:0 0 0 8px; margin-top:-8px\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title mdl-grid\" style=\"padding:16px 0 0 0; width:100%\">\n            <div class=\"mdl-cell mdl-cell--8-col\">Ndc Filter</div>\n            <div class=\"mdl-cell mdl-cell--2-col\">Qty</div>\n            <div class=\"mdl-cell mdl-cell--2-col\">Count</div>\n          </div>\n          <md-checkbox class=\"mdl-cell mdl-cell--8-col\" click.delegate=\"signalFilter(ndc)\" checked.bind=\"ndc.val.isChecked\">${ndc.key}</md-checkbox>\n          <div class=\"mdl-cell mdl-cell--2-col\">${ndc.val.qty}</div>\n          <div class=\"mdl-cell mdl-cell--2-col\">${ndc.val.count}</div>\n        </div>\n        <div repeat.for=\"exp of filter.exp | toArray:true\" class=\"mdl-grid\" style=\"padding:0 0 0 8px; margin-bottom:-8px\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title mdl-grid\" style=\"padding:0; width:100%\">\n            <div class=\"mdl-cell mdl-cell--8-col\">Exp Filter</div>\n          </div>\n          <md-checkbox class=\"mdl-cell mdl-cell--8-col\" click.delegate=\"signalFilter(exp)\" checked.bind=\"exp.val.isChecked\">${exp.key.slice(0, 10)}</md-checkbox>\n          <div class=\"mdl-cell mdl-cell--2-col\">${exp.val.qty}</div>\n          <div class=\"mdl-cell mdl-cell--2-col\">${exp.val.count}</div>\n        </div>\n        <div repeat.for=\"form of filter.form | toArray:true\" class=\"mdl-grid\" style=\"padding:0 0 0 8px; margin-bottom:-8px\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title mdl-grid\" style=\"padding:0; width:100%\">\n            <div class=\"mdl-cell mdl-cell--8-col\">Form Filter</div>\n          </div>\n          <md-checkbox class=\"mdl-cell mdl-cell--8-col\" click.delegate=\"signalFilter(form)\" checked.bind=\"form.val.isChecked\">${form.key}</md-checkbox>\n          <div class=\"mdl-cell mdl-cell--2-col\">${form.val.qty}</div>\n          <div class=\"mdl-cell mdl-cell--2-col\">${form.val.count}</div>\n        </div>\n        <!-- <md-input show.bind=\"group.transactions.length\" input.delegate=\"signalFilter()\" value.bind=\"filter.rx\" style=\"margin-left:16px;\" class=\"mdl-cell mdl-cell--10-col\">Rx Filter</md-input> -->\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised\n          style=\"width:100%\"\n          disabled.bind=\" ! group.transactions.length\"\n          click.delegate=\"repackInventory()\">\n          ${'Repack Selected'}\n        </md-button>\n      </div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <md-autocomplete\n        placeholder=\"Search Drugs by Generic Name...\"\n        value.bind=\"term\"\n        input.delegate=\"search()\"\n        keyup.delegate=\"scrollGroups($event)\"\n        style=\"margin:0px 16px; padding-right:15px\">\n        <table md-table>\n          <tr\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectGroup(group)\"\n            class=\"${ group.generic == $parent.group.generic && 'is-selected'}\">\n            <td\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.generic.replace(regex, '<strong>$1</strong>')\">\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          click.delegate=\"exportCSV()\">\n          Export CSV\n        </li>\n        <li\n          click.delegate=\"$file.click()\">\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div style=\"width:100%; height:100%; display:flex\">\n        <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px; flex:1;\">\n          <table md-table style=\"width:calc(100% - 16px);\">\n            <thead>\n              <tr>\n                <th style=\"width:15px\"></th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Drug</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Form</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n                <th style=\"text-align:left; width:40px;\">Exp</th>\n                <th style=\"text-align:left; width:40px;\">Qty</th>\n                <!-- <th style=\"text-align:left; width:40px;\">Rx</th> -->\n                <th style=\"text-align:left; width:40px;\">Box</th>\n              </tr>\n            </thead>\n            <tr repeat.for=\"transaction of group.transactions | inventoryFilter:filter\" input.delegate=\"saveTransaction(transaction) & debounce:1000\">\n              <td style=\"padding:0 0 0 8px\">\n                <md-checkbox checked.bind=\"transaction.isChecked\"></md-checkbox>\n              </td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug.generic }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug.form }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '')}</td>\n              <td style=\"padding:0\">\n                <md-input\n                  id.bind=\"'exp_'+$index\"\n                  keydown.delegate=\"expShortcuts($event, $index)\"\n                  pattern=\"(0?[1-9]|1[012])/\\d{2}\"\n                  value.bind=\"transaction.exp.to | date\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  id.bind=\"'qty_'+$index\"\n                  keydown.delegate=\"qtyShortcuts($event, $index)\"\n                  type=\"number\"\n                  value.bind=\"transaction.qty.to | number\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <!-- <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"transaction.rx.from\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td> -->\n              <td style=\"padding:0\">\n                <md-input\n                  id.bind=\"'box_'+$index\"\n                  keydown.delegate=\"boxShortcuts($event, $index)\"\n                  keyup.delegate=\"saveTransaction(transaction) & debounce:1000\"\n                  pattern=\"[A-Z]\\d{3}\"\n                  value.bind=\"transaction.location\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n            </tr>\n          </table>\n        </div>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!views/join.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <require from=\"elems/md-loading\"></require>\n  <style>md-input { height:65px }</style>\n  <section class=\"mdl-grid\" style=\"height:80vh;\">\n    <form class=\"mdl-cell mdl-cell--11-col mdl-cell--middle mdl-grid\" style=\"margin:0 auto; max-width:930px\">\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col\" style=\"padding:16px\">\n        <div class=\"mdl-card__title\" style=\"padding-left:0\">\n          <div class=\"mdl-card__title-text\">\n            Register Your Facility\n          </div>\n        </div>\n        <md-input value.bind=\"account.name\">Facility</md-input>\n        <md-input value.bind=\"account.license\">License</md-input>\n        <md-input value.bind=\"account.street\">Street</md-input>\n        <div class=\"mdl-grid\" style=\"padding:0; margin:0 -8px\">\n          <md-input value.bind=\"account.city\" class=\"mdl-cell mdl-cell--7-col\">City</md-input>\n          <md-input value.bind=\"account.state\" class=\"mdl-cell mdl-cell--2-col\">State</md-input>\n          <md-input value.bind=\"account.zip\" class=\"mdl-cell mdl-cell--3-col\">Zip</md-input>\n        </div>\n        <span class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px; margin-bottom:-8px\">${ loading }</span>\n      </div>\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col\" style=\"padding:16px\">\n        <div class=\"mdl-grid\" style=\"padding:0; margin:-8px\">\n          <md-input value.bind=\"user.name.first\" class=\"mdl-cell mdl-cell--6-col\">First Name</md-input>\n          <md-input value.bind=\"user.name.last\" class=\"mdl-cell mdl-cell--6-col\">Last Name</md-input>\n        </div>\n        <md-input value.bind=\"user.email\" type=\"email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\">Email</md-input>\n        <md-input value.bind=\"user.phone\" type=\"tel\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\">Phone</md-input>\n        <md-input value.bind=\"user.password\">Password</md-input>\n        <md-checkbox checked.bind=\"accept\" style=\"margin:8px 0 24px\" required>I accept the terms of use</md-checkbox>\n        <md-button raised color form disabled.bind=\"disabled\" click.delegate=\"join()\">Install</md-button>\n        <md-loading value.bind=\"progress.last_seq/progress.update_seq * 100\"></md-loading>\n      </div>\n    </form>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!views/login.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <require from=\"elems/md-loading\"></require>\n  <section class=\"mdl-grid\" style=\"margin-top:30vh;\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col mdl-cell--middle\" style=\"width:100%; margin:-75px auto 0; padding:48px 96px 28px 96px; max-width:450px\">\n      <md-input value.bind=\"email\" type=\"email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\" required>Email</md-input>\n      <md-input value.bind=\"password\" type=\"password\" required minlength=\"4\">Password</md-input>\n      <md-button\n        raised color form\n        click.delegate=\"login()\"\n        disabled.bind=\"disabled\"\n        style=\"padding-top:16px\">\n        Login\n      </md-button>\n      <md-loading value.bind=\"progress.last_seq/progress.update_seq * 100\"></md-loading>\n      <p class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px\">${ loading }</p>\n    </form>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!views/records.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <md-drawer>\n    <md-input\n      value.bind=\"filter\"\n      autoselect\n      style=\"padding:0 8px; width:auto\">\n      Filter\n    </md-input>\n    <a\n      repeat.for=\"day of days | recordFilter:filter\"\n      class=\"mdl-navigation__link ${ day == $parent.day ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectDay(day, true)\">\n      <div class=\"mdl-typography--title\">${ day }</div>\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell full-height\" style=\"width:424px\">\n      <div class=\"mdl-card__title\" style=\"padding-left:16px\">\n        <div class=\"mdl-card__title-text\">\n          Transaction History\n        </div>\n      </div>\n      <div innerHTML.bind=\"history\" class=\"mdl-grid\" style=\"font-size:10px; font-family:Monaco; margin:0; padding:0 16px; white-space:pre; line-height:15px\"></div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell full-height\" style=\"width:calc(100% - 424px - 32px)\">\n      <button id=\"import-export\"\n        style=\"position:absolute; z-index:2; text-align:right; top:5px; right:5px;\"\n        class=\"mdl-button mdl-js-button mdl-button--icon\">\n        <i class=\"material-icons\">more_vert</i>\n      </button>\n      <ul class=\"mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect\" for=\"import-export\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          show.bind=\"false\"\n          click.delegate=\"exportCSV()\"\n          class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n        <li\n          show.bind=\"true\"\n          disabled\n          class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n      </ul>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px;\">\n        <table md-table style=\"width:calc(100% - 16px);\">\n          <thead>\n            <tr>\n              <th style=\"width:15px\"></th>\n              <th style=\"text-align:left;\">Drug</th>\n              <th style=\"text-align:left;\">Ndc</th>\n              <th style=\"text-align:left; width:5%;\">Exp</th>\n              <th style=\"width:5%\">Qty</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr repeat.for=\"transaction of transactions\" class=\"${ $parent.transaction != transaction || 'is-selected'}\" click.delegate=\"selectTransaction(transaction)\">\n              <td style=\"padding:0 0 0 8px\">\n                <md-checkbox\n                  disabled.one-time=\"true\"\n                  checked.bind=\"transaction.verifiedAt\">\n                </md-checkbox>\n              </td>\n              <td style=\"text-align:left; white-space:normal;\">\n                ${ transaction.drug.generic }\n              </td>\n              <td style=\"text-align:left;\">\n                ${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') }\n              </td>\n              <td style=\"text-align:left;\">\n                ${ (transaction.exp.to || transaction.exp.from).slice(0, 10) }\n              </td>\n              <td>\n                ${ transaction.qty.to || transaction.qty.from }\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n  </section>\n</template>\n"; });
define('text!views/routes.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"mdl-layout mdl-js-layout mdl-layout--fixed-header\">\n    <header class=\"mdl-layout__header hide-when-printed\">\n      <div class=\"mdl-layout__header-row\">\n        <img src=\"assets/SIRUM.logo.notag.png\" style=\"width:100px; margin-left:-16px\">\n        <span class=\"mdl-layout-title\"></span>\n        <!-- Add spacer, to align navigation to the right -->\n        <div class=\"mdl-layout-spacer\"></div>\n        <nav class=\"mdl-navigation\">\n          <!-- show.bind=\"row.isVisible\"  -->\n          <a repeat.for=\"route of router.navigation\" show.bind=\"route.isVisible\" class=\"mdl-navigation__link ${route.isActive ? 'mdl-navigation__link--current' : ''}\" href.bind=\"route.href\" style=\"\">\n            ${route.title}\n          </a>\n        </nav>\n      </div>\n    </header>\n    <main class=\"mdl-layout__content\">\n      <!-- http://stackoverflow.com/questions/33636796/chrome-safari-not-filling-100-height-of-flex-parent -->\n      <router-view style=\"display:block; height:100vh\"></router-view>\n    </main>\n  </div>\n</template>\n"; });
define('text!views/shipments.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-menu\"></require>\n  <require from=\"elems/md-autocomplete\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <md-drawer autofocus>\n    <md-input\n      value.bind=\"filter\"\n      autoselect\n      style=\"padding:0 8px; width:auto\">\n      Filter shipments ${ role.account } you\n    </md-input>\n    <!-- <md-switch\n      checked.one-way=\"role.account == 'to'\"\n      click.delegate=\"swapRole()\"\n      style=\"margin:-33px 0 0 185px;\">\n    </md-switch> -->\n    <a\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment(null, true)\">\n      <div class=\"mdl-typography--title\">Create</div>\n      new shipment ${role.account} you\n    </a>\n    <a\n      repeat.for=\"shipment of shipments[role.account] | shipmentFilter:filter\"\n      class=\"mdl-navigation__link ${ shipment._id == shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment(shipment, true)\">\n      <div class=\"mdl-typography--title\" innerHtml.bind=\"shipment.account[role.partner].name | bold:filter\"></div>\n      <div style=\"font-size:12px\" innerHtml.bind=\"shipment.createdAt.slice(0, 10)+', '+(shipment.tracking.slice(-6) || shipment.tracking) | bold:filter\"></div>\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height\">\n      <div class=\"mdl-card__title\" style=\"display:block;\">\n        <div class=\"mdl-card__title-text\" style=\"text-transform:capitalize\">\n          ${ shipment._rev ? 'Shipment '+(shipment.tracking.slice(-6) || shipment.tracking) : 'New Shipment '+role.account+' You' }\n        </div>\n        <div style=\"margin-top:3px; margin-bottom:-25px\">\n          <strong>${transactions.length}</strong> items worth\n          <strong>$${ transactions | value:0:transactions.length }</strong>\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\">\n        <md-select\n          if.bind=\"role.account == 'from' || shipment._rev\"\n          change.delegate=\"setCheckboxes()\"\n          style=\"width:100%\"\n          value.bind=\"shipment\"\n          default.bind=\"{tracking:'New Tracking #', account:{from:account, to:account}}\"\n          options.bind=\"shipments[role.account]\"\n          property=\"tracking\">\n          Tracking #\n        </md-select>\n        <md-input\n          if.bind=\"role.account == 'to' && ! shipment._rev\"\n          focusin.delegate=\"setCheckboxes()\"\n          autofocus\n          required\n          style=\"width:100%\"\n          value.bind=\"shipment.tracking\">\n          Tracking #\n        </md-input>\n        <md-select\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.from\"\n          options.bind=\"(role.account == 'from' || shipment._rev) ? [shipment.account.from] : accounts[role.account]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.account == 'from'\">\n          <!-- disabled is for highlighting the current role -->\n          From\n        </md-select>\n        <md-select\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.to\"\n          options.bind=\"(role.account == 'to' || shipment._rev) ? [shipment.account.to] : accounts[role.account]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.account == 'to'\">\n          <!-- disabled is for highlighting the current role -->\n          To\n        </md-select>\n        <md-select\n          style=\"width:32%;\"\n          value.bind=\"shipment.status\"\n          options.bind=\"stati\"\n          disabled.bind=\"! shipment._rev\">\n          Status\n        </md-select>\n        <md-input\n          type=\"date\"\n          style=\"width:64%; margin-top:20px\"\n          value.bind=\"shipment[shipment.status+'At']\"\n          disabled.bind=\"! shipment._rev\"\n          input.delegate=\"saveShipment() & debounce:1000\">\n        </md-input>\n        <!-- <md-select\n          style=\"width:100%\"\n          value.bind=\"attachment.name\"\n          change.delegate=\"getAttachment()\"\n          options.bind=\"['','Shipping Label', 'Manifest']\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Attachment\n        </md-select>\n        <md-button color\n          if.bind=\"attachment.name\"\n          click.delegate=\"upload.click()\"\n          style=\"position:absolute; right:18px; margin-top:-48px; height:24px; line-height:24px\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Upload\n        </md-button>\n        <input\n          type=\"file\"\n          ref=\"upload\"\n          change.delegate=\"setAttachment(upload.files[0])\"\n          style=\"display:none\">\n        <div if.bind=\"attachment.url\" style=\"width: 100%; padding-top:56px; padding-bottom:129%; position:relative;\">\n          <embed\n            src.bind=\"attachment.url\"\n            type.bind=\"attachment.type\"\n            style=\"position:absolute; height:100%; width:100%; top:0; bottom:0\">\n        </div> -->\n        <!-- The above padding / positioning keeps a constant aspect ratio for the embeded pdf  -->\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised form\n          ref=\"newShipmentButton\"\n          style=\"width:100%\"\n          show.bind=\"shipment._id == shipmentId && ! shipment._rev\"\n          click.delegate=\"createShipment()\">\n          New Shipment Of ${ diffs.length || 'No' } Items\n        </md-button>\n        <md-button color raised\n          ref=\"moveItemsButton\"\n          style=\"width:100%\"\n          show.bind=\"shipment._id != shipmentId\"\n          disabled.bind=\"! diffs.length || ! shipment.account.to._id\"\n          click.delegate=\"shipment._rev ? moveTransactionsToShipment(shipment) : createShipment()\">\n          Move ${ diffs.length } Items\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <!-- disabled.bind=\"! searchReady\" -->\n      <md-autocomplete\n        placeholder=\"Add Drugs by Generic Name or NDC...\"\n        value.bind=\"term\"\n        input.delegate=\"search() & debounce:50\"\n        keydown.delegate=\"autocompleteShortcuts($event) & debounce:50\"\n        disabled.bind=\"role.account == 'to' && ! shipment._rev\"\n        style=\"margin:0px 16px\">\n        <table md-table>\n          <tr\n            repeat.for=\"drug of drugs\"\n            click.delegate=\"addTransaction(drug)\"\n            class=\"${ drug._id == $parent.drug._id && 'is-selected'}\">\n            <td class=\"mdl-data-table__cell--non-numeric\" innerHTML.bind=\"drug.generic | bold:term\" style=\"white-space:normal; max-width:70%\"></td>\n            <td class=\"mdl-data-table__cell--non-numeric\" style=\"max-width:30%\">${ drug._id + (drug.pkg ? '-'+drug.pkg : '') }</td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          show.bind=\"transactions.length\"\n          click.delegate=\"exportCSV()\">\n          Export CSV\n        </li>\n        <li\n          show.bind=\"!transactions.length\"\n          disabled>\n          Export CSV\n        </li>\n        <li\n          show.bind=\"role.account != 'to' || shipment._rev\"\n          click.delegate=\"$file.click()\">\n          Import CSV\n        </li>\n        <li\n          show.bind=\"role.account == 'to' && ! shipment._rev\"\n          disabled>\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px;\">\n        <table md-table style=\"width:calc(100% - 16px)\">\n          <thead>\n            <tr>\n              <th style=\"width:15px\"></th>\n              <th class=\"mdl-data-table__cell--non-numeric\" style=\"max-width:400px;padding-left:0\">Drug</th>\n              <th class=\"mdl-data-table__cell--non-numeric\" style=\"width:90px;padding-left:0\">Ndc</th>\n              <th style=\"width:40px; padding-left:0; padding-right:0px\">Value</th>\n              <th style=\"text-align:left; width:40px;\">Exp</th>\n              <th style=\"text-align:left; width:40px\">Qty</th>\n              <th style=\"text-align:left; width:40px;\">Box</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr style=\"padding-top:7px;\" repeat.for=\"transaction of transactions\" input.delegate=\"saveTransaction(transaction) & debounce:1000\">\n              <td style=\"padding:0 0 0 8px\">\n                <!-- if you are selecting new items you received to add to inventory, do not confuse these with the currently checked items -->\n                <!-- if you are selecting items to move to a new shipment, do not allow selection of items already verified by recipient e.g do not mix saving new items and removing old items, you must do one at a time -->\n                <!-- since undefined != false we must force both sides to be booleans just to show a simple inequality. use verifiedAt directly rather than isChecked because autocheck coerces isChecked to be out of sync -->\n                <md-checkbox\n                  click.delegate=\"manualCheck($index)\"\n                  disabled.bind=\" ! moveItemsButton.offsetParent && ! newShipmentButton.offsetParent && transaction.next.length\"\n                  checked.bind=\"transaction.isChecked\">\n                </md-checkbox>\n              </td>\n              <td click.delegate=\"focusInput('#exp_'+$index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"white-space:normal; padding-left:0\">\n                ${ transaction.drug.generic }\n              </td>\n              <td click.delegate=\"focusInput('#exp_'+$index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"padding:0\">\n                ${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') }\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction | value:2:transaction.qty[role.account] }\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.exp[role.partner] | date}\n                <md-input\n                  id.bind=\"'exp_'+$index\"\n                  keydown.delegate=\"expShortcutsKeydown($event, $index)\"\n                  input.trigger=\"expShortcutsInput($index)\"\n                  disabled.bind=\"transaction.next.length\"\n                  pattern=\"(0?[1-9]|1[012])/\\d{2}\"\n                  value.bind=\"transaction.exp[role.account] | date\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.qty[role.partner] }\n                  <!-- input event is not triggered on enter, so use keyup for qtyShortcutes instead   -->\n                  <!-- keyup rather than keydown because we want the new quantity not the old one -->\n                  <md-input\n                    id.bind=\"'qty_'+$index\"\n                    keydown.delegate=\"qtyShortcutsKeydown($event, $index)\"\n                    input.trigger=\"qtyShortcutsInput($event, $index)\"\n                    disabled.bind=\"transaction.next.length\"\n                    type=\"number\"\n                    value.bind=\"transaction.qty[role.account] | number\"\n                    style=\"width:40px; margin-bottom:-8px\"\n                    placeholder>\n                  </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  id.bind=\"'box_'+$index\"\n                  disabled.bind=\" ! transaction.verifiedAt || transaction.next.length\"\n                  keyup.delegate=\"setLocation(transaction) & debounce:1000\"\n                  keydown.delegate=\"boxShortcuts($event, $index)\"\n                  pattern=\"[A-Z]\\d{3}\"\n                  value.bind=\"transaction.location\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!elems/md-autocomplete.html', ['module'], function(module) { module.exports = "<template style=\"box-shadow:none\">\n  <!-- z-index of 2 is > than checkboxes which have z-index of 1 -->\n  <md-autocomplete-wrap\n    ref=\"form\"\n    class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\"\n    style=\"z-index:2; width:100%; padding-top:10px\">\n    <input class=\"md-input mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled\"\n      placeholder.bind=\"placeholder\"\n      focus.trigger=\"toggleResults()\"\n      focusout.delegate=\"toggleResults($event)\"\n      style=\"font-size:20px;\">\n    <div show.bind=\"showResults\"\n      tabindex=\"-1\"\n      style=\"width:100%; overflow-y:scroll; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25); max-height: 400px !important;\"\n      class=\"md-autocomplete-suggestions\">\n      <slot></slot>\n    </div>\n  </md-autocomplete-wrap>\n  <style>\n  @-webkit-keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @-webkit-keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  @keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  md-autocomplete {\n    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);\n    border-radius: 2px;\n    display: block;\n    height: 40px;\n    position: relative;\n    overflow: visible;\n    min-width: 190px; }\n    md-autocomplete[md-floating-label] {\n      padding-bottom: 26px;\n      box-shadow: none;\n      border-radius: 0;\n      background: transparent;\n      height: auto; }\n      md-autocomplete[md-floating-label] md-input-container {\n        padding-bottom: 0; }\n      md-autocomplete[md-floating-label] md-autocomplete-wrap {\n        height: auto; }\n      md-autocomplete[md-floating-label] button {\n        top: auto;\n        bottom: 5px; }\n    md-autocomplete md-autocomplete-wrap {\n      display: block;\n      position: relative;\n      overflow: visible;\n      height: 40px; }\n      md-autocomplete md-autocomplete-wrap md-progress-linear {\n        position: absolute;\n        bottom: 0;\n        left: 0;\n        width: 100%;\n        height: 3px;\n        transition: none; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear .md-container {\n          transition: none;\n          top: auto;\n          height: 3px; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter.ng-enter-active {\n            opacity: 1; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave.ng-leave-active {\n            opacity: 0; }\n    md-autocomplete input:not(.md-input) {\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: 100%;\n      box-sizing: border-box;\n      border: none;\n      box-shadow: none;\n      padding: 0 15px;\n      font-size: 14px;\n      line-height: 40px;\n      height: 40px;\n      outline: none;\n      background: transparent; }\n      md-autocomplete input:not(.md-input)::-ms-clear {\n        display: none; }\n    md-autocomplete button {\n      position: absolute;\n      top: 10px;\n      right: 10px;\n      line-height: 20px;\n      text-align: center;\n      width: 20px;\n      height: 20px;\n      cursor: pointer;\n      border: none;\n      border-radius: 50%;\n      padding: 0;\n      font-size: 12px;\n      background: transparent; }\n      md-autocomplete button:after {\n        content: '';\n        position: absolute;\n        top: -6px;\n        right: -6px;\n        bottom: -6px;\n        left: -6px;\n        border-radius: 50%;\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        opacity: 0;\n        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }\n      md-autocomplete button:focus {\n        outline: none; }\n        md-autocomplete button:focus:after {\n          -webkit-transform: scale(1);\n                  transform: scale(1);\n          opacity: 1; }\n      md-autocomplete button md-icon {\n        position: absolute;\n        top: 50%;\n        left: 50%;\n        -webkit-transform: translate3d(-50%, -50%, 0) scale(0.9);\n                transform: translate3d(-50%, -50%, 0) scale(0.9); }\n        md-autocomplete button md-icon path {\n          stroke-width: 0; }\n      md-autocomplete button.ng-enter {\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-enter.ng-enter-active {\n          -webkit-transform: scale(1);\n                  transform: scale(1); }\n      md-autocomplete button.ng-leave {\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-leave.ng-leave-active {\n          -webkit-transform: scale(0);\n                  transform: scale(0); }\n    @media screen and (-ms-high-contrast: active) {\n      md-autocomplete input {\n        border: 1px solid #fff; }\n      md-autocomplete li:focus {\n        color: #fff; } }\n\n  .md-autocomplete-suggestions table, .md-autocomplete-suggestions ul {\n    width:100%;         //added by adam\n    background:white;   //added by adam\n    position: relative;\n    margin: 0;\n    list-style: none;\n    padding: 0;\n    z-index: 100; }\n    .md-autocomplete-suggestions li {\n      line-height: 48px; //separated by adam\n    }\n    .md-autocomplete-suggestions li, .md-autocomplete-suggestions tr {\n      /*added by adam */\n      width:100%;\n      text-align: left;\n      position: static !important;\n      text-transform: none;\n      /* end addition */\n      cursor: pointer;\n      font-size: 14px;\n      overflow: hidden;\n\n      transition: background 0.15s linear;\n      text-overflow: ellipsis; }\n      .md-autocomplete-suggestions li.ng-enter, .md-autocomplete-suggestions li.ng-hide-remove {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-in 0.2s;\n                animation: md-autocomplete-list-in 0.2s; }\n      .md-autocomplete-suggestions li.ng-leave, .md-autocomplete-suggestions li.ng-hide-add {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-out 0.2s;\n                animation: md-autocomplete-list-out 0.2s; }\n      .md-autocomplete-suggestions li:focus {\n        outline: none; }\n  </style>\n</template>\n"; });
define('text!elems/md-button.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block; height:36px; line-height:36px\">\n  <button\n    ref=\"button\"\n    type=\"button\"\n    disabled.bind=\"disabledOrInvalid\"\n    click.delegate=\"click($event)\"\n    class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n    style=\"width:100%; height:inherit; line-height:inherit\">\n    <slot style=\"padding:auto\"></slot>\n  </button>\n</template>\n<!-- type=\"button\" because a button inside a form has it's type implicitly set to submit. And the spec says that the first button or input with type=\"submit\" is triggered on enter -->\n"; });
define('text!elems/md-checkbox.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <label ref=\"label\" class=\"mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect\" style=\"width:100%; margin-right:8px\">\n    <input\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      tabindex.one-time=\"tabindex\"\n      type=\"checkbox\"\n      class=\"mdl-checkbox__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <slot></slot>\n  </label>\n</template>\n"; });
define('text!elems/md-drawer.html', ['module'], function(module) { module.exports = "<template>\n    <slot></slot>\n</template>\n"; });
define('text!elems/md-input.html', ['module'], function(module) { module.exports = "<!-- firefox needs max-height otherwise is oversizes the parent element -->\n<template style=\"display:inline-block; box-sizing:border-box; max-height:auto;\">\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; margin-bottom:-12px; font-size:inherit; text-overflow:inherit; display:block; ${ label.textContent.trim() || 'padding-top:0px'};\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height. -->\n    <input\n      ref=\"input\"\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      max.bind=\"max\"\n      pattern.bind=\"pattern || '.*'\"\n      type.bind=\"type\"\n      step.bind=\"step\"\n      placeholder.bind=\"placeholder || ''\"\n      minlength.bind=\"minlength\"\n      style=\"padding:0; min-height:24px; line-height:24px; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    <label ref=\"label\" class=\"mdl-textfield__label\"><slot></slot></label>\n  </div>\n</template>\n"; });
define('text!elems/md-loading.html', ['module'], function(module) { module.exports = "<!-- vertical-align top is necessary for firefox -->\n<template>\n  <div ref=\"div\" class=\"mdl-progress mdl-js-progress\"></div>\n</template>\n"; });
define('text!elems/md-menu.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <button\n    ref=\"button\"\n    id.one-time=\"id\"\n    tabindex=\"-1\"\n    class=\"mdl-button mdl-js-button mdl-button--icon\">\n    <i class=\"material-icons\">more_vert</i>\n  </button>\n  <ul ref=\"ul\" class=\"mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect\" data-mdl-for.one-time=\"id\">\n    <slot></slot>\n  </ul>\n</template>\n"; });
define('text!elems/md-select.html', ['module'], function(module) { module.exports = "<!-- vertical-align top is necessary for firefox -->\n<template style=\"display:inline-block; box-sizing:border-box; vertical-align:top; margin-bottom:8px\">\n  <style>\n  @-moz-document url-prefix() {\n    select {\n       text-indent:-2px;\n    }\n  }\n  </style>\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; ${ label.textContent.trim() || 'padding-top:0px'}; margin-bottom:-12px; font-size:inherit;\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height.  Not sure why extra pixels are necessary in chrome and firefox -->\n    <select\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      required.bind=\"required || required === ''\"\n      style=\"padding:0; min-height:26px; line-height:26px; border-radius:0; font-size:inherit; font-weight:inherit; text-transform:inherit; -webkit-appearance:none; -moz-appearance:none;\">\n      <option if.bind=\"default\" model.bind=\"default\">\n        ${ property ? default[property] : default }\n      </option>\n      <option model.bind=\"option\" repeat.for=\"option of options\">\n        ${ property ? option[property] : option }\n      </option>\n    </select>\n    <label ref=\"label\" class=\"mdl-textfield__label\" style=\"text-align:inherit;\">\n      <slot></slot>\n    </label>\n  </div>\n</template>\n"; });
define('text!elems/md-snackbar.html', ['module'], function(module) { module.exports = "<template class=\"mdl-js-snackbar mdl-snackbar\">\n  <div class=\"mdl-snackbar__text\"></div>\n  <button class=\"mdl-snackbar__action\" type=\"button\"></button>\n</template>\n"; });
define('text!elems/md-switch.html', ['module'], function(module) { module.exports = "<template>\n  <label ref=\"label\" class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect\" for=\"switch\" style=\"width:100%\">\n    <input\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      type=\"checkbox\"\n      class=\"mdl-switch__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <span class=\"mdl-switch__label\"><slot></slot></span>\n  </label>\n</template>\n"; });
//# sourceMappingURL=app-bundle.js.map