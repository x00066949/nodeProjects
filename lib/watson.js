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
      log('Got new token');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRzb24uanMiXSwibmFtZXMiOlsicmVxdWVzdCIsImpzb253ZWJ0b2tlbiIsImxvZyIsInJ1biIsImFwcElkIiwic2VjcmV0IiwiY2IiLCJ0b2siLCJjdXJyZW50IiwidHRsIiwiTWF0aCIsIm1heCIsImRlY29kZSIsImV4cCIsIkRhdGUiLCJub3ciLCJyZWZyZXNoIiwiY29uc29sZSIsInBvc3QiLCJhdXRoIiwidXNlciIsInBhc3MiLCJqc29uIiwiZm9ybSIsImdyYW50X3R5cGUiLCJlcnIiLCJyZXMiLCJzdGF0dXNDb2RlIiwiRXJyb3IiLCJib2R5IiwiYWNjZXNzX3Rva2VuIiwidCIsInNldFRpbWVvdXQiLCJ1bnJlZiIsInVuZGVmaW5lZCIsInNldEltbWVkaWF0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLFk7O0FBQ1o7Ozs7Ozs7O0FBR0E7QUFDQSxJQUFNQyxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRU8sSUFBTUMsNENBQU0sU0FBTkEsR0FBTSxDQUFDQyxLQUFELEVBQVFDLE1BQVIsRUFBZ0JDLEVBQWhCLEVBQXVCOztBQUV4QyxNQUFJQyxvQ0FBSjs7QUFFRTtBQUNBLE1BQU1DLFVBQVUsU0FBVkEsT0FBVTtBQUFBLFdBQU1ELEdBQU47QUFBQSxHQUFoQjs7QUFFQTtBQUNBLE1BQU1FLE1BQU0sU0FBTkEsR0FBTSxDQUFDRixHQUFEO0FBQUEsV0FDVkcsS0FBS0MsR0FBTCxDQUFTLENBQVQsRUFBWVYsYUFBYVcsTUFBYixDQUFvQkwsR0FBcEIsRUFBeUJNLEdBQXpCLEdBQStCLElBQS9CLEdBQXNDQyxLQUFLQyxHQUFMLEVBQWxELENBRFU7QUFBQSxHQUFaOztBQUdBO0FBQ0EsTUFBTUMsVUFBVSxTQUFWQSxPQUFVLENBQUNWLEVBQUQsRUFBUTtBQUN0QkosUUFBSSxlQUFKO0FBQ0FlLFlBQVFmLEdBQVIsQ0FBWSxlQUFaOztBQUVBRixZQUFRa0IsSUFBUixDQUFhLDRDQUFiLEVBQTJEO0FBQ3pEQyxZQUFNO0FBQ0pDLGNBQU1oQixLQURGO0FBRUppQixjQUFNaEI7QUFGRixPQURtRDtBQUt6RGlCLFlBQU0sSUFMbUQ7QUFNekRDLFlBQU07QUFDSkMsb0JBQVk7QUFEUjtBQU5tRCxLQUEzRCxFQVNHLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFjO0FBQ2YsVUFBR0QsT0FBT0MsSUFBSUMsVUFBSixLQUFtQixHQUE3QixFQUFrQztBQUNoQ3pCLFlBQUksd0JBQUosRUFBOEJ1QixPQUFPQyxJQUFJQyxVQUF6QztBQUNBVixnQkFBUWYsR0FBUixDQUFZLHdCQUFaLEVBQXNDdUIsT0FBT0MsSUFBSUMsVUFBakQ7O0FBRUFyQixXQUFHbUIsT0FBTyxJQUFJRyxLQUFKLENBQVVGLElBQUlDLFVBQWQsQ0FBVjtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQXpCLFVBQUksZUFBSjtBQUNBSyxZQUFNbUIsSUFBSUcsSUFBSixDQUFTQyxZQUFmOztBQUVBO0FBQ0EsVUFBTUMsSUFBSXRCLElBQUlGLEdBQUosQ0FBVjtBQUNBTCxVQUFJLFdBQUosRUFBaUI2QixDQUFqQjtBQUNBQyxpQkFBV2hCLE9BQVgsRUFBb0JOLEtBQUtDLEdBQUwsQ0FBUyxDQUFULEVBQVlvQixJQUFJLEtBQWhCLENBQXBCLEVBQTRDRSxLQUE1Qzs7QUFFQTtBQUNBM0IsU0FBRzRCLFNBQUgsRUFBYzFCLE9BQWQ7QUFDRCxLQTdCRDtBQThCRCxHQWxDRDs7QUFvQ0E7QUFDQTJCLGVBQWE7QUFBQSxXQUFNbkIsUUFBUVYsRUFBUixDQUFOO0FBQUEsR0FBYjtBQUVILENBbkRNIiwiZmlsZSI6IndhdHNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgKiBhcyBqc29ud2VidG9rZW4gZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cblxuLy8gU2V0dXAgZGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5leHBvcnQgY29uc3QgcnVuID0gKGFwcElkLCBzZWNyZXQsIGNiKSA9PiB7XG5cbiAgbGV0IHRvaztcbiAgXG4gICAgLy8gUmV0dXJuIHRoZSBjdXJyZW50IHRva2VuXG4gICAgY29uc3QgY3VycmVudCA9ICgpID0+IHRvaztcbiAgXG4gICAgLy8gUmV0dXJuIHRoZSB0aW1lIHRvIGxpdmUgb2YgYSB0b2tlblxuICAgIGNvbnN0IHR0bCA9ICh0b2spID0+XG4gICAgICBNYXRoLm1heCgwLCBqc29ud2VidG9rZW4uZGVjb2RlKHRvaykuZXhwICogMTAwMCAtIERhdGUubm93KCkpO1xuICBcbiAgICAvLyBSZWZyZXNoIHRoZSB0b2tlblxuICAgIGNvbnN0IHJlZnJlc2ggPSAoY2IpID0+IHtcbiAgICAgIGxvZygnR2V0dGluZyB0b2tlbicpO1xuICAgICAgY29uc29sZS5sb2coJ0dldHRpbmcgdG9rZW4nKTtcbiAgICAgIFxuICAgICAgcmVxdWVzdC5wb3N0KCdodHRwczovL2FwaS53YXRzb253b3JrLmlibS5jb20vb2F1dGgvdG9rZW4nLCB7XG4gICAgICAgIGF1dGg6IHtcbiAgICAgICAgICB1c2VyOiBhcHBJZCxcbiAgICAgICAgICBwYXNzOiBzZWNyZXRcbiAgICAgICAgfSxcbiAgICAgICAganNvbjogdHJ1ZSxcbiAgICAgICAgZm9ybToge1xuICAgICAgICAgIGdyYW50X3R5cGU6ICdjbGllbnRfY3JlZGVudGlhbHMnXG4gICAgICAgIH1cbiAgICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICBpZihlcnIgfHwgcmVzLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgIGxvZygnRXJyb3IgZ2V0dGluZyB0b2tlbiAlbycsIGVyciB8fCByZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGdldHRpbmcgdG9rZW4gJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNiKGVyciB8fCBuZXcgRXJyb3IocmVzLnN0YXR1c0NvZGUpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgXG4gICAgICAgIC8vIFNhdmUgdGhlIGZyZXNoIHRva2VuXG4gICAgICAgIGxvZygnR290IG5ldyB0b2tlbicpO1xuICAgICAgICB0b2sgPSByZXMuYm9keS5hY2Nlc3NfdG9rZW47XG4gIFxuICAgICAgICAvLyBTY2hlZHVsZSBuZXh0IHJlZnJlc2ggYSBiaXQgYmVmb3JlIHRoZSB0b2tlbiBleHBpcmVzXG4gICAgICAgIGNvbnN0IHQgPSB0dGwodG9rKTtcbiAgICAgICAgbG9nKCdUb2tlbiB0dGwnLCB0KTtcbiAgICAgICAgc2V0VGltZW91dChyZWZyZXNoLCBNYXRoLm1heCgwLCB0IC0gNjAwMDApKS51bnJlZigpO1xuICBcbiAgICAgICAgLy8gUmV0dXJuIGEgZnVuY3Rpb24gdGhhdCdsbCByZXR1cm4gdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgY2IodW5kZWZpbmVkLCBjdXJyZW50KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIFxuICAgIC8vIE9idGFpbiBpbml0aWFsIHRva2VuXG4gICAgc2V0SW1tZWRpYXRlKCgpID0+IHJlZnJlc2goY2IpKTtcbiAgXG59O1xuXG5cblxuXG4iXX0=