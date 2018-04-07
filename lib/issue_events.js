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
    allMe: function /*istanbul ignore next*/allMe(options) {
        var req = options.request;
        var res = options.response;
        var test = options.test;

        var FinalData = {
            "UserId": "Map",
            "Check": test
        };

        return FinalData;
    },

    /*istanbul ignore next*/getIssueData: function getIssueData(options) {

        return this.parseResponse({ request: options.request, response: options.response });
    },


    parseResponse: function /*istanbul ignore next*/parseResponse(options) {
        var req = options.request;
        var res = options.response;

        var FinalMessage = '';

        if (req.get('X-Github-Event') === 'issue_comment') {

            log('action: ' + req.body.action);

            FinalMessage = 'A Comment has just been ';

            if (req.body.action === 'created') {
                FinalMessage += 'added to issue #' + req.body.issue.id + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.body;
            } else {
                FinalMessage += req.body.action + ' action not coded yet...coming soon';
            }
        } else {
            log('Event type: ' + req.get('X-Github-Event'));
            FinalMessage = 'Not a comment on an issue';
        }
        return FinalMessage;
    }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pc3N1ZV9ldmVudHMuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsImxvZyIsIm1vZHVsZSIsImV4cG9ydHMiLCJhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0SXNzdWVEYXRhIiwicGFyc2VSZXNwb25zZSIsIkZpbmFsTWVzc2FnZSIsImdldCIsImJvZHkiLCJhY3Rpb24iLCJpc3N1ZSIsImlkIiwicmVwb3NpdG9yeSIsIm5hbWUiLCJjb21tZW50IiwidXNlciIsImxvZ2luIiwiaHRtbF91cmwiXSwibWFwcGluZ3MiOiI7O0FBTUE7Ozs7OztBQU5BLElBQUlBLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FBS0QsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUUsUUFBUUYsUUFBUSxPQUFSLENBQVo7QUFDQSxJQUFJRyxhQUFhSCxRQUFRLFlBQVIsQ0FBakI7O0FBRUE7O0FBRUEsSUFBTUksTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2JDLFdBQU8sdUNBQVVDLE9BQVYsRUFBbUI7QUFDdEIsWUFBSUMsTUFBTUQsUUFBUUUsT0FBbEI7QUFDQSxZQUFJQyxNQUFNSCxRQUFRSSxRQUFsQjtBQUNBLFlBQUlDLE9BQU9MLFFBQVFLLElBQW5COztBQUVBLFlBQUlDLFlBQVk7QUFDZCxzQkFBVSxLQURJO0FBRWQscUJBQVNEO0FBRkssU0FBaEI7O0FBS0EsZUFBT0MsU0FBUDtBQUNELEtBWlU7O0FBQUEsNEJBY2JDLFlBZGEsd0JBY0FQLE9BZEEsRUFjUTs7QUFFakIsZUFBTyxLQUFLUSxhQUFMLENBQW1CLEVBQUNOLFNBQVFGLFFBQVFFLE9BQWpCLEVBQXlCRSxVQUFTSixRQUFRSSxRQUExQyxFQUFuQixDQUFQO0FBRUgsS0FsQlk7OztBQW9CYkksbUJBQWdCLCtDQUFTUixPQUFULEVBQWtCO0FBQzlCLFlBQUlDLE1BQU1ELFFBQVFFLE9BQWxCO0FBQ0EsWUFBSUMsTUFBTUgsUUFBUUksUUFBbEI7O0FBRUEsWUFBSUssZUFBYSxFQUFqQjs7QUFFQSxZQUFHUixJQUFJUyxHQUFKLENBQVEsZ0JBQVIsTUFBOEIsZUFBakMsRUFBa0Q7O0FBRTlDZCxnQkFBSSxhQUFXSyxJQUFJVSxJQUFKLENBQVNDLE1BQXhCOztBQUVBSCwyQkFBZSwwQkFBZjs7QUFFQSxnQkFBR1IsSUFBSVUsSUFBSixDQUFTQyxNQUFULEtBQW9CLFNBQXZCLEVBQWlDO0FBQzdCSCxnQ0FBZ0IscUJBQW1CUixJQUFJVSxJQUFKLENBQVNFLEtBQVQsQ0FBZUMsRUFBbEMsR0FBcUMsaUJBQXJDLEdBQXdEYixJQUFJVSxJQUFKLENBQVNJLFVBQVQsQ0FBb0JDLElBQTVFLEdBQWlGLGFBQWpGLEdBQStGZixJQUFJVSxJQUFKLENBQVNJLFVBQVQsQ0FBb0JELEVBQW5ILEdBQXNILFdBQXRILEdBQWtJYixJQUFJVSxJQUFKLENBQVNNLE9BQVQsQ0FBaUJDLElBQWpCLENBQXNCQyxLQUF4SixHQUE4SixxQ0FBOUosR0FBb01sQixJQUFJVSxJQUFKLENBQVNNLE9BQVQsQ0FBaUJHLFFBQXJOLEdBQThOLHlDQUE5TixHQUF3UW5CLElBQUlVLElBQUosQ0FBU0EsSUFBalM7QUFDSCxhQUZELE1BRUs7QUFDREYsZ0NBQWdCUixJQUFJVSxJQUFKLENBQVNDLE1BQVQsR0FBZ0IscUNBQWhDO0FBQ0g7QUFFSixTQVpELE1BYUk7QUFDQWhCLGdCQUFJLGlCQUFlSyxJQUFJUyxHQUFKLENBQVEsZ0JBQVIsQ0FBbkI7QUFDQUQsMkJBQWUsMkJBQWY7QUFDSDtBQUNELGVBQU9BLFlBQVA7QUFDSDs7QUE1Q1ksQ0FBakIiLCJmaWxlIjoiaXNzdWVfZXZlbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICAgICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuICAgIFxuICAgICAgICB2YXIgRmluYWxEYXRhID0ge1xuICAgICAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICAgICAgXCJDaGVja1wiOiB0ZXN0XG4gICAgICAgIH07XG4gICAgXG4gICAgICAgIHJldHVybiBGaW5hbERhdGE7XG4gICAgICB9LFxuXG4gICAgZ2V0SXNzdWVEYXRhKG9wdGlvbnMpe1xuXG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlUmVzcG9uc2Uoe3JlcXVlc3Q6b3B0aW9ucy5yZXF1ZXN0LHJlc3BvbnNlOm9wdGlvbnMucmVzcG9uc2V9KTtcbiAgICAgICBcbiAgICB9LFxuXG4gICAgcGFyc2VSZXNwb25zZSA6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICAgICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG5cbiAgICAgICAgdmFyIEZpbmFsTWVzc2FnZT0nJztcblxuICAgICAgICBpZihyZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpID09PSAnaXNzdWVfY29tbWVudCcgKXtcblxuICAgICAgICAgICAgbG9nKCdhY3Rpb246ICcrcmVxLmJvZHkuYWN0aW9uKVxuXG4gICAgICAgICAgICBGaW5hbE1lc3NhZ2UgPSAnQSBDb21tZW50IGhhcyBqdXN0IGJlZW4gJ1xuXG4gICAgICAgICAgICBpZihyZXEuYm9keS5hY3Rpb24gPT09ICdjcmVhdGVkJyl7XG4gICAgICAgICAgICAgICAgRmluYWxNZXNzYWdlICs9ICdhZGRlZCB0byBpc3N1ZSAjJytyZXEuYm9keS5pc3N1ZS5pZCsnIGluIHJlcG9zaXRvcnkgJyArcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lKycgd2l0aCBJRCA6ICcrcmVxLmJvZHkucmVwb3NpdG9yeS5pZCsnIGJ5IHVzZXIgJytyZXEuYm9keS5jb21tZW50LnVzZXIubG9naW4rJ1xcbiBUaGUgY29tbWVudCBjYW4gYmUgZm91bmQgaGVyZSA6ICcrcmVxLmJvZHkuY29tbWVudC5odG1sX3VybCsnLiBcXG4gVGhlIGNvbnRlbnQgb2YgdGhlIGNvbW1lbnQgaXMgOiBcXG4nK3JlcS5ib2R5LmJvZHk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gcmVxLmJvZHkuYWN0aW9uKycgYWN0aW9uIG5vdCBjb2RlZCB5ZXQuLi5jb21pbmcgc29vbidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICBsb2coJ0V2ZW50IHR5cGU6ICcrcmVxLmdldCgnWC1HaXRodWItRXZlbnQnKSlcbiAgICAgICAgICAgIEZpbmFsTWVzc2FnZSA9ICdOb3QgYSBjb21tZW50IG9uIGFuIGlzc3VlJ1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2U7XG4gICAgfVxuXG5cbn07Il19