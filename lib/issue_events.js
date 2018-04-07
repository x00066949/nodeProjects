/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');
var dateFormat = require('dateformat');

// Setup debug log

var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-scrumbot');

module.exports = {
    /*istanbul ignore next*/getIssueData: function getIssueData(options) {
        var req = options.request;
        var res = options.response;

        var FinalMessage = null;

        if (req.get('X-Github-Event') === 'issue_comment') {

            FinalMessage += 'A Comment has just been ';
            if (req.body.action === 'created') FinalMessage += 'added to issue #' + req.body.issue.id + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.body;

            return FinalMessage;
        }
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pc3N1ZV9ldmVudHMuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsImxvZyIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRJc3N1ZURhdGEiLCJvcHRpb25zIiwicmVxIiwicmVxdWVzdCIsInJlcyIsInJlc3BvbnNlIiwiRmluYWxNZXNzYWdlIiwiZ2V0IiwiYm9keSIsImFjdGlvbiIsImlzc3VlIiwiaWQiLCJyZXBvc2l0b3J5IiwibmFtZSIsInVzZXIiLCJsb2dpbiIsImNvbW1lbnQiLCJodG1sX3VybCJdLCJtYXBwaW5ncyI6Ijs7QUFNQTs7Ozs7O0FBTkEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlHLGFBQWFILFFBQVEsWUFBUixDQUFqQjs7QUFFQTs7QUFFQSxJQUFNSSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUI7QUFBQSw0QkFFYkMsWUFGYSx3QkFFQUMsT0FGQSxFQUVRO0FBQ2pCLFlBQUlDLE1BQU1ELFFBQVFFLE9BQWxCO0FBQ0EsWUFBSUMsTUFBTUgsUUFBUUksUUFBbEI7O0FBRUEsWUFBSUMsZUFBYSxJQUFqQjs7QUFFQSxZQUFHSixJQUFJSyxHQUFKLENBQVEsZ0JBQVIsTUFBOEIsZUFBakMsRUFBa0Q7O0FBRTlDRCw0QkFBZ0IsMEJBQWhCO0FBQ0EsZ0JBQUdKLElBQUlNLElBQUosQ0FBU0MsTUFBVCxLQUFvQixTQUF2QixFQUNJSCxnQkFBZ0IscUJBQW1CSixJQUFJTSxJQUFKLENBQVNFLEtBQVQsQ0FBZUMsRUFBbEMsR0FBcUMsaUJBQXJDLEdBQXdEVCxJQUFJTSxJQUFKLENBQVNJLFVBQVQsQ0FBb0JDLElBQTVFLEdBQWlGLGFBQWpGLEdBQStGWCxJQUFJTSxJQUFKLENBQVNJLFVBQVQsQ0FBb0JELEVBQW5ILEdBQXNILFdBQXRILEdBQWtJVCxJQUFJTSxJQUFKLENBQVNNLElBQVQsQ0FBY0MsS0FBaEosR0FBc0oscUNBQXRKLEdBQTRMYixJQUFJTSxJQUFKLENBQVNRLE9BQVQsQ0FBaUJDLFFBQTdNLEdBQXNOLHlDQUF0TixHQUFnUWYsSUFBSU0sSUFBSixDQUFTQSxJQUF6Ujs7QUFFSixtQkFBT0YsWUFBUDtBQUNIO0FBQ0o7QUFoQlksQ0FBakIiLCJmaWxlIjoiaXNzdWVfZXZlbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIGdldElzc3VlRGF0YShvcHRpb25zKXtcbiAgICAgICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICAgICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG5cbiAgICAgICAgdmFyIEZpbmFsTWVzc2FnZT1udWxsO1xuXG4gICAgICAgIGlmKHJlcS5nZXQoJ1gtR2l0aHViLUV2ZW50JykgPT09ICdpc3N1ZV9jb21tZW50JyApe1xuXG4gICAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ0EgQ29tbWVudCBoYXMganVzdCBiZWVuICdcbiAgICAgICAgICAgIGlmKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ2NyZWF0ZWQnKVxuICAgICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSAnYWRkZWQgdG8gaXNzdWUgIycrcmVxLmJvZHkuaXNzdWUuaWQrJyBpbiByZXBvc2l0b3J5ICcgK3JlcS5ib2R5LnJlcG9zaXRvcnkubmFtZSsnIHdpdGggSUQgOiAnK3JlcS5ib2R5LnJlcG9zaXRvcnkuaWQrJyBieSB1c2VyICcrcmVxLmJvZHkudXNlci5sb2dpbisnXFxuIFRoZSBjb21tZW50IGNhbiBiZSBmb3VuZCBoZXJlIDogJytyZXEuYm9keS5jb21tZW50Lmh0bWxfdXJsKycuIFxcbiBUaGUgY29udGVudCBvZiB0aGUgY29tbWVudCBpcyA6IFxcbicrcmVxLmJvZHkuYm9keTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZTtcbiAgICAgICAgfVxuICAgIH1cbn0iXX0=