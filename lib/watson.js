/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = undefined;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRzb24uanMiXSwibmFtZXMiOlsicmVxdWVzdCIsImpzb253ZWJ0b2tlbiIsImxvZyIsInJ1biIsImFwcElkIiwic2VjcmV0IiwiY2IiLCJ0b2siLCJjdXJyZW50IiwidHRsIiwiTWF0aCIsIm1heCIsImRlY29kZSIsImV4cCIsIkRhdGUiLCJub3ciLCJyZWZyZXNoIiwiY29uc29sZSIsInBvc3QiLCJhdXRoIiwidXNlciIsInBhc3MiLCJqc29uIiwiZm9ybSIsImdyYW50X3R5cGUiLCJlcnIiLCJyZXMiLCJzdGF0dXNDb2RlIiwiRXJyb3IiLCJib2R5IiwiYWNjZXNzX3Rva2VuIiwidCIsInNldFRpbWVvdXQiLCJ1bnJlZiIsInVuZGVmaW5lZCIsInNldEltbWVkaWF0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLFk7O0FBQ1o7Ozs7Ozs7O0FBR0E7QUFDQSxJQUFNQyxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRU8sSUFBTUMsNENBQU0sU0FBTkEsR0FBTSxDQUFDQyxLQUFELEVBQVFDLE1BQVIsRUFBZ0JDLEVBQWhCLEVBQXVCOztBQUV4QyxNQUFJQyxvQ0FBSjs7QUFFRTtBQUNBLE1BQU1DLFVBQVUsU0FBVkEsT0FBVTtBQUFBLFdBQU1ELEdBQU47QUFBQSxHQUFoQjs7QUFFQTtBQUNBLE1BQU1FLE1BQU0sU0FBTkEsR0FBTSxDQUFDRixHQUFEO0FBQUEsV0FDVkcsS0FBS0MsR0FBTCxDQUFTLENBQVQsRUFBWVYsYUFBYVcsTUFBYixDQUFvQkwsR0FBcEIsRUFBeUJNLEdBQXpCLEdBQStCLElBQS9CLEdBQXNDQyxLQUFLQyxHQUFMLEVBQWxELENBRFU7QUFBQSxHQUFaOztBQUdBO0FBQ0EsTUFBTUMsVUFBVSxTQUFWQSxPQUFVLENBQUNWLEVBQUQsRUFBUTtBQUN0QkosUUFBSSxlQUFKO0FBQ0FlLFlBQVFmLEdBQVIsQ0FBWSxlQUFaOztBQUVBRixZQUFRa0IsSUFBUixDQUFhLDRDQUFiLEVBQTJEO0FBQ3pEQyxZQUFNO0FBQ0pDLGNBQU1oQixLQURGO0FBRUppQixjQUFNaEI7QUFGRixPQURtRDtBQUt6RGlCLFlBQU0sSUFMbUQ7QUFNekRDLFlBQU07QUFDSkMsb0JBQVk7QUFEUjtBQU5tRCxLQUEzRCxFQVNHLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ2YsVUFBR0QsT0FBT0MsSUFBSUMsVUFBSixLQUFtQixHQUE3QixFQUFrQztBQUNoQ3pCLFlBQUksd0JBQUosRUFBOEJ1QixPQUFPQyxJQUFJQyxVQUF6QztBQUNBVixnQkFBUWYsR0FBUixDQUFZLHdCQUFaLEVBQXNDdUIsT0FBT0MsSUFBSUMsVUFBakQ7O0FBRUFyQixXQUFHbUIsT0FBTyxJQUFJRyxLQUFKLENBQVVGLElBQUlDLFVBQWQsQ0FBVjtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQXpCLFVBQUkscUJBQW1Cd0IsSUFBSUcsSUFBSixDQUFTQyxZQUFoQztBQUNBdkIsWUFBTW1CLElBQUlHLElBQUosQ0FBU0MsWUFBZjs7QUFHQTtBQUNBLFVBQU1DLElBQUl0QixJQUFJRixHQUFKLENBQVY7QUFDQUwsVUFBSSxXQUFKLEVBQWlCNkIsQ0FBakI7QUFDQUMsaUJBQVdoQixPQUFYLEVBQW9CTixLQUFLQyxHQUFMLENBQVMsQ0FBVCxFQUFZb0IsSUFBSSxLQUFoQixDQUFwQixFQUE0Q0UsS0FBNUM7O0FBRUE7QUFDQTNCLFNBQUc0QixTQUFILEVBQWMxQixPQUFkO0FBQ0QsS0E5QkQ7QUErQkQsR0FuQ0Q7O0FBcUNBO0FBQ0EyQixlQUFhO0FBQUEsV0FBTW5CLFFBQVFWLEVBQVIsQ0FBTjtBQUFBLEdBQWI7QUFFSCxDQXBETSIsImZpbGUiOiJ3YXRzb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMganNvbndlYnRva2VuIGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuXG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxuZXhwb3J0IGNvbnN0IHJ1biA9IChhcHBJZCwgc2VjcmV0LCBjYikgPT4ge1xuXG4gIGxldCB0b2s7XG4gIFxuICAgIC8vIFJldHVybiB0aGUgY3VycmVudCB0b2tlblxuICAgIGNvbnN0IGN1cnJlbnQgPSAoKSA9PiB0b2s7XG4gIFxuICAgIC8vIFJldHVybiB0aGUgdGltZSB0byBsaXZlIG9mIGEgdG9rZW5cbiAgICBjb25zdCB0dGwgPSAodG9rKSA9PlxuICAgICAgTWF0aC5tYXgoMCwganNvbndlYnRva2VuLmRlY29kZSh0b2spLmV4cCAqIDEwMDAgLSBEYXRlLm5vdygpKTtcbiAgXG4gICAgLy8gUmVmcmVzaCB0aGUgdG9rZW5cbiAgICBjb25zdCByZWZyZXNoID0gKGNiKSA9PiB7XG4gICAgICBsb2coJ0dldHRpbmcgdG9rZW4nKTtcbiAgICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nIHRva2VuJyk7XG4gICAgICBcbiAgICAgIHJlcXVlc3QucG9zdCgnaHR0cHM6Ly9hcGkud2F0c29ud29yay5pYm0uY29tL29hdXRoL3Rva2VuJywge1xuICAgICAgICBhdXRoOiB7XG4gICAgICAgICAgdXNlcjogYXBwSWQsXG4gICAgICAgICAgcGFzczogc2VjcmV0XG4gICAgICAgIH0sXG4gICAgICAgIGpzb246IHRydWUsXG4gICAgICAgIGZvcm06IHtcbiAgICAgICAgICBncmFudF90eXBlOiAnY2xpZW50X2NyZWRlbnRpYWxzJ1xuICAgICAgICB9XG4gICAgICB9LCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICBsb2coJ0Vycm9yIGdldHRpbmcgdG9rZW4gJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBnZXR0aW5nIHRva2VuICVvJywgZXJyIHx8IHJlcy5zdGF0dXNDb2RlKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gIFxuICAgICAgICAvLyBTYXZlIHRoZSBmcmVzaCB0b2tlblxuICAgICAgICBsb2coJ0dvdCBuZXcgdG9rZW4gOiAnK3Jlcy5ib2R5LmFjY2Vzc190b2tlbik7XG4gICAgICAgIHRvayA9IHJlcy5ib2R5LmFjY2Vzc190b2tlbjtcblxuICBcbiAgICAgICAgLy8gU2NoZWR1bGUgbmV4dCByZWZyZXNoIGEgYml0IGJlZm9yZSB0aGUgdG9rZW4gZXhwaXJlc1xuICAgICAgICBjb25zdCB0ID0gdHRsKHRvayk7XG4gICAgICAgIGxvZygnVG9rZW4gdHRsJywgdCk7XG4gICAgICAgIHNldFRpbWVvdXQocmVmcmVzaCwgTWF0aC5tYXgoMCwgdCAtIDYwMDAwKSkudW5yZWYoKTtcbiAgXG4gICAgICAgIC8vIFJldHVybiBhIGZ1bmN0aW9uIHRoYXQnbGwgcmV0dXJuIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICAgIGNiKHVuZGVmaW5lZCwgY3VycmVudCk7XG4gICAgICB9KTtcbiAgICB9O1xuICBcbiAgICAvLyBPYnRhaW4gaW5pdGlhbCB0b2tlblxuICAgIHNldEltbWVkaWF0ZSgoKSA9PiByZWZyZXNoKGNiKSk7XG4gIFxufTtcbiJdfQ==