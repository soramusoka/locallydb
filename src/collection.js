// todo: create GUID func

(function () {
  var Collection, _, fs, list, path,
    extend = function (child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  fs = require('fs');
  path = require('path');
  _ = require('underscore');
  list = require('./list');

  Array.prototype.remove = function (from, to) {
    var rest;
    rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  };

  Collection = (function (superClass) {
    extend(Collection, superClass);

    function Collection(name, db, autosave) {
      var data;
      this.name = name;
      this.db = db;
      this.autosave = autosave != null ? autosave : true;
      this.items = [];
      this.header = {
        '$created': (new Date).toJSON(),
        '$updated': (new Date).toJSON(),
        'lcid': -1
      };
      this._cpath = path.join(this.db.path, this.name);

      function createCollection(path, header, items) {
        fs.writeFileSync(path, JSON.stringify({
          'header': header,
          'items': items
        }));
      }

      if (fs.existsSync(this._cpath)) {
        var source = fs.readFileSync(this._cpath, 'utf8');
        if (source) {
          data = JSON.parse(source);
          this.items = data.items;
          this.header = data.header;
        }
        createCollection(this._cpath, this.header, this.items);
      } else {
        createCollection(this._cpath, this.header, this.items);
      }
    }

    Collection.prototype.save = function (callback) {
      this.header['$updated'] = (new Date).toJSON();
      var data = JSON.stringify({
        'header': this.header,
        'items': this.items
      });
      return fs.writeFile(this._cpath, data, callback || function () { });
    };

    Collection.prototype.insert = function (element, callback) {
      var date, elem, j, len, result;
      if (element instanceof Array) {
        result = [];
        for (j = 0, len = element.length; j < len; j++) {
          elem = element[j];
          date = (new Date).toJSON();
          this.header.lcid++;
          elem['cid'] = this.header.lcid;
          elem['$created'] = date;
          elem['$updated'] = date;
          this.items.push(elem);
          result.push(this.header.lcid);
        }
      } else {
        date = (new Date).toJSON();
        this.header.lcid++;
        element['cid'] = this.header.lcid;
        element['$created'] = date;
        element['$updated'] = date;
        this.items.push(element);
        result = this.header.lcid;
      }
      if (this.autosave) {
        return this.save(function (err) {
          callback && callback(err, result);
        });
      }
      callback && callback(null, result);
    };

    Collection.prototype.upsert = function (element, key, value, callback) {
      var check;
      check = this.where("(@" + key + " ==  '" + value + "')");
      if (check.length > 0) {
        return this.update(check[0].cid, element, callback || function () { });
      }
      this.insert(element, callback || function () { });
    };

    Collection.prototype.get = function (cid, callback) {
      var result = _.findWhere(this.items, {
        'cid': cid
      });
      var error = null;
      if (!result) {
        error = new Error('Wrong ID. Element does not exist');
      }
      callback && callback(error, result || null);
    };

    Collection.prototype.update = function (cid, obj, callback) {
      var element, i, j, key, len, ref, result;
      ref = this.items;
      result = false;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        element = ref[i];
        if (element.cid === cid) {
          obj['cid'] = this.items[i]['cid'];
          obj['$created'] = this.items[i]['$created'];
          obj['$updated'] = (new Date).toJSON();
          for (key in obj) {
            this.items[i][key] = obj[key];
          }
          result = true;
          break;
        }
      }
      if (this.autosave) {
        return this.save(function (err) {
          callback && callback(err, result);
        });
      }
      callback && callback(null, result);
    };

    Collection.prototype.replace = function (cid, obj, callback) {
      var element, i, j, key, len, ref, result;
      ref = this.items;
      result = false;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        element = ref[i];
        if (element.cid === cid) {
          obj['cid'] = this.items[i]['cid'];
          obj['$created'] = this.items[i]['$created'];
          for (key in this.items[i]) {
            delete this.items[i][key];
          }
          obj['$updated'] = (new Date).toJSON();
          
          // todo: hasOwnProperty
          for (key in obj) {
            this.items[i][key] = obj[key];
          }
          result = true;
          break;
        }
      }
      if (this.autosave) {
        return this.save(function (err) {
          callback && callback(err, result);
        });
      }
      callback && callback(null, result);
    };

    Collection.prototype.remove = function (cid, callback) {
      var element, i, j, len, ref, result;
      ref = this.items;
      result = false;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        element = ref[i];
        if (element.cid === cid) {
          this.items.remove(i);
          result = true;
          break;
        }
      }
      if (this.autosave) {
        return this.save(function (err) {
          callback && callback(err, result);
        });
      }
      callback && callback(null, result);
    };

    Collection.prototype.deleteProperty = function (cid, property, callback) {
      var element, i, j, k, len, len1, properties, ref, result;
      ref = this.items;
      result = false;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        element = ref[i];
        if (element.cid === cid) {
          if (property instanceof Array) {
            properties = property;
            for (k = 0, len1 = properties.length; k < len1; k++) {
              property = properties[k];
              if (element[property] != null) {
                delete this.items[i][property];
              }
            }
          } else {
            if (element[property] != null) {
              delete this.items[i][property];
            }
          }
          result = true;
          break;
        }
      }
      if (this.autosave) {
        return this.save(function (err) {
          callback && callback(err, result);
        });
      }
      callback && callback(null, result);
    };

    return Collection;

  })(list);

  module.exports = Collection;

}).call(this);
