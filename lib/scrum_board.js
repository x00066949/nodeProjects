/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');

// Setup debug log

var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-scrumbot');

var repo_id;

module.exports = {

  callMe: function /*istanbul ignore next*/callMe(options) {
    var req = options.request;
    var res = options.response;
    var test = options.test;

    var FinalData = {
      "UserId": "Map",
      "Check": test
    };

    return FinalData;
  },

  /*istanbul ignore next*/getScrumData: function getScrumData(options) {
    var req = options.request;
    var res = options.response;
    var UserCommand = options.UserInput;

    var FinalMessage = null;
    //   Message : null,
    //   Options : null
    // };

    var CheckIfValidCommand = this.checkValidInput({
      request: req,
      response: res,
      UCommand: UserCommand
    });

    if (!CheckIfValidCommand) {
      FinalMessage = {
        Type: 'Error',
        Message: 'Invalid Input'
      };

      //return res.json(FinalMessage);
      return FinalMessage.Message;
    }

    var CommandValue = this.getCommand(UserCommand);

    log("command val : " + CommandValue);

    if (CommandValue === '' || CommandValue === null || typeof CommandValue === 'undefined') {
      FinalMessage = {
        Type: 'Error',
        Message: 'Invalid Input'
      };
      return FinalMessage.Message;
    }

    //get repo id
    var CommandArr = CommandValue.split(' ');
    var RepoName = CommandArr[1];
    var RepoId = CommandArr[2];
    repo_id = RepoId;

    log("repo id 1 : " + repo_id);

    var RepositoryId = RepoId;

    if (RepositoryId === null || RepositoryId === '' || typeof RepositoryId === 'undefined') {
      log("trying to get repo id");
      var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]*\s[0-9]*/);

      if (!RepoRegex.test(CommandValue)) {
        FinalMessage = {
          Type: 'Error',
          Message: 'Repository Id Not Specified'
        };
        return FinalMessage.Message;
      }

      /*var CommandArr = CommandValue.split(' ');
      var RepoName = CommandArr[1];
      var RepoId = CommandArr[2];*/

      if (typeof RepoId !== 'undefined' && RepoId !== '' && RepoId !== null) {
        log("repo found id: " + RepoId);
        req.session.RepositoryId = RepoId;

        repo_id = RepoId;

        FinalMessage = {
          Message: 'Success',
          Options: {
            RespositoryId: RepoId
          }
        };
        return FinalMessage.Message;
      }

      return this.getRespositoryId({
        request: req,
        response: res,
        repoName: RepoName,
        GitOwnerName: 'x00066949'

      });
    }

    var ValidUrlObject = this.validateCommands({
      request: req,
      response: res,
      Command: CommandValue
    });

    if (ValidUrlObject.IsValid === false) {
      FinalMessage = {
        Type: 'Error',
        Message: 'Invalid Commands'
      };
      return FinalMessage.Message;
    }

    if (ValidUrlObject.IsGit) {
      var UCommandArr = CommandValue.split(' ');
      var GitRepoName = UCommandArr[1];

      return this.getRespositoryId({
        request: req,
        response: res,
        repoName: GitRepoName,
        GitOwnerName: 'x00066949'
      });
    } else {

      return this.makeRequest({
        response: res,
        UUrl: ValidUrlObject.Url,
        UBody: ValidUrlObject.Body,
        UMethod: ValidUrlObject.Method
      });
    }
  },
  /*istanbul ignore next*/getPipelineId: function getPipelineId(PipelineName) {
    //var PipelineName = options.pipelineName;

    rp({
      uri: 'https://api.zenhub.io/p1/repositories/' + repo_id + '/board',

      headers: {
        'X-Authentication-Token': process.env.ZENHUB_TOKEN
      },

      json: true
    }).then(function (data) {

      log(data);
      for (var i = 0; i < data['pipelines'].length; i++) {
        if (data['pipelines'][i].name === PipelineName) {
          return data['pipelines'][i].id;
        }
      }

      log("did not find id corresponding to pipe name");
      //return data;
    }).catch(function (err) {
      console.log("error = " + err);
    });
  },


  checkValidInput: function /*istanbul ignore next*/checkValidInput(options) {
    var req = options.request;
    var res = options.response;
    var ValidBit = false;
    var UserCommand = options.UCommand;
    console.log("user command : " + UserCommand);

    var ValidCommands = ['@scrumbot', '/repo', '/issue', '/epic', '/blocked'];

    if (UserCommand === null || UserCommand === '' || UserCommand === 'undefined') {
      return ValidBit;
    }

    var ValidCommadRegex = new RegExp(/^(@scrumbot)\s[\/A-Za-z]*/);
    console.log("processing message : " + UserCommand);

    if (!ValidCommadRegex.test(UserCommand)) {
      log("Error not starting with @scrumbot");
      return ValidBit;
    }

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;

    CommandArr.splice(0, 2);
    var FinalCommand = CommandArr.join(' ');

    log("Final Command : " + FinalCommand);

    return ValidBit = true;
  },

  getCommand: function /*istanbul ignore next*/getCommand(UCommand) {
    log("getCommand");
    var ValidBit = '';
    var UserCommand = UCommand;

    if (UserCommand === null || UserCommand === '' || typeof UserCommand === 'undefined') {
      return ValidBit;
    }

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;

    repo_id = CommandArr[1];

    log("firstly initialisiing repo_id as " + repo_id + " from message " + CommandArr[1]);

    CommandArr.splice(0, 2);
    var FinalCommand = CommandArr.join(' ');

    return FinalCommand;
  },

  validateCommands: function /*istanbul ignore next*/validateCommands(options) {

    log("validateCommands");
    var req = options.request;
    var res = options.response;

    var UserCommand = options.Command;
    var CommandArr = UserCommand.split(' ');
    var UrlObject = {
      IsValid: false,
      Url: '',
      Method: 'GET',
      Body: null
    };

    var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]*\s[0-9]*/);
    var IssueRegex = new RegExp(/^[\/issue]*\s[0-9]*\s(-u|bug|pipeline|-p|events|-e)/);
    var EpicRegex = new RegExp(/^[\/epic]*\s[A-Za-z0-9]*/);
    var BlockedRegex = new RegExp(/^\/blocked/);

    if (RepoRegex.test(UserCommand)) return UrlObject = this.getRepoUrl(UserCommand, CommandArr);

    var RepoId = repo_id;
    //var RepoId = req.session.RepositoryId;

    if (BlockedRegex.test(UserCommand)) return UrlObject = this.getBlockUrl(UserCommand, CommandArr, RepoId);

    if (IssueRegex.test(UserCommand)) return UrlObject = this.getIssueUrl(UserCommand, CommandArr, RepoId);

    if (EpicRegex.test(UserCommand)) return UrlObject = this.getEpicUrl(UserCommand, CommandArr, RepoId);

    return UrlObject;
  },
  makeRequest: function /*istanbul ignore next*/makeRequest(options) {
    log("makeRequest");
    var res = options.response;
    var Token = process.env.ZENHUB_TOKEN;
    var MainUrl = 'https://api.zenhub.io/';

    var UserUrl = options.UUrl;
    var UrlBody = options.UBody;
    var UMethod = options.UMethod;

    var UrlOptions = {
      method: UMethod,
      uri: MainUrl + UserUrl,
      qs: {
        access_token: Token // -> uri + '?access_token=xxxxx%20xxxxx'
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response

      , body: {
        UrlBody: UrlBody
      }
    };

    rp(UrlOptions).then(function (successdata) {
      var Data = successdata;
      console.log('Following Data =' + JSON.stringify(Data));
      return JSON.stringify(Data);
    }).catch(function (err) {
      var Error = err;
      // API call failed...
      console.log('User has following error =' + err);
      return err;
    });
  },

  // To Get Repository Id
  getRespositoryId: function /*istanbul ignore next*/getRespositoryId(Options) {
    log("getRepositoryId");
    var res = Options.response;
    var req = Options.request;
    var RepositoryName = Options.repoName;
    var Ownername = Options.GitOwnerName;

    var RepositoryUrl = 'repos/' + Ownername + '/' + RepositoryName;
    var MainUrl = 'https://api.github.com/';

    var UrlOptions = {
      uri: MainUrl + RepositoryUrl,
      qs: {
        //access_token: Token // -> uri + '?access_token=xxxxx%20xxxxx'
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response
    };

    return rp(UrlOptions).then(function (successdata) {
      log("using repoid: " + repo_id);
      var RepoId = successdata.id;
      log("Repo Id " + RepoId);
      repo_id = RepoId;
      console.log('Repository Id =' + RepoId);
    }).catch(function (err) {
      var Error = err;
      // API call failed...
      log("API call failed...");
      console.log('User has %d repos', err);
    });
  },

  // To Get Repo Url
  getRepoUrl: function /*istanbul ignore next*/getRepoUrl(UserCommand, CommandArr) {

    log("getRepoUrl");
    var RepositoryName = CommandArr[1];
    var GitOwnerName = 'x00066949';
    var RepositoryId = 'repos/' + GitOwnerName + '/' + RepositoryName;

    var UrlObject = {
      IsValid: true,
      Url: RepositoryId,
      Method: 'GET',
      Body: null,
      IsGit: true
    };

    return UrlObject;
  },

  //To Get Issue related Url
  getIssueUrl: function /*istanbul ignore next*/getIssueUrl(UserCommand, CommandArr, RepoId) {
    log("getIssueUrl");
    var RespositroyId = RepoId;

    var UrlObject = {
      IsValid: false,
      Url: '',
      Method: 'GET',
      Body: null,
      IsGit: false
    };

    //To Get State of Pipeline
    var PipelineRegex = new RegExp(/^\/issue*\s[0-9]*\spipeline/);

    if (PipelineRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];
      var PipeLineurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        IsValid: true,
        Url: PipeLineurl,
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      return UrlObject;
    }

    // Move Pipeline
    var PipelineMoveRegex = new RegExp(/^\/issue*\s[0-9]*\s-p\s[A-Za-z0-9]*/);

    if (PipelineMoveRegex.test(UserCommand)) {

      //if moving pipeline, 3rd arg is issue num,  4th = -p, 5th = pipeline, 6t position
      var IssueNo = CommandArr[1];
      var PipeLineId = getPipelineId(CommandArr[3]);
      var PosNo = CommandArr[4];

      var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';

      var MoveBody = {
        pipeline_id: PipeLineId,
        position: PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0
      };

      var UrlObject = {
        IsValid: true,
        Url: MoveIssuePipeLine,
        Method: 'POST',
        Body: MoveBody,
        IsGit: false
      };

      return UrlObject;
    }

    // Get events for the Issue
    var EventsRegex = new RegExp(/^\/issue*\s[0-9]*\sevents/);

    if (EventsRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];

      var EventsUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/events';

      var UrlObject = {
        IsValid: true,
        Url: EventsUrl,
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      return UrlObject;
    }

    // Get the estimate for the issue.
    var EstimateAddRegex = new RegExp(/^\/issue*\s[0-9]*\s-e\s[0-9]*/);

    if (EstimateAddRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];
      var PipeLineId = CommandArr[3];
      var PosNo = CommandArr[4];

      var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';

      var MoveBody = {
        pipeline_id: PipeLineId,
        position: PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0
      };

      var UrlObject = {
        IsValid: true,
        Url: MoveIssuePipeLine,
        Method: 'POST',
        Body: MoveBody,
        IsGit: false
      };

      return UrlObject;
    }

    // Get Bugs by the user
    var BugRegex = new RegExp(/^\/issue*\s[0-9]*\sbug/);

    if (BugRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];

      var BugUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        IsValid: true,
        Url: BugUrl,
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      return UrlObject;
    }

    //To Get User Issue by user
    var UserRegex = new RegExp(/^\/issue*\s[0-9]*\s-u\s[A-Za-z0-9]*/);

    if (UserRegex.test(UserCommand)) {

      var UserUrl = '';

      var UrlObject = {
        IsValid: true,
        Url: UserUrl,
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      return UrlObject;
    }

    return UrlObject;
  },

  //To Get Blocked Issues Url
  getBlockUrl: function /*istanbul ignore next*/getBlockUrl(UserCommand, CommandArr, RepoId) {
    log("getBlockUrl");

    var RespositroyId = RepoId;

    var IssueNo = CommandArr[1];
    var Blockurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

    var UrlObject = {
      Url: Blockurl,
      Method: 'GET',
      Body: null,
      IsGit: false
    };

    return UrlObject;
  },

  //To Get Blocked Issues Url
  getEpicUrl: function /*istanbul ignore next*/getEpicUrl(UserCommand, CommandArr, RepoId) {
    log("getEpicUrl");

    var RespositroyId = RepoId;
    var EpicUrl = 'p1/repositories/' + RespositroyId + '/epics';

    var UrlObject = {
      Url: EpicUrl,
      Method: 'GET',
      Body: null,
      IsGit: false
    };

    return UrlObject;
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsInNlc3Npb24iLCJPcHRpb25zIiwiUmVzcG9zaXRvcnlJZCIsImdldFJlc3Bvc2l0b3J5SWQiLCJyZXBvTmFtZSIsIkdpdE93bmVyTmFtZSIsIlZhbGlkVXJsT2JqZWN0IiwidmFsaWRhdGVDb21tYW5kcyIsIkNvbW1hbmQiLCJJc1ZhbGlkIiwiSXNHaXQiLCJVQ29tbWFuZEFyciIsIkdpdFJlcG9OYW1lIiwibWFrZVJlcXVlc3QiLCJVVXJsIiwiVXJsIiwiVUJvZHkiLCJCb2R5IiwiVU1ldGhvZCIsIk1ldGhvZCIsImdldFBpcGVsaW5lSWQiLCJQaXBlbGluZU5hbWUiLCJ1cmkiLCJoZWFkZXJzIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsImpzb24iLCJ0aGVuIiwiZGF0YSIsImkiLCJsZW5ndGgiLCJuYW1lIiwiaWQiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJWYWxpZEJpdCIsIlZhbGlkQ29tbWFuZHMiLCJWYWxpZENvbW1hZFJlZ2V4IiwiT3JpZ2luYWxzQ29tbWFuZEFyciIsInNwbGljZSIsIkZpbmFsQ29tbWFuZCIsImpvaW4iLCJVcmxPYmplY3QiLCJJc3N1ZVJlZ2V4IiwiRXBpY1JlZ2V4IiwiQmxvY2tlZFJlZ2V4IiwiZ2V0UmVwb1VybCIsImdldEJsb2NrVXJsIiwiZ2V0SXNzdWVVcmwiLCJnZXRFcGljVXJsIiwiVG9rZW4iLCJNYWluVXJsIiwiVXNlclVybCIsIlVybEJvZHkiLCJVcmxPcHRpb25zIiwibWV0aG9kIiwicXMiLCJhY2Nlc3NfdG9rZW4iLCJib2R5Iiwic3VjY2Vzc2RhdGEiLCJEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiUmVzcG9zaXRyb3lJZCIsIlBpcGVsaW5lUmVnZXgiLCJJc3N1ZU5vIiwiUGlwZUxpbmV1cmwiLCJQaXBlbGluZU1vdmVSZWdleCIsIlBpcGVMaW5lSWQiLCJQb3NObyIsIk1vdmVJc3N1ZVBpcGVMaW5lIiwiTW92ZUJvZHkiLCJwaXBlbGluZV9pZCIsInBvc2l0aW9uIiwiRXZlbnRzUmVnZXgiLCJFdmVudHNVcmwiLCJFc3RpbWF0ZUFkZFJlZ2V4IiwiQnVnUmVnZXgiLCJCdWdVcmwiLCJVc2VyUmVnZXgiLCJCbG9ja3VybCIsIkVwaWNVcmwiXSwibWFwcGluZ3MiOiI7O0FBS0E7Ozs7OztBQUxBLElBQUlBLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FBS0QsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUUsUUFBUUYsUUFBUSxPQUFSLENBQVo7O0FBRUE7O0FBRUEsSUFBTUcsTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLE9BQUo7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUI7O0FBR2ZDLFVBQVEsd0NBQVVDLE9BQVYsRUFBbUI7QUFDekIsUUFBSUMsTUFBTUQsUUFBUUUsT0FBbEI7QUFDQSxRQUFJQyxNQUFNSCxRQUFRSSxRQUFsQjtBQUNBLFFBQUlDLE9BQU9MLFFBQVFLLElBQW5COztBQUVBLFFBQUlDLFlBQVk7QUFDZCxnQkFBVSxLQURJO0FBRWQsZUFB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LE9BRFM7QUFFZHBFLGNBQVEsS0FGTTtBQUdkRixZQUFNLElBSFE7QUFJZFAsYUFBTztBQUpPLEtBQWhCOztBQU9BLFdBQU9rQyxTQUFQO0FBQ0Q7O0FBOWpCYyxDQUFqQiIsImZpbGUiOiJzY3J1bV9ib2FyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciBSZWdleCA9IHJlcXVpcmUoJ3JlZ2V4Jyk7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICAgdmFyIEZpbmFsTWVzc2FnZT1udWxsO1xuICAgIC8vICAgTWVzc2FnZSA6IG51bGwsXG4gICAgLy8gICBPcHRpb25zIDogbnVsbFxuICAgIC8vIH07XG5cbiAgICB2YXIgQ2hlY2tJZlZhbGlkQ29tbWFuZCA9IHRoaXMuY2hlY2tWYWxpZElucHV0KHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBVQ29tbWFuZDogVXNlckNvbW1hbmRcbiAgICB9KTtcblxuICAgIGlmICghQ2hlY2tJZlZhbGlkQ29tbWFuZCkge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcblxuICAgICAgLy9yZXR1cm4gcmVzLmpzb24oRmluYWxNZXNzYWdlKTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZFZhbHVlID0gdGhpcy5nZXRDb21tYW5kKFVzZXJDb21tYW5kKTtcblxuICAgIGxvZyhcImNvbW1hbmQgdmFsIDogXCIrQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gQ29tbWFuZEFyclsyXTtcbiAgICByZXBvX2lkID0gUmVwb0lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIrcmVwb19pZCk7XG5cbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gUmVwb0lkO1xuXG4gICAgaWYgKFJlcG9zaXRvcnlJZCA9PT0gbnVsbCB8fCBSZXBvc2l0b3J5SWQgPT09ICcnIHx8IHR5cGVvZiBSZXBvc2l0b3J5SWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsb2coXCJ0cnlpbmcgdG8gZ2V0IHJlcG8gaWRcIik7XG4gICAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qXFxzWzAtOV0qLyk7XG5cbiAgICAgIGlmICghUmVwb1JlZ2V4LnRlc3QoQ29tbWFuZFZhbHVlKSkge1xuICAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgTWVzc2FnZTogJ1JlcG9zaXRvcnkgSWQgTm90IFNwZWNpZmllZCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICAvKnZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgICAgdmFyIFJlcG9JZCA9IENvbW1hbmRBcnJbMl07Ki9cblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiK1JlcG9JZCk7XG4gICAgICAgIHJlcS5zZXNzaW9uLlJlcG9zaXRvcnlJZCA9IFJlcG9JZDtcblxuICAgICAgICByZXBvX2lkID0gUmVwb0lkO1xuICAgICAgICBcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBNZXNzYWdlOiAnU3VjY2VzcycsXG4gICAgICAgICAgT3B0aW9uczoge1xuICAgICAgICAgICAgUmVzcG9zaXRvcnlJZDogUmVwb0lkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOid4MDAwNjY5NDknXG4gICAgICAgIFxuICAgICAgfSk7XG5cbiAgICB9XG5cblxuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgQ29tbWFuZHMnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzR2l0KSB7XG4gICAgICB2YXIgVUNvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBHaXRSZXBvTmFtZSA9IFVDb21tYW5kQXJyWzFdO1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogR2l0UmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdCh7XG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIFVVcmw6IFZhbGlkVXJsT2JqZWN0LlVybCxcbiAgICAgICAgVUJvZHk6IFZhbGlkVXJsT2JqZWN0LkJvZHksXG4gICAgICAgIFVNZXRob2Q6IFZhbGlkVXJsT2JqZWN0Lk1ldGhvZFxuICAgICAgfSk7XG4gICAgfVxuXG5cbiAgfSxcblxuICBnZXRQaXBlbGluZUlkKFBpcGVsaW5lTmFtZSl7XG4gICAgLy92YXIgUGlwZWxpbmVOYW1lID0gb3B0aW9ucy5waXBlbGluZU5hbWU7XG5cbiAgICBycCh7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBmb3IgKHZhciBpID0wOyBpPGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKXtcbiAgICAgICAgICAgIHJldHVybiBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgICAgIC8vcmV0dXJuIGRhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiK2VycilcbiAgICAgICAgXG4gICAgICBcbiAgICAgIH0pIFxuXG4gIH0sXG5cblxuICBjaGVja1ZhbGlkSW5wdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVmFsaWRCaXQgPSBmYWxzZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVDb21tYW5kO1xuICAgIGNvbnNvbGUubG9nKFwidXNlciBjb21tYW5kIDogXCIrVXNlckNvbW1hbmQpO1xuICAgIFxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIitVc2VyQ29tbWFuZCk7XG5cblxuICAgIGlmICghVmFsaWRDb21tYWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSl7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICAgIFxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMik7XG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgbG9nKFwiRmluYWwgQ29tbWFuZCA6IFwiK0ZpbmFsQ29tbWFuZCk7XG5cbiAgICByZXR1cm4gVmFsaWRCaXQgPSB0cnVlO1xuICB9LFxuXG4gIGdldENvbW1hbmQ6IGZ1bmN0aW9uIChVQ29tbWFuZCkge1xuICAgIGxvZyhcImdldENvbW1hbmRcIik7XG4gICAgdmFyIFZhbGlkQml0ID0gJyc7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gVUNvbW1hbmQ7XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IHR5cGVvZiBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMV07XG4gICAgXG4gICAgbG9nIChcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiK3JlcG9faWQgK1wiIGZyb20gbWVzc2FnZSBcIitDb21tYW5kQXJyWzFdKTtcblxuICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMik7XG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgcmV0dXJuIEZpbmFsQ29tbWFuZDtcbiAgfSxcblxuICB2YWxpZGF0ZUNvbW1hbmRzOiBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gICAgbG9nKFwidmFsaWRhdGVDb21tYW5kc1wiKTtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuXG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Db21tYW5kO1xuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGxcbiAgICB9O1xuXG4gICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKlxcc1swLTldKi8pO1xuICAgIHZhciBJc3N1ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9pc3N1ZV0qXFxzWzAtOV0qXFxzKC11fGJ1Z3xwaXBlbGluZXwtcHxldmVudHN8LWUpLyk7XG4gICAgdmFyIEVwaWNSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvZXBpY10qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIEJsb2NrZWRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9ibG9ja2VkLyk7XG5cblxuICAgIGlmIChSZXBvUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKTtcblxuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuICAgIC8vdmFyIFJlcG9JZCA9IHJlcS5zZXNzaW9uLlJlcG9zaXRvcnlJZDtcblxuICAgIGlmIChCbG9ja2VkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRCbG9ja1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChJc3N1ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGxvZyhcIm1ha2VSZXF1ZXN0XCIpO1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBUb2tlbiA9IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTjtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS56ZW5odWIuaW8vJztcblxuICAgIHZhciBVc2VyVXJsID0gb3B0aW9ucy5VVXJsO1xuICAgIHZhciBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keTtcbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgbWV0aG9kOiBVTWV0aG9kLFxuICAgICAgdXJpOiBNYWluVXJsICsgVXNlclVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgLFxuICAgICAgYm9keToge1xuICAgICAgICBVcmxCb2R5XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIERhdGEgPSBzdWNjZXNzZGF0YTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvbGxvd2luZyBEYXRhID0nICsgSlNPTi5zdHJpbmdpZnkoRGF0YSkpO1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRGF0YSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzIGZvbGxvd2luZyBlcnJvciA9JyArIGVycik7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9KTtcblxuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIC8vYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICBsb2coXCJ1c2luZyByZXBvaWQ6IFwiK3JlcG9faWQpO1xuICAgICAgICB2YXIgUmVwb0lkID0gc3VjY2Vzc2RhdGEuaWQ7XG4gICAgICAgIGxvZyhcIlJlcG8gSWQgXCIrUmVwb0lkKTtcbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlcG9zaXRvcnkgSWQgPScgKyBSZXBvSWQpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGxvZyhcIkFQSSBjYWxsIGZhaWxlZC4uLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICAgIFVybDogJycsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgfTtcblxuXG5cblxuICAgICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgICAgICB2YXIgUGlwZUxpbmV1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogUGlwZUxpbmV1cmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy8gTW92ZSBQaXBlbGluZVxuICAgICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIC8vaWYgbW92aW5nIHBpcGVsaW5lLCAzcmQgYXJnIGlzIGlzc3VlIG51bSwgIDR0aCA9IC1wLCA1dGggPSBwaXBlbGluZSwgNnQgcG9zaXRpb25cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgICAgICB2YXIgUGlwZUxpbmVJZCA9IGdldFBpcGVsaW5lSWQoQ29tbWFuZEFyclszXSk7XG4gICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNF07XG5cbiAgICAgICAgdmFyIE1vdmVJc3N1ZVBpcGVMaW5lID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3Zlcyc7XG5cbiAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIHBpcGVsaW5lX2lkOiBQaXBlTGluZUlkLFxuICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvLyBHZXQgZXZlbnRzIGZvciB0aGUgSXNzdWVcbiAgICAgIHZhciBFdmVudHNSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNldmVudHMvKTtcblxuICAgICAgaWYgKEV2ZW50c1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuXG4gICAgICAgIHZhciBFdmVudHNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2V2ZW50cyc7XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogRXZlbnRzVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cblxuICAgICAgLy8gR2V0IHRoZSBlc3RpbWF0ZSBmb3IgdGhlIGlzc3VlLlxuICAgICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgICAgIHZhciBQaXBlTGluZUlkID0gQ29tbWFuZEFyclszXTtcbiAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls0XTtcblxuICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcblxuICAgICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgICAgcGlwZWxpbmVfaWQ6IFBpcGVMaW5lSWQsXG4gICAgICAgICAgcG9zaXRpb246IChQb3NObyAhPT0gbnVsbCAmJiBQb3NObyAhPT0gJycgJiYgdHlwZW9mIFBvc05vICE9PSAndW5kZWZpbmVkJyA/IFBvc05vIDogMClcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBNb3ZlSXNzdWVQaXBlTGluZSxcbiAgICAgICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cblxuICAgICAgLy8gR2V0IEJ1Z3MgYnkgdGhlIHVzZXJcbiAgICAgIHZhciBCdWdSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNidWcvKTtcblxuICAgICAgaWYgKEJ1Z1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuXG4gICAgICAgIHZhciBCdWdVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogQnVnVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vVG8gR2V0IFVzZXIgSXNzdWUgYnkgdXNlclxuICAgICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIFVzZXJVcmwgPSAnJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBVc2VyVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgICB9XG5cbiAgICAsXG4gIC8vVG8gR2V0IEJsb2NrZWQgSXNzdWVzIFVybFxuICBnZXRCbG9ja1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRCbG9ja1VybFwiKTtcblxuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBCbG9ja3VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEJsb2NrdXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0RXBpY1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRFcGljVXJsXCIpO1xuXG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIEVwaWNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9lcGljcyc7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgVXJsOiBFcGljVXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfVxuXG59O1xuIl19