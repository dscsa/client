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
      this.button.style.display = 'block';

      if (this.autofocus) this.header.firstChild.click();
    };

    MdDrawerCustomElement.prototype.detached = function detached() {
      if (drawer.children.length == 1) this.button.style.display = 'none';

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

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class;

  var MdInputCustomElement = exports.MdInputCustomElement = (_dec = (0, _aureliaFramework.bindable)({ name: 'value', defaultBindingMode: _aureliaFramework.bindingMode.twoWay }), _dec2 = (0, _aureliaFramework.bindable)('disabled'), _dec3 = (0, _aureliaFramework.bindable)('pattern'), _dec4 = (0, _aureliaFramework.bindable)('step'), _dec5 = (0, _aureliaFramework.bindable)('type'), _dec6 = (0, _aureliaFramework.bindable)('placeholder'), _dec7 = (0, _aureliaFramework.bindable)('input'), _dec8 = (0, _aureliaFramework.bindable)('max'), _dec9 = (0, _aureliaFramework.bindable)('required'), _dec10 = (0, _aureliaFramework.bindable)('minlength'), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = _dec6(_class = _dec7(_class = _dec8(_class = _dec9(_class = _dec10(_class = function () {
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

      if (this.autoselect) this.div.MaterialTextfield.input_.focus();
    };

    return MdInputCustomElement;
  }()) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
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
        if (typeof opts == 'string') opts = { message: opts, timeout: 80000 };

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
define('views/account',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router'], function (exports, _aureliaFramework, _pouch, _aureliaRouter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.filterValueConverter = exports.dateValueConverter = exports.jsonValueConverter = exports.account = undefined;

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
      if (this.user._id) {
        console.log('saving', this.user);
        this.db.user.put(this.user);
      }
      return true;
    };

    account.prototype.addUser = function addUser() {
      var _this3 = this;

      this.db.user.post(this.user).then(function (user) {
        _this3.users.unshift(user);
      }).catch(function (err) {
        _this3.snackbar.show(err.reason);
      });
    };

    account.prototype.deleteUser = function deleteUser() {
      var _this4 = this;

      var index = this.users.indexOf(this.user);
      console.log('deleting', this.user, this.users, index);
      this.db.user.delete(this.user).then(function (_) {
        _this4.users.splice(index, 1);
        _this4.selectUser();
      }).catch(function (err) {
        console.log(err);
        _this4.snackbar.show(err.reason);
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
      this.router.navigate('login', { trigger: true });
    };

    return account;
  }()) || _class);

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

  var dateValueConverter = exports.dateValueConverter = function () {
    function dateValueConverter() {
      _classCallCheck(this, dateValueConverter);
    }

    dateValueConverter.prototype.toView = function toView() {
      var date = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      return date.slice(0, 10);
    };

    return dateValueConverter;
  }();

  var filterValueConverter = exports.filterValueConverter = function () {
    function filterValueConverter() {
      _classCallCheck(this, filterValueConverter);
    }

    filterValueConverter.prototype.toView = function toView() {
      var users = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      filter = filter.toLowerCase();
      return users.filter(function (user) {
        return ~(user.name.first + ' ' + user.name.last).toLowerCase().indexOf(filter);
      });
    };

    return filterValueConverter;
  }();
});
define('views/drugs',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', '../libs/csv'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _csv) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.numberValueConverter = exports.jsonValueConverter = exports.drugs = undefined;

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
          ordered: Object.keys(_this.account.ordered).map(function (generic) {
            var ordered = { name: generic };
            _this.db.drug.get({ generic: generic }).then(function (drugs) {
              ordered.drugs = drugs.filter(function (drug) {
                return drug.generic == generic;
              });
            });
            return ordered;
          })
        };

        if (!params.id) {
          return _this.selectGroup(null, true);
        }

        return _this.db.drug.get({ _id: params.id }).then(function (drugs) {
          _this.selectDrug(drugs[0], true);
        });
      });
    };

    drugs.prototype.scrollGroups = function scrollGroups($event) {
      var _this2 = this;

      var index = this.groups.map(function (group) {
        return group.name;
      }).indexOf(this.group.name);
      this.scrollSelect($event, index, this.groups, function (group) {
        return _this2.selectGroup(group, true);
      });

      if ($event.which == 13) {
        document.querySelector('md-autocomplete input').blur();
      }

      $event.stopPropagation();
    };

    drugs.prototype.scrollDrugs = function scrollDrugs($event) {
      var _this3 = this;

      var index = this.group.drugs.indexOf(this.drug);
      this.scrollSelect($event, index, this.group.drugs, function (drug) {
        return _this3.selectDrug(drug);
      });
    };

    drugs.prototype.scrollSelect = function scrollSelect($event, index, list, cb, autoselect) {

      var last = list.length - 1;

      if ($event.which == 38) cb(list[index > 0 ? index - 1 : last]);

      if ($event.which == 40) cb(list[index < last ? index + 1 : 0]);
    };

    drugs.prototype.selectGroup = function selectGroup(group, autoselectDrug) {
      var _this4 = this;

      group = group || this.search().then(function (_) {
        return _this4.groups[0] || { drugs: [] };
      });

      Promise.resolve(group).then(function (group) {
        _this4.group = group;

        if (autoselectDrug) _this4.selectDrug(group.drugs[0]);
      });
    };

    drugs.prototype.selectDrug = function selectDrug() {
      var drug = arguments.length <= 0 || arguments[0] === undefined ? { generics: [{}] } : arguments[0];
      var autoselectGroup = arguments[1];

      if (!drug.generic && drug.form) drug.generic = drug.generics.map(function (generic) {
          return generic.name + " " + generic.strength;
        }).join(', ') + ' ' + drug.form;

      this.drug = drug;
      this.term = drug.generic || '';

      var url = drug._id ? 'drugs/' + drug._id : 'drugs';
      this.router.navigate(url, { trigger: false });

      if (autoselectGroup) this.selectGroup();
    };

    drugs.prototype.search = function search() {
      var _this5 = this;

      var term = (this.term || '').trim();

      if (term.length < 3) return Promise.resolve(this.groups = []);

      if (/^[\d-]+$/.test(term)) {
        this.regex = RegExp('(' + term + ')', 'gi');
        var drugs = this.db.drug.get({ ndc: term });
      } else {
        this.regex = RegExp('(' + term.replace(/ /g, '|') + ')', 'gi');
        var drugs = this.db.drug.get({ generic: term });
      }

      var groups = {};
      return drugs.then(function (drugs) {
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
        _this5.groups = Object.keys(groups).map(function (key) {
          return groups[key];
        });
      });
    };

    drugs.prototype.order = function order() {
      var _this6 = this;

      if (this.account.ordered[this.group.name]) {
        this.drawer.ordered = this.drawer.ordered.filter(function (group) {
          return group.name != _this6.group.name;
        });

        this.account.ordered[this.group.name] = undefined;
      } else {
        console.log('order');

        this.drawer.ordered.unshift(this.group);
        this.account.ordered[this.group.name] = {};
      }

      this.saveOrder();
    };

    drugs.prototype.exportCSV = function exportCSV() {
      var _this7 = this;

      this.snackbar.show('Exporting drugs as csv. This may take a few minutes');
      this.db.drug.get().then(function (drugs) {
        _this7.csv.unparse('Drugs.csv', drugs.map(function (drug) {
          var generic = genericName(drug);
          return {
            '': drug,
            _id: " " + drug._id,
            upc: " " + drug.upc,
            ndc9: " " + drug.ndc9,
            generic: generic,
            generics: drug.generics.map(function (generic) {
              return generic.name + " " + generic.strength;
            }).join(';'),
            ordered: _this7.account.ordered[generic] || { minQty: null, minDays: null, message: null }
          };
        }));
      });
    };

    drugs.prototype.importCSV = function importCSV() {
      var _this8 = this;

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
        _this8.$file.value = '';
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
        _this8.snackbar.show('Parsed ' + rows.length + ' rows. Uploading to server');
        return _this8.db.drug.post(rows);
      }).then(function (_) {
        return _this8.snackbar.show('Drugs import completed in ' + (Date.now() - start) + 'ms');
      }).catch(function (err) {
        return _this8.snackbar.show('Drugs not imported: ' + err);
      });
    };

    drugs.prototype.addGeneric = function addGeneric() {
      this.drug.generics.push({ name: '', strength: '' });
      this.saveDrug();
      return true;
    };

    drugs.prototype.removeGeneric = function removeGeneric() {
      this.drug.generics.pop();
      this.saveDrug();
      return true;
    };

    drugs.prototype.saveOrder = function saveOrder() {
      console.log('saving Order', this.account);
      return this.db.account.put(this.account);
    };

    drugs.prototype.addDrug = function addDrug() {
      var _this9 = this;

      delete this.drug.generic;
      this.db.drug.post(this.drug).then(function (res) {
        setTimeout(function (_) {
          return _this9.selectDrug(_this9.drug, true);
        }, 200);
      }).catch(function (err) {
        return _this9.snackbar.show('Drug not added: ' + err.name);
      });
    };

    drugs.prototype.saveDrug = function saveDrug() {
      var _this10 = this;

      delete this.drug.generic;
      this.db.drug.put(this.drug).catch(function (err) {
        return _this10.snackbar.show('Drug not saved: ' + err.name);
      });
    };

    drugs.prototype.deleteDrug = function deleteDrug() {
      console.log('TO BE IMPLEMENETED');
    };

    return drugs;
  }()) || _class);

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

    aurelia.use.standardConfiguration().plugin('aurelia-animator-css');

    aurelia.start().then(function (a) {
      return a.setRoot('views/routes');
    });
  }
});
define('views/inventory',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router'], function (exports, _aureliaFramework, _pouch, _aureliaRouter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.filterValueConverter = exports.toArrayValueConverter = exports.jsonValueConverter = exports.dateValueConverter = exports.inventory = undefined;

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
      this.resetFilter();
    }

    inventory.prototype.activate = function activate(params) {
      var _this = this;

      return this.db.user.session.get().then(function (session) {
        _this.account = session.account._id;
        _this.selectGroup();
      });
    };

    inventory.prototype.scrollGroups = function scrollGroups($event) {
      var index = this.groups.map(function (group) {
        return group.name;
      }).indexOf(this.group.name);
      var last = this.groups.length - 1;

      if ($event.which == 38) this.selectGroup(this.groups[index > 0 ? index - 1 : last]);

      if ($event.which == 40) this.selectGroup(this.groups[index < last ? index + 1 : 0]);

      if ($event.which == 13) {
        document.querySelector('md-autocomplete input').blur();
      }
    };

    inventory.prototype.selectGroup = function selectGroup(group) {
      var _this2 = this;

      group = group || this.search().then(function (_) {
        return _this2.groups[0] || { transactions: [] };
      });

      Promise.resolve(group).then(function (group) {
        _this2.term = group.name;
        _this2.group = group;

        group.transactions.sort(function (a, b) {
          var aExp = a.exp.from || '';
          var bExp = b.exp.from || '';
          var aBox = a.location || '';
          var bBox = b.location || '';
          var aQty = a.qty.from || '';
          var bQty = b.qty.from || '';

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

          _this2.filter.exp[transaction.exp.from] = { isChecked: true, count: 0, qty: 0 };
          _this2.filter.ndc[transaction.drug._id] = { isChecked: true, count: 0, qty: 0 };
        }
      });
    };

    inventory.prototype.resetFilter = function resetFilter() {
      this.filter = { exp: {}, ndc: {} };
    };

    inventory.prototype.search = function search() {
      var _this3 = this;

      var term = (this.term || '').trim();

      if (term.length < 3) return Promise.resolve(this.groups = []);

      if (/^[\d-]+$/.test(term)) {} else {
        this.regex = RegExp('(' + term.replace(/ /g, '|') + ')', 'gi');
        var transactions = this.db.transaction.get({ generic: term });
      }

      var groups = {};
      return transactions.then(function (transactions) {
        for (var _iterator2 = transactions, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
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

          groups[transaction.drug.generic] = groups[transaction.drug.generic] || { name: transaction.drug.generic, transactions: [] };
          groups[transaction.drug.generic].transactions.push(transaction);
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

    inventory.prototype.saveTransaction = function saveTransaction(transaction) {
      var _this4 = this;

      var isChecked = transaction.isChecked;
      delete transaction.isChecked;
      console.log('saving', transaction);
      this.db.transaction.put(transaction).then(function (_) {
        transaction.isChecked = isChecked;
      }).catch(function (e) {
        return _this4.snackbar.show('Transaction with exp ' + transaction.exp.from + ' and qty ' + transaction.qty.from + ' could not be saved: ' + e);
      });
    };

    inventory.prototype.removeInventory = function removeInventory() {
      var _this5 = this;

      var remove = [];

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
          remove.push(_this5.db.transaction.delete(transaction).then(function (_) {
            return _this5.group.transactions.splice(_this5.group.transactions.indexOf(transaction), 1);
          }));
        }
      };

      for (var _iterator3 = this.group.transactions, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref3;

        var _ret = _loop();

        if (_ret === 'break') break;
      }

      Promise.all(remove).then(function (_) {
        return _this5.snackbar.show(remove.length + ' transactions removed from inventory');
      });
    };

    return inventory;
  }()) || _class);

  var dateValueConverter = exports.dateValueConverter = function () {
    function dateValueConverter() {
      _classCallCheck(this, dateValueConverter);
    }

    dateValueConverter.prototype.toView = function toView(date) {
      if (!date) return '';
      return date != this.model ? date.slice(5, 7) + '/' + date.slice(2, 4) : this.view;
    };

    dateValueConverter.prototype.fromView = function fromView(date) {
      this.view = date;

      var _date$split = date.split('/');

      var month = _date$split[0];
      var year = _date$split[1];

      date = new Date('20' + year, month, 1);
      date.setDate(0);

      return this.model = date.toJSON();
    };

    return dateValueConverter;
  }();

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

  var toArrayValueConverter = exports.toArrayValueConverter = function () {
    function toArrayValueConverter() {
      _classCallCheck(this, toArrayValueConverter);
    }

    toArrayValueConverter.prototype.toView = function toView() {
      var obj = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var arr = [];
      for (var key in obj) {
        arr.push({ key: key, val: obj[key] });
      }return arr;
    };

    return toArrayValueConverter;
  }();

  var filterValueConverter = exports.filterValueConverter = function () {
    function filterValueConverter() {
      _classCallCheck(this, filterValueConverter);
    }

    filterValueConverter.prototype.toView = function toView() {
      var transactions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments[1];

      for (var _iterator4 = transactions, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
        var _ref4;

        if (_isArray4) {
          if (_i4 >= _iterator4.length) break;
          _ref4 = _iterator4[_i4++];
        } else {
          _i4 = _iterator4.next();
          if (_i4.done) break;
          _ref4 = _i4.value;
        }

        var _transaction = _ref4;

        filter.exp[_transaction.exp.from].count = 0;
        filter.exp[_transaction.exp.from].qty = 0;
        filter.ndc[_transaction.drug._id].count = 0;
        filter.ndc[_transaction.drug._id].qty = 0;
      }

      transactions = transactions.filter(function (transaction) {
        if (filter.rx) {
          if (!transaction.rx || !transaction.rx.from) return false;
          if (!transaction.rx.from.includes(filter.rx)) return false;
        }

        if (!filter.exp[transaction.exp.from].isChecked) {
          if (filter.ndc[transaction.drug._id].isChecked) {
            filter.exp[transaction.exp.from].count++;
            filter.exp[transaction.exp.from].qty += transaction.qty.from;
          }
          return false;
        }
        if (!filter.ndc[transaction.drug._id].isChecked) {
          if (filter.exp[transaction.exp.from].isChecked) {
            filter.ndc[transaction.drug._id].count++;
            filter.ndc[transaction.drug._id].qty += transaction.qty.from;
          }
          return false;
        }

        filter.exp[transaction.exp.from].count++;
        filter.ndc[transaction.drug._id].count++;
        filter.exp[transaction.exp.from].qty += transaction.qty.from;
        filter.ndc[transaction.drug._id].qty += transaction.qty.from;
        return true;
      });

      filter.exp = Object.assign({}, filter.exp);
      filter.ndc = Object.assign({}, filter.ndc);

      return transactions;
    };

    return filterValueConverter;
  }();
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
        name: 'SNF2',
        license: 'RCFE',
        street: '4744 Charles Samuel Dr',
        city: 'Tallahassee',
        state: 'FL',
        zip: '32309',
        ordered: {}
      };

      this.user = {
        name: { first: 'Adam', last: 'Kircher' },
        email: 'adam@sirum.org',
        phone: '650.799.2817',
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
        _this.loading = loading.resources;

        return Promise.all(loading.syncing);
      }).then(function (_) {
        console.log('join success', _);
        return _this.router.navigate('account');
      }).catch(function (_) {
        console.log('join failed', _);
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
      this.email = '@sirum.org';
      this.password = 'password';
      this.disabled = true;
    }

    login.prototype.activate = function activate() {
      var _this = this;

      this.db.user.session.delete().then(function (_) {
        return _this.disabled = false;
      }).catch(function (err) {
        return console.log('Logout failed: ' + err);
      });
    };

    login.prototype.login = function login() {
      var _this2 = this;

      this.db.user.session.post({ email: this.email, password: this.password }).then(function (loading) {

        _this2.disabled = true;

        _this2.loading = loading.resources;

        return Promise.all(loading.syncing);
      }).then(function (resources) {
        _this2.router.navigate('shipments');
      }).catch(function (err) {
        _this2.disabled = false;
        _this2.snackbar.show('Login failed: ' + err.reason);
      });
    };

    return login;
  }()) || _class);
});
define('views/records',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.drugNameValueConverter = exports.filterValueConverter = exports.shipments = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var shipments = exports.shipments = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
    function shipments(db, router, http) {
      _classCallCheck(this, shipments);

      this.db = db;
      this.router = router;
      this.http = http;
      this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      this.years = [2016, 2015, 2014, 2013, 2012, 2011, 2010];
      this.fromYear = this.toYear = new Date().getYear() + 1900;
      this.fromMonth = this.toMonth = this.months[new Date().getMonth()];
      this.stati = ['complete', 'verified', 'destroyed'];
      this.status = this.stati[0];
      this.history = '';
      this.scroll = this.scroll.bind(this);
    }

    shipments.prototype.deactivate = function deactivate() {
      removeEventListener('keyup', this.scroll);
    };

    shipments.prototype.activate = function activate(params) {
      var _this = this;

      addEventListener('keyup', this.scroll);
      this.db.user.session.get().then(function (session) {
        _this.account = session.account;
        _this.searchRange(params.id);
      });
    };

    shipments.prototype.searchRange = function searchRange(transId) {
      var _this2 = this;

      var fromMonth = this.months.indexOf(this.fromMonth);
      var toMonth = this.months.indexOf(this.toMonth);

      var fromDate = new Date(this.fromYear, fromMonth, 1);
      var toDate = new Date(this.toYear, toMonth, 1);

      var from = fromDate <= toDate ? fromDate : toDate;
      var to = fromDate > toDate ? fromDate : toDate;

      to.setMonth(to.getMonth() + 1);
      to.setDate(0);

      var query = { 'shipment._id': { $ne: this.account._id }, createdAt: { $gte: from, $lte: to } };

      if (this.status == 'verified') query.verifiedAt = { $type: 'string' };

      if (this.status == 'destroyed') query.verifiedAt = { $type: 'null' };

      return this.db.transaction.get(query).then(function (transactions) {
        _this2.select(transId ? transactions.filter(function (t) {
          return t._id === transId;
        })[0] : transactions[0]);
        return _this2.transactions = transactions;
      });
    };

    shipments.prototype.scroll = function scroll($event) {
      var index = this.transactions.indexOf(this.transaction);
      var last = this.transactions.length - 1;

      if ($event.which == 38) this.select(this.transactions[index > 0 ? index - 1 : last]);

      if ($event.which == 40) this.select(this.transactions[index < last ? index + 1 : 0]);
    };

    shipments.prototype.select = function select(transaction) {
      var _this3 = this;

      if (!transaction) return;
      this.transaction = transaction;
      this.router.navigate('records/' + transaction._id, { trigger: false });
      this.db.transaction.get({ _id: transaction._id }, { history: true }).then(function (history) {
        function id(k, o) {
          if (Array.isArray(o)) return o;
          return o.shipment.from.name + ' ' + o._id;
        }

        function pad(word) {
          return (word + ' '.repeat(25)).slice(0, 25);
        }
        _this3.history = JSON.stringify(history, function (k, v) {
          if (Array.isArray(v)) return v;

          var status = _this3.status || 'pickup';
          var href = '/#/shipments/' + v.shipment._id;

          return pad('From: ' + v.shipment.account.from.name) + pad('To: ' + v.shipment.account.to.name) + "<a href='" + href + "'>" + v.type + " <i class='material-icons' style='font-size:12px; vertical-align:text-top; padding-top:1px'>exit_to_app</i></a><br>" + pad(v.shipment.account.from.street) + pad(v.shipment.account.to.street) + 'Date ' + v.createdAt.slice(2, 10) + '<br>' + pad(v.shipment.account.from.city + ', ' + v.shipment.account.from.state + ' ' + v.shipment.account.from.zip) + pad(v.shipment.account.to.city + ', ' + v.shipment.account.to.state + ' ' + v.shipment.account.to.zip) + 'Quantity ' + (v.qty.to || v.qty.from);
        }, "   ").replace(/\[\n?\s*/g, "<div style='margin-top:-12px'>").replace(/\n?\s*\],?/g, '</div>').replace(/ *"/g, '').replace(/\n/g, '<br><br>');
      });
    };

    shipments.prototype.exportCSV = function exportCSV() {};

    return shipments;
  }()) || _class);

  var filterValueConverter = exports.filterValueConverter = function () {
    function filterValueConverter() {
      _classCallCheck(this, filterValueConverter);
    }

    filterValueConverter.prototype.toView = function toView() {
      var transactions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      filter = filter.toLowerCase();
      return transactions.filter(function (transaction) {
        return ~(transaction.to.name + ' ' + transaction.tracking + ' ' + transaction.status).toLowerCase().indexOf(filter);
      });
    };

    return filterValueConverter;
  }();

  var drugNameValueConverter = exports.drugNameValueConverter = function () {
    function drugNameValueConverter() {
      _classCallCheck(this, drugNameValueConverter);
    }

    drugNameValueConverter.prototype.toView = function toView(transaction) {
      return transaction.drug.generics.map(function (generic) {
        return generic.name + " " + generic.strength;
      }).join(', ') + ' ' + transaction.drug.form;
    };

    return drugNameValueConverter;
  }();
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

      config.map([{ route: 'login', moduleId: 'views/login', title: 'Login', nav: true }, { route: ['join', ''], moduleId: 'views/join', title: 'Join', nav: true }, { route: ['inventory', 'inventory/:id'], moduleId: 'views/inventory', title: 'Inventory', nav: true, roles: ["user"] }, { route: ['shipments', 'shipments/:id'], moduleId: 'views/shipments', title: 'Shipments', nav: true, roles: ["user"] }, { route: ['drugs', 'drugs/:id'], moduleId: 'views/drugs', title: 'Drugs', nav: true, roles: ["user"] }, { route: ['records', 'records/:id'], moduleId: 'views/records', title: 'Records', nav: true, roles: ["user"] }, { route: 'account', moduleId: 'views/account', title: 'Account', nav: true, roles: ["user"] }]);

      this.router = router;
    };

    return App;
  }();

  var AuthorizeStep = exports.AuthorizeStep = (_dec = (0, _aureliaFramework.inject)(_aureliaRouter.Router, _pouch.Db), _dec(_class = function () {
    function AuthorizeStep(router, db) {
      _classCallCheck(this, AuthorizeStep);

      this.db = db;

      if (!document.cookie) {
        console.log('emergency logout');
        router.navigate('login');
      }
    }

    AuthorizeStep.prototype.run = function run(routing, callback) {

      this.db.user.session.get().then(function (session) {

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

          if (!session || !session.account || !next.roles) {
            route.isVisible = !route.config.roles;continue;
          }
          var role = session.account._id.length == 7 ? 'user' : 'admin';
          route.isVisible = route.config.roles && ~route.config.roles.indexOf(role);
        }

        next.navModel.isVisible ? callback() : callback.cancel(new _aureliaRouter.Redirect('login'));
      }).catch(function (err) {
        return console.log('router error', err);
      });
    };

    return AuthorizeStep;
  }()) || _class);
});
define('views/shipments',['exports', 'aurelia-framework', 'aurelia-router', '../libs/pouch', 'aurelia-http-client', '../libs/csv'], function (exports, _aureliaFramework, _aureliaRouter, _pouch, _aureliaHttpClient, _csv) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.dateValueConverter = exports.boldValueConverter = exports.drugNameValueConverter = exports.valueValueConverter = exports.filterValueConverter = exports.jsonValueConverter = exports.numberValueConverter = exports.shipments = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var shipments = exports.shipments = (_dec = (0, _aureliaFramework.inject)(_pouch.Db, _aureliaRouter.Router, _aureliaHttpClient.HttpClient), _dec(_class = function () {
    function shipments(db, router, http) {
      _classCallCheck(this, shipments);

      this.csv = new _csv.Csv(['drug._id'], ['qty.from', 'qty.to', 'exp.from', 'exp.to', 'rx.from', 'rx.to', 'verifiedAt']);
      this.db = db;
      this.drugs = [];
      this.router = router;
      this.http = http;
      this.stati = ['pickup', 'shipped', 'received'];
      this.shipments = {};
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

    shipments.prototype.selectShipment = function selectShipment(shipment) {
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

      this.transactions = [];
      this.diffs = [];

      if (!shipmentId) return;

      this.db.transaction.get({ 'shipment._id': shipmentId }).then(function (transactions) {
        _this2.transactions = transactions;
        _this2.originalTransactions = transactions;
        for (var i in _this2.transactions) {
          _this2.transactions[i].isChecked = _this2.transactions[i].verifiedAt;
          if (!_this2.transactions[i].verifiedAt) _this2.autoCheck(i, false);
        }
      }).catch(console.log);
    };

    shipments.prototype.setStatus = function setStatus(shipment) {
      shipment.status = this.stati.reduce(function (prev, curr) {
        return shipment[curr + 'At'] ? curr : prev;
      });
    };

    shipments.prototype.swapRole = function swapRole() {
      var _ref4 = [this.role.partner, this.role.account];
      this.role.account = _ref4[0];
      this.role.partner = _ref4[1];

      this.selectShipment();
      return true;
    };

    shipments.prototype.saveShipment = function saveShipment() {
      var _this3 = this;

      delete this.shipment.status;
      return this.db.shipment.put(this.shipment).then(function (res) {
        _this3.setStatus(_this3.shipment);
      });
    };

    shipments.prototype.moveTransactionsToShipment = function moveTransactionsToShipment(shipment) {
      var _this4 = this;

      Promise.all(this.transactions.map(function (transaction) {
        if (!transaction.isChecked || transaction.verifiedAt) return;

        transaction.shipment = { _id: shipment._id };
        return _this4.db.transaction.put(transaction);
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

    shipments.prototype.expShortcuts = function expShortcuts($event, $index) {
      if ($event.which == 37 || $event.which == 39 || $event.which == 9) return;

      if ($event.which == 13) return document.querySelector('#qty_' + $index + ' input').focus();

      this.autoCheck($index, true);
    };

    shipments.prototype.qtyShortcuts = function qtyShortcuts($event, $index) {
      var _this6 = this;

      if ($event.which == 37 || $event.which == 39 || $event.which == 9) return false;

      if ($event.which == 13) {
        var rxInput = document.querySelector('#rx_' + $index + ' input');
        return rxInput.disabled ? document.querySelector('md-autocomplete input').focus() : rxInput.focus();
      }

      var transaction = this.transactions[$index];
      var doneeDelete = !transaction.qty.from && transaction.qty.to === 0;
      var donorDelete = !transaction.qty.to && transaction.qty.from === 0;

      if (donorDelete || doneeDelete) {
        this.db.transaction.delete(transaction).then(function (_) {
          _this6.transactions.splice($index, 1);
          _this6.diffs = _this6.diffs.filter(function (i) {
            return i != $index;
          }).map(function (i) {
            return i > $index ? i - 1 : i;
          });
        });
        document.querySelector('md-autocomplete input').focus();
      }

      this.autoCheck($index, true);
    };

    shipments.prototype.boxShortcuts = function boxShortcuts($event, $index) {
      if ($event.which == 13) document.querySelector('md-autocomplete input').focus();

      if ($event.which == 107 || $event.which == 187) {
        var box = document.querySelector('#box_' + $index + ' input');
        box.value = box.value[0] + (+box.value.slice(1) + 1);
        $event.preventDefault();
      }

      if ($event.which == 109 || $event.which == 189) {
        var _box = document.querySelector('#box_' + $index + ' input');
        _box.value = _box.value[0] + (+_box.value.slice(1) - 1);
        $event.preventDefault();
      }

      return true;
    };

    shipments.prototype.saveLastBox = function saveLastBox($event) {
      this.lastBox = $event.target.value;
      console.log(this.lastBox);
    };

    shipments.prototype.rxShortcuts = function rxShortcuts($event, $index) {
      if ($event.which == 13) document.querySelector('#box_' + $index + ' input').focus();
    };

    shipments.prototype.autoCheck = function autoCheck($index, showMessage) {
      var transaction = this.transactions[$index];

      var ordered = this.ordered[this.shipment.account.to._id][genericName(transaction.drug)];
      var qty = +transaction.qty[this.role.account];
      var exp = transaction.exp[this.role.account];

      if (!ordered || !qty) return;

      var defaultQty = transaction.drug.brand ? 1 : 10;
      var minQty = qty >= (+ordered.minQty || defaultQty);
      var minExp = exp ? new Date(exp) - Date.now() >= (ordered.minDays || 120) * 24 * 60 * 60 * 1000 : !ordered.minDays;
      var isChecked = transaction.isChecked || false;

      if ((minQty && minExp) == isChecked) {
        showMessage && ordered.destroyedMessage && this.snackbar.show(ordered.destroyedMessage);
        return showMessage && console.log('minQty', minQty, qty, 'minExp', minExp, exp);
      }

      if (isChecked) showMessage && this.snackbar.show(ordered.verifiedMessage || 'Drug is ordered');

      transaction.location = this.lastBox;

      this.manualCheck($index);
    };

    shipments.prototype.manualCheck = function manualCheck($index) {
      this.transactions[$index].isChecked = !this.transactions[$index].isChecked;

      var j = this.diffs.indexOf($index);
      ~j ? this.diffs.splice(j, 1) : this.diffs.push($index);
    };

    shipments.prototype.saveInventory = function saveInventory() {
      var _this7 = this;

      var method = 'post';
      var verified = true;
      var phrase = 'saved to';
      if (this.transactions[this.diffs[0]].verifiedAt) {
        method = 'delete';
        verified = null;
        phrase = 'removed from';
      }

      Promise.all(this.diffs.map(function (i) {
        return _this7.db.transaction.verified[method]({ _id: _this7.transactions[i]._id }).then(function (_) {
          _this7.transactions[i].verifiedAt = verified;
          return true;
        }).catch(function (err) {
          _this7.transactions[i].isChecked = _this7.transactions[i].verifiedAt;
          _this7.manualCheck(i);
          _this7.snackbar.show(err.reason);
        });
      })).then(function (all) {
        _this7.diffs = [];
        if (all.every(function (i) {
          return i;
        })) _this7.snackbar.show(all.length + ' items were ' + phrase + ' inventory');
      });
    };

    shipments.prototype.search = function search() {
      var _this8 = this;

      var term = this.term.trim();

      if (term.length < 3) {
        this.transactions = this.originalTransactions;
        return this.drugs = [];
      }

      if (/^[\d-]+$/.test(term)) {
        if (term[0] != '3' || term.length != 12) {
          var filter = this.transactions.filter(function (transaction) {
            console.log('search term', transaction.rx && transaction.rx.from, transaction.rx && transaction.rx.to, transaction.rx && (transaction.rx.from == term || transaction.rx.to == term));
            return transaction.rx && (transaction.rx.from == term || transaction.rx.to == term);
          });
          console.log('search term', filter);
          if (filter.length) {
            return this.transactions = filter;
          }
        }

        this.regex = RegExp('(' + term + ')', 'gi');
        var drugs = this.db.drug.get({ ndc: term });
      } else {
        this.regex = RegExp('(' + term.replace(/ /g, '|') + ')', 'gi');
        var drugs = this.db.drug.get({ generic: term });
      }

      drugs.then(function (drugs) {
        _this8.drugs = drugs;
        _this8.index = 0;
      });
    };

    shipments.prototype.scrollDrugs = function scrollDrugs($event) {
      var last = this.drugs.length - 1;

      if ($event.which == 38) this.index = this.index > 0 ? this.index - 1 : last;

      if ($event.which == 40) this.index = this.index < last ? this.index + 1 : 0;

      if ($event.which == 13) this.addTransaction(this.drugs[this.index]);

      if ($event.which == 106) this.term = "";

      return true;
    };

    shipments.prototype.selectRow = function selectRow($index) {
      console.log('select row');
      document.querySelector('#exp_' + $index + ' input').focus();
    };

    shipments.prototype.saveTransaction = function saveTransaction($index) {
      var _this9 = this;

      if (!document.querySelector('#exp_' + $index + ' input').validity.valid) return;

      console.log('saving', this.transactions[$index]);
      this.db.transaction.put(this.transactions[$index]).catch(function (err) {
        _this9.snackbar.show('Error saving transaction: ' + err.reason);
      });
    };

    shipments.prototype.addTransaction = function addTransaction(drug, transaction) {
      var _this10 = this;

      transaction = transaction || {
        qty: { from: null, to: null },
        rx: { from: null, to: null },
        exp: {
          from: this.transactions[0] ? this.transactions[0].exp.from : null,
          to: this.transactions[0] ? this.transactions[0].exp.to : null
        }
      };

      delete transaction.isChecked;

      transaction.drug = {
        _id: drug._id,
        generics: drug.generics,
        form: drug.form,
        pkg: drug.pkg
      };

      transaction.shipment = {
        _id: this.shipment._id
      };

      transaction.user = {
        _id: this.user
      };

      this.term = '';
      console.log('addTransaction', transaction);
      this.transactions.unshift(transaction);
      this.diffs = this.diffs.map(function (val) {
        return +val + 1;
      });
      setTimeout(function (_) {
        return _this10.selectRow(0);
      }, 100);
      return this.db.transaction.post(transaction).then(function (_) {
        transaction.isChecked = transaction.verifiedAt;
      }).catch(function (err) {
        _this10.snackbar.show('Transaction could not be added: ' + err.name);
        _this10.transactions.shift();
        _this10.diffs = _this10.diffs.map(function (val) {
          return val - 1;
        });
      });
    };

    shipments.prototype.exportCSV = function exportCSV() {
      var _this11 = this;

      var name = this.shipment._id ? 'Shipment ' + this.shipment._id + '.csv' : 'Inventory.csv';
      this.csv.unparse(name, this.transactions.map(function (transaction) {
        return {
          '': transaction,
          'drug._id': " " + transaction.drug._id,
          'drug.generic': genericName(transaction.drug),
          'drug.generics': transaction.drug.generics.map(function (generic) {
            return generic.name + " " + generic.strength;
          }).join(';'),
          shipment: _this11.shipment
        };
      }));
    };

    shipments.prototype.importCSV = function importCSV() {
      var _this12 = this;

      console.log('this.$file.value', this.$file.value);
      this.csv.parse(this.$file.files[0]).then(function (parsed) {
        return Promise.all(parsed.map(function (transaction) {
          _this12.$file.value = '';
          transaction.exp.to = toJsonDate(parseUserDate(transaction.exp.to));
          transaction.exp.from = toJsonDate(parseUserDate(transaction.exp.from));
          transaction.verifiedAt = toJsonDate(parseUserDate(transaction.verifiedAt));
          return _this12.db.drug.get({ _id: transaction.drug._id }).then(function (drugs) {
            if (drugs[0]) return { drug: drugs[0], transaction: transaction };
            throw 'Cannot find drug with _id ' + transaction.drug._id;
          });
        }));
      }).then(function (rows) {
        console.log('rows', rows);
        return Promise.all(rows.map(function (row) {
          return _this12.addTransaction(row.drug, row.transaction);
        }));
      }).then(function (_) {
        return _this12.snackbar.show('All Transactions Imported');
      }).catch(function (err) {
        return _this12.snackbar.show('Transactions not imported: ' + err);
      });
    };

    return shipments;
  }()) || _class);

  var numberValueConverter = exports.numberValueConverter = function () {
    function numberValueConverter() {
      _classCallCheck(this, numberValueConverter);
    }

    numberValueConverter.prototype.fromView = function fromView(str) {
      return str != null && str !== '' ? +str : null;
    };

    return numberValueConverter;
  }();

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

  var filterValueConverter = exports.filterValueConverter = function () {
    function filterValueConverter() {
      _classCallCheck(this, filterValueConverter);
    }

    filterValueConverter.prototype.toView = function toView() {
      var shipments = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      filter = filter.toLowerCase();
      return shipments.filter(function (shipment) {
        return ~(shipment.account.from.name + ' ' + shipment.account.to.name + ' ' + shipment.tracking + ' ' + shipment.status).toLowerCase().indexOf(filter);
      });
    };

    return filterValueConverter;
  }();

  var valueValueConverter = exports.valueValueConverter = function () {
    function valueValueConverter() {
      _classCallCheck(this, valueValueConverter);
    }

    valueValueConverter.prototype.toView = function toView(transactions, decimals, trigger) {
      transactions = Array.isArray(transactions) ? transactions : [transactions];

      return transactions.reduce(function (total, transaction) {
        if (!transaction.drug.price || !transaction.qty) return 0;
        var price = transaction.drug.price.nadac || transaction.drug.price.goodrx || 0;
        var qty = transaction.qty.to || transaction.qty.from || 0;
        return total + qty * price;
      }, 0).toFixed(decimals);
    };

    return valueValueConverter;
  }();

  var drugNameValueConverter = exports.drugNameValueConverter = function () {
    function drugNameValueConverter() {
      _classCallCheck(this, drugNameValueConverter);
    }

    drugNameValueConverter.prototype.toView = function toView(drug, regex) {
      return genericName(drug).replace(regex, '<strong>$1</strong>') + (drug.brand ? ' (' + drug.brand + ')' : '');
    };

    return drugNameValueConverter;
  }();

  var boldValueConverter = exports.boldValueConverter = function () {
    function boldValueConverter() {
      _classCallCheck(this, boldValueConverter);
    }

    boldValueConverter.prototype.toView = function toView(text, bold) {
      return bold ? text.replace(RegExp('(' + bold + ')', 'i'), '<strong>$1</strong>') : text;
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

      var add = date.includes('+');
      var sub = date.includes('-');

      var _parseUserDate = parseUserDate(date.replace(/[+-]/, ''));

      var month = _parseUserDate.month;
      var year = _parseUserDate.year;


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

      this.view = month + '/' + year;

      return this.model = toJsonDate({ month: month, year: year });
    };

    return dateValueConverter;
  }();

  function parseUserDate(date) {
    date = date.split('/');
    return {
      year: date.pop(),
      month: date.shift()
    };
  }

  function toJsonDate(_ref5) {
    var month = _ref5.month;
    var year = _ref5.year;

    var date = new Date('20' + year, month, 1);
    date.setDate(0);
    return date.toJSON();
  }

  function genericName(drug) {
    return drug.generics.map(function (generic) {
      return generic.name + " " + generic.strength;
    }).join(', ') + ' ' + drug.form;
  }
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
define('environment copy',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: true
  };
});
define('binding-behaviors/environment copy',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: true
  };
});
define('binding-behaviors/array',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var ArrayBindingBehavior = exports.ArrayBindingBehavior = function () {
    function ArrayBindingBehavior() {
      _classCallCheck(this, ArrayBindingBehavior);
    }

    ArrayBindingBehavior.prototype.bind = function bind(binding, source, parameter) {
      binding.standardObserveProperty = binding.observeProperty;
      binding.observeProperty = function (obj, property) {
        this.standardObserveProperty(obj, property);
        var value = obj[property];
        if (Array.isArray(value)) {
          this.observeArray(value);
          if (parameter) {
            for (var _iterator = value, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
              var _ref;

              if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
              } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
              }

              var each = _ref;

              this.standardObserveProperty(each, parameter);
            }
          }
        }
      };
    };

    ArrayBindingBehavior.prototype.unbind = function unbind(binding, source) {
      binding.observeProperty = binding.standardObserveProperty;
      binding.standardObserveProperty = null;
    };

    return ArrayBindingBehavior;
  }();
});
define('views/inventory copy',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router'], function (exports, _aureliaFramework, _pouch, _aureliaRouter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.drugNameValueConverter = exports.filterValueConverter = exports.numberValueConverter = exports.jsonValueConverter = exports.dateValueConverter = exports.inventory = undefined;

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
      this.session = this.router = router;
      this.scrollGroups = this.scrollGroups.bind(this);
    }

    inventory.prototype.deactivate = function deactivate() {
      removeEventListener('keyup', this.scrollGroups);
    };

    inventory.prototype.activate = function activate(params) {
      var _this = this;

      addEventListener('keyup', this.scrollGroups);
      return this.db.user.session.get().then(function (session) {
        _this.account = session.account._id;

        if (!params.id) {
          return _this.selectGroup(null, true);
        }

        return _this.db.transaction.get({ ndc: params.id, 'shipment._id': _this.account }).then(function (drugs) {
          _this.selectDrug(drugs[0], true);
        });
      });
    };

    inventory.prototype.scrollGroups = function scrollGroups($event) {
      var _this2 = this;

      var index = this.groups.map(function (group) {
        return group.name;
      }).indexOf(this.group.name);
      this.scrollSelect($event, index, this.groups, function (group) {
        return _this2.selectGroup(group, true);
      });

      if ($event.which == 13) {
        document.querySelector('md-autocomplete input').blur();
      }

      $event.stopPropagation();
    };

    inventory.prototype.scrollDrugs = function scrollDrugs($event) {
      var _this3 = this;

      var index = this.group.drugs.indexOf(this.drug);
      this.scrollSelect($event, index, this.group.drugs, function (drug) {
        return _this3.selectDrug(drug);
      });
    };

    inventory.prototype.scrollSelect = function scrollSelect($event, index, list, cb, autoselect) {

      var last = list.length - 1;

      if ($event.which == 38) cb(list[index > 0 ? index - 1 : last]);

      if ($event.which == 40) cb(list[index < last ? index + 1 : 0]);
    };

    inventory.prototype.selectGroup = function selectGroup(group, autoselectDrug) {
      var _this4 = this;

      this.mode = false;

      group = group || this.search().then(function (_) {
        return _this4.groups[0] || { drugs: [] };
      });

      Promise.resolve(group).then(function (group) {
        _this4.term = group.name;
        _this4.group = group;

        if (autoselectDrug) _this4.selectDrug(group.drugs[0]);
      });
    };

    inventory.prototype.selectDrug = function selectDrug() {
      var _this5 = this;

      var drug = arguments.length <= 0 || arguments[0] === undefined ? { transactions: [{}] } : arguments[0];
      var autoselectGroup = arguments[1];


      this.drug = drug;

      var url = 'inventory';
      if (drug.transactions[0].drug) {
        url = 'inventory/' + drug.transactions[0].drug._id;
        this.db.drug.get({ _id: drug.transactions[0].drug._id }).then(function (drugs) {
          return _this5.image = drugs[0].image;
        });
      }

      this.router.navigate(url, { trigger: false });

      if (autoselectGroup) this.selectGroup();
    };

    inventory.prototype.search = function search() {
      var _this6 = this;

      var term = (this.term || '').trim();

      if (term.length < 3) return Promise.resolve(this.groups = []);

      if (/^[\d-]+$/.test(term)) {} else {
        this.regex = RegExp('(' + term.replace(/ /g, '|') + ')', 'gi');
        var transactions = this.db.transaction.get({ generic: term });
      }

      var groups = {};
      return transactions.then(function (transactions) {
        console.log(transactions);
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

          var generic = transaction.drug.generic;
          var _id = transaction.drug._id;
          groups[generic] = groups[generic] || { name: generic, drugs: {} };
          groups[generic].drugs[_id] = groups[generic].drugs[_id] || { total: 0, transactions: [] };
          groups[generic].drugs[_id].total += transaction.qty.from;
          groups[generic].drugs[_id].transactions.push(transaction);
        }
        console.log(groups);
        _this6.groups = Object.keys(groups).map(function (key) {
          var group = groups[key];
          group.drugs = Object.keys(group.drugs).map(function (key) {
            group.drugs[key].transactions.sort(function (a, b) {
              var aExp = a.exp.from || '';
              var bExp = b.exp.from || '';
              var aBox = a.location || '';
              var bBox = b.location || '';
              var aQty = a.qty.from || '';
              var bQty = b.qty.from || '';

              if (aBox > bBox) return -1;
              if (aBox < bBox) return 1;
              if (aExp < bExp) return -1;
              if (aExp > bExp) return 1;
              if (aQty > bQty) return -1;
              if (aQty < bQty) return 1;
              return 0;
            });
            return group.drugs[key];
          });
          return group;
        });
      });
    };

    inventory.prototype.toggleRepack = function toggleRepack() {
      this.mode = !this.mode;
      this.repack = this.drug.transactions.map(function (s) {
        return s.qty.from;
      });
      this.sumRepack();
      return true;
    };

    inventory.prototype.sumGroup = function sumGroup() {
      this.drugs.total = this.drugs.transactions.reduce(function (a, b) {
        return a + (+b.qty.from || 0);
      }, 0);
    };

    inventory.prototype.sumRepack = function sumRepack() {
      this.repack.total = this.repack.reduce(function (a, b) {
        return +a + +b;
      }, 0);
    };

    inventory.prototype.saveTransaction = function saveTransaction(transaction) {
      var _this7 = this;

      console.log('saving', transaction);
      this.db.transaction.put(transaction).catch(function (e) {
        return _this7.snackbar.show({
          message: 'Transaction with exp ' + transaction.exp[_this7.role.account] + ' and qty ' + transaction.qty[_this7.role.account] + ' could not be saved'
        });
      });
    };

    inventory.prototype.repackage = function repackage() {
      var all = [];
      var exp = null;
      var trans = {
        _id: undefined,
        _rev: undefined,
        qty: { from: 0, to: 0 },
        lot: { from: null, to: null },
        exp: { from: Infinity, to: Infinity },
        history: []
      };

      trans = Object.assign({}, this.drug.transactions[0], trans);

      for (var i = this.repack.length - 1; i >= 0; i--) {
        var qty = +this.repack[i];
        var src = this.drug.transactions[i];

        if (!qty || src.qty.from != qty && src.history.length > 1) continue;

        trans.qty.from += qty;

        if (src.qty.from == qty) {
          var _trans$history;

          (_trans$history = trans.history).push.apply(_trans$history, src.history);
          this.drug.transactions.splice(i, 1);
          all.push(this.db.transaction.delete(src));
        } else {
          if (src.history.length == 1) {
            var _src$history = src.history;
            var transaction = _src$history[0].transaction;

            trans.history.push({ transaction: transaction, qty: qty });
          }
          src.qty.from -= qty;
          all.push(this.db.transaction.put(src));
        }

        if (src.exp.from) trans.exp.from = Math.min(trans.exp.from, new Date(src.exp.from));
      }

      trans.exp.from = new Date(trans.exp.from).toJSON();

      this.drug.transactions.unshift(trans);
      this.mode = false;

      return this.db.transaction.post(trans).then(function (_) {
        return Promise.all(all);
      });
    };

    return inventory;
  }()) || _class);

  var dateValueConverter = exports.dateValueConverter = function () {
    function dateValueConverter() {
      _classCallCheck(this, dateValueConverter);
    }

    dateValueConverter.prototype.toView = function toView(date) {
      if (!date) return '';
      return date != this.model ? date.slice(5, 7) + '/' + date.slice(2, 4) : this.view;
    };

    dateValueConverter.prototype.fromView = function fromView(date) {
      this.view = date;

      var _date$split = date.split('/');

      var month = _date$split[0];
      var year = _date$split[1];

      date = new Date('20' + year, month, 1);
      date.setDate(0);

      return this.model = date.toJSON();
    };

    return dateValueConverter;
  }();

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

    numberValueConverter.prototype.fromView = function fromView(str) {
      return +str;
    };

    return numberValueConverter;
  }();

  var filterValueConverter = exports.filterValueConverter = function () {
    function filterValueConverter() {
      _classCallCheck(this, filterValueConverter);
    }

    filterValueConverter.prototype.toView = function toView() {
      var groups = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var filter = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      filter = filter.toLowerCase();
      return groups.filter(function (group) {
        return ~genericName(group.transactions[0]).toLowerCase().indexOf(filter);
      });
    };

    return filterValueConverter;
  }();

  var drugNameValueConverter = exports.drugNameValueConverter = function () {
    function drugNameValueConverter() {
      _classCallCheck(this, drugNameValueConverter);
    }

    drugNameValueConverter.prototype.toView = function toView(transaction, bold) {
      var text = genericName(transaction);
      return bold ? text.replace(RegExp('(' + bold + ')', 'i'), '<strong>$1</strong>') : text;
    };

    return drugNameValueConverter;
  }();

  function genericName(transaction) {
    return transaction.drug.generics.map(function (generic) {
      return generic.name + " " + generic.strength;
    }).join(', ') + ' ' + transaction.drug.form;
  }
});
define('text!views/account.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <md-drawer>\n    <md-input value.bind=\"filter\" style=\"padding:0 8px\">Filter Users</md-input>\n    <a\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! user.email ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser({name:{}, account:{_id:session.account._id}})\">\n      <div class=\"mdl-typography--title\">New User</div>\n    </a>\n    <a\n      repeat.for=\"user of users | filter:filter\"\n      class=\"mdl-navigation__link ${ user.email == $parent.user.email ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser(user)\">\n      <div class=\"mdl-typography--title\">${ user.name.first+' '+user.name.last}</div>\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div class=\"mdl-card__title\">\n        <div class=\"mdl-card__title-text\">\n          User Information\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\" input.delegate=\"saveUser() & debounce:1000\">\n        <md-input style=\"width:49%\" value.bind=\"user.name.first\" required>First Name</md-input>\n        <md-input style=\"width:49%\" value.bind=\"user.name.last\" required>Last Name</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.email\" type=\"email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\" required>Email</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.phone\" type=\"tel\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Phone</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.password\" if.bind=\" ! user._id\" required>Password</md-input>\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised style=\"width:100%\" if.bind=\"! user._id\" form click.delegate=\"addUser()\">Create User</md-button>\n        <md-button color raised style=\"width:100%\" if.bind=\"user._id == session._id\" click.delegate=\"logout()\">Logout</md-button>\n        <md-button color=\"accent\" raised style=\"width:100%\" if.bind=\"user._id && user._id != session._id\" click.delegate=\"deleteUser()\">Delete User</md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <table md-table style=\"margin:8px 16px; width:calc(100% - 32px)\">\n        <thead>\n          <tr>\n            <th class=\"mdl-data-table__cell--non-numeric\">Authorized</th>\n            <th class=\"mdl-data-table__cell--non-numeric\">\n              <md-select\n                value.bind=\"type\"\n                options.bind=\"['From', 'To']\"\n                style=\"width:50px; font-weight:bold; margin-bottom:-26px\">\n              </md-select>\n            </th>\n            <th class=\"mdl-data-table__cell--non-numeric\">License</th>\n            <th class=\"mdl-data-table__cell--non-numeric\">Joined</th>\n            <th class=\"mdl-data-table__cell--non-numeric\">Location</th>\n          </tr>\n        </thead>\n        <tr repeat.for=\"account of accounts\" if.bind=\"account != $parent.account\">\n          <td class=\"mdl-data-table__cell--non-numeric\">\n            <md-checkbox\n              if.bind=\"type != 'To'\"\n              checked.one-time=\"$parent.account.authorized.indexOf(account._id) != -1\"\n              click.delegate=\"authorize(account._id)\">\n            </md-checkbox>\n            <md-checkbox\n              if.bind=\"type == 'To'\"\n              checked.one-time=\"account.authorized.indexOf($parent.account._id) != -1\"\n              disabled.bind=\"true\">\n            </md-checkbox>\n          </td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.name }</td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.license }</td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.createdAt | date }</td>\n          <td class=\"mdl-data-table__cell--non-numeric\">${ account.city+', '+account.state }</td>\n        </tr>\n      </table>\n    </div>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!views/drugs.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-table'></require>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-menu\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-autocomplete\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <md-drawer>\n    <md-select\n      options.bind=\"['Ordered', 'Inventory < ReorderAt', 'Inventory > ReorderTo', 'Inventory Expiring before Min Days', 'Missing Retail Price', 'Missing Wholesale Price', 'Missing Image']\"\n      style=\"padding:0 8px;\"\n      disabled.bind=\"true\">\n      Quick Search\n    </md-select>\n    <a\n      style=\"font-size:12px; line-height:18px; padding:16px 8px\"\n      class=\"mdl-navigation__link ${ ! group.name ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectDrug(undefined, true)\">\n      Add New Drug\n    </a>\n    <a\n      repeat.for=\"ordered of drawer.ordered\"\n      style=\"font-size:12px; line-height:18px; padding:16px 8px\"\n      class=\"mdl-navigation__link ${ ordered.name == group.name ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectGroup(ordered, true)\">\n      ${ ordered.name }\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div\n        class=\"mdl-card__supporting-text\"\n        input.delegate=\"drug._rev && saveDrug() & debounce:1000\"\n        style=\"font-size:16px;\">\n        <md-input\n          required\n          style=\"width:49%\"\n          value.bind=\"drug._id\"\n          disabled.bind=\"drug._rev\"\n          pattern=\"\\d{4}-\\d{4}|\\d{5}-\\d{3}|\\d{5}-\\d{4}\">\n          Product NDC\n        </md-input>\n        <md-input style=\"width:49%\"\n          value.one-way=\"drug._id ? ('00000'+drug._id.split('-').slice(0,1)).slice(-5)+('0000'+drug._id.split('-').slice(1)).slice(-4) : ''\"\n          disabled=\"true\">\n          NDC9\n        </md-input>\n        <div if.bind=\"drug.generics[0].name\" style=\"position:relative\">\n          <md-button color fab=\"11\"\n            show.bind=\"drug.generics[drug.generics.length-1].name\"\n            click.delegate=\"addGeneric()\"\n            style=\"position:absolute; left:153px; margin-top:-5px; z-index:1\">\n            +\n          </md-button>\n          <md-button color fab=\"11\"\n            show.bind=\"! drug.generics[drug.generics.length-1].name\"\n            mousedown.delegate=\"removeGeneric()\"\n            style=\"position:absolute; right:153px; margin-top:-5px; z-index:1\">\n            -\n          </md-button>\n        </div>\n        <div repeat.for=\"generic of drug.generics\">\n          <md-input\n            required\n            style=\"width:82%\"\n            value.bind=\"generic.name\">\n            ${ $index == 0 ? 'Generic Names & Strengths' : ''}\n          </md-input>\n          <md-input\n            required\n            style=\"width:16%\"\n            value.bind=\"generic.strength\">\n          </md-input>\n        </div>\n        <md-input\n          style=\"width:49%\"\n          value.bind=\"drug.brand\">\n          Brand Name\n        </md-input>\n        <md-input\n          required\n          style=\"width:49%\"\n          value.bind=\"drug.form\">\n          Form\n        </md-input>\n        <md-input\n          style=\"width:100%\"\n          value.bind=\"drug.labeler\">\n          Labeler\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.nadac\"\n          disabled.bind=\"! drug._rev\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:49%\">\n          Nadac Price\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.goodrx | number:3\"\n          disabled.bind=\"! drug._rev\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:49%\">\n          GoodRx Price\n        </md-input>\n        <md-input\n          pattern=\"//[a-zA-Z0-9/.\\-_%]+\"\n          value.bind=\"drug.image\"\n          style=\"width:100%; font-size:9px;\">\n          ${ drug.image ? 'Image' : 'Image URL'}\n        </md-input>\n        <img\n          style=\"width:100%;\"\n          if.bind=\"drug.image\"\n          src.bind=\"drug.image\">\n      </div>\n      <div class=\"mdl-card__actions\">\n        <!-- <md-button color=\"accent\" raised\n          if.bind=\"drug._rev\"\n          style=\"width:100%;\"\n          disabled\n          click.delegate=\"deleteDrug()\">\n          Delete Drug\n        </md-button> -->\n        <md-button color raised\n          if.bind=\" ! drug._rev\"\n          style=\"width:100%;\"\n          click.delegate=\"addDrug()\"\n          form>\n          Add Drug\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <md-autocomplete\n        placeholder=\"Search Drugs by Generic Name or NDC...\"\n        value.bind=\"term\"\n        input.delegate=\"search()\"\n        keyup.delegate=\"scrollGroups($event)\"\n        style=\"margin:0px 16px; padding-right:15px\">\n        <table md-table>\n          <tr\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectGroup(group, true)\"\n            class=\"${ group.name == $parent.group.name && 'is-selected'}\">\n            <td\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.name.replace(regex, '<strong>$1</strong>')\">\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li click.delegate=\"exportCSV()\" class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n        <li click.delegate=\"$file.click()\" class=\"mdl-menu__item\">\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <md-switch\n        show.bind=\"group\"\n        style=\"position:absolute; right:25px; top:47px; z-index:1\"\n        checked.one-way=\"account.ordered[group.name]\"\n        disabled.bind=\"! account.ordered[group.name] && ! drug._rev\"\n        click.delegate=\"order()\">\n      </md-switch>\n      <div style=\"width:100%; height:100%; display:flex\">\n        <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px; flex:1;\">\n          <table md-table style=\"width:calc(100% - 16px);\">\n            <thead>\n              <tr>\n                <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Labeler</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Brand</th>\n                <th style=\"text-align:left; width:40px; padding-left:0;\">Nadac</th>\n                <th style=\"text-align:left; width:${ account.ordered[group.name] ? '40px' : '85px'}; padding-left:0;\">GoodRx</th>\n              </tr>\n            </thead>\n            <tr repeat.for=\"drug of group.drugs\" click.delegate=\"selectDrug(drug)\" class=\"${ drug._id == $parent.drug._id ? 'is-selected' : ''}\">\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug._id }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug.labeler }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug.brand }</td>\n              <td style=\"padding:0; text-align:left\">${ drug.price.nadac | number:3 }</td>\n              <td style=\"padding:0; text-align:left\">${ drug.price.goodrx | number:3 }</td>\n            </tr>\n          </table>\n        </div>\n        <div show.bind=\"account.ordered[group.name]\" input.delegate=\"saveOrder() & debounce:1000\" style=\"overflow:hidden; width:200px; margin-top:10px; margin-right:16px\">\n          Ordered\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).minQty\"\n            placeholder=\"10\"\n            style=\"width:100%\">\n            Min Qty\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).minDays\"\n            placeholder=\"120\"\n            style=\"width:100%\">\n            Min Days\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.name] || {}).verifiedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Verified Message\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.name] || {}).destroyedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Destroyed Message\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).maxPrice\"\n            disabled.bind=\"true\"\n            style=\"width:100%\">\n            Max Price\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).reorderAt\"\n            disabled.bind=\"true\"\n            style=\"width:100%\">\n            Reorder At\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.name] || {}).reorderTo\"\n            disabled.bind=\"true\"\n            style=\"width:100%\">\n            Reorder To\n          </md-input>\n        </div>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!views/index.html', ['module'], function(module) { module.exports = "<!doctype html>\n<html style=\"overflow:hidden\">\n  <head>\n    <title>Loading SIRUM...</title>\n    <script src=\"assets/material.1.1.3.js\"></script>\n    <link rel=\"stylesheet\" href=\"assets/material.icon.css\">\n    <link rel=\"stylesheet\" href=\"assets/material.1.1.3.css\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <style>\n    body { background:#eee }\n    a { color:rgb(0,88,123); text-decoration:none }\n\n    .full-height { height:calc(100vh - 96px); overflow-y:auto}\n\n    .mdl-layout__header { background:white;}\n    .mdl-layout__header, .mdl-layout__drawer, .mdl-layout__header-row .mdl-navigation__link, .mdl-layout__header .mdl-layout__drawer-button { color:rgb(66,66,66);}\n\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link { padding:16px;}\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link--current { border-left:solid 3px red; padding-left:13px; background:#e0e0e0; color:inherit }\n\n    .mdl-layout__header-row .mdl-navigation__link { border-top:solid 3px white; }\n    .mdl-layout__header-row .mdl-navigation__link--current { font-weight:600;  border-top-color:red;}\n\n    .mdl-data-table th { height:32px }\n    .mdl-data-table tbody tr { height:auto }\n    .mdl-data-table td { border:none; padding-top:8px; padding-bottom:8px; height:auto }\n\n    .mdl-button--raised { box-shadow:none } /*otherwise disabled.bind has weird animaiton twitching */\n    .mdl-button--fab.mdl-button--colored{ background:rgb(0,88,123);}\n\n    .mdl-card__supporting-text { width:100%; box-sizing: border-box; overflow-y:scroll; flex:1 }\n    .mdl-card__actions { padding:16px }\n    /* animate page transitions */\n    .au-enter-active { animation:slideDown .5s; }\n\n    .mdl-snackbar { left:auto; right:6px; bottom:6px; margin-right:0%; font-size:24px; font-weight:300; max-width:100% }\n    .mdl-snackbar--active { transform:translate(0, 0) !important; -webkit-transform:translate(0, 0) !important; }\n    .mdl-snackbar__text { padding:8px 24px; }\n\n    @keyframes slideDown {\n      0% {\n        opacity:0;\n        -webkit-transform:translate3d(0, -100%, 0);\n        -ms-transform:translate3d(0, -100%, 0);\n        transform:translate3d(0, -100%, 0)\n      }\n      100% {\n        opacity:.9;\n        -webkit-transform:none;\n        -ms-transform:none;\n        transform:none\n      }\n    }\n\n    /*.au-leave-active {\n      position:absolute;\n      -webkit-animation:slideLeft .5s;\n      animation:slideLeft .5s;\n    }*/\n\n    </style>\n  </head>\n  <body aurelia-app=\"views/index\">\n    <div class=\"splash\">\n      <div class=\"message\">Loading SIRUM...</div>\n      <i class=\"fa fa-spinner fa-spin\"></i>\n    </div>\n    <script src=\"assets/db/pouchdb-5.1.0.js\"></script>\n    <script src=\"assets/db/pouchdb-0.9.0.find.js\"></script>\n    <script src=\"assets/db/pouch.js\"></script>\n    <script src=\"assets/csv/papa.min.js\"></script>\n    <script src=\"assets/csv/index.js\"></script>\n    <script src=\"assets/vendor-bundle.js\" data-main=\"aurelia-bootstrapper\"></script>\n  </body>\n</html>\n"; });
define('text!views/inventory.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <require from=\"elems/md-autocomplete\"></require>\n  <require from=\"binding-behaviors/array\"></require>\n  <style>\n    .mdl-badge[data-badge]:after { font-size:9px; height:14px; width:14px; top:1px}\n    .mdl-textfield__label { color:black; font-size:1rem }\n  </style>\n  <style media=\"print\"> .hideWhenPrinted { display: none; }</style>\n  <md-drawer>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height hideWhenPrinted\"> <!-- ${ !repack || 'background:rgba(0,88,123,.3)' } -->\n      <div class=\"mdl-card__supporting-text\" style=\"padding:0\">\n        <div repeat.for=\"ndc of filter.ndc | toArray\" class=\"mdl-grid\" style=\"padding:0 0 0 8px; margin-top:-8px\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title mdl-grid\" style=\"padding:16px 0 0 0; width:100%\">\n            <div class=\"mdl-cell mdl-cell--6-col\">Ndc Filter</div>\n            <div class=\"mdl-cell mdl-cell--2-col\">Qty</div>\n            <div class=\"mdl-cell mdl-cell--2-col\">Count</div>\n          </div>\n          <md-checkbox class=\"mdl-cell mdl-cell--6-col\" click.delegate=\"signalFilter(ndc)\" checked.bind=\"ndc.val.isChecked\">${ndc.key}</md-checkbox>\n          <div class=\"mdl-cell mdl-cell--2-col\">${ndc.val.qty}</div>\n          <div class=\"mdl-cell mdl-cell--2-col\">${ndc.val.count}</div>\n        </div>\n        <div repeat.for=\"exp of filter.exp | toArray\" class=\"mdl-grid\" style=\"padding:0 0 0 8px; margin-bottom:-8px\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title mdl-grid\" style=\"padding:0; width:100%\">\n            <div class=\"mdl-cell mdl-cell--6-col\">Exp Filter</div>\n          </div>\n          <md-checkbox class=\"mdl-cell mdl-cell--6-col\" click.delegate=\"signalFilter(exp)\" checked.bind=\"exp.val.isChecked\">${exp.key.slice(0, 10)}</md-checkbox>\n          <div class=\"mdl-cell mdl-cell--2-col\">${exp.val.qty}</div>\n          <div class=\"mdl-cell mdl-cell--2-col\">${exp.val.count}</div>\n        </div>\n        <md-input show.bind=\"group.transactions.length\" input.delegate=\"signalFilter()\" value.bind=\"filter.rx\" style=\"margin-left:16px;\" class=\"mdl-cell mdl-cell--10-col\">Rx Filter</md-input>\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised\n          style=\"width:100%\"\n          disabled.bind=\" ! group.transactions.length\"\n          click.delegate=\"removeInventory()\">\n          ${'Remove Selected'}\n        </md-button>\n      </div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <md-autocomplete\n        placeholder=\"Search Drugs by Generic Name...\"\n        value.bind=\"term\"\n        input.delegate=\"search()\"\n        keyup.delegate=\"scrollGroups($event)\"\n        style=\"margin:0px 16px; padding-right:15px\">\n        <table md-table>\n          <tr\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectGroup(group)\"\n            class=\"${ group.name == $parent.group.name && 'is-selected'}\">\n            <td\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.name.replace(regex, '<strong>$1</strong>')\">\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <div style=\"width:100%; height:100%; display:flex\">\n        <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px; flex:1;\">\n          <table md-table style=\"width:calc(100% - 16px);\">\n            <thead>\n              <tr>\n                <th style=\"width:15px\"></th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Drug</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n                <th style=\"text-align:left; width:40px;\">Exp</th>\n                <th style=\"text-align:left; width:40px;\">Qty</th>\n                <th style=\"text-align:left; width:40px;\">Rx</th>\n                <th style=\"text-align:left; width:40px;\">Box</th>\n              </tr>\n            </thead>\n            <tr repeat.for=\"transaction of group.transactions | filter:filter\" input.delegate=\"saveTransaction(transaction) & debounce:1000\">\n              <td style=\"padding:0 0 0 8px\">\n                <md-checkbox checked.bind=\"transaction.isChecked\"></md-checkbox>\n              </td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug.generic }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug._id }</td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"transaction.exp.from | date\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"transaction.qty.from\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"transaction.rx.from\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"transaction.location\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n            </tr>\n          </table>\n        </div>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!views/join.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <section class=\"mdl-grid\" style=\"height:80vh;\">\n    <form class=\"mdl-cell mdl-cell--11-col mdl-cell--middle mdl-grid\" style=\"margin:0 auto; max-width:930px\">\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col mdl-grid\" style=\"padding:16px\">\n        <div class=\"mdl-card__title mdl-cell mdl-cell--12-col\" style=\"padding:0\">\n          <div class=\"mdl-card__title-text\">\n            Register Your Facility\n          </div>\n        </div>\n        <md-input value.bind=\"account.name\" class=\"mdl-cell mdl-cell--12-col\">Facility</md-input>\n        <md-input value.bind=\"account.license\" class=\"mdl-cell mdl-cell--12-col\">License</md-input>\n        <md-input value.bind=\"account.street\" class=\"mdl-cell mdl-cell--12-col\">Street</md-input>\n        <md-input value.bind=\"account.city\" class=\"mdl-cell mdl-cell--7-col\">City</md-input>\n        <md-input value.bind=\"account.state\" class=\"mdl-cell mdl-cell--2-col\">State</md-input>\n        <md-input value.bind=\"account.zip\" class=\"mdl-cell mdl-cell--3-col\">Zip</md-input>\n      </div>\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col mdl-grid\" style=\"padding:16px\">\n        <md-input value.bind=\"user.name.first\" class=\"mdl-cell mdl-cell--6-col\">First Name</md-input>\n        <md-input value.bind=\"user.name.last\" class=\"mdl-cell mdl-cell--6-col\">Last Name</md-input>\n        <md-input value.bind=\"user.email\" class=\"mdl-cell mdl-cell--12-col\" type=\"email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\">Email</md-input>\n        <md-input value.bind=\"user.phone\" class=\"mdl-cell mdl-cell--12-col\" type=\"tel\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\">Phone</md-input>\n        <md-input value.bind=\"user.password\" class=\"mdl-cell mdl-cell--12-col\">Password</md-input>\n        <div class=\"mdl-cell mdl-cell--9-col mdl-grid\" style=\"padding:18px 0\">\n          <md-checkbox checked.bind=\"accept\" style=\"margin-left:10px\" required>I accept the terms of use</md-checkbox>\n        </div>\n        <md-button raised color form click.delegate=\"join()\" class=\"mdl-cell mdl-cell--3-col\">Submit</md-button>\n        <p class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px\">${ loading }</p>\n      </div>\n    </form>\n  </section>\n</template>\n"; });
define('text!views/login.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <section class=\"mdl-grid\" style=\"margin-top:30vh;\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col mdl-cell--middle\" style=\"margin:-75px auto 0; padding:48px 96px 28px 96px; max-width:450px\">\n      <md-input value.bind=\"email\" type=\"email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\" required>Email</md-input>\n      <md-input value.bind=\"password\" type=\"password\" required minlength=\"4\">Password</md-input>\n      <md-button\n        raised color form\n        click.delegate=\"login()\"\n        disabled.bind=\"disabled\"\n        style=\"padding-top:16px\">\n        Login\n      </md-button>\n      <p class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px\">${ loading }</p>\n    </form>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!views/records.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-button\"></require>\n  <md-drawer>\n    <md-input\n      value.bind=\"filter\"\n      autoselect\n      style=\"padding:0 8px; width:auto\">\n      Filter\n    </md-input>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell full-height\" style=\"width:424px\">\n      <div class=\"mdl-card__title\" style=\"padding-left:16px\">\n        <div class=\"mdl-card__title-text\">\n          Transaction History\n        </div>\n      </div>\n      <div innerHTML.bind=\"history\" class=\"mdl-grid\" style=\"font-size:10px; font-family:Monaco; margin:0; padding:0 16px; white-space:pre; line-height:15px\"></div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell full-height\" style=\"width:calc(100% - 424px - 32px)\">\n      <div class=\"mdl-card__title\" style=\"display:block; margin-bottom:-40px; box-sizing:content-box\">\n        <div class=\"mdl-card__title-text\">\n          <md-select\n            style=\"width:auto;padding:0 5px;text-transform:capitalize; text-align-last:center;\"\n            change.delegate=\"searchRange()\"\n            value.bind=\"status\"\n            options.bind=\"stati\">\n          </md-select>\n          record\n          <md-select\n            style=\"width:auto; padding:0 5px; text-align-last:center;\"\n            change.delegate=\"searchRange()\"\n            value.bind=\"fromMonth\"\n            options.bind=\"months\">\n          </md-select>\n          <md-select\n            style=\"width:auto; padding:0\"\n            change.delegate=\"searchRange()\"\n            value.bind=\"fromYear\"\n            options.bind=\"years\">\n          </md-select>\n          &nbsp;–\n          <md-select\n            style=\"width:auto; padding:0 5px; text-align-last:center;\"\n            change.delegate=\"searchRange()\"\n            value.bind=\"toMonth\"\n            options.bind=\"months\">\n          </md-select>\n          <md-select\n            style=\"width:auto; padding:0\"\n            change.delegate=\"searchRange()\"\n            value.bind=\"toYear\"\n            options.bind=\"years\">\n          </md-select>\n        </div>\n      </div>\n      <button id=\"import-export\"\n        style=\"position:absolute; z-index:2; text-align:right; top:10px; right:5px;\"\n        class=\"mdl-button mdl-js-button mdl-button--icon\">\n        <i class=\"material-icons\">more_vert</i>\n      </button>\n      <ul class=\"mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect\" for=\"import-export\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          show.bind=\"false\"\n          click.delegate=\"exportCSV()\"\n          class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n        <li\n          show.bind=\"true\"\n          disabled\n          class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n      </ul>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px;\">\n        <table md-table style=\"width:calc(100% - 16px);\">\n          <thead>\n            <tr>\n              <th style=\"text-align:left;\">Drug</th>\n              <th style=\"text-align:left;\">Ndc</th>\n              <th style=\"text-align:left; width:5%;\">Exp</th>\n              <th style=\"width:5%\">Qty</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr repeat.for=\"transaction of transactions\" class=\"${ $parent.transaction != transaction || 'is-selected'}\" click.delegate=\"select(transaction)\">\n              <td style=\"text-align:left; white-space:normal;\">\n                ${ transaction | drugName }\n              </td>\n              <td style=\"text-align:left;\">\n                ${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') }\n              </td>\n              <td style=\"text-align:left;\">\n                ${ (transaction.exp.to || transaction.exp.from).slice(0, 10) }\n              </td>\n              <td>\n                ${ transaction.qty.to || transaction.qty.from }\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n  </section>\n</template>\n"; });
define('text!views/routes.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"mdl-layout mdl-js-layout mdl-layout--fixed-header\">\n    <header class=\"mdl-layout__header\">\n      <div class=\"mdl-layout__header-row\">\n        <img src=\"assets/SIRUM.logo.notag.png\" style=\"width:100px; margin-left:-16px\">\n        <span class=\"mdl-layout-title\"></span>\n        <!-- Add spacer, to align navigation to the right -->\n        <div class=\"mdl-layout-spacer\"></div>\n        <nav class=\"mdl-navigation\">\n          <!-- show.bind=\"row.isVisible\"  -->\n          <a repeat.for=\"route of router.navigation\" show.bind=\"route.isVisible\" class=\"mdl-navigation__link ${route.isActive ? 'mdl-navigation__link--current' : ''}\" href.bind=\"route.href\" style=\"\">\n            ${route.title}\n          </a>\n        </nav>\n      </div>\n    </header>\n    <main class=\"mdl-layout__content\">\n      <div class=\"page-content\" style=\"height:100%\">\n        <router-view style=\"display:block; height:100%\"></router-view>\n      </div>\n    </main>\n  </div>\n</template>\n"; });
define('text!views/shipments.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-checkbox\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-menu\"></require>\n  <require from=\"elems/md-autocomplete\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <md-drawer autofocus>\n    <md-input\n      value.bind=\"filter\"\n      autoselect\n      style=\"padding:0 8px; width:auto\">\n      Filter shipments ${ role.account } you\n    </md-input>\n    <md-switch\n      checked.one-way=\"role.account == 'to'\"\n      click.delegate=\"swapRole()\"\n      style=\"margin:-42px 0 0 185px;\">\n    </md-switch>\n    <a\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment()\">\n      <div class=\"mdl-typography--title\">Create</div>\n      new shipment ${role.account} you\n    </a>\n    <a\n      repeat.for=\"shipment of shipments[role.account] | filter:filter\"\n      class=\"mdl-navigation__link ${ shipment._id == shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment(shipment)\">\n      <div class=\"mdl-typography--title\" innerHtml.bind=\"shipment.account[role.partner].name | bold:filter\"></div>\n      <div style=\"font-size:12px\" innerHtml.bind=\"shipment.status+', '+shipment.tracking | bold:filter\"></div>\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height\">\n      <div class=\"mdl-card__title\" style=\"display:block;\">\n        <div class=\"mdl-card__title-text\" style=\"text-transform:capitalize\">\n          ${ shipment._rev ? 'Shipment '+shipment.tracking.slice(-6) : 'New Shipment '+role.account+' You' }\n        </div>\n        <div style=\"margin-top:3px; margin-bottom:-25px\">\n          <strong>${transactions.length}</strong> items worth\n          <strong>$${ transactions | value:0:transactions.length }</strong>\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\">\n        <md-select\n          if.bind=\"role.account == 'from' || shipment._rev\"\n          style=\"width:100%\"\n          value.bind=\"shipment\"\n          default.bind=\"{tracking:'New Tracking #', account:{from:account, to:account}}\"\n          options.bind=\"shipments[role.account]\"\n          property=\"tracking\">\n          Tracking #\n        </md-select>\n        <md-input\n          if.bind=\"role.account == 'to' && ! shipment._rev\"\n          required\n          style=\"width:100%\"\n          value.bind=\"shipment.tracking\">\n          Tracking #\n        </md-input>\n        <md-select\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.from\"\n          options.bind=\"(role.account == 'from' || shipment._rev) ? [shipment.account.from] : accounts[role.account]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.account == 'from'\">\n          <!-- disabled is for highlighting the current role -->\n          From\n        </md-select>\n        <md-select\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.to\"\n          options.bind=\"(role.account == 'to' || shipment._rev) ? [shipment.account.to] : accounts[role.account]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.account == 'to'\">\n          <!-- disabled is for highlighting the current role -->\n          To\n        </md-select>\n        <md-select\n          style=\"width:32%;\"\n          value.bind=\"shipment.status\"\n          options.bind=\"stati\"\n          disabled.bind=\"! shipment._rev\">\n          Status\n        </md-select>\n        <md-input\n          type=\"date\"\n          style=\"width:64%; margin-top:20px\"\n          value.bind=\"shipment[shipment.status+'At']\"\n          disabled.bind=\"! shipment._rev\"\n          input.delegate=\"saveShipment() & debounce:1000\">\n        </md-input>\n        <!-- <md-select\n          style=\"width:100%\"\n          value.bind=\"attachment.name\"\n          change.delegate=\"getAttachment()\"\n          options.bind=\"['','Shipping Label', 'Manifest']\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Attachment\n        </md-select>\n        <md-button color\n          if.bind=\"attachment.name\"\n          click.delegate=\"upload.click()\"\n          style=\"position:absolute; right:18px; margin-top:-48px; height:24px; line-height:24px\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Upload\n        </md-button>\n        <input\n          type=\"file\"\n          ref=\"upload\"\n          change.delegate=\"setAttachment(upload.files[0])\"\n          style=\"display:none\">\n        <div if.bind=\"attachment.url\" style=\"width: 100%; padding-top:56px; padding-bottom:129%; position:relative;\">\n          <embed\n            src.bind=\"attachment.url\"\n            type.bind=\"attachment.type\"\n            style=\"position:absolute; height:100%; width:100%; top:0; bottom:0\">\n        </div> -->\n        <!-- The above padding / positioning keeps a constant aspect ratio for the embeded pdf  -->\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised form\n          style=\"width:100%\"\n          if.bind=\"shipment._id == shipmentId && ! shipment._rev\"\n          click.delegate=\"createShipment()\">\n          New Shipment Of ${ diffs.length || 'No' } Items\n        </md-button>\n        <md-button color raised\n          style=\"width:100%\"\n          if.bind=\"shipment._id == shipmentId && shipment._rev && role.account == 'to'\"\n          disabled.bind=\"! diffs.length\"\n          click.delegate=\"saveInventory()\">\n          ${ transactions[diffs[0]].verifiedAt ? 'Remove '+diffs.length+' Items' : 'Save '+diffs.length+' Items'}\n        </md-button>\n        <md-button color raised\n          style=\"width:100%\"\n          if.bind=\"shipment._id != shipmentId\"\n          disabled.bind=\"! diffs.length || ! shipment.account.to._id\"\n          click.delegate=\"shipment._rev ? moveTransactionsToShipment(shipment) : createShipment()\">\n          Move ${ diffs.length } Items\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <!-- disabled.bind=\"! searchReady\" -->\n      <md-autocomplete\n        placeholder=\"Filter by Rx or Add Drugs by Generic Name or NDC...\"\n        value.bind=\"term\"\n        input.delegate=\"search()\"\n        keydown.delegate=\"scrollDrugs($event)\"\n        disabled.bind=\"role.account == 'to' && ! shipment._rev\"\n        style=\"margin:0px 16px\">\n        <table md-table>\n          <tr\n            repeat.for=\"drug of drugs\"\n            click.delegate=\"addTransaction(drug)\"\n            class=\"${ $index == index && 'is-selected'}\">\n            <td class=\"mdl-data-table__cell--non-numeric\" innerHTML.bind=\"drug | drugName:regex\" style=\"white-space:normal; max-width:70%\"></td>\n            <td class=\"mdl-data-table__cell--non-numeric\" style=\"max-width:30%\">${ drug._id + (drug.pkg ? '-'+drug.pkg : '') }</td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu style=\"position:absolute; z-index:2; top:10px; right:5px;\" id.bind=\"a1\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          show.bind=\"transactions.length\"\n          click.delegate=\"exportCSV()\">\n          Export CSV\n        </li>\n        <li\n          show.bind=\"!transactions.length\"\n          disabled>\n          Export CSV\n        </li>\n        <li\n          show.bind=\"role.account != 'to' || shipment._rev\"\n          click.delegate=\"$file.click()\">\n          Import CSV\n        </li>\n        <li\n          show.bind=\"role.account == 'to' && ! shipment._rev\"\n          disabled>\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px;\">\n        <table md-table style=\"width:calc(100% - 16px)\">\n          <thead>\n            <tr>\n              <th style=\"width:15px\"></th>\n              <th class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0\">Drug</th>\n              <!-- <th class=\"mdl-data-table__cell--non-numeric\" style=\"width:90px;padding-left:0\">Ndc</th> -->\n              <th style=\"width:40px; padding-left:0; padding-right:0px\">Value</th>\n              <th style=\"text-align:left; width:40px;\">Exp</th>\n              <th style=\"text-align:left; width:40px\">Qty</th>\n              <th style=\"text-align:left; width:40px\">Rx</th>\n              <th style=\"text-align:left; width:40px;\">Box</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr style=\"padding-top:7px;\" repeat.for=\"transaction of transactions\" input.delegate=\"saveTransaction($index) & debounce:1000\">\n              <td style=\"padding:0 0 0 8px\">\n                <!-- if you are selecting new items you received to add to inventory, do not confuse these with the currently checked items -->\n                <!-- if you are selecting items to move to a new shipment, do not allow selection of items already verified by recipient e.g do not mix saving new items and removing old items, you must do one at a time -->\n                <!-- since undefined != false we must force both sides to be booleans just to show a simple inequality. use verifiedAt directly rather than isChecked because autocheck coerces isChecked to be out of sync -->\n                <md-checkbox\n                  disabled.bind=\"(role.account == 'to' && diffs.length && ! transactions[diffs[0]].verifiedAt != ! transaction.verifiedAt) || (role.account == 'to' && transaction.verifiedAt && shipment._id != shipmentId) || (role.account == 'from' && transaction.verifiedAt)\"\n                  click.delegate=\"manualCheck($index)\"\n                  checked.bind=\"transaction.isChecked\">\n                </md-checkbox>\n              </td>\n              <td click.delegate=\"selectRow($index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"max-width:300px; white-space:normal; padding-left:0\">\n                ${ transaction.drug | drugName }\n              </td>\n              <!-- <td click.delegate=\"selectRow($index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"padding:0\">\n                ${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') }\n              </td> -->\n              <td style=\"padding:0\">\n                ${ transaction | value:2 }\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.exp[role.partner] | date}\n                <md-input\n                  id.bind=\"'exp_'+$index\"\n                  disabled.bind=\"transaction.verifiedAt\"\n                  keyup.delegate=\"expShortcuts($event, $index)\"\n                  pattern=\"(0?[1-9]|1[012])/\\d{2}\"\n                  value.bind=\"transaction.exp[role.account] | date\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.qty[role.partner] }\n                  <!-- input event is not triggered on enter, so use keyup for qtyShortcutes instead   -->\n                  <!-- keyup rather than keydown because we want the new quantity not the old one -->\n                  <md-input\n                    id.bind=\"'qty_'+$index\"\n                    disabled.bind=\"transaction.verifiedAt\"\n                    keyup.delegate=\"qtyShortcuts($event, $index)\"\n                    type=\"number\"\n                    value.bind=\"transaction.qty[role.account] | number\"\n                    style=\"width:40px; margin-bottom:-8px\"\n                    placeholder>\n                  </md-input>\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.rx[role.partner] }\n                <!-- input event is not triggered on enter, so use keyup for qtyShortcutes instead   -->\n                <md-input\n                  id.bind=\"'rx_'+$index\"\n                  disabled.bind=\"transaction.verifiedAt || ! transaction.isChecked\"\n                  keyup.delegate=\"rxShortcuts($event, $index)\"\n                  value.bind=\"transaction.rx[role.account]\"\n                  style=\"width:40px; margin-bottom:-8px; text-overflow:ellipsis\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  id.bind=\"'box_'+$index\"\n                  disabled.bind=\"transaction.verifiedAt || ! transaction.isChecked\"\n                  keydown.delegate=\"boxShortcuts($event, $index)\"\n                  focusout.delegate=\"saveLastBox($event)\"\n                  pattern=\"[A-Z]\\d{3}\"\n                  value.bind=\"transaction.location\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <!-- <td style=\"padding:0 16px\">\n                <a if.bind=\"shipment._rev\" href=\"/#/records/${ transaction._id }\" tabindex=\"-1\">\n                   <i class=\"material-icons\" style=\"font-size:15px; vertical-align:text-top\">history</i>\n                </a>\n              </td> -->\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
define('text!elems/md-autocomplete.html', ['module'], function(module) { module.exports = "<template style=\"box-shadow:none\">\n  <!-- z-index of 2 is > than checkboxes which have z-index of 1 -->\n  <md-autocomplete-wrap\n    ref=\"form\"\n    class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\"\n    style=\"z-index:2; width:100%; padding-top:10px\">\n    <input class=\"md-input mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled\"\n      placeholder.bind=\"placeholder\"\n      focus.trigger=\"toggleResults()\"\n      focusout.delegate=\"toggleResults($event)\"\n      style=\"font-size:20px;\">\n    <div show.bind=\"showResults\"\n      tabindex=\"-1\"\n      style=\"width:100%; overflow-y:scroll; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25); max-height: 400px !important;\"\n      class=\"md-autocomplete-suggestions\">\n      <slot></slot>\n    </div>\n  </md-autocomplete-wrap>\n  <style>\n  @-webkit-keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @-webkit-keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  @keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  md-autocomplete {\n    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);\n    border-radius: 2px;\n    display: block;\n    height: 40px;\n    position: relative;\n    overflow: visible;\n    min-width: 190px; }\n    md-autocomplete[md-floating-label] {\n      padding-bottom: 26px;\n      box-shadow: none;\n      border-radius: 0;\n      background: transparent;\n      height: auto; }\n      md-autocomplete[md-floating-label] md-input-container {\n        padding-bottom: 0; }\n      md-autocomplete[md-floating-label] md-autocomplete-wrap {\n        height: auto; }\n      md-autocomplete[md-floating-label] button {\n        top: auto;\n        bottom: 5px; }\n    md-autocomplete md-autocomplete-wrap {\n      display: block;\n      position: relative;\n      overflow: visible;\n      height: 40px; }\n      md-autocomplete md-autocomplete-wrap md-progress-linear {\n        position: absolute;\n        bottom: 0;\n        left: 0;\n        width: 100%;\n        height: 3px;\n        transition: none; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear .md-container {\n          transition: none;\n          top: auto;\n          height: 3px; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter.ng-enter-active {\n            opacity: 1; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave.ng-leave-active {\n            opacity: 0; }\n    md-autocomplete input:not(.md-input) {\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: 100%;\n      box-sizing: border-box;\n      border: none;\n      box-shadow: none;\n      padding: 0 15px;\n      font-size: 14px;\n      line-height: 40px;\n      height: 40px;\n      outline: none;\n      background: transparent; }\n      md-autocomplete input:not(.md-input)::-ms-clear {\n        display: none; }\n    md-autocomplete button {\n      position: absolute;\n      top: 10px;\n      right: 10px;\n      line-height: 20px;\n      text-align: center;\n      width: 20px;\n      height: 20px;\n      cursor: pointer;\n      border: none;\n      border-radius: 50%;\n      padding: 0;\n      font-size: 12px;\n      background: transparent; }\n      md-autocomplete button:after {\n        content: '';\n        position: absolute;\n        top: -6px;\n        right: -6px;\n        bottom: -6px;\n        left: -6px;\n        border-radius: 50%;\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        opacity: 0;\n        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }\n      md-autocomplete button:focus {\n        outline: none; }\n        md-autocomplete button:focus:after {\n          -webkit-transform: scale(1);\n                  transform: scale(1);\n          opacity: 1; }\n      md-autocomplete button md-icon {\n        position: absolute;\n        top: 50%;\n        left: 50%;\n        -webkit-transform: translate3d(-50%, -50%, 0) scale(0.9);\n                transform: translate3d(-50%, -50%, 0) scale(0.9); }\n        md-autocomplete button md-icon path {\n          stroke-width: 0; }\n      md-autocomplete button.ng-enter {\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-enter.ng-enter-active {\n          -webkit-transform: scale(1);\n                  transform: scale(1); }\n      md-autocomplete button.ng-leave {\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-leave.ng-leave-active {\n          -webkit-transform: scale(0);\n                  transform: scale(0); }\n    @media screen and (-ms-high-contrast: active) {\n      md-autocomplete input {\n        border: 1px solid #fff; }\n      md-autocomplete li:focus {\n        color: #fff; } }\n\n  .md-autocomplete-suggestions table, .md-autocomplete-suggestions ul {\n    width:100%;         //added by adam\n    background:white;   //added by adam\n    position: relative;\n    margin: 0;\n    list-style: none;\n    padding: 0;\n    z-index: 100; }\n    .md-autocomplete-suggestions li {\n      line-height: 48px; //separated by adam\n    }\n    .md-autocomplete-suggestions li, .md-autocomplete-suggestions tr {\n      /*added by adam */\n      width:100%;\n      text-align: left;\n      position: static !important;\n      text-transform: none;\n      /* end addition */\n      cursor: pointer;\n      font-size: 14px;\n      overflow: hidden;\n\n      transition: background 0.15s linear;\n      text-overflow: ellipsis; }\n      .md-autocomplete-suggestions li.ng-enter, .md-autocomplete-suggestions li.ng-hide-remove {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-in 0.2s;\n                animation: md-autocomplete-list-in 0.2s; }\n      .md-autocomplete-suggestions li.ng-leave, .md-autocomplete-suggestions li.ng-hide-add {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-out 0.2s;\n                animation: md-autocomplete-list-out 0.2s; }\n      .md-autocomplete-suggestions li:focus {\n        outline: none; }\n  </style>\n</template>\n"; });
define('text!elems/md-button.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block; height:36px; line-height:36px\">\n  <button\n    ref=\"button\"\n    disabled.bind=\"disabledOrInvalid\"\n    click.delegate=\"click($event)\"\n    class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n    style=\"width:100%; height:inherit; line-height:inherit\">\n    <slot style=\"padding:auto\"></slot>\n  </button>\n</template>\n"; });
define('text!elems/md-checkbox.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <label ref=\"label\" class=\"mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect\" style=\"width:100%; margin-right:8px\">\n    <input\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      tabindex.one-time=\"tabindex\"\n      type=\"checkbox\"\n      class=\"mdl-checkbox__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <slot></slot>\n  </label>\n</template>\n"; });
define('text!elems/md-drawer.html', ['module'], function(module) { module.exports = "<template>\n    <slot></slot>\n</template>\n"; });
define('text!elems/md-input.html', ['module'], function(module) { module.exports = "<!-- firefox needs max-height otherwise is oversizes the parent element -->\n<template style=\"display:inline-block; box-sizing:border-box; max-height:auto;\">\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; ${ label.textContent.trim() || 'padding-top:0px'}; margin-bottom:-12px; font-size:inherit; text-overflow:inherit; display:block;\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height. -->\n    <input\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      max.bind=\"max\"\n      pattern.bind=\"pattern || '.*'\"\n      type.bind=\"type\"\n      step.bind=\"step\"\n      placeholder.bind=\"placeholder || ''\"\n      minlength.bind=\"minlength\"\n      style=\"padding:0; min-height:24px; line-height:24px; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    <label ref=\"label\" class=\"mdl-textfield__label\"><slot></slot></label>\n  </div>\n</template>\n"; });
define('text!elems/md-menu.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <button\n    ref=\"button\"\n    id.one-time=\"id\"\n    tabindex=\"-1\"\n    class=\"mdl-button mdl-js-button mdl-button--icon\">\n    <i class=\"material-icons\">more_vert</i>\n  </button>\n  <ul ref=\"ul\" class=\"mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect\" data-mdl-for.one-time=\"id\">\n    <slot></slot>\n  </ul>\n</template>\n"; });
define('text!elems/md-select.html', ['module'], function(module) { module.exports = "<!-- vertical-align top is necessary for firefox -->\n<template style=\"display:inline-block; box-sizing:border-box; vertical-align:top; margin-bottom:8px\">\n  <style>\n  @-moz-document url-prefix() {\n    select {\n       text-indent:-2px;\n    }\n  }\n  </style>\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; ${ label.textContent.trim() || 'padding-top:0px'}; margin-bottom:-12px; font-size:inherit;\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height.  Not sure why extra pixels are necessary in chrome and firefox -->\n    <select\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      required.bind=\"required || required === ''\"\n      style=\"padding:0; min-height:26px; line-height:26px; border-radius:0; font-size:inherit; font-weight:inherit; text-transform:inherit; -webkit-appearance:none; -moz-appearance:none;\">\n      <option if.bind=\"default\" model.bind=\"default\">\n        ${ property ? default[property] : default }\n      </option>\n      <option model.bind=\"option\" repeat.for=\"option of options\">\n        ${ property ? option[property] : option }\n      </option>\n    </select>\n    <label ref=\"label\" class=\"mdl-textfield__label\" style=\"text-align:inherit;\">\n      <slot></slot>\n    </label>\n  </div>\n</template>\n"; });
define('text!elems/md-snackbar.html', ['module'], function(module) { module.exports = "<template class=\"mdl-js-snackbar mdl-snackbar\">\n  <div class=\"mdl-snackbar__text\"></div>\n  <button class=\"mdl-snackbar__action\" type=\"button\"></button>\n</template>\n"; });
define('text!elems/md-switch.html', ['module'], function(module) { module.exports = "<template>\n  <label ref=\"label\" class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect\" for=\"switch\" style=\"width:100%\">\n    <input\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      type=\"checkbox\"\n      class=\"mdl-switch__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <span class=\"mdl-switch__label\"><slot></slot></span>\n  </label>\n</template>\n"; });
define('text!views/inventory copy.html', ['module'], function(module) { module.exports = "<template>\n  <require from='elems/md-shadow'></require>\n  <require from='elems/md-drawer'></require>\n  <require from='elems/md-table'></require>\n  <require from=\"elems/md-input\"></require>\n  <require from=\"elems/md-select\"></require>\n  <require from=\"elems/md-button\"></require>\n  <require from=\"elems/md-switch\"></require>\n  <require from=\"elems/md-snackbar\"></require>\n  <require from=\"elems/md-autocomplete\"></require>\n  <md-drawer>\n    <md-input value.bind=\"filter\" style=\"padding:0 8px;\">Filter Inventory</md-input>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <style type=\"text/css\" media=\"print\"> .hideWhenPrinted { display: none; }</style>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height hideWhenPrinted\"> <!-- ${ !repack || 'background:rgba(0,88,123,.3)' } -->\n      <md-input style=\"padding:16px;\" placeholder=\"Remove Inventory by Rx Number\"></md-input>\n      <div\n        class=\"mdl-card__supporting-text\"\n        style=\"font-size:13px;\">\n        <div repeat.for=\"transaction of drug.transactions\" input.delegate=\"saveTransaction(transaction) & debounce:1000\">\n          <md-input\n            disabled.bind=\" ! mode\"\n            pattern=\"[A-Z]\\d{3}\"\n            style=\"width:40px\"\n            value.bind=\"transaction.location\"\n            placeholder=\"Box\">\n          </md-input>\n          <span style=\"white-space:nowrap;\">\n            <md-input\n              disabled.bind=\" ! mode\"\n              pattern=\"(0?[1-9]|1[012])/\\d{2}\"\n              style=\"width:40px\"\n              value.bind=\"transaction.exp.from | date\"\n              placeholder=\"Exp\">\n            </md-input>\n            <md-input\n              if.bind=\" ! mode\"\n              type=\"number\"\n              style=\"width:40px\"\n              value.bind=\"transaction.qty.from | number\"\n              input.trigger=\"sumGroup()\"\n              placeholder=\"Qty\">\n            </md-input>\n            <md-input\n              if.bind=\"mode\"\n              type=\"number\"\n              style=\"width:40px\"\n              value.bind=\"repack[$index]\"\n              input.delegate=\"sumRepack()\"\n              placeholder=\"Qty\"\n              max.bind=\"transaction.qty.from\">\n            </md-input>\n            <md-input\n              style=\"width:40px\"\n              value.bind=\"transaction.rx.from\"\n              placeholder=\"Rx\">\n            </md-input>\n          </span>\n        </div>\n        <img style=\"width:100%\" if.bind=\"image\" src.bind=\"image\">\n      </div>\n      <div class=\"mdl-card__actions mdl-grid\">\n        <md-switch\n          checked.bind=\"mode\"\n          click.delegate=\"toggleRepack()\"\n          style=\"flex:1; align-self:flex-end\">\n        </md-switch>\n        <md-button\n          color raised\n          if.bind=\"mode\"\n          disabled.bind=\"drug.transactions.length < 2\"\n          click.delegate=\"repackage()\"\n          style=\"width:140px\">\n          Repackage ${ repack.total }\n        </md-button>\n      </div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell full-height mdl-cell--8-col\">\n      <md-autocomplete\n        placeholder=\"Search Drugs by Generic Name...\"\n        value.bind=\"term\"\n        input.delegate=\"search()\"\n        keyup.delegate=\"scrollGroups($event)\"\n        style=\"margin:0px 16px; padding-right:15px\">\n        <table md-table>\n          <tr\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectGroup(group, true)\"\n            class=\"${ group.name == $parent.group.name && 'is-selected'}\">\n            <td\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.name.replace(regex, '<strong>$1</strong>')\">\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <div style=\"width:100%; height:100%; display:flex\">\n        <div style=\"overflow-y:scroll; margin:8px 0px 8px 16px; flex:1;\">\n          <table md-table style=\"width:calc(100% - 16px);\">\n            <thead>\n              <tr>\n                <th class=\"mdl-data-table__cell--non-numeric\">Drug</th>\n                <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n                <th style=\"text-align:left; width:40px;\">Exp</th>\n                <th style=\"text-align:left; width:40px;\">Qty</th>\n                <th style=\"text-align:left; width:40px;\">Rx</th>\n                <th style=\"text-align:left; width:40px;\">Box</th>\n              </tr>\n            </thead>\n            <tr repeat.for=\"drug of group.drugs\" click.delegate=\"selectDrug(drug)\" class=\"${ drug.transactions[0].drug._id == $parent.drug.transactions[0].drug._id ? 'is-selected' : ''}\">\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug.transactions[0].drug.generic }</td>\n              <td class=\"mdl-data-table__cell--non-numeric\">${ drug.transactions[0].drug._id }</td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"drug.transactions[0].exp.from | date\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"drug.transactions[0].qty.from\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"drug.transactions[0].rx.from\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                <md-input\n                  value.bind=\"drug.transactions[0].location\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n            </tr>\n          </table>\n        </div>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n  </section>\n</template>\n"; });
//# sourceMappingURL=app-bundle.js.map