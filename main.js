(function () {
'use strict';

var ascending = function (a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

var bisector = function (compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function left(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;else hi = mid;
      }
      return lo;
    },
    right: function right(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;else lo = mid + 1;
      }
      return lo;
    }
  };
};

function ascendingComparator(f) {
  return function (d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;

var descending = function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var extent = function (values, valueof) {
  var n = values.length,
      i = -1,
      value,
      min,
      max;

  if (valueof == null) {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        min = max = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = values[i]) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  } else {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        min = max = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  }

  return [min, max];
};

var sequence = function (start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
};

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);

var ticks = function (start, stop, count) {
    var reverse,
        i = -1,
        n,
        ticks,
        step;

    stop = +stop, start = +start, count = +count;
    if (start === stop && count > 0) return [start];
    if (reverse = stop < start) n = start, start = stop, stop = n;
    if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

    if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) {
            ticks[i] = (start + i) * step;
        }
    } else {
        start = Math.floor(start * step);
        stop = Math.ceil(stop * step);
        ticks = new Array(n = Math.ceil(start - stop + 1));
        while (++i < n) {
            ticks[i] = (start - i) / step;
        }
    }

    if (reverse) ticks.reverse();

    return ticks;
};

function tickIncrement(start, stop, count) {
    var step = (stop - start) / Math.max(0, count),
        power = Math.floor(Math.log(step) / Math.LN10),
        error = step / Math.pow(10, power);
    return power >= 0 ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power) : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
}

function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
    if (error >= e10) step1 *= 10;else if (error >= e5) step1 *= 5;else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
}

var sum = function (values, valueof) {
  var n = values.length,
      i = -1,
      value,
      sum = 0;

  if (valueof == null) {
    while (++i < n) {
      if (value = +values[i]) sum += value; // Note: zero and null are equivalent.
    }
  } else {
    while (++i < n) {
      if (value = +valueof(values[i], i, values)) sum += value;
    }
  }

  return sum;
};

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace = function (name) {
  var prefix = name += "",
      i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name } : name;
};

function creatorInherit(name) {
  return function () {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml ? document.createElement(name) : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator = function (name) {
  var fullname = namespace(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
};

var matcher = function matcher(selector) {
  return function () {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!element.matches) {
    var vendorMatches = element.webkitMatchesSelector || element.msMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector;
    matcher = function matcher(selector) {
      return function () {
        return vendorMatches.call(this, selector);
      };
    };
  }
}

var matcher$1 = matcher;

var filterEvents = {};

var event = null;

if (typeof document !== "undefined") {
  var element$1 = document.documentElement;
  if (!("onmouseenter" in element$1)) {
    filterEvents = { mouseenter: "mouseover", mouseleave: "mouseout" };
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function (event) {
    var related = event.relatedTarget;
    if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
      listener.call(this, event);
    }
  };
}

function contextListener(listener, index, group) {
  return function (event1) {
    var event0 = event; // Events can be reentrant (e.g., focus).
    event = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event = event0;
    }
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name };
  });
}

function onRemove(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function (d, i, group) {
    var on = this.__on,
        o,
        listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
    if (!on) this.__on = [o];else on.push(o);
  };
}

var selection_on = function (typename, value, capture) {
  var typenames = parseTypenames(typename + ""),
      i,
      n = typenames.length,
      t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) {
    this.each(on(typenames[i], value, capture));
  }return this;
};

var sourceEvent = function () {
  var current = event,
      source;
  while (source = current.sourceEvent) {
    current = source;
  }return current;
};

var point = function (node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

var mouse = function (node) {
  var event = sourceEvent();
  if (event.changedTouches) event = event.changedTouches[0];
  return point(node, event);
};

function none() {}

var selector = function (selector) {
  return selector == null ? none : function () {
    return this.querySelector(selector);
  };
};

var selection_select = function (select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

function empty() {
  return [];
}

var selectorAll = function (selector) {
  return selector == null ? empty : function () {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll = function (select) {
  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
};

var selection_filter = function (match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

var sparse = function (update) {
  return new Array(update.length);
};

var selection_enter = function () {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
};

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

var constant$1 = function (x) {
  return function () {
    return x;
  };
};

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
      exit[i] = node;
    }
  }
}

var selection_data = function (value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function (d) {
      data[++j] = d;
    });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$1(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit = function () {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
};

var selection_merge = function (selection$$1) {

  for (var groups0 = this._groups, groups1 = selection$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
};

var selection_order = function () {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort = function (compare) {
  if (!compare) compare = ascending$1;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
};

function ascending$1(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call = function () {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes = function () {
  var nodes = new Array(this.size()),
      i = -1;
  this.each(function () {
    nodes[++i] = this;
  });
  return nodes;
};

var selection_node = function () {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size = function () {
  var size = 0;
  this.each(function () {
    ++size;
  });
  return size;
};

var selection_empty = function () {
  return !this.node();
};

var selection_each = function (callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr = function (name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }

  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
};

var defaultView = function (node) {
    return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
    node.document && node // node is a Window
    || node.defaultView; // node is a Document
};

function styleRemove(name) {
  return function () {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}

var selection_style = function (name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
};

function styleValue(node, name) {
  return node.style.getPropertyValue(name) || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function () {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function () {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}

var selection_property = function (name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
};

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.add(names[i]);
  }
}

function classedRemove(node, names) {
  var list = classList(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.remove(names[i]);
  }
}

function classedTrue(names) {
  return function () {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function () {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

var selection_classed = function (name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()),
        i = -1,
        n = names.length;
    while (++i < n) {
      if (!list.contains(names[i])) return false;
    }return true;
  }

  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
};

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text = function (value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
};

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function () {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html = function (value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
};

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise = function () {
  return this.each(raise);
};

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower = function () {
  return this.each(lower);
};

var selection_append = function (name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull() {
  return null;
}

var selection_insert = function (name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove = function () {
  return this.each(remove);
};

var selection_datum = function (value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
};

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function () {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function () {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch = function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
};

var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

var select = function (selector) {
    return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
};

var slice$1 = Array.prototype.slice;

var identity$1 = function (x) {
  return x;
};

var top = 1;
var right = 2;
var bottom = 3;
var left = 4;
var epsilon = 1e-6;

function translateX(x) {
  return "translate(" + (x + 0.5) + ",0)";
}

function translateY(y) {
  return "translate(0," + (y + 0.5) + ")";
}

function number$1(scale) {
  return function (d) {
    return +scale(d);
  };
}

function center(scale) {
  var offset = Math.max(0, scale.bandwidth() - 1) / 2; // Adjust for 0.5px offset.
  if (scale.round()) offset = Math.round(offset);
  return function (d) {
    return +scale(d) + offset;
  };
}

function entering() {
  return !this.__axis;
}

function axis(orient, scale) {
  var tickArguments = [],
      tickValues = null,
      tickFormat = null,
      tickSizeInner = 6,
      tickSizeOuter = 6,
      tickPadding = 3,
      k = orient === top || orient === left ? -1 : 1,
      x = orient === left || orient === right ? "x" : "y",
      transform = orient === top || orient === bottom ? translateX : translateY;

  function axis(context) {
    var values = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain() : tickValues,
        format = tickFormat == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$1 : tickFormat,
        spacing = Math.max(tickSizeInner, 0) + tickPadding,
        range = scale.range(),
        range0 = +range[0] + 0.5,
        range1 = +range[range.length - 1] + 0.5,
        position = (scale.bandwidth ? center : number$1)(scale.copy()),
        selection = context.selection ? context.selection() : context,
        path = selection.selectAll(".domain").data([null]),
        tick = selection.selectAll(".tick").data(values, scale).order(),
        tickExit = tick.exit(),
        tickEnter = tick.enter().append("g").attr("class", "tick"),
        line = tick.select("line"),
        text = tick.select("text");

    path = path.merge(path.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "#000"));

    tick = tick.merge(tickEnter);

    line = line.merge(tickEnter.append("line").attr("stroke", "#000").attr(x + "2", k * tickSizeInner));

    text = text.merge(tickEnter.append("text").attr("fill", "#000").attr(x, k * spacing).attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);

      tickExit = tickExit.transition(context).attr("opacity", epsilon).attr("transform", function (d) {
        return isFinite(d = position(d)) ? transform(d) : this.getAttribute("transform");
      });

      tickEnter.attr("opacity", epsilon).attr("transform", function (d) {
        var p = this.parentNode.__axis;return transform(p && isFinite(p = p(d)) ? p : position(d));
      });
    }

    tickExit.remove();

    path.attr("d", orient === left || orient == right ? "M" + k * tickSizeOuter + "," + range0 + "H0.5V" + range1 + "H" + k * tickSizeOuter : "M" + range0 + "," + k * tickSizeOuter + "V0.5H" + range1 + "V" + k * tickSizeOuter);

    tick.attr("opacity", 1).attr("transform", function (d) {
      return transform(position(d));
    });

    line.attr(x + "2", k * tickSizeInner);

    text.attr(x, k * spacing).text(format);

    selection.filter(entering).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

    selection.each(function () {
      this.__axis = position;
    });
  }

  axis.scale = function (_) {
    return arguments.length ? (scale = _, axis) : scale;
  };

  axis.ticks = function () {
    return tickArguments = slice$1.call(arguments), axis;
  };

  axis.tickArguments = function (_) {
    return arguments.length ? (tickArguments = _ == null ? [] : slice$1.call(_), axis) : tickArguments.slice();
  };

  axis.tickValues = function (_) {
    return arguments.length ? (tickValues = _ == null ? null : slice$1.call(_), axis) : tickValues && tickValues.slice();
  };

  axis.tickFormat = function (_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };

  axis.tickSize = function (_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };

  axis.tickSizeInner = function (_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };

  axis.tickSizeOuter = function (_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };

  axis.tickPadding = function (_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };

  return axis;
}





function axisBottom(scale) {
  return axis(bottom, scale);
}

var noop = { value: function value() {} };

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name };
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function on(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) {
        if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      }return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);else if (callback == null) for (t in _) {
        _[t] = set(_[t], typename.name, null);
      }
    }

    return this;
  },
  copy: function copy() {
    var copy = {},
        _ = this._;
    for (var t in _) {
      copy[t] = _[t].slice();
    }return new Dispatch(copy);
  },
  call: function call(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) {
      args[i] = arguments[i + 2];
    }if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  },
  apply: function apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name, value: callback });
  return type;
}

var prefix = "$";

function Map$1() {}

Map$1.prototype = map$1.prototype = {
  constructor: Map$1,
  has: function has(key) {
    return prefix + key in this;
  },
  get: function get(key) {
    return this[prefix + key];
  },
  set: function set(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function remove(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function clear() {
    for (var property in this) {
      if (property[0] === prefix) delete this[property];
    }
  },
  keys: function keys() {
    var keys = [];
    for (var property in this) {
      if (property[0] === prefix) keys.push(property.slice(1));
    }return keys;
  },
  values: function values() {
    var values = [];
    for (var property in this) {
      if (property[0] === prefix) values.push(this[property]);
    }return values;
  },
  entries: function entries() {
    var entries = [];
    for (var property in this) {
      if (property[0] === prefix) entries.push({ key: property.slice(1), value: this[property] });
    }return entries;
  },
  size: function size() {
    var size = 0;
    for (var property in this) {
      if (property[0] === prefix) ++size;
    }return size;
  },
  empty: function empty() {
    for (var property in this) {
      if (property[0] === prefix) return false;
    }return true;
  },
  each: function each(f) {
    for (var property in this) {
      if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  }
};

function map$1(object, f) {
  var map = new Map$1();

  // Copy constructor.
  if (object instanceof Map$1) object.each(function (value, key) {
    map.set(key, value);
  });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) {
        map.set(i, object[i]);
      } else while (++i < n) {
        map.set(f(o = object[i], i, object), o);
      }
    }

    // Convert object to map.
    else if (object) for (var key in object) {
        map.set(key, object[key]);
      }return map;
}

var nest = function () {
  var keys = [],
      _sortKeys = [],
      _sortValues,
      _rollup,
      nest;

  function apply(array, depth, createResult, setResult) {
    if (depth >= keys.length) {
      if (_sortValues != null) array.sort(_sortValues);
      return _rollup != null ? _rollup(array) : array;
    }

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        value,
        valuesByKey = map$1(),
        values,
        result = createResult();

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
        values.push(value);
      } else {
        valuesByKey.set(keyValue, [value]);
      }
    }

    valuesByKey.each(function (values, key) {
      setResult(result, key, apply(values, depth, createResult, setResult));
    });

    return result;
  }

  function _entries(map, depth) {
    if (++depth > keys.length) return map;
    var array,
        sortKey = _sortKeys[depth - 1];
    if (_rollup != null && depth >= keys.length) array = map.entries();else array = [], map.each(function (v, k) {
      array.push({ key: k, values: _entries(v, depth) });
    });
    return sortKey != null ? array.sort(function (a, b) {
      return sortKey(a.key, b.key);
    }) : array;
  }

  return nest = {
    object: function object(array) {
      return apply(array, 0, createObject, setObject);
    },
    map: function map(array) {
      return apply(array, 0, createMap, setMap);
    },
    entries: function entries(array) {
      return _entries(apply(array, 0, createMap, setMap), 0);
    },
    key: function key(d) {
      keys.push(d);return nest;
    },
    sortKeys: function sortKeys(order) {
      _sortKeys[keys.length - 1] = order;return nest;
    },
    sortValues: function sortValues(order) {
      _sortValues = order;return nest;
    },
    rollup: function rollup(f) {
      _rollup = f;return nest;
    }
  };
};

function createObject() {
  return {};
}

function setObject(object, key, value) {
  object[key] = value;
}

function createMap() {
  return map$1();
}

function setMap(map, key, value) {
  map.set(key, value);
}

var array$1 = Array.prototype;

var map$3 = array$1.map;
var slice$2 = array$1.slice;

var implicit = { name: "implicit" };

function ordinal(range) {
  var index = map$1(),
      domain = [],
      unknown = implicit;

  range = range == null ? [] : slice$2.call(range);

  function scale(d) {
    var key = d + "",
        i = index.get(key);
    if (!i) {
      if (unknown !== implicit) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$1();
    var i = -1,
        n = _.length,
        d,
        key;
    while (++i < n) {
      if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    }return scale;
  };

  scale.range = function (_) {
    return arguments.length ? (range = slice$2.call(_), scale) : range.slice();
  };

  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function () {
    return ordinal().domain(domain).range(range).unknown(unknown);
  };

  return scale;
}

function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range$$1 = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range$$1[1] < range$$1[0],
        start = range$$1[reverse - 0],
        stop = range$$1[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = sequence(n).map(function (i) {
      return start + step * i;
    });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = [+_[0], +_[1]], rescale()) : range$$1.slice();
  };

  scale.rangeRound = function (_) {
    return range$$1 = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function () {
    return bandwidth;
  };

  scale.step = function () {
    return step;
  };

  scale.round = function (_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function (_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function (_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function (_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function (_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function () {
    return band().domain(domain()).range(range$$1).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };

  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function () {
    return pointish(copy());
  };

  return scale;
}

function point$1() {
  return pointish(band().paddingInner(1));
}

var define = function (constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) {
    prototype[key] = definition[key];
  }return prototype;
}

function Color() {}

var _darker = 0.7;
var _brighter = 1 / _darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  toString: function toString() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb(m >> 8 & 0xf | m >> 4 & 0x0f0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  ) : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
  : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb() {
    return this;
  },
  displayable: function displayable() {
    return 0 <= this.r && this.r <= 255 && 0 <= this.g && this.g <= 255 && 0 <= this.b && this.b <= 255 && 0 <= this.opacity && this.opacity <= 1;
  },
  toString: function toString() {
    var a = this.opacity;a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;

function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend(Color, {
  brighter: function brighter(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb$$1() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z), xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), this.opacity);
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend(Color, {
  brighter: function brighter(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb$$1() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)),
      // NaN if l=0 or l=1
  h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend(Color, {
  brighter: function brighter$$1(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker$$1(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb$$1() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(255 * (l + a * (A * cosh + B * sinh)), 255 * (l + a * (C * cosh + D * sinh)), 255 * (l + a * (E * cosh)), this.opacity);
  }
}));

var constant$2 = function (x) {
  return function () {
    return x;
  };
};

function linear$1(a, d) {
  return function (t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$2(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function (a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$2(isNaN(a) ? b : a);
}

var rgb$1 = (function rgbGamma(y) {
  var color$$1 = gamma(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

var array$2 = function (a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) {
    x[i] = interpolateValue(a[i], b[i]);
  }for (; i < nb; ++i) {
    c[i] = b[i];
  }return function (t) {
    for (i = 0; i < na; ++i) {
      c[i] = x[i](t);
    }return c;
  };
};

var date = function (a, b) {
  var d = new Date();
  return a = +a, b -= a, function (t) {
    return d.setTime(a + b * t), d;
  };
};

var reinterpolate = function (a, b) {
  return a = +a, b -= a, function (t) {
    return a + b * t;
  };
};

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var object = function (a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || (typeof a === "undefined" ? "undefined" : _typeof$1(a)) !== "object") a = {};
  if (b === null || (typeof b === "undefined" ? "undefined" : _typeof$1(b)) !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolateValue(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function (t) {
    for (k in i) {
      c[k] = i[k](t);
    }return c;
  };
};

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function zero(b) {
  return function () {
    return b;
  };
}

function one(b) {
  return function (t) {
    return b(t) + "";
  };
}

var string = function (a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0,
      // scan index for next number in b
  am,
      // current match in a
  bm,
      // current match in b
  bs,
      // string preceding current number in b, if any
  i = -1,
      // index in s
  s = [],
      // string constants and placeholders
  q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({ i: i, x: reinterpolate(am, bm) });
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) {
      s[(o = q[i]).i] = o.x(t);
    }return s.join("");
  });
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var interpolateValue = function (a, b) {
    var t = typeof b === "undefined" ? "undefined" : _typeof(b),
        c;
    return b == null || t === "boolean" ? constant$2(b) : (t === "number" ? reinterpolate : t === "string" ? (c = color(b)) ? (b = c, rgb$1) : string : b instanceof color ? rgb$1 : b instanceof Date ? date : Array.isArray(b) ? array$2 : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object : reinterpolate)(a, b);
};

var interpolateRound = function (a, b) {
  return a = +a, b -= a, function (t) {
    return Math.round(a + b * t);
  };
};

function cubehelix$1(hue$$1) {
  return function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  }(1);
}

cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

var constant$3 = function (x) {
  return function () {
    return x;
  };
};

var number$2 = function (x) {
  return +x;
};

var unit = [0, 1];

function deinterpolateLinear(a, b) {
  return (b -= a = +a) ? function (x) {
    return (x - a) / b;
  } : constant$3(b);
}

function deinterpolateClamp(deinterpolate) {
  return function (a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function (x) {
      return x <= a ? 0 : x >= b ? 1 : d(x);
    };
  };
}

function reinterpolateClamp(reinterpolate) {
  return function (a, b) {
    var r = reinterpolate(a = +a, b = +b);
    return function (t) {
      return t <= 0 ? a : t >= 1 ? b : r(t);
    };
  };
}

function bimap(domain, range, deinterpolate, reinterpolate) {
  var d0 = domain[0],
      d1 = domain[1],
      r0 = range[0],
      r1 = range[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
  return function (x) {
    return r0(d0(x));
  };
}

function polymap(domain, range, deinterpolate, reinterpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate(range[i], range[i + 1]);
  }

  return function (x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate, reinterpolate) {
  var domain = unit,
      range = unit,
      interpolate$$1 = interpolateValue,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
  }

  scale.invert = function (y) {
    return (input || (input = piecewise(range, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
  };

  scale.domain = function (_) {
    return arguments.length ? (domain = map$3.call(_, number$2), rescale()) : domain.slice();
  };

  scale.range = function (_) {
    return arguments.length ? (range = slice$2.call(_), rescale()) : range.slice();
  };

  scale.rangeRound = function (_) {
    return range = slice$2.call(_), interpolate$$1 = interpolateRound, rescale();
  };

  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function (_) {
    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
  };

  return rescale();
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
var formatDecimal = function (x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i,
      coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)];
};

var exponent = function (x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
};

var formatGroup = function (grouping, thousands) {
  return function (value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
};

var formatNumerals = function (numerals) {
  return function (value) {
    return value.replace(/[0-9]/g, function (i) {
      return numerals[+i];
    });
  };
};

var formatDefault = function (x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".":
        i0 = i1 = i;break;
      case "0":
        if (i0 === 0) i0 = i;i1 = i;break;
      case "e":
        break out;
      default:
        if (i0 > 0) i0 = 0;break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
};

var prefixExponent;

var formatPrefixAuto = function (x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
};

var formatRounded = function (x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
};

var formatTypes = {
  "": formatDefault,
  "%": function _(x, p) {
    return (x * 100).toFixed(p);
  },
  "b": function b(x) {
    return Math.round(x).toString(2);
  },
  "c": function c(x) {
    return x + "";
  },
  "d": function d(x) {
    return Math.round(x).toString(10);
  },
  "e": function e(x, p) {
    return x.toExponential(p);
  },
  "f": function f(x, p) {
    return x.toFixed(p);
  },
  "g": function g(x, p) {
    return x.toPrecision(p);
  },
  "o": function o(x) {
    return Math.round(x).toString(8);
  },
  "p": function p(x, _p) {
    return formatRounded(x * 100, _p);
  },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function X(x) {
    return Math.round(x).toString(16).toUpperCase();
  },
  "x": function x(_x) {
    return Math.round(_x).toString(16);
  }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  return new FormatSpecifier(specifier);
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || fill === "0" && align === "=") zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function () {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width == null ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0)) + this.type;
};

var identity$4 = function (x) {
  return x;
};

var prefixes = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];

var formatLocale = function (locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$4,
      currency = locale.currency,
      decimal = locale.decimal,
      numerals = locale.numerals ? formatNumerals(locale.numerals) : identity$4,
      percent = locale.percent || "%";

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? type ? 6 : 12 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i,
          n,
          c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Perform the initial formatting.
        var valueNegative = value < 0;
        value = formatType(Math.abs(value), precision);

        // If a negative value rounds to zero during formatting, treat as positive.
        if (valueNegative && +value === 0) valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? sign === "(" ? sign : "-" : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);break;
        default:
          value = padding + valuePrefix + value + valueSuffix;break;
      }

      return numerals(value);
    }

    format.toString = function () {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function (value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
};

var locale;
var format;
var formatPrefix;

defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

var precisionFixed = function (step) {
  return Math.max(0, -exponent(Math.abs(step)));
};

var precisionPrefix = function (step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
};

var precisionRound = function (step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
};

var tickFormat = function (domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s":
      {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
    case "":
    case "e":
    case "g":
    case "p":
    case "r":
      {
        if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
    case "f":
    case "%":
      {
        if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
  }
  return format(specifier);
};

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function (count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function (count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function (count) {
    if (count == null) count = 10;

    var d = domain(),
        i0 = 0,
        i1 = d.length - 1,
        start = d[i0],
        stop = d[i1],
        step;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }

    step = tickIncrement(start, stop, count);

    if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
      step = tickIncrement(start, stop, count);
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
      step = tickIncrement(start, stop, count);
    }

    if (step > 0) {
      d[i0] = Math.floor(start / step) * step;
      d[i1] = Math.ceil(stop / step) * step;
      domain(d);
    } else if (step < 0) {
      d[i0] = Math.ceil(start * step) / step;
      d[i1] = Math.floor(stop * step) / step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous(deinterpolateLinear, reinterpolate);

  scale.copy = function () {
    return copy(scale, linear());
  };

  return linearish(scale);
}

var t0$1 = new Date();
var t1$1 = new Date();

function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function (date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function (date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function (date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function (start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do {
      range.push(new Date(+start));
    } while ((offseti(start, step), floori(start), start < stop));
    return range;
  };

  interval.filter = function (test) {
    return newInterval(function (date) {
      if (date >= date) while (floori(date), !test(date)) {
        date.setTime(date - 1);
      }
    }, function (date, step) {
      if (date >= date) {
        if (step < 0) while (++step <= 0) {
          while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
        } else while (--step >= 0) {
          while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
        }
      }
    });
  };

  if (count) {
    interval.count = function (start, end) {
      t0$1.setTime(+start), t1$1.setTime(+end);
      floori(t0$1), floori(t1$1);
      return Math.floor(count(t0$1, t1$1));
    };

    interval.every = function (step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? function (d) {
        return field(d) % step === 0;
      } : function (d) {
        return interval.count(0, d) % step === 0;
      });
    };
  }

  return interval;
}

var millisecond = newInterval(function () {
  // noop
}, function (date, step) {
  date.setTime(+date + step);
}, function (start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function (k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return newInterval(function (date) {
    date.setTime(Math.floor(date / k) * k);
  }, function (date, step) {
    date.setTime(+date + step * k);
  }, function (start, end) {
    return (end - start) / k;
  });
};

var durationSecond$1 = 1e3;
var durationMinute$1 = 6e4;
var durationHour$1 = 36e5;
var durationDay$1 = 864e5;
var durationWeek$1 = 6048e5;

var second = newInterval(function (date) {
  date.setTime(Math.floor(date / durationSecond$1) * durationSecond$1);
}, function (date, step) {
  date.setTime(+date + step * durationSecond$1);
}, function (start, end) {
  return (end - start) / durationSecond$1;
}, function (date) {
  return date.getUTCSeconds();
});

var minute = newInterval(function (date) {
  date.setTime(Math.floor(date / durationMinute$1) * durationMinute$1);
}, function (date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function (start, end) {
  return (end - start) / durationMinute$1;
}, function (date) {
  return date.getMinutes();
});

var hour = newInterval(function (date) {
  var offset = date.getTimezoneOffset() * durationMinute$1 % durationHour$1;
  if (offset < 0) offset += durationHour$1;
  date.setTime(Math.floor((+date - offset) / durationHour$1) * durationHour$1 + offset);
}, function (date, step) {
  date.setTime(+date + step * durationHour$1);
}, function (start, end) {
  return (end - start) / durationHour$1;
}, function (date) {
  return date.getHours();
});

var day = newInterval(function (date) {
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setDate(date.getDate() + step);
}, function (start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationDay$1;
}, function (date) {
  return date.getDate() - 1;
});

function weekday(i) {
  return newInterval(function (date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function (start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationWeek$1;
  });
}

var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);

var month = newInterval(function (date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setMonth(date.getMonth() + step);
}, function (start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function (date) {
  return date.getMonth();
});

var year = newInterval(function (date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function (start, end) {
  return end.getFullYear() - start.getFullYear();
}, function (date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var utcMinute = newInterval(function (date) {
  date.setUTCSeconds(0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function (start, end) {
  return (end - start) / durationMinute$1;
}, function (date) {
  return date.getUTCMinutes();
});

var utcHour = newInterval(function (date) {
  date.setUTCMinutes(0, 0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationHour$1);
}, function (start, end) {
  return (end - start) / durationHour$1;
}, function (date) {
  return date.getUTCHours();
});

var utcDay = newInterval(function (date) {
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function (start, end) {
  return (end - start) / durationDay$1;
}, function (date) {
  return date.getUTCDate() - 1;
});

function utcWeekday(i) {
  return newInterval(function (date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function (start, end) {
    return (end - start) / durationWeek$1;
  });
}

var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);

var utcMonth = newInterval(function (date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function (start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function (date) {
  return date.getUTCMonth();
});

var utcYear = newInterval(function (date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function (start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function (date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return { y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0 };
}

function formatLocale$1(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "f": formatMicroseconds,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatSeconds,
    "u": formatWeekdayNumberMonday,
    "U": formatWeekNumberSunday,
    "V": formatWeekNumberISO,
    "w": formatWeekdayNumberSunday,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "f": formatUTCMicroseconds,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatUTCSeconds,
    "u": formatUTCWeekdayNumberMonday,
    "U": formatUTCWeekNumberSunday,
    "V": formatUTCWeekNumberISO,
    "w": formatUTCWeekdayNumberSunday,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "f": parseMicroseconds,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "Q": parseUnixTimestamp,
    "s": parseUnixTimestampSeconds,
    "S": parseSeconds,
    "u": parseWeekdayNumberMonday,
    "U": parseWeekNumberSunday,
    "V": parseWeekNumberISO,
    "w": parseWeekdayNumberSunday,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function (date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function (string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0),
          week,
          day$$1;
      if (i != string.length) return null;

      // If a UNIX timestamp is specified, return it.
      if ("Q" in d) return new Date(d.Q);

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("V" in d) {
        if (d.V < 1 || d.V > 53) return null;
        if (!("w" in d)) d.w = 1;
        if ("Z" in d) {
          week = utcDate(newYear(d.y)), day$$1 = week.getUTCDay();
          week = day$$1 > 4 || day$$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
          week = utcDay.offset(week, (d.V - 1) * 7);
          d.y = week.getUTCFullYear();
          d.m = week.getUTCMonth();
          d.d = week.getUTCDate() + (d.w + 6) % 7;
        } else {
          week = newDate(newYear(d.y)), day$$1 = week.getDay();
          week = day$$1 > 4 || day$$1 === 0 ? monday.ceil(week) : monday(week);
          week = day.offset(week, (d.V - 1) * 7);
          d.y = week.getFullYear();
          d.m = week.getMonth();
          d.d = week.getDate() + (d.w + 6) % 7;
        }
      } else if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
        day$$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$$1 + 5) % 7 : d.w + d.U * 7 - (day$$1 + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || (j = parse(d, string, j)) < 0) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function format(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    parse: function parse(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function () {
        return specifier;
      };
      return p;
    },
    utcFormat: function utcFormat(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    utcParse: function utcParse(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function () {
        return specifier;
      };
      return p;
    }
  };
}

var pads = { "-": "", "_": " ", "0": "0" };
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\^$*+?|[\]().{}]/g;

function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {},
      i = -1,
      n = names.length;
  while (++i < n) {
    map[names[i].toLowerCase()] = i;
  }return map;
}

function parseWeekdayNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekdayNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.u = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberISO(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.V = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseMicroseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 6));
  return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function parseUnixTimestamp(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.Q = +n[0], i + n[0].length) : -1;
}

function parseUnixTimestampSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.Q = +n[0] * 1000, i + n[0].length) : -1;
}

function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}

function formatMicroseconds(d, p) {
  return formatMilliseconds(d, p) + "000";
}

function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}

function formatWeekdayNumberMonday(d) {
  var day$$1 = d.getDay();
  return day$$1 === 0 ? 7 : day$$1;
}

function formatWeekNumberSunday(d, p) {
  return pad(sunday.count(year(d), d), p, 2);
}

function formatWeekNumberISO(d, p) {
  var day$$1 = d.getDay();
  d = day$$1 >= 4 || day$$1 === 0 ? thursday(d) : thursday.ceil(d);
  return pad(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
}

function formatWeekdayNumberSunday(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad(monday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+")) + pad(z / 60 | 0, "0", 2) + pad(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMicroseconds(d, p) {
  return formatUTCMilliseconds(d, p) + "000";
}

function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekdayNumberMonday(d) {
  var dow = d.getUTCDay();
  return dow === 0 ? 7 : dow;
}

function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d), d), p, 2);
}

function formatUTCWeekNumberISO(d, p) {
  var day$$1 = d.getUTCDay();
  d = day$$1 >= 4 || day$$1 === 0 ? utcThursday(d) : utcThursday.ceil(d);
  return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
}

function formatUTCWeekdayNumberSunday(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

function formatUnixTimestamp(d) {
  return +d;
}

function formatUnixTimestampSeconds(d) {
  return Math.floor(+d / 1000);
}

var locale$1;


var utcFormat;
var utcParse;

defaultLocale$1({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale$1(definition) {
  locale$1 = formatLocale$1(definition);
  utcFormat = locale$1.utcFormat;
  utcParse = locale$1.utcParse;
  return locale$1;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
    return date.toISOString();
}

var formatIso = Date.prototype.toISOString ? formatIsoNative : utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative : utcParse(isoSpecifier);

var colors = function (s) {
  return s.match(/.{6}/g).map(function (x) {
    return "#" + x;
  });
};

colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

function ramp(range) {
  var n = range.length;
  return function (t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

var constant$4 = function (x) {
  return function () {
    return x;
  };
};

function x(d) {
  return d[0];
}

function y(d) {
  return d[1];
}

function RedBlackTree() {
  this._ = null; // root node
}

function RedBlackNode(node) {
  node.U = // parent node
  node.C = // color - true for red, false for black
  node.L = // left node
  node.R = // right node
  node.P = // previous node
  node.N = null; // next node
}

RedBlackTree.prototype = {
  constructor: RedBlackTree,

  insert: function insert(after, node) {
    var parent, grandpa, uncle;

    if (after) {
      node.P = after;
      node.N = after.N;
      if (after.N) after.N.P = node;
      after.N = node;
      if (after.R) {
        after = after.R;
        while (after.L) {
          after = after.L;
        }after.L = node;
      } else {
        after.R = node;
      }
      parent = after;
    } else if (this._) {
      after = RedBlackFirst(this._);
      node.P = null;
      node.N = after;
      after.P = after.L = node;
      parent = after;
    } else {
      node.P = node.N = null;
      this._ = node;
      parent = null;
    }
    node.L = node.R = null;
    node.U = parent;
    node.C = true;

    after = node;
    while (parent && parent.C) {
      grandpa = parent.U;
      if (parent === grandpa.L) {
        uncle = grandpa.R;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.R) {
            RedBlackRotateLeft(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateRight(this, grandpa);
        }
      } else {
        uncle = grandpa.L;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.L) {
            RedBlackRotateRight(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateLeft(this, grandpa);
        }
      }
      parent = after.U;
    }
    this._.C = false;
  },

  remove: function remove(node) {
    if (node.N) node.N.P = node.P;
    if (node.P) node.P.N = node.N;
    node.N = node.P = null;

    var parent = node.U,
        sibling,
        left = node.L,
        right = node.R,
        next,
        red;

    if (!left) next = right;else if (!right) next = left;else next = RedBlackFirst(right);

    if (parent) {
      if (parent.L === node) parent.L = next;else parent.R = next;
    } else {
      this._ = next;
    }

    if (left && right) {
      red = next.C;
      next.C = node.C;
      next.L = left;
      left.U = next;
      if (next !== right) {
        parent = next.U;
        next.U = node.U;
        node = next.R;
        parent.L = node;
        next.R = right;
        right.U = next;
      } else {
        next.U = parent;
        parent = next;
        node = next.R;
      }
    } else {
      red = node.C;
      node = next;
    }

    if (node) node.U = parent;
    if (red) return;
    if (node && node.C) {
      node.C = false;return;
    }

    do {
      if (node === this._) break;
      if (node === parent.L) {
        sibling = parent.R;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateLeft(this, parent);
          sibling = parent.R;
        }
        if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
          if (!sibling.R || !sibling.R.C) {
            sibling.L.C = false;
            sibling.C = true;
            RedBlackRotateRight(this, sibling);
            sibling = parent.R;
          }
          sibling.C = parent.C;
          parent.C = sibling.R.C = false;
          RedBlackRotateLeft(this, parent);
          node = this._;
          break;
        }
      } else {
        sibling = parent.L;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateRight(this, parent);
          sibling = parent.L;
        }
        if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
          if (!sibling.L || !sibling.L.C) {
            sibling.R.C = false;
            sibling.C = true;
            RedBlackRotateLeft(this, sibling);
            sibling = parent.L;
          }
          sibling.C = parent.C;
          parent.C = sibling.L.C = false;
          RedBlackRotateRight(this, parent);
          node = this._;
          break;
        }
      }
      sibling.C = true;
      node = parent;
      parent = parent.U;
    } while (!node.C);

    if (node) node.C = false;
  }
};

function RedBlackRotateLeft(tree, node) {
  var p = node,
      q = node.R,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.R = q.L;
  if (p.R) p.R.U = p;
  q.L = p;
}

function RedBlackRotateRight(tree, node) {
  var p = node,
      q = node.L,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.L = q.R;
  if (p.L) p.L.U = p;
  q.R = p;
}

function RedBlackFirst(node) {
  while (node.L) {
    node = node.L;
  }return node;
}

function createEdge(left, right, v0, v1) {
  var edge = [null, null],
      index = edges.push(edge) - 1;
  edge.left = left;
  edge.right = right;
  if (v0) setEdgeEnd(edge, left, right, v0);
  if (v1) setEdgeEnd(edge, right, left, v1);
  cells[left.index].halfedges.push(index);
  cells[right.index].halfedges.push(index);
  return edge;
}

function createBorderEdge(left, v0, v1) {
  var edge = [v0, v1];
  edge.left = left;
  return edge;
}

function setEdgeEnd(edge, left, right, vertex) {
  if (!edge[0] && !edge[1]) {
    edge[0] = vertex;
    edge.left = left;
    edge.right = right;
  } else if (edge.left === right) {
    edge[1] = vertex;
  } else {
    edge[0] = vertex;
  }
}

// Liang–Barsky line clipping.
function clipEdge(edge, x0, y0, x1, y1) {
  var a = edge[0],
      b = edge[1],
      ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (!(t0 > 0) && !(t1 < 1)) return true; // TODO Better check?

  if (t0 > 0) edge[0] = [ax + t0 * dx, ay + t0 * dy];
  if (t1 < 1) edge[1] = [ax + t1 * dx, ay + t1 * dy];
  return true;
}

function connectEdge(edge, x0, y0, x1, y1) {
  var v1 = edge[1];
  if (v1) return true;

  var v0 = edge[0],
      left = edge.left,
      right = edge.right,
      lx = left[0],
      ly = left[1],
      rx = right[0],
      ry = right[1],
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm,
      fb;

  if (ry === ly) {
    if (fx < x0 || fx >= x1) return;
    if (lx > rx) {
      if (!v0) v0 = [fx, y0];else if (v0[1] >= y1) return;
      v1 = [fx, y1];
    } else {
      if (!v0) v0 = [fx, y1];else if (v0[1] < y0) return;
      v1 = [fx, y0];
    }
  } else {
    fm = (lx - rx) / (ry - ly);
    fb = fy - fm * fx;
    if (fm < -1 || fm > 1) {
      if (lx > rx) {
        if (!v0) v0 = [(y0 - fb) / fm, y0];else if (v0[1] >= y1) return;
        v1 = [(y1 - fb) / fm, y1];
      } else {
        if (!v0) v0 = [(y1 - fb) / fm, y1];else if (v0[1] < y0) return;
        v1 = [(y0 - fb) / fm, y0];
      }
    } else {
      if (ly < ry) {
        if (!v0) v0 = [x0, fm * x0 + fb];else if (v0[0] >= x1) return;
        v1 = [x1, fm * x1 + fb];
      } else {
        if (!v0) v0 = [x1, fm * x1 + fb];else if (v0[0] < x0) return;
        v1 = [x0, fm * x0 + fb];
      }
    }
  }

  edge[0] = v0;
  edge[1] = v1;
  return true;
}

function clipEdges(x0, y0, x1, y1) {
  var i = edges.length,
      edge;

  while (i--) {
    if (!connectEdge(edge = edges[i], x0, y0, x1, y1) || !clipEdge(edge, x0, y0, x1, y1) || !(Math.abs(edge[0][0] - edge[1][0]) > epsilon$1 || Math.abs(edge[0][1] - edge[1][1]) > epsilon$1)) {
      delete edges[i];
    }
  }
}

function createCell(site) {
  return cells[site.index] = {
    site: site,
    halfedges: []
  };
}

function cellHalfedgeAngle(cell, edge) {
  var site = cell.site,
      va = edge.left,
      vb = edge.right;
  if (site === vb) vb = va, va = site;
  if (vb) return Math.atan2(vb[1] - va[1], vb[0] - va[0]);
  if (site === va) va = edge[1], vb = edge[0];else va = edge[0], vb = edge[1];
  return Math.atan2(va[0] - vb[0], vb[1] - va[1]);
}

function cellHalfedgeStart(cell, edge) {
  return edge[+(edge.left !== cell.site)];
}

function cellHalfedgeEnd(cell, edge) {
  return edge[+(edge.left === cell.site)];
}

function sortCellHalfedges() {
  for (var i = 0, n = cells.length, cell, halfedges, j, m; i < n; ++i) {
    if ((cell = cells[i]) && (m = (halfedges = cell.halfedges).length)) {
      var index = new Array(m),
          array = new Array(m);
      for (j = 0; j < m; ++j) {
        index[j] = j, array[j] = cellHalfedgeAngle(cell, edges[halfedges[j]]);
      }index.sort(function (i, j) {
        return array[j] - array[i];
      });
      for (j = 0; j < m; ++j) {
        array[j] = halfedges[index[j]];
      }for (j = 0; j < m; ++j) {
        halfedges[j] = array[j];
      }
    }
  }
}

function clipCells(x0, y0, x1, y1) {
  var nCells = cells.length,
      iCell,
      cell,
      site,
      iHalfedge,
      halfedges,
      nHalfedges,
      start,
      startX,
      startY,
      end,
      endX,
      endY,
      cover = true;

  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      site = cell.site;
      halfedges = cell.halfedges;
      iHalfedge = halfedges.length;

      // Remove any dangling clipped edges.
      while (iHalfedge--) {
        if (!edges[halfedges[iHalfedge]]) {
          halfedges.splice(iHalfedge, 1);
        }
      }

      // Insert any border edges as necessary.
      iHalfedge = 0, nHalfedges = halfedges.length;
      while (iHalfedge < nHalfedges) {
        end = cellHalfedgeEnd(cell, edges[halfedges[iHalfedge]]), endX = end[0], endY = end[1];
        start = cellHalfedgeStart(cell, edges[halfedges[++iHalfedge % nHalfedges]]), startX = start[0], startY = start[1];
        if (Math.abs(endX - startX) > epsilon$1 || Math.abs(endY - startY) > epsilon$1) {
          halfedges.splice(iHalfedge, 0, edges.push(createBorderEdge(site, end, Math.abs(endX - x0) < epsilon$1 && y1 - endY > epsilon$1 ? [x0, Math.abs(startX - x0) < epsilon$1 ? startY : y1] : Math.abs(endY - y1) < epsilon$1 && x1 - endX > epsilon$1 ? [Math.abs(startY - y1) < epsilon$1 ? startX : x1, y1] : Math.abs(endX - x1) < epsilon$1 && endY - y0 > epsilon$1 ? [x1, Math.abs(startX - x1) < epsilon$1 ? startY : y0] : Math.abs(endY - y0) < epsilon$1 && endX - x0 > epsilon$1 ? [Math.abs(startY - y0) < epsilon$1 ? startX : x0, y0] : null)) - 1);
          ++nHalfedges;
        }
      }

      if (nHalfedges) cover = false;
    }
  }

  // If there weren’t any edges, have the closest site cover the extent.
  // It doesn’t matter which corner of the extent we measure!
  if (cover) {
    var dx,
        dy,
        d2,
        dc = Infinity;

    for (iCell = 0, cover = null; iCell < nCells; ++iCell) {
      if (cell = cells[iCell]) {
        site = cell.site;
        dx = site[0] - x0;
        dy = site[1] - y0;
        d2 = dx * dx + dy * dy;
        if (d2 < dc) dc = d2, cover = cell;
      }
    }

    if (cover) {
      var v00 = [x0, y0],
          v01 = [x0, y1],
          v11 = [x1, y1],
          v10 = [x1, y0];
      cover.halfedges.push(edges.push(createBorderEdge(site = cover.site, v00, v01)) - 1, edges.push(createBorderEdge(site, v01, v11)) - 1, edges.push(createBorderEdge(site, v11, v10)) - 1, edges.push(createBorderEdge(site, v10, v00)) - 1);
    }
  }

  // Lastly delete any cells with no edges; these were entirely clipped.
  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      if (!cell.halfedges.length) {
        delete cells[iCell];
      }
    }
  }
}

var circlePool = [];

var firstCircle;

function Circle() {
  RedBlackNode(this);
  this.x = this.y = this.arc = this.site = this.cy = null;
}

function attachCircle(arc) {
  var lArc = arc.P,
      rArc = arc.N;

  if (!lArc || !rArc) return;

  var lSite = lArc.site,
      cSite = arc.site,
      rSite = rArc.site;

  if (lSite === rSite) return;

  var bx = cSite[0],
      by = cSite[1],
      ax = lSite[0] - bx,
      ay = lSite[1] - by,
      cx = rSite[0] - bx,
      cy = rSite[1] - by;

  var d = 2 * (ax * cy - ay * cx);
  if (d >= -epsilon2$1) return;

  var ha = ax * ax + ay * ay,
      hc = cx * cx + cy * cy,
      x = (cy * ha - ay * hc) / d,
      y = (ax * hc - cx * ha) / d;

  var circle = circlePool.pop() || new Circle();
  circle.arc = arc;
  circle.site = cSite;
  circle.x = x + bx;
  circle.y = (circle.cy = y + by) + Math.sqrt(x * x + y * y); // y bottom

  arc.circle = circle;

  var before = null,
      node = circles._;

  while (node) {
    if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
      if (node.L) node = node.L;else {
        before = node.P;break;
      }
    } else {
      if (node.R) node = node.R;else {
        before = node;break;
      }
    }
  }

  circles.insert(before, circle);
  if (!before) firstCircle = circle;
}

function detachCircle(arc) {
  var circle = arc.circle;
  if (circle) {
    if (!circle.P) firstCircle = circle.N;
    circles.remove(circle);
    circlePool.push(circle);
    RedBlackNode(circle);
    arc.circle = null;
  }
}

var beachPool = [];

function Beach() {
  RedBlackNode(this);
  this.edge = this.site = this.circle = null;
}

function createBeach(site) {
  var beach = beachPool.pop() || new Beach();
  beach.site = site;
  return beach;
}

function detachBeach(beach) {
  detachCircle(beach);
  beaches.remove(beach);
  beachPool.push(beach);
  RedBlackNode(beach);
}

function removeBeach(beach) {
  var circle = beach.circle,
      x = circle.x,
      y = circle.cy,
      vertex = [x, y],
      previous = beach.P,
      next = beach.N,
      disappearing = [beach];

  detachBeach(beach);

  var lArc = previous;
  while (lArc.circle && Math.abs(x - lArc.circle.x) < epsilon$1 && Math.abs(y - lArc.circle.cy) < epsilon$1) {
    previous = lArc.P;
    disappearing.unshift(lArc);
    detachBeach(lArc);
    lArc = previous;
  }

  disappearing.unshift(lArc);
  detachCircle(lArc);

  var rArc = next;
  while (rArc.circle && Math.abs(x - rArc.circle.x) < epsilon$1 && Math.abs(y - rArc.circle.cy) < epsilon$1) {
    next = rArc.N;
    disappearing.push(rArc);
    detachBeach(rArc);
    rArc = next;
  }

  disappearing.push(rArc);
  detachCircle(rArc);

  var nArcs = disappearing.length,
      iArc;
  for (iArc = 1; iArc < nArcs; ++iArc) {
    rArc = disappearing[iArc];
    lArc = disappearing[iArc - 1];
    setEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
  }

  lArc = disappearing[0];
  rArc = disappearing[nArcs - 1];
  rArc.edge = createEdge(lArc.site, rArc.site, null, vertex);

  attachCircle(lArc);
  attachCircle(rArc);
}

function addBeach(site) {
  var x = site[0],
      directrix = site[1],
      lArc,
      rArc,
      dxl,
      dxr,
      node = beaches._;

  while (node) {
    dxl = leftBreakPoint(node, directrix) - x;
    if (dxl > epsilon$1) node = node.L;else {
      dxr = x - rightBreakPoint(node, directrix);
      if (dxr > epsilon$1) {
        if (!node.R) {
          lArc = node;
          break;
        }
        node = node.R;
      } else {
        if (dxl > -epsilon$1) {
          lArc = node.P;
          rArc = node;
        } else if (dxr > -epsilon$1) {
          lArc = node;
          rArc = node.N;
        } else {
          lArc = rArc = node;
        }
        break;
      }
    }
  }

  createCell(site);
  var newArc = createBeach(site);
  beaches.insert(lArc, newArc);

  if (!lArc && !rArc) return;

  if (lArc === rArc) {
    detachCircle(lArc);
    rArc = createBeach(lArc.site);
    beaches.insert(newArc, rArc);
    newArc.edge = rArc.edge = createEdge(lArc.site, newArc.site);
    attachCircle(lArc);
    attachCircle(rArc);
    return;
  }

  if (!rArc) {
    // && lArc
    newArc.edge = createEdge(lArc.site, newArc.site);
    return;
  }

  // else lArc !== rArc
  detachCircle(lArc);
  detachCircle(rArc);

  var lSite = lArc.site,
      ax = lSite[0],
      ay = lSite[1],
      bx = site[0] - ax,
      by = site[1] - ay,
      rSite = rArc.site,
      cx = rSite[0] - ax,
      cy = rSite[1] - ay,
      d = 2 * (bx * cy - by * cx),
      hb = bx * bx + by * by,
      hc = cx * cx + cy * cy,
      vertex = [(cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay];

  setEdgeEnd(rArc.edge, lSite, rSite, vertex);
  newArc.edge = createEdge(lSite, site, null, vertex);
  rArc.edge = createEdge(site, rSite, null, vertex);
  attachCircle(lArc);
  attachCircle(rArc);
}

function leftBreakPoint(arc, directrix) {
  var site = arc.site,
      rfocx = site[0],
      rfocy = site[1],
      pby2 = rfocy - directrix;

  if (!pby2) return rfocx;

  var lArc = arc.P;
  if (!lArc) return -Infinity;

  site = lArc.site;
  var lfocx = site[0],
      lfocy = site[1],
      plby2 = lfocy - directrix;

  if (!plby2) return lfocx;

  var hl = lfocx - rfocx,
      aby2 = 1 / pby2 - 1 / plby2,
      b = hl / plby2;

  if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

  return (rfocx + lfocx) / 2;
}

function rightBreakPoint(arc, directrix) {
  var rArc = arc.N;
  if (rArc) return leftBreakPoint(rArc, directrix);
  var site = arc.site;
  return site[1] === directrix ? site[0] : Infinity;
}

var epsilon$1 = 1e-6;
var epsilon2$1 = 1e-12;
var beaches;
var cells;
var circles;
var edges;

function triangleArea(a, b, c) {
  return (a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]);
}

function lexicographic(a, b) {
  return b[1] - a[1] || b[0] - a[0];
}

function Diagram(sites, extent) {
  var site = sites.sort(lexicographic).pop(),
      x,
      y,
      circle;

  edges = [];
  cells = new Array(sites.length);
  beaches = new RedBlackTree();
  circles = new RedBlackTree();

  while (true) {
    circle = firstCircle;
    if (site && (!circle || site[1] < circle.y || site[1] === circle.y && site[0] < circle.x)) {
      if (site[0] !== x || site[1] !== y) {
        addBeach(site);
        x = site[0], y = site[1];
      }
      site = sites.pop();
    } else if (circle) {
      removeBeach(circle.arc);
    } else {
      break;
    }
  }

  sortCellHalfedges();

  if (extent) {
    var x0 = +extent[0][0],
        y0 = +extent[0][1],
        x1 = +extent[1][0],
        y1 = +extent[1][1];
    clipEdges(x0, y0, x1, y1);
    clipCells(x0, y0, x1, y1);
  }

  this.edges = edges;
  this.cells = cells;

  beaches = circles = edges = cells = null;
}

Diagram.prototype = {
  constructor: Diagram,

  polygons: function polygons() {
    var edges = this.edges;

    return this.cells.map(function (cell) {
      var polygon = cell.halfedges.map(function (i) {
        return cellHalfedgeStart(cell, edges[i]);
      });
      polygon.data = cell.site.data;
      return polygon;
    });
  },

  triangles: function triangles() {
    var triangles = [],
        edges = this.edges;

    this.cells.forEach(function (cell, i) {
      if (!(m = (halfedges = cell.halfedges).length)) return;
      var site = cell.site,
          halfedges,
          j = -1,
          m,
          s0,
          e1 = edges[halfedges[m - 1]],
          s1 = e1.left === site ? e1.right : e1.left;

      while (++j < m) {
        s0 = s1;
        e1 = edges[halfedges[j]];
        s1 = e1.left === site ? e1.right : e1.left;
        if (s0 && s1 && i < s0.index && i < s1.index && triangleArea(site, s0, s1) < 0) {
          triangles.push([site.data, s0.data, s1.data]);
        }
      }
    });

    return triangles;
  },

  links: function links() {
    return this.edges.filter(function (edge) {
      return edge.right;
    }).map(function (edge) {
      return {
        source: edge.left.data,
        target: edge.right.data
      };
    });
  },

  find: function find(x, y, radius) {
    var that = this,
        i0,
        i1 = that._found || 0,
        n = that.cells.length,
        cell;

    // Use the previously-found cell, or start with an arbitrary one.
    while (!(cell = that.cells[i1])) {
      if (++i1 >= n) return null;
    }var dx = x - cell.site[0],
        dy = y - cell.site[1],
        d2 = dx * dx + dy * dy;

    // Traverse the half-edges to find a closer cell, if any.
    do {
      cell = that.cells[i0 = i1], i1 = null;
      cell.halfedges.forEach(function (e) {
        var edge = that.edges[e],
            v = edge.left;
        if ((v === cell.site || !v) && !(v = edge.right)) return;
        var vx = x - v[0],
            vy = y - v[1],
            v2 = vx * vx + vy * vy;
        if (v2 < d2) d2 = v2, i1 = v.index;
      });
    } while (i1 !== null);

    that._found = i0;

    return radius == null || d2 <= radius * radius ? cell.site : null;
  }
};

var voronoi = function () {
  var x$$1 = x,
      y$$1 = y,
      extent = null;

  function voronoi(data) {
    return new Diagram(data.map(function (d, i) {
      var s = [Math.round(x$$1(d, i, data) / epsilon$1) * epsilon$1, Math.round(y$$1(d, i, data) / epsilon$1) * epsilon$1];
      s.index = i;
      s.data = d;
      return s;
    }), extent);
  }

  voronoi.polygons = function (data) {
    return voronoi(data).polygons();
  };

  voronoi.links = function (data) {
    return voronoi(data).links();
  };

  voronoi.triangles = function (data) {
    return voronoi(data).triangles();
  };

  voronoi.x = function (_) {
    return arguments.length ? (x$$1 = typeof _ === "function" ? _ : constant$4(+_), voronoi) : x$$1;
  };

  voronoi.y = function (_) {
    return arguments.length ? (y$$1 = typeof _ === "function" ? _ : constant$4(+_), voronoi) : y$$1;
  };

  voronoi.extent = function (_) {
    return arguments.length ? (extent = _ == null ? null : [[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]], voronoi) : extent && [[extent[0][0], extent[0][1]], [extent[1][0], extent[1][1]]];
  };

  voronoi.size = function (_) {
    return arguments.length ? (extent = _ == null ? null : [[0, 0], [+_[0], +_[1]]], voronoi) : extent && [extent[1][0] - extent[0][0], extent[1][1] - extent[0][1]];
  };

  return voronoi;
};

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var THUMB_SIZE = 11;
var MARGIN = THUMB_SIZE;

function dateSlider() {
  var range$$1 = [0, 1],
      step = 1;

  var x = point$1();

  var listeners = dispatch("change");

  function component(sel) {
    sel.attr("viewBox", function () {
      var _getBoundingClientRec = this.getBoundingClientRect(),
          width = _getBoundingClientRec.width;

      x.domain(sequence(range$$1[0], range$$1[1] + step, step)).range([MARGIN, width - MARGIN * 2]);

      return "0 0 " + width + " 60";
    });

    var slider = sel.selectAll(".slider").data(function (d) {
      return [d];
    }),
        sliderEnter = slider.enter().append("g").attr("class", "slider");

    sliderEnter.append("rect").attr("class", "track track--bg").attr("x", MARGIN).attr("y", 4).attr("height", 4);

    sliderEnter.append("rect").attr("class", "track track--selection").attr("y", 4).attr("height", 4);

    slider = slider.merge(sliderEnter);

    slider.select(".track--bg").attr("width", function () {
      var _x$range = x.range(),
          _x$range2 = _slicedToArray(_x$range, 2),
          lower = _x$range2[0],
          upper = _x$range2[1];

      return upper - lower;
    });

    slider.select(".track--selection").attr("x", function (d) {
      return x(d[0]);
    }).attr("width", function (d) {
      return x(d[1]) - x(d[0]);
    });

    var thumb = slider.selectAll("[role=slider]").data(function (d) {
      return d;
    });

    thumb.enter().append("circle").attr("role", "slider").attr("r", THUMB_SIZE / 2).attr("cy", THUMB_SIZE / 2).merge(thumb).attr("cx", function (d) {
      return x(d);
    });

    var axis = sel.selectAll(".axis--x").data(function (d) {
      return [d];
    });

    // Initialize the axis
    axis = axis.enter().append("g").attr("class", "axis--x").attr("transform", "translate(0, 15)").merge(axis).call(axisBottom(x).tickSize(28).tickPadding(4).tickFormat(String)).attr("font-size", null);

    // Modify the axis to suit our style
    axis.selectAll(".domain").remove();

    axis.selectAll(".axis--selection text").remove();

    var minorTicks = axis.selectAll(".tick").filter(function (d) {
      return d % 10;
    }).classed("tick--minor", true);

    minorTicks.select("text").remove();
    minorTicks.select("line").attr("y2", 18);

    sel.call(function (s) {
      var _s$datum = s.datum(),
          _s$datum2 = _slicedToArray(_s$datum, 2),
          lower = _s$datum2[0],
          upper = _s$datum2[1];

      s.selectAll(".tick").classed("tick--selection", function (d) {
        return d >= lower && d <= upper;
      });
    });

    var cells = voronoi().size([x.range()[1] + MARGIN * 2, 60]).x(function (d) {
      return x(d);
    }).y(30);

    var interaction = sel.selectAll(".interaction").data([cells.polygons(x.domain())]);

    var path = interaction.enter().append("g").attr("class", "interaction").merge(interaction).selectAll(".cell").data(function (d) {
      return d;
    });

    path.enter().append("path").attr("class", "cell").on("mousedown", function (d) {
      onMouseDown(sel, d);
    }).merge(path).attr("d", function (d) {
      return d ? "M" + d.join("L") + "Z" : null;
    });
  }

  component.on = function () {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? component : value;
  };

  component.range = function (_) {
    if (arguments.length < 1) return range$$1;
    range$$1 = _;
    return component;
  };

  component.step = function (_) {
    if (arguments.length < 1) return step;
    step = _;
    return component;
  };

  function onMouseDown(sel, d) {
    function cleanup() {
      sel.selectAll(".cell").on("mouseover", null);
    }

    function onMouseOver(d) {
      var value = lower ? [d.data, sel.datum()[1]] : [sel.datum()[0], d.data];

      if (value[1] - value[0] < step) {
        value = lower ? [d.data, d.data + step] : [d.data - step, d.data];
      }

      if (value[0] < range$$1[0] || value[1] > range$$1[1]) return;

      listeners.call("change", sel.node(), value);
    }

    var grabbing = void 0;

    var _mouse = mouse(sel.node()),
        _mouse2 = _slicedToArray(_mouse, 2),
        cx = _mouse2[0],
        cy = _mouse2[1];

    if (cy > THUMB_SIZE) return;

    var _sel$datum$map = sel.datum().map(x),
        _sel$datum$map2 = _slicedToArray(_sel$datum$map, 2),
        lx = _sel$datum$map2[0],
        ux = _sel$datum$map2[1],
        r = THUMB_SIZE / 2,
        lv = [cx - lx, cy - r],
        uv = [cx - ux, cy - r];

    if (lv[0] * lv[0] + lv[1] * lv[1] <= r * r) {
      grabbing = "lower";
    } else if (uv[0] * uv[0] + uv[1] * uv[1] <= r * r) {
      grabbing = "upper";
    }

    if (!grabbing) {
      var datum = sel.datum(),
          delta = datum[1] - datum[0];

      var value = [d.data, d.data + delta];

      if (value[1] > range$$1[1]) value = [range$$1[1] - delta, range$$1[1]];

      listeners.call("change", sel.node(), value);
      return;
    }

    var lower = grabbing === "lower";

    sel.selectAll(".cell").on("mouseover", onMouseOver);
    window.addEventListener("mouseup", cleanup, { once: true, passive: true });
  }

  return component;
}

var pi = Math.PI;
var tau = 2 * pi;
var epsilon$2 = 1e-6;
var tauEpsilon = tau - epsilon$2;

function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = "";
}

function path() {
  return new Path();
}

Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function moveTo(x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function lineTo(x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function quadraticCurveTo(x1, y1, x, y) {
    this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function arcTo(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon$2)) {}

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$2) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
            var x20 = x2 - x0,
                y20 = y2 - y0,
                l21_2 = x21 * x21 + y21 * y21,
                l20_2 = x20 * x20 + y20 * y20,
                l21 = Math.sqrt(l21_2),
                l01 = Math.sqrt(l01_2),
                l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
                t01 = l / l01,
                t21 = l / l21;

            // If the start tangent is not coincident with (x0,y0), line to.
            if (Math.abs(t01 - 1) > epsilon$2) {
              this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
            }

            this._ += "A" + r + "," + r + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
          }
  },
  arc: function arc(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon$2 || Math.abs(this._y1 - y0) > epsilon$2) {
        this._ += "L" + x0 + "," + y0;
      }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) da = da % tau + tau;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    }

    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon$2) {
        this._ += "A" + r + "," + r + ",0," + +(da >= pi) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
      }
  },
  rect: function rect(x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z";
  },
  toString: function toString() {
    return this._;
  }
};

var constant$5 = function (x) {
  return function constant() {
    return x;
  };
};

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2; // proceed
      default:
        this._context.lineTo(x, y);break;
    }
  }
};

var curveLinear = function (context) {
  return new Linear(context);
};

function x$1(p) {
  return p[0];
}

function y$1(p) {
  return p[1];
}

var line = function () {
  var x$$1 = x$1,
      y$$1 = y$1,
      defined = constant$5(true),
      context = null,
      curve = curveLinear,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();else output.lineEnd();
      }
      if (defined0) output.point(+x$$1(d, i, data), +y$$1(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function (_) {
    return arguments.length ? (x$$1 = typeof _ === "function" ? _ : constant$5(+_), line) : x$$1;
  };

  line.y = function (_) {
    return arguments.length ? (y$$1 = typeof _ === "function" ? _ : constant$5(+_), line) : y$$1;
  };

  line.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$5(!!_), line) : defined;
  };

  line.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
};

var area = function () {
  var x0 = x$1,
      x1 = null,
      y0 = constant$5(0),
      y1 = y$1,
      defined = constant$5(true),
      context = null,
      curve = curveLinear,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line().defined(defined).curve(curve).context(context);
  }

  area.x = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$5(+_), x1 = null, area) : x0;
  };

  area.x0 = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$5(+_), area) : x0;
  };

  area.x1 = function (_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$5(+_), area) : x1;
  };

  area.y = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$5(+_), y1 = null, area) : y0;
  };

  area.y0 = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$5(+_), area) : y0;
  };

  area.y1 = function (_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$5(+_), area) : y1;
  };

  area.lineX0 = area.lineY0 = function () {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function () {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function () {
    return arealine().x(x1).y(y0);
  };

  area.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$5(!!_), area) : defined;
  };

  area.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
};

function sign(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function _point$3(that, t0, t1) {
  var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}

function MonotoneX(context) {
  this._context = context;
}

MonotoneX.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);break;
      case 3:
        _point$3(this, this._t0, slope2(this, this._t0));break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    var t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;_point$3(this, slope2(this, t1 = slope3(this, x, y)), t1);break;
      default:
        _point$3(this, this._t0, t1 = slope3(this, x, y));break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
};

function MonotoneY(context) {
  this._context = new ReflectContext(context);
}

(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function (x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};

function ReflectContext(context) {
  this._context = context;
}

ReflectContext.prototype = {
  moveTo: function moveTo(x, y) {
    this._context.moveTo(y, x);
  },
  closePath: function closePath() {
    this._context.closePath();
  },
  lineTo: function lineTo(x, y) {
    this._context.lineTo(y, x);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
  }
};

function bounds(arr) {
  return [arr[0], arr[arr.length - 1]];
}

function areaChart() {
  var _line = line(),
      _area = area();

  function chart(sel) {
    var series = sel.selectAll(".series").data(function (d) {
      return [d];
    });

    series.exit().remove();

    series = series.enter().append("g").attr("class", "series").merge(series);

    var fill = series.selectAll(".area-fill").data(function (d) {
      return [d.values];
    });

    fill.enter().append("path").attr("class", "area-fill").merge(fill).attr("d", _area);

    var stroke = series.selectAll(".area-stroke").data(function (d) {
      return [d.values];
    });

    stroke.enter().append("path").attr("class", "area-stroke").merge(stroke).attr("d", _line);

    var point = series.selectAll(".point").data(function (d) {
      return bounds(d.values);
    });
    var text = point.select("text");

    point.exit().remove();

    var pointEnter = point.enter().append("g").attr("class", "point");

    pointEnter.append("circle").attr("r", 4);

    text.merge(pointEnter.append("text").html("<tspan></tspan><tspan></tspan>")).attr("text-anchor", function (d, i) {
      return i === 0 ? "end" : "start";
    }).attr("transform", function (d, i) {
      return "translate(" + (i === 0 ? -8 : 8) + ", 0)";
    }).selectAll("tspan").data(function (d) {
      return [d.key, d.value];
    }).attr("x", 0).attr("dy", function (d, i) {
      return i * 1.2 + "em";
    }).text(String);

    point.merge(pointEnter).attr("transform", function (d) {
      return "translate(" + _line.x()(d) + ", " + _line.y()(d) + ")";
    });
  }

  chart.x = function (_) {
    if (arguments.length < 1) return _line.x();
    _line.x(_);
    _area.x(_);
    return chart;
  };

  chart.y0 = function (_) {
    if (arguments.length < 1) return _area.y0();
    _area.y0(_);
    return chart;
  };

  chart.y1 = function (_) {
    if (arguments.length < 1) return _area.y1();
    _line.y(_);
    _area.y1(_);
    return chart;
  };

  return chart;
}

var THICKNESS = 2;

function sparkline(sel) {
  sel.each(function (data) {
    var el = select(this);

    var svg = el.selectAll("svg").data([data]);

    var svgEnter = svg.enter().append("svg");
    svgEnter.append("path");

    var width = void 0,
        height = void 0;

    svg = svg.merge(svgEnter).attr("viewBox", function () {
      var bbox = this.getBoundingClientRect();

      width = bbox.width;
      height = bbox.height;

      return "0 0 " + width + " " + height;
    });

    var x = linear().domain(extent(data, function (d) {
      return d[0];
    })).range([THICKNESS, width - 2 * THICKNESS]);

    var y = linear().domain(extent(data, function (d) {
      return d[1];
    })).range([height - 2 * THICKNESS, THICKNESS]);

    var pathString = line().x(function (d) {
      return x(d[0]);
    }).y(function (d) {
      return y(d[1]);
    });

    svg.select("path").style("stroke-width", THICKNESS + "px").attr("d", pathString);

    var bounds = [data[0], data[data.length - 1]];
    var circle = svg.selectAll("circle").data(bounds);

    circle.enter().append("circle").attr("r", THICKNESS).merge(circle).attr("cx", function (d) {
      return x(d[0]);
    }).attr("cy", function (d) {
      return y(d[1]);
    });
  });
}

var COLUMN_DEFAULTS = {
  classNames: "",
  format: String,
  name: "",
  value: function value(d) {
    return d;
  }
};

function table() {
  var columns = [],
      reverse = false,
      sortBy = void 0;

  function chart(sel) {
    var thead = sel.selectAll("thead").data([columns]);
    var th = thead.select("tr").merge(thead.enter().append("thead").append("tr")).selectAll("th").data(function (d) {
      return d;
    });

    th.enter().append("th").merge(th).attr("class", function (d) {
      return d.classNames;
    }).text(function (d) {
      return d.name;
    });

    var tbody = sel.selectAll("tbody").data(function (rows) {
      return [rows];
    });
    var tr = tbody.merge(tbody.enter().append("tbody")).selectAll("tr").data(function (d) {
      return d;
    });

    var td = tr.enter().append("tr").merge(tr).sort(compareRows).selectAll("td").data(function (d) {
      return columns.map(function (c) {
        return c.value(d);
      });
    });

    td.merge(td.enter().append("td")).attr("class", function (d, i) {
      return columns[i].classNames;
    }).text(function (d, i) {
      return columns[i].format(d);
    });
  }

  chart.columns = function (_) {
    if (arguments.length < 1) return columns;
    columns = _.map(function (d) {
      return Object.assign({}, COLUMN_DEFAULTS, d);
    });
    return chart;
  };

  chart.reverse = function (_) {
    if (arguments.length < 1) return reverse;
    reverse = _;
    return chart;
  };

  chart.sortBy = function (_) {
    if (arguments.length < 1) return sortBy;
    sortBy = _;
    return chart;
  };

  function compareRows(a, b) {
    if (!sortBy) return 0;

    var getter = columns[sortBy].value;

    return reverse ? descending(getter(a), getter(b)) : ascending(getter(a), getter(b));
  }

  return chart;
}

function priceTable(selection, data) {
  var period = extent(data, function (d) {
    return d.year;
  });

  var caption = selection.selectAll("figcaption").data([undefined]);
  caption.enter().append("figcaption").text("Individual material prices");

  var rows = nest().key(function (d) {
    return d.type;
  }).sortValues(function (a, b) {
    return a.year - b.year;
  }).entries(data);

  var dollars = format("$.2f");

  var prices = table().sortBy(4).columns([{
    value: function value(d) {
      return d.key.split(" ")[0];
    }
  }, {
    classNames: "numeric",
    format: dollars,
    name: period[0],
    value: function value(d) {
      return d.values[0].value;
    }
  }, {
    classNames: "sparkline",
    format: function format() {
      return null;
    },
    value: function value(d) {
      return d.values.map(function (v) {
        return [v.year, v.value];
      });
    }
  }, {
    classNames: "numeric",
    format: dollars,
    name: period[1],
    value: function value(d) {
      return d.values[d.values.length - 1].value;
    }
  }, {
    classNames: "numeric",
    format: dollars,
    name: "Change",
    value: function value(d) {
      return d.values[d.values.length - 1].value - d.values[0].value;
    }
  }]);

  var t = selection.selectAll("table").data([rows]);
  t.merge(t.enter().append("table")).call(prices).selectAll("td.sparkline").call(sparkline);
}

function margin(m) {
  return function (sel) {
    var g = sel.selectAll(".margin").data([m]);

    g.enter().append("g").attr("class", "margin").merge(g).attr("transform", "translate(" + (m.left || 0) + ", " + (m.top || 0) + ")");
  };
}

var dollars = format("$.0f");

function captionText(d) {
  if (d.delta === 0) {
    return "The total value of the materials was the same in\n      " + d.period[1] + " as in " + d.period[0];
  }

  var amount = Math.abs(d.delta),
      adjective = d.delta < 0 ? "lower" : "higher";

  return "The total value of the materials was " + dollars(amount) + " " + adjective + "\n    in " + d.period[1] + " than in " + d.period[0];
}

function totalValue() {
  var _data = [];

  var _margin = {
    top: 18,
    left: 46,
    bottom: 18,
    right: 46
  };

  var _chart = areaChart();

  function component(selection) {
    var period = extent(_data, function (d) {
      return d.key;
    });

    var delta = _data.filter(function (d) {
      return period.indexOf(d.key) > -1;
    }).sort(function (a, b) {
      return b.key - a.key;
    }).map(function (d) {
      return d.value;
    }).reduce(function (a, b) {
      return a - b;
    });

    var caption = selection.selectAll("figcaption").data([{ period: period, delta: delta }]);

    caption.enter().append("figcaption").merge(caption).text(captionText);

    var width = 0,
        height = 0;

    var svg = selection.selectAll("svg").data([{ series: "total", values: _data }]);

    svg = svg.enter().append("svg").merge(svg).attr("viewBox", function () {
      var bbox = this.getBoundingClientRect(),
          aspect = window.innerWidth / window.innerHeight;

      width = bbox.width;
      height = Math.min(width, width / aspect);

      return "0 0 " + width + " " + height;
    }).call(margin(_margin));

    var x = linear().domain(period).range([0, width - _margin.left - _margin.right]);

    var y = linear().domain(extent(_data, function (d) {
      return d.value;
    })).range([height - _margin.top - _margin.bottom, 0]);

    _chart.x(function (d) {
      return x(d.key);
    }).y0(y(_data[0].value)).y1(function (d) {
      return y(d.value);
    });

    svg.selectAll(".margin").style("stroke", "#EBAF6A").style("fill", "#EBAF6A").data(function (d) {
      return [d];
    }).call(_chart);
  }

  component.data = function (_) {
    if (arguments.length < 1) return _data;

    _data = nest().key(function (d) {
      return d.year;
    }).rollup(function (values) {
      return sum(values, function (d) {
        return d.value;
      });
    }).entries(_);

    return component;
  };

  return component;
}

/**
 * Return price-normalized data for each material in priceData over specified
 * period.
 */
function simonEhrlichWager(priceData) {
  var startYear = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1980;
  var endYear = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1990;
  var initialValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;


  var periodData = priceData.filter(function (d) {
    return d.year >= startYear && d.year <= endYear;
  });

  var materialPrices = nest().key(function (d) {
    return d.type;
  }).sortValues(function (a, b) {
    return a.year - b.year;
  }).entries(periodData);

  var initialMaterialValue = initialValue / materialPrices.length;

  var initialAmounts = new Map(materialPrices.map(function (e) {
    return [e.key, initialMaterialValue / e.values[0].price];
  }));

  return periodData.map(function (d) {
    var amount = initialAmounts.get(d.type) || 0;
    return Object.assign({ amount: amount, value: d.price * amount }, d);
  });
}

var prices = [{ "year": 1900, "type": "Tin (98$/t)", "price": 12900 }, { "year": 1900, "type": "Copper (98$/t)", "price": 7000 }, { "year": 1900, "type": "Nickel (98$/t)", "price": 22000 }, { "year": 1900, "type": "Tungsten (98$/t)", "price": 11000 }, { "year": 1900, "type": "Chromium (98$/t)", "price": 1090 }, { "year": 1901, "type": "Tin (98$/t)", "price": 7220 }, { "year": 1901, "type": "Copper (98$/t)", "price": 7000 }, { "year": 1901, "type": "Nickel (98$/t)", "price": 24000 }, { "year": 1901, "type": "Tungsten (98$/t)", "price": 7000 }, { "year": 1901, "type": "Chromium (98$/t)", "price": 1160 }, { "year": 1902, "type": "Tin (98$/t)", "price": 11200 }, { "year": 1902, "type": "Copper (98$/t)", "price": 4800 }, { "year": 1902, "type": "Nickel (98$/t)", "price": 19000 }, { "year": 1902, "type": "Tungsten (98$/t)", "price": 8000 }, { "year": 1902, "type": "Chromium (98$/t)", "price": 882 }, { "year": 1903, "type": "Tin (98$/t)", "price": 11300 }, { "year": 1903, "type": "Copper (98$/t)", "price": 5300 }, { "year": 1903, "type": "Nickel (98$/t)", "price": 16000 }, { "year": 1903, "type": "Tungsten (98$/t)", "price": 6300 }, { "year": 1903, "type": "Chromium (98$/t)", "price": 765 }, { "year": 1904, "type": "Tin (98$/t)", "price": 11200 }, { "year": 1904, "type": "Copper (98$/t)", "price": 5100 }, { "year": 1904, "type": "Nickel (98$/t)", "price": 16000 }, { "year": 1904, "type": "Tungsten (98$/t)", "price": 10000 }, { "year": 1904, "type": "Chromium (98$/t)", "price": 836 }, { "year": 1905, "type": "Tin (98$/t)", "price": 12600 }, { "year": 1905, "type": "Copper (98$/t)", "price": 6300 }, { "year": 1905, "type": "Nickel (98$/t)", "price": 16000 }, { "year": 1905, "type": "Tungsten (98$/t)", "price": 14000 }, { "year": 1905, "type": "Chromium (98$/t)", "price": 769 }, { "year": 1906, "type": "Tin (98$/t)", "price": 15900 }, { "year": 1906, "type": "Copper (98$/t)", "price": 7700 }, { "year": 1906, "type": "Nickel (98$/t)", "price": 16000 }, { "year": 1906, "type": "Tungsten (98$/t)", "price": 16000 }, { "year": 1906, "type": "Chromium (98$/t)", "price": 738 }, { "year": 1907, "type": "Tin (98$/t)", "price": 14800 }, { "year": 1907, "type": "Copper (98$/t)", "price": 7700 }, { "year": 1907, "type": "Nickel (98$/t)", "price": 17000 }, { "year": 1907, "type": "Tungsten (98$/t)", "price": 22000 }, { "year": 1907, "type": "Chromium (98$/t)", "price": 652 }, { "year": 1908, "type": "Tin (98$/t)", "price": 11800 }, { "year": 1908, "type": "Copper (98$/t)", "price": 5300 }, { "year": 1908, "type": "Nickel (98$/t)", "price": 18000 }, { "year": 1908, "type": "Tungsten (98$/t)", "price": 14000 }, { "year": 1908, "type": "Chromium (98$/t)", "price": 731 }, { "year": 1909, "type": "Tin (98$/t)", "price": 11900 }, { "year": 1909, "type": "Copper (98$/t)", "price": 5300 }, { "year": 1909, "type": "Nickel (98$/t)", "price": 16000 }, { "year": 1909, "type": "Tungsten (98$/t)", "price": 16000 }, { "year": 1909, "type": "Chromium (98$/t)", "price": 685 }, { "year": 1910, "type": "Tin (98$/t)", "price": 13200 }, { "year": 1910, "type": "Copper (98$/t)", "price": 5000 }, { "year": 1910, "type": "Nickel (98$/t)", "price": 15000 }, { "year": 1910, "type": "Tungsten (98$/t)", "price": 18700 }, { "year": 1910, "type": "Chromium (98$/t)", "price": 608 }, { "year": 1911, "type": "Tin (98$/t)", "price": 16400 }, { "year": 1911, "type": "Copper (98$/t)", "price": 4900 }, { "year": 1911, "type": "Nickel (98$/t)", "price": 15000 }, { "year": 1911, "type": "Tungsten (98$/t)", "price": 15000 }, { "year": 1911, "type": "Chromium (98$/t)", "price": 603 }, { "year": 1912, "type": "Tin (98$/t)", "price": 17200 }, { "year": 1912, "type": "Copper (98$/t)", "price": 6200 }, { "year": 1912, "type": "Nickel (98$/t)", "price": 15000 }, { "year": 1912, "type": "Tungsten (98$/t)", "price": 14800 }, { "year": 1912, "type": "Chromium (98$/t)", "price": 498 }, { "year": 1913, "type": "Tin (98$/t)", "price": 16100 }, { "year": 1913, "type": "Copper (98$/t)", "price": 5630 }, { "year": 1913, "type": "Nickel (98$/t)", "price": 15300 }, { "year": 1913, "type": "Tungsten (98$/t)", "price": 16600 }, { "year": 1913, "type": "Chromium (98$/t)", "price": 501 }, { "year": 1914, "type": "Tin (98$/t)", "price": 12300 }, { "year": 1914, "type": "Copper (98$/t)", "price": 4760 }, { "year": 1914, "type": "Nickel (98$/t)", "price": 14700 }, { "year": 1914, "type": "Tungsten (98$/t)", "price": 16600 }, { "year": 1914, "type": "Chromium (98$/t)", "price": 449 }, { "year": 1915, "type": "Tin (98$/t)", "price": 13700 }, { "year": 1915, "type": "Copper (98$/t)", "price": 6180 }, { "year": 1915, "type": "Nickel (98$/t)", "price": 14600 }, { "year": 1915, "type": "Tungsten (98$/t)", "price": 65800 }, { "year": 1915, "type": "Chromium (98$/t)", "price": 526 }, { "year": 1916, "type": "Tin (98$/t)", "price": 14300 }, { "year": 1916, "type": "Copper (98$/t)", "price": 9360 }, { "year": 1916, "type": "Nickel (98$/t)", "price": 13800 }, { "year": 1916, "type": "Tungsten (98$/t)", "price": 70700 }, { "year": 1916, "type": "Chromium (98$/t)", "price": 660 }, { "year": 1917, "type": "Tin (98$/t)", "price": 17400 }, { "year": 1917, "type": "Copper (98$/t)", "price": 8190 }, { "year": 1917, "type": "Nickel (98$/t)", "price": 11800 }, { "year": 1917, "type": "Tungsten (98$/t)", "price": 32600 }, { "year": 1917, "type": "Chromium (98$/t)", "price": 750 }, { "year": 1918, "type": "Tin (98$/t)", "price": 21100 }, { "year": 1918, "type": "Copper (98$/t)", "price": 5890 }, { "year": 1918, "type": "Nickel (98$/t)", "price": 9760 }, { "year": 1918, "type": "Tungsten (98$/t)", "price": 34900 }, { "year": 1918, "type": "Chromium (98$/t)", "price": 1280 }, { "year": 1919, "type": "Tin (98$/t)", "price": 13200 }, { "year": 1919, "type": "Copper (98$/t)", "price": 3780 }, { "year": 1919, "type": "Nickel (98$/t)", "price": 8320 }, { "year": 1919, "type": "Tungsten (98$/t)", "price": 23600 }, { "year": 1919, "type": "Chromium (98$/t)", "price": 680 }, { "year": 1920, "type": "Tin (98$/t)", "price": 8660 }, { "year": 1920, "type": "Copper (98$/t)", "price": 3140 }, { "year": 1920, "type": "Nickel (98$/t)", "price": 7530 }, { "year": 1920, "type": "Tungsten (98$/t)", "price": 8910 }, { "year": 1920, "type": "Chromium (98$/t)", "price": 333 }, { "year": 1921, "type": "Tin (98$/t)", "price": 5990 }, { "year": 1921, "type": "Copper (98$/t)", "price": 2540 }, { "year": 1921, "type": "Nickel (98$/t)", "price": 8420 }, { "year": 1921, "type": "Tungsten (98$/t)", "price": 10900 }, { "year": 1921, "type": "Chromium (98$/t)", "price": 232 }, { "year": 1922, "type": "Tin (98$/t)", "price": 6980 }, { "year": 1922, "type": "Copper (98$/t)", "price": 2900 }, { "year": 1922, "type": "Nickel (98$/t)", "price": 8140 }, { "year": 1922, "type": "Tungsten (98$/t)", "price": 12600 }, { "year": 1922, "type": "Chromium (98$/t)", "price": 255 }, { "year": 1923, "type": "Tin (98$/t)", "price": 8960 }, { "year": 1923, "type": "Copper (98$/t)", "price": 3100 }, { "year": 1923, "type": "Nickel (98$/t)", "price": 7560 }, { "year": 1923, "type": "Tungsten (98$/t)", "price": 13300 }, { "year": 1923, "type": "Chromium (98$/t)", "price": 265 }, { "year": 1924, "type": "Tin (98$/t)", "price": 10500 }, { "year": 1924, "type": "Copper (98$/t)", "price": 2790 }, { "year": 1924, "type": "Nickel (98$/t)", "price": 6300 }, { "year": 1924, "type": "Tungsten (98$/t)", "price": 11200 }, { "year": 1924, "type": "Chromium (98$/t)", "price": 280 }, { "year": 1925, "type": "Tin (98$/t)", "price": 11900 }, { "year": 1925, "type": "Copper (98$/t)", "price": 2920 }, { "year": 1925, "type": "Nickel (98$/t)", "price": 6800 }, { "year": 1925, "type": "Tungsten (98$/t)", "price": 13700 }, { "year": 1925, "type": "Chromium (98$/t)", "price": 239 }, { "year": 1926, "type": "Tin (98$/t)", "price": 13200 }, { "year": 1926, "type": "Copper (98$/t)", "price": 2840 }, { "year": 1926, "type": "Nickel (98$/t)", "price": 7280 }, { "year": 1926, "type": "Tungsten (98$/t)", "price": 14200 }, { "year": 1926, "type": "Chromium (98$/t)", "price": 232 }, { "year": 1927, "type": "Tin (98$/t)", "price": 13300 }, { "year": 1927, "type": "Copper (98$/t)", "price": 2690 }, { "year": 1927, "type": "Nickel (98$/t)", "price": 7220 }, { "year": 1927, "type": "Tungsten (98$/t)", "price": 13500 }, { "year": 1927, "type": "Chromium (98$/t)", "price": 235 }, { "year": 1928, "type": "Tin (98$/t)", "price": 10600 }, { "year": 1928, "type": "Copper (98$/t)", "price": 3110 }, { "year": 1928, "type": "Nickel (98$/t)", "price": 7770 }, { "year": 1928, "type": "Tungsten (98$/t)", "price": 13800 }, { "year": 1928, "type": "Chromium (98$/t)", "price": 240 }, { "year": 1929, "type": "Tin (98$/t)", "price": 9490 }, { "year": 1929, "type": "Copper (98$/t)", "price": 3850 }, { "year": 1929, "type": "Nickel (98$/t)", "price": 7350 }, { "year": 1929, "type": "Tungsten (98$/t)", "price": 17400 }, { "year": 1929, "type": "Chromium (98$/t)", "price": 255 }, { "year": 1930, "type": "Tin (98$/t)", "price": 6850 }, { "year": 1930, "type": "Copper (98$/t)", "price": 2860 }, { "year": 1930, "type": "Nickel (98$/t)", "price": 7570 }, { "year": 1930, "type": "Tungsten (98$/t)", "price": 16400 }, { "year": 1930, "type": "Chromium (98$/t)", "price": 334 }, { "year": 1931, "type": "Tin (98$/t)", "price": 5790 }, { "year": 1931, "type": "Copper (98$/t)", "price": 1980 }, { "year": 1931, "type": "Nickel (98$/t)", "price": 8270 }, { "year": 1931, "type": "Tungsten (98$/t)", "price": 16400 }, { "year": 1931, "type": "Chromium (98$/t)", "price": 498 }, { "year": 1932, "type": "Tin (98$/t)", "price": 5770 }, { "year": 1932, "type": "Copper (98$/t)", "price": 1520 }, { "year": 1932, "type": "Nickel (98$/t)", "price": 9190 }, { "year": 1932, "type": "Tungsten (98$/t)", "price": 15200 }, { "year": 1932, "type": "Chromium (98$/t)", "price": 635 }, { "year": 1933, "type": "Tin (98$/t)", "price": 10800 }, { "year": 1933, "type": "Copper (98$/t)", "price": 2020 }, { "year": 1933, "type": "Nickel (98$/t)", "price": 9670 }, { "year": 1933, "type": "Tungsten (98$/t)", "price": 16700 }, { "year": 1933, "type": "Chromium (98$/t)", "price": 503 }, { "year": 1934, "type": "Tin (98$/t)", "price": 14000 }, { "year": 1934, "type": "Copper (98$/t)", "price": 2330 }, { "year": 1934, "type": "Nickel (98$/t)", "price": 9390 }, { "year": 1934, "type": "Tungsten (98$/t)", "price": 24600 }, { "year": 1934, "type": "Chromium (98$/t)", "price": 480 }, { "year": 1935, "type": "Tin (98$/t)", "price": 13200 }, { "year": 1935, "type": "Copper (98$/t)", "price": 2330 }, { "year": 1935, "type": "Nickel (98$/t)", "price": 9190 }, { "year": 1935, "type": "Tungsten (98$/t)", "price": 22100 }, { "year": 1935, "type": "Chromium (98$/t)", "price": 530 }, { "year": 1936, "type": "Tin (98$/t)", "price": 12000 }, { "year": 1936, "type": "Copper (98$/t)", "price": 2520 }, { "year": 1936, "type": "Nickel (98$/t)", "price": 9050 }, { "year": 1936, "type": "Tungsten (98$/t)", "price": 24200 }, { "year": 1936, "type": "Chromium (98$/t)", "price": 529 }, { "year": 1937, "type": "Tin (98$/t)", "price": 13600 }, { "year": 1937, "type": "Copper (98$/t)", "price": 3350 }, { "year": 1937, "type": "Nickel (98$/t)", "price": 8740 }, { "year": 1937, "type": "Tungsten (98$/t)", "price": 30700 }, { "year": 1937, "type": "Chromium (98$/t)", "price": 482 }, { "year": 1938, "type": "Tin (98$/t)", "price": 10800 }, { "year": 1938, "type": "Copper (98$/t)", "price": 2610 }, { "year": 1938, "type": "Nickel (98$/t)", "price": 8930 }, { "year": 1938, "type": "Tungsten (98$/t)", "price": 27800 }, { "year": 1938, "type": "Chromium (98$/t)", "price": 494 }, { "year": 1939, "type": "Tin (98$/t)", "price": 13000 }, { "year": 1939, "type": "Copper (98$/t)", "price": 2900 }, { "year": 1939, "type": "Nickel (98$/t)", "price": 9050 }, { "year": 1939, "type": "Tungsten (98$/t)", "price": 27900 }, { "year": 1939, "type": "Chromium (98$/t)", "price": 477 }, { "year": 1940, "type": "Tin (98$/t)", "price": 12800 }, { "year": 1940, "type": "Copper (98$/t)", "price": 2960 }, { "year": 1940, "type": "Nickel (98$/t)", "price": 8990 }, { "year": 1940, "type": "Tungsten (98$/t)", "price": 33400 }, { "year": 1940, "type": "Chromium (98$/t)", "price": 486 }, { "year": 1941, "type": "Tin (98$/t)", "price": 12700 }, { "year": 1941, "type": "Copper (98$/t)", "price": 2930 }, { "year": 1941, "type": "Nickel (98$/t)", "price": 8560 }, { "year": 1941, "type": "Tungsten (98$/t)", "price": 36100 }, { "year": 1941, "type": "Chromium (98$/t)", "price": 455 }, { "year": 1942, "type": "Tin (98$/t)", "price": 11500 }, { "year": 1942, "type": "Copper (98$/t)", "price": 2650 }, { "year": 1942, "type": "Nickel (98$/t)", "price": 7050 }, { "year": 1942, "type": "Tungsten (98$/t)", "price": 33500 }, { "year": 1942, "type": "Chromium (98$/t)", "price": 562 }, { "year": 1943, "type": "Tin (98$/t)", "price": 10800 }, { "year": 1943, "type": "Copper (98$/t)", "price": 2500 }, { "year": 1943, "type": "Nickel (98$/t)", "price": 6650 }, { "year": 1943, "type": "Tungsten (98$/t)", "price": 32900 }, { "year": 1943, "type": "Chromium (98$/t)", "price": 617 }, { "year": 1944, "type": "Tin (98$/t)", "price": 10600 }, { "year": 1944, "type": "Copper (98$/t)", "price": 2450 }, { "year": 1944, "type": "Nickel (98$/t)", "price": 6530 }, { "year": 1944, "type": "Tungsten (98$/t)", "price": 30100 }, { "year": 1944, "type": "Chromium (98$/t)", "price": 651 }, { "year": 1945, "type": "Tin (98$/t)", "price": 10400 }, { "year": 1945, "type": "Copper (98$/t)", "price": 2410 }, { "year": 1945, "type": "Nickel (98$/t)", "price": 6410 }, { "year": 1945, "type": "Tungsten (98$/t)", "price": 29200 }, { "year": 1945, "type": "Chromium (98$/t)", "price": 634 }, { "year": 1946, "type": "Tin (98$/t)", "price": 10000 }, { "year": 1946, "type": "Copper (98$/t)", "price": 2580 }, { "year": 1946, "type": "Nickel (98$/t)", "price": 6430 }, { "year": 1946, "type": "Tungsten (98$/t)", "price": 23400 }, { "year": 1946, "type": "Chromium (98$/t)", "price": 434 }, { "year": 1947, "type": "Tin (98$/t)", "price": 12500 }, { "year": 1947, "type": "Copper (98$/t)", "price": 3420 }, { "year": 1947, "type": "Nickel (98$/t)", "price": 5640 }, { "year": 1947, "type": "Tungsten (98$/t)", "price": 23800 }, { "year": 1947, "type": "Chromium (98$/t)", "price": 466 }, { "year": 1948, "type": "Tin (98$/t)", "price": 14800 }, { "year": 1948, "type": "Copper (98$/t)", "price": 3320 }, { "year": 1948, "type": "Nickel (98$/t)", "price": 5370 }, { "year": 1948, "type": "Tungsten (98$/t)", "price": 24700 }, { "year": 1948, "type": "Chromium (98$/t)", "price": 513 }, { "year": 1949, "type": "Tin (98$/t)", "price": 15000 }, { "year": 1949, "type": "Copper (98$/t)", "price": 2940 }, { "year": 1949, "type": "Nickel (98$/t)", "price": 6040 }, { "year": 1949, "type": "Tungsten (98$/t)", "price": 25100 }, { "year": 1949, "type": "Chromium (98$/t)", "price": 522 }, { "year": 1950, "type": "Tin (98$/t)", "price": 14200 }, { "year": 1950, "type": "Copper (98$/t)", "price": 3210 }, { "year": 1950, "type": "Nickel (98$/t)", "price": 6700 }, { "year": 1950, "type": "Tungsten (98$/t)", "price": 26600 }, { "year": 1950, "type": "Chromium (98$/t)", "price": 503 }, { "year": 1951, "type": "Tin (98$/t)", "price": 17500 }, { "year": 1951, "type": "Copper (98$/t)", "price": 3400 }, { "year": 1951, "type": "Nickel (98$/t)", "price": 7440 }, { "year": 1951, "type": "Tungsten (98$/t)", "price": 53200 }, { "year": 1951, "type": "Chromium (98$/t)", "price": 501 }, { "year": 1952, "type": "Tin (98$/t)", "price": 16300 }, { "year": 1952, "type": "Copper (98$/t)", "price": 3310 }, { "year": 1952, "type": "Nickel (98$/t)", "price": 7730 }, { "year": 1952, "type": "Tungsten (98$/t)", "price": 54300 }, { "year": 1952, "type": "Chromium (98$/t)", "price": 580 }, { "year": 1953, "type": "Tin (98$/t)", "price": 12900 }, { "year": 1953, "type": "Copper (98$/t)", "price": 3910 }, { "year": 1953, "type": "Nickel (98$/t)", "price": 8050 }, { "year": 1953, "type": "Tungsten (98$/t)", "price": 53000 }, { "year": 1953, "type": "Chromium (98$/t)", "price": 669 }, { "year": 1954, "type": "Tin (98$/t)", "price": 12300 }, { "year": 1954, "type": "Copper (98$/t)", "price": 4000 }, { "year": 1954, "type": "Nickel (98$/t)", "price": 8180 }, { "year": 1954, "type": "Tungsten (98$/t)", "price": 52800 }, { "year": 1954, "type": "Chromium (98$/t)", "price": 516 }, { "year": 1955, "type": "Tin (98$/t)", "price": 12700 }, { "year": 1955, "type": "Copper (98$/t)", "price": 5040 }, { "year": 1955, "type": "Nickel (98$/t)", "price": 8900 }, { "year": 1955, "type": "Tungsten (98$/t)", "price": 52300 }, { "year": 1955, "type": "Chromium (98$/t)", "price": 523 }, { "year": 1956, "type": "Tin (98$/t)", "price": 13400 }, { "year": 1956, "type": "Copper (98$/t)", "price": 5540 }, { "year": 1956, "type": "Nickel (98$/t)", "price": 8560 }, { "year": 1956, "type": "Tungsten (98$/t)", "price": 48300 }, { "year": 1956, "type": "Chromium (98$/t)", "price": 577 }, { "year": 1957, "type": "Tin (98$/t)", "price": 12300 }, { "year": 1957, "type": "Copper (98$/t)", "price": 3840 }, { "year": 1957, "type": "Nickel (98$/t)", "price": 9480 }, { "year": 1957, "type": "Tungsten (98$/t)", "price": 19900 }, { "year": 1957, "type": "Chromium (98$/t)", "price": 652 }, { "year": 1958, "type": "Tin (98$/t)", "price": 11800 }, { "year": 1958, "type": "Copper (98$/t)", "price": 3280 }, { "year": 1958, "type": "Nickel (98$/t)", "price": 9210 }, { "year": 1958, "type": "Tungsten (98$/t)", "price": 13800 }, { "year": 1958, "type": "Chromium (98$/t)", "price": 631 }, { "year": 1959, "type": "Tin (98$/t)", "price": 12600 }, { "year": 1959, "type": "Copper (98$/t)", "price": 3820 }, { "year": 1959, "type": "Nickel (98$/t)", "price": 9110 }, { "year": 1959, "type": "Tungsten (98$/t)", "price": 16000 }, { "year": 1959, "type": "Chromium (98$/t)", "price": 756 }, { "year": 1960, "type": "Tin (98$/t)", "price": 12300 }, { "year": 1960, "type": "Copper (98$/t)", "price": 3920 }, { "year": 1960, "type": "Nickel (98$/t)", "price": 8960 }, { "year": 1960, "type": "Tungsten (98$/t)", "price": 17100 }, { "year": 1960, "type": "Chromium (98$/t)", "price": 476 }, { "year": 1961, "type": "Tin (98$/t)", "price": 13700 }, { "year": 1961, "type": "Copper (98$/t)", "price": 3630 }, { "year": 1961, "type": "Nickel (98$/t)", "price": 9400 }, { "year": 1961, "type": "Tungsten (98$/t)", "price": 16200 }, { "year": 1961, "type": "Chromium (98$/t)", "price": 379 }, { "year": 1962, "type": "Tin (98$/t)", "price": 13700 }, { "year": 1962, "type": "Copper (98$/t)", "price": 3670 }, { "year": 1962, "type": "Nickel (98$/t)", "price": 9510 }, { "year": 1962, "type": "Tungsten (98$/t)", "price": 17300 }, { "year": 1962, "type": "Chromium (98$/t)", "price": 673 }, { "year": 1963, "type": "Tin (98$/t)", "price": 13700 }, { "year": 1963, "type": "Copper (98$/t)", "price": 3640 }, { "year": 1963, "type": "Nickel (98$/t)", "price": 9260 }, { "year": 1963, "type": "Tungsten (98$/t)", "price": 15700 }, { "year": 1963, "type": "Chromium (98$/t)", "price": 619 }, { "year": 1964, "type": "Tin (98$/t)", "price": 18300 }, { "year": 1964, "type": "Copper (98$/t)", "price": 3750 }, { "year": 1964, "type": "Nickel (98$/t)", "price": 9160 }, { "year": 1964, "type": "Tungsten (98$/t)", "price": 14800 }, { "year": 1964, "type": "Chromium (98$/t)", "price": 652 }, { "year": 1965, "type": "Tin (98$/t)", "price": 20400 }, { "year": 1965, "type": "Copper (98$/t)", "price": 4020 }, { "year": 1965, "type": "Nickel (98$/t)", "price": 9020 }, { "year": 1965, "type": "Tungsten (98$/t)", "price": 19700 }, { "year": 1965, "type": "Chromium (98$/t)", "price": 670 }, { "year": 1966, "type": "Tin (98$/t)", "price": 18200 }, { "year": 1966, "type": "Copper (98$/t)", "price": 3990 }, { "year": 1966, "type": "Nickel (98$/t)", "price": 8740 }, { "year": 1966, "type": "Tungsten (98$/t)", "price": 23300 }, { "year": 1966, "type": "Chromium (98$/t)", "price": 609 }, { "year": 1967, "type": "Tin (98$/t)", "price": 16500 }, { "year": 1967, "type": "Copper (98$/t)", "price": 4100 }, { "year": 1967, "type": "Nickel (98$/t)", "price": 9460 }, { "year": 1967, "type": "Tungsten (98$/t)", "price": 20000 }, { "year": 1967, "type": "Chromium (98$/t)", "price": 644 }, { "year": 1968, "type": "Tin (98$/t)", "price": 15300 }, { "year": 1968, "type": "Copper (98$/t)", "price": 4260 }, { "year": 1968, "type": "Nickel (98$/t)", "price": 9810 }, { "year": 1968, "type": "Tungsten (98$/t)", "price": 23200 }, { "year": 1968, "type": "Chromium (98$/t)", "price": 645 }, { "year": 1969, "type": "Tin (98$/t)", "price": 16100 }, { "year": 1969, "type": "Copper (98$/t)", "price": 4650 }, { "year": 1969, "type": "Nickel (98$/t)", "price": 10300 }, { "year": 1969, "type": "Tungsten (98$/t)", "price": 23300 }, { "year": 1969, "type": "Chromium (98$/t)", "price": 614 }, { "year": 1970, "type": "Tin (98$/t)", "price": 16100 }, { "year": 1970, "type": "Copper (98$/t)", "price": 5380 }, { "year": 1970, "type": "Nickel (98$/t)", "price": 11900 }, { "year": 1970, "type": "Tungsten (98$/t)", "price": 23700 }, { "year": 1970, "type": "Chromium (98$/t)", "price": 538 }, { "year": 1971, "type": "Tin (98$/t)", "price": 14800 }, { "year": 1971, "type": "Copper (98$/t)", "price": 4620 }, { "year": 1971, "type": "Nickel (98$/t)", "price": 11800 }, { "year": 1971, "type": "Tungsten (98$/t)", "price": 26200 }, { "year": 1971, "type": "Chromium (98$/t)", "price": 755 }, { "year": 1972, "type": "Tin (98$/t)", "price": 15300 }, { "year": 1972, "type": "Copper (98$/t)", "price": 4420 }, { "year": 1972, "type": "Nickel (98$/t)", "price": 12100 }, { "year": 1972, "type": "Tungsten (98$/t)", "price": 22100 }, { "year": 1972, "type": "Chromium (98$/t)", "price": 767 }, { "year": 1973, "type": "Tin (98$/t)", "price": 18400 }, { "year": 1973, "type": "Copper (98$/t)", "price": 4810 }, { "year": 1973, "type": "Nickel (98$/t)", "price": 12400 }, { "year": 1973, "type": "Tungsten (98$/t)", "price": 22000 }, { "year": 1973, "type": "Chromium (98$/t)", "price": 774 }, { "year": 1974, "type": "Tin (98$/t)", "price": 28900 }, { "year": 1974, "type": "Copper (98$/t)", "price": 5630 }, { "year": 1974, "type": "Nickel (98$/t)", "price": 12700 }, { "year": 1974, "type": "Tungsten (98$/t)", "price": 34800 }, { "year": 1974, "type": "Chromium (98$/t)", "price": 1060 }, { "year": 1975, "type": "Tin (98$/t)", "price": 22700 }, { "year": 1975, "type": "Copper (98$/t)", "price": 4290 }, { "year": 1975, "type": "Nickel (98$/t)", "price": 13800 }, { "year": 1975, "type": "Tungsten (98$/t)", "price": 35400 }, { "year": 1975, "type": "Chromium (98$/t)", "price": 1780 }, { "year": 1976, "type": "Tin (98$/t)", "price": 24000 }, { "year": 1976, "type": "Copper (98$/t)", "price": 4390 }, { "year": 1976, "type": "Nickel (98$/t)", "price": 14200 }, { "year": 1976, "type": "Tungsten (98$/t)", "price": 40100 }, { "year": 1976, "type": "Chromium (98$/t)", "price": 1440 }, { "year": 1977, "type": "Tin (98$/t)", "price": 31700 }, { "year": 1977, "type": "Copper (98$/t)", "price": 3960 }, { "year": 1977, "type": "Nickel (98$/t)", "price": 13400 }, { "year": 1977, "type": "Tungsten (98$/t)", "price": 54300 }, { "year": 1977, "type": "Chromium (98$/t)", "price": 1340 }, { "year": 1978, "type": "Tin (98$/t)", "price": 34700 }, { "year": 1978, "type": "Copper (98$/t)", "price": 3630 }, { "year": 1978, "type": "Nickel (98$/t)", "price": 11300 }, { "year": 1978, "type": "Tungsten (98$/t)", "price": 45300 }, { "year": 1978, "type": "Chromium (98$/t)", "price": 1150 }, { "year": 1979, "type": "Tin (98$/t)", "price": 36400 }, { "year": 1979, "type": "Copper (98$/t)", "price": 4570 }, { "year": 1979, "type": "Nickel (98$/t)", "price": 13200 }, { "year": 1979, "type": "Tungsten (98$/t)", "price": 41600 }, { "year": 1979, "type": "Chromium (98$/t)", "price": 1310 }, { "year": 1980, "type": "Tin (98$/t)", "price": 36900 }, { "year": 1980, "type": "Copper (98$/t)", "price": 4420 }, { "year": 1980, "type": "Nickel (98$/t)", "price": 12300 }, { "year": 1980, "type": "Tungsten (98$/t)", "price": 36600 }, { "year": 1980, "type": "Chromium (98$/t)", "price": 1260 }, { "year": 1981, "type": "Tin (98$/t)", "price": 29000 }, { "year": 1981, "type": "Copper (98$/t)", "price": 3330 }, { "year": 1981, "type": "Nickel (98$/t)", "price": 10700 }, { "year": 1981, "type": "Tungsten (98$/t)", "price": 31500 }, { "year": 1981, "type": "Chromium (98$/t)", "price": 1270 }, { "year": 1982, "type": "Tin (98$/t)", "price": 24400 }, { "year": 1982, "type": "Copper (98$/t)", "price": 2710 }, { "year": 1982, "type": "Nickel (98$/t)", "price": 8130 }, { "year": 1982, "type": "Tungsten (98$/t)", "price": 23700 }, { "year": 1982, "type": "Chromium (98$/t)", "price": 1150 }, { "year": 1983, "type": "Tin (98$/t)", "price": 23600 }, { "year": 1983, "type": "Copper (98$/t)", "price": 2760 }, { "year": 1983, "type": "Nickel (98$/t)", "price": 7650 }, { "year": 1983, "type": "Tungsten (98$/t)", "price": 17000 }, { "year": 1983, "type": "Chromium (98$/t)", "price": 1060 }, { "year": 1984, "type": "Tin (98$/t)", "price": 21600 }, { "year": 1984, "type": "Copper (98$/t)", "price": 2310 }, { "year": 1984, "type": "Nickel (98$/t)", "price": 7490 }, { "year": 1984, "type": "Tungsten (98$/t)", "price": 17900 }, { "year": 1984, "type": "Chromium (98$/t)", "price": 1140 }, { "year": 1985, "type": "Tin (98$/t)", "price": 19900 }, { "year": 1985, "type": "Copper (98$/t)", "price": 2240 }, { "year": 1985, "type": "Nickel (98$/t)", "price": 7540 }, { "year": 1985, "type": "Tungsten (98$/t)", "price": 14100 }, { "year": 1985, "type": "Chromium (98$/t)", "price": 1160 }, { "year": 1986, "type": "Tin (98$/t)", "price": 12600 }, { "year": 1986, "type": "Copper (98$/t)", "price": 2170 }, { "year": 1986, "type": "Nickel (98$/t)", "price": 5770 }, { "year": 1986, "type": "Tungsten (98$/t)", "price": 10500 }, { "year": 1986, "type": "Chromium (98$/t)", "price": 1010 }, { "year": 1987, "type": "Tin (98$/t)", "price": 13200 }, { "year": 1987, "type": "Copper (98$/t)", "price": 2610 }, { "year": 1987, "type": "Nickel (98$/t)", "price": 6940 }, { "year": 1987, "type": "Tungsten (98$/t)", "price": 9110 }, { "year": 1987, "type": "Chromium (98$/t)", "price": 944 }, { "year": 1988, "type": "Tin (98$/t)", "price": 13400 }, { "year": 1988, "type": "Copper (98$/t)", "price": 3660 }, { "year": 1988, "type": "Nickel (98$/t)", "price": 19000 }, { "year": 1988, "type": "Tungsten (98$/t)", "price": 10300 }, { "year": 1988, "type": "Chromium (98$/t)", "price": 1440 }, { "year": 1989, "type": "Tin (98$/t)", "price": 15100 }, { "year": 1989, "type": "Copper (98$/t)", "price": 3800 }, { "year": 1989, "type": "Nickel (98$/t)", "price": 17500 }, { "year": 1989, "type": "Tungsten (98$/t)", "price": 13900 }, { "year": 1989, "type": "Chromium (98$/t)", "price": 1630 }, { "year": 1990, "type": "Tin (98$/t)", "price": 10600 }, { "year": 1990, "type": "Copper (98$/t)", "price": 3380 }, { "year": 1990, "type": "Nickel (98$/t)", "price": 11100 }, { "year": 1990, "type": "Tungsten (98$/t)", "price": 10600 }, { "year": 1990, "type": "Chromium (98$/t)", "price": 1110 }, { "year": 1991, "type": "Tin (98$/t)", "price": 9600 }, { "year": 1991, "type": "Copper (98$/t)", "price": 2890 }, { "year": 1991, "type": "Nickel (98$/t)", "price": 9760 }, { "year": 1991, "type": "Tungsten (98$/t)", "price": 11800 }, { "year": 1991, "type": "Chromium (98$/t)", "price": 1080 }, { "year": 1992, "type": "Tin (98$/t)", "price": 10300 }, { "year": 1992, "type": "Copper (98$/t)", "price": 2750 }, { "year": 1992, "type": "Nickel (98$/t)", "price": 8130 }, { "year": 1992, "type": "Tungsten (98$/t)", "price": 10800 }, { "year": 1992, "type": "Chromium (98$/t)", "price": 1020 }, { "year": 1993, "type": "Tin (98$/t)", "price": 8700 }, { "year": 1993, "type": "Copper (98$/t)", "price": 2280 }, { "year": 1993, "type": "Nickel (98$/t)", "price": 5970 }, { "year": 1993, "type": "Tungsten (98$/t)", "price": 7690 }, { "year": 1993, "type": "Chromium (98$/t)", "price": 777 }, { "year": 1994, "type": "Tin (98$/t)", "price": 8950 }, { "year": 1994, "type": "Copper (98$/t)", "price": 2690 }, { "year": 1994, "type": "Nickel (98$/t)", "price": 6970 }, { "year": 1994, "type": "Tungsten (98$/t)", "price": 10400 }, { "year": 1994, "type": "Chromium (98$/t)", "price": 764 }, { "year": 1995, "type": "Tin (98$/t)", "price": 9800 }, { "year": 1995, "type": "Copper (98$/t)", "price": 3260 }, { "year": 1995, "type": "Nickel (98$/t)", "price": 8800 }, { "year": 1995, "type": "Tungsten (98$/t)", "price": 13200 }, { "year": 1995, "type": "Chromium (98$/t)", "price": 1300 }, { "year": 1996, "type": "Tin (98$/t)", "price": 9450 }, { "year": 1996, "type": "Copper (98$/t)", "price": 2500 }, { "year": 1996, "type": "Nickel (98$/t)", "price": 7790 }, { "year": 1996, "type": "Tungsten (98$/t)", "price": 10800 }, { "year": 1996, "type": "Chromium (98$/t)", "price": 970 }, { "year": 1997, "type": "Tin (98$/t)", "price": 8540 }, { "year": 1997, "type": "Copper (98$/t)", "price": 2400 }, { "year": 1997, "type": "Nickel (98$/t)", "price": 7040 }, { "year": 1997, "type": "Tungsten (98$/t)", "price": 9810 }, { "year": 1997, "type": "Chromium (98$/t)", "price": 1040 }, { "year": 1998, "type": "Tin (98$/t)", "price": 8230 }, { "year": 1998, "type": "Copper (98$/t)", "price": 1730 }, { "year": 1998, "type": "Nickel (98$/t)", "price": 4630 }, { "year": 1998, "type": "Tungsten (98$/t)", "price": 8300 }, { "year": 1998, "type": "Chromium (98$/t)", "price": 909 }, { "year": 1999, "type": "Tin (98$/t)", "price": 7900 }, { "year": 1999, "type": "Copper (98$/t)", "price": 1640 }, { "year": 1999, "type": "Nickel (98$/t)", "price": 5880 }, { "year": 1999, "type": "Tungsten (98$/t)", "price": 6920 }, { "year": 1999, "type": "Chromium (98$/t)", "price": 694 }, { "year": 2000, "type": "Tin (98$/t)", "price": 7730 }, { "year": 2000, "type": "Copper (98$/t)", "price": 1840 }, { "year": 2000, "type": "Nickel (98$/t)", "price": 8180 }, { "year": 2000, "type": "Tungsten (98$/t)", "price": 7840 }, { "year": 2000, "type": "Chromium (98$/t)", "price": 721 }, { "year": 2001, "type": "Tin (98$/t)", "price": 6390 }, { "year": 2001, "type": "Copper (98$/t)", "price": 1560 }, { "year": 2001, "type": "Nickel (98$/t)", "price": 5470 }, { "year": 2001, "type": "Tungsten (98$/t)", "price": 11500 }, { "year": 2001, "type": "Chromium (98$/t)", "price": 786 }, { "year": 2002, "type": "Tin (98$/t)", "price": 5830 }, { "year": 2002, "type": "Copper (98$/t)", "price": 1510 }, { "year": 2002, "type": "Nickel (98$/t)", "price": 6130 }, { "year": 2002, "type": "Tungsten (98$/t)", "price": 8230 }, { "year": 2002, "type": "Chromium (98$/t)", "price": 721 }, { "year": 2003, "type": "Tin (98$/t)", "price": 6640 }, { "year": 2003, "type": "Copper (98$/t)", "price": 1670 }, { "year": 2003, "type": "Nickel (98$/t)", "price": 8530 }, { "year": 2003, "type": "Tungsten (98$/t)", "price": 7720 }, { "year": 2003, "type": "Chromium (98$/t)", "price": 790 }, { "year": 2004, "type": "Tin (98$/t)", "price": 10400 }, { "year": 2004, "type": "Copper (98$/t)", "price": 2550 }, { "year": 2004, "type": "Nickel (98$/t)", "price": 11900 }, { "year": 2004, "type": "Tungsten (98$/t)", "price": 10000 }, { "year": 2004, "type": "Chromium (98$/t)", "price": 1190 }, { "year": 2005, "type": "Tin (98$/t)", "price": 8850 }, { "year": 2005, "type": "Copper (98$/t)", "price": 3200 }, { "year": 2005, "type": "Nickel (98$/t)", "price": 12300 }, { "year": 2005, "type": "Tungsten (98$/t)", "price": 24900 }, { "year": 2005, "type": "Chromium (98$/t)", "price": 1260 }, { "year": 2006, "type": "Tin (98$/t)", "price": 10100 }, { "year": 2006, "type": "Copper (98$/t)", "price": 5610 }, { "year": 2006, "type": "Nickel (98$/t)", "price": 19600 }, { "year": 2006, "type": "Tungsten (98$/t)", "price": 29900 }, { "year": 2006, "type": "Chromium (98$/t)", "price": 1140 }, { "year": 2007, "type": "Tin (98$/t)", "price": 15600 }, { "year": 2007, "type": "Copper (98$/t)", "price": 5680 }, { "year": 2007, "type": "Nickel (98$/t)", "price": 29300 }, { "year": 2007, "type": "Tungsten (98$/t)", "price": 28200 }, { "year": 2007, "type": "Chromium (98$/t)", "price": 1580 }, { "year": 2008, "type": "Tin (98$/t)", "price": 18900 }, { "year": 2008, "type": "Copper (98$/t)", "price": 5330 }, { "year": 2008, "type": "Nickel (98$/t)", "price": 16000 }, { "year": 2008, "type": "Tungsten (98$/t)", "price": 26600 }, { "year": 2008, "type": "Chromium (98$/t)", "price": 2640 }, { "year": 2009, "type": "Tin (98$/t)", "price": 14100 }, { "year": 2009, "type": "Copper (98$/t)", "price": 4040 }, { "year": 2009, "type": "Nickel (98$/t)", "price": 11100 }, { "year": 2009, "type": "Tungsten (98$/t)", "price": 19500 }, { "year": 2009, "type": "Chromium (98$/t)", "price": 1540 }, { "year": 2010, "type": "Tin (98$/t)", "price": 20400 }, { "year": 2010, "type": "Copper (98$/t)", "price": 5740 }, { "year": 2010, "type": "Nickel (98$/t)", "price": 16300 }, { "year": 2010, "type": "Tungsten (98$/t)", "price": 20200 }, { "year": 2010, "type": "Chromium (98$/t)", "price": 1980 }, { "year": 2011, "type": "Tin (98$/t)", "price": 25100 }, { "year": 2011, "type": "Copper (98$/t)", "price": 6490 }, { "year": 2011, "type": "Nickel (98$/t)", "price": 16600 }, { "year": 2011, "type": "Tungsten (98$/t)", "price": 33900 }, { "year": 2011, "type": "Chromium (98$/t)", "price": 1970 }, { "year": 2012, "type": "Tin (98$/t)", "price": 20100 }, { "year": 2012, "type": "Copper (98$/t)", "price": 5750 }, { "year": 2012, "type": "Nickel (98$/t)", "price": 12400 }, { "year": 2012, "type": "Tungsten (98$/t)", "price": 40200 }, { "year": 2012, "type": "Chromium (98$/t)", "price": 1810 }, { "year": 2013, "type": "Tin (98$/t)", "price": 16000 }, { "year": 2013, "type": "Copper (98$/t)", "price": 5240 }, { "year": 2013, "type": "Nickel (98$/t)", "price": 10500 }, { "year": 2013, "type": "Tungsten (98$/t)", "price": 32600 }, { "year": 2013, "type": "Chromium (98$/t)", "price": 1650 }, { "year": 2014, "type": "Tin (98$/t)", "price": 15600 }, { "year": 2014, "type": "Copper (98$/t)", "price": 4830 }, { "year": 2014, "type": "Nickel (98$/t)", "price": 11600 }, { "year": 2014, "type": "Tungsten (98$/t)", "price": 31100 }, { "year": 2014, "type": "Chromium (98$/t)", "price": 1670 }, { "year": 2015, "type": "Tin (98$/t)", "price": 11500 }, { "year": 2015, "type": "Copper (98$/t)", "price": 3890 }, { "year": 2015, "type": "Nickel (98$/t)", "price": 8120 }, { "year": 2015, "type": "Tungsten (98$/t)", "price": 26000 }, { "year": 2015, "type": "Chromium (98$/t)", "price": 1540 }];

var state = {
  startYear: 1980,
  endYear: 1990,
  initialValue: 1000
};

var main = select("#root");

main.append("h1").text("Simon-Ehrlich Wager");

var hbox = main.append("div").attr("class", "hbox");

var totalValueFigure = hbox.append("figure").attr("class", "grow");
var priceTableFigure = hbox.append("figure");
var yearSlider = main.append("svg");

var total = totalValue();
var slider = dateSlider().range(extent(prices, function (d) {
  return d.year;
}));

slider.on("change", function (data) {
  state.startYear = data[0];
  state.endYear = data[1];
  update();
});

function update() {
  draw(simonEhrlichWager(prices, state.startYear, state.endYear, state.initialValue));
}

function draw(data) {
  totalValueFigure.call(total.data(data));
  priceTableFigure.call(priceTable, data);
  yearSlider.datum([state.startYear, state.endYear]).call(slider);
}

update();

// FIXME: Ew. Drawing twice on load to get the sizes right on the area chart.
update();

// FIXME: This is a little wasteful, since we only need to redraw, but
// we're triggering a recalculation of all the data here.
window.onresize = update;

}());
