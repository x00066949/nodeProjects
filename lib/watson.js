/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = exports.oToken = undefined;

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/var request = _interopRequireWildcard(_request);

var /*istanbul ignore next*/_jsonwebtoken = require('jsonwebtoken');

/*istanbul ignore next*/var jsonwebtoken = _interopRequireWildcard(_jsonwebtoken);

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Setup debug log
var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-scrumbot');

var toks;
var oToken = /*istanbul ignore next*/exports.oToken = function oToken() {
  log("toks : " + toks);
  return toks;
};

var run = /*istanbul ignore next*/exports.run = function run(appId, secret, cb) {

  var tok = /*istanbul ignore next*/void 0;

  // Return the current token
  var current = function current() /*istanbul ignore next*/{
    return tok;
  };

  // Return the time to live of a token
  var ttl = function ttl(tok) /*istanbul ignore next*/{
    return Math.max(0, jsonwebtoken.decode(tok).exp * 1000 - Date.now());
  };

  // Refresh the token
  var refresh = function refresh(cb) {
    log('Getting token');
    console.log('Getting token');

    request.post('https://api.watsonwork.ibm.com/oauth/token', {
      auth: {
        user: appId,
        pass: secret
      },
      json: true,
      form: {
        grant_type: 'client_credentials'
      }
    }, function (err, res) {
      if (err || res.statusCode !== 200) {
        log('Error getting token %o', err || res.statusCode);
        console.log('Error getting token %o', err || res.statusCode);

        cb(err || new Error(res.statusCode));
        return;
      }

      // Save the fresh token
      log('Got new token : ' + res.body.access_token);
      tok = res.body.access_token;
      toks = res.body.access_token;

      // Schedule next refresh a bit before the token expires
      var t = ttl(tok);
      log('Token ttl', t);
      setTimeout(refresh, Math.max(0, t - 60000)).unref();

      // Return a function that'll return the current token
      cb(undefined, current);
    });
  };

  // Obtain initial token
  setImmediate(function () /*istanbul ignore next*/{
    return refresh(cb);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRzb24uanMiXSwibmFtZXMiOlsicmVxdWVzdCIsImpzb253ZWJ0b2tlbiIsImxvZyIsInRva3MiLCJvVG9rZW4iLCJydW4iLCJhcHBJZCIsInNlY3JldCIsImNiIiwidG9rIiwiY3VycmVudCIsInR0bCIsIk1hdGgiLCJtYXgiLCJkZWNvZGUiLCJleHAiLCJEYXRlIiwibm93IiwicmVmcmVzaCIsImNvbnNvbGUiLCJwb3N0IiwiYXV0aCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwiZXJyIiwicmVzIiwic3RhdHVzQ29kZSIsIkVycm9yIiwiYm9keSIsImFjY2Vzc190b2tlbiIsInQiLCJzZXRUaW1lb3V0IiwidW5yZWYiLCJ1bmRlZmluZWQiLCJzZXRJbW1lZGlhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxZOztBQUNaOzs7Ozs7OztBQUdBO0FBQ0EsSUFBTUMsTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLElBQUo7QUFDTyxJQUFNQyxrREFBUyxTQUFUQSxNQUFTLEdBQU07QUFDMUJGLE1BQUksWUFBWUMsSUFBaEI7QUFDQSxTQUFPQSxJQUFQO0FBQ0QsQ0FITTs7QUFLQSxJQUFNRSw0Q0FBTSxTQUFOQSxHQUFNLENBQUNDLEtBQUQsRUFBUUMsTUFBUixFQUFnQkMsRUFBaEIsRUFBdUI7O0FBRXhDLE1BQUlDLG9DQUFKOztBQUVBO0FBQ0EsTUFBTUMsVUFBVSxTQUFWQSxPQUFVO0FBQUEsV0FBTUQsR0FBTjtBQUFBLEdBQWhCOztBQUVBO0FBQ0EsTUFBTUUsTUFBTSxTQUFOQSxHQUFNLENBQUNGLEdBQUQ7QUFBQSxXQUNWRyxLQUFLQyxHQUFMLENBQVMsQ0FBVCxFQUFZWixhQUFhYSxNQUFiLENBQW9CTCxHQUFwQixFQUF5Qk0sR0FBekIsR0FBK0IsSUFBL0IsR0FBc0NDLEtBQUtDLEdBQUwsRUFBbEQsQ0FEVTtBQUFBLEdBQVo7O0FBR0E7QUFDQSxNQUFNQyxVQUFVLFNBQVZBLE9BQVUsQ0FBQ1YsRUFBRCxFQUFRO0FBQ3RCTixRQUFJLGVBQUo7QUFDQWlCLFlBQVFqQixHQUFSLENBQVksZUFBWjs7QUFFQUYsWUFBUW9CLElBQVIsQ0FBYSw0Q0FBYixFQUEyRDtBQUN6REMsWUFBTTtBQUNKQyxjQUFNaEIsS0FERjtBQUVKaUIsY0FBTWhCO0FBRkYsT0FEbUQ7QUFLekRpQixZQUFNLElBTG1EO0FBTXpEQyxZQUFNO0FBQ0pDLG9CQUFZO0FBRFI7QUFObUQsS0FBM0QsRUFTRyxVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYztBQUNmLFVBQUlELE9BQU9DLElBQUlDLFVBQUosS0FBbUIsR0FBOUIsRUFBbUM7QUFDakMzQixZQUFJLHdCQUFKLEVBQThCeUIsT0FBT0MsSUFBSUMsVUFBekM7QUFDQVYsZ0JBQVFqQixHQUFSLENBQVksd0JBQVosRUFBc0N5QixPQUFPQyxJQUFJQyxVQUFqRDs7QUFFQXJCLFdBQUdtQixPQUFPLElBQUlHLEtBQUosQ0FBVUYsSUFBSUMsVUFBZCxDQUFWO0FBQ0E7QUFDRDs7QUFFRDtBQUNBM0IsVUFBSSxxQkFBcUIwQixJQUFJRyxJQUFKLENBQVNDLFlBQWxDO0FBQ0F2QixZQUFNbUIsSUFBSUcsSUFBSixDQUFTQyxZQUFmO0FBQ0E3QixhQUFPeUIsSUFBSUcsSUFBSixDQUFTQyxZQUFoQjs7QUFHQTtBQUNBLFVBQU1DLElBQUl0QixJQUFJRixHQUFKLENBQVY7QUFDQVAsVUFBSSxXQUFKLEVBQWlCK0IsQ0FBakI7QUFDQUMsaUJBQVdoQixPQUFYLEVBQW9CTixLQUFLQyxHQUFMLENBQVMsQ0FBVCxFQUFZb0IsSUFBSSxLQUFoQixDQUFwQixFQUE0Q0UsS0FBNUM7O0FBRUE7QUFDQTNCLFNBQUc0QixTQUFILEVBQWMxQixPQUFkO0FBQ0QsS0EvQkQ7QUFnQ0QsR0FwQ0Q7O0FBc0NBO0FBQ0EyQixlQUFhO0FBQUEsV0FBTW5CLFFBQVFWLEVBQVIsQ0FBTjtBQUFBLEdBQWI7QUFFRCxDQXJETSIsImZpbGUiOiJ3YXRzb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMganNvbndlYnRva2VuIGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuXG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIHRva3M7XG5leHBvcnQgY29uc3Qgb1Rva2VuID0gKCkgPT4ge1xuICBsb2coXCJ0b2tzIDogXCIgKyB0b2tzKVxuICByZXR1cm4gdG9rcztcbn1cblxuZXhwb3J0IGNvbnN0IHJ1biA9IChhcHBJZCwgc2VjcmV0LCBjYikgPT4ge1xuXG4gIGxldCB0b2s7XG5cbiAgLy8gUmV0dXJuIHRoZSBjdXJyZW50IHRva2VuXG4gIGNvbnN0IGN1cnJlbnQgPSAoKSA9PiB0b2s7XG5cbiAgLy8gUmV0dXJuIHRoZSB0aW1lIHRvIGxpdmUgb2YgYSB0b2tlblxuICBjb25zdCB0dGwgPSAodG9rKSA9PlxuICAgIE1hdGgubWF4KDAsIGpzb253ZWJ0b2tlbi5kZWNvZGUodG9rKS5leHAgKiAxMDAwIC0gRGF0ZS5ub3coKSk7XG5cbiAgLy8gUmVmcmVzaCB0aGUgdG9rZW5cbiAgY29uc3QgcmVmcmVzaCA9IChjYikgPT4ge1xuICAgIGxvZygnR2V0dGluZyB0b2tlbicpO1xuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nIHRva2VuJyk7XG5cbiAgICByZXF1ZXN0LnBvc3QoJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS9vYXV0aC90b2tlbicsIHtcbiAgICAgIGF1dGg6IHtcbiAgICAgICAgdXNlcjogYXBwSWQsXG4gICAgICAgIHBhc3M6IHNlY3JldFxuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBmb3JtOiB7XG4gICAgICAgIGdyYW50X3R5cGU6ICdjbGllbnRfY3JlZGVudGlhbHMnXG4gICAgICB9XG4gICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgbG9nKCdFcnJvciBnZXR0aW5nIHRva2VuICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGdldHRpbmcgdG9rZW4gJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuXG4gICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBTYXZlIHRoZSBmcmVzaCB0b2tlblxuICAgICAgbG9nKCdHb3QgbmV3IHRva2VuIDogJyArIHJlcy5ib2R5LmFjY2Vzc190b2tlbik7XG4gICAgICB0b2sgPSByZXMuYm9keS5hY2Nlc3NfdG9rZW47XG4gICAgICB0b2tzID0gcmVzLmJvZHkuYWNjZXNzX3Rva2VuO1xuXG5cbiAgICAgIC8vIFNjaGVkdWxlIG5leHQgcmVmcmVzaCBhIGJpdCBiZWZvcmUgdGhlIHRva2VuIGV4cGlyZXNcbiAgICAgIGNvbnN0IHQgPSB0dGwodG9rKTtcbiAgICAgIGxvZygnVG9rZW4gdHRsJywgdCk7XG4gICAgICBzZXRUaW1lb3V0KHJlZnJlc2gsIE1hdGgubWF4KDAsIHQgLSA2MDAwMCkpLnVucmVmKCk7XG5cbiAgICAgIC8vIFJldHVybiBhIGZ1bmN0aW9uIHRoYXQnbGwgcmV0dXJuIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICBjYih1bmRlZmluZWQsIGN1cnJlbnQpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIE9idGFpbiBpbml0aWFsIHRva2VuXG4gIHNldEltbWVkaWF0ZSgoKSA9PiByZWZyZXNoKGNiKSk7XG5cbn07XG4iXX0=