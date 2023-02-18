define('client/src/environment',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: false };
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
  exports.clearNextProperty = clearNextProperty;
  exports.qtyShortcuts = qtyShortcuts;
  exports.removeTransactionIfQty0 = removeTransactionIfQty0;
  exports.incrementBin = incrementBin;
  exports.saveTransaction = saveTransaction;
  exports.scrollSelect = scrollSelect;
  exports.focusInput = focusInput;
  exports.toggleDrawer = toggleDrawer;
  exports.drugSearch = drugSearch;
  exports.groupDrugs = groupDrugs;
  exports.drugName = drugName;
  exports.parseUserDate = parseUserDate;
  exports.toJsonDate = toJsonDate;
  exports.waitForDrugsToIndex = waitForDrugsToIndex;
  exports.canActivate = canActivate;
  exports.getHistory = getHistory;
  exports.currentDate = currentDate;
  function expShortcuts($event, $index) {
    if ($event.which == 13) return this.focusInput('#qty_' + $index);

    return true;
  }

  function clearNextProperty(old_next, property) {
    if (old_next.length) {
      if (property == 'pended' || Array.isArray(old_next[0])) return [];
      if (old_next[0][property]) delete old_next[0][property];
      if (!Object.keys(old_next[0]).length) return [];
    }
    return old_next;
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

    if ($event.which == 107 || $event.which == 187) var increment = 1;

    if ($event.which == 109 || $event.which == 189) var increment = -1;

    if (!increment) return clearIfAsterick($event);

    var binLetter = transaction.bin[0];
    var binNumber = +transaction.bin.slice(1) + increment;

    if (binNumber < 0 || binNumber > 699) {
      binLetter = String.fromCharCode(binLetter.charCodeAt() + increment);
      binNumber = (binNumber + 700) % 700;
    }

    transaction.bin = binLetter + ('00' + binNumber).slice(-3);
    saveTransaction.call(this, transaction);
    return false;
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

  var _drugSearch = {
    name: function name(term, clearCache) {
      var start = Date.now();
      var terms = term.toLowerCase().replace('.', '\\.').split(/, |[, ]/g);

      if (!term.startsWith(_drugSearch._term) || clearCache) {
        _drugSearch._term = term;
        var nameRange = _drugSearch.range(terms[0]);

        _drugSearch._drugs = this.db.drug.query('name', nameRange).then(function (res) {

          console.log('QUERY', term, res.rows.length, 'rows and took', Date.now() - start, nameRange);

          return res.rows.map(function (row) {
            return row.doc;
          });
        });
      }

      var regex = RegExp('(?=.*' + terms.join(')(?=.*( |0)') + ')', 'i');
      return _drugSearch._drugs.then(function (drugs) {

        var unknowns = {};

        return drugs.filter(function (drug) {
          var isMatch = regex.test(drug.generic + ' ' + (drug.brand || '') + ' ' + (drug.labeler || ''));

          if (isMatch && !unknowns[drug.generic]) {
            var unknown = JSON.parse(JSON.stringify(drug));
            unknown.labeler = '';
            unknown._id = "Unspecified";
            unknowns[drug.generic] = unknown;
          }

          return isMatch;
        }).concat(Object.values(unknowns));
      }).then(function (drugs) {
        console.log('FILTER', term, drugs.length, 'rows and took', Date.now() - start, 'cache', _drugSearch._term);
        _drugSearch._term = term;
        return drugs;
      });
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
    ndc: function ndc(_ndc, clearCache) {
      var start = Date.now();

      var split = _ndc.split('-');
      var term = split.join('');

      if (term.length == 12 && term[0] == '3') term = term.slice(1, -1);

      if (!term.startsWith(_drugSearch._term) || clearCache) {

        _drugSearch._term = term;

        var ndc9Range = _drugSearch.range(term.slice(0, 9));
        var upc8Range = _drugSearch.range(term.slice(0, 8));
        var ndc9Query = this.db.drug.query('ndc9', ndc9Range);
        var upc8Query = this.db.drug.query('upc', upc8Range);

        _drugSearch._drugs = Promise.all([ndc9Query, upc8Query]).then(function (_ref) {
          var ndc9 = _ref[0],
              upc = _ref[1];


          var unique = {};

          for (var _iterator = ndc9.rows, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref2;

            if (_isArray) {
              if (_i >= _iterator.length) break;
              _ref2 = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done) break;
              _ref2 = _i.value;
            }

            var drug = _ref2;

            unique[drug.doc._id] = drug.doc;
          }for (var _iterator2 = upc.rows, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            var _ref3;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref3 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref3 = _i2.value;
            }

            var _drug = _ref3;

            if (_drug.doc.upc.length != 9 && term.length != 11) unique[_drug.doc._id] = _drug.doc;
          }unique = Object.keys(unique).map(function (key) {
            return _drugSearch.addPkgCode(term, unique[key]);
          });
          console.log('QUERY', term, 'time ms', Date.now() - start, 'ndc9Range', ndc9Range, 'upc8Range', upc8Range, unique);
          return unique;
        });
      }

      return _drugSearch._drugs.then(function (drugs) {

        var matches = {
          ndc11: [],
          ndc9: [],
          upc10: [],
          upc8: []
        };

        for (var _iterator3 = drugs, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
          var _ref4;

          if (_isArray3) {
            if (_i3 >= _iterator3.length) break;
            _ref4 = _iterator3[_i3++];
          } else {
            _i3 = _iterator3.next();
            if (_i3.done) break;
            _ref4 = _i3.value;
          }

          var drug = _ref4;


          if (drug.ndc9.startsWith(term)) matches.ndc11.push(drug);else if (drug.upc.startsWith(term)) matches.upc10.push(drug);else if (term.startsWith(drug.ndc9)) {
            _drugSearch.addPkgCode(term, drug);
            matches.ndc9.push(drug);
          } else if (term.startsWith(drug.upc)) {
            _drugSearch.addPkgCode(term, drug);
            matches.upc8.push(drug);
          }
        }

        console.log('FILTER', term, 'time ms', Date.now() - start, 'matches.ndc11', matches.ndc11, 'matches.upc10', matches.upc10, 'matches.ndc9', matches.ndc9, 'matches.upc8', matches.upc8);
        return [].concat(matches.ndc11, matches.upc10, matches.ndc9, matches.upc8);
      });
    }
  };

  function drugSearch() {
    var _this2 = this;

    if (!this.term) return Promise.resolve([]);

    var term = this.term.trim();
    var type = /^[\d-]+$/.test(term) ? 'ndc' : 'name';

    if (type == 'ndc' && this.term.length < 5 || type == 'name' && this.term.length < 3) return Promise.resolve([]);

    var clearCache = this._savingDrug;
    var start = Date.now();

    return this._search = Promise.resolve(this._search).then(function (_) {
      return _drugSearch[type].call(_this2, term, clearCache);
    }).then(function (res) {
      console.log('drugSearch', type, term, 'wait for previous query', 'query time', Date.now() - start);
      return res;
    }).catch(function (err) {
      return console.log('drugSearch error', err);
    });
  }

  function groupDrugs(drugs, ordered) {

    var groups = {};
    for (var _iterator4 = drugs, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      var _ref5;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref5 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref5 = _i4.value;
      }

      var drug = _ref5;

      var generic = drug.generic;
      groups[generic] = groups[generic] || { generic: generic, name: drugName(drug, ordered), drugs: [] };
      groups[generic].drugs.push(drug);
    }

    return Object.keys(groups).map(function (key) {
      return groups[key];
    });
  }

  function drugName(drug, ordered) {
    var name = drug.generic;
    var desc = [];

    var display = ordered[name] && ordered[name].displayMessage;
    if (drug.brand) desc.push(drug.brand);
    if (display) desc.push(display);

    if (desc.length) name += ' (' + desc.join(', ') + ')';

    return name;
  }

  function parseUserDate(date) {

    date = (date || '').split('/');

    var year = '';

    if (date.length > 1) year = date.pop().slice(-2);else if (date[0].length > 3) year = date[0].slice(-2);

    return { month: date[0].slice(0, 2), year: year };
  }

  function toJsonDate(_ref6) {
    var month = _ref6.month,
        year = _ref6.year;

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

  function canActivate(_, next, _ref7) {
    var router = _ref7.router;

    return this.db.user.session.get().then(function (session) {

      var loggedIn = session && session.account;

      for (var _iterator5 = router.navigation, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
        var _ref8;

        if (_isArray5) {
          if (_i5 >= _iterator5.length) break;
          _ref8 = _iterator5[_i5++];
        } else {
          _i5 = _iterator5.next();
          if (_i5.done) break;
          _ref8 = _i5.value;
        }

        var route = _ref8;

        route.isVisible = loggedIn ? route.config.roles && ~route.config.roles.indexOf('user') : !route.config.roles;
      }var canActivate = next.navModel.isVisible || !next.nav;

      return canActivate || router.currentInstruction ? canActivate : new _aureliaRouter.Redirect(loggedIn ? 'shipments' : 'login');
    }).catch(function (err) {
      return console.log('loginRequired error', err);
    });
  }

  function getHistory(id) {
    var _this4 = this;

    return this.db.transaction.history.get(id).then(function (_history) {
      console.log('history', id, _history);

      function id(k, o) {
        if (Array.isArray(o)) return o;
        return o.shipment.from.name + ' ' + o._id;
      }

      function pad(word, num) {
        return (word + ' '.repeat(num)).slice(0, num);
      }
      return JSON.stringify(_history, function (k, v) {
        if (Array.isArray(v)) return v;

        var status = _this4.status || 'pickup';
        var fromName = 'From: ' + v.shipment.account.from.name;
        var fromStreet = v.shipment.account.from.street;
        var fromAddress = v.shipment.account.from.city + ', ' + v.shipment.account.from.state + ' ' + v.shipment.account.from.zip;
        var date = pad(v._id.slice(0, 10), 20);
        var qty = '<a href=\'https://' + window.location.hostname + ':8443/_utils/#database/transaction/' + v._id + '\' target=\'_blank\'>' + pad('Quantity ' + (v.qty.to || v.qty.from), 20) + '</a>';
        var tracking = pad(v.type, 20);
        var toName = '';
        var toStreet = '';
        var toAddress = '';

        if (v.shipment._id) date = '<a href=\'/#/shipments/' + v.shipment._id + '\'>' + date + '</a>';

        if (v.shipment.account.to) {
          toName = 'To: ' + v.shipment.account.to.name;
          toStreet = v.shipment.account.to.street;
          toAddress = v.shipment.account.to.city + ', ' + v.shipment.account.to.state + ' ' + v.shipment.account.to.zip;
          tracking = '<a target=\'_blank\' href=\'https://www.fedex.com/apps/fedextrack/?tracknumbers=' + v.shipment.tracking + '\'>' + pad('FedEx Tracking', 20) + '</a>';
        }

        return date + pad(fromName, 35) + toName + "<br>" + qty + pad(fromStreet, 35) + toStreet + '<br>' + tracking + pad(fromAddress, 35) + toAddress;
      }, "   ").slice(2, -2).replace(/(\[\n?\s*){1,2}/g, "<div style='border-left:1px solid; padding-left:8px; margin-top:-12px'>").replace(/(\n?\s*\],?){1,2}/g, '</div>').replace(/ *"/g, '').replace(/\n/g, '<br><br>');
    });
  }

  function currentDate(addMonths, split) {
    var date = new Date();
    date.setMonth(date.getMonth() + addMonths);
    date = date.toJSON();
    return split ? date.split(/\-|T|:|\./) : date;
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

    numberValueConverter.prototype.toView = function toView(num, decimals) {
      return num && decimals != null ? num.toFixed(decimals) : num;
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
        var price = transaction.drug.price.goodrx || transaction.drug.price.nadac || transaction.drug.price.retail || 0;
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

      var _parseUserDate = (0, _helpers.parseUserDate)(date.replace(/\+|\-|\=/g, '')),
          month = _parseUserDate.month,
          year = _parseUserDate.year;

      if (date.includes('+') || date.includes('=')) month++;

      if (date.includes('-')) month--;

      if (month < 1) {
        year--;
        month = 12;
      }

      if (month > 12) {
        year++;
        month = 1;
      }

      this.view = date.length == 1 ? month : ("00" + month).slice(-2) + '/' + year;

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
        _this.switchUserText = "Switch User";

        _this.db.account.query('all-accounts', { include_docs: true }).then(function (accounts) {
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
      }).catch(function (err) {
        return console.error('account.authorize', err);
      });
    };

    account.prototype.showUserSwitchPage = function showUserSwitchPage() {
      this.dialog.showModal();
    };

    account.prototype.phoneInAccount = function phoneInAccount(phone) {
      for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].phone.replace(/-/g, '') == phone.replace(/-/g, '')) return true;
      }
      return false;
    };

    account.prototype.switchUsers = function switchUsers(event) {
      var _this6 = this;

      if (!this.phoneInAccount(this.phone)) return this.snackbar.show('Phone number is not in this account');

      console.log("switching to user", this.phone, this.password);

      this.switchUserText = "Switching...";

      this.db.user.session.post({ phone: this.phone, password: this.password, switchUsers: true }).then(function (_) {
        _this6.router.navigate('picking');
      }).catch(function (err) {
        console.log("error:", err);
        _this6.snackbar.error('Login failed', err);
        _this6.switchUserText = "Switch User";
      });
    };

    account.prototype.closeSwitchUsersDialog = function closeSwitchUsersDialog() {
      this.dialog.close();
    };

    account.prototype.logout = function logout() {
      var _this7 = this;

      this.disableLogout = 'Uninstalling...';
      this.db.user.session.delete().then(function (_) {
        _this7.router.navigate('login', { trigger: true });
      }).catch(function (err) {
        return console.trace('Logout failed:', err);
      });
    };

    account.prototype.importCSV = function importCSV($event) {
      var _this8 = this;

      this.snackbar.show('Uploading CSV File');
      var elem = $event.target;
      console.log(elem.parentNode.parentNode.getAttribute('href'), elem.parentNode.parentNode.href, elem.parentNode.parentNode);
      return this.db.ajax({ method: 'post', url: elem.parentNode.parentNode.getAttribute('href'), body: elem.files[0], json: false }).then(function (rows) {
        return _this8.snackbar.show('Import Succesful');
      }).catch(function (err) {
        return _this8.snackbar.error('Import Error', err);
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
      this.groupDrugs = _helpers.groupDrugs;
      this.focusInput = _helpers.focusInput;
      this.drugName = _helpers.drugName;
      this.canActivate = _helpers.canActivate;
      this.currentDate = _helpers.currentDate;
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
      }).catch(function (err) {
        console.error('Could not get session for user.  Please verify user registration and login are functioning properly');
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

    drugs.prototype.addDays = function addDays(days) {
      var date = new Date();
      date.setDate(+days + date.getDate());
      return (days ? date : new Date()).toJSON().slice(0, 10);
    };

    drugs.prototype.selectGroup = function selectGroup(group, autoselectDrug) {
      var _this3 = this;

      console.log('selectGroup()', group, this.drug && this.drug.generic);

      this.term = group.generic;

      var order = this.account.ordered[group.generic] || {};
      var minDays = order.minDays || this.account.default && this.account.default.minDays;
      var indate = this.addDays(minDays).split('-');
      var unexpired = this.currentDate(1, true);

      this.db.transaction.query('inventory-by-generic', { startkey: [this.account._id, 'month', indate[0], indate[1], group.generic], endkey: [this.account._id, 'month', indate[0], indate[1], group.generic, {}] }).then(function (inventory) {
        console.log('indate inventory', minDays, indate, inventory);
        var row = inventory.rows[0];
        _this3.indateInventory = row ? row.value[0].sum : 0;
        console.log('indate inventory', _this3.indateInventory);

        _this3.db.transaction.query('inventory-by-generic', { startkey: [_this3.account._id, 'month', unexpired[0], unexpired[1], group.generic], endkey: [_this3.account._id, 'month', unexpired[0], unexpired[1], group.generic, {}] }).then(function (inventory) {
          console.log('outdate inventory', unexpired, inventory);
          var row = inventory.rows[0];
          _this3.outdateInventory = row ? row.value[0].sum - _this3.indateInventory : 0;
          console.log('outdate inventory', _this3.outdateInventory);
        });
      });

      if (!group.drugs) group.drugs = this.search().then(function (_) {
          var filtered = _this3.groups.filter(function (group) {
            console.log('Filtering drug seach for exact results', _this3.term, group.generic, group);
            return _this3.term == group.generic;
          });
          return filtered.length ? filtered[0].drugs : [];
        });

      Promise.resolve(group.drugs).then(function (drugs) {
        group.drugs = drugs;
        _this3.group = group;

        if (autoselectDrug) _this3.selectDrug(group.drugs[0]);
      });
    };

    drugs.prototype.selectDrug = function selectDrug(drug, autoselectGroup) {
      var _this4 = this;

      console.log('selectDrug()', this.group && this.group.name, this.group && this.group.generic, this.drug, drug);

      var url = void 0;

      if (drug) {
        this.drug = drug;
        url = 'drugs/' + this.drug._id;
      } else {
        this.drug = {
          generics: this.drug && this.drug.generics || [],
          form: this.drug && this.drug.form,
          brand: this.drug && this.drug.brand,
          gsns: this.drug && this.drug.gsns
        };
        url = 'drugs';

        setTimeout(function (_) {
          _this4.focusInput('[name=pro_ndc_field]');
        }, 100);
      }

      this.setGenericRows(this.drug.generics.slice(-1)[0], 0, true);
      this.router.navigate(url, { trigger: false });

      if (autoselectGroup) this.selectGroup({ generic: this.drug.generic });
    };

    drugs.prototype.selectDrawer = function selectDrawer(generic) {
      this.selectGroup({ generic: generic }, true);
      this.toggleDrawer();
    };

    drugs.prototype.search = function search() {
      var _this5 = this;

      return this.drugSearch().then(function (drugs) {
        _this5.groups = _this5.groupDrugs(drugs, _this5.account.ordered);
        console.log('drugs.js search()', drugs.length, _this5.groups.length, _this5.groups);
      });
    };

    drugs.prototype.markHazard = function markHazard() {

      if (!this.account.hazards) this.account.hazards = {};

      if (this.account.hazards[this.group.generic]) {
        this.account.hazards[this.group.generic] = undefined;
      } else {
        this.account.hazards[this.group.generic] = { "message": "warning" };
      }

      this.saveAccount();
    };

    drugs.prototype.order = function order() {
      var _this6 = this;

      console.log('before order()', this.group.generic, this.drug.generic);

      if (this.account.ordered[this.group.generic]) {
        this.drawer.ordered = this.drawer.ordered.filter(function (generic) {
          return generic != _this6.group.generic;
        });

        this.account.ordered[this.group.generic] = undefined;
      } else {
        this.drawer.ordered.unshift(this.group.generic);
        this.account.ordered[this.group.generic] = {};
      }
      console.log('after order()', this.group.generic, this.drug.generic);
      this.saveAccount();
    };

    drugs.prototype.exportCSV = function exportCSV(generic) {
      var _this7 = this;

      var inventory = this.db.transaction.query('inventory-by-generic', { key: [this.account._id] });
      var drugs = this.db.drug.allDocs({ include_docs: true, endkey: '_design' });
      Promise.all([inventory, drugs]).then(function (_ref) {
        var inventory = _ref[0],
            drugs = _ref[1];

        console.log('Export queries run');
        var ndcMap = {};
        for (var _iterator = inventory.rows, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref2 = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref2 = _i.value;
          }

          var row = _ref2;

          ndcMap[row.key[2]] = row.value[0];
        }
        console.log('Inital map complete');
        _this7.csv.fromJSON('Drugs ' + new Date().toJSON() + '.csv', drugs.rows.map(function (row) {
          return {
            order: _this7.account.ordered[row.doc.generic],
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

      this.csv.toJSON(this.$file.files[0], function (drugs) {
        _this8.$file.value = '';
        var errs = [];
        var chain = Promise.resolve();

        var _loop = function _loop(i) {
          chain = chain.then(function (_) {
            var drug = drugs[i];

            if ("add_warning" in drug) {

              console.log("Updating drug warning messages");
              _this8.snackbar.show("Updating warning messages");

              _this8.db.drug.get(drug._id).then(function (drugs_found) {
                var item = drugs_found;
                console.log("Drug found: " + item.generics[0].name + " " + item.generics[0].strength + ", NDC: " + item.ndc9);

                if ("warning" in item) {
                  item.warning = drug.add_warning + "; " + item.warning;
                } else {
                  item.warning = drug.add_warning;
                }

                return _this8.db.drug.post(item).then(function (_) {
                  console.log("Message saved");
                }).catch(function (err) {
                  console.log("ERROR UPDATING MESSAGE:" + JSON.stringify(err));
                });
              }).catch(function (err) {
                console.log("Drug not found: " + JSON.stringify(err));
              });
            } else {
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

              return _this8.db.drug.post(drug).catch(function (err) {
                drug._err = 'Upload Error: ' + JSON.stringify(err);
                errs.push(drug);
              }).then(function (_) {
                if (+i && i % 100 == 0) _this8.snackbar.show('Imported ' + i + ' of ' + drugs.length);
              });
            }
          });
        };

        for (var i in drugs) {
          _loop(i);
        }

        return chain.then(function (_) {
          return errs;
        });
      }).then(function (rows) {
        return _this8.snackbar.show('Import Succesful');
      }).catch(function (err) {
        return _this8.snackbar.error('Import Error', err);
      });
    };

    drugs.prototype.setGenericRows = function setGenericRows(generic, $index, $last) {
      if (!generic || generic.name && $last) this.drug.generics.push({ strength: '' });
      if (!$last && !generic.name && !generic.strength) {
        this.drug.generics.splice($index, 1);
        setTimeout(function (_) {
          return document.forms[0].dispatchEvent(new Event('change'));
        });
      }
    };

    drugs.prototype.saveAccount = function saveAccount() {
      var _this9 = this;

      return this.db.account.put(this.account).catch(function (_) {
        console.log('after saveAccount()', _this9.group.generic, _this9.drug.generic);
        _this9.snackbar.show('Error while saving: ' + (err.reason || err.message));
      });
    };

    drugs.prototype.showDefaultsDialog = function showDefaultsDialog() {
      console.log('showDefaultsDialog');
      this.dialog.showModal();
    };

    drugs.prototype.closeDefaultsDialog = function closeDefaultsDialog() {
      this.dialog.close();
    };

    drugs.prototype.addDrug = function addDrug() {
      var _this10 = this;

      this._savingDrug = true;

      this.drug.generics.pop();

      this.db.drug.post(this.drug).then(function (res) {
        _this10.drug._rev = res.rev;
        _this10.selectDrug(_this10.drug, true);
        _this10._savingDrug = false;
      }).catch(function (err) {
        _this10._savingDrug = false;
        console.log(err);
        _this10.snackbar.show('Drug not added: ' + (err.reason || err.message || JSON.stringify(err.errors)));
      });
    };

    drugs.prototype.saveDrug = function saveDrug() {
      var _this11 = this;

      this._savingDrug = true;

      this.drug.generics.pop();

      this.db.drug.put(this.drug).then(function (res) {
        if (_this11.group.generic != _this11.drug.generic && _this11.group.drugs.length == 1 && _this11.account.ordered[_this11.group.generic]) _this11.order();

        _this11.selectDrug(_this11.drug, true);
        _this11._savingDrug = false;
      }).catch(function (err) {
        _this11._savingDrug = false;
        _this11.snackbar.show('Drug not saved: ' + (err.reason || err.message));
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
        license: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        ordered: {}
      };

      this.user = {
        name: { first: '', last: '' },
        phone: ''
      };
      this.canActivate = _helpers.canActivate;
    }

    join.prototype.join = function join() {
      var _this = this;

      this.disabled = true;
      this.user.account = { _id: this.account.phone };

      this.db.user.post(this.user).then(function (res) {
        console.log('this.db.user.post success', res, _this.user);
        return _this.db.account.post(_this.account);
      }).then(function (res) {
        console.log('this.db.account.post success', res, _this.account);
        return new Promise(function (resolve) {
          return setTimeout(resolve, 5000);
        });
      }).then(function (_) {
        return _this.db.user.session.post(_this.user);
      }).then(function (loading) {
        console.log('this.db.user.session.post success', loading);

        _this.loading = loading.resources;
        _this.progress = loading.progress;

        return Promise.all(loading.syncing);
      }).then(function (_) {
        console.log('join success', _);
        return _this.router.navigate('shipments');
      }).catch(function (err) {
        _this.disabled = false;

        err.account = _this.account;
        err.user = _this.user;

        if (err.message == "Document update conflict") err.message = "phone number must be unique";

        _this.snackbar.error('Join failed', err);
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
        _this.router.navigate('picking');
      }).catch(function (err) {
        _this.disabled = false;
        _this.snackbar.error('Login failed', err);
      });
    };

    return login;
  }()) || _class);
});
define('client/src/views/picking',['exports', 'aurelia-framework', '../libs/pouch', 'aurelia-router', '../resources/helpers'], function (exports, _aureliaFramework, _pouch, _aureliaRouter, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.pendedFilterValueConverter = exports.shopping = undefined;

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _dec, _class;

  var shopping = exports.shopping = (_dec = (0, _aureliaFramework.inject)(_pouch.Pouch, _aureliaRouter.Router), _dec(_class = function () {
    function shopping(db, router) {
      _classCallCheck(this, shopping);

      window.addEventListener('popstate', function (event) {
        console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));

        var groupAndStep = document.location.href.split('picking/')[1];
        if (groupAndStep) {
          var _groupAndStep$split = groupAndStep.split('step/'),
              group = _groupAndStep$split[0],
              step = _groupAndStep$split[1];

          console.log(group, step);
        }
      });

      this.db = db;
      this.router = router;

      this.groups = [];
      this.shopList = [];
      this.shoppingIndex = -1;
      this.nextButtonText = '';
      this.orderSelectedToShop = false;
      this.formComplete = false;
      this.basketSaved = false;
      this.currentCart = '';
      this.basketOptions = ['S', 'R', 'G', 'B'];
      this.focusInput = _helpers.focusInput;

      this.canActivate = _helpers.canActivate;
      this.currentDate = _helpers.currentDate;
      this.clearNextProperty = _helpers.clearNextProperty;
    }

    shopping.prototype.deactivate = function deactivate() {};

    shopping.prototype.canDeactivate = function canDeactivate() {
      return confirm('Confirm you want to leave page');
    };

    shopping.prototype.activate = function activate(params) {
      var _this = this;

      this.groupName = params.groupName;

      if (this.groupName) {
        this.orderSelectedToShop = true;
      }

      return this.db.user.session.get().then(function (session) {
        console.log('user acquired');
        _this.user = { _id: session._id };
        _this.account = { _id: session.account._id };

        _this.db.user.get(_this.user._id).then(function (user) {
          _this.router.routes[2].navModel.setTitle(user.name.first);
        });

        if (!_this.account.hazards) _this.account.hazards = {};
        console.log('about to call refresh first time');
        _this.refreshPendedGroups();

        if (_this.isValidGroupName()) {
          return _this.db.account.picking.post({ groupName: params.groupName, action: 'group_info' }).then(function (res) {
            console.log('GROUP LOADED:' + params.groupName, 'stepNumber', params.stepNumber, res);

            if (!res.groupData || !res.shopList) {
              console.error('activate()  ! res.shopList || ! res.groupData', res);
              throw res;
            }

            _this.shopList = res.shopList;
            _this.groupData = res.groupData;
            _this.groupLoaded = true;

            _this.requestedPickingStep = params.stepNumber ? params.stepNumber : _this.currentShoppingIndex() + 1;

            _this.manageShoppingIndex();
          });
        } else {
          _this.groupLoaded = false;
          console.error('activate() group loaded is false', params);
        }
      }).catch(function (err) {
        console.log("error getting user session:", err);
        return confirm('Error getting user session, info below or console. Click OK to continue. ' + JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
      });
    };

    shopping.prototype.addPreviousPickInfoIfExists = function addPreviousPickInfoIfExists(shopList) {
      for (var _iterator = Object.keys(shopList), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var i = _ref;

        var transaction = shopList[i].raw;

        if (transaction.next && transaction.next[0]) {
          var next = transaction.next;

          if (next[0].pickedArchive && next[0].pickedArchive.user._id === this.user._id) {
            next[0].picked = next[0].pickedArchive;
            transaction.next = next;
          }
        }
      }

      return shopList;
    };

    shopping.prototype.updatePickedCount = function updatePickedCount() {
      var _this2 = this;

      var date = new Date();

      var _date$toJSON$split$0$ = date.toJSON().split('T')[0].split('-'),
          year = _date$toJSON$split$0$[0],
          month = _date$toJSON$split$0$[1],
          day = _date$toJSON$split$0$[2];

      this.db.transaction.query('picked-by-user-from-shipment', { startkey: [this.account._id, this.user._id, year, month, day], endkey: [this.account._id, this.user._id, year, month, day, {}] }).then(function (res) {
        console.log(res);
        _this2.pickedCount = res.rows[0] ? res.rows[0].value[0].count : 0;
      });
    };

    shopping.prototype.firstUnsavedIndex = function firstUnsavedIndex() {
      var max = 0;

      for (var _iterator2 = Object.entries(this.shopList), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var _ref3 = _ref2,
            index = _ref3[0],
            transaction = _ref3[1];


        if (!transaction.extra || !transaction.extra.saved) {
          console.log('firstUnsavedIndex', max, 'of', this.shopList.length, this.shopList);
          return max;
        }

        max++;
      }

      console.log('firstUnsavedIndex ALL SAVED', max, 'of', this.shopList.length, this.shopList);
      return null;
    };

    shopping.prototype.manageShoppingIndex = function manageShoppingIndex() {
      var firstUnsavedIndex = this.firstUnsavedIndex();

      if (firstUnsavedIndex == null) {
        this.loadGroupSelectionPage();
      } else if (this.requestedPickingStep > firstUnsavedIndex + 1) {
        console.log('manageShoppingIndex m0', 'this.shopList.length', this.shopList.length, 'requestedPickingStep', this.requestedPickingStep, 'firstUnsavedIndex', firstUnsavedIndex);
        this.requestedPickingStep = firstUnsavedIndex + 1;
        this.setShoppingIndex(firstUnsavedIndex);
        alert('Please complete step ' + this.requestedPickingStep + ' first');
      } else if (this.requestedPickingStep <= this.shopList.length && this.requestedPickingStep > 0) {
        console.log('manageShoppingIndex m1', 'this.shopList.length', this.shopList.length, 'requestedPickingStep', this.requestedPickingStep, 'firstUnsavedIndex', firstUnsavedIndex);
        this.setShoppingIndex(this.requestedPickingStep - 1);
      } else if (this.requestedPickingStep === 'basket') {
        console.log('manageShoppingIndex m2', 'this.shopList.length', this.shopList.length, 'requestedPickingStep', this.requestedPickingStep, 'firstUnsavedIndex', firstUnsavedIndex);
        this.basketSaved = false;
        this.initializeShopper();
      } else if (this.groupLoaded === true) {
        console.log('manageShoppingIndex m3', 'this.shopList.length', this.shopList.length, 'requestedPickingStep', this.requestedPickingStep, 'firstUnsavedIndex', firstUnsavedIndex);
        this.setShoppingIndex(0);
      }
    };

    shopping.prototype.refreshPendedGroups = function refreshPendedGroups() {
      var _this3 = this;

      console.log('refreshing');

      this.updatePickedCount();

      this.db.account.picking['post']({ action: 'refresh' }).then(function (res) {
        _this3.groups = res;
      }).catch(function (err) {
        console.log("error refreshing pended groups:", JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
        return confirm('Error refreshing pended groups, info below or console. Click OK to continue. ' + JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
      });
    };

    shopping.prototype.unlockGroup = function unlockGroup(groupName, el) {
      var _this4 = this;

      for (var i = 0; i < this.groups.length; i++) {
        if (this.groups[i].name == groupName) this.groups[i].locked = 'unlocking';
      }

      var start = Date.now();

      this.db.account.picking.post({ groupName: groupName, action: 'unlock' }).then(function (res) {
        _this4.groups = res;
      }).catch(function (err) {
        console.log("error unlocking order:", (Date.now() - start) / 1000, 'seconds', JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
        return confirm('Error unlocking order, info below or console. Click OK to continue. ' + JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
      });
    };

    shopping.prototype.navigate = function navigate(groupName, stepNumber) {

      var previousStepNumber = stepNumber - 1;
      this.groupName = groupName;

      if (previousStepNumber === 0) {}

      this.router.navigate('picking/' + groupName + '/step/' + stepNumber);

      return true;
    };

    shopping.prototype.getOutcomeName = function getOutcomeName(outcomeObject) {
      var match = Object.entries(outcomeObject).filter(function (entry) {
        return entry[1] == true ? entry[1] : null;
      });

      return match.length ? match[0][0] : null;
    };

    shopping.prototype.selectGroup = function selectGroup(groupName, isLocked, isLockedByCurrentUser) {
      var _this5 = this;

      console.log('locking status on select', groupName, isLocked, isLockedByCurrentUser);

      if (isLocked && !isLockedByCurrentUser || groupName.length === 0) return null;

      this.groupLoaded = false;
      this.orderSelectedToShop = true;
      this.groupName = groupName;

      var start = Date.now();

      this.db.account.picking.post({ groupName: groupName, action: 'load' }).then(function (res) {
        console.log("selectGroup: result of loading: " + res.length, (Date.now() - start) / 1000, 'seconds');
        console.log('selectGroup:', res, 'shippingIndex', _this5.shippingIndex);

        if (!res.shopList || !res.groupData) {
          console.error('selectGroup() ! res.shopList || ! res.groupData', res);
          throw res;
        }

        _this5.shopList = res.shopList;
        _this5.groupData = res.groupData;
        _this5.pendedFilter = '';
        _this5.filter = {};

        var currentShoppingIndex = _this5.currentShoppingIndex();

        _this5.setPickingStepUrl(currentShoppingIndex + 1);

        if (currentShoppingIndex == 0) {
          _this5.initializeShopper();
        }

        var genericName = _this5.shopList[currentShoppingIndex].raw.drug.generic.replace(/\s/g, '');

        if (_this5.basketSaved && _this5.groupData.basketsByGeneric && _this5.groupData.basketsByGeneric[genericName]) {
          var basket = _this5.groupData.basketsByGeneric[genericName].slice(-1);
          _this5.addBasketToShoppingList(basket);
          _this5.basketSaved = true;
        }
      }).catch(function (err) {
        if (~err.message.indexOf('Unexpected end of JSON input') || ~err.message.indexOf('Unexpected EOF')) {
          var res = confirm("Seems this order is no longer available to shop or someone locked it down. Click OK to refresh available groups. If this persists, contact Adam / Aminata");
          _this5.refreshPendedGroups();
          _this5.resetShopper();
        } else {
          console.log("error loading order:", JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
          return confirm('Error loading group, info below or console. Click OK to continue. ' + JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
        }
      });
    };

    shopping.prototype.initializeShopper = function initializeShopper() {

      console.log('initializeShopper before:', 'shoppingIndex', this.shoppingIndex, 'groupLoaded', this.groupLoaded, 'shopList', this.shopList);

      this.shoppingIndex = this.currentShoppingIndex();
      this.groupLoaded = true;

      if (this.shoppingIndex + 1 === this.shopList.length) {
        this.setNextToSave();
      } else {
        this.setNextToNext();
      }

      this.addBasket(this.shoppingIndex);
    };

    shopping.prototype.resetShopper = function resetShopper() {
      this.orderSelectedToShop = false;
      this.formComplete = false;
      this.updatePickedCount();
    };

    shopping.prototype.updateRevs = function updateRevs(res) {
      var _this6 = this;

      var results = {};
      res.forEach(function (transaction) {
        results[transaction._id || transaction.id] = transaction;
      });

      this.shopList.forEach(function (shopListItem, index) {
        if (results[shopListItem.raw._id]) {
          _this6.shopList[index].raw._rev = results[shopListItem.raw._id].rev;
          console.log(shopListItem.raw._id + ' => ' + shopListItem.raw._rev);
        }
      });

      return results;
    };

    shopping.prototype.saveShoppingResults = function saveShoppingResults(arr_enriched_transactions, key) {
      var _this7 = this;

      var transactions_to_save = this.prepResultsToSave(arr_enriched_transactions, key);

      console.log("attempting to save these transactions", transactions_to_save);
      var startTime = new Date().getTime();

      if (!transactions_to_save || !transactions_to_save.length) {
        console.log('nothing to save');
        return Promise.resolve();
      }

      return this.db.transaction.bulkDocs(transactions_to_save).then(function (res) {
        var completeTime = new Date().getTime();
        var results = _this7.updateRevs(res);
        console.log("save (" + key + ") results of saving in " + (completeTime - startTime) + " ms", results);
      }).catch(function (err) {

        var completeTime = new Date().getTime();
        console.log("error saving in " + (completeTime - startTime) + "ms:", JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));

        if (err.status == 0) {

          console.log("going to try and save one more time, in case it was just connectivity " + JSON.stringify(transactions_to_save));

          return _this7.delay(3000).then(function (_) {

            console.log("waiting finished, sending again");

            return _this7.db.transaction.bulkDocs(transactions_to_save).then(function (res) {
              var finalTime = new Date().getTime();
              console.log("succesful second saving in " + (finalTime - completeTime) + " ms", JSON.stringify(res));
            }).catch(function (err) {
              console.log("saving: empty object error the second time");
              return confirm('Error saving item on second attempt. Error object: ' + JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
            });
          });
        } else {

          _this7.snackbar.error('Error loading/saving. Contact Adam', err);
          return confirm('Error saving item, info below or console. Click OK to continue. ' + JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
        }
      });
    };

    shopping.ifExists = function ifExists(obj, path) {
      var currentNode = obj;
      path = path.split('.');

      for (var _iterator3 = path, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref4;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref4 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref4 = _i3.value;
        }

        var part = _ref4;

        currentNode = currentNode[part];

        if (!currentNode) break;
      }

      return currentNode;
    };

    shopping.outcomeChanged = function outcomeChanged(transaction, outcome) {
      var data = transaction.next[0];

      console.log('comparing outcomes', outcome, shopping.ifExists(data, 'pickedArchive.matchType'));

      if (!data.picked || !data.pickedArchive) {
        return true;
      }

      if (data && data.picked && data.pickedArchive) {
        return outcome !== data.pickedArchive.matchType;
      }

      return false;
    };

    shopping.canChangeOutcome = function canChangeOutcome(transaction) {
      var data = transaction.next[0];

      if (data.pickedArchive) {
        return data.pickedArchive.matchType !== 'missing';
      }

      return true;
    };

    shopping.prototype.prepResultsToSave = function prepResultsToSave(arr_enriched_transactions, key) {

      if (arr_enriched_transactions.length == 0) {
        console.log('no transactions to save');
        return;
      }

      var transactions_to_save = [];

      for (var i = 0; i < arr_enriched_transactions.length; i++) {

        var reformated_transaction = arr_enriched_transactions[i].raw;
        var next = reformated_transaction.next;

        if (next[0]) {
          if (key == 'shopped') {
            var outcome = this.getOutcome(arr_enriched_transactions[i].extra);

            if (!shopping.canChangeOutcome(reformated_transaction)) {
              console.log(reformated_transaction._id, 'Outcome === missing. Updates not allowed.');
              continue;
            }

            if (!shopping.outcomeChanged(reformated_transaction, outcome)) {
              console.log(reformated_transaction._id, 'Same outcome. Not saving.');
              continue;
            }

            next[0].picked = {
              _id: new Date().toJSON(),
              basket: arr_enriched_transactions[i].extra.fullBasket,
              repackQty: next[0].pended.repackQty ? next[0].pended.repackQty : reformated_transaction.qty.to ? reformated_transaction.qty.to : reformated_transaction.qty.from,
              matchType: outcome,
              user: this.user
            };

            next[0].pickedArchive = next[0].picked;
          } else if (key == 'unlock') {

            delete next[0].picked;
          } else if (key == 'lockdown') {

            next[0].picked = {};
          }
        }

        reformated_transaction.next = next;
        transactions_to_save.push(reformated_transaction);
      }

      if (!transactions_to_save.length) {
        console.log('no transactions to save');
        return;
      }

      return transactions_to_save;
    };

    shopping.prototype.saveBasketNumber = function saveBasketNumber() {
      var _this8 = this;

      console.log('saveBasketNumber called', this.shoppingIndex, this.shopList[this.shoppingIndex], this.shopList);

      this.shopList[this.shoppingIndex].extra.fullBasket = this.shopList[this.shoppingIndex].extra.basketLetter + this.shopList[this.shoppingIndex].extra.basketNumber;

      if (this.shopList[this.shoppingIndex].extra.basketLetter != 'G' && this.currentCart != this.shopList[this.shoppingIndex].extra.basketNumber[0]) {
        this.currentCart = this.shopList[this.shoppingIndex].extra.basketNumber[0];
      }

      if (this.shopList[this.shoppingIndex].raw) this.gatherBaskets(this.shopList[this.shoppingIndex].raw.drug.generic);

      var extra = this.shopList[this.shoppingIndex].extra;

      var basket = {
        letter: extra.basketLetter,
        number: extra.basketNumber,
        fullBasket: extra.fullBasket
      };

      var idData = {
        _id: this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex].raw._id,
        _rev: this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex].raw._rev
      };

      this.db.account.picking.post({
        id: idData,
        groupName: this.groupName,
        basket: basket,
        action: 'save_basket_number'
      }).then(function (res) {
        var results = _this8.updateRevs([res]);

        if (Object.keys(results).length > 0) {
          _this8.basketSaved = true;
          _this8.addBasketToShoppingList(basket);
        }
      });

      this.setShoppingIndex(this.currentShoppingIndex());
    };

    shopping.prototype.currentShoppingIndex = function currentShoppingIndex() {

      console.log('currentShoppingIndex before', 'shoppingIndex', this.shoppingIndex, _typeof(this.shoppingIndex), 'shopListMaxIndex', this.shopList.length, 'groupData', this.groupData, 'shopList', this.shopList);

      if (typeof this.shoppingIndex !== 'undefined' && this.shoppingIndex >= 0 && this.shoppingIndex <= this.shopList.length - 1) {
        console.log('currentShoppingIndex provided', this.shoppingIndex, this.shopList);
        return this.shoppingIndex;
      }

      var firstUnsavedIndex = this.firstUnsavedIndex();
      console.log('currentShoppingIndex firstUnsavedIndex', 'groupData', this.groupData, 'shopList', this.shopList, 'firstUnsavedIndex', firstUnsavedIndex);
      return firstUnsavedIndex;
    };

    shopping.prototype.gatherBaskets = function gatherBaskets(generic) {
      var list_of_baskets = '';
      for (var i = 0; i < this.shopList.length; i++) {
        if (this.shopList[i].extra.fullBasket && !~list_of_baskets.indexOf(this.shopList[i].extra.fullBasket) && (!this.shopList[i].raw || this.shopList[i].raw.drug.generic == generic)) list_of_baskets += ',' + this.shopList[i].extra.fullBasket;
      }
      this.currentGenericBaskets = list_of_baskets;
    };

    shopping.prototype.addBasket = function addBasket(index) {
      if (!this.shopList || !this.shopList[index]) {
        console.error('addBasket() ! res.shopList || ! res.groupData', this.shopList, index);
        return;
      }

      this.basketSaved = false;

      if (this.shopList[index].extra.basketLetter != 'G') {
        this.shopList[index].extra.basketNumber = this.currentCart;
      }
    };

    shopping.prototype.delay = function delay(ms) {
      return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
      });
    };

    shopping.prototype.moveShoppingForward = function moveShoppingForward() {
      var _this9 = this;

      if (this.getOutcome(this.shopList[this.shoppingIndex].extra) != 'missing' || this.shopList[this.shoppingIndex].extra.saved == 'missing') {
        return this.advanceShopping();
      }

      this.formComplete = false;
      this.setNextToLoading();

      console.log("missing item! sending request to server to compensate for:", this.shopList[this.shoppingIndex].raw.drug.generic);

      this.db.account.picking['post']({
        groupName: this.shopList[this.shoppingIndex].raw.next[0].pended.group,
        action: 'missing_transaction',
        ndc: this.shopList[this.shoppingIndex].raw.drug._id,
        generic: this.shopList[this.shoppingIndex].raw.drug.generic,
        qty: this.shopList[this.shoppingIndex].raw.qty.to,
        repackQty: this.shopList[this.shoppingIndex].raw.next[0].pended.repackQty
      }).then(function (res) {

        if (res.length > 0) {

          _this9.shopList[_this9.shoppingIndex].extra.saved = 'missing';
          _this9.groupData.numTransactions += res.length;

          for (var j = 0; j < res.length; j++) {

            var n = _this9.shoppingIndex - (_this9.shopList[_this9.shoppingIndex].extra.genericIndex.relative_index[0] - 1);
            if (n < 0) n = 0;
            var inserted = false;

            for (n; n < _this9.shopList.length; n++) {

              if (_this9.shopList[n].raw.drug.generic == res[j].raw.drug.generic) {
                _this9.shopList[n].extra.genericIndex.relative_index[1]++;
              } else {
                res[j].extra.genericIndex = { global_index: _this9.shopList[n - 1].extra.genericIndex.global_index, relative_index: [_this9.shopList[n - 1].extra.genericIndex.relative_index[0] + 1, _this9.shopList[n - 1].extra.genericIndex.relative_index[1]] };
                _this9.shopList.splice(n, 0, res[j]);
                inserted = true;
                n = _this9.shopList.length;
              }
            }

            if (!inserted) {
              res[j].extra.genericIndex = { global_index: _this9.shopList[n - 1].extra.genericIndex.global_index, relative_index: [_this9.shopList[n - 1].extra.genericIndex.relative_index[0] + 1, _this9.shopList[n - 1].extra.genericIndex.relative_index[1]] };
              _this9.shopList.push(res[j]);
            }
          }
        } else {
          console.log("couldn't find item with same or greater qty to replace this");
        }

        _this9.advanceShopping();
      }).catch(function (err) {
        console.log("error compensating for missing:", JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
        return confirm('Error handling a missing item, info below or console. Click OK to continue. ' + JSON.stringify({ status: err.status, message: err.message, reason: err.reason, stack: err.stack }));
      });
    };

    shopping.prototype.advanceShopping = function advanceShopping() {
      var _this10 = this;

      if (this.shoppingIndex + 1 === this.shopList.length) {

        this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').then(function (_) {

          console.log('advanceShopping completed', _);

          _this10.resetShopper();
          _this10.unlockGroup(_this10.shopList[_this10.shoppingIndex].raw.next[0].pended.group);
          _this10.refreshPendedGroups();
          _this10.loadGroupSelectionPage();
        });

        for (var i = this.groups.length - 1; i >= 0; i--) {
          if (this.groups[i].name == this.shopList[this.shoppingIndex].raw.next[0].pended.group) {
            this.groups.splice(i, 1);
            break;
          }
        }
      } else {

        if (!this.shopList[this.shoppingIndex + 1].extra.fullBasket) {
          if (this.shopList[this.shoppingIndex].raw.drug.generic == this.shopList[this.shoppingIndex + 1].raw.drug.generic) {
            this.shopList[this.shoppingIndex + 1].extra.basketLetter = this.shopList[this.shoppingIndex].extra.basketLetter;
            this.shopList[this.shoppingIndex + 1].extra.fullBasket = this.shopList[this.shoppingIndex].extra.fullBasket;
          } else {
            this.addBasket(this.shoppingIndex + 1);
          }
        } else if (this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex + 1].raw && this.shopList[this.shoppingIndex].raw.drug.generic != this.shopList[this.shoppingIndex + 1].raw.drug.generic) {
          this.gatherBaskets(this.shopList[this.shoppingIndex + 1].raw.drug.generic);
        }

        console.log('saving transaction', this.shopList[this.shoppingIndex]);
        this.saveShoppingResults([this.shopList[this.shoppingIndex]], 'shopped').then(function (_) {
          console.log('saved transaction', _this10.shopList[_this10.shoppingIndex], _);
          _this10.setShoppingIndex(_this10.shoppingIndex + 1);
        });
      }
    };

    shopping.prototype.addBasketToShoppingList = function addBasketToShoppingList(basket) {
      var letter = void 0,
          number = void 0;

      if (basket.letter) {
        letter = basket.letter;
        number = basket.number;
      } else {
        letter = basket.slice(0, 1);
        number = basket.slice(1);
      }

      this.shopList[this.shoppingIndex].extra.basketLetter = letter;
      this.shopList[this.shoppingIndex].extra.basketNumber = number;
      this.shopList[this.shoppingIndex].extra.fullBasket = letter + number;
      this.basketSaved = true;
    };

    shopping.prototype.setPickingStepUrl = function setPickingStepUrl(stepNumber) {
      if (!this.isValidGroupName()) {
        console.log('not setting step ' + stepNumber);
        return false;
      }

      var url = '#/picking/' + this.groupName + '/step/' + stepNumber;

      if (this.pickingOnloadFired === true) {
        history.pushState(null, null, url);
      } else {
        console.log('replacing state');
        history.replaceState(null, null, url);
        this.pickingOnloadFired = true;
      }
    };

    shopping.prototype.isValidGroupName = function isValidGroupName() {
      var isValid = !!this.groupName && this.groupName.length && this.groupName !== 'undefined';

      return isValid;
    };

    shopping.prototype.loadGroupSelectionPage = function loadGroupSelectionPage() {

      var reload = window.location.hash !== '#/picking';

      history.replaceState(null, null, '#/picking');

      if (reload === true) {
        window.location.reload();
      }
    };

    shopping.prototype.setShoppingIndex = function setShoppingIndex(index) {
      var _this11 = this;

      if (index !== 0 && !index) {
        alert('no index');
        console.trace();
        return false;
      }

      if (!this.isValidGroupName()) {
        this.loadGroupSelectionPage();
        return false;
      }

      console.log('setShoppingIndex requesting : ' + this.groupName + '/' + (index + 1) + '/' + index + ' (group/step/shoppingIndex)');

      var goToIndex = function goToIndex() {

        console.log('goToIndex', 'new', index, 'old', _this11.shoppingIndex);
        console.log('goToIndex', _this11.groupData);
        console.log('goToIndex', _this11.shopList[index]);
        console.log('goToIndex', _this11.shopList[index].raw.drug.generic);

        _this11.shoppingIndex = index;

        var genericName = _this11.shopList[index].raw.drug.generic.replace(/\s/g, '');

        if (_this11.basketSaved !== true) {
          _this11.basketSaved = _this11.groupData.baskets && _this11.groupData.baskets.length && _this11.groupData.basketsByGeneric[genericName] && _this11.groupData.basketsByGeneric[genericName].length;
        }

        console.log('setShoppingIndex picking.basketSaved ', _this11.basketSaved);

        if (index < 0 && _this11.basketSaved) {
          _this11.shoppingIndex = _this11.currentShoppingIndex();
        }

        if (_this11.basketSaved && _this11.groupData.basketsByGeneric && _this11.groupData.basketsByGeneric[genericName]) {
          var basket = _this11.groupData.basketsByGeneric[genericName].slice(-1);
          _this11.addBasketToShoppingList(basket);
        }
        if (_this11.shoppingIndex + 1 === _this11.shopList.length) {
          _this11.setNextToSave();
        } else {
          _this11.setNextToNext();
        }

        _this11.formComplete = !!_this11.shopList[_this11.shoppingIndex].extra.fullBasket && _this11.someOutcomeSelected(_this11.shopList[_this11.shoppingIndex].extra.outcome);
        console.log('setShoppingIndex formComplete', _this11.formComplete);
        _this11.setPickingStepUrl(_this11.shoppingIndex + 1);
      };

      if (!this.shopList.length) {

        this.db.account.picking.post({ groupName: this.groupName, action: 'load' }).then(function (res) {

          if (!res.groupData || !res.shopList) {
            console.error('setShoppingIndex() ! res.shopList || ! res.groupData', res);
            throw res;
          }

          _this11.groupData = res.groupData;
          _this11.shopList = res.shopList;
          _this11.initializeShopper();
          goToIndex();
        });
      } else {
        goToIndex();
      }
    };

    shopping.prototype.moveShoppingBackward = function moveShoppingBackward() {
      if (this.shoppingIndex == 0) return;

      if (this.shopList[this.shoppingIndex - 1].raw && this.shopList[this.shoppingIndex].raw && this.shopList[this.shoppingIndex - 1].raw.drug.generic != this.shopList[this.shoppingIndex].raw.drug.generic) this.gatherBaskets(this.shopList[this.shoppingIndex - 1].raw.drug.generic);

      this.setShoppingIndex(this.shoppingIndex -= 1);
      this.formComplete = true;
    };

    shopping.prototype.pauseShopping = function pauseShopping(groupName) {

      this.resetShopper();
      this.unlockGroup(groupName);

      this.refreshPendedGroups();

      this.loadGroupSelectionPage();
    };

    shopping.prototype.selectShoppingOption = function selectShoppingOption(key) {
      if (this.shopList[this.shoppingIndex].extra.outcome[key]) return;
      this.formComplete = true;

      for (var outcome_option in this.shopList[this.shoppingIndex].extra.outcome) {
        if (outcome_option !== key) {
          this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = false;
        } else {
          this.shopList[this.shoppingIndex].extra.outcome[outcome_option] = true;
        }
      }

      if (key == 'missing') {
        this.setNextToNext();
      } else if (this.shoppingIndex + 1 === this.shopList.length) {
        this.setNextToSave();
      }
    };

    shopping.prototype.arrayMove = function arrayMove(arr, fromIndex, toIndex) {
      var res = arr.slice(0);
      var element = res[fromIndex];
      res.splice(fromIndex, 1);
      res.splice(toIndex, 0, element);
      return res;
    };

    shopping.prototype.formatExp = function formatExp(rawStr) {
      if (!rawStr) return null;

      var substr_arr = rawStr.slice(2, 7).split("-");
      return substr_arr[1] + "/" + substr_arr[0];
    };

    shopping.prototype.someOutcomeSelected = function someOutcomeSelected(outcomeObj) {
      return ~Object.values(outcomeObj).indexOf(true);
    };

    shopping.prototype.warnAboutRequired = function warnAboutRequired() {
      this.snackbar.show('Basket number and outcome are required');
    };

    shopping.prototype.setNextToLoading = function setNextToLoading() {
      this.nextButtonText = 'Updating';
    };

    shopping.prototype.setNextToSave = function setNextToSave() {
      this.nextButtonText = 'Complete';
    };

    shopping.prototype.setNextToNext = function setNextToNext() {
      this.nextButtonText = 'Next';
    };

    shopping.prototype.getOutcome = function getOutcome(extraItemData) {
      var res = '';
      for (var possibility in extraItemData.outcome) {
        if (extraItemData.outcome[possibility]) res += possibility;
      }
      return res;
    };

    return shopping;
  }()) || _class);

  var pendedFilterValueConverter = exports.pendedFilterValueConverter = function () {
    function pendedFilterValueConverter() {
      _classCallCheck(this, pendedFilterValueConverter);
    }

    pendedFilterValueConverter.prototype.toView = function toView() {
      var pended = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var term = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      if (term.length < 3) return pended;

      term = term.toLowerCase();
      var matches = [];

      if (term.trim().length == 0) {
        matches = pended;
      } else {

        for (var i = 0; i < pended.length; i++) {

          if (~pended[i].name.toLowerCase().indexOf(term) || term.trim().length == 0) {
            matches.unshift(pended[i]);
            continue;
          } else if (pended[i].baskets.length > 0) {
            for (var n = 0; n < pended[i].baskets.length; n++) {
              if (~pended[i].baskets[n].toLowerCase().indexOf(term)) {
                matches.unshift(pended[i]);
                break;
              }
            }
          }
        }
      }

      return matches;
    };

    return pendedFilterValueConverter;
  }();
});
define('text!client/src/views/account.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from='client/src/elems/md-table'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/form\"></require>\n\n  <md-drawer>\n    <md-input value.bind=\"filter\" style=\"padding:0 8px\">Filter Users</md-input>\n    <a\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! user.email ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser({name:{}, account:{_id:session.account._id}})\">\n      <div name = \"pro_new_user\" class=\"mdl-typography--title\">New User</div>\n    </a>\n    <a\n      name = \"existing_users\"\n      repeat.for=\"user of users | userFilter:filter\"\n      class=\"mdl-navigation__link ${ user.phone == $parent.user.phone ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectUser(user)\">\n      <div class=\"mdl-typography--title\">${ user.name.first+' '+user.name.last}</div>\n    </a>\n  </md-drawer>\n\n  <section class=\"mdl-grid\">\n\n    <dialog ref=\"dialog\" class=\"mdl-dialog\" style=\"width:800px; top:3%; height:35%;\">\n      <section class=\"mdl-grid\" style=\"margin-top:10vh;\">\n        <form class=\"mdl-card mdl-cell mdl-cell--6-col mdl-cell--middle\" style=\"width:100%; margin:-75px auto 0; padding:48px 96px 28px 96px; max-width:450px\">\n          <md-input name = \"pro_phone\" value.bind=\"phone\" type=\"tel\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Phone</md-input>\n          <md-input name = \"pro_password\" value.bind=\"password\" type=\"password\" required minlength=\"4\">Password</md-input>\n          <md-button\n            name = \"pro_switch_button\"\n            raised color form\n            if.bind=\"users.length == 0 || user._id == session._id\"\n            click.delegate=\"switchUsers($event)\"\n            style=\"padding-top:16px; width:100%\">\n            ${switchUserText}\n          </md-button>\n        </form>\n      </section>\n      <div class=\"mdl-dialog__actions\">\n        <md-button click.delegate=\"closeSwitchUsersDialog()\">Close</md-button>\n      </div>\n    </dialog>\n\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div class=\"mdl-card__title\">\n        <div class=\"mdl-card__title-text\">\n          User Information\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\" input.delegate=\"saveUser() & debounce:1000\">\n        <md-input style=\"width:49%\" value.bind=\"user.name.first\" name = \"pro_first_name\" required>First Name</md-input>\n        <md-input style=\"width:49%\" value.bind=\"user.name.last\" name = \"pro_last_name\" required>Last Name</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.email\" type=\"email\" name = \"pro_email\" pattern=\"[\\w._]{2,}@\\w{3,}\\.(com|org|net|gov)\" required>Email</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.phone\" type=\"tel\" name = \"pro_phone\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Phone</md-input>\n        <md-input style=\"width:100%\" value.bind=\"user.password\" name = \"pro_password\" if.bind=\" ! user._rev\" required>Password ${user._rev}</md-input>\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised style=\"width:100%\" name = \"pro_create_user_button\" if.bind=\"users.length != 0 && ! user._rev\" form disabled click.delegate=\"addUser()\">Create User</md-button>\n        <md-button color raised name = \"pro_switch_user_button\" if.bind=\"users.length == 0 || user._id == session._id\" style=\"width:100%; padding-bottom:10px\" click.delegate=\"showUserSwitchPage()\">Switch Users</md-button>\n        <md-button color=\"accent\" name = \"pro_uninstall_button\" raised style=\"width:100%\" if.bind=\"users.length == 0 || user._id == session._id\" click.delegate=\"logout()\" disabled.bind=\"disableLogout\">${ disableLogout || 'Uninstall' }</md-button>\n        <md-button color=\"accent\" name = \"pro_delete_user_button\" raised style=\"width:100%\" if.bind=\"user._rev && user._id != session._id\" click.delegate=\"deleteUser()\">Delete User</md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <md-menu name=\"pro_menu\" style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li style=\"width:200px\" disabled.bind=\"true\">\n          Export\n          <div style=\"width:80px; float:right;\">Import</div>\n        </li>\n        <a download=\"Transactions ${csvDate}\" href=\"${csvHref}/transaction.csv\"><li>\n          Transactions\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Shipments ${csvDate}\" href=\"${csvHref}/shipment.csv\"><li>\n          Shipments\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Accounts ${csvDate}\" href=\"${csvHref}/account.csv\"><li>\n          Accounts\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Users ${csvDate}\" href=\"${csvHref}/user.csv\"><li>\n          Users\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n        <a download=\"Drugs ${csvDate}\" href=\"${csvHref}/drug.csv\"><li>\n          Drugs\n          <input change.delegate=\"importCSV($event)\" type=\"file\" style=\"width:80px; float:right; margin-top:15px\">\n        </li></a>\n      </md-menu>\n      <div class=\"table-wrap\">\n        <table md-table>\n          <thead>\n            <tr>\n              <th style=\"width:75px\" class=\"mdl-data-table__cell--non-numeric\">Authorized</th>\n              <th style=\"overflow:hidden\" class=\"mdl-data-table__cell--non-numeric\">\n                <md-select\n                  value.bind=\"type\"\n                  options.bind=\"['From', 'To']\"\n                  style=\"width:50px; font-weight:bold; margin-bottom:-26px\">\n                </md-select>\n              </th>\n              <th style=\"width:120px\" class=\"mdl-data-table__cell--non-numeric\">License</th>\n              <th style=\"width:60px\" class=\"mdl-data-table__cell--non-numeric\">Joined</th>\n              <th style=\"width:170px\" class=\"mdl-data-table__cell--non-numeric\">Location</th>\n            </tr>\n          </thead>\n          <tr name = \"pro_account\" repeat.for=\"account of accounts\" if.bind=\"account != $parent.account\">\n            <td class=\"mdl-data-table__cell--non-numeric\">\n              <md-checkbox\n                name = \"pro_checkbox\"\n                if.bind=\"type != 'To'\"\n                checked.one-way=\"$parent.account.authorized.indexOf(account._id) != -1\"\n                click.delegate=\"authorize(account._id)\">\n              </md-checkbox>\n              <md-checkbox\n                if.bind=\"type == 'To'\"\n                checked.one-way=\"account.authorized.indexOf($parent.account._id) != -1\"\n                disabled.bind=\"true\">\n              </md-checkbox>\n            </td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.name }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.license }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.createdAt | date }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ account.city+', '+account.state }</td>\n          </tr>\n        </table>\n      </div>\n    </div>\n\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!client/src/views/drugs.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-table'></require>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-autocomplete\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-text\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <md-drawer>\n    <md-select\n      options.bind=\"['Ordered', 'Inventory < ReorderAt', 'Inventory > ReorderTo', 'Inventory Expiring before Min Days', 'Missing Retail Price', 'Missing Wholesale Price', 'Missing Image']\"\n      style=\"padding:0 8px;\"\n      disabled.bind=\"true\">\n      Quick Search\n    </md-select>\n    <a\n      repeat.for=\"ordered of drawer.ordered\"\n      style=\"font-size:12px; line-height:18px; padding:8px 8px\"\n      class=\"mdl-navigation__link ${ ordered == group.generic ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectDrawer(ordered)\">\n      ${ ordered }\n    </a>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--4-col full-height\">\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\">\n        <div repeat.for=\"generic of drug.generics\">\n          <!--\n          [1-9]{0,2} is for Vitamins which do not have 0 or 10 and can be up to two digits\n          -->\n          <md-input\n            required.bind=\" ! $last\"\n            name = \"pro_gen_field\"\n            style=\"width:75%\"\n            pattern=\"([A-Z][0-9]{0,2}[a-z]*\\s?)+\\b\"\n            value.bind=\"generic.name\"\n            input.delegate=\"setGenericRows(generic, $index, $last) & debounce:500\">\n            ${ $first ? 'Generic Names & Strengths' : ''}\n          </md-input>\n          <!--\n          limit units:\n          https://stackoverflow.com/questions/2078915/a-regular-expression-to-exclude-a-word-string\n          ([0-9]+|[0-9]+\\.[0-9]+) Numerator must start with an integer or a decimal with leading digit, e.g, 0.3 not .3\n          (?!ug|gm|meq|hr)[a-z]* Numerator may have units but must substitute the following ug > mcg, gm > g, meq > ~ mg, hr > h\n          (/....)? Denominator is optional\n          ([0-9]+|[0-9]+\\.[0-9]+)? Numerator may start with an integer or a decimal with leading digit.  Unlike numerator, optional because 1 is implied e.g. 1mg/ml or 24mg/h\n          (?!ug|gm|meq|hr)[a-z]*  Numerator may have units but must substitute (see above)\n          -->\n          <md-input\n            style=\"width:23%\"\n            pattern=\"([0-9]+|[0-9]+\\.[0-9]+)(?!ug|gm|meq|hr)[a-z]*(/([0-9]+|[0-9]+\\.[0-9]+)?(?!ug|gm|meq|hr)[a-z]*)?\"\n            value.bind=\"generic.strength\"\n            input.delegate=\"setGenericRows(generic, $index, $last) & debounce:500\">\n          </md-input>\n        </div>\n        <md-input\n          required\n          name = \"pro_form_field\"\n          style=\"width:49%\"\n          pattern=\"([A-Z][a-z]+\\s?)+\\b\"\n          value.bind=\"drug.form\">\n          Form\n        </md-input>\n        <md-input\n          style=\"width:49%\"\n          pattern=\"([A-Z][a-z]*\\s?){1,2}\\b\"\n          value.bind=\"drug.brand\">\n          Brand Name\n        </md-input>\n        <md-input\n          style=\"width:100%\"\n          value.bind=\"drug.gsns\"\n          pattern=\"\\d{1,5}(,\\d{1,5})*\">\n          GSNs\n        </md-input>\n        <md-input\n          required\n          name = \"pro_ndc_field\"\n          style=\"width:49%\"\n          value.bind=\"drug._id\"\n          disabled.bind=\"drug._rev\"\n          pattern=\"\\d{4}-\\d{4}|\\d{5}-\\d{3}|\\d{5}-\\d{4}|\\d{5}-\\d{5}\">\n          Product NDC\n        </md-input>\n        <md-input\n          style=\"width:49%\"\n          value.one-way=\"drug.ndc9 ? drug.ndc9 : ''\"\n          disabled=\"true\">\n          NDC9\n        </md-input>\n        <md-input\n          style=\"width:49%\"\n          value.bind=\"drug.labeler\">\n          Labeler\n        </md-input>\n        <md-input\n          type=\"date\"\n          style=\"width:49%\"\n          value.bind=\"drug.price.invalidAt\">\n          Prices Invalid After\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.goodrx | number\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:32%\">\n          GoodRx Price\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.nadac | number\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:32%\">\n          Nadac Price\n        </md-input>\n        <md-input\n          value.bind=\"drug.price.retail | number\"\n          type=\"number\"\n          step=\".0001\"\n          style=\"width:32%\">\n          Retail Price\n        </md-input>\n        <md-text\n          style=\"width:100%; font-size:11px\"\n          value.bind=\"drug.warning\">\n          Warning\n        </md-text>\n        <md-input\n          pattern=\"//[a-zA-Z0-9/.\\-_%]+\"\n          value.bind=\"drug.image\"\n          style=\"width:100%; font-size:9px\">\n          ${ drug.image ? 'Image' : 'Image URL'}\n        </md-input>\n        <img\n          style=\"width:100%;\"\n          if.bind=\"drug.image\"\n          src.bind=\"drug.image\">\n      </div>\n      <div class=\"mdl-card__actions\">\n        <!-- <md-button color=\"accent\" raised\n          if.bind=\"drug._rev\"\n          style=\"width:100%;\"\n          disabled\n          click.delegate=\"deleteDrug()\">\n          Delete Drug\n        </md-button> -->\n        <md-button color raised\n          form = \"onchange\"\n          name = \"pro_drug_button\"\n          style=\"width:100%;\"\n          disabled.bind=\"_savingDrug\"\n          click.delegate=\"drug._rev ? saveDrug() : addDrug()\"\n          form>\n          ${ _savingDrug ? 'Saving Drug...' : (drug._rev ? 'Save Drug' : 'Add Drug') }\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--8-col full-height\">\n      <md-autocomplete\n        name = \"pro_searchbar\"\n        placeholder=\"Search Drugs by Generic Name or NDC...\"\n        value.bind=\"term\"\n        input.delegate=\"search() & debounce:50\"\n        keydown.delegate=\"scrollGroups($event) & debounce:50\"\n        style=\"margin:0px 24px; padding-right:15px\">\n        <table md-table>\n          <tr\n            name = \"pro_search_res\"\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectGroup(group, true)\"\n            class=\"${ group.generic == $parent.group.generic && 'is-selected'}\">\n            <td\n              style=\"min-width:70%\"\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.name | bold:term\">\n            </td>\n            <td style=\"max-width:30%\">\n              ${ account.ordered[group.generic] ? 'Price:$'+(account.ordered[group.generic].price30 ? account.ordered[group.generic].price30+'/30' : (account.ordered[group.generic].price90 || account.default.price90)+'/90')+' days, Min Qty:'+(account.ordered[group.generic].minQty || account.default.minQty) +', Min Days:'+(ordered[group.generic].minDays ||  account.default.minDays) : ''}\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu name = \"pro_menu\" style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li name = \"menu_add_drug\" if.bind=\"drug._rev\" click.delegate=\"selectDrug()\" class=\"mdl-menu__item\">\n          Add Drug\n        </li>\n        <li name = \"menu_add_drug\" if.bind=\" ! drug._rev\" disabled class=\"mdl-menu__item\">\n          Add Drug\n        </li>\n        <li click.delegate=\"showDefaultsDialog()\" class=\"mdl-menu__item\">\n          Defaults\n        </li>\n        <li click.delegate=\"exportCSV()\" class=\"mdl-menu__item\">\n          Export CSV\n        </li>\n        <li click.delegate=\"$file.click()\" class=\"mdl-menu__item\">\n          Import CSV\n        </li>\n        <li>\n          USP800\n          <md-switch\n          name = \"hazard_switch\"\n          checked.one-way=\"account.hazards[group.generic]\"\n          disabled.bind=\"! account.hazards[group.generic] && ! drug._rev\"\n          click.delegate=\"markHazard()\">\n          </md-switch>\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <md-switch\n        name = \"pro_switch\"\n        style=\"position:absolute; right:25px; top:47px; z-index:2\"\n        checked.one-way=\"account.ordered[group.generic]\"\n        disabled.bind=\"! account.ordered[group.generic] && ! drug._rev\"\n        click.delegate=\"order()\">\n      </md-switch>\n      <div class=\"table-wrap\">\n        <table md-table style=\"width:calc(100% - 216px)\">\n          <thead>\n            <tr>\n              <th class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Form</th>\n              <th class=\"mdl-data-table__cell--non-numeric\">Labeler</th>\n              <th style=\"text-align:left; width:55px; padding-left:0;\">GoodRx</th>\n              <th style=\"text-align:left; width:55px; padding-left:0;\">Nadac</th>\n              <th style=\"text-align:left; width:${ account.ordered[group.generic] ? '40px' : '85px'}; padding-left:0;\">Retail</th>\n            </tr>\n          </thead>\n          <tr repeat.for=\"drug of group.drugs\" click.delegate=\"selectDrug(drug)\" class=\"${ drug._id == $parent.drug._id ? 'is-selected' : ''}\">\n            <td class=\"mdl-data-table__cell--non-numeric\">${ drug._id }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ drug.form }</td>\n            <td style=\"overflow:hidden\" class=\"mdl-data-table__cell--non-numeric\">${ drug.labeler }</td>\n            <td style=\"padding:0; text-align:left\">${ drug.price.goodrx | number:2 }</td>\n            <td style=\"padding:0; text-align:left\">${ drug.price.nadac | number:2 }</td>\n            <td style=\"padding:0; text-align:left\">${ drug.price.retail | number:2 }</td>\n          </tr>\n        </table>\n        <div show.bind=\"account.ordered[group.generic]\" input.delegate=\"saveAccount() & debounce:1000\" style=\"background:white; z-index:1; width:200px; margin:10px 8px;\">\n          <div style=\"width:100%\">Ordered</div>\n          <md-input\n            disabled\n            type=\"number\"\n            style=\"width:49%\"\n            value.bind=\"indateInventory\">\n            Qty > ${ (account.ordered[group.generic] || {}).minDays || account.default.minDays } Days\n          </md-input>\n          <md-input\n            disabled\n            type=\"number\"\n            style=\"width:48%\"\n            value.bind=\"outdateInventory\">\n            < ${ (account.ordered[group.generic] || {}).minDays || account.default.minDays } Days\n          </md-input>\n          <md-input\n            type=\"number\"\n            step=\"1\"\n            placeholder=\"${ (account.ordered[group.generic] || {}).price90 ? '' : account.default.price30}\"\n            value.bind=\"(account.ordered[group.generic] || {}).price30\"\n            style=\"width:49%\">\n            Price 30 Day\n          </md-input>\n          <md-input\n            type=\"number\"\n            step=\"1\"\n            placeholder=\"${ (account.ordered[group.generic] || {}).price30 ? '' : account.default.price90}\"\n            value.bind=\"(account.ordered[group.generic] || {}).price90\"\n            style=\"width:48%\">\n            90 Day\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.generic] || {}).minDays\"\n            placeholder=\"${account.default.minDays}\"\n            style=\"width:49%\">\n            Min Days\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.generic] || {}).minQty\"\n            placeholder=\"${account.default.minQty}\"\n            style=\"width:48%\">\n            Min Qty\n          </md-input>\n          <md-input\n            type=\"number\"\n            value.bind=\"(account.ordered[group.generic] || {}).maxInventory\"\n            placeholder=\"${account.default.maxInventory}\"\n            style=\"width:100%\">\n            Max Qty > ${ (account.ordered[group.generic] || {}).minDays || account.default.minDays } Days\n          </md-input>\n          <md-input\n            type=\"number\"\n            placeholder=\"${account.default.repackQty}\"\n            value.bind=\"(account.ordered[group.generic] || {}).repackQty\"\n            style=\"width:100%\">\n            Repack Qty\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.generic] || {}).displayMessage\"\n            style=\"width:100%; font-size:12px\">\n            Display Message\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.generic] || {}).destroyedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Destroyed Message\n          </md-input>\n          <md-input\n            value.bind=\"(account.ordered[group.generic] || {}).verifiedMessage\"\n            style=\"width:100%; font-size:12px\">\n            Verified Message\n          </md-input>\n        </div>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n    <dialog ref=\"dialog\" class=\"mdl-dialog\" style=\"width:800px; top:3%; height:90%; overflow-y:scroll\">\n    <h4 class=\"mdl-dialog__title\" style=\"margin-top:0px\">Order Defaults</h4>\n    <div class=\"mdl-dialog__content\" input.delegate=\"saveAccount() & debounce:1000\">\n      <md-input\n        type=\"number\"\n        value.bind=\"account.default.maxInventory\"\n        style=\"width:100%\">\n        Default Max Inventory\n      </md-input>\n      <md-input\n        type=\"number\"\n        value.bind=\"account.default.minQty\"\n        style=\"width:100%\">\n        Default Min Qty\n      </md-input>\n      <md-input\n        type=\"number\"\n        value.bind=\"account.default.minDays\"\n        style=\"width:100%\">\n        Default Min Days\n      </md-input>\n      <md-input\n        type=\"number\"\n        value.bind=\"account.default.repackQty\"\n        style=\"width:100%\">\n        Default Repack Qty\n      </md-input>\n      <md-input\n        type=\"number\"\n        step=\"1\"\n        value.bind=\"account.default.price30\"\n        style=\"width:100%\">\n        Default Price 30\n      </md-input>\n      <md-input\n        type=\"number\"\n        step=\"1\"\n        value.bind=\"account.default.price90\"\n        style=\"width:100%\">\n        Default Price 90\n      </md-input>\n    </div>\n    <div class=\"mdl-dialog__actions\">\n      <md-button click.delegate=\"closeDefaultsDialog()\">Close</md-button>\n    </div>\n  </dialog>\n  </section>\n</template>\n"; });
define('text!client/src/views/index.html', ['module'], function(module) { module.exports = "<!doctype html>\n<html style=\"overflow:hidden\">\n  <head>\n    <title>Loading SIRUM...</title>\n    <script src=\"client/assets/material.1.1.3.js\"></script>\n    <link rel=\"stylesheet\" href=\"client/assets/material.icon.css\">\n    <link rel=\"stylesheet\" href=\"client/assets/material.1.1.3.css\" />\n    <link rel=\"icon\" type=\"image/x-icon\" href=\"client/assets/favicon.png\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n    <base href=\"/\">\n    <style>\n    body { background:#eee }\n    a { color:rgb(0,88,123); text-decoration:none }\n\n    input[type=date]::-webkit-inner-spin-button, /* increment \"spinners\" */\n    input[type=date]::-webkit-clear-button { display: none; } /* clear \"x\" button\" */\n\n    /*table-wrap needed because overflow:scroll doesn't work directly on table.  Also it is a conveneint place to do display:flex */\n    .table-wrap { overflow-y:scroll; max-height:100%; display:flex}\n    /*use flex instead of height:100% because latter was causing the parent md-card to have a scroll bar */\n    [md-table]  { width:100%; flex:1; table-layout:fixed; }\n    /* want hover shadow to be 100% of width, so need to do padding within the tr (which needs this hack) rather than in table-wrap */\n    [md-table] th:first-child { padding-left:24px !important}\n    [md-table] td:first-child { padding-left:24px !important}\n    [md-table] td:last-child  { padding-right:24px !important}\n\n    [md-table] tr .show-on-hover { display:none }\n    [md-table] tr:hover .show-on-hover { display:inline-block }\n\n    /*give spacing for the header and the top and bottom gullies */\n    .full-height { height:calc(100vh - 96px); overflow-y:auto}\n\n    .mdl-layout__header { background:white;}\n    .mdl-layout__header, .mdl-layout__drawer, .mdl-layout__header-row .mdl-navigation__link, .mdl-layout__header .mdl-layout__drawer-button { color:rgb(66,66,66);}\n\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link { padding:16px;}\n    .mdl-layout__drawer .mdl-navigation .mdl-navigation__link--current { border-left:solid 3px red; padding-left:13px; background:#e0e0e0; color:inherit }\n\n    .mdl-layout__header-row .mdl-navigation__link { border-top:solid 3px white; }\n    .mdl-layout__header-row .mdl-navigation__link--current { font-weight:600;  border-top-color:red;}\n\n    .mdl-data-table th { height:auto; padding-top:7px; padding-bottom:0; }\n    .mdl-data-table tbody tr { height:auto }\n    .mdl-data-table td { border:none; padding-top:7px; padding-bottom:7px; height:auto }\n\n    .mdl-button--raised { box-shadow:none } /*otherwise disabled.bind has weird animaiton twitching */\n    .mdl-button--fab.mdl-button--colored{ background:rgb(0,88,123);}\n\n    .mdl-card__supporting-text { width:100%; box-sizing: border-box; overflow-y:auto; flex:1 }\n    .mdl-card__actions { padding:16px }\n    /* animate page transitions */\n    .au-enter-active { animation:slideDown .5s; }\n\n    .mdl-snackbar { left:auto; right:6px; bottom:6px; margin-right:0%; font-size:24px; font-weight:300; max-width:100% }\n    .mdl-snackbar--active { transform:translate(0, 0); -webkit-transform:translate(0, 0); }\n    .mdl-snackbar__text { padding:8px 24px; }\n\n    .mdl-checkbox__tick-outline { width:13px } /*widen by 1px to avoid pixel gap for checkboxes on small screens*/\n    .mdl-textfield__input { font-family:inherit } /* so that we can make Bins have a better font for differentiating 0/O and I/l*/\n    @keyframes slideDown {\n      0% {\n        opacity:0;\n        -webkit-transform:translate3d(0, -100%, 0);\n        -ms-transform:translate3d(0, -100%, 0);\n        transform:translate3d(0, -100%, 0)\n      }\n      100% {\n        opacity:.9;\n        -webkit-transform:none;\n        -ms-transform:none;\n        transform:none\n      }\n    }\n\n    /*.au-leave-active {\n      position:absolute;\n      -webkit-animation:slideLeft .5s;\n      animation:slideLeft .5s;\n    }*/\n    </style>\n    <style media=\"print\">\n      .mdl-data-table td { padding-top:4px; padding-bottom:4px; }\n      .hide-when-printed { display:none; }\n\n      /* Start multi-page printing */\n      .table-wrap { overflow-y:visible}\n      .mdl-card { overflow:visible; }\n      .mdl-layout__container { position:static}\n      .full-height { height:100%; overflow-y:visible}\n      /* End multi-page printing */\n\n    </style>\n  </head>\n  <body aurelia-app=\"client/src/views/index\">\n    <div class=\"splash\">\n      <div class=\"message\">Loading SIRUM...</div>\n      <i class=\"fa fa-spinner fa-spin\"></i>\n    </div>\n    <script src=\"pouch/pouchdb-6.1.2.js\"></script>\n    <script src=\"pouch/pouchdb-schema.js\"></script>\n    <script src=\"pouch/pouchdb-model.js\"></script>\n    <script src=\"pouch/pouchdb-client.js\"></script>\n    <script src=\"csv/papa.min.js\"></script>\n    <script src=\"csv/index.js\"></script>\n    <script src=\"client/assets/aurelia.js\" data-main=\"aurelia-bootstrapper\"></script>\n  </body>\n</html>\n"; });
define('text!client/src/views/inventory.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from='client/src/elems/md-table'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-autocomplete\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <style>\n    .mdl-button:hover { background-color:initial }\n    .mdl-badge[data-badge]:after { font-size:9px; height:14px; width:14px; top:1px}\n    .mdl-layout__drawer { width:280px; transform:translateX(-290px); overflow-x:hidden; }\n  </style>\n  <md-drawer>\n    <md-input\n      autoselect\n      value.bind=\"pendedFilter\"\n      style=\"padding:0 8px; width:auto\">\n      Filter pended inventory\n    </md-input>\n    <div repeat.for=\"pend of pended | pendedFilter:pendedFilter\">\n\n      <div style=\"display:inline-block; width:100%\">\n        <div\n          click.delegate=\"clickOnGroupInDrawer($event,pend.key)\"\n          class=\"mdl-typography--title ${ term == 'Pended '+pend.key ? 'mdl-navigation__link--current' : ''}\"\n          style=\"font-size:14px; float:left;font-weight:600; cursor:pointer; color:#757575; padding:8px;\">\n          ${pend.key}\n        </div>\n        <md-switch\n          name = \"groupPrioritySwitch\"\n          style=\"float:right; margin-right:12px\"\n          checked.one-way=\"shoppingSyncPended[pend.key].priority\"\n          disabled.bind = \"shoppingSyncPended[pend.key].locked\"\n          click.trigger=\"clickOnGroupInDrawer($event,pend.key)\">\n        </md-switch>\n      </div>\n\n      <div style=\"display:inline-block; width:100%\"\n        repeat.for=\"pendedDrug of pend.val | toArray\">\n        <div\n          name=\"pro_pended_items\"\n          class=\"mdl-navigation__link ${ term == 'Pended '+pend.key+': '+pendedDrug.val.label ? 'mdl-navigation__link--current' : ''}\"\n          click.delegate=\"clickOnTransactionInDrawer(false,$event,pend.key,pendedDrug.val.label)\"\n          style=\"font-size:12px; display:inline-block; width:100%; cursor:pointer; padding:1px 0 1px 8px; line-height:18px\">\n          <md-checkbox\n            if.bind = \"shoppingSyncPended[pend.key][pendedDrug.val.label].basketInfo.notFound\"\n            name = \"transactionDrawerCheckbox\"\n            style=\"display:inline-block\"\n            disabled.bind = \"shoppingSyncPended[pend.key][pendedDrug.val.label].locked\"\n            click.trigger = \"clickOnTransactionInDrawer(true,$event,pend.key,pendedDrug.val.label)\"\n            checked.bind = \"shoppingSyncPended[pend.key][pendedDrug.val.label].drawerCheck\" >\n          </md-checkbox>\n          <div\n          style=\"display:inline-block; padding-right:10px\" if.bind = \"shoppingSyncPended[pend.key][pendedDrug.val.label].basketInfo.found\"><b>${shoppingSyncPended[pend.key][pendedDrug.val.label].basketInfo.allBaskets}</b></div>\n          ${ ('0'+pendedDrug.val.transactions.length).slice(-2) } ${ pendedDrug.val.label }\n        </div>\n      </div>\n\n\n    </div>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height hide-when-printed\"> <!-- ${ !repack || 'background:rgba(0,88,123,.3)' } -->\n      <div show.bind=\"transactions.length\" class=\"mdl-card__supporting-text\" style=\"padding-left:24px; white-space:nowrap\">\n        <div>\n          <div class=\"mdl-card__title\" style=\"padding:4px 0 8px 0\">\n            <div style=\"width:60%\"></div>\n            <div style=\"width:20%\">Qty</div>\n            <div style=\"width:20%\">Count</div>\n          </div>\n          <md-checkbox name = \"pro_checkall\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"toggleVisibleChecks()\" checked.bind=\"filter.checked.visible\">Selected</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${filter.checked.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${filter.checked.count}</div>\n        </div>\n        <div name = \"pro_ndc_filter\" repeat.for=\"ndc of filter.ndc | toArray:true\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Ndc Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(ndc)\" checked.bind=\"ndc.val.isChecked\">${ndc.key}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${ndc.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${ndc.val.count}</div>\n        </div>\n        <div name = \"pro_exp_filter\" repeat.for=\"exp of filter.exp | toArray:true\" style=\"padding:0\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Exp Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(exp)\" checked.bind=\"exp.val.isChecked\">${exp.key}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${exp.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${exp.val.count}</div>\n        </div>\n        <div name = \"pro_repack_filter\" repeat.for=\"repack of filter.repack | toArray:true\" style=\"padding:0\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Repack Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(repack)\" checked.bind=\"repack.val.isChecked\">${repack.key}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${repack.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${repack.val.count}</div>\n        </div>\n        <div name = \"pro_form_filter\" repeat.for=\"form of filter.form | toArray:true\" style=\"padding:0\">\n          <div if.bind=\"$index == 0\" class=\"mdl-card__title\" style=\"padding:16px 0 4px 0\">\n            <div style=\"width:60%\">Form Filter</div>\n          </div>\n          <md-checkbox name = \"pro_checkbox\" style=\"width:60%; margin-bottom:3px\" click.delegate=\"refreshFilter(form)\" checked.bind=\"form.val.isChecked\">${form.key}</md-checkbox>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${form.val.qty}</div>\n          <div style=\"width:18%; display:inline-block; vertical-align:top\">${form.val.count}</div>\n        </div>\n      </div>\n      <div class=\"mdl-card__actions\" style=\"text-align:center\">\n        <md-button show.bind=\"showMore\" click.delegate=\"selectInventory(type, term)\">Show All Results</md-button>\n      </div>\n    </div>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <md-autocomplete\n        name = \"pro_searchbar\"\n        placeholder.bind=\"placeholder\"\n        class.bind=\"termColor\"\n        value.bind=\"term\"\n        input.delegate=\"search() & debounce\"\n        keyup.delegate=\"scrollGroups($event) & debounce:50\"\n        style=\"margin:0px 24px; padding-right:15px\">\n        <table md-table>\n          <tr\n            name = \"pro_search_res\"\n            repeat.for=\"group of groups\"\n            click.delegate=\"selectTerm('generic', group.generic)\"\n            class=\"${ group.generic == term && 'is-selected'}\">\n            <td\n              style=\"min-width:70%\"\n              class=\"mdl-data-table__cell--non-numeric\"\n              innerHTML.bind=\"group.name | bold:term\">\n            </td>\n            <td style=\"max-width:30%\">\n              ${ account.ordered[group.generic] ? 'Price:$'+(account.ordered[group.generic].price30 ? account.ordered[group.generic].price30+'/30' : account.ordered[group.generic].price90+'/90')+' days, Min Qty:'+(account.ordered[group.generic].minQty || account.default.minQty) +', Min Days:'+(ordered[group.generic].minDays ||  account.default.minDays) : ''}\n            </td>\n          </tr>\n        </table>\n      </md-autocomplete>\n\n      <md-menu ref=\"menu\" name=\"pro_menu\" mousedown.delegate=\"openMenu($event, menu)\" style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <li\n          class=\"mdl-menu__item--full-bleed-divider\"\n          style =\"width:150px\"\n          name = \"pro_export\"\n          click.delegate=\"exportCSV()\">\n          Export Inventory\n        </li>\n        <li\n          style =\"width:150px\"\n          name = \"pro_dispense\"\n          disabled.bind=\" ! filter.checked.count\"\n          click.delegate=\"dispenseInventory()\">\n          Dispense Selected\n        </li>\n        <li\n          class=\"mdl-menu__item--full-bleed-divider\"\n          disabled.bind=\" ! filter.checked.count\"\n          click.delegate=\"disposeInventory()\">\n          Dispose Selected\n        </li>\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          name=\"pro_pend\"\n          show.bind=\"term.slice(0,6) == 'Pended'\"\n          disabled.bind=\" ! filter.checked.count\"\n          click.delegate=\"unpendInventory()\">\n          Unpend Selected\n        </li>\n        <li\n          repeat.for=\"match of matches\"\n          name=\"pro_pend\"\n          class=\"mdl-menu__item\"\n          click.delegate=\"pendInventory(match.pendId, match.pendQty)\">\n          Pend to ${match.pendId}\n        </li>\n        <li\n          name=\"pro_pend\"\n          disabled.bind=\" ! filter.checked.count\"\n          click.delegate=\"pendInventory(pendToId, pendToQty)\"\n          class=\"mdl-menu__item--full-bleed-divider\">\n          Pend\n          <md-input\n            value.bind=\"pendToId\"\n            placeholder=\"Name\"\n            disabled.bind=\" ! filter.checked.count\"\n            style=\"width:40px; font-size:14px\">\n          </md-input>\n          <md-input\n            type=\"number\"\n            min.bind=\"1\"\n            value.bind=\"pendToQty\"\n            placeholder=\"Qty\"\n            disabled.bind=\" ! filter.checked.count\"\n            style=\"width:40px; font-size:14px\">\n          </md-input>\n        </li>\n        <li\n          name=\"pro_pick\"\n          disabled.bind=\" ! filter.checked.count\"\n          click.delegate=\"pickInventory(basketNumber)\"\n          class=\"mdl-menu__item--full-bleed-divider\">\n          Pick\n          <md-input\n            pattern=\"[s|S|r|R|b|B|g|G][0-9]{2,3}\"\n            value.bind=\"basketNumber\"\n            placeholder=\"Basket\"\n            disabled.bind=\" ! filter.checked.count\"\n            style=\"width:60px; font-size:14px\">\n          </md-input>\n        </li>\n        <li\n          name=\"pro_print_selected\"\n          disabled.bind=\" ! filter.checked.count\"\n          click.delegate=\"printLabels()\">\n          Print Selected\n        </li>\n        <form>\n          <li form\n            name=\"pro_repack_selected\"\n            disabled.bind=\" ! repacks.drug || ! filter.checked.count\"\n            click.delegate=\"repackInventory()\">\n            Repack Selected\n          </li>\n          <li repeat.for=\"repack of repacks\" style=\"padding:0 16px\">\n            <md-input\n              required.bind=\" ! $last\"\n              type=\"number\"\n              name = \"pro_repack_qty\"\n              value.bind=\"repack.qty | number\"\n              min.bind=\"1\"\n              max.bind=\"repack.qty + repacks.excessQty\"\n              input.delegate=\"setRepackRows(repack, $last, $index) & debounce:500\"\n              disabled.bind=\" ! filter.checked.count\"\n              style=\"width:40px;\">\n              Qty\n            </md-input>\n            <md-input\n              required.bind=\"repack.qty\"\n              name = \"pro_repack_exp\"\n              value.bind=\"repack.exp | date\"\n              pattern=\"(0?[1-9]|1[012])/(1\\d|2\\d)\"\n              disabled.bind=\" ! filter.checked.count\"\n              style=\"width:40px;\">\n              Exp\n            </md-input>\n            <md-input\n              required.bind=\"repack.qty\"\n              name = \"pro_repack_bin\"\n              value.bind=\"repack.bin\"\n              pattern=\"[A-Za-z]\\d{2}\"\n              disabled.bind=\" ! filter.checked.count\"\n              style=\"width:40px;\">\n              Bin\n            </md-input>\n          </li>\n        </form>\n        </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div class=\"table-wrap\">\n        <div show.bind=\"noResults\" style=\"margin:24px\">No Results</div>\n        <table show.bind=\" ! noResults && transactions.length\" md-table>\n          <thead>\n            <tr>\n              <th style=\"width:50px; padding:0\"></th>\n              <th class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0\">Drug</th>\n              <th style=\"width:80px\" class=\"mdl-data-table__cell--non-numeric\">Form</th>\n              <th style=\"width:100px\" class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n              <th style=\"text-align:left; width:60px;\">Exp</th>\n              <th style=\"text-align:left; width:60px;\">Qty</th>\n              <th style=\"text-align:left; width:60px;\">Bin</th>\n              <th style=\"width:48px\"></th>\n            </tr>\n          </thead>\n          <tr class=\"${transaction.highlighted} test\" name=\"pro_transaction\" repeat.for=\"transaction of transactions | inventoryFilter:filter:term\" input.delegate=\"saveAndReconcileTransaction(transaction) & debounce:1000\">\n            <td style=\"padding:0\">\n              <md-checkbox name = \"pro_transaction_checkbox\" click.delegate=\"toggleCheck(transaction)\" checked.bind=\"transaction.isChecked\"></md-checkbox>\n            </td>\n            <td class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0; overflow:hidden\">${ transaction.drug.generic  & oneTime }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug.form  & oneTime }</td>\n            <td class=\"mdl-data-table__cell--non-numeric\">${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') & oneTime }</td>\n            <td style=\"padding:0\">\n              <md-input\n                name = \"pro_transaction_exp\"\n                id.bind=\"'exp_'+$index\"\n                required\n                keydown.delegate=\"expShortcuts($event, $index)\"\n                pattern=\"(0?[1-9]|1[012])/(1\\d|2\\d)\"\n                value.bind=\"transaction.exp.to | date\"\n                style=\"width:40px; margin-bottom:-8px\"\n                placeholder>\n              </md-input>\n            </td>\n            <td style=\"padding:0\">\n              <md-input\n                name = \"pro_transaction_qty\"\n                id.bind=\"'qty_'+$index\"\n                required\n                keydown.delegate=\"qtyShortcutsKeydown($event, $index)\"\n                input.trigger=\"qtyShortcutsInput($event, $index) & debounce:300\"\n                disabled.bind=\"transaction.next[0] && ! transaction.next[0].pended\"\n                type=\"number\"\n                value.bind=\"transaction.qty.to | number\"\n                style=\"width:40px; margin-bottom:-8px\"\n                max.bind=\"3000\"\n                placeholder>\n              </md-input>\n            </td>\n            <!-- <td style=\"padding:0\">\n              <md-input\n                value.bind=\"transaction.rx.from\"\n                style=\"width:40px; margin-bottom:-8px\"\n                placeholder>\n              </md-input>\n            </td> -->\n            <td style=\"padding:0\">\n              <md-input\n                name = \"pro_transaction_bin\"\n                id.bind=\"'bin_'+$index\"\n                required\n                keydown.delegate=\"binShortcuts($event, $index)\"\n                pattern=\"[A-Za-z]\\d{2}|[A-Z][1-6][0-6]\\d{2}|[A-Za-z][0-6]\\d{2}\"\n                value.bind=\"transaction.bin\"\n                style=\"width:40px; margin-bottom:-8px; font-family:PT Mono; font-size:12.5px\"\n                maxlength.bind=\"5\"\n                placeholder>\n              </md-input>\n            </td>\n            <td name=\"pro_repack_icon\" style=\"padding:0 0 0 16px\">\n              <i name=\"pro_icon\" click.delegate=\"showHistoryDialog(transaction._id)\" show.bind=\"isRepack(transaction)\" class=\"material-icons\" style=\"font-size:20px; cursor:pointer\">delete_sweep</i>\n              <i name=\"pro_icon\" click.delegate=\"showHistoryDialog(transaction._id)\" show.bind=\"! isRepack(transaction)\" class=\"material-icons show-on-hover\" style=\"font-size:20px; margin-left:-2px; margin-right:2px; cursor:pointer\">history</i>\n            </td>\n          </tr>\n        </table>\n      </div>\n    </div>\n    <md-snackbar ref=\"snackbar\"></md-snackbar>\n    <dialog ref=\"dialog\" class=\"mdl-dialog\" style=\"width:800px; top:3%; height:90%; overflow-y:scroll\">\n    <h4 class=\"mdl-dialog__title\" style=\"padding: 3px 0\">History</h4>\n    <div class=\"mdl-dialog__content\" innerhtml.bind=\"history\" style=\"white-space:pre-wrap; font-family:monospace; padding:16px 2px\"></div>\n    <div class=\"mdl-dialog__actions\">\n      <md-button click.delegate=\"closeHistoryDialog()\">Close</md-button>\n    </div>\n  </dialog>\n  </section>\n</template>\n"; });
define('text!client/src/views/join.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-loading\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <style>md-input { height:65px }</style>\n  <section class=\"mdl-grid\" style=\"height:80vh;\">\n    <form class=\"mdl-cell mdl-cell--11-col mdl-cell--middle mdl-grid\" style=\"margin:0 auto; max-width:930px\">\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col\" style=\"padding:16px\">\n        <div class=\"mdl-card__title\" style=\"padding-left:0\">\n          <div class=\"mdl-card__title-text\">\n            Register Your Facility\n          </div>\n        </div>\n        <md-input value.bind=\"account.name\" name = \"pro_facility\" required>Facility</md-input>\n        <md-input value.bind=\"account.license\" name = \"pro_license\" required>License</md-input>\n        <md-input value.bind=\"account.phone\" type=\"tel\" name = \"pro_facility_phone\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Facility Phone</md-input>\n        <md-input value.bind=\"account.street\" name = \"pro_street\" required>Street</md-input>\n        <div class=\"mdl-grid\" style=\"padding:0; margin:0 -8px\">\n          <md-input value.bind=\"account.city\" name = \"pro_city\" class=\"mdl-cell mdl-cell--7-col\" required>City</md-input>\n          <md-input value.bind=\"account.state\" name = \"pro_state\" pattern=\"^[A-Z]{2}$\" class=\"mdl-cell mdl-cell--2-col\" required>State</md-input>\n          <md-input value.bind=\"account.zip\" name = \"pro_zip\" pattern=\"^\\d{5}$\" class=\"mdl-cell mdl-cell--3-col\" required>Zip</md-input>\n        </div>\n      </div>\n      <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col\" style=\"padding:16px\">\n        <div class=\"mdl-grid\" style=\"padding:0; margin:-8px\">\n          <md-input value.bind=\"user.name.first\" name = \"pro_first_name\" class=\"mdl-cell mdl-cell--6-col\" required>First Name</md-input>\n          <md-input value.bind=\"user.name.last\" name = \"pro_last_name\" class=\"mdl-cell mdl-cell--6-col\" required>Last Name</md-input>\n        </div>\n        <md-input value.bind=\"user.email\" type=\"email\" name = \"pro_email\" pattern=\"[\\w._-]{2,}@[\\w._-]{3,}\\.(com|org|net|gov|edu)\" required>Email</md-input>\n        <md-input value.bind=\"user.phone\" type=\"tel\" name = \"pro_personal_phone\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Personal Phone</md-input>\n        <md-input value.bind=\"user.password\" name = \"pro_password\" required>Password</md-input>\n        <md-checkbox checked.bind=\"accept\" name = \"pro_checkbox\" style=\"margin:20px 0 28px\" required>I accept the terms of use</md-checkbox>\n        <md-button raised color form disabled.bind=\"disabled\" name = \"pro_install\" click.delegate=\"join()\">Install</md-button>\n        <md-loading value.bind=\"progress.docs_read/progress.doc_count * 100\"></md-loading>\n        <span class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px; margin-bottom:-8px\">${ progress.percent } ${ loading }</span>\n      </div>\n    </form>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!client/src/views/login.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/md-loading\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <section class=\"mdl-grid\" style=\"margin-top:30vh;\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--6-col mdl-cell--middle\" style=\"width:100%; margin:-75px auto 0; padding:48px 96px 28px 96px; max-width:450px\">\n      <md-input name = \"pro_phone\" value.bind=\"phone\" type=\"tel\" pattern=\"^\\d{3}[.-]?\\d{3}[.-]?\\d{4}$\" required>Phone</md-input>\n      <md-input name = \"pro_password\" value.bind=\"password\" type=\"password\" required minlength=\"4\">Password</md-input>\n      <md-button\n        name = \"pro_button\"\n        raised color form\n        click.delegate=\"login()\"\n        disabled.bind=\"disabled\"\n        style=\"padding-top:16px\">\n        Login\n      </md-button>\n      <md-loading value.bind=\"progress.docs_read/progress.doc_count * 100\"></md-loading>\n      <p class=\"mdl-color-text--grey-600\" style=\"margin-top:10px; height:20px; font-size:9px\">${ progress.percent } ${ loading }</p>\n    </form>\n  </section>\n  <md-snackbar ref=\"snackbar\"></md-snackbar>\n</template>\n"; });
define('text!client/src/views/picking.html', ['module'], function(module) { module.exports = "<template>\n    <require from='client/src/elems/md-shadow'></require>\n    <require from='client/src/elems/md-drawer'></require>\n    <require from='client/src/elems/md-table'></require>\n    <require from=\"client/src/elems/md-input\"></require>\n    <require from=\"client/src/elems/md-select\"></require>\n    <require from=\"client/src/elems/md-button\"></require>\n    <require from=\"client/src/elems/md-switch\"></require>\n    <require from=\"client/src/elems/md-snackbar\"></require>\n    <require from=\"client/src/elems/md-checkbox\"></require>\n    <require from=\"client/src/elems/md-autocomplete\"></require>\n    <require from=\"client/src/elems/md-menu\"></require>\n    <require from=\"client/src/elems/form\"></require>\n\n    <style>\n        .mdl-button:hover {\n            background-color: initial,\n            overflow-y: hidden\n        }\n\n        .mdl-badge[data-badge]:after {\n            font-size: 9px;\n            height: 14px;\n            width: 14px;\n            top: 1px\n        }\n    </style>\n\n\n    <section class=\"mdl-grid au-animate\">\n        <!-- List Page -->\n        <div if.bind=\"!orderSelectedToShop\">\n\n            <div>\n                Picked Today: ${pickedCount ? pickedCount : 0}\n            </div>\n\n            <md-input\n                    autoselect\n                    value.bind=\"pendedFilter\"\n                    style=\"padding-bottom:15; font-size:18px; width:90vw;\">\n                Select Group\n            </md-input>\n\n            <div style=\"height:90vh; width:90vw;  overflow-y:auto; padding-right:1rem;\">\n                <div repeat.for=\"pend of groups | pendedFilter:pendedFilter\"\n                        click.delegate=\"selectGroup(pend.name, pend.locked, pend.isLockedByCurrentUser)\"\n                        class=\"mdl-typography--title ${ term == 'Pended '+pend.name ? 'mdl-navigation__link--current' : ''}\"\n                        style=\"display:flex; font-size:30px; overflow-x:scroll; max-width:90vw; width:100%; font-weight:600; cursor:pointer; color: ${(pend.locked && !pend.isLockedByCurrentUser) ? '#919191' : (pend.priority ? '#14c44c' : 'black')}; padding-bottom: 50px;\">\n\n\n                    <div style=\"flex:1 0 60%;\">\n                        <div>${pend.name}</div>\n                        <div if.bind=\"pend.baskets.length > 0\" style=\"font-size:15px;font-weight:200\">\n                            (${pend.baskets.join(\",\")})\n                        </div>\n                    </div>\n                    <div style=\"flex:0 1 40%; display:flex; flex-direction:column; align-items:flex-end;\">\n                        <md-button if.bind=\"pend.locked\" style=\"display:inline-block; height:15px; line-height:10px\"\n                                   color=\"accent\"\n                                   raised click.delegate=\"unlockGroup(pend.name)\">${pend.locked == 'unlocking' ?\n                            '...unlocking...' : 'unlock'}\n                        </md-button>\n                        <div if.bind=\"pend.locked\"\n                             style=\"padding-top:.25rem; line-height:1.4; letter-spacing:0; color:#555; text-align:right; font-size:1rem; font-weight:400;\">\n                            ${pend.lock.name.first + ' ' + pend.lock.name.last}<br>\n                            ${pend.lock.date + ' ' + pend.lock.time}\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n        <!-- End List Page -->\n\n\n        <div if.bind=\"orderSelectedToShop\">\n\n            <div if.bind=\"!groupLoaded\" style=\"margin-top:40vh; margin-left:35vw; font-size:5vh\">\n                Loading...\n            </div>\n            <!-- End Loading Indicator -->\n\n            <!-- Choose Basket Page -->\n            <div if.bind=\"groupLoaded && !basketSaved\" style=\"width:100vw; height:100vh;\">\n\n\n                <div style=\"font-size:2.7vh; position:absolute; top:5px; left:20%; width:50%; line-height:5vh; text-align:center; overflow-x:hidden;\">\n                    ${shopList[shoppingIndex].raw.next[0].pended.group}\n                </div>\n\n                <div style=\"position:absolute; top:7vh; width:100%; font-size:4vh; display:inline-block\">\n                    <div style=\"line-height:5vh\">${shopList[shoppingIndex].raw.drug.generic}</div>\n                    <div style=\"font-size:3vh; line-height:4vh;\"\n                         if.bind=\"shopList[shoppingIndex].raw.drug.brand.length > 0\">\n                        ${shopList[shoppingIndex].raw.drug.brand}\n                    </div>\n                </div>\n\n                <div style=\"position:absolute; top:24vh; width:100%\">\n                    <form name=\"basket_adding_form\">\n\n                        <div style=\"font-size:30px; line-height:10vh\">Enter new basket number:</div>\n                        <div stlye=\"float:left; display:inline-block\">\n                            <div style=\"float:left\">\n                                <md-select\n                                        name=\"pro_basket_letter\"\n                                        style=\"font-size: 20px; width:10vw; vertical-align:bottom; padding-top:23px\"\n                                        value.bind=\"shopList[shoppingIndex].extra.basketLetter\"\n                                        options.bind=\"basketOptions\"\n                                </md-select>\n                            </div>\n\n                            <!-- Input field -->\n                            <md-input autofocus maxlength.bind=\"4\"\n                                      pattern=\"${shopList[shoppingIndex].extra.basketLetter == 'G' ? '[0-9]{2}': '[4-9][0-9]{2,3}'}\"\n                                      required type=\"tel\" style=\" font-size:20px; width:50vw;\"\n                                      value.bind=\"shopList[shoppingIndex].extra.basketNumber\">Basket Number\n                            </md-input>\n\n                            <!-- Save Button -->\n                            <div style=\"float:right; padding-right:7vw; margin-top:2vh\">\n                                <md-button color form=\"basket_adding_form\" raised click.delegate=\"saveBasketNumber()\">\n                                    Save\n                                </md-button>\n                            </div>\n\n                        </div>\n\n                    </form>\n                </div>\n\n                <md-button style=\"float:left; height:2vh; top:70vh; position:absolute; line-height:2vh;\" color\n                           click.delegate=\"pauseShopping(shopList[shoppingIndex].raw.next[0].pended.group)\">Pause\n                </md-button>\n\n            </div>\n            <!-- End Basket Page -->\n\n            <!-- Picking Instructions Page(s) -->\n            <div style=\"width:100%; position:relative; overflow-y:hidden\" if.bind=\"groupLoaded && basketSaved\">\n\n                <!-- Top Menu -->\n                <div style=\"width:100%;display:inline-block;padding-bottom:0.5vh\">\n\n                    <div style=\"float:left\">\n                        <md-button style=\"float:left\" color raised show.bind=\"shoppingIndex>0\"\n                                   click.delegate=\"moveShoppingBackward()\">Back\n                        </md-button>\n                    </div>\n\n                    <div style=\"font-size:2.7vh; position:absolute; top:5px; left:20%; width:50%; line-height:5vh; text-align:center; overflow-x:hidden;\">\n                        ${shopList[shoppingIndex].raw.next[0].pended.group}\n                    </div>\n\n                    <div style=\"float:right\">\n                        <md-button style=\"float:right\" disabled.bind=\"!formComplete\" color raised\n                                   click.delegate=\"moveShoppingForward()\">${nextButtonText}\n                        </md-button>\n                    </div>\n                </div>\n                <!-- End Top Menu -->\n\n\n                <!-- Drug Name -->\n                <div style=\"width:100%; max-height:11vh; overflow-x:hidden\">\n                    <div style=\"font-size:4.5vh; line-height:5vh;\">${shopList[shoppingIndex].raw.drug.generic}</div>\n                    <div style=\"font-size:3vh; line-height:4vh;\"\n                         if.bind=\"shopList[shoppingIndex].raw.drug.brand.length > 0\">\n                        ${shopList[shoppingIndex].raw.drug.brand}\n                    </div>\n                </div>\n                <!-- End Drug Name -->\n\n\n                <!-- Shopping Instructions -->\n                <div style=\"width:100%;display:inline-block; text-align:center;\">\n\n                    <div style=\"float:left; text-align:left; width:47vw; height:100%;vertical-align:middle\">\n                        <div style=\"font: 400 60px system-ui serif; line-height:60px; padding-bottom:15px; margin-top:20px;\">\n                            <b>${shopList[shoppingIndex].raw.bin.length == 3 ? shopList[shoppingIndex].raw.bin :\n                                (shopList[shoppingIndex].raw.bin.slice(0,3) + '-' +\n                                shopList[shoppingIndex].raw.bin.slice(3,4))}</b></div>\n                        <div style=\"font-size:30px;padding-bottom:3vh\"><b>Qty:</b> ${shopList[shoppingIndex].raw.qty.to}\n                        </div>\n                        <div style=\"font-size:20px; padding-bottom:2vh\"><b>Exp:</b>\n                            ${formatExp(shopList[shoppingIndex].raw.exp.to)}\n                        </div>\n                    </div>\n                    <div style=\"float:right; height:30vh; width:43vw; position:relative\">\n                        <img\n                                style=\"max-height:100%;max-width:100%;height:auto;width:auto;position:absolute;top:0;bottom:0;left:0;right:0;margin:auto\"\n                                if.bind=\"shopList[shoppingIndex].extra.image\"\n                                src.bind=\"shopList[shoppingIndex].extra.image\"/>\n                    </div>\n                </div>\n                <!-- End Shopping Instructions -->\n\n                <div style=\"width:100%; display:inline-block; padding-bottom:0vh\">\n                    <!-- Progress Details -->\n                    <div style=\"width:45%; float:left; margin-top:3vh;\">\n                        <div if.bind=\"(shoppingIndex < shopList.length - 1) && (shopList[shoppingIndex].raw.drug.generic == shopList[shoppingIndex+1].raw.drug.generic)\"\n                             style=\"font-size:3vh; line-height:3vh; padding-bottom:.5vh\">\n                            <b>Next Bin: </b>\n                            <span style=\"color:${shopList[shoppingIndex].raw.bin == shopList[shoppingIndex+1].raw.bin ? 'red' : ((shopList[shoppingIndex].raw.bin.length == 4) && (shopList[shoppingIndex].raw.bin.slice(0,-1) == shopList[shoppingIndex+1].raw.bin.slice(0,-1)) ? 'orange' : '')}\">\n                  ${shopList[shoppingIndex+1].raw.bin.length == 3 ? shopList[shoppingIndex+1].raw.bin : (shopList[shoppingIndex+1].raw.bin.slice(0,3) + '-' + shopList[shoppingIndex+1].raw.bin.slice(3,4))}\n                </span>\n                        </div>\n                        <div style=\"font-size:3vh; line-height:3vh; padding-bottom:1vh;\"><b>NDC:</b>\n                            ${shopList[shoppingIndex].raw.drug._id}\n                        </div>\n                        <div>\n                            <div class=\"mdl-button mdl-js-button mdl-js-ripple-effect\"\n                                 click.delegate=\"addBasket(shoppingIndex)\"\n                                 style=\"font-size:3vh; color:#00587B; padding-left:0; margin-top:.25vh; padding-bottom:1vh; padding-right:0px; padding-top:0px;height:3vh; line-height:3vh;\">\n                                Basket:\n                            </div>\n                            <span style=\"font-size:2.5vh; \">${(shopList[shoppingIndex].extra.fullBasket + currentGenericBaskets.replace(\",\" + shopList[shoppingIndex].extra.fullBasket,\"\"))}</span>\n                        </div>\n                        <div style=\"font-size:2vh; line-height:2vh; padding-top:2vh; padding-bottom:0.5vh\">Item <b>${shopList[shoppingIndex].extra.genericIndex.relative_index[0]}</b>\n                            of <b>${shopList[shoppingIndex].extra.genericIndex.relative_index[1]}</b></div>\n                        <div style=\"font-size:2vh; line-height:2vh; padding-bottom:0,5vh\">Total\n                            <b>${shoppingIndex+1}</b> of <b>${shopList.length}</b></div>\n                        <div style=\"font-size:2vh; line-height:2vh; padding-bottom:3vh\">Drug <b>${shopList[shoppingIndex].extra.genericIndex.global_index[0]}</b>\n                            of <b>${shopList[shoppingIndex].extra.genericIndex.global_index[1]}</b></div>\n                        <div style=\"display:inline-block;\">\n                            <md-button style=\"float:left; height:2vh; line-height:2vh;\" color\n                                       click.delegate=\"pauseShopping(shopList[shoppingIndex].raw.next[0].pended.group)\">\n                                Pause\n                            </md-button>\n                        </div>\n                    </div>\n                    <!-- End Progress Details -->\n\n                    <!-- Step Outcome Choices  -->\n                    <div style=\"width:50%; float:right; margin-top:2vh\">\n                        <div style=\"width:40vw; text-align:center; font-size:3vh; line-height:5vh; height:5vh; padding-top:0.75vh; padding-bottom:0.75vh; color: ${shopList[shoppingIndex].extra.outcome.exact_match ? 'white':''}; background-color: ${shopList[shoppingIndex].extra.outcome.exact_match ? '#00587b':''}\"\n                             class=\"mdl-button mdl-js-button mdl-js-ripple-effect\"\n                             click.delegate=\"selectShoppingOption('exact_match')\"\n                             checked.bind=\"shopList[shoppingIndex].extra.outcome.exact_match\">Exact Match\n                        </div>\n                        <div style=\"width:40vw;  text-align:center; font-size:3vh; line-height:5vh; height:5vh; padding-top:0.75vh; padding-bottom:0.75vh;  color: ${shopList[shoppingIndex].extra.outcome.roughly_equal ? 'white':''}; background-color: ${shopList[shoppingIndex].extra.outcome.roughly_equal ? '#00587b':''}\"\n                             class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n                             click.delegate=\"selectShoppingOption('roughly_equal')\"\n                             checked.bind=\"shopList[shoppingIndex].extra.outcome.roughly_equal\">+/- 3 Qty\n                        </div>\n                        <div style=\"width:40vw;  text-align:center; font-size:3vh; line-height:5vh; height:5vh; padding-top:0.75vh; padding-bottom:0.75vh;  color: ${shopList[shoppingIndex].extra.outcome.slot_before ? 'white':''}; background-color: ${shopList[shoppingIndex].extra.outcome.slot_before ? '#00587b':''}\"\n                             class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n                             click.delegate=\"selectShoppingOption('slot_before')\"\n                             checked.bind=\"shopList[shoppingIndex].extra.outcome.slot_before\">Slot Before\n                        </div>\n                        <div style=\"width:40vw;  text-align:center; font-size:3vh; line-height:5vh; height:5vh; padding-top:0.75vh; padding-bottom:0.75vh;  color: ${shopList[shoppingIndex].extra.outcome.slot_after ? 'white':''}; background-color: ${shopList[shoppingIndex].extra.outcome.slot_after ? '#00587b':''}\"\n                             class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n                             click.delegate=\"selectShoppingOption('slot_after')\"\n                             checked.bind=\"shopList[shoppingIndex].extra.outcome.slot_after\">Slot After\n                        </div>\n                        <div style=\"width:40vw;  text-align:center; font-size:3vh; line-height:5vh; height:5vh;padding-top:0.75vh; padding-bottom:0.75vh;  color: ${shopList[shoppingIndex].extra.outcome.missing ? 'white':''}; background-color: ${shopList[shoppingIndex].extra.outcome.missing ? '#00587b':''}\"\n                             class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n                             click.delegate=\"selectShoppingOption('missing')\"\n                             checked.bind=\"shopList[shoppingIndex].extra.outcome.missing\">Missing\n                        </div>\n                    </div>\n                    <!-- End Step Outcome Choices -->\n\n                </div>\n\n                <div style=\"margin:auto; font-size:7px\">\n                    ${shopList[shoppingIndex].raw._id}\n                </div>\n\n                <div>\n                    <md-snackbar ref=\"snackbar\"></md-snackbar>\n                </div>\n\n            </div>\n            <!-- End Picking Instructions Page(s)-->\n\n        </div>\n\n    </section>\n</template>\n"; });
define('text!client/src/views/routes.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"mdl-layout mdl-js-layout mdl-layout--fixed-header\">\n    <header class=\"mdl-layout__header hide-when-printed\">\n      <div class=\"mdl-layout__header-row\">\n        <svg style=\"height:70%; margin-left:-60px\" id=\"Layer_1\" width=\"200\" version=\"1.1\" xmlns:x=\"&amp;ns_extend;\" xmlns:i=\"&amp;ns_ai;\" xmlns:graph=\"&amp;ns_graphs;\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 1920 737\" style=\"enable-background:new 0 0 1920 737;\" xml:space=\"preserve\">\n            <style type=\"text/css\">\n              .st0{fill:#3E4454;}\n              .st1{fill:#2291F8;}\n            </style>\n            <switch>\n              <foreignObject requiredExtensions=\"&amp;ns_ai;\" x=\"0\" y=\"0\" width=\"1\" height=\"1\">\n                <i:pgfref xlink:href=\"#adobe_illustrator_pgf\"></i:pgfref>\n              </foreignObject>\n              <g i:extraneous=\"self\">\n                <g>\n                  <g>\n                    <g>\n                      <path class=\"st0\" d=\"M936.21,505.42h-65.3c-15.02,0-29.12-6.14-37.71-16.43c-5.52-6.61-8.43-14.42-8.43-22.61V445.5            c0-7.72,6.26-13.99,13.99-13.99s13.99,6.26,13.99,13.99v20.88c0,1.57,0.65,3.15,1.93,4.68c2.58,3.09,8.2,6.39,16.24,6.39h65.3            c10.4,0,18.17-5.84,18.17-11.07v-3.65c0-50.36-26.7-62.73-60.5-78.39c-33.1-15.33-74.28-34.41-74.28-98.52v-3.65            c0-21.52,20.7-39.04,46.14-39.04h67.19c25.44,0,46.14,17.51,46.14,39.04v24.58c0,7.72-6.26,13.99-13.99,13.99            s-13.99-6.26-13.99-13.99v-24.58c0-5.22-7.77-11.07-18.17-11.07h-67.19c-10.4,0-18.17,5.84-18.17,11.07v3.65            c0,46.24,25.63,58.11,58.07,73.14c34.18,15.83,76.71,35.54,76.71,103.77v3.65C982.34,487.91,961.65,505.42,936.21,505.42z\"></path>\n                    </g>\n                    <g>\n                      <path class=\"st0\" d=\"M1539.63,505.42h-31.75c-41.3,0-74.89-33.6-74.89-74.89V257.12c0-7.72,6.26-13.99,13.99-13.99            c7.72,0,13.99,6.26,13.99,13.99v173.41c0,25.87,21.05,46.92,46.92,46.92h31.75c25.87,0,46.92-21.05,46.92-46.92V257.12            c0-7.72,6.26-13.99,13.99-13.99c7.72,0,13.99,6.26,13.99,13.99v173.41C1614.52,471.83,1580.92,505.42,1539.63,505.42z\"></path>\n                    </g>\n                    <g>\n                      <path class=\"st0\" d=\"M1083.31,507.71c-7.72,0-13.99-6.26-13.99-13.99v-237.5c0-7.72,6.26-13.99,13.99-13.99            c7.72,0,13.99,6.26,13.99,13.99v237.5C1097.3,501.45,1091.04,507.71,1083.31,507.71z\"></path>\n                    </g>\n                    <g>\n                      <path class=\"st0\" d=\"M1200.89,507.71c-7.72,0-13.99-6.26-13.99-13.99v-236.6c0-7.72,6.26-13.99,13.99-13.99h90.93            c28.36,0,51.44,23.07,51.44,51.44v43.26c0,28.36-23.08,51.44-51.44,51.44h-76.95v104.45            C1214.88,501.45,1208.62,507.71,1200.89,507.71z M1214.88,361.3h76.95c12.94,0,23.47-10.53,23.47-23.47v-43.26            c0-12.94-10.53-23.47-23.47-23.47h-76.95V361.3z\"></path>\n                    </g>\n                    <g>\n                      <path class=\"st0\" d=\"M1339.71,507.71c-4.83,0-9.53-2.51-12.12-6.99l-66.43-114.97c-3.86-6.69-1.57-15.24,5.11-19.11            c6.69-3.86,15.25-1.57,19.11,5.11l66.43,114.97c3.86,6.69,1.57,15.24-5.11,19.11C1344.49,507.1,1342.08,507.71,1339.71,507.71z            \"></path>\n                    </g>\n                    <g>\n                      <path class=\"st0\" d=\"M1906.01,507.15c-7.72,0-13.99-6.26-13.99-13.99V315.99l-68.38,138.91c-2.35,4.78-7.22,7.81-12.55,7.81            c-5.33,0-10.19-3.03-12.55-7.81l-68.38-138.91v177.17c0,7.72-6.26,13.99-13.99,13.99c-7.72,0-13.99-6.26-13.99-13.99V255.92            c0-6.5,4.48-12.15,10.82-13.62c6.32-1.48,12.85,1.61,15.72,7.44l82.37,167.32l82.37-167.32c2.87-5.83,9.39-8.92,15.72-7.44            c6.33,1.47,10.82,7.12,10.82,13.62v237.24C1920,500.88,1913.74,507.15,1906.01,507.15z\"></path>\n                    </g>\n                  </g>\n                    <path class=\"st1\" d=\"M604.45,130.92L411.49,19.52C366.42-6.5,310.88-6.5,265.8,19.52L72.85,130.92C27.77,156.95,0,205.05,0,257.1        v222.8c0,52.05,27.77,100.15,72.85,126.18l192.95,111.4c45.08,26.03,100.62,26.03,145.69,0l192.95-111.4        c45.08-26.03,72.85-74.12,72.85-126.18V257.1C677.29,205.05,649.52,156.95,604.45,130.92z M568.58,406.37        c0,13-5.07,25.22-14.27,34.4c-9.18,9.17-21.37,14.21-34.34,14.21c-0.03,0-0.06,0-0.08,0l-13-0.02        c-88.13,0-132.33-40.27-175.08-79.21c-41.58-37.88-80.86-73.66-160.54-73.66h-13.94c-15.7,0-28.47,12.77-28.47,28.47v73.98        c0,19.7,16.03,35.73,35.73,35.73l154.58,0.17c59.34,0.06,111.39,47.64,111.39,101.83c0,30.81-25.07,55.87-55.88,55.87H302.6        c-30.81,0-55.87-25.07-55.87-55.87c0-0.35,0.02-0.7,0.05-1.04v-29.99c0-5.56,4.51-10.07,10.07-10.07        c5.56,0,10.07,4.51,10.07,10.07v30.93c0,0.31-0.01,0.63-0.04,0.94c0.45,19.31,16.3,34.89,35.72,34.89h72.09        c19.7,0,35.73-16.03,35.73-35.73c0-38.51-39.03-81.63-91.27-81.68l-154.57-0.17c-30.8,0-55.87-25.07-55.87-55.87v-73.98        c0-26.8,21.81-48.61,48.61-48.61h13.94c87.48,0,131.51,40.11,174.1,78.91c41.75,38.03,81.19,73.96,161.53,73.96l13.01,0.02        c0.02,0,0.03,0,0.05,0c7.6,0,14.73-2.95,20.11-8.32c5.39-5.38,8.35-12.53,8.35-20.15v-73.92c0-19.7-16.03-35.73-35.73-35.73        l-148.42-0.16c-54.49-0.06-117.84-44.55-117.84-101.83c0-30.81,25.07-55.87,55.88-55.87h72.09c30.81,0,55.88,25.07,55.88,55.87        c0,0.35-0.02,0.7-0.05,1.04v29.99c0,5.56-4.51,10.07-10.07,10.07s-10.07-4.51-10.07-10.07v-30.93c0-0.31,0.01-0.63,0.04-0.94        c-0.45-19.31-16.3-34.89-35.72-34.89h-72.09c-19.7,0-35.73,16.03-35.73,35.73c0,45.2,53.46,81.64,97.72,81.69l148.41,0.16        c30.8,0,55.86,25.07,55.86,55.87V406.37z\"></path>\n                  </g>\n                </g>\n            </switch>\n        </svg>\n        <span class=\"mdl-layout-title\"></span>\n        <!-- Add spacer, to align navigation to the right -->\n        <div class=\"mdl-layout-spacer\"></div>\n        <nav class=\"mdl-navigation\">\n          <a repeat.for=\"route of routes\" show.bind=\"route.isVisible\" class=\"mdl-navigation__link ${route.isActive ? 'mdl-navigation__link--current' : ''}\" href.bind=\"route.href\" style=\"\">\n            ${route.title}\n          </a>\n        </nav>\n      </div>\n    </header>\n    <main class=\"mdl-layout__content\">\n      <!-- http://stackoverflow.com/questions/33636796/chrome-safari-not-filling-100-height-of-flex-parent -->\n      <router-view style=\"display:block;\"></router-view>\n    </main>\n  </div>\n</template>\n"; });
define('text!client/src/views/shipments.html', ['module'], function(module) { module.exports = "<template>\n  <require from='client/src/elems/md-shadow'></require>\n  <require from='client/src/elems/md-drawer'></require>\n  <require from='client/src/elems/md-table'></require>\n  <require from=\"client/src/elems/md-input\"></require>\n  <require from=\"client/src/elems/md-select\"></require>\n  <require from=\"client/src/elems/md-switch\"></require>\n  <require from=\"client/src/elems/md-checkbox\"></require>\n  <require from=\"client/src/elems/md-button\"></require>\n  <require from=\"client/src/elems/md-menu\"></require>\n  <require from=\"client/src/elems/md-autocomplete\"></require>\n  <require from=\"client/src/elems/md-snackbar\"></require>\n  <require from=\"client/src/elems/form\"></require>\n  <md-drawer autofocus>\n    <md-input\n      id=\"drawer_filter\"\n      name = \"pro_filter_input\"\n      value.bind=\"filter\"\n      autoselect\n      style=\"padding:0 8px; width:auto\">\n      ${instructionsText}\n    </md-input>\n    <!-- <md-switch\n      checked.one-way=\"role.account == 'to'\"\n      click.delegate=\"swapRole()\"\n      style=\"margin:-33px 0 0 185px;\">\n    </md-switch> -->\n    <a\n      name = \"new_shipment\"\n      if.bind=\" ! filter\"\n      class=\"mdl-navigation__link ${ ! shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment(null, true)\">\n      <div class=\"mdl-typography--title\">New Shipment</div>\n      or add inventory\n    </a>\n    <a\n      name = \"pro_shipments\"\n      repeat.for=\"shipment of shipments[role.shipments] | shipmentFilter:filter\"\n      class=\"mdl-navigation__link ${ shipment._id == shipmentId ? 'mdl-navigation__link--current' : ''}\"\n      click.delegate=\"selectShipment(shipment, true)\">\n      <div class=\"mdl-typography--title\" innerHtml.bind=\"shipment.account[role.accounts].name | bold:filter\"></div>\n      <div style=\"font-size:12px\" innerHtml.bind=\"shipment._id.slice(11, 21)+', '+(shipment.tracking.slice(-6) || shipment.tracking) | bold:filter\"></div>\n    </a>\n    <md-select\n      name = \"pro_year_choice\"\n      change.delegate=\"refocusWithNewShipments()\"\n      input.delegate=\"gatherShipments() & debounce:100\"\n      style=\"font-size: 20px; width:45px; margin:auto\"\n      value.bind=\"shipmentDrawerYear\"\n      options.bind=\"shipmentDrawerYearChoices\">\n    </md-select>\n  </md-drawer>\n  <section class=\"mdl-grid au-animate\">\n    <form md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--3-col full-height\">\n      <div class=\"mdl-card__title\" style=\"display:block;\">\n        <div class=\"mdl-card__title-text\" style=\"text-transform:capitalize\">\n          ${ shipment._rev ? 'Shipment '+(shipment.tracking.slice(-6) || shipment.tracking) : 'New Shipment '+role.accounts+' You' }\n        </div>\n        <div style=\"margin-top:3px; margin-bottom:-25px\">\n          <strong>${transactions.length}</strong> items worth\n          <strong>$${ transactions | value:0:transactions.length }</strong>\n        </div>\n      </div>\n      <div class=\"mdl-card__supporting-text\" style=\"font-size:16px;\">\n        <md-select\n          if.bind=\"role.shipments == 'from' || shipment._rev\"\n          change.delegate=\"setCheckboxes()\"\n          style=\"width:100%\"\n          value.bind=\"shipment\"\n          default.bind=\"{tracking:'New Tracking #', account:{from:account, to:account}}\"\n          options.bind=\"shipments[role.shipments]\"\n          property=\"tracking\">\n          Tracking #\n        </md-select>\n        <md-input\n          name = \"pro_tracking_input\"\n          if.bind=\"role.shipments == 'to' && ! shipment._rev\"\n          focusin.delegate=\"setCheckboxes()\"\n          autofocus\n          required\n          style=\"width:100%\"\n          pattern=\"[a-zA-Z\\d]{6,}\"\n          value.bind=\"shipment.tracking\">\n          Tracking #\n        </md-input>\n        <md-select\n          name = \"pro_from_option\"\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.from\"\n          options.bind=\"(role.accounts == 'to' || shipment._rev) ? [shipment.account.from] : accounts[role.accounts]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.accounts == 'to'\">\n          <!-- disabled is for highlighting the current role -->\n          From\n        </md-select>\n        <md-select\n          style=\"width:100%;\"\n          value.bind=\"shipment.account.to\"\n          options.bind=\"(role.accounts == 'from' || shipment._rev) ? [shipment.account.to] : accounts[role.accounts]\"\n          property=\"name\"\n          required\n          disabled.bind=\"role.accounts == 'from'\">\n          <!-- disabled is for highlighting the current role -->\n          To\n        </md-select>\n        <md-select\n          style=\"width:32%;\"\n          value.bind=\"shipment.status\"\n          options.bind=\"stati\"\n          disabled.bind=\"! shipment._rev\">\n          Status\n        </md-select>\n        <md-input\n          type=\"date\"\n          style=\"width:64%; margin-top:20px\"\n          value.bind=\"shipment[shipment.status+'At']\"\n          disabled.bind=\"! shipment._rev\"\n          input.delegate=\"saveShipment() & debounce:1500\">\n        </md-input>\n        <!-- <md-select\n          style=\"width:100%\"\n          value.bind=\"attachment.name\"\n          change.delegate=\"getAttachment()\"\n          options.bind=\"['','Shipping Label', 'Manifest']\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Attachment\n        </md-select>\n        <md-button color\n          if.bind=\"attachment.name\"\n          click.delegate=\"upload.click()\"\n          style=\"position:absolute; right:18px; margin-top:-48px; height:24px; line-height:24px\"\n          disabled.bind=\" ! shipment._id || shipment._id != tracking._id\">\n          Upload\n        </md-button>\n        <input\n          type=\"file\"\n          ref=\"upload\"\n          change.delegate=\"setAttachment(upload.files[0])\"\n          style=\"display:none\">\n        <div if.bind=\"attachment.url\" style=\"width: 100%; padding-top:56px; padding-bottom:129%; position:relative;\">\n          <embed\n            src.bind=\"attachment.url\"\n            type.bind=\"attachment.type\"\n            style=\"position:absolute; height:100%; width:100%; top:0; bottom:0\">\n        </div> -->\n        <!-- The above padding / positioning keeps a constant aspect ratio for the embeded pdf  -->\n      </div>\n      <div class=\"mdl-card__actions\">\n        <md-button color raised form\n          name = \"pro_create_button\"\n          ref=\"newShipmentButton\"\n          style=\"width:100%\"\n          show.bind=\"shipment._id == shipmentId && ! shipment._rev\"\n          click.delegate=\"createShipment()\">\n          New Shipment Of ${ diffs.length || 'No' } Items\n        </md-button>\n        <md-button color raised\n          ref=\"moveItemsButton\"\n          style=\"width:100%\"\n          show.bind=\"shipment._id != shipmentId\"\n          disabled.bind=\"! diffs.length || ! shipment.account.to._id\"\n          click.delegate=\"shipment._rev ? moveTransactionsToShipment(shipment) : createShipment()\">\n          Move ${ diffs.length } Items\n        </md-button>\n      </div>\n    </form>\n    <div md-shadow=\"2\" class=\"mdl-card mdl-cell mdl-cell--9-col full-height\">\n      <!-- disabled.bind=\"! searchReady\" -->\n      <md-autocomplete\n        name = \"pro_searchbar\"\n        value.bind=\"term\"\n        disabled.bind=\"(shipment.tracking || shipment.account.from) && ! shipment._rev\"\n        input.delegate=\"search() & debounce:50\"\n        keydown.delegate=\"autocompleteShortcuts($event) & debounce:50\"\n        style=\"margin:0px 24px\">\n        <table md-table>\n          <tr\n            repeat.for=\"drug of drugs\"\n            click.delegate=\"addTransaction(drug)\"\n            class=\"${ drug._id == $parent.drug._id && 'is-selected'}\">\n            <td innerHTML.bind=\"drug.generic | bold:term\" style=\"white-space:normal;\" class=\"mdl-data-table__cell--non-numeric\" ></td>\n            <td innerHTML.bind=\"drug.labeler\" style=\"width:1%\" class=\"mdl-data-table__cell--non-numeric\" ></td>\n            <td innerHTML.bind=\"drug._id + (drug.pkg ? '-'+drug.pkg : '')\" style=\"width:1%\" class=\"mdl-data-table__cell--non-numeric\" ></td>\n          </tr>\n        </table>\n      </md-autocomplete>\n      <md-menu style=\"position:absolute; z-index:2; top:10px; right:5px;\">\n        <!-- workaround for boolean attributes https://github.com/aurelia/templating/issues/76 -->\n        <li\n          show.bind=\"transactions.length\"\n          click.delegate=\"exportCSV()\">\n          Export CSV\n        </li>\n        <li\n          show.bind=\"!transactions.length\"\n          disabled>\n          Export CSV\n        </li>\n        <li\n          show.bind=\"role.accounts != 'to' || shipment._rev\"\n          click.delegate=\"$file.click()\">\n          Import CSV\n        </li>\n        <li\n          show.bind=\"role.accounts == 'to' && ! shipment._rev\"\n          disabled>\n          Import CSV\n        </li>\n      </md-menu>\n      <input ref=\"$file\" change.delegate=\"importCSV()\" style=\"display:none\" type=\"file\" />\n      <div class=\"table-wrap\">\n        <table md-table>\n          <thead>\n            <tr>\n              <th style=\"width:56px\"></th>\n              <th class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0\">Drug</th>\n              <th style=\"width:100px;\" class=\"mdl-data-table__cell--non-numeric\">Ndc</th>\n              <th style=\"width:40px; padding-left:0; padding-right:0px\">Value</th>\n              <th style=\"text-align:left; width:60px;\">Exp</th>\n              <th style=\"text-align:left; width:60px\">Qty</th>\n              <!-- 84px account for the 24px of padding-right on index.html's css td:last-child -->\n              <th style=\"text-align:left; width:84px;\">Bin</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr class=\"${transaction.highlighted}\" style=\"padding-top:7px;\" name = \"pro_transaction\" repeat.for=\"transaction of transactions\" input.delegate=\"saveTransaction(transaction) & debounce:1500\">\n              <td style=\"padding:0 0 0 8px\">\n                <!-- if you are selecting new items you received to add to inventory, do not confuse these with the currently checked items -->\n                <!-- if you are selecting items to move to a new shipment, do not allow selection of items already verified by recipient e.g do not mix saving new items and removing old items, you must do one at a time -->\n                <!-- since undefined != false we must force both sides to be booleans just to show a simple inequality. use next[0].disposed directly rather than isChecked because autocheck coerces isChecked to be out of sync -->\n                <md-checkbox\n                  name = \"pro_checkbox\"\n                  click.delegate=\"manualCheck($index)\"\n                  disabled.bind=\" ! moveItemsButton.offsetParent && ! newShipmentButton.offsetParent && transaction.isChecked && transaction.next[0]\"\n                  checked.bind=\"transaction.isChecked\">\n                </md-checkbox>\n\n              </td>\n              <td click.delegate=\"focusInput('#exp_'+$index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"padding-left:0; overflow:hidden\">\n                ${ transaction.drug.generic & oneTime }\n              </td>\n              <td click.delegate=\"focusInput('#exp_'+$index)\" class=\"mdl-data-table__cell--non-numeric\" style=\"padding:0\">\n                ${ transaction.drug._id + (transaction.drug.pkg ? '-'+transaction.drug.pkg : '') & oneTime }\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction | value:2:transaction.qty[role.shipments] }\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.exp[role.accounts] | date & oneTime }\n                <md-input\n                  name = \"pro_exp\"\n                  id.bind=\"'exp_'+$index\"\n                  required\n                  keydown.delegate=\"expShortcutsKeydown($event, $index)\"\n                  input.trigger=\"expShortcutsInput($index)\"\n                  disabled.bind=\"transaction.isChecked && transaction.next[0]\"\n                  pattern=\"(0?[1-9]|1[012])/(1\\d|2\\d)\"\n                  value.bind=\"transaction.exp[role.shipments] | date\"\n                  style=\"width:40px; margin-bottom:-8px\"\n                  placeholder>\n                </md-input>\n              </td>\n              <td style=\"padding:0\">\n                ${ transaction.qty[role.accounts] & oneTime }\n                  <!-- input event is not triggered on enter, so use keyup for qtyShortcutes instead   -->\n                  <!-- keyup rather than keydown because we want the new quantity not the old one -->\n                  <md-input\n                    name = \"pro_qty\"\n                    id.bind=\"'qty_'+$index\"\n                    required\n                    keydown.delegate=\"qtyShortcutsKeydown($event, $index)\"\n                    input.trigger=\"qtyShortcutsInput($event, $index)\"\n                    disabled.bind=\"transaction.isChecked && transaction.next[0]\"\n                    type=\"number\"\n                    value.bind=\"transaction.qty[role.shipments] | number\"\n                    style=\"width:40px; margin-bottom:-8px\"\n                    max.bind=\"3000\"\n                    placeholder>\n                  </md-input>\n              </td>\n              <!-- disable if not checked because we don't want a red required field unless we are keeping the item -->\n              <td style=\"padding:0\">\n                <md-input\n                  name = \"pro_bin\"\n                  id.bind=\"'bin_'+$index\"\n                  required\n                  disabled.bind=\" ! transaction.isChecked || transaction.next[0] || shipment._id != shipmentId\"\n                  keyup.delegate=\"setBin(transaction) & debounce:1500\"\n                  keydown.delegate=\"binShortcuts($event, $index)\"\n                  pattern.bind=\"shipment._rev ? '[A-Z][1-6][0-6]\\\\d{2}|[A-Za-z][0-6]\\\\d{2}' : '[A-Za-z]\\\\d{2}|[A-Z][1-6][0-6]\\\\d{2}|[A-Za-z][0-6]\\\\d{2}'\"\n                  maxlength.bind=\"5\"\n                  value.bind=\"transaction.bin\"\n                  style=\"width:40px; margin-bottom:-8px; font-family:PT Mono; font-size:12.5px\"\n                  placeholder>\n                </md-input>\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n    <md-snackbar class=\"${snackbarColor}\" ref=\"snackbar\"></md-snackbar>\n    <dialog ref=\"dialog\" class=\"mdl-dialog\">\n    <h4 class=\"mdl-dialog__title\">Drug Warning</h4>\n    <div class=\"mdl-dialog__content\">${drug.warning}</div>\n    <div class=\"mdl-dialog__actions\">\n      <md-button click.delegate=\"dialogClose()\">Close</md-button>\n    </div>\n  </dialog>\n  </section>\n</template>\n"; });
define('text!client/src/elems/md-autocomplete.html', ['module'], function(module) { module.exports = "<template style=\"box-shadow:none\">\n  <!-- z-index of 2 is > than checkboxes which have z-index of 1 -->\n  <md-autocomplete-wrap\n    ref=\"form\"\n    class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\"\n    style=\"z-index:2; width:100%; padding-top:10px\">\n    <input class=\"md-input mdl-textfield__input\"\n      name = \"pro_input_field\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled\"\n      placeholder.bind=\"placeholder || ''\"\n      focus.trigger=\"toggleResults()\"\n      focusout.delegate=\"toggleResults($event)\"\n      style=\"font-size:20px;\">\n    <div show.bind=\"showResults\"\n      tabindex=\"-1\"\n      style=\"width:100%; overflow-y:scroll; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25); max-height: 400px !important;\"\n      class=\"md-autocomplete-suggestions\">\n      <slot></slot>\n    </div>\n  </md-autocomplete-wrap>\n  <style>\n  @-webkit-keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @keyframes md-autocomplete-list-out {\n    0% {\n      -webkit-animation-timing-function: linear;\n              animation-timing-function: linear; }\n\n    50% {\n      opacity: 0;\n      height: 40px;\n      -webkit-animation-timing-function: ease-in;\n              animation-timing-function: ease-in; }\n\n    100% {\n      height: 0;\n      opacity: 0; } }\n\n  @-webkit-keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  @keyframes md-autocomplete-list-in {\n    0% {\n      opacity: 0;\n      height: 0;\n      -webkit-animation-timing-function: ease-out;\n              animation-timing-function: ease-out; }\n\n    50% {\n      opacity: 0;\n      height: 40px; }\n\n    100% {\n      opacity: 1;\n      height: 40px; } }\n\n  md-autocomplete {\n    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);\n    border-radius: 2px;\n    display: block;\n    height: 40px;\n    position: relative;\n    overflow: visible;\n    min-width: 190px; }\n    md-autocomplete[md-floating-label] {\n      padding-bottom: 26px;\n      box-shadow: none;\n      border-radius: 0;\n      background: transparent;\n      height: auto; }\n      md-autocomplete[md-floating-label] md-input-container {\n        padding-bottom: 0; }\n      md-autocomplete[md-floating-label] md-autocomplete-wrap {\n        height: auto; }\n      md-autocomplete[md-floating-label] button {\n        top: auto;\n        bottom: 5px; }\n    md-autocomplete md-autocomplete-wrap {\n      display: block;\n      position: relative;\n      overflow: visible;\n      height: 40px; }\n      md-autocomplete md-autocomplete-wrap md-progress-linear {\n        position: absolute;\n        bottom: 0;\n        left: 0;\n        width: 100%;\n        height: 3px;\n        transition: none; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear .md-container {\n          transition: none;\n          top: auto;\n          height: 3px; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-enter.ng-enter-active {\n            opacity: 1; }\n        md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave {\n          transition: opacity 0.15s linear; }\n          md-autocomplete md-autocomplete-wrap md-progress-linear.ng-leave.ng-leave-active {\n            opacity: 0; }\n    md-autocomplete input:not(.md-input) {\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: 100%;\n      box-sizing: border-box;\n      border: none;\n      box-shadow: none;\n      padding: 0 15px;\n      font-size: 14px;\n      line-height: 40px;\n      height: 40px;\n      outline: none;\n      background: transparent; }\n      md-autocomplete input:not(.md-input)::-ms-clear {\n        display: none; }\n    md-autocomplete button {\n      position: absolute;\n      top: 10px;\n      right: 10px;\n      line-height: 20px;\n      text-align: center;\n      width: 20px;\n      height: 20px;\n      cursor: pointer;\n      border: none;\n      border-radius: 50%;\n      padding: 0;\n      font-size: 12px;\n      background: transparent; }\n      md-autocomplete button:after {\n        content: '';\n        position: absolute;\n        top: -6px;\n        right: -6px;\n        bottom: -6px;\n        left: -6px;\n        border-radius: 50%;\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        opacity: 0;\n        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }\n      md-autocomplete button:focus {\n        outline: none; }\n        md-autocomplete button:focus:after {\n          -webkit-transform: scale(1);\n                  transform: scale(1);\n          opacity: 1; }\n      md-autocomplete button md-icon {\n        position: absolute;\n        top: 50%;\n        left: 50%;\n        -webkit-transform: translate3d(-50%, -50%, 0) scale(0.9);\n                transform: translate3d(-50%, -50%, 0) scale(0.9); }\n        md-autocomplete button md-icon path {\n          stroke-width: 0; }\n      md-autocomplete button.ng-enter {\n        -webkit-transform: scale(0);\n                transform: scale(0);\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-enter.ng-enter-active {\n          -webkit-transform: scale(1);\n                  transform: scale(1); }\n      md-autocomplete button.ng-leave {\n        transition: -webkit-transform 0.15s ease-out;\n        transition: transform 0.15s ease-out; }\n        md-autocomplete button.ng-leave.ng-leave-active {\n          -webkit-transform: scale(0);\n                  transform: scale(0); }\n    @media screen and (-ms-high-contrast: active) {\n      md-autocomplete input {\n        border: 1px solid #fff; }\n      md-autocomplete li:focus {\n        color: #fff; } }\n\n  .md-autocomplete-suggestions table, .md-autocomplete-suggestions ul {\n    table-layout:auto;  //added by adam\n    width:100%;         //added by adam\n    background:white;   //added by adam\n    position: relative;\n    margin: 0;\n    list-style: none;\n    padding: 0;\n    z-index: 100; }\n    .md-autocomplete-suggestions li {\n      line-height: 48px; //separated by adam\n    }\n    .md-autocomplete-suggestions li, .md-autocomplete-suggestions tr {\n      /*added by adam */\n      width:100%;\n      text-align: left;\n      position: static !important;\n      text-transform: none;\n      /* end addition */\n      cursor: pointer;\n      font-size: 14px;\n      overflow: hidden;\n\n      transition: background 0.15s linear;\n      text-overflow: ellipsis; }\n      .md-autocomplete-suggestions li.ng-enter, .md-autocomplete-suggestions li.ng-hide-remove {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-in 0.2s;\n                animation: md-autocomplete-list-in 0.2s; }\n      .md-autocomplete-suggestions li.ng-leave, .md-autocomplete-suggestions li.ng-hide-add {\n        transition: none;\n        -webkit-animation: md-autocomplete-list-out 0.2s;\n                animation: md-autocomplete-list-out 0.2s; }\n      .md-autocomplete-suggestions li:focus {\n        outline: none; }\n  </style>\n</template>\n"; });
define('text!client/src/elems/md-button.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block; height:36px; line-height:36px\">\n  <button\n    ref=\"button\"\n    type=\"button\"\n    disabled.two-way=\"disabled\"\n    click.delegate=\"click($event)\"\n    class=\"mdl-button mdl-js-button mdl-js-ripple-effect ${ color } ${ (raised || raised === '') && 'mdl-button--raised' } \"\n    style=\"width:100%; height:inherit; line-height:inherit\">\n    <slot style=\"padding:auto\"></slot>\n  </button>\n</template>\n<!-- type=\"button\" because a button inside a form has its type implicitly set to submit. And the spec says that the first button or input with type=\"submit\" is triggered on enter -->\n<!-- two-way because FormCustomAttribute can set button's disabled property directly -->\n"; });
define('text!client/src/elems/md-checkbox.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <label ref=\"label\" class=\"mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect\" style=\"width:100%; margin-right:8px\">\n    <input\n      name = \"pro_input\"\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      tabindex.one-time=\"tabindex\"\n      type=\"checkbox\"\n      class=\"mdl-checkbox__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <slot></slot>\n  </label>\n</template>\n"; });
define('text!client/src/elems/md-drawer.html', ['module'], function(module) { module.exports = "<template>\n    <slot></slot>\n</template>\n"; });
define('text!client/src/elems/md-input.html', ['module'], function(module) { module.exports = "<!-- firefox needs max-height otherwise is oversizes the parent element -->\n<template style=\"display:inline-block; box-sizing:border-box;\">\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; margin-bottom:-12px; padding-top:22px; min-height:19px; line-height:19px; font-size:inherit; text-overflow:inherit; display:block; ${ label.textContent.trim() || 'padding-top:0px'};\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height. -->\n    <input\n      if.bind=\"type != 'number'\"\n      type.bind=\"type\"\n      name=\"input\"\n      ref=\"input\"\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      pattern.bind=\"pattern || '.*'\"\n      placeholder.bind=\"placeholder || ''\"\n      minlength.bind=\"minlength\"\n      maxlength.bind=\"maxlength || 100\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    <input\n      if.bind=\"type == 'number'\"\n      type=\"number\"\n      name=\"input\"\n      ref=\"input\"\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      max.bind=\"max\"\n      min.bind=\"min\"\n      step.bind=\"step\"\n      placeholder.bind=\"placeholder || ''\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    <label ref=\"label\" style.bind=\"(type == 'date' || value || placeholder) ? '' : 'top:23px'\" class=\"mdl-textfield__label\"><slot></slot></label> <!-- top aligns placeholder height with surronding text -->\n  </div>\n</template>\n"; });
define('text!client/src/elems/md-loading.html', ['module'], function(module) { module.exports = "<!-- vertical-align top is necessary for firefox -->\n<template>\n  <div ref=\"div\" class=\"mdl-progress mdl-js-progress\"></div>\n</template>\n"; });
define('text!client/src/elems/md-menu.html', ['module'], function(module) { module.exports = "<template style=\"display:inline-block\">\n  <style>\n    .mdl-menu a { color:inherit }\n  </style>\n  <button\n    ref=\"button\"\n    id.one-time=\"id\"\n    tabindex=\"-1\"\n    class=\"mdl-button mdl-js-button mdl-button--icon\">\n    <i class=\"material-icons\">more_vert</i>\n  </button>\n  <ul click.trigger=\"click($event)\" ref=\"ul\" class=\"mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect\" data-mdl-for.one-time=\"id\">\n    <div><slot></slot></div> <!-- the <div> is necessary for menu to close when click menu item. Not sure why -->\n  </ul>\n</template>\n"; });
define('text!client/src/elems/md-select.html', ['module'], function(module) { module.exports = "<!-- vertical-align top is necessary for firefox -->\n<template style=\"display:inline-block; box-sizing:border-box; vertical-align:top; margin-bottom:8px\">\n  <style>\n  @-moz-document url-prefix() {\n    select {\n       text-indent:-2px;\n    }\n  }\n  </style>\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; ${ label.textContent.trim() ? 'padding-top:22px' : 'padding-top:0px'}; margin-bottom:-12px; min-height:22px; line-height:22px; font-size:inherit;\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height.  Not sure why extra pixels are necessary in chrome and firefox -->\n    <select\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      required.bind=\"required || required === ''\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; border-radius:0; font-size:inherit; font-weight:inherit; text-transform:inherit; -webkit-appearance:none; -moz-appearance:none;\">\n      <option if.bind=\"default\" model.bind=\"default\">\n        ${ property ? default[property] : default }\n      </option>\n      <option model.bind=\"option\" repeat.for=\"option of options\">\n        ${ property ? option[property] : option }\n      </option>\n    </select>\n    <label ref=\"label\" class=\"mdl-textfield__label\" style=\"text-align:inherit;\">\n      <slot></slot>\n    </label>\n  </div>\n</template>\n"; });
define('text!client/src/elems/md-snackbar.html', ['module'], function(module) { module.exports = "<template class=\"mdl-js-snackbar mdl-snackbar\">\n  <div name = \"pro_text\" class=\"mdl-snackbar__text\"></div>\n  <button class=\"mdl-snackbar__action\" type=\"button\"></button>\n</template>\n"; });
define('text!client/src/elems/md-switch.html', ['module'], function(module) { module.exports = "<template>\n  <label ref=\"label\" class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect\" for=\"switch\" style=\"width:100%\">\n    <input\n      required.bind=\"required || required ===''\"\n      disabled.bind=\"disabled || disabled ===''\"\n      checked.bind=\"checked\"\n      type=\"checkbox\"\n      class=\"mdl-switch__input\"\n      click.delegate=\"stopPropogation()\"/>\n    <span class=\"mdl-switch__label\"><slot></slot></span>\n  </label>\n</template>\n"; });
define('text!client/src/elems/md-text.html', ['module'], function(module) { module.exports = "<!-- firefox needs max-height otherwise is oversizes the parent element -->\n<template style=\"display:inline-block; box-sizing:border-box;\">\n  <div ref=\"div\" class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label\" style=\"width:100%; margin-bottom:-12px; padding-top:22px; min-height:19px; line-height:19px; font-size:inherit; text-overflow:inherit; display:block; ${ label.textContent.trim() || 'padding-top:0px'};\">\n    <!-- Chrome's input[type=date] has a minimum height of 24px because of its internal buttons, to align heights we need to make all have min-height. -->\n    <textarea\n      required.bind=\"required || required === ''\"\n      class=\"mdl-textfield__input\"\n      value.bind=\"value\"\n      disabled.bind=\"disabled || disabled === ''\"\n      placeholder.bind=\"placeholder || ''\"\n      style=\"padding:0; min-height:inherit; line-height:inherit; font-size:inherit; font-weight:inherit; text-transform:inherit; text-overflow:inherit; \"/>\n    </textarea>\n    <label ref=\"label\" class=\"mdl-textfield__label\"><slot></slot></label>\n  </div>\n</template>\n"; });