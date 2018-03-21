/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');
var dateFormat = require('dateformat');
var os = require("os");

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
    var RepoId = repo_id;

    log("repo id 1 : " + repo_id);

    var RepositoryId = repo_id;

    if (RepositoryId === null || RepositoryId === '' || typeof RepositoryId === 'undefined') {
      log("trying to get repo id");
      //var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]*\s[0-9]*/);

      var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]/);

      if (!RepoRegex.test(CommandValue)) {
        FinalMessage = {
          Type: 'Error',
          Message: 'Repository Id Not Specified'
        };
        return FinalMessage.Message;
      }

      if (typeof RepoId !== 'undefined' && RepoId !== '' && RepoId !== null) {
        log("repo found id: " + RepoId);

        RepoId = repo_id;

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

    log("get url");
    var ValidUrlObject = this.validateCommands({
      request: req,
      response: res,
      Command: CommandValue
    });

    if (ValidUrlObject.IsValid === false) {
      log("url is not valid");
      FinalMessage = {
        Type: 'Error',
        Message: 'Invalid Commands'
      };
      return FinalMessage.Message;
    }

    log("url is valid");
    if (ValidUrlObject.IsGit) {
      log("is Git ..");
      var UCommandArr = CommandValue.split(' ');
      var GitRepoName = UCommandArr[1];

      return this.getRespositoryId({
        request: req,
        response: res,
        repoName: GitRepoName,
        GitOwnerName: 'x00066949'
      });
    } else {

      log("not git");
      return this.makeRequest({
        response: res,
        UUrl: ValidUrlObject.Url,
        UBody: ValidUrlObject.Body,
        UMethod: ValidUrlObject.Method,
        UType: ValidUrlObject.UrlType
      });
    }
  },
  /*istanbul ignore next*/

  //given, pipeline name, return pipeline id
  getPipelineId: function getPipelineId(PipelineName) {
    log(PipelineName);
    var PipelineId;

    var pipelineIdRequest = {
      uri: 'https://api.zenhub.io/p1/repositories/' + repo_id + '/board',

      headers: {
        'X-Authentication-Token': process.env.ZENHUB_TOKEN
      },

      json: true
    };
    return rp(pipelineIdRequest).then(function (data) {

      log(data);
      for (var i = 0; i < data['pipelines'].length; i++) {
        if (data['pipelines'][i].name === PipelineName) {
          log("found pipeline id : " + data['pipelines'][i].id);
          return data['pipelines'][i].id;
        }
      }

      log("did not find id corresponding to pipe name");
    }).catch(function (err) {
      console.log("error = " + err);
      return err;
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

    //if /repo comes after @scrumbot, no repo id provided else take whatever comes after @scrumbot as repo_id
    if (CommandArr[1] === ValidCommands[1]) {
      CommandArr.splice(0, 1);
    } else {
      repo_id = CommandArr[2];
      CommandArr.splice(0, 1);
    }

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

    if (CommandArr[1] === '/repo') {
      CommandArr.splice(0, 1);
    } else {
      repo_id = CommandArr[2];
      log("firstly initialisiing repo_id as " + repo_id + " from message arg at pos 1 = " + CommandArr[1]);
      CommandArr.splice(0, 1);
    }

    log("repo id 2 : " + repo_id);
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

    var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]*/);
    var IssueRegex = new RegExp(/^[\/issue]*\s[0-9]*\s[0-9]*\s(-u|bug|pipeline|-p|events|-e)/);
    var EpicRegex = new RegExp(/^[\/epic]*\s[A-Za-z0-9]*/);
    var BlockedRegex = new RegExp(/^\/blocked/);

    if (RepoRegex.test(UserCommand)) return UrlObject = this.getRepoUrl(UserCommand, CommandArr);

    var RepoId = repo_id;

    if (BlockedRegex.test(UserCommand)) return UrlObject = this.getBlockUrl(UserCommand, CommandArr, RepoId);

    if (IssueRegex.test(UserCommand)) return UrlObject = this.getIssueUrl(UserCommand, CommandArr, RepoId);

    if (EpicRegex.test(UserCommand)) return UrlObject = this.getEpicUrl(UserCommand, CommandArr, RepoId);

    log("UrlObject = " + UrlObject);
    return UrlObject;
  },

  makeRequest: function /*istanbul ignore next*/makeRequest(options) {
    log("makeRequest");
    log(options.UBody);
    var res = options.response;
    var Token = process.env.ZENHUB_TOKEN;
    var MainUrl = 'https://api.zenhub.io/';

    var UserUrl = options.UUrl;
    var UrlBody = options.UBody;
    var UrlBody;

    if (options.UBody == null) {
      UrlBody = options.UBody;
    } else {
      UrlBody = options.UBody.estimate;
    }

    var UMethod = options.UMethod;
    var UrlType = options.UType;

    log("Body : " + JSON.stringify(UrlBody));

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
        estimate: UrlBody
        //UrlBody

      }
    };

    return rp(UrlOptions).then(function (successdata) {
      var Data = successdata;
      console.log('Following Data =' + JSON.stringify(Data));

      //Parse JSON according to obj returned
      if (UrlType === 'IssueEvents') {
        log("Events for issue");
        Data = "*Here are the most recent events regarding your issue:* ```";

        for (var i = 0; i < successdata.length; i++) {

          if (successdata[i].type === 'transferIssue') {
            log("pipeline move event" + JSON.stringify(successdata[i].to_pipeline) + successdata[i].from_pipeline);
            Data += "\
              *User " + successdata[i].user_id + "* _moved_ this issue from " + successdata[i].from_pipeline.name + " to " + successdata[i].to_pipeline.name + " on date : " + dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
          }
          if (successdata[i].type === 'estimateIssue') {
            log("estimate change event " + i);
            Data += "\
              *User " + successdata[i].user_id + "* _changed estimate_ on this issue to  " + successdata[i].to_estimate.value + " on date : " + dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
          } else {
            log("do not recogise event type");
          }
        }
        Data += " ```";
      }

      if (UrlType === 'GetPipeline') {

        Data = " ";
        Data += "That issue is currently in " + successdata.pipeline.name + " pipeline.";
      }

      if (UrlType === 'IssueEstimate') {
        Data = " ";
        Data += "Your Issue's estimate has been updated to " + successdata.estimate;
      }

      if (UrlType === 'EpicIssues') {

        Data = "The following Epics are in your scrumboard: ";
        for (var i = 0; i < successdata.epic_issues.length; i++) {
          Data += "  \
            *" + (i + 1) + "* Epic ID: " + successdata.epic_issues[i].issue_number + " Url : " + successdata.epic_issues[i].issue_url + " " + os.EOL;
        }
      }

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
      var RepoId = successdata.id;

      repo_id = RepoId;
      console.log(successdata);
      return "The *Repository Id* for _" + RepositoryName + "_ is " + JSON.stringify(successdata.id) + " View repo at : " + successdata.html_url;
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
    var PipelineRegex = new RegExp(/^\/issue*\s[0-9]*\s[0-9]*\spipeline/);

    if (PipelineRegex.test(UserCommand)) {

      var IssueNo = CommandArr[2];
      log("issue Num in getISsueUrl : " + IssueNo);
      var PipeLineurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        IsValid: true,
        Url: PipeLineurl,
        Method: 'GET',
        Body: null,
        IsGit: false,
        UrlType: 'GetPipeline'
      };

      return UrlObject;
    }

    // Move Pipeline
    var PipelineMoveRegex = new RegExp(/^\/issue*\s[0-9]*\s[0-9]*\s-p\s[A-Za-z0-9]*/);

    if (PipelineMoveRegex.test(UserCommand)) {

      //if moving pipeline, 3rd arg is issue num,  4th = -p, 5th = pipeline, 6t position
      var IssueNo = CommandArr[2];
      var PipeLineId = this.getPipelineId(CommandArr[5]).then(function (data) {

        log("Pipeline got (using data): " + data);
        var PosNo = CommandArr[6] | 0;
        var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';
        log("building move pipeline url..");

        var MoveBody = {
          pipeline_id: data,
          position: PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0
        };

        var UrlObject = {
          IsValid: true,
          Url: MoveIssuePipeLine,
          Method: 'POST',
          Body: MoveBody,
          IsGit: false,
          UrlType: 'IssueToPipelines'
        };

        log("url built.");
        return UrlObject;
      });
    }

    // Get events for the Issue 
    var EventsRegex = new RegExp(/^\/issue*\s[0-9]*\s[0-9]*\sevents/);

    if (EventsRegex.test(UserCommand)) {

      var IssueNo = CommandArr[2];
      log("issue no eventsregex " + IssueNo);
      var EventsUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/events';

      var UrlObject = {
        IsValid: true,
        Url: EventsUrl,
        Method: 'GET',
        Body: null,
        IsGit: false,
        UrlType: 'IssueEvents'
      };

      return UrlObject;
    }

    // Set the estimate for the issue.
    var EstimateAddRegex = new RegExp(/^\/issue*\s[0-9]*\s[0-9]*\s-e\s[0-9]*/);

    if (EstimateAddRegex.test(UserCommand)) {

      var IssueNo = CommandArr[2];
      var EstimateVal = CommandArr[4];
      log("EstimateVal : " + EstimateVal);
      var SetEstimate = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/estimate';

      var MoveBody = {
        "estimate": EstimateVal
      };

      var UrlObject = {
        IsValid: true,
        Url: SetEstimate,
        Method: 'PUT',
        Body: MoveBody,
        IsGit: false,
        UrlType: 'IssueEstimate'
      };

      return UrlObject;
    }

    // Get Bugs by the user
    var BugRegex = new RegExp(/^\/issue*\s[0-9]*\sbug/);

    if (BugRegex.test(UserCommand)) {

      var IssueNo = CommandArr[2];
      var BugUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        IsValid: true,
        Url: BugUrl,
        Method: 'GET',
        Body: null,
        IsGit: false,
        UrlType: 'BugIssues'
      };

      return UrlObject;
    }

    //To Get User Issue by user, userIssue
    var UserRegex = new RegExp(/^\/issue*\s[0-9]*\s-u\s[A-Za-z0-9]*/);

    if (UserRegex.test(UserCommand)) {

      var UserUrl = '';

      var UrlObject = {
        IsValid: true,
        Url: UserUrl,
        Method: 'GET',
        Body: null,
        IsGit: false,
        UrlType: 'UserIssues'
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
      IsGit: false,
      UrlType: 'BlockedIssues'
    };

    return UrlObject;
  },

  //To Get epics Url
  getEpicUrl: function /*istanbul ignore next*/getEpicUrl(UserCommand, CommandArr, RepoId) {

    log("getEpicUrl");
    var RespositroyId = RepoId;
    var EpicUrl = 'p1/repositories/' + RespositroyId + '/epics';

    var UrlObject = {
      IsValid: true,
      Url: EpicUrl,
      Method: 'GET',
      Body: null,
      IsGit: false,
      UrlType: 'EpicIssues'
    };

    return UrlObject;
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJkYXRlRm9ybWF0Iiwib3MiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsIlBpcGVsaW5lSWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsImhlYWRlcnMiLCJwcm9jZXNzIiwiZW52IiwiWkVOSFVCX1RPS0VOIiwianNvbiIsInRoZW4iLCJkYXRhIiwiaSIsImxlbmd0aCIsIm5hbWUiLCJpZCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIlZhbGlkQml0IiwiVmFsaWRDb21tYW5kcyIsIlZhbGlkQ29tbWFkUmVnZXgiLCJPcmlnaW5hbHNDb21tYW5kQXJyIiwic3BsaWNlIiwiRmluYWxDb21tYW5kIiwiam9pbiIsIlVybE9iamVjdCIsIklzc3VlUmVnZXgiLCJFcGljUmVnZXgiLCJCbG9ja2VkUmVnZXgiLCJnZXRSZXBvVXJsIiwiZ2V0QmxvY2tVcmwiLCJnZXRJc3N1ZVVybCIsImdldEVwaWNVcmwiLCJUb2tlbiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiVXJsQm9keSIsImVzdGltYXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJxcyIsImFjY2Vzc190b2tlbiIsImJvZHkiLCJzdWNjZXNzZGF0YSIsIkRhdGEiLCJ0eXBlIiwidG9fcGlwZWxpbmUiLCJmcm9tX3BpcGVsaW5lIiwidXNlcl9pZCIsImNyZWF0ZWRfYXQiLCJ0b19lc3RpbWF0ZSIsInZhbHVlIiwicGlwZWxpbmUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsIkVPTCIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaHRtbF91cmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUGlwZUxpbmVJZCIsIlBvc05vIiwiTW92ZUlzc3VlUGlwZUxpbmUiLCJNb3ZlQm9keSIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJFdmVudHNSZWdleCIsIkV2ZW50c1VybCIsIkVzdGltYXRlQWRkUmVnZXgiLCJFc3RpbWF0ZVZhbCIsIlNldEVzdGltYXRlIiwiQnVnUmVnZXgiLCJCdWdVcmwiLCJVc2VyUmVnZXgiLCJCbG9ja3VybCIsIkVwaWNVcmwiXSwibWFwcGluZ3MiOiI7O0FBT0E7Ozs7OztBQVBBLElBQUlBLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FBS0QsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUUsUUFBUUYsUUFBUSxP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QVk7QUFDZHZDLGVBQVUsSUFESTtBQUVkTSxXQUFLNEYsT0FGUztBQUdkeEYsY0FBUSxLQUhNO0FBSWRGLFlBQU0sSUFKUTtBQUtkUCxhQUFPLEtBTE87QUFNZFcsZUFBUTtBQU5NLEtBQWhCOztBQVNBLFdBQU8yQixTQUFQO0FBQ0Q7O0FBN29CYyxDQUFqQiIsImZpbGUiOiJzY3J1bV9ib2FyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciBSZWdleCA9IHJlcXVpcmUoJ3JlZ2V4Jyk7XG52YXIgZGF0ZUZvcm1hdCA9IHJlcXVpcmUoJ2RhdGVmb3JtYXQnKTtcbnZhciBvcyA9IHJlcXVpcmUoXCJvc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIHJlcG9faWQ7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cbiAgY2FsbE1lOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHRlc3QgPSBvcHRpb25zLnRlc3Q7XG5cbiAgICB2YXIgRmluYWxEYXRhID0ge1xuICAgICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICAgIFwiQ2hlY2tcIjogdGVzdFxuICAgIH07XG5cbiAgICByZXR1cm4gRmluYWxEYXRhO1xuICB9LFxuXG4gIGdldFNjcnVtRGF0YShvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVzZXJJbnB1dDtcblxuICAgICB2YXIgRmluYWxNZXNzYWdlPW51bGw7XG4gICAgLy8gICBNZXNzYWdlIDogbnVsbCxcbiAgICAvLyAgIE9wdGlvbnMgOiBudWxsXG4gICAgLy8gfTtcblxuICAgIHZhciBDaGVja0lmVmFsaWRDb21tYW5kID0gdGhpcy5jaGVja1ZhbGlkSW5wdXQoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIFVDb21tYW5kOiBVc2VyQ29tbWFuZFxuICAgIH0pO1xuXG4gICAgaWYgKCFDaGVja0lmVmFsaWRDb21tYW5kKSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRWYWx1ZSA9IHRoaXMuZ2V0Q29tbWFuZChVc2VyQ29tbWFuZCk7XG5cbiAgICBsb2coXCJjb21tYW5kIHZhbCA6IFwiK0NvbW1hbmRWYWx1ZSk7XG5cbiAgICBpZiAoQ29tbWFuZFZhbHVlID09PSAnJyB8fCBDb21tYW5kVmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIENvbW1hbmRWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIC8vZ2V0IHJlcG8gaWRcbiAgICB2YXIgQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgIHZhciBSZXBvTmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICBsb2coXCJyZXBvIGlkIDEgOiBcIityZXBvX2lkKTtcblxuICAgIHZhciBSZXBvc2l0b3J5SWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKFJlcG9zaXRvcnlJZCA9PT0gbnVsbCB8fCBSZXBvc2l0b3J5SWQgPT09ICcnIHx8IHR5cGVvZiBSZXBvc2l0b3J5SWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsb2coXCJ0cnlpbmcgdG8gZ2V0IHJlcG8gaWRcIik7XG4gICAgICAvL3ZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSpcXHNbMC05XSovKTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XS8pO1xuICAgIFxuICAgICAgaWYgKCFSZXBvUmVnZXgudGVzdChDb21tYW5kVmFsdWUpKSB7XG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgICBNZXNzYWdlOiAnUmVwb3NpdG9yeSBJZCBOb3QgU3BlY2lmaWVkJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgUmVwb0lkICE9PSAndW5kZWZpbmVkJyAmJiBSZXBvSWQgIT09ICcnICYmIFJlcG9JZCAhPT0gbnVsbCkge1xuICAgICAgICBsb2coXCJyZXBvIGZvdW5kIGlkOiBcIitSZXBvSWQpO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG4gICAgICAgIFxuICAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIE1lc3NhZ2U6ICdTdWNjZXNzJyxcbiAgICAgICAgICBPcHRpb25zOiB7XG4gICAgICAgICAgICBSZXNwb3NpdG9yeUlkOiBSZXBvSWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgICAgXG4gICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgbG9nKFwiZ2V0IHVybFwiKTtcbiAgICB2YXIgVmFsaWRVcmxPYmplY3QgPSB0aGlzLnZhbGlkYXRlQ29tbWFuZHMoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIENvbW1hbmQ6IENvbW1hbmRWYWx1ZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgIGxvZyhcInVybCBpcyBub3QgdmFsaWRcIik7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICBsb2coXCJ1cmwgaXMgdmFsaWRcIilcbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNHaXQpIHtcbiAgICAgIGxvZyhcImlzIEdpdCAuLlwiKVxuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgbG9nIChcIm5vdCBnaXRcIik7XG4gICAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdCh7XG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIFVVcmw6IFZhbGlkVXJsT2JqZWN0LlVybCxcbiAgICAgICAgVUJvZHk6IFZhbGlkVXJsT2JqZWN0LkJvZHksXG4gICAgICAgIFVNZXRob2Q6IFZhbGlkVXJsT2JqZWN0Lk1ldGhvZCxcbiAgICAgICAgVVR5cGU6VmFsaWRVcmxPYmplY3QuVXJsVHlwZVxuICAgICAgfSk7XG4gICAgfVxuXG5cbiAgfSxcblxuICAvL2dpdmVuLCBwaXBlbGluZSBuYW1lLCByZXR1cm4gcGlwZWxpbmUgaWRcbiAgZ2V0UGlwZWxpbmVJZChQaXBlbGluZU5hbWUpe1xuICAgIGxvZyhQaXBlbGluZU5hbWUpXG4gICAgdmFyIFBpcGVsaW5lSWQ7XG5cbiAgICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9O1xuICAgIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAudGhlbihmdW5jdGlvbiAoZGF0YSl7XG4gICAgICBcbiAgICAgIGxvZyhkYXRhKVxuICAgICAgZm9yICh2YXIgaSA9MDsgaTxkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKyl7XG4gICAgICAgIGlmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpe1xuICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIrZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgIHJldHVybiBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiK2VycilcbiAgICAgIHJldHVybiBlcnI7ICAgIFxuICAgIH0pIFxuICB9LFxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIitVc2VyQ29tbWFuZCk7XG4gICAgXG4gICAgdmFyIFZhbGlkQ29tbWFuZHMgPSBbJ0BzY3J1bWJvdCcsICcvcmVwbycsICcvaXNzdWUnLCAnL2VwaWMnLCAnL2Jsb2NrZWQnXTtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIFZhbGlkQ29tbWFkUmVnZXggPSBuZXcgUmVnRXhwKC9eKEBzY3J1bWJvdClcXHNbXFwvQS1aYS16XSovKTtcbiAgICBjb25zb2xlLmxvZyhcInByb2Nlc3NpbmcgbWVzc2FnZSA6IFwiK1VzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKXtcbiAgICAgIGxvZyhcIkVycm9yIG5vdCBzdGFydGluZyB3aXRoIEBzY3J1bWJvdFwiKVxuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgICAgXG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgLy9pZiAvcmVwbyBjb21lcyBhZnRlciBAc2NydW1ib3QsIG5vIHJlcG8gaWQgcHJvdmlkZWQgZWxzZSB0YWtlIHdoYXRldmVyIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCBhcyByZXBvX2lkXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09IFZhbGlkQ29tbWFuZHNbMV0pe1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzJdO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgXG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuICAgIGxvZyhcIkZpbmFsIENvbW1hbmQgOiBcIitGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKXtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyAoXCJmaXJzdGx5IGluaXRpYWxpc2lpbmcgcmVwb19pZCBhcyBcIityZXBvX2lkICtcIiBmcm9tIG1lc3NhZ2UgYXJnIGF0IHBvcyAxID0gXCIrQ29tbWFuZEFyclsxXSk7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBcbiAgICBsb2coXCJyZXBvIGlkIDIgOiBcIityZXBvX2lkKTsgICAgXG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgcmV0dXJuIEZpbmFsQ29tbWFuZDtcbiAgfSxcblxuICB2YWxpZGF0ZUNvbW1hbmRzOiBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gICAgbG9nKFwidmFsaWRhdGVDb21tYW5kc1wiKTtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuQ29tbWFuZDtcbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsXG4gICAgfTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgSXNzdWVSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvaXNzdWVdKlxcc1swLTldKlxcc1swLTldKlxccygtdXxidWd8cGlwZWxpbmV8LXB8ZXZlbnRzfC1lKS8pO1xuICAgIHZhciBFcGljUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2VwaWNdKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBCbG9ja2VkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvYmxvY2tlZC8pO1xuXG4gICAgaWYgKFJlcG9SZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldFJlcG9VcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpO1xuXG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoQmxvY2tlZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0QmxvY2tVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoSXNzdWVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKEVwaWNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEVwaWNVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBsb2coXCJVcmxPYmplY3QgPSBcIitVcmxPYmplY3QpO1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgfSxcblxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBsb2coXCJtYWtlUmVxdWVzdFwiKTtcbiAgICBsb2cob3B0aW9ucy5VQm9keSlcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVG9rZW4gPSBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU47XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuemVuaHViLmlvLyc7XG5cbiAgICB2YXIgVXNlclVybCA9IG9wdGlvbnMuVVVybDtcbiAgICB2YXIgVXJsQm9keSA9IG9wdGlvbnMuVUJvZHk7XG4gICAgdmFyIFVybEJvZHk7XG4gIFxuICAgIGlmKG9wdGlvbnMuVUJvZHkgPT0gbnVsbCl7XG4gICAgICBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keTtcbiAgICAgIFxuICAgIH1lbHNle1xuICAgICAgVXJsQm9keSA9IG9wdGlvbnMuVUJvZHkuZXN0aW1hdGU7ICAgICAgICAgICAgXG5cbiAgICB9XG4gIFxuICAgIHZhciBVTWV0aG9kID0gb3B0aW9ucy5VTWV0aG9kO1xuICAgIHZhciBVcmxUeXBlID0gb3B0aW9ucy5VVHlwZTtcbiAgICBcbiAgICBsb2coXCJCb2R5IDogXCIrSlNPTi5zdHJpbmdpZnkoVXJsQm9keSkpO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICBtZXRob2Q6IFVNZXRob2QsXG4gICAgICB1cmk6IE1haW5VcmwgKyBVc2VyVXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgICAgICAsXG4gICAgICAgIFxuICAgICAgYm9keToge1xuICAgICAgICBlc3RpbWF0ZTogVXJsQm9keVxuICAgICAgICAvL1VybEJvZHlcblxuICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIERhdGEgPSBzdWNjZXNzZGF0YTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvbGxvd2luZyBEYXRhID0nICsgSlNPTi5zdHJpbmdpZnkoRGF0YSkpO1xuXG4gICAgICAgIC8vUGFyc2UgSlNPTiBhY2NvcmRpbmcgdG8gb2JqIHJldHVybmVkXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdJc3N1ZUV2ZW50cycpe1xuICAgICAgICAgIGxvZyhcIkV2ZW50cyBmb3IgaXNzdWVcIik7XG4gICAgICAgICAgRGF0YSA9IFwiKkhlcmUgYXJlIHRoZSBtb3N0IHJlY2VudCBldmVudHMgcmVnYXJkaW5nIHlvdXIgaXNzdWU6KiBgYGBcIjtcblxuICAgICAgICAgIGZvciAodmFyIGkgPTA7IGk8c3VjY2Vzc2RhdGEubGVuZ3RoOyBpKyspe1xuXG4gICAgICAgICAgICBpZihzdWNjZXNzZGF0YVtpXS50eXBlID09PSAndHJhbnNmZXJJc3N1ZScpe1xuICAgICAgICAgICAgICBsb2coXCJwaXBlbGluZSBtb3ZlIGV2ZW50XCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUpK3N1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUpO1xuICAgICAgICAgICAgICBEYXRhICs9IFwiXFxcbiAgICAgICAgICAgICAgKlVzZXIgXCIgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQrIFwiKiBfbW92ZWRfIHRoaXMgaXNzdWUgZnJvbSBcIitzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lLm5hbWUrXCIgdG8gXCIrc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUubmFtZStcIiBvbiBkYXRlIDogXCIrZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG4gIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ2VzdGltYXRlSXNzdWUnKXtcbiAgICAgICAgICAgICAgbG9nKFwiZXN0aW1hdGUgY2hhbmdlIGV2ZW50IFwiK2kpO1xuICAgICAgICAgICAgICBEYXRhICs9IFwiXFxcbiAgICAgICAgICAgICAgKlVzZXIgXCIgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQrIFwiKiBfY2hhbmdlZCBlc3RpbWF0ZV8gb24gdGhpcyBpc3N1ZSB0byAgXCIrc3VjY2Vzc2RhdGFbaV0udG9fZXN0aW1hdGUudmFsdWUrXCIgb24gZGF0ZSA6IFwiK2RhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuICBcbiAgICAgICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgICAgbG9nKFwiZG8gbm90IHJlY29naXNlIGV2ZW50IHR5cGVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICB9XG4gICAgICAgICAgRGF0YSArPSBcIiBgYGBcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdHZXRQaXBlbGluZScpe1xuXG4gICAgICAgICAgRGF0YSA9IFwiIFwiO1xuICAgICAgICAgIERhdGEgKz0gXCJUaGF0IGlzc3VlIGlzIGN1cnJlbnRseSBpbiBcIitzdWNjZXNzZGF0YS5waXBlbGluZS5uYW1lK1wiIHBpcGVsaW5lLlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0lzc3VlRXN0aW1hdGUnKXtcbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIllvdXIgSXNzdWUncyBlc3RpbWF0ZSBoYXMgYmVlbiB1cGRhdGVkIHRvIFwiK3N1Y2Nlc3NkYXRhLmVzdGltYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0VwaWNJc3N1ZXMnKXtcbiAgICAgICAgICBcbiAgICAgICAgICBEYXRhID0gXCJUaGUgZm9sbG93aW5nIEVwaWNzIGFyZSBpbiB5b3VyIHNjcnVtYm9hcmQ6IFwiO1xuICAgICAgICAgIGZvciAodmFyIGkgPTA7IGk8c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgRGF0YSArPSBcIiAgXFxcbiAgICAgICAgICAgICpcIisoaSsxKStcIiogRXBpYyBJRDogXCIrc3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfbnVtYmVyK1wiIFVybCA6IFwiK3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX3VybCtcIiBcIitvcy5FT0w7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KERhdGEpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyBmb2xsb3dpbmcgZXJyb3IgPScgKyBlcnIpO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfSk7XG5cbiAgfSxcblxuXG4gIC8vIFRvIEdldCBSZXBvc2l0b3J5IElkXG4gIGdldFJlc3Bvc2l0b3J5SWQ6IGZ1bmN0aW9uIChPcHRpb25zKSB7XG4gICAgbG9nKFwiZ2V0UmVwb3NpdG9yeUlkXCIpO1xuICAgIHZhciByZXMgPSBPcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciByZXEgPSBPcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gT3B0aW9ucy5yZXBvTmFtZTtcbiAgICB2YXIgT3duZXJuYW1lID0gT3B0aW9ucy5HaXRPd25lck5hbWU7XG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIC8vYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgUmVwb0lkID0gc3VjY2Vzc2RhdGEuaWQ7XG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc2RhdGEpO1xuICAgICAgICByZXR1cm4gXCJUaGUgKlJlcG9zaXRvcnkgSWQqIGZvciBfXCIrUmVwb3NpdG9yeU5hbWUrXCJfIGlzIFwiK0pTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhLmlkKStcIiBWaWV3IHJlcG8gYXQgOiBcIitzdWNjZXNzZGF0YS5odG1sX3VybDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBsb2coXCJBUEkgY2FsbCBmYWlsZWQuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICB9KTtcblxuICB9LFxuXG4gIC8vIFRvIEdldCBSZXBvIFVybFxuICBnZXRSZXBvVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpIHtcblxuICAgIGxvZyhcImdldFJlcG9VcmxcIik7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgR2l0T3duZXJOYW1lID0gJ3gwMDA2Njk0OSc7XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9ICdyZXBvcy8nICsgR2l0T3duZXJOYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogUmVwb3NpdG9yeUlkLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogdHJ1ZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IElzc3VlIHJlbGF0ZWQgVXJsXG4gIGdldElzc3VlVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldElzc3VlVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIC8vVG8gR2V0IFN0YXRlIG9mIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzcGlwZWxpbmUvKTtcblxuICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiK0lzc3VlTm8pO1xuICAgICAgdmFyIFBpcGVMaW5ldXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFBpcGVMaW5ldXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6J0dldFBpcGVsaW5lJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cbiAgICBcbiAgICAvLyBNb3ZlIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICBpZiAoUGlwZWxpbmVNb3ZlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgLy9pZiBtb3ZpbmcgcGlwZWxpbmUsIDNyZCBhcmcgaXMgaXNzdWUgbnVtLCAgNHRoID0gLXAsIDV0aCA9IHBpcGVsaW5lLCA2dCBwb3NpdGlvblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgdmFyIFBpcGVMaW5lSWQgPSB0aGlzLmdldFBpcGVsaW5lSWQoQ29tbWFuZEFycls1XSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuXG4gICAgICAgICAgbG9nKFwiUGlwZWxpbmUgZ290ICh1c2luZyBkYXRhKTogXCIrIGRhdGEpO1xuICAgICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNl18MDtcbiAgICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgICAgICAgICBsb2coXCJidWlsZGluZyBtb3ZlIHBpcGVsaW5lIHVybC4uXCIpXG5cbiAgICAgICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgICAgICBwaXBlbGluZV9pZDogZGF0YSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgICAgVXJsOiBNb3ZlSXNzdWVQaXBlTGluZSxcbiAgICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgICBVcmxUeXBlOidJc3N1ZVRvUGlwZWxpbmVzJ1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBsb2coXCJ1cmwgYnVpbHQuXCIpO1xuICAgICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgICAgICAgfSk7IFxuICAgICAgfVxuXG4gICAgIFxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIGxvZyhcImlzc3VlIG5vIGV2ZW50c3JlZ2V4IFwiK0lzc3VlTm8pO1xuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXZlbnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIFxuICAgICAgLy8gU2V0IHRoZSBlc3RpbWF0ZSBmb3IgdGhlIGlzc3VlLlxuICAgICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIHZhciBFc3RpbWF0ZVZhbCA9IENvbW1hbmRBcnJbNF07XG4gICAgICAgIGxvZyhcIkVzdGltYXRlVmFsIDogXCIrRXN0aW1hdGVWYWwpXG4gICAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBcImVzdGltYXRlXCI6IEVzdGltYXRlVmFsXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogU2V0RXN0aW1hdGUsXG4gICAgICAgICAgTWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonSXNzdWVFc3RpbWF0ZSdcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgdmFyIEJ1Z1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBCdWdVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidCdWdJc3N1ZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXIsIHVzZXJJc3N1ZVxuICAgICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIFVzZXJVcmwgPSAnJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBVc2VyVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonVXNlcklzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH0sXG5cblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0QmxvY2tVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBCbG9ja3VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEJsb2NrdXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOidCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0RXBpY1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkIDogdHJ1ZSxcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTonRXBpY0lzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfVxuXG59O1xuIl19