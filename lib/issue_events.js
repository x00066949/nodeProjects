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

        log('Event type: ' + req.get('X-Github-Event'));

        if (req.get('X-Github-Event') === 'issue_comment') {

            log('action: ' + req.body.action);

            FinalMessage += 'A Comment has just been ';
            if (req.body.action === 'created') FinalMessage += 'added to issue #' + req.body.issue.id + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.body;
        } else {
            FinalMessage += 'Not a comment on an issue';
        }
        return FinalMessage;
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pc3N1ZV9ldmVudHMuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsImxvZyIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRJc3N1ZURhdGEiLCJvcHRpb25zIiwicmVxIiwicmVxdWVzdCIsInJlcyIsInJlc3BvbnNlIiwiRmluYWxNZXNzYWdlIiwiZ2V0IiwiYm9keSIsImFjdGlvbiIsImlzc3VlIiwiaWQiLCJyZXBvc2l0b3J5IiwibmFtZSIsImNvbW1lbnQiLCJ1c2VyIiwibG9naW4iLCJodG1sX3VybCJdLCJtYXBwaW5ncyI6Ijs7QUFNQTs7Ozs7O0FBTkEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlHLGFBQWFILFFBQVEsWUFBUixDQUFqQjs7QUFFQTs7QUFFQSxJQUFNSSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUI7QUFBQSw0QkFFYkMsWUFGYSx3QkFFQUMsT0FGQSxFQUVRO0FBQ2pCLFlBQUlDLE1BQU1ELFFBQVFFLE9BQWxCO0FBQ0EsWUFBSUMsTUFBTUgsUUFBUUksUUFBbEI7O0FBRUEsWUFBSUMsZUFBYSxJQUFqQjs7QUFFQVQsWUFBSSxpQkFBZUssSUFBSUssR0FBSixDQUFRLGdCQUFSLENBQW5COztBQUVBLFlBQUdMLElBQUlLLEdBQUosQ0FBUSxnQkFBUixNQUE4QixlQUFqQyxFQUFrRDs7QUFFOUNWLGdCQUFJLGFBQVdLLElBQUlNLElBQUosQ0FBU0MsTUFBeEI7O0FBRUFILDRCQUFnQiwwQkFBaEI7QUFDQSxnQkFBR0osSUFBSU0sSUFBSixDQUFTQyxNQUFULEtBQW9CLFNBQXZCLEVBQ0lILGdCQUFnQixxQkFBbUJKLElBQUlNLElBQUosQ0FBU0UsS0FBVCxDQUFlQyxFQUFsQyxHQUFxQyxpQkFBckMsR0FBd0RULElBQUlNLElBQUosQ0FBU0ksVUFBVCxDQUFvQkMsSUFBNUUsR0FBaUYsYUFBakYsR0FBK0ZYLElBQUlNLElBQUosQ0FBU0ksVUFBVCxDQUFvQkQsRUFBbkgsR0FBc0gsV0FBdEgsR0FBa0lULElBQUlNLElBQUosQ0FBU00sT0FBVCxDQUFpQkMsSUFBakIsQ0FBc0JDLEtBQXhKLEdBQThKLHFDQUE5SixHQUFvTWQsSUFBSU0sSUFBSixDQUFTTSxPQUFULENBQWlCRyxRQUFyTixHQUE4Tix5Q0FBOU4sR0FBd1FmLElBQUlNLElBQUosQ0FBU0EsSUFBalM7QUFHUCxTQVRELE1BVUk7QUFDQUYsNEJBQWdCLDJCQUFoQjtBQUNIO0FBQ0QsZUFBT0EsWUFBUDtBQUNIO0FBeEJZLENBQWpCIiwiZmlsZSI6Imlzc3VlX2V2ZW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciBSZWdleCA9IHJlcXVpcmUoJ3JlZ2V4Jyk7XG52YXIgZGF0ZUZvcm1hdCA9IHJlcXVpcmUoJ2RhdGVmb3JtYXQnKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICBnZXRJc3N1ZURhdGEob3B0aW9ucyl7XG4gICAgICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuXG4gICAgICAgIHZhciBGaW5hbE1lc3NhZ2U9bnVsbDtcblxuICAgICAgICBsb2coJ0V2ZW50IHR5cGU6ICcrcmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSlcblxuICAgICAgICBpZihyZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpID09PSAnaXNzdWVfY29tbWVudCcgKXtcblxuICAgICAgICAgICAgbG9nKCdhY3Rpb246ICcrcmVxLmJvZHkuYWN0aW9uKVxuXG4gICAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ0EgQ29tbWVudCBoYXMganVzdCBiZWVuICdcbiAgICAgICAgICAgIGlmKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ2NyZWF0ZWQnKVxuICAgICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSAnYWRkZWQgdG8gaXNzdWUgIycrcmVxLmJvZHkuaXNzdWUuaWQrJyBpbiByZXBvc2l0b3J5ICcgK3JlcS5ib2R5LnJlcG9zaXRvcnkubmFtZSsnIHdpdGggSUQgOiAnK3JlcS5ib2R5LnJlcG9zaXRvcnkuaWQrJyBieSB1c2VyICcrcmVxLmJvZHkuY29tbWVudC51c2VyLmxvZ2luKydcXG4gVGhlIGNvbW1lbnQgY2FuIGJlIGZvdW5kIGhlcmUgOiAnK3JlcS5ib2R5LmNvbW1lbnQuaHRtbF91cmwrJy4gXFxuIFRoZSBjb250ZW50IG9mIHRoZSBjb21tZW50IGlzIDogXFxuJytyZXEuYm9keS5ib2R5O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgRmluYWxNZXNzYWdlICs9ICdOb3QgYSBjb21tZW50IG9uIGFuIGlzc3VlJ1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2U7XG4gICAgfVxufSJdfQ==