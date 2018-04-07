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
            if (req.body.action === 'created') FinalMessage += 'added to issue #' + req.body.issue.id + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.body;

            return FinalMessage;
        }
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pc3N1ZV9ldmVudHMuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsImxvZyIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRJc3N1ZURhdGEiLCJvcHRpb25zIiwicmVxIiwicmVxdWVzdCIsInJlcyIsInJlc3BvbnNlIiwiRmluYWxNZXNzYWdlIiwiZ2V0IiwiYm9keSIsImFjdGlvbiIsImlzc3VlIiwiaWQiLCJyZXBvc2l0b3J5IiwibmFtZSIsImNvbW1lbnQiLCJ1c2VyIiwibG9naW4iLCJodG1sX3VybCJdLCJtYXBwaW5ncyI6Ijs7QUFNQTs7Ozs7O0FBTkEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlHLGFBQWFILFFBQVEsWUFBUixDQUFqQjs7QUFFQTs7QUFFQSxJQUFNSSxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUI7QUFBQSw0QkFFYkMsWUFGYSx3QkFFQUMsT0FGQSxFQUVRO0FBQ2pCLFlBQUlDLE1BQU1ELFFBQVFFLE9BQWxCO0FBQ0EsWUFBSUMsTUFBTUgsUUFBUUksUUFBbEI7O0FBRUEsWUFBSUMsZUFBYSxJQUFqQjs7QUFFQSxZQUFHSixJQUFJSyxHQUFKLENBQVEsZ0JBQVIsTUFBOEIsZUFBakMsRUFBa0Q7O0FBRzlDRCw0QkFBZ0IsMEJBQWhCO0FBQ0EsZ0JBQUdKLElBQUlNLElBQUosQ0FBU0MsTUFBVCxLQUFvQixTQUF2QixFQUNJSCxnQkFBZ0IscUJBQW1CSixJQUFJTSxJQUFKLENBQVNFLEtBQVQsQ0FBZUMsRUFBbEMsR0FBcUMsaUJBQXJDLEdBQXdEVCxJQUFJTSxJQUFKLENBQVNJLFVBQVQsQ0FBb0JDLElBQTVFLEdBQWlGLGFBQWpGLEdBQStGWCxJQUFJTSxJQUFKLENBQVNJLFVBQVQsQ0FBb0JELEVBQW5ILEdBQXNILFdBQXRILEdBQWtJVCxJQUFJTSxJQUFKLENBQVNNLE9BQVQsQ0FBaUJDLElBQWpCLENBQXNCQyxLQUF4SixHQUE4SixxQ0FBOUosR0FBb01kLElBQUlNLElBQUosQ0FBU00sT0FBVCxDQUFpQkcsUUFBck4sR0FBOE4seUNBQTlOLEdBQXdRZixJQUFJTSxJQUFKLENBQVNBLElBQWpTOztBQUVKLG1CQUFPRixZQUFQO0FBQ0g7QUFDSjtBQWpCWSxDQUFqQiIsImZpbGUiOiJpc3N1ZV9ldmVudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgZ2V0SXNzdWVEYXRhKG9wdGlvbnMpe1xuICAgICAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgICAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcblxuICAgICAgICB2YXIgRmluYWxNZXNzYWdlPW51bGw7XG5cbiAgICAgICAgaWYocmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSA9PT0gJ2lzc3VlX2NvbW1lbnQnICl7XG5cblxuICAgICAgICAgICAgRmluYWxNZXNzYWdlICs9ICdBIENvbW1lbnQgaGFzIGp1c3QgYmVlbiAnXG4gICAgICAgICAgICBpZihyZXEuYm9keS5hY3Rpb24gPT09ICdjcmVhdGVkJylcbiAgICAgICAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ2FkZGVkIHRvIGlzc3VlICMnK3JlcS5ib2R5Lmlzc3VlLmlkKycgaW4gcmVwb3NpdG9yeSAnICtyZXEuYm9keS5yZXBvc2l0b3J5Lm5hbWUrJyB3aXRoIElEIDogJytyZXEuYm9keS5yZXBvc2l0b3J5LmlkKycgYnkgdXNlciAnK3JlcS5ib2R5LmNvbW1lbnQudXNlci5sb2dpbisnXFxuIFRoZSBjb21tZW50IGNhbiBiZSBmb3VuZCBoZXJlIDogJytyZXEuYm9keS5jb21tZW50Lmh0bWxfdXJsKycuIFxcbiBUaGUgY29udGVudCBvZiB0aGUgY29tbWVudCBpcyA6IFxcbicrcmVxLmJvZHkuYm9keTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZTtcbiAgICAgICAgfVxuICAgIH1cbn0iXX0=