(function() {
  var ALPHA_COUNT, ALPHA_MAX, ALPHA_MIN, COUNT_FRAMERATE, COUNT_MS_PER_FRAME, DIGIT_FORMAT, DIGIT_HTML, DIGIT_SPEEDBOOST, DURATION, FORMAT_MARK_HTML, FORMAT_PARSER, FRAMERATE, FRAMES_PER_VALUE, MS_PER_FRAME, MutationObserver, RIBBON_HTML, TRANSITION_END_EVENTS, TRANSITION_SUPPORT, TextRoller, VALUE_HTML, createFromHTML, fractionalPart, now, requestAnimationFrame, round, transitionCheckStyles, wrapJQuery, _jQueryWrapped, _old, _ref, _ref1,
    __slice = [].slice;

  VALUE_HTML = '<span class="odometer-value"></span>';

  RIBBON_HTML = '<span class="odometer-ribbon"><span class="odometer-ribbon-inner">' + VALUE_HTML + '</span></span>';

  DIGIT_HTML = '<span class="odometer-digit"><span class="odometer-digit-spacer">8</span><span class="odometer-digit-inner">' + RIBBON_HTML + '</span></span>';

  FORMAT_MARK_HTML = '<span class="odometer-formatting-mark"></span>';

  ALPHA_MIN = 32;

  ALPHA_MAX = 123;

  ALPHA_COUNT = ALPHA_MAX - ALPHA_MIN;

  DIGIT_FORMAT = 'd';

  FORMAT_PARSER = /^\(?([^)]*)\)?(?:(.)(d+))?$/;

  FRAMERATE = 20;

  DURATION = 1000000*5;

  COUNT_FRAMERATE = 10;

  FRAMES_PER_VALUE = 1;

  DIGIT_SPEEDBOOST = .5;

  MS_PER_FRAME = 1000 / FRAMERATE;

  COUNT_MS_PER_FRAME = 1000 / COUNT_FRAMERATE;

  TRANSITION_END_EVENTS = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd';

  transitionCheckStyles = document.createElement('div').style;

  TRANSITION_SUPPORT = (transitionCheckStyles.transition != null) || (transitionCheckStyles.webkitTransition != null) || (transitionCheckStyles.mozTransition != null) || (transitionCheckStyles.oTransition != null);

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

  createFromHTML = function(html) {
    var el;
    el = document.createElement('div');
    el.innerHTML = html;
    return el.children[0];
  };

  now = function() {
    var _ref, _ref1;
    return (_ref = (_ref1 = window.performance) != null ? typeof _ref1.now === "function" ? _ref1.now() : void 0 : void 0) != null ? _ref : +(new Date);
  };

  round = function(val, precision) {
    if (precision == null) {
      precision = 0;
    }
    return val;
  };

  fractionalPart = function(val) {};

  _jQueryWrapped = false;

  (wrapJQuery = function() {
    var property, _i, _len, _ref, _results;
    if (_jQueryWrapped) {
      return;
    }
    if (window.jQuery != null) {
      _jQueryWrapped = true;
      _ref = ['html', 'text'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        _results.push((function(property) {
          var old;
          old = window.jQuery.fn[property];
          return window.jQuery.fn[property] = function(val) {
            var _ref1;
            if ((val == null) || (((_ref1 = this[0]) != null ? _ref1.odometer : void 0) == null)) {
              return old.apply(this, arguments);
            }
            return this[0].odometer.update(val);
          };
        })(property));
      }
      return _results;
    }
  })();

  setTimeout(wrapJQuery, 0);

  TextRoller = (function() {
    function TextRoller(options) {
      var e, k, property, v, _base, _fn, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3,
        _this = this;
      this.options = options;
      try {
        this.el = this.options.el;
        if (this.el.odometer != null) {
          return this.el.odometer;
        }
        this.el.odometer = this;
        _ref = TextRoller.options;
        for (v = _i = 0, _len = _ref.length; _i < _len; v = ++_i) {
          k = _ref[v];
          if (this.options[k] == null) {
            this.options[k] = v;
          }
        }
        if ((_base = this.options).duration == null) {
          _base.duration = DURATION;
        }
        this.options.valuesIndex = 0;
        this.options.values = this.cleanArray();
        this.MAX_VALUES = ((this.options.duration / MS_PER_FRAME) / FRAMES_PER_VALUE) | 0;
        this.resetFormat();
        this.value = this.cleanValue((_ref1 = this.options.values[0]) != null ? _ref1 : '');
        this.renderInside();
        this.render();
        try {
          _ref2 = ['HTML', 'Text'];
          _fn = function(property) {
            return Object.defineProperty(_this.el, "inner" + property, {
              get: function() {
                return _this.inside["outer" + property];
              },
              set: function(val) {
                return _this.update(val);
              }
            });
          };
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            property = _ref2[_j];
            _fn(property);
          }
        } catch (_error) {
          e = _error;
          this.watchForMutations();
        }
        setInterval(function() {
          var newVal, _ref3;
          try {
            if ((_ref3 = _this.options.loop) != null ? _ref3 : true) {
              if (_this.options.valuesIndex >= _this.options.values.length - 1) {
                _this.options.valuesIndex = 0;
              } else {
                _this.options.valuesIndex++;
              }
              newVal = _this.options.values[_this.options.valuesIndex];
              return $(_this.el).html(newVal);
            } else {
              if (_this.options.valuesIndex < _this.options.values.length - 1) {
                _this.options.valuesIndex++;
                newVal = _this.options.values[_this.options.valuesIndex];
                return $(_this.el).html(newVal);
              }
            }
          } catch (_error) {
            e = _error;
            return e;
          }
        }, (_ref3 = this.options.delay) != null ? _ref3 : 3000);
      } catch (_error) {}
      this;
    }

    TextRoller.prototype.cleanArray = function() {
      var diff, elt, h, maxLength, str, u, _i, _j, _len, _ref, _ref1;
      maxLength = this.maxLength(this.options.values);
      _ref = this.options.values;
      for (h = _i = 0, _len = _ref.length; _i < _len; h = ++_i) {
        elt = _ref[h];
        str = elt.split("");
        diff = (_ref1 = (maxLength - elt.length) / 2) != null ? _ref1 : 0;
        if (diff > 0) {
          for (u = _j = 1; 1 <= diff ? _j <= diff : _j >= diff; u = 1 <= diff ? ++_j : --_j) {
            if (this.options.align === "left") {
              str.push("  ");
            } else if (this.options.align === "right") {
              str.unshift("  ");
            } else {
              str.push(" ");
              str.unshift(" ");
            }
          }
        }
        this.options.values[h] = str.join('');
      }
      return this.options.values;
    };

    TextRoller.prototype.maxLength = function(arr) {
      var elt, max, _i, _len;
      max = 0;
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        elt = arr[_i];
        if (elt.length > max) {
          max = elt.length;
        }
      }
      return max;
    };

    TextRoller.prototype.renderInside = function() {
      this.inside = document.createElement('div');
      this.inside.className = 'odometer-inside';
      this.el.innerHTML = '';
      return this.el.appendChild(this.inside);
    };

    TextRoller.prototype.watchForMutations = function() {
      var e,
        _this = this;
      if (MutationObserver == null) {
        return;
      }
      try {
        if (this.observer == null) {
          this.observer = new MutationObserver(function(mutations) {
            var newVal;
            newVal = _this.el.innerText;
            _this.renderInside();
            _this.render(_this.value);
            return _this.update(newVal);
          });
        }
        this.watchMutations = true;
        return this.startWatchingMutations();
      } catch (_error) {
        e = _error;
      }
    };

    TextRoller.prototype.startWatchingMutations = function() {
      if (this.watchMutations) {
        return this.observer.observe(this.el, {
          childList: true
        });
      }
    };

    TextRoller.prototype.stopWatchingMutations = function() {
      var _ref;
      return (_ref = this.observer) != null ? _ref.disconnect() : void 0;
    };

    TextRoller.prototype.intToChar = function(val) {
      val = String.fromCharCode(val + ALPHA_MIN);
      return val;
    };

    TextRoller.prototype.cleanValue = function(val) {
      var char;
      if (typeof val === 'string') {
        val = val.split('');
        val = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = val.length; _i < _len; _i++) {
            char = val[_i];
            _results.push(char.charCodeAt(0) - ALPHA_MIN);
          }
          return _results;
        })();
      } else if (typeof val === 'object') {
        val = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = val.length; _i < _len; _i++) {
            char = val[_i];
            _results.push(char.charCodeAt(0) - ALPHA_MIN);
          }
          return _results;
        })();
      }
      return val;
    };

    TextRoller.prototype.bindTransitionEnd = function() {
      var event, renderEnqueued, _i, _len, _ref, _results,
        _this = this;
      if (this.transitionEndBound) {
        return;
      }
      this.transitionEndBound = true;
      renderEnqueued = false;
      _ref = TRANSITION_END_EVENTS.split(' ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        _results.push(this.el.addEventListener(event, function() {
          if (renderEnqueued) {
            return true;
          }
          renderEnqueued = true;
          setTimeout(function() {
            _this.render();
            return renderEnqueued = false;
          }, 0);
          return true;
        }, false));
      }
      return _results;
    };

    TextRoller.prototype.resetFormat = function() {
      var format, fractional, parsed, precision, radix, repeating, _ref, _ref1;
      format = (_ref = this.options.format) != null ? _ref : DIGIT_FORMAT;
      format || (format = 'd');
      parsed = FORMAT_PARSER.exec(format);
      if (!parsed) {
        throw new Error("TextRoller: Unparsable digit format");
      }
      _ref1 = parsed.slice(1, 4), repeating = _ref1[0], radix = _ref1[1], fractional = _ref1[2];
      precision = (fractional != null ? fractional.length : void 0) || 0;
      return this.format = {
        repeating: repeating,
        radix: radix,
        precision: precision
      };
    };

    TextRoller.prototype.render = function(value) {
      var classes, cls, digit, match, newClasses, theme, wholePart, _i, _j, _len, _len1, _ref;
      if (value == null) {
        value = this.value;
      }
      this.stopWatchingMutations();
      this.resetFormat();
      this.inside.innerHTML = '';
      theme = this.options.theme;
      classes = this.el.className.split(' ');
      newClasses = [];
      for (_i = 0, _len = classes.length; _i < _len; _i++) {
        cls = classes[_i];
        if (!cls.length) {
          continue;
        }
        if (match = /^odometer-theme-(.+)$/.exec(cls)) {
          theme = match[1];
          continue;
        }
        if (/^odometer(-|$)/.test(cls)) {
          continue;
        }
        newClasses.push(cls);
      }
      newClasses.push('odometer');
      if (!TRANSITION_SUPPORT) {
        newClasses.push('odometer-no-transitions');
      }
      if (theme) {
        newClasses.push("odometer-theme-" + theme);
      } else {
        newClasses.push("odometer-auto-theme");
      }
      this.el.className = newClasses.join(' ');
      this.ribbons = {};
      this.digits = [];
      wholePart = !this.format.precision || !fractionalPart(value) || false;
      _ref = value.reverse();
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        digit = _ref[_j];
        if (this.intToChar(digit === this.format.radix)) {
          wholePart = true;
        }
        this.addDigit(digit, wholePart);
      }
      return this.startWatchingMutations();
    };

    TextRoller.prototype.update = function(newValue) {
      var _this = this;
      newValue = this.cleanValue(newValue);
      if (newValue === this.value) {
        return;
      }
      if (newValue > this.value) {
        this.el.className += ' odometer-animating-up';
      } else {
        this.el.className += ' odometer-animating-down';
      }
      this.stopWatchingMutations();
      this.animate(newValue);
      this.startWatchingMutations();
      setTimeout(function() {
        _this.el.offsetHeight;
        return _this.el.className += ' odometer-animating';
      }, 0);
      return this.value = newValue;
    };

    TextRoller.prototype.renderDigit = function() {
      return createFromHTML(DIGIT_HTML);
    };

    TextRoller.prototype.insertDigit = function(digit, before) {
      if (before != null) {
        return this.inside.insertBefore(digit, before);
      } else if (!this.inside.children.length) {
        return this.inside.appendChild(digit);
      } else {
        return this.inside.insertBefore(digit, this.inside.children[0]);
      }
    };

    TextRoller.prototype.addSpacer = function(char, before, extraClasses) {
      var spacer;
      spacer = createFromHTML(FORMAT_MARK_HTML);
      spacer.innerHTML = char;
      if (extraClasses) {
        spacer.className += " " + extraClasses;
      }
      return this.insertDigit(spacer, before);
    };

    TextRoller.prototype.addDigit = function(value, repeating) {
      var char, digit, resetted;
      if (repeating == null) {
        repeating = true;
      }
      if (value === '-') {
        return this.addSpacer(value, null, 'odometer-negation-mark');
      }
      if (value === this.format.radix) {
        return this.addSpacer(value, null, 'odometer-radix-mark');
      }
      if (repeating) {
        resetted = false;
        while (true) {
          if (!this.format.repeating.length) {
            if (resetted) {
              throw new Error("Bad odometer format without digits");
            }
            this.resetFormat();
            resetted = true;
          }
          char = this.format.repeating[this.format.repeating.length - 1];
          this.format.repeating = this.format.repeating.substring(0, this.format.repeating.length - 1);
          if (char === 'd') {
            break;
          }
          this.addSpacer(char);
        }
      }
      digit = this.renderDigit();
      digit.querySelector('.odometer-value').innerHTML = this.intToChar(value);
      this.digits.push(digit);
      return this.insertDigit(digit);
    };

    TextRoller.prototype.animate = function(newValue) {
      if (!TRANSITION_SUPPORT || this.options.animation === 'count') {
        return this.animateCount(newValue);
      } else {
        return this.animateSlide(newValue);
      }
    };

    TextRoller.prototype.valDiff = function(newValue, oldValue) {
      var diffTab, finalSize, i, _i, _ref;
      diffTab = [];
      finalSize = Math.max(oldValue.length, newValue.length);
      for (i = _i = 0, _ref = finalSize - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        diffTab[i] = (oldValue[i] || 0) - (newValue[i] || 0);
      }
      return diffTab;
    };

    TextRoller.prototype.noChanges = function(diff) {
      var i, _i, _len;
      for (_i = 0, _len = diff.length; _i < _len; _i++) {
        i = diff[_i];
        if (i !== false) {
          return true;
        }
      }
      return false;
    };

    TextRoller.prototype.animateCount = function(newValue) {
      var cur, diff, last, start, tick,
        _this = this;
      if (!(diff = +newValue - this.value)) {
        return;
      }
      start = last = now();
      cur = this.value;
      return (tick = function() {
        var delta, dist, fraction;
        if ((now() - start) > _this.options.duration) {
          _this.value = newValue;
          _this.render();
          return;
        }
        delta = now() - last;
        if (delta > COUNT_MS_PER_FRAME) {
          last = now();
          fraction = delta / _this.options.duration;
          dist = diff * fraction;
          cur += dist;
          _this.render(Math.round(cur));
        }
        if (requestAnimationFrame != null) {
          return requestAnimationFrame(tick);
        } else {
          return setTimeout(tick, COUNT_MS_PER_FRAME);
        }
      })();
    };

    TextRoller.prototype.getDigitCount = function() {
      var finalSize, i, max, value, values, _i, _len;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      finalSize = 0;
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        value = values[i];
        if (value.length > finalSize) {
          finalSize = value.length;
        }
        values[i] = Math.abs(value);
      }
      max = Math.max.apply(Math, values);
      Math.ceil(Math.log(max + 1) / Math.log(10));
      return finalSize;
    };

    TextRoller.prototype.getFractionalDigitCount = function() {
      var i, parser, parts, value, values, _i, _len;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      parser = /^\d*\.(\d*?)0*$/;
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        value = values[i];
        values[i] = value.toString();
        parts = parser.exec(values[i]);
        if (parts == null) {
          values[i] = 0;
        } else {
          values[i] = parts[1].length;
        }
      }
      return Math.max.apply(Math, values);
    };

    TextRoller.prototype.resetDigits = function() {
      this.digits = [];
      this.ribbons = [];
      this.inside.innerHTML = '';
      return this.resetFormat();
    };

    TextRoller.prototype.animateSlide = function(newValue) {
      var boosted, cur, diff, digitCount, digits, dist, end, fractionalCount, frame, frames, i, incr, j, mark, nullArray, numEl, oldValue, start, tr, _base, _i, _j, _k, _l, _len, _len1, _len2, _m, _n, _ref, _ref1, _ref2, _results;
      oldValue = this.value;
      fractionalCount = 0;
      if (fractionalCount) {
        newValue = newValue * Math.pow(10, fractionalCount);
        oldValue = oldValue * Math.pow(10, fractionalCount);
      }
      diff = this.valDiff(newValue, this.value);
      if (!this.noChanges(diff)) {
        return;
      }
      this.bindTransitionEnd();
      digitCount = this.getDigitCount(oldValue, newValue);
      digits = [];
      boosted = 0;
      for (i = _i = _ref = digitCount - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
        start = Math.floor(oldValue[i]);
        end = Math.floor(newValue[(digitCount - 1) - i]);
        dist = end - start;
        if (Math.abs(dist) > this.MAX_VALUES) {
          frames = [];
          incr = dist / (this.MAX_VALUES + this.MAX_VALUES * boosted * DIGIT_SPEEDBOOST);
          cur = start;
          while ((dist > 0 && cur < end) || (dist < 0 && cur > end)) {
            frames.push(Math.round(cur));
            cur += incr;
          }
          if (frames[frames.length - 1] !== end) {
            frames.push(end);
          }
          boosted++;
        } else {
          frames = (function() {
            _results = [];
            for (var _j = start; start <= end ? _j <= end : _j >= end; start <= end ? _j++ : _j--){ _results.push(_j); }
            return _results;
          }).apply(this);
        }
        for (i = _k = 0, _len = frames.length; _k < _len; i = ++_k) {
          frame = frames[i];
          frames[i] = Math.abs(frame % ALPHA_COUNT);
        }
        digits.push(frames);
      }
      this.resetDigits();
      _ref1 = digits.reverse();
      for (i = _l = 0, _len1 = _ref1.length; _l < _len1; i = ++_l) {
        frames = _ref1[i];
        if (!this.digits[i]) {
          this.addDigit(' ', false);
        }
        if ((_base = this.ribbons)[i] == null) {
          _base[i] = this.digits[i].querySelector('.odometer-ribbon-inner');
        }
        this.ribbons[i].innerHTML = '';
        nullArray = [];
        for (tr = _m = 0, _ref2 = digitCount - 1; 0 <= _ref2 ? _m <= _ref2 : _m >= _ref2; tr = 0 <= _ref2 ? ++_m : --_m) {
          nullArray[tr] = 0;
        }
        if (diff > nullArray) {
          frames = frames.reverse();
        }
        for (j = _n = 0, _len2 = frames.length; _n < _len2; j = ++_n) {
          frame = frames[j];
          numEl = document.createElement('div');
          numEl.className = 'odometer-value';
          numEl.innerHTML = this.intToChar(frame);
          this.ribbons[i].appendChild(numEl);
          if (j === frames.length - 1) {
            numEl.className += ' odometer-last-value';
          }
          if (j === 0) {
            numEl.className += ' odometer-first-value';
          }
        }
      }
      mark = this.inside.querySelector('.odometer-radix-mark');
      if (mark != null) {
        mark.parent.removeChild(mark);
      }
      if (fractionalCount) {
        return this.addSpacer(this.format.radix, this.digits[fractionalCount - 1], 'odometer-radix-mark');
      }
    };

    return TextRoller;

  })();

  TextRoller.options = (_ref = window.odometerOptions) != null ? _ref : {};

  setTimeout(function() {
    var k, v, _base, _ref1, _results;
    if (window.odometerOptions) {
      _ref1 = window.odometerOptions;
      _results = [];
      for (k in _ref1) {
        v = _ref1[k];
        _results.push((_base = TextRoller.options)[k] != null ? (_base = TextRoller.options)[k] : _base[k] = v);
      }
      return _results;
    }
  }, 0);

  TextRoller.init = function() {
    var el, elements, _i, _len, _results;
    if (document.querySelectorAll == null) {
      return;
    }
    elements = document.querySelectorAll(TextRoller.options.selector || '.odometer');
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      el = elements[_i];
      _results.push(el.odometer = new TextRoller({
        el: el,
        values: [el.innerText, "coucou", "bonjour", "salut"]
      }));
    }
    return _results;
  };

  if ((((_ref1 = document.documentElement) != null ? _ref1.doScroll : void 0) != null) && (document.createEventObject != null)) {
    _old = document.onreadystatechange;
    document.onreadystatechange = function() {
      if (document.readyState === 'complete' && TextRoller.options.auto !== false) {
        TextRoller.init();
      }
      return _old != null ? _old.apply(this, arguments) : void 0;
    };
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      if (TextRoller.options.auto !== false) {
        return TextRoller.init();
      }
    }, false);
  }

  window.TextRoller = TextRoller;

}).call(this);
