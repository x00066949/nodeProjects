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
    CommandArr.splice(0, 1);
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
    CommandArr.splice(0, 1);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsInNlc3Npb24iLCJPcHRpb25zIiwiUmVzcG9zaXRvcnlJZCIsImdldFJlc3Bvc2l0b3J5SWQiLCJyZXBvTmFtZSIsIkdpdE93bmVyTmFtZSIsIlZhbGlkVXJsT2JqZWN0IiwidmFsaWRhdGVDb21tYW5kcyIsIkNvbW1hbmQiLCJJc1ZhbGlkIiwiSXNHaXQiLCJVQ29tbWFuZEFyciIsIkdpdFJlcG9OYW1lIiwibWFrZVJlcXVlc3QiLCJVVXJsIiwiVXJsIiwiVUJvZHkiLCJCb2R5IiwiVU1ldGhvZCIsIk1ldGhvZCIsIlZhbGlkQml0IiwiY29uc29sZSIsIlZhbGlkQ29tbWFuZHMiLCJWYWxpZENvbW1hZFJlZ2V4IiwiT3JpZ2luYWxzQ29tbWFuZEFyciIsInNwbGljZSIsIkZpbmFsQ29tbWFuZCIsImpvaW4iLCJVcmxPYmplY3QiLCJJc3N1ZVJlZ2V4IiwiRXBpY1JlZ2V4IiwiQmxvY2tlZFJlZ2V4IiwiZ2V0UmVwb1VybCIsImdldEJsb2NrVXJsIiwiZ2V0SXNzdWVVcmwiLCJnZXRFcGljVXJsIiwiVG9rZW4iLCJwcm9jZXNzIiwiZW52IiwiWkVOSFVCX1RPS0VOIiwiTWFpblVybCIsIlVzZXJVcmwiLCJVcmxCb2R5IiwiVXJsT3B0aW9ucyIsIm1ldGhvZCIsInVyaSIsInFzIiwiYWNjZXNzX3Rva2VuIiwiaGVhZGVycyIsImpzb24iLCJib2R5IiwidGhlbiIsInN1Y2Nlc3NkYXRhIiwiRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJjYXRjaCIsImVyciIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaWQiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUGlwZUxpbmVJZCIsIlBvc05vIiwiTW92ZUlzc3VlUGlwZUxpbmUiLCJNb3ZlQm9keSIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJFdmVudHNSZWdleCIsIkV2ZW50c1VybCIsIkVzdGltYXRlQWRkUmVnZXgiLCJCdWdSZWdleCIsIkJ1Z1VybCIsIlVzZXJSZWdleCIsIkJsb2NrdXJsIiwiRXBpY1VybCJdLCJtYXBwaW5ncyI6Ijs7QUFLQTs7Ozs7O0FBTEEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjs7QUFFQTs7QUFFQSxJQUFNRyxNQUFNLDZDQUFNLHFCQUFOLENBQVo7O0FBRUEsSUFBSUMsT0FBSjs7QUFFQUMsT0FBT0MsT0FBUCxHQUFpQjs7QUFHZkMsVUFBUSx3Q0FBVUMsT0FBVixFQUFtQjtBQUN6QixRQUFJQyxNQUFNRCxRQUFRRSxPQUFsQjtBQUNBLFFBQUlDLE1BQU1ILFFBQVFJLFFBQWxCO0FBQ0EsUUFBSUMsT0FBT0wsUUFBUUssSUFBbkI7O0FBRUEsUUFBSUMsWUFBWTtBQUNkLGdCQUFVLEtBREk7QUFFZCxlQUFTRDtBQUZLLEtBQWhCOztBQUtBLFdBQU9DLFNBQVA7QUFDRCxHQWRjOztBQUFBLDBCQWdCZkMsWUFoQmUsd0JBZ0JGUCxPQWhCRSxFQWdCTztBQUNwQixRQUFJQyxNQUFNRCxRQUFRRSxPQUFsQjtBQUNBLFFBQUlDLE1BQU1ILFFBQVFJLFFBQWxCO0FBQ0EsUUFBSUksY0FBY1IsUUFBUVMsU0FBMUI7O0FBRUMsUUFBSUMsZUFBYSxJQUFqQjtBQUNEO0FBQ0E7QUFDQTs7QUFFQSxRQUFJQyxzQkFBc0IsS0FBS0MsZUFBTCxDQUFxQjtBQUM3Q1YsZUFBU0QsR0FEb0M7QUFFN0NHLGdCQUFVRCxHQUZtQztBQUc3Q1UsZ0JBQVVMO0FBSG1DLEtBQXJCLENBQTFCOztBQU1BLFFBQUksQ0FBQ0csbUJBQUwsRUFBMEI7QUFDdEJELHFCQUFlO0FBQ2ZJLGNBQU0sT0FEUztBQUVmQyxpQkFBUztBQUZNLE9BQWY7O0FBS0Y7QUFDQSxhQUFPTCxhQUFhSyxPQUFwQjtBQUNEOztBQUVELFFBQUlDLGVBQWUsS0FBS0MsVUFBTCxDQUFnQlQsV0FBaEIsQ0FBbkI7O0FBRUFiLFFBQUksbUJBQWlCcUIsWUFBckI7O0FBRUEsUUFBSUEsaUJBQWlCLEVBQWpCLElBQXVCQSxpQkFBaUIsSUFBeEMsSUFBZ0QsT0FBT0EsWUFBUCxLQUF3QixXQUE1RSxFQUF5RjtBQUN0Rk4scUJBQWU7QUFDZEksY0FBTSxPQURRO0FBRWRDLGlCQUFTO0FBRkssT0FBZjtBQUlELGFBQU9MLGFBQWFLLE9BQXBCO0FBQ0Q7O0FBR0Q7QUFDQSxRQUFJRyxhQUFhRixhQUFhRyxLQUFiLENBQW1CLEdBQW5CLENBQWpCO0FBQ0EsUUFBSUMsV0FBV0YsV0FBVyxDQUFYLENBQWY7QUFDQSxRQUFJRyxTQUFTSCxXQUFXLENBQVgsQ0FBYjtBQUNBdEIsY0FBVXlCLE1BQVY7QUFDQSxRQUFJQyxlQUFlRCxNQUFuQjs7QUFFQSxRQUFJQyxpQkFBaUIsSUFBakIsSUFBeUJBLGlCQUFpQixFQUExQyxJQUFnRCxPQUFPQSxZQUFQLEtBQXdCLFdBQTVFLEVBQXlGO0FBQ3ZGM0IsVUFBSSx1QkFBSjtBQUNBLFVBQUk0QixZQUFZLElBQUlDLE1BQUosQ0FBVyxnQ0FBWCxDQUFoQjs7QUFFQSxVQUFJLENBQUNELFVBQVVsQixJQUFWLENBQWVXLFlBQWYsQ0FBTCxFQUFtQztBQUNoQ04sdUJBQWU7QUFDZEksZ0JBQU0sT0FEUTtBQUVkQyxtQkFBUztBQUZLLFNBQWY7QUFJRCxlQUFPTCxhQUFhSyxPQUFwQjtBQUNEOztBQUVEOzs7O0FBSUEsVUFBSSxPQUFPTSxNQUFQLEtBQWtCLFdBQWxCLElBQWlDQSxXQUFXLEVBQTVDLElBQWtEQSxXQUFXLElBQWpFLEVBQXVFO0FBQ3JFMUIsWUFBSSxvQkFBa0IwQixNQUF0QjtBQUNBcEIsWUFBSXdCLE9BQUosQ0FBWUgsWUFBWixHQUEyQkQsTUFBM0I7O0FBRUF6QixrQkFBVXlCLE1BQVY7O0FBRUNYLHVCQUFlO0FBQ2RLLG1CQUFTLFNBREs7QUFFZFcsbUJBQVM7QUFDUEMsMkJBQWVOO0FBRFI7QUFGSyxTQUFmO0FBTUQsZUFBT1gsYUFBYUssT0FBcEI7QUFDRDs7QUFFRCxhQUFPLEtBQUthLGdCQUFMLENBQXNCO0FBQzNCMUIsaUJBQVNELEdBRGtCO0FBRTNCRyxrQkFBVUQsR0FGaUI7QUFHM0IwQixrQkFBVVQsUUFIaUI7QUFJM0JVLHNCQUFhOztBQUpjLE9BQXRCLENBQVA7QUFRRDs7QUFHRCxRQUFJQyxpQkFBaUIsS0FBS0MsZ0JBQUwsQ0FBc0I7QUFDekM5QixlQUFTRCxHQURnQztBQUV6Q0csZ0JBQVVELEdBRitCO0FBR3pDOEIsZUFBU2pCO0FBSGdDLEtBQXRCLENBQXJCOztBQU9BLFFBQUllLGVBQWVHLE9BQWYsS0FBMkIsS0FBL0IsRUFBc0M7QUFDbkN4QixxQkFBZTtBQUNkSSxjQUFNLE9BRFE7QUFFZEMsaUJBQVM7QUFGSyxPQUFmO0FBSUQsYUFBT0wsYUFBYUssT0FBcEI7QUFDRDs7QUFHRCxRQUFJZ0IsZUFBZUksS0FBbkIsRUFBMEI7QUFDeEIsVUFBSUMsY0FBY3BCLGFBQWFHLEtBQWIsQ0FBbUIsR0FBbkIsQ0FBbEI7QUFDQSxVQUFJa0IsY0FBY0QsWUFBWSxDQUFaLENBQWxCOztBQUVBLGFBQU8sS0FBS1IsZ0JBQUwsQ0FBc0I7QUFDM0IxQixpQkFBU0QsR0FEa0I7QUFFM0JHLGtCQUFVRCxHQUZpQjtBQUczQjBCLGtCQUFVUSxXQUhpQjtBQUkzQlAsc0JBQWE7QUFKYyxPQUF0QixDQUFQO0FBT0QsS0FYRCxNQVdPOztBQUVMLGFBQU8sS0FBS1EsV0FBTCxDQUFpQjtBQUN0QmxDLGtCQUFVRCxHQURZO0FBRXRCb0MsY0FBTVIsZUFBZVMsR0FGQztBQUd0QkMsZUFBT1YsZUFBZVcsSUFIQTtBQUl0QkMsaUJBQVNaLGVBQWVhO0FBSkYsT0FBakIsQ0FBUDtBQU1EO0FBR0YsR0E5SWM7OztBQWlKZmhDLG1CQUFpQixpREFBVVosT0FBVixFQUFtQjtBQUNsQyxRQUFJQyxNQUFNRCxRQUFRRSxPQUFsQjtBQUNBLFFBQUlDLE1BQU1ILFFBQVFJLFFBQWxCO0FBQ0EsUUFBSXlDLFdBQVcsS0FBZjtBQUNBLFFBQUlyQyxjQUFjUixRQUFRYSxRQUExQjtBQUNBaUMsWUFBUW5ELEdBQVIsQ0FBWSxvQkFBa0JhLFdBQTlCOztBQUVBLFFBQUl1QyxnQkFBZ0IsQ0FBQyxXQUFELEVBQWMsT0FBZCxFQUF1QixRQUF2QixFQUFpQyxPQUFqQyxFQUEwQyxVQUExQyxDQUFwQjs7QUFFQSxRQUFJdkMsZ0JBQWdCLElBQWhCLElBQXdCQSxnQkFBZ0IsRUFBeEMsSUFBOENBLGdCQUFnQixXQUFsRSxFQUErRTtBQUM3RSxhQUFPcUMsUUFBUDtBQUNEOztBQUVELFFBQUlHLG1CQUFtQixJQUFJeEIsTUFBSixDQUFXLDJCQUFYLENBQXZCO0FBQ0FzQixZQUFRbkQsR0FBUixDQUFZLDBCQUF3QmEsV0FBcEM7O0FBR0EsUUFBSSxDQUFDd0MsaUJBQWlCM0MsSUFBakIsQ0FBc0JHLFdBQXRCLENBQUwsRUFBd0M7QUFDdENiLFVBQUksbUNBQUo7QUFDQSxhQUFPa0QsUUFBUDtBQUNEOztBQUlELFFBQUkzQixhQUFhVixZQUFZVyxLQUFaLENBQWtCLEdBQWxCLENBQWpCO0FBQ0EsUUFBSThCLHNCQUFzQi9CLFVBQTFCO0FBQ0FBLGVBQVdnQyxNQUFYLENBQWtCLENBQWxCLEVBQW9CLENBQXBCO0FBQ0EsUUFBSUMsZUFBZWpDLFdBQVdrQyxJQUFYLENBQWdCLEdBQWhCLENBQW5COztBQUVBekQsUUFBSSxxQkFBbUJ3RCxZQUF2Qjs7QUFFQSxXQUFPTixXQUFXLElBQWxCO0FBQ0QsR0FqTGM7O0FBbUxmNUIsY0FBWSw0Q0FBVUosUUFBVixFQUFvQjtBQUM5QmxCLFFBQUksWUFBSjtBQUNBLFFBQUlrRCxXQUFXLEVBQWY7QUFDQSxRQUFJckMsY0FBY0ssUUFBbEI7O0FBRUEsUUFBSUwsZ0JBQWdCLElBQWhCLElBQXdCQSxnQkFBZ0IsRUFBeEMsSUFBOEMsT0FBT0EsV0FBUCxLQUF1QixXQUF6RSxFQUFzRjtBQUNwRixhQUFPcUMsUUFBUDtBQUNEOztBQUVELFFBQUkzQixhQUFhVixZQUFZVyxLQUFaLENBQWtCLEdBQWxCLENBQWpCO0FBQ0EsUUFBSThCLHNCQUFzQi9CLFVBQTFCO0FBQ0FBLGVBQVdnQyxNQUFYLENBQWtCLENBQWxCLEVBQW9CLENBQXBCO0FBQ0EsUUFBSUMsZUFBZWpDLFdBQVdrQyxJQUFYLENBQWdCLEdBQWhCLENBQW5COztBQUVBLFdBQU9ELFlBQVA7QUFDRCxHQWxNYzs7QUFvTWZuQixvQkFBa0Isa0RBQVVoQyxPQUFWLEVBQW1COztBQUVuQ0wsUUFBSSxrQkFBSjtBQUNBLFFBQUlNLE1BQU1ELFFBQVFFLE9BQWxCO0FBQ0EsUUFBSUMsTUFBTUgsUUFBUUksUUFBbEI7O0FBRUEsUUFBSUksY0FBY1IsUUFBUWlDLE9BQTFCO0FBQ0EsUUFBSWYsYUFBYVYsWUFBWVcsS0FBWixDQUFrQixHQUFsQixDQUFqQjtBQUNBLFFBQUlrQyxZQUFZO0FBQ2RuQixlQUFTLEtBREs7QUFFZE0sV0FBSyxFQUZTO0FBR2RJLGNBQVEsS0FITTtBQUlkRixZQUFNO0FBSlEsS0FBaEI7O0FBT0EsUUFBSW5CLFlBQVksSUFBSUMsTUFBSixDQUFXLGdDQUFYLENBQWhCO0FBQ0EsUUFBSThCLGFBQWEsSUFBSTlCLE1BQUosQ0FBVyxxREFBWCxDQUFqQjtBQUNBLFFBQUkrQixZQUFZLElBQUkvQixNQUFKLENBQVcsMEJBQVgsQ0FBaEI7QUFDQSxRQUFJZ0MsZUFBZSxJQUFJaEMsTUFBSixDQUFXLFlBQVgsQ0FBbkI7O0FBR0EsUUFBSUQsVUFBVWxCLElBQVYsQ0FBZUcsV0FBZixDQUFKLEVBQ0UsT0FBTzZDLFlBQVksS0FBS0ksVUFBTCxDQUFnQmpELFdBQWhCLEVBQTZCVSxVQUE3QixDQUFuQjs7QUFFRixRQUFJRyxTQUFTekIsT0FBYjtBQUNBOztBQUVBLFFBQUk0RCxhQUFhbkQsSUFBYixDQUFrQkcsV0FBbEIsQ0FBSixFQUNFLE9BQU82QyxZQUFZLEtBQUtLLFdBQUwsQ0FBaUJsRCxXQUFqQixFQUE4QlUsVUFBOUIsRUFBMENHLE1BQTFDLENBQW5COztBQUVGLFFBQUlpQyxXQUFXakQsSUFBWCxDQUFnQkcsV0FBaEIsQ0FBSixFQUNFLE9BQU82QyxZQUFZLEtBQUtNLFdBQUwsQ0FBaUJuRCxXQUFqQixFQUE4QlUsVUFBOUIsRUFBMENHLE1BQTFDLENBQW5COztBQUdGLFFBQUlrQyxVQUFVbEQsSUFBVixDQUFlRyxXQUFmLENBQUosRUFDRSxPQUFPNkMsWUFBWSxLQUFLTyxVQUFMLENBQWdCcEQsV0FBaEIsRUFBNkJVLFVBQTdCLEVBQXlDRyxNQUF6QyxDQUFuQjs7QUFHRixXQUFPZ0MsU0FBUDtBQUVELEdBNU9jO0FBNk9mZixlQUFhLDZDQUFVdEMsT0FBVixFQUFtQjtBQUM5QkwsUUFBSSxhQUFKO0FBQ0EsUUFBSVEsTUFBTUgsUUFBUUksUUFBbEI7QUFDQSxRQUFJeUQsUUFBUUMsUUFBUUMsR0FBUixDQUFZQyxZQUF4QjtBQUNBLFFBQUlDLFVBQVUsd0JBQWQ7O0FBRUEsUUFBSUMsVUFBVWxFLFFBQVF1QyxJQUF0QjtBQUNBLFFBQUk0QixVQUFVbkUsUUFBUXlDLEtBQXRCO0FBQ0EsUUFBSUUsVUFBVTNDLFFBQVEyQyxPQUF0Qjs7QUFFQSxRQUFJeUIsYUFBYTtBQUNmQyxjQUFRMUIsT0FETztBQUVmMkIsV0FBS0wsVUFBVUMsT0FGQTtBQUdmSyxVQUFJO0FBQ0ZDLHNCQUFjWCxLQURaLENBQ2tCO0FBRGxCLE9BSFc7QUFNZlksZUFBUztBQUNQLHNCQUFjO0FBRFAsT0FOTTtBQVNmQyxZQUFNLElBVFMsQ0FTSjs7QUFUSSxRQVdmQyxNQUFNO0FBQ0pSO0FBREk7QUFYUyxLQUFqQjs7QUFnQkExRSxPQUFHMkUsVUFBSCxFQUNHUSxJQURILENBQ1EsVUFBVUMsV0FBVixFQUF1QjtBQUMzQixVQUFJQyxPQUFPRCxXQUFYO0FBQ0EvQixjQUFRbkQsR0FBUixDQUFZLHFCQUFxQm9GLEtBQUtDLFNBQUwsQ0FBZUYsSUFBZixDQUFqQztBQUNBLGFBQU9DLEtBQUtDLFNBQUwsQ0FBZUYsSUFBZixDQUFQO0FBQ0QsS0FMSCxFQU1HRyxLQU5ILENBTVMsVUFBVUMsR0FBVixFQUFlO0FBQ3BCLFVBQUlDLFFBQVFELEdBQVo7QUFDQTtBQUNBcEMsY0FBUW5ELEdBQVIsQ0FBWSwrQkFBK0J1RixHQUEzQztBQUNBLGFBQU9BLEdBQVA7QUFDRCxLQVhIO0FBY0QsR0FyUmM7O0FBd1JmO0FBQ0F0RCxvQkFBa0Isa0RBQVVGLE9BQVYsRUFBbUI7QUFDbkMvQixRQUFJLGlCQUFKO0FBQ0EsUUFBSVEsTUFBTXVCLFFBQVF0QixRQUFsQjtBQUNBLFFBQUlILE1BQU15QixRQUFReEIsT0FBbEI7QUFDQSxRQUFJa0YsaUJBQWlCMUQsUUFBUUcsUUFBN0I7QUFDQSxRQUFJd0QsWUFBWTNELFFBQVFJLFlBQXhCOztBQUVBLFFBQUl3RCxnQkFBZ0IsV0FBV0QsU0FBWCxHQUF1QixHQUF2QixHQUE2QkQsY0FBakQ7QUFDQSxRQUFJbkIsVUFBVSx5QkFBZDs7QUFFQSxRQUFJRyxhQUFhO0FBQ2ZFLFdBQUtMLFVBQVVxQixhQURBO0FBRWZmLFVBQUk7QUFDRjtBQURFLE9BRlc7QUFLZkUsZUFBUztBQUNQLHNCQUFjO0FBRFAsT0FMTTtBQVFmQyxZQUFNLElBUlMsQ0FRSjtBQVJJLEtBQWpCOztBQVdBLFdBQU9qRixHQUFHMkUsVUFBSCxFQUNKUSxJQURJLENBQ0MsVUFBVUMsV0FBVixFQUF1QjtBQUMzQmxGLFVBQUksbUJBQWlCQyxPQUFyQjtBQUNBLFVBQUl5QixTQUFTd0QsWUFBWVUsRUFBekI7QUFDQTVGLFVBQUksYUFBVzBCLE1BQWY7QUFDQXpCLGdCQUFVeUIsTUFBVjtBQUNBeUIsY0FBUW5ELEdBQVIsQ0FBWSxvQkFBb0IwQixNQUFoQztBQUNELEtBUEksRUFRSjRELEtBUkksQ0FRRSxVQUFVQyxHQUFWLEVBQWU7QUFDcEIsVUFBSUMsUUFBUUQsR0FBWjtBQUNBO0FBQ0F2RixVQUFJLG9CQUFKO0FBQ0FtRCxjQUFRbkQsR0FBUixDQUFZLG1CQUFaLEVBQWlDdUYsR0FBakM7QUFDRCxLQWJJLENBQVA7QUFlRCxHQTdUYzs7QUErVGY7QUFDQXpCLGNBQVksNENBQVVqRCxXQUFWLEVBQXVCVSxVQUF2QixFQUFtQzs7QUFFN0N2QixRQUFJLFlBQUo7QUFDQSxRQUFJeUYsaUJBQWlCbEUsV0FBVyxDQUFYLENBQXJCO0FBQ0EsUUFBSVksZUFBZSxXQUFuQjtBQUNBLFFBQUlSLGVBQWUsV0FBV1EsWUFBWCxHQUEwQixHQUExQixHQUFnQ3NELGNBQW5EOztBQUVBLFFBQUkvQixZQUFZO0FBQ2RuQixlQUFTLElBREs7QUFFZE0sV0FBS2xCLFlBRlM7QUFHZHNCLGNBQVEsS0FITTtBQUlkRixZQUFNLElBSlE7QUFLZFAsYUFBTztBQUxPLEtBQWhCOztBQVFBLFdBQU9rQixTQUFQO0FBQ0QsR0FoVmM7O0FBa1ZmO0FBQ0FNLGVBQWEsNkNBQVVuRCxXQUFWLEVBQXVCVSxVQUF2QixFQUFtQ0csTUFBbkMsRUFBMkM7QUFDdEQxQixRQUFJLGFBQUo7QUFDRSxRQUFJNkYsZ0JBQWdCbkUsTUFBcEI7O0FBRUEsUUFBSWdDLFlBQVk7QUFDZG5CLGVBQVMsS0FESztBQUVkTSxXQUFLLEVBRlM7QUFHZEksY0FBUSxLQUhNO0FBSWRGLFlBQU0sSUFKUTtBQUtkUCxhQUFPO0FBTE8sS0FBaEI7O0FBV0E7QUFDQSxRQUFJc0QsZ0JBQWdCLElBQUlqRSxNQUFKLENBQVcsNkJBQVgsQ0FBcEI7O0FBRUEsUUFBSWlFLGNBQWNwRixJQUFkLENBQW1CRyxXQUFuQixDQUFKLEVBQXFDOztBQUVuQyxVQUFJa0YsVUFBVXhFLFdBQVcsQ0FBWCxDQUFkO0FBQ0EsVUFBSXlFLGNBQWMscUJBQXFCSCxhQUFyQixHQUFxQyxVQUFyQyxHQUFrREUsT0FBcEU7O0FBRUEsVUFBSXJDLFlBQVk7QUFDZG5CLGlCQUFTLElBREs7QUFFZE0sYUFBS21ELFdBRlM7QUFHZC9DLGdCQUFRLEtBSE07QUFJZEYsY0FBTSxJQUpRO0FBS2RQLGVBQU87QUFMTyxPQUFoQjs7QUFRQSxhQUFPa0IsU0FBUDtBQUNEOztBQUdEO0FBQ0EsUUFBSXVDLG9CQUFvQixJQUFJcEUsTUFBSixDQUFXLHFDQUFYLENBQXhCOztBQUVBLFFBQUlvRSxrQkFBa0J2RixJQUFsQixDQUF1QkcsV0FBdkIsQ0FBSixFQUF5Qzs7QUFFdkMsVUFBSWtGLFVBQVV4RSxXQUFXLENBQVgsQ0FBZDtBQUNBLFVBQUkyRSxhQUFhM0UsV0FBVyxDQUFYLENBQWpCO0FBQ0EsVUFBSTRFLFFBQVE1RSxXQUFXLENBQVgsQ0FBWjs7QUFFQSxVQUFJNkUsb0JBQW9CLHFCQUFxQlAsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQWxELEdBQTRELFFBQXBGOztBQUVBLFVBQUlNLFdBQVc7QUFDYkMscUJBQWFKLFVBREE7QUFFYkssa0JBQVdKLFVBQVUsSUFBVixJQUFrQkEsVUFBVSxFQUE1QixJQUFrQyxPQUFPQSxLQUFQLEtBQWlCLFdBQW5ELEdBQWlFQSxLQUFqRSxHQUF5RTtBQUZ2RSxPQUFmOztBQUtBLFVBQUl6QyxZQUFZO0FBQ2RuQixpQkFBUyxJQURLO0FBRWRNLGFBQUt1RCxpQkFGUztBQUdkbkQsZ0JBQVEsTUFITTtBQUlkRixjQUFNc0QsUUFKUTtBQUtkN0QsZUFBTztBQUxPLE9BQWhCOztBQVFBLGFBQU9rQixTQUFQO0FBQ0Q7O0FBR0Q7QUFDQSxRQUFJOEMsY0FBYyxJQUFJM0UsTUFBSixDQUFXLDJCQUFYLENBQWxCOztBQUVBLFFBQUkyRSxZQUFZOUYsSUFBWixDQUFpQkcsV0FBakIsQ0FBSixFQUFtQzs7QUFFakMsVUFBSWtGLFVBQVV4RSxXQUFXLENBQVgsQ0FBZDs7QUFFQSxVQUFJa0YsWUFBWSxxQkFBcUJaLGFBQXJCLEdBQXFDLFVBQXJDLEdBQWtERSxPQUFsRCxHQUE0RCxTQUE1RTs7QUFFQSxVQUFJckMsWUFBWTtBQUNkbkIsaUJBQVMsSUFESztBQUVkTSxhQUFLNEQsU0FGUztBQUdkeEQsZ0JBQVEsS0FITTtBQUlkRixjQUFNLElBSlE7QUFLZFAsZUFBTztBQUxPLE9BQWhCOztBQVFBLGFBQU9rQixTQUFQO0FBQ0Q7O0FBSUQ7QUFDQSxRQUFJZ0QsbUJBQW1CLElBQUk3RSxNQUFKLENBQVcsK0JBQVgsQ0FBdkI7O0FBRUEsUUFBSTZFLGlCQUFpQmhHLElBQWpCLENBQXNCRyxXQUF0QixDQUFKLEVBQXdDOztBQUV0QyxVQUFJa0YsVUFBVXhFLFdBQVcsQ0FBWCxDQUFkO0FBQ0EsVUFBSTJFLGFBQWEzRSxXQUFXLENBQVgsQ0FBakI7QUFDQSxVQUFJNEUsUUFBUTVFLFdBQVcsQ0FBWCxDQUFaOztBQUVBLFVBQUk2RSxvQkFBb0IscUJBQXFCUCxhQUFyQixHQUFxQyxVQUFyQyxHQUFrREUsT0FBbEQsR0FBNEQsUUFBcEY7O0FBRUEsVUFBSU0sV0FBVztBQUNiQyxxQkFBYUosVUFEQTtBQUViSyxrQkFBV0osVUFBVSxJQUFWLElBQWtCQSxVQUFVLEVBQTVCLElBQWtDLE9BQU9BLEtBQVAsS0FBaUIsV0FBbkQsR0FBaUVBLEtBQWpFLEdBQXlFO0FBRnZFLE9BQWY7O0FBS0EsVUFBSXpDLFlBQVk7QUFDZG5CLGlCQUFTLElBREs7QUFFZE0sYUFBS3VELGlCQUZTO0FBR2RuRCxnQkFBUSxNQUhNO0FBSWRGLGNBQU1zRCxRQUpRO0FBS2Q3RCxlQUFPO0FBTE8sT0FBaEI7O0FBUUEsYUFBT2tCLFNBQVA7QUFDRDs7QUFJRDtBQUNBLFFBQUlpRCxXQUFXLElBQUk5RSxNQUFKLENBQVcsd0JBQVgsQ0FBZjs7QUFFQSxRQUFJOEUsU0FBU2pHLElBQVQsQ0FBY0csV0FBZCxDQUFKLEVBQWdDOztBQUU5QixVQUFJa0YsVUFBVXhFLFdBQVcsQ0FBWCxDQUFkOztBQUVBLFVBQUlxRixTQUFTLHFCQUFxQmYsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQS9EOztBQUVBLFVBQUlyQyxZQUFZO0FBQ2RuQixpQkFBUyxJQURLO0FBRWRNLGFBQUsrRCxNQUZTO0FBR2QzRCxnQkFBUSxLQUhNO0FBSWRGLGNBQU0sSUFKUTtBQUtkUCxlQUFPO0FBTE8sT0FBaEI7O0FBUUEsYUFBT2tCLFNBQVA7QUFDRDs7QUFHRDtBQUNBLFFBQUltRCxZQUFZLElBQUloRixNQUFKLENBQVcscUNBQVgsQ0FBaEI7O0FBRUEsUUFBSWdGLFVBQVVuRyxJQUFWLENBQWVHLFdBQWYsQ0FBSixFQUFpQzs7QUFFL0IsVUFBSTBELFVBQVUsRUFBZDs7QUFFQSxVQUFJYixZQUFZO0FBQ2RuQixpQkFBUyxJQURLO0FBRWRNLGFBQUswQixPQUZTO0FBR2R0QixnQkFBUSxLQUhNO0FBSWRGLGNBQU0sSUFKUTtBQUtkUCxlQUFPO0FBTE8sT0FBaEI7O0FBUUEsYUFBT2tCLFNBQVA7QUFDRDs7QUFHRCxXQUFPQSxTQUFQO0FBRUQsR0EvZVk7O0FBa2ZmO0FBQ0FLLGVBQWEsNkNBQVVsRCxXQUFWLEVBQXVCVSxVQUF2QixFQUFtQ0csTUFBbkMsRUFBMkM7QUFDdEQxQixRQUFJLGFBQUo7O0FBRUEsUUFBSTZGLGdCQUFnQm5FLE1BQXBCOztBQUVBLFFBQUlxRSxVQUFVeEUsV0FBVyxDQUFYLENBQWQ7QUFDQSxRQUFJdUYsV0FBVyxxQkFBcUJqQixhQUFyQixHQUFxQyxVQUFyQyxHQUFrREUsT0FBakU7O0FBRUEsUUFBSXJDLFlBQVk7QUFDZGIsV0FBS2lFLFFBRFM7QUFFZDdELGNBQVEsS0FGTTtBQUdkRixZQUFNLElBSFE7QUFJZFAsYUFBTztBQUpPLEtBQWhCOztBQU9BLFdBQU9rQixTQUFQO0FBQ0QsR0FuZ0JjOztBQXFnQmY7QUFDQU8sY0FBWSw0Q0FBVXBELFdBQVYsRUFBdUJVLFVBQXZCLEVBQW1DRyxNQUFuQyxFQUEyQztBQUNyRDFCLFFBQUksWUFBSjs7QUFFQSxRQUFJNkYsZ0JBQWdCbkUsTUFBcEI7QUFDQSxRQUFJcUYsVUFBVSxxQkFBcUJsQixhQUFyQixHQUFxQyxRQUFuRDs7QUFFQSxRQUFJbkMsWUFBWTtBQUNkYixXQUFLa0UsT0FEUztBQUVkOUQsY0FBUSxLQUZNO0FBR2RGLFlBQU0sSUFIUTtBQUlkUCxhQUFPO0FBSk8sS0FBaEI7O0FBT0EsV0FBT2tCLFNBQVA7QUFDRDs7QUFwaEJjLENBQWpCIiwiZmlsZSI6InNjcnVtX2JvYXJkLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIHJlcG9faWQ7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cbiAgY2FsbE1lOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHRlc3QgPSBvcHRpb25zLnRlc3Q7XG5cbiAgICB2YXIgRmluYWxEYXRhID0ge1xuICAgICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICAgIFwiQ2hlY2tcIjogdGVzdFxuICAgIH07XG5cbiAgICByZXR1cm4gRmluYWxEYXRhO1xuICB9LFxuXG4gIGdldFNjcnVtRGF0YShvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVzZXJJbnB1dDtcblxuICAgICB2YXIgRmluYWxNZXNzYWdlPW51bGw7XG4gICAgLy8gICBNZXNzYWdlIDogbnVsbCxcbiAgICAvLyAgIE9wdGlvbnMgOiBudWxsXG4gICAgLy8gfTtcblxuICAgIHZhciBDaGVja0lmVmFsaWRDb21tYW5kID0gdGhpcy5jaGVja1ZhbGlkSW5wdXQoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIFVDb21tYW5kOiBVc2VyQ29tbWFuZFxuICAgIH0pO1xuXG4gICAgaWYgKCFDaGVja0lmVmFsaWRDb21tYW5kKSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuXG4gICAgICAvL3JldHVybiByZXMuanNvbihGaW5hbE1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kVmFsdWUgPSB0aGlzLmdldENvbW1hbmQoVXNlckNvbW1hbmQpO1xuXG4gICAgbG9nKFwiY29tbWFuZCB2YWwgOiBcIitDb21tYW5kVmFsdWUpO1xuXG4gICAgaWYgKENvbW1hbmRWYWx1ZSA9PT0gJycgfHwgQ29tbWFuZFZhbHVlID09PSBudWxsIHx8IHR5cGVvZiBDb21tYW5kVmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSBDb21tYW5kQXJyWzJdO1xuICAgIHJlcG9faWQgPSBSZXBvSWQ7XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9IFJlcG9JZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuICAgICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKlxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgLyp2YXIgQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICAgIHZhciBSZXBvSWQgPSBDb21tYW5kQXJyWzJdOyovXG5cbiAgICAgIGlmICh0eXBlb2YgUmVwb0lkICE9PSAndW5kZWZpbmVkJyAmJiBSZXBvSWQgIT09ICcnICYmIFJlcG9JZCAhPT0gbnVsbCkge1xuICAgICAgICBsb2coXCJyZXBvIGZvdW5kIGlkOiBcIitSZXBvSWQpO1xuICAgICAgICByZXEuc2Vzc2lvbi5SZXBvc2l0b3J5SWQgPSBSZXBvSWQ7XG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgXG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgTWVzc2FnZTogJ1N1Y2Nlc3MnLFxuICAgICAgICAgIE9wdGlvbnM6IHtcbiAgICAgICAgICAgIFJlc3Bvc2l0b3J5SWQ6IFJlcG9JZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogUmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgICBcbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICB2YXIgVmFsaWRVcmxPYmplY3QgPSB0aGlzLnZhbGlkYXRlQ29tbWFuZHMoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIENvbW1hbmQ6IENvbW1hbmRWYWx1ZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIENvbW1hbmRzJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2RcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIH0sXG5cblxuICBjaGVja1ZhbGlkSW5wdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVmFsaWRCaXQgPSBmYWxzZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVDb21tYW5kO1xuICAgIGNvbnNvbGUubG9nKFwidXNlciBjb21tYW5kIDogXCIrVXNlckNvbW1hbmQpO1xuICAgIFxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIitVc2VyQ29tbWFuZCk7XG5cblxuICAgIGlmICghVmFsaWRDb21tYWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSl7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICAgIFxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcbiAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIGxvZyhcIkZpbmFsIENvbW1hbmQgOiBcIitGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcbiAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBGaW5hbENvbW1hbmQ7XG4gIH0sXG5cbiAgdmFsaWRhdGVDb21tYW5kczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIGxvZyhcInZhbGlkYXRlQ29tbWFuZHNcIik7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcblxuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuQ29tbWFuZDtcbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsXG4gICAgfTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSpcXHNbMC05XSovKTtcbiAgICB2YXIgSXNzdWVSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvaXNzdWVdKlxcc1swLTldKlxccygtdXxidWd8cGlwZWxpbmV8LXB8ZXZlbnRzfC1lKS8pO1xuICAgIHZhciBFcGljUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2VwaWNdKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBCbG9ja2VkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvYmxvY2tlZC8pO1xuXG5cbiAgICBpZiAoUmVwb1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0UmVwb1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycik7XG5cbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcbiAgICAvL3ZhciBSZXBvSWQgPSByZXEuc2Vzc2lvbi5SZXBvc2l0b3J5SWQ7XG5cbiAgICBpZiAoQmxvY2tlZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0QmxvY2tVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoSXNzdWVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG5cbiAgICBpZiAoRXBpY1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcblxuICB9LFxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBsb2coXCJtYWtlUmVxdWVzdFwiKTtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVG9rZW4gPSBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU47XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuemVuaHViLmlvLyc7XG5cbiAgICB2YXIgVXNlclVybCA9IG9wdGlvbnMuVVVybDtcbiAgICB2YXIgVXJsQm9keSA9IG9wdGlvbnMuVUJvZHk7XG4gICAgdmFyIFVNZXRob2QgPSBvcHRpb25zLlVNZXRob2Q7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogVU1ldGhvZCxcbiAgICAgIHVyaTogTWFpblVybCArIFVzZXJVcmwsXG4gICAgICBxczoge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgICAgICxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgVXJsQm9keVxuICAgICAgfVxuICAgIH07XG5cbiAgICBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KERhdGEpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyBmb2xsb3dpbmcgZXJyb3IgPScgKyBlcnIpO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfSk7XG5cblxuICB9LFxuXG5cbiAgLy8gVG8gR2V0IFJlcG9zaXRvcnkgSWRcbiAgZ2V0UmVzcG9zaXRvcnlJZDogZnVuY3Rpb24gKE9wdGlvbnMpIHtcbiAgICBsb2coXCJnZXRSZXBvc2l0b3J5SWRcIik7XG4gICAgdmFyIHJlcyA9IE9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHJlcSA9IE9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBPcHRpb25zLnJlcG9OYW1lO1xuICAgIHZhciBPd25lcm5hbWUgPSBPcHRpb25zLkdpdE93bmVyTmFtZTtcblxuICAgIHZhciBSZXBvc2l0b3J5VXJsID0gJ3JlcG9zLycgKyBPd25lcm5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tLyc7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIHVyaTogTWFpblVybCArIFJlcG9zaXRvcnlVcmwsXG4gICAgICBxczoge1xuICAgICAgICAvL2FjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgbG9nKFwidXNpbmcgcmVwb2lkOiBcIityZXBvX2lkKTtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuICAgICAgICBsb2coXCJSZXBvIElkIFwiK1JlcG9JZCk7XG4gICAgICAgIHJlcG9faWQgPSBSZXBvSWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSZXBvc2l0b3J5IElkID0nICsgUmVwb0lkKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBsb2coXCJBUEkgY2FsbCBmYWlsZWQuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICB9KTtcblxuICB9LFxuXG4gIC8vIFRvIEdldCBSZXBvIFVybFxuICBnZXRSZXBvVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpIHtcblxuICAgIGxvZyhcImdldFJlcG9VcmxcIik7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgR2l0T3duZXJOYW1lID0gJ3gwMDA2Njk0OSc7XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9ICdyZXBvcy8nICsgR2l0T3duZXJOYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogUmVwb3NpdG9yeUlkLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogdHJ1ZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IElzc3VlIHJlbGF0ZWQgVXJsXG4gIGdldElzc3VlVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldElzc3VlVXJsXCIpO1xuICAgICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgICBVcmw6ICcnLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgIH07XG5cblxuXG5cbiAgICAgIC8vVG8gR2V0IFN0YXRlIG9mIFBpcGVsaW5lXG4gICAgICB2YXIgUGlwZWxpbmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNwaXBlbGluZS8pO1xuXG4gICAgICBpZiAoUGlwZWxpbmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICAgICAgdmFyIFBpcGVMaW5ldXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFBpcGVMaW5ldXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vIE1vdmUgUGlwZWxpbmVcbiAgICAgIHZhciBQaXBlbGluZU1vdmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtcFxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoUGlwZWxpbmVNb3ZlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgICAgIHZhciBQaXBlTGluZUlkID0gQ29tbWFuZEFyclszXTtcbiAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls0XTtcblxuICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcblxuICAgICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgICAgcGlwZWxpbmVfaWQ6IFBpcGVMaW5lSWQsXG4gICAgICAgICAgcG9zaXRpb246IChQb3NObyAhPT0gbnVsbCAmJiBQb3NObyAhPT0gJycgJiYgdHlwZW9mIFBvc05vICE9PSAndW5kZWZpbmVkJyA/IFBvc05vIDogMClcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBNb3ZlSXNzdWVQaXBlTGluZSxcbiAgICAgICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vIEdldCBldmVudHMgZm9yIHRoZSBJc3N1ZVxuICAgICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG5cbiAgICAgICAgdmFyIEV2ZW50c1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXZlbnRzJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBFdmVudHNVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuXG4gICAgICAvLyBHZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoRXN0aW1hdGVBZGRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICAgICAgdmFyIFBpcGVMaW5lSWQgPSBDb21tYW5kQXJyWzNdO1xuICAgICAgICB2YXIgUG9zTm8gPSBDb21tYW5kQXJyWzRdO1xuXG4gICAgICAgIHZhciBNb3ZlSXNzdWVQaXBlTGluZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBwaXBlbGluZV9pZDogUGlwZUxpbmVJZCxcbiAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuXG4gICAgICAvLyBHZXQgQnVncyBieSB0aGUgdXNlclxuICAgICAgdmFyIEJ1Z1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc2J1Zy8pO1xuXG4gICAgICBpZiAoQnVnUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG5cbiAgICAgICAgdmFyIEJ1Z1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBCdWdVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy9UbyBHZXQgVXNlciBJc3N1ZSBieSB1c2VyXG4gICAgICB2YXIgVXNlclJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy11XFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChVc2VyUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgVXNlclVybCA9ICcnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFVzZXJVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgIH1cblxuICAgICxcbiAgLy9UbyBHZXQgQmxvY2tlZCBJc3N1ZXMgVXJsXG4gIGdldEJsb2NrVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldEJsb2NrVXJsXCIpO1xuXG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEJsb2NrdXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogQmxvY2t1cmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IEJsb2NrZWQgSXNzdWVzIFVybFxuICBnZXRFcGljVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldEVwaWNVcmxcIik7XG5cbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9XG5cbn07XG4iXX0=