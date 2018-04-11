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

  parseResponse: function /*istanbul ignore next*/parseResponse(req, res) {
    log('parseresponse');
    //var req = options.request;
    //var res = options.response;

    var UrlOptions = {
      uri: 'https://api.github.com/',
      qs: {},
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response
    };

    return rp(UrlOptions).then(function () {

      var FinalMessage = '';

      //COMMENTS
      if (req.get('X-Github-Event') === 'issue_comment') {

        log('action: ' + req.body.action);

        FinalMessage = 'A Comment has just been ';

        if (req.body.action === 'created') {
          FinalMessage += 'added to issue #' + req.body.issue.number + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.comment.body;
        } else if (req.body.action === 'edited') {
          FinalMessage += 'edited under issue #' + req.body.issue.number + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.comment.body;
        } else if (req.body.action === 'deleted') {
          FinalMessage = req.body.comment.body + '\nThe above comment was deleted under issue #' + req.body.issue.number + ' by user ' + req.body.comment.user.login + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id;
        } else {
          FinalMessage += req.body.action + ' action not coded yet...coming soon';
        }
      }
      //ISSUES
      else if (req.get('X-Github-Event') === 'issues') {
          log('action: ' + req.body.action);

          FinalMessage = 'An issue has just been ';

          if (req.body.action === 'opened') {
            FinalMessage += 'opened in repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\nIssue Details:\nIssue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n Issue opened by : ' + req.body.issue.user.login + '\n The Issue can be found here : ' + req.body.issue.html_url + '.';
          } else if (req.body.action === 'closed') {
            FinalMessage += 'closed. ' + '\nIssue Details:\nIssue Number : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n Issue closed by : ' + req.body.issue.user.login + '\nIn repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '.';
          } else if (req.body.action === 'reopened') {
            FinalMessage += 'reopened in repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\n Issue Re-opened by : ' + req.body.issue.user.login + '\nIssue Details:\nIssue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n The Issue can be found here : ' + req.body.issue.html_url + '.';
          } else {
            FinalMessage += req.body.action + ' action not coded yet...coming soon';
          }
        } else {
          log('Event type: ' + req.get('X-Github-Event'));
          FinalMessage = 'Not a comment on an issue';
        }

      log(FinalMessage);
      return FinalMessage;
    });
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pc3N1ZV9ldmVudHMuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsImxvZyIsIm1vZHVsZSIsImV4cG9ydHMiLCJwYXJzZVJlc3BvbnNlIiwicmVxIiwicmVzIiwiVXJsT3B0aW9ucyIsInVyaSIsInFzIiwiaGVhZGVycyIsImpzb24iLCJ0aGVuIiwiRmluYWxNZXNzYWdlIiwiZ2V0IiwiYm9keSIsImFjdGlvbiIsImlzc3VlIiwibnVtYmVyIiwicmVwb3NpdG9yeSIsIm5hbWUiLCJpZCIsImNvbW1lbnQiLCJ1c2VyIiwibG9naW4iLCJodG1sX3VybCIsInRpdGxlIl0sIm1hcHBpbmdzIjoiOztBQU1BOzs7Ozs7QUFOQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLEtBQUtELFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlFLFFBQVFGLFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBSUcsYUFBYUgsUUFBUSxZQUFSLENBQWpCOztBQUVBOztBQUVBLElBQU1JLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjs7QUFFQUMsT0FBT0MsT0FBUCxHQUFpQjs7QUFFYkMsaUJBQWlCLCtDQUFVQyxHQUFWLEVBQWVDLEdBQWYsRUFBb0I7QUFDakNMLFFBQUksZUFBSjtBQUNBO0FBQ0E7O0FBRUEsUUFBSU0sYUFBYTtBQUNmQyxXQUFLLHlCQURVO0FBRWZDLFVBQUksRUFGVztBQUlmQyxlQUFTO0FBQ1Asc0JBQWM7QUFEUCxPQUpNO0FBT2ZDLFlBQU0sSUFQUyxDQU9KO0FBUEksS0FBakI7O0FBVUEsV0FBT2IsR0FBR1MsVUFBSCxFQUFlSyxJQUFmLENBQW9CLFlBQVk7O0FBRXJDLFVBQUlDLGVBQWUsRUFBbkI7O0FBRUE7QUFDQSxVQUFJUixJQUFJUyxHQUFKLENBQVEsZ0JBQVIsTUFBOEIsZUFBbEMsRUFBbUQ7O0FBRWpEYixZQUFJLGFBQWFJLElBQUlVLElBQUosQ0FBU0MsTUFBMUI7O0FBRUFI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O0FBQ0Q7O0FBRURaLFVBQUlZLFlBQUo7QUFDQSxhQUFPQSxZQUFQO0FBQ0QsS0FsRE0sQ0FBUDtBQW9ERDs7QUFyRVUsQ0FBakIiLCJmaWxlIjoiaXNzdWVfZXZlbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBcbiAgICBwYXJzZVJlc3BvbnNlIDogKGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgICAgICBsb2coJ3BhcnNlcmVzcG9uc2UnKVxuICAgICAgICAvL3ZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgICAgIC8vdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgICBcbiAgICAgICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nLFxuICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgfTtcbiAgICAgIFxuICAgICAgICByZXR1cm4gcnAoVXJsT3B0aW9ucykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICBcbiAgICAgICAgICB2YXIgRmluYWxNZXNzYWdlID0gJyc7XG4gICAgICBcbiAgICAgICAgICAvL0NPTU1FTlRTXG4gICAgICAgICAgaWYgKHJlcS5nZXQoJ1gtR2l0aHViLUV2ZW50JykgPT09ICdpc3N1ZV9jb21tZW50Jykge1xuICAgICAgXG4gICAgICAgICAgICBsb2coJ2FjdGlvbjogJyArIHJlcS5ib2R5LmFjdGlvbilcbiAgICAgIFxuICAgICAgICAgICAgRmluYWxNZXNzYWdlID0gJ0EgQ29tbWVudCBoYXMganVzdCBiZWVuICdcbiAgICAgIFxuICAgICAgICAgICAgaWYgKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ2NyZWF0ZWQnKSB7XG4gICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSAnYWRkZWQgdG8gaXNzdWUgIycgKyByZXEuYm9keS5pc3N1ZS5udW1iZXIgKyAnIGluIHJlcG9zaXRvcnkgJyArIHJlcS5ib2R5LnJlcG9zaXRvcnkubmFtZSArICcgd2l0aCBJRCA6ICcgKyByZXEuYm9keS5yZXBvc2l0b3J5LmlkICsgJyBieSB1c2VyICcgKyByZXEuYm9keS5jb21tZW50LnVzZXIubG9naW4gKyAnXFxuIFRoZSBjb21tZW50IGNhbiBiZSBmb3VuZCBoZXJlIDogJyArIHJlcS5ib2R5LmNvbW1lbnQuaHRtbF91cmwgKyAnLiBcXG4gVGhlIGNvbnRlbnQgb2YgdGhlIGNvbW1lbnQgaXMgOiBcXG4nICsgcmVxLmJvZHkuY29tbWVudC5ib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocmVxLmJvZHkuYWN0aW9uID09PSAnZWRpdGVkJykge1xuICAgICAgICAgICAgICBGaW5hbE1lc3NhZ2UgKz0gJ2VkaXRlZCB1bmRlciBpc3N1ZSAjJyArIHJlcS5ib2R5Lmlzc3VlLm51bWJlciArICcgaW4gcmVwb3NpdG9yeSAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lICsgJyB3aXRoIElEIDogJyArIHJlcS5ib2R5LnJlcG9zaXRvcnkuaWQgKyAnIGJ5IHVzZXIgJyArIHJlcS5ib2R5LmNvbW1lbnQudXNlci5sb2dpbiArICdcXG4gVGhlIGNvbW1lbnQgY2FuIGJlIGZvdW5kIGhlcmUgOiAnICsgcmVxLmJvZHkuY29tbWVudC5odG1sX3VybCArICcuIFxcbiBUaGUgY29udGVudCBvZiB0aGUgY29tbWVudCBpcyA6IFxcbicgKyByZXEuYm9keS5jb21tZW50LmJvZHk7XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgZWxzZSBpZiAocmVxLmJvZHkuYWN0aW9uID09PSAnZGVsZXRlZCcpIHtcbiAgICAgICAgICAgICAgRmluYWxNZXNzYWdlID0gcmVxLmJvZHkuY29tbWVudC5ib2R5KydcXG5UaGUgYWJvdmUgY29tbWVudCB3YXMgZGVsZXRlZCB1bmRlciBpc3N1ZSAjJyArIHJlcS5ib2R5Lmlzc3VlLm51bWJlciArICcgYnkgdXNlciAnICsgcmVxLmJvZHkuY29tbWVudC51c2VyLmxvZ2luICsgJyBpbiByZXBvc2l0b3J5ICcgKyByZXEuYm9keS5yZXBvc2l0b3J5Lm5hbWUgKyAnIHdpdGggSUQgOiAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5pZDtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgRmluYWxNZXNzYWdlICs9IHJlcS5ib2R5LmFjdGlvbiArICcgYWN0aW9uIG5vdCBjb2RlZCB5ZXQuLi5jb21pbmcgc29vbidcbiAgICAgICAgICAgIH1cbiAgICAgIFxuICAgICAgICAgIH0gXG4gICAgICAgICAgLy9JU1NVRVNcbiAgICAgICAgICBlbHNlIGlmIChyZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpID09PSAnaXNzdWVzJykge1xuICAgICAgICAgICAgbG9nKCdhY3Rpb246ICcgKyByZXEuYm9keS5hY3Rpb24pXG4gICAgICBcbiAgICAgICAgICAgIEZpbmFsTWVzc2FnZSA9ICdBbiBpc3N1ZSBoYXMganVzdCBiZWVuICdcbiAgICAgIFxuICAgICAgICAgICAgaWYgKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ29wZW5lZCcpIHtcbiAgICAgICAgICAgICAgRmluYWxNZXNzYWdlICs9ICdvcGVuZWQgaW4gcmVwb3NpdG9yeSAnICsgcmVxLmJvZHkucmVwb3NpdG9yeS5uYW1lICsgJyB3aXRoIHJlcG8gaWQ6ICcgKyByZXEuYm9keS5yZXBvc2l0b3J5LmlkICsgJ1xcbklzc3VlIERldGFpbHM6XFxuSXNzdWUgSUQgOiAjJyArIHJlcS5ib2R5Lmlzc3VlLm51bWJlciArICdcXG5Jc3N1ZSBUaXRsZTogJyArIHJlcS5ib2R5Lmlzc3VlLnRpdGxlICsgJ1xcbiBJc3N1ZSBvcGVuZWQgYnkgOiAnICsgcmVxLmJvZHkuaXNzdWUudXNlci5sb2dpbiArICdcXG4gVGhlIElzc3VlIGNhbiBiZSBmb3VuZCBoZXJlIDogJyArIHJlcS5ib2R5Lmlzc3VlLmh0bWxfdXJsICsgJy4nO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXEuYm9keS5hY3Rpb24gPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSAnY2xvc2VkLiAnKydcXG5Jc3N1ZSBEZXRhaWxzOlxcbklzc3VlIE51bWJlciA6ICMnICsgcmVxLmJvZHkuaXNzdWUubnVtYmVyICsgJ1xcbklzc3VlIFRpdGxlOiAnICsgcmVxLmJvZHkuaXNzdWUudGl0bGUgKydcXG4gSXNzdWUgY2xvc2VkIGJ5IDogJytyZXEuYm9keS5pc3N1ZS51c2VyLmxvZ2luKydcXG5JbiByZXBvc2l0b3J5ICcgKyByZXEuYm9keS5yZXBvc2l0b3J5Lm5hbWUgKyAnIHdpdGggcmVwbyBpZDogJyArIHJlcS5ib2R5LnJlcG9zaXRvcnkuaWQgKycuJztcbiAgICAgICAgICAgIH1lbHNlIGlmKHJlcS5ib2R5LmFjdGlvbiA9PT0gJ3Jlb3BlbmVkJyl7XG4gICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSAncmVvcGVuZWQgaW4gcmVwb3NpdG9yeSAnK3JlcS5ib2R5LnJlcG9zaXRvcnkubmFtZSsnIHdpdGggcmVwbyBpZDogJyArcmVxLmJvZHkucmVwb3NpdG9yeS5pZCsnXFxuIElzc3VlIFJlLW9wZW5lZCBieSA6ICcrcmVxLmJvZHkuaXNzdWUudXNlci5sb2dpbisnXFxuSXNzdWUgRGV0YWlsczpcXG5Jc3N1ZSBJRCA6ICMnK3JlcS5ib2R5Lmlzc3VlLm51bWJlcisnXFxuSXNzdWUgVGl0bGU6ICcrcmVxLmJvZHkuaXNzdWUudGl0bGUrJ1xcbiBUaGUgSXNzdWUgY2FuIGJlIGZvdW5kIGhlcmUgOiAnK3JlcS5ib2R5Lmlzc3VlLmh0bWxfdXJsKycuJztcbiAgICAgICAgICB9IFxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIEZpbmFsTWVzc2FnZSArPSByZXEuYm9keS5hY3Rpb24gKyAnIGFjdGlvbiBub3QgY29kZWQgeWV0Li4uY29taW5nIHNvb24nXG4gICAgICAgICAgICB9XG4gICAgICBcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsb2coJ0V2ZW50IHR5cGU6ICcgKyByZXEuZ2V0KCdYLUdpdGh1Yi1FdmVudCcpKVxuICAgICAgICAgICAgRmluYWxNZXNzYWdlID0gJ05vdCBhIGNvbW1lbnQgb24gYW4gaXNzdWUnXG4gICAgICAgICAgfVxuICAgICAgXG4gICAgICAgICAgbG9nKEZpbmFsTWVzc2FnZSlcbiAgICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlO1xuICAgICAgICB9KTtcbiAgICAgIFxuICAgICAgfSlcbiAgICAgIFxuXG59OyJdfQ==