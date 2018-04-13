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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRzb24uanMiXSwibmFtZXMiOlsicmVxdWVzdCIsImpzb253ZWJ0b2tlbiIsImxvZyIsInRva3MiLCJvVG9rZW4iLCJydW4iLCJhcHBJZCIsInNlY3JldCIsImNiIiwidG9rIiwiY3VycmVudCIsInR0bCIsIk1hdGgiLCJtYXgiLCJkZWNvZGUiLCJleHAiLCJEYXRlIiwibm93IiwicmVmcmVzaCIsImNvbnNvbGUiLCJwb3N0IiwiYXV0aCIsInVzZXIiLCJwYXNzIiwianNvbiIsImZvcm0iLCJncmFudF90eXBlIiwiZXJyIiwicmVzIiwic3RhdHVzQ29kZSIsIkVycm9yIiwiYm9keSIsImFjY2Vzc190b2tlbiIsInQiLCJzZXRUaW1lb3V0IiwidW5yZWYiLCJ1bmRlZmluZWQiLCJzZXRJbW1lZGlhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7NEJBQVlBLE87O0FBQ1o7OzRCQUFZQyxZOztBQUNaOzs7Ozs7OztBQUdBO0FBQ0EsSUFBTUMsTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLElBQUo7QUFDTyxJQUFNQyxrREFBUyxTQUFUQSxNQUFTLEdBQU07QUFDMUJGLE1BQUksWUFBVUMsSUFBZDtBQUNBLFNBQU9BLElBQVA7QUFDRCxDQUhNOztBQUtBLElBQU1FLDRDQUFNLFNBQU5BLEdBQU0sQ0FBQ0MsS0FBRCxFQUFRQyxNQUFSLEVBQWdCQyxFQUFoQixFQUF1Qjs7QUFFeEMsTUFBSUMsb0NBQUo7O0FBRUU7QUFDQSxNQUFNQyxVQUFVLFNBQVZBLE9BQVU7QUFBQSxXQUFNRCxHQUFOO0FBQUEsR0FBaEI7O0FBRUE7QUFDQSxNQUFNRSxNQUFNLFNBQU5BLEdBQU0sQ0FBQ0YsR0FBRDtBQUFBLFdBQ1ZHLEtBQUtDLEdBQUwsQ0FBUyxDQUFULEVBQVlaLGFBQWFhLE1BQWIsQ0FBb0JMLEdBQXBCLEVBQXlCTSxHQUF6QixHQUErQixJQUEvQixHQUFzQ0MsS0FBS0MsR0FBTCxFQUFsRCxDQURVO0FBQUEsR0FBWjs7QUFHQTtBQUNBLE1BQU1DLFVBQVUsU0FBVkEsT0FBVSxDQUFDVixFQUFELEVBQVE7QUFDdEJOLFFBQUksZUFBSjtBQUNBaUIsWUFBUWpCLEdBQVIsQ0FBWSxlQUFaOztBQUVBRixZQUFRb0IsSUFBUixDQUFhLDRDQUFiLEVBQTJEO0FBQ3pEQyxZQUFNO0FBQ0pDLGNBQU1oQixLQURGO0FBRUppQixjQUFNaEI7QUFGRixPQURtRDtBQUt6RGlCLFlBQU0sSUFMbUQ7QUFNekRDLFlBQU07QUFDSkMsb0JBQVk7QUFEUjtBQU5tRCxLQUEzRCxFQVNHLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ2YsVUFBR0QsT0FBT0MsSUFBSUMsVUFBSixLQUFtQixHQUE3QixFQUFrQztBQUNoQzNCLFlBQUksd0JBQUosRUFBOEJ5QixPQUFPQyxJQUFJQyxVQUF6QztBQUNBVixnQkFBUWpCLEdBQVIsQ0FBWSx3QkFBWixFQUFzQ3lCLE9BQU9DLElBQUlDLFVBQWpEOztBQUVBckIsV0FBR21CLE9BQU8sSUFBSUcsS0FBSixDQUFVRixJQUFJQyxVQUFkLENBQVY7QUFDQTtBQUNEOztBQUVEO0FBQ0EzQixVQUFJLHFCQUFtQjBCLElBQUlHLElBQUosQ0FBU0MsWUFBaEM7QUFDQXZCLFlBQU1tQixJQUFJRyxJQUFKLENBQVNDLFlBQWY7QUFDQTdCLGFBQU95QixJQUFJRyxJQUFKLENBQVNDLFlBQWhCOztBQUdBO0FBQ0EsVUFBTUMsSUFBSXRCLElBQUlGLEdBQUosQ0FBVjtBQUNBUCxVQUFJLFdBQUosRUFBaUIrQixDQUFqQjtBQUNBQyxpQkFBV2hCLE9BQVgsRUFBb0JOLEtBQUtDLEdBQUwsQ0FBUyxDQUFULEVBQVlvQixJQUFJLEtBQWhCLENBQXBCLEVBQTRDRSxLQUE1Qzs7QUFFQTtBQUNBM0IsU0FBRzRCLFNBQUgsRUFBYzFCLE9BQWQ7QUFDRCxLQS9CRDtBQWdDRCxHQXBDRDs7QUFzQ0E7QUFDQTJCLGVBQWE7QUFBQSxXQUFNbkIsUUFBUVYsRUFBUixDQUFOO0FBQUEsR0FBYjtBQUVILENBckRNIiwiZmlsZSI6IndhdHNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyBqc29ud2VidG9rZW4gZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgdG9rcztcbmV4cG9ydCBjb25zdCBvVG9rZW4gPSAoKSA9PiB7XG4gIGxvZyhcInRva3MgOiBcIit0b2tzKVxuICByZXR1cm4gdG9rcztcbn1cblxuZXhwb3J0IGNvbnN0IHJ1biA9IChhcHBJZCwgc2VjcmV0LCBjYikgPT4ge1xuXG4gIGxldCB0b2s7XG4gIFxuICAgIC8vIFJldHVybiB0aGUgY3VycmVudCB0b2tlblxuICAgIGNvbnN0IGN1cnJlbnQgPSAoKSA9PiB0b2s7XG4gIFxuICAgIC8vIFJldHVybiB0aGUgdGltZSB0byBsaXZlIG9mIGEgdG9rZW5cbiAgICBjb25zdCB0dGwgPSAodG9rKSA9PlxuICAgICAgTWF0aC5tYXgoMCwganNvbndlYnRva2VuLmRlY29kZSh0b2spLmV4cCAqIDEwMDAgLSBEYXRlLm5vdygpKTtcbiAgXG4gICAgLy8gUmVmcmVzaCB0aGUgdG9rZW5cbiAgICBjb25zdCByZWZyZXNoID0gKGNiKSA9PiB7XG4gICAgICBsb2coJ0dldHRpbmcgdG9rZW4nKTtcbiAgICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nIHRva2VuJyk7XG4gICAgICBcbiAgICAgIHJlcXVlc3QucG9zdCgnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJywge1xuICAgICAgICBhdXRoOiB7XG4gICAgICAgICAgdXNlcjogYXBwSWQsXG4gICAgICAgICAgcGFzczogc2VjcmV0XG4gICAgICAgIH0sXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICAgIGZvcm06IHtcbiAgICAgICAgICBncmFudF90eXBlOiAnY2xpZW50X2NyZWRlbnRpYWxzJ1xuICAgICAgICB9XG4gICAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICBsb2coJ0Vycm9yIGdldHRpbmcgdG9rZW4gJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBnZXR0aW5nIHRva2VuICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gIFxuICAgICAgICAvLyBTYXZlIHRoZSBmcmVzaCB0b2tlblxuICAgICAgICBsb2coJ0dvdCBuZXcgdG9rZW4gOiAnK3Jlcy5ib2R5LmFjY2Vzc190b2tlbik7XG4gICAgICAgIHRvayA9IHJlcy5ib2R5LmFjY2Vzc190b2tlbjtcbiAgICAgICAgdG9rcyA9IHJlcy5ib2R5LmFjY2Vzc190b2tlbjtcblxuICBcbiAgICAgICAgLy8gU2NoZWR1bGUgbmV4dCByZWZyZXNoIGEgYml0IGJlZm9yZSB0aGUgdG9rZW4gZXhwaXJlc1xuICAgICAgICBjb25zdCB0ID0gdHRsKHRvayk7XG4gICAgICAgIGxvZygnVG9rZW4gdHRsJywgdCk7XG4gICAgICAgIHNldFRpbWVvdXQocmVmcmVzaCwgTWF0aC5tYXgoMCwgdCAtIDYwMDAwKSkudW5yZWYoKTtcbiAgXG4gICAgICAgIC8vIFJldHVybiBhIGZ1bmN0aW9uIHRoYXQnbGwgcmV0dXJuIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICAgIGNiKHVuZGVmaW5lZCwgY3VycmVudCk7XG4gICAgICB9KTtcbiAgICB9O1xuICBcbiAgICAvLyBPYnRhaW4gaW5pdGlhbCB0b2tlblxuICAgIHNldEltbWVkaWF0ZSgoKSA9PiByZWZyZXNoKGNiKSk7XG4gIFxufTtcbiJdfQ==