/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/var request = _interopRequireWildcard(_request);

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
      FinalMessage = {
        Type: 'Error',
        Message: 'Invalid Commands'
      };
      return FinalMessage.Message;
    }

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
      log("view obj" + ValidUrlObject);
      console.dir(ValidUrlObject, { depth: null });
      return this.makeRequest({
        response: res,
        UUrl: ValidUrlObject.Url,
        UBody: ValidUrlObject.Body,
        UMethod: ValidUrlObject.Method,
        UType: ValidUrlObject.UrlType
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

    if (EpicRegex.test(UserCommand)) return UrlObject = this.getEpicUrl(UserCommand, CommandArr, RepoId);else {
      return UrlObject = {
        IsValid: true,
        Url: 'wrongCommand',
        Method: 'GET',
        Body: null
      };
    }
    console.dir(UrlObject, { depth: null });
    return UrlObject;
  },

  makeRequest: function /*istanbul ignore next*/makeRequest(options) {
    log("makeRequest");
    log(options.UBody);
    var res = options.response;
    var Token = process.env.ZENHUB_TOKEN;
    var MainUrl = 'https://api.zenhub.io/';

    var UserUrl = options.UUrl;
    var body;

    if (options.UBody == null) {
      body = { key: 'value' };
    } else {
      body = options.UBody;
    }

    var UMethod = options.UMethod;
    var UrlType = options.UType;
    log("urltype : " + UrlType);

    console.dir('Urlbody: ' + body, { depth: null });

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

      , body: body
    };

    console.dir(UrlOptions, { depth: null });
    if (UserUrl === 'wrongCommand') {
      log(UserUrl);
      return rp({
        uri: 'api.github.com',

        headers: {
          'User-Agent': 'simple_rest_app'
        },
        qs: {
          client_id: process.env.GIT_CLIENT_ID,
          client_secret: process.env.GIT_CLIENT_SECRET
        },
        json: true
      }).then(function (successdata) {
        var errMessage = 'Wrong Command';
        return errMessage;
      });
    }
    return rp(UrlOptions).then(function (successdata) {
      var Data = successdata;
      console.log('Following Data =' + JSON.stringify(Data));

      //Parse JSON according to obj returned
      if (UrlType === 'IssueEvents') {
        log("Events for issue");
        Data = '\n    *Here are the most recent events regarding your issue:* ';

        for (var i = 0; i < successdata.length; i++) {

          if (successdata[i].type === 'transferIssue') {
            log("pipeline move event" + JSON.stringify(successdata[i].to_pipeline) + successdata[i].from_pipeline);
            Data += '\n*User ' + successdata[i].user_id + '* _moved_ this issue from ' + successdata[i].from_pipeline.name + ' to ' + successdata[i].to_pipeline.name + ' on date : ' + dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
          } else if (successdata[i].type === 'estimateIssue') {
            log("estimate change event " + i);
            Data += '\n *User ' + successdata[i].user_id + '* _changed estimate_ on this issue to  ' + successdata[i].to_estimate.value + ' on date : ' + dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
          } else {
            Data += "Do not recognize event type";
            log("do not recogise event type");
          }
        }
        Data += " ";
      } else if (UrlType === 'GetPipeline') {

        Data = " ";
        Data += "That issue is currently in " + successdata.pipeline.name + " pipeline.";
      } else if (UrlType === 'IssueEstimate') {
        Data = '';
        Data += 'Your Issue\'s estimate has been updated to ' + successdata.estimate;
      } else if (UrlType === 'EpicIssues') {

        Data = "The following Epics are in your scrumboard: ";
        for (var i = 0; i < successdata.epic_issues.length; i++) {
          Data += /*istanbul ignore next*/'\n Epic ID:  ' + successdata.epic_issues[i].issue_number + ' Url : ' + successdata.epic_issues[i].issue_url + ' ';
        }
      } else if (UrlType === 'IssueToPipelines') {
        Data = "";
        Data += 'Sucessfully Moved Issue';
      } else {
        Data = "Command parameters not accepted";
      }
      log("Success Data : " + Data);
      return Data;
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
    log(RepositoryName);

    var UrlOptions = {
      uri: MainUrl + RepositoryUrl,
      qs: {},
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response
    };

    return rp(UrlOptions).then(function (successdata) {
      var RepoId = successdata.id;

      repo_id = RepoId;
      console.log(successdata);
      return "The *Repository Id* for _" + RepositoryName + "_ is " + JSON.stringify(successdata.id) + " *repo link* : " + successdata.html_url;
    }).catch(function (err) {
      var Error = err;
      // API call failed...
      log("API call failed...");
      console.log('User has %d repos', err);
      return "No repository with name : " + RepositoryName + " exists";
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

      var pipe_id = CommandArr[4];

      //if moving pipeline, 3rd arg is issue num,  4th = -p, 5th = pipeline, 6t position
      var IssueNo = CommandArr[2];

      log("Pipeline got (using pipe_id): " + pipe_id);
      var PosNo = CommandArr[5] | 0;
      var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';
      log("building move pipeline url..");

      var MoveBody = {
        pipeline_id: pipe_id,
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
        estimate: EstimateVal
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
  },

  //given, pipeline name, return pipeline id
  getPipelineId: function /*istanbul ignore next*/getPipelineId(PipelineName) {
    log("entered name : " + PipelineName);
    //var PipelineId;
    var pipelineIdRequest = {
      uri: 'https://api.zenhub.io/p1/repositories/' + repo_id + '/board',

      headers: {
        'X-Authentication-Token': process.env.ZENHUB_TOKEN
      },

      json: true
    };
    rp(pipelineIdRequest).then(function (data) {

      log(data);
      for (var i = 0; i < data['pipelines'].length; i++) {
        log("checking");
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
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsIm9zIiwibG9nIiwicmVwb19pZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjYWxsTWUiLCJvcHRpb25zIiwicmVxIiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiYm9keSIsImtleSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJ1cmkiLCJxcyIsImFjY2Vzc190b2tlbiIsImhlYWRlcnMiLCJqc29uIiwiY2xpZW50X2lkIiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsInRoZW4iLCJzdWNjZXNzZGF0YSIsImVyck1lc3NhZ2UiLCJEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsImkiLCJsZW5ndGgiLCJ0eXBlIiwidG9fcGlwZWxpbmUiLCJmcm9tX3BpcGVsaW5lIiwidXNlcl9pZCIsIm5hbWUiLCJjcmVhdGVkX2F0IiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsInBpcGVsaW5lIiwiZXN0aW1hdGUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsImNhdGNoIiwiZXJyIiwiRXJyb3IiLCJSZXBvc2l0b3J5TmFtZSIsIk93bmVybmFtZSIsIlJlcG9zaXRvcnlVcmwiLCJpZCIsImh0bWxfdXJsIiwiUmVzcG9zaXRyb3lJZCIsIlBpcGVsaW5lUmVnZXgiLCJJc3N1ZU5vIiwiUGlwZUxpbmV1cmwiLCJQaXBlbGluZU1vdmVSZWdleCIsInBpcGVfaWQiLCJQb3NObyIsIk1vdmVJc3N1ZVBpcGVMaW5lIiwiTW92ZUJvZHkiLCJwaXBlbGluZV9pZCIsInBvc2l0aW9uIiwiRXZlbnRzUmVnZXgiLCJFdmVudHNVcmwiLCJFc3RpbWF0ZUFkZFJlZ2V4IiwiRXN0aW1hdGVWYWwiLCJTZXRFc3RpbWF0ZSIsIkJ1Z1JlZ2V4IiwiQnVnVXJsIiwiVXNlclJlZ2V4IiwiQmxvY2t1cmwiLCJFcGljVXJsIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsInBpcGVsaW5lSWRSZXF1ZXN0IiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7NEJBQVlBLE87O0FBUVo7Ozs7Ozs7O0FBUEEs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LFdBQU9RLFNBQVA7QUFDRCxHQXZvQmM7O0FBeW9CZjtBQUNBNkUsaUJBQWUsK0NBQVVDLFlBQVYsRUFBd0I7QUFDckMxSSxRQUFJLG9CQUFvQjBJLFlBQXhCO0FBQ0E7QUFDQSxRQUFJQyxvQkFBb0I7QUFDdEI3RCxXQUFLLDJDQUEyQzdFLE9BQTNDLEdBQXFELFFBRHBDOztBQUd0QmdGLGVBQVM7QUFDUCxrQ0FBMEJaLFFBQVFDLEdBQVIsQ0FBWUM7QUFEL0IsT0FIYTs7QUFPdEJXLFlBQU07QUFQZ0IsS0FBeEI7QUFTQXRGLE9BQUcrSSxpQkFBSCxFQUNHcEQsSUFESCxDQUNRLFVBQUNxRCxJQUFELEVBQVU7O0FBRWQ1SSxVQUFJNEksSUFBSjtBQUNBLFdBQUssSUFBSS9DLElBQUksQ0FBYixFQUFnQkEsSUFBSStDLEtBQUssV0FBTCxFQUFrQjlDLE1BQXRDLEVBQThDRCxHQUE5QyxFQUFtRDtBQUNqRDdGLFlBQUksVUFBSjtBQUNBLFlBQUk0SSxLQUFLLFdBQUwsRUFBa0IvQyxDQUFsQixFQUFxQk0sSUFBckIsS0FBOEJ1QyxZQUFsQyxFQUFnRDtBQUM5QzFJLGNBQUkseUJBQXlCNEksS0FBSyxXQUFMLEVBQWtCL0MsQ0FBbEIsRUFBcUJxQixFQUFsRDtBQUNBLGlCQUFPMEIsS0FBSyxXQUFMLEVBQWtCL0MsQ0FBbEIsRUFBcUJxQixFQUE1QjtBQUNEO0FBQ0Y7O0FBRURsSCxVQUFJLDRDQUFKO0FBQ0QsS0FiSCxFQWNHNEcsS0FkSCxDQWNTLFVBQUNDLEdBQUQsRUFBUztBQUNkcEUsY0FBUXpDLEdBQVIsQ0FBWSxhQUFhNkcsR0FBekI7QUFDQSxhQUFPQSxHQUFQO0FBQ0QsS0FqQkg7QUFtQkQ7O0FBenFCYyxDQUFqQiIsImZpbGUiOiJzY3J1bV9ib2FyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG52YXIgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICB2YXIgRmluYWxNZXNzYWdlID0gbnVsbDtcblxuICAgIHZhciBDaGVja0lmVmFsaWRDb21tYW5kID0gdGhpcy5jaGVja1ZhbGlkSW5wdXQoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIFVDb21tYW5kOiBVc2VyQ29tbWFuZFxuICAgIH0pO1xuXG4gICAgaWYgKCFDaGVja0lmVmFsaWRDb21tYW5kKSB7XG4gICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kVmFsdWUgPSB0aGlzLmdldENvbW1hbmQoVXNlckNvbW1hbmQpO1xuXG4gICAgbG9nKFwiY29tbWFuZCB2YWwgOiBcIiArIENvbW1hbmRWYWx1ZSk7XG5cbiAgICBpZiAoQ29tbWFuZFZhbHVlID09PSAnJyB8fCBDb21tYW5kVmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIENvbW1hbmRWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGxvZyhcInJlcG8gaWQgMSA6IFwiICsgcmVwb19pZCk7XG5cbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gcmVwb19pZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuXG4gICAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0vKTtcblxuICAgICAgaWYgKCFSZXBvUmVnZXgudGVzdChDb21tYW5kVmFsdWUpKSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiICsgUmVwb0lkKTtcblxuICAgICAgICBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBNZXNzYWdlOiAnU3VjY2VzcycsXG4gICAgICAgICAgT3B0aW9uczoge1xuICAgICAgICAgICAgUmVzcG9zaXRvcnlJZDogUmVwb0lkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOiAneDAwMDY2OTQ5J1xuXG4gICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgbG9nKFwiZ2V0IHVybFwiKTtcbiAgICB2YXIgVmFsaWRVcmxPYmplY3QgPSB0aGlzLnZhbGlkYXRlQ29tbWFuZHMoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIENvbW1hbmQ6IENvbW1hbmRWYWx1ZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgQ29tbWFuZHMnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzR2l0KSB7XG4gICAgICBsb2coXCJpcyBHaXQgLi5cIilcbiAgICAgIHZhciBVQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgICAgdmFyIEdpdFJlcG9OYW1lID0gVUNvbW1hbmRBcnJbMV07XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBHaXRSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOiAneDAwMDY2OTQ5J1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBsb2coXCJub3QgZ2l0XCIpO1xuICAgICAgbG9nKFwidmlldyBvYmpcIiArIFZhbGlkVXJsT2JqZWN0KVxuICAgICAgY29uc29sZS5kaXIoVmFsaWRVcmxPYmplY3QsIHsgZGVwdGg6IG51bGwgfSlcbiAgICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgVVVybDogVmFsaWRVcmxPYmplY3QuVXJsLFxuICAgICAgICBVQm9keTogVmFsaWRVcmxPYmplY3QuQm9keSxcbiAgICAgICAgVU1ldGhvZDogVmFsaWRVcmxPYmplY3QuTWV0aG9kLFxuICAgICAgICBVVHlwZTogVmFsaWRVcmxPYmplY3QuVXJsVHlwZVxuICAgICAgfSk7XG4gICAgfVxuXG5cbiAgfSxcblxuICBjaGVja1ZhbGlkSW5wdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVmFsaWRCaXQgPSBmYWxzZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVDb21tYW5kO1xuICAgIGNvbnNvbGUubG9nKFwidXNlciBjb21tYW5kIDogXCIgKyBVc2VyQ29tbWFuZCk7XG5cbiAgICB2YXIgVmFsaWRDb21tYW5kcyA9IFsnQHNjcnVtYm90JywgJy9yZXBvJywgJy9pc3N1ZScsICcvZXBpYycsICcvYmxvY2tlZCddO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgVmFsaWRDb21tYWRSZWdleCA9IG5ldyBSZWdFeHAoL14oQHNjcnVtYm90KVxcc1tcXC9BLVphLXpdKi8pO1xuICAgIGNvbnNvbGUubG9nKFwicHJvY2Vzc2luZyBtZXNzYWdlIDogXCIgKyBVc2VyQ29tbWFuZCk7XG5cblxuICAgIGlmICghVmFsaWRDb21tYWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuICAgICAgbG9nKFwiRXJyb3Igbm90IHN0YXJ0aW5nIHdpdGggQHNjcnVtYm90XCIpXG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG5cblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICAvL2lmIC9yZXBvIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCwgbm8gcmVwbyBpZCBwcm92aWRlZCBlbHNlIHRha2Ugd2hhdGV2ZXIgY29tZXMgYWZ0ZXIgQHNjcnVtYm90IGFzIHJlcG9faWRcbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gVmFsaWRDb21tYW5kc1sxXSkge1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG5cbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG4gICAgbG9nKFwiRmluYWwgQ29tbWFuZCA6IFwiICsgRmluYWxDb21tYW5kKTtcblxuICAgIHJldHVybiBWYWxpZEJpdCA9IHRydWU7XG4gIH0sXG5cbiAgZ2V0Q29tbWFuZDogZnVuY3Rpb24gKFVDb21tYW5kKSB7XG4gICAgbG9nKFwiZ2V0Q29tbWFuZFwiKTtcbiAgICB2YXIgVmFsaWRCaXQgPSAnJztcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBVQ29tbWFuZDtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgdHlwZW9mIFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gJy9yZXBvJykge1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJmaXJzdGx5IGluaXRpYWxpc2lpbmcgcmVwb19pZCBhcyBcIiArIHJlcG9faWQgKyBcIiBmcm9tIG1lc3NhZ2UgYXJnIGF0IHBvcyAxID0gXCIgKyBDb21tYW5kQXJyWzFdKTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIGxvZyhcInJlcG8gaWQgMiA6IFwiICsgcmVwb19pZCk7XG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgcmV0dXJuIEZpbmFsQ29tbWFuZDtcbiAgfSxcblxuICB2YWxpZGF0ZUNvbW1hbmRzOiBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gICAgbG9nKFwidmFsaWRhdGVDb21tYW5kc1wiKTtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuQ29tbWFuZDtcbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGxcbiAgICB9O1xuXG4gICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBJc3N1ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9pc3N1ZV0qXFxzWzAtOV0qXFxzWzAtOV0qXFxzKC11fGJ1Z3xwaXBlbGluZXwtcHxldmVudHN8LWUpLyk7XG4gICAgdmFyIEVwaWNSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvZXBpY10qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIEJsb2NrZWRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9ibG9ja2VkLyk7XG5cbiAgICBpZiAoUmVwb1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0UmVwb1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycik7XG5cbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGlmIChCbG9ja2VkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRCbG9ja1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChJc3N1ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoRXBpY1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogJ3dyb25nQ29tbWFuZCcsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnNvbGUuZGlyKFVybE9iamVjdCwgeyBkZXB0aDogbnVsbCB9KTtcbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG5cbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgbG9nKFwibWFrZVJlcXVlc3RcIik7XG4gICAgbG9nKG9wdGlvbnMuVUJvZHkpXG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFRva2VuID0gcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby8nO1xuXG4gICAgdmFyIFVzZXJVcmwgPSBvcHRpb25zLlVVcmw7XG4gICAgdmFyIGJvZHk7XG5cbiAgICBpZiAob3B0aW9ucy5VQm9keSA9PSBudWxsKSB7XG4gICAgICBib2R5ID0geyBrZXk6ICd2YWx1ZScgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBib2R5ID0gb3B0aW9ucy5VQm9keTtcblxuICAgIH1cblxuICAgIHZhciBVTWV0aG9kID0gb3B0aW9ucy5VTWV0aG9kO1xuICAgIHZhciBVcmxUeXBlID0gb3B0aW9ucy5VVHlwZTtcbiAgICBsb2coXCJ1cmx0eXBlIDogXCIgKyBVcmxUeXBlKVxuXG4gICAgY29uc29sZS5kaXIoJ1VybGJvZHk6ICcgKyBib2R5LCB7IGRlcHRoOiBudWxsIH0pO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICBtZXRob2Q6IFVNZXRob2QsXG4gICAgICB1cmk6IE1haW5VcmwgKyBVc2VyVXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgICAgLCAgICAgIFxuICAgICAgYm9keVxuICAgIH07XG5cbiAgICBjb25zb2xlLmRpcihVcmxPcHRpb25zLCB7IGRlcHRoOiBudWxsIH0pO1xuICAgIGlmIChVc2VyVXJsID09PSAnd3JvbmdDb21tYW5kJykge1xuICAgICAgbG9nKFVzZXJVcmwpXG4gICAgICByZXR1cm4gcnAoe1xuICAgICAgICB1cmk6ICdhcGkuZ2l0aHViLmNvbScsXG5cbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgICAgIH0sXG4gICAgICAgIHFzOiB7XG4gICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgICAgIH0sXG4gICAgICAgIGpzb246IHRydWVcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBlcnJNZXNzYWdlID0gJ1dyb25nIENvbW1hbmQnO1xuICAgICAgICByZXR1cm4gZXJyTWVzc2FnZTtcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcblxuICAgICAgICAvL1BhcnNlIEpTT04gYWNjb3JkaW5nIHRvIG9iaiByZXR1cm5lZFxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0lzc3VlRXZlbnRzJykge1xuICAgICAgICAgIGxvZyhcIkV2ZW50cyBmb3IgaXNzdWVcIik7XG4gICAgICAgICAgRGF0YSA9ICdcXG4gICAgKkhlcmUgYXJlIHRoZSBtb3N0IHJlY2VudCBldmVudHMgcmVnYXJkaW5nIHlvdXIgaXNzdWU6KiAnO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzZGF0YS5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgICBpZiAoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ3RyYW5zZmVySXNzdWUnKSB7XG4gICAgICAgICAgICAgIGxvZyhcInBpcGVsaW5lIG1vdmUgZXZlbnRcIiArIEpTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhW2ldLnRvX3BpcGVsaW5lKSArIHN1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4qVXNlciAnICsgc3VjY2Vzc2RhdGFbaV0udXNlcl9pZCArICcqIF9tb3ZlZF8gdGhpcyBpc3N1ZSBmcm9tICcgKyBzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lLm5hbWUgKyAnIHRvICcgKyBzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZS5uYW1lICsgJyBvbiBkYXRlIDogJyArIGRhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdWNjZXNzZGF0YVtpXS50eXBlID09PSAnZXN0aW1hdGVJc3N1ZScpIHtcbiAgICAgICAgICAgICAgbG9nKFwiZXN0aW1hdGUgY2hhbmdlIGV2ZW50IFwiICsgaSk7XG4gICAgICAgICAgICAgIERhdGEgKz0gJ1xcbiAqVXNlciAnICsgc3VjY2Vzc2RhdGFbaV0udXNlcl9pZCArICcqIF9jaGFuZ2VkIGVzdGltYXRlXyBvbiB0aGlzIGlzc3VlIHRvICAnICsgc3VjY2Vzc2RhdGFbaV0udG9fZXN0aW1hdGUudmFsdWUgKyAnIG9uIGRhdGUgOiAnICsgZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIERhdGEgKz0gXCJEbyBub3QgcmVjb2duaXplIGV2ZW50IHR5cGVcIlxuICAgICAgICAgICAgICBsb2coXCJkbyBub3QgcmVjb2dpc2UgZXZlbnQgdHlwZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1cbiAgICAgICAgICBEYXRhICs9IFwiIFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoVXJsVHlwZSA9PT0gJ0dldFBpcGVsaW5lJykge1xuXG4gICAgICAgICAgRGF0YSA9IFwiIFwiO1xuICAgICAgICAgIERhdGEgKz0gXCJUaGF0IGlzc3VlIGlzIGN1cnJlbnRseSBpbiBcIiArIHN1Y2Nlc3NkYXRhLnBpcGVsaW5lLm5hbWUgKyBcIiBwaXBlbGluZS5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKFVybFR5cGUgPT09ICdJc3N1ZUVzdGltYXRlJykge1xuICAgICAgICAgIERhdGEgPSAnJztcbiAgICAgICAgICBEYXRhICs9ICdZb3VyIElzc3VlXFwncyBlc3RpbWF0ZSBoYXMgYmVlbiB1cGRhdGVkIHRvICcgKyBzdWNjZXNzZGF0YS5lc3RpbWF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKFVybFR5cGUgPT09ICdFcGljSXNzdWVzJykge1xuXG4gICAgICAgICAgRGF0YSA9IFwiVGhlIGZvbGxvd2luZyBFcGljcyBhcmUgaW4geW91ciBzY3J1bWJvYXJkOiBcIjtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBEYXRhICs9IGBcXG4gRXBpYyBJRDogICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfbnVtYmVyfSBVcmwgOiAke3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX3VybH0gYFxuXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoVXJsVHlwZSA9PT0gJ0lzc3VlVG9QaXBlbGluZXMnKSB7XG4gICAgICAgICAgRGF0YSA9IFwiXCI7XG4gICAgICAgICAgRGF0YSArPSAnU3VjZXNzZnVsbHkgTW92ZWQgSXNzdWUnXG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBEYXRhID0gXCJDb21tYW5kIHBhcmFtZXRlcnMgbm90IGFjY2VwdGVkXCI7XG4gICAgICAgIH1cbiAgICAgICAgbG9nKFwiU3VjY2VzcyBEYXRhIDogXCIgKyBEYXRhKVxuICAgICAgICByZXR1cm4gRGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgZm9sbG93aW5nIGVycm9yID0nICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH0pO1xuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuICAgIHZhciBSZXBvc2l0b3J5VXJsID0gJ3JlcG9zLycgKyBPd25lcm5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tLyc7XG4gICAgbG9nKFJlcG9zaXRvcnlOYW1lKVxuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICB1cmk6IE1haW5VcmwgKyBSZXBvc2l0b3J5VXJsLFxuICAgICAgcXM6IHtcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuXG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc2RhdGEpO1xuICAgICAgICByZXR1cm4gXCJUaGUgKlJlcG9zaXRvcnkgSWQqIGZvciBfXCIgKyBSZXBvc2l0b3J5TmFtZSArIFwiXyBpcyBcIiArIEpTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhLmlkKSArIFwiICpyZXBvIGxpbmsqIDogXCIgKyBzdWNjZXNzZGF0YS5odG1sX3VybDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBsb2coXCJBUEkgY2FsbCBmYWlsZWQuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICAgIHJldHVybiBcIk5vIHJlcG9zaXRvcnkgd2l0aCBuYW1lIDogXCIgKyBSZXBvc2l0b3J5TmFtZSArIFwiIGV4aXN0c1wiXG5cbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2VcbiAgICB9O1xuXG4gICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICB2YXIgUGlwZWxpbmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNwaXBlbGluZS8pO1xuXG4gICAgaWYgKFBpcGVsaW5lUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiaXNzdWUgTnVtIGluIGdldElTc3VlVXJsIDogXCIgKyBJc3N1ZU5vKTtcbiAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnR2V0UGlwZWxpbmUnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuXG4gICAgLy8gTW92ZSBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZU1vdmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtcFxcc1tBLVphLXowLTldKi8pO1xuXG5cbiAgICBpZiAoUGlwZWxpbmVNb3ZlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIHBpcGVfaWQgPSBDb21tYW5kQXJyWzRdO1xuXG4gICAgICAvL2lmIG1vdmluZyBwaXBlbGluZSwgM3JkIGFyZyBpcyBpc3N1ZSBudW0sICA0dGggPSAtcCwgNXRoID0gcGlwZWxpbmUsIDZ0IHBvc2l0aW9uXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG5cblxuICAgICAgbG9nKFwiUGlwZWxpbmUgZ290ICh1c2luZyBwaXBlX2lkKTogXCIgKyBwaXBlX2lkKTtcbiAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNV0gfCAwO1xuICAgICAgdmFyIE1vdmVJc3N1ZVBpcGVMaW5lID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3Zlcyc7XG4gICAgICBsb2coXCJidWlsZGluZyBtb3ZlIHBpcGVsaW5lIHVybC4uXCIpXG5cbiAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgcGlwZWxpbmVfaWQ6IHBpcGVfaWQsXG4gICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICB9O1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0lzc3VlVG9QaXBlbGluZXMnXG4gICAgICB9O1xuXG4gICAgICBsb2coXCJ1cmwgYnVpbHQuXCIpO1xuICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgIH1cblxuICAgIC8vIEdldCBldmVudHMgZm9yIHRoZSBJc3N1ZSBcbiAgICB2YXIgRXZlbnRzUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzZXZlbnRzLyk7XG5cbiAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiaXNzdWUgbm8gZXZlbnRzcmVnZXggXCIgKyBJc3N1ZU5vKTtcbiAgICAgIHZhciBFdmVudHNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2V2ZW50cyc7XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogRXZlbnRzVXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdJc3N1ZUV2ZW50cydcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG5cbiAgICAvLyBTZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgIGlmIChFc3RpbWF0ZUFkZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIHZhciBFc3RpbWF0ZVZhbCA9IENvbW1hbmRBcnJbNF07XG4gICAgICBsb2coXCJFc3RpbWF0ZVZhbCA6IFwiICsgRXN0aW1hdGVWYWwpXG4gICAgICB2YXIgU2V0RXN0aW1hdGUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2VzdGltYXRlJztcblxuICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICBlc3RpbWF0ZTogRXN0aW1hdGVWYWxcbiAgICAgIH07XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogU2V0RXN0aW1hdGUsXG4gICAgICAgIE1ldGhvZDogJ1BVVCcsXG4gICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdJc3N1ZUVzdGltYXRlJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cbiAgICAvLyBHZXQgQnVncyBieSB0aGUgdXNlclxuICAgIHZhciBCdWdSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNidWcvKTtcblxuICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnQnVnSXNzdWVzJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vVG8gR2V0IFVzZXIgSXNzdWUgYnkgdXNlciwgdXNlcklzc3VlXG4gICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgaWYgKFVzZXJSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgVXNlclVybCA9ICcnO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFVzZXJVcmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ1VzZXJJc3N1ZXMnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICBsb2coXCJnZXRCbG9ja1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEJsb2NrdXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogQmxvY2t1cmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6ICdCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICBsb2coXCJnZXRFcGljVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBFcGljVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvZXBpY3MnO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6ICdFcGljSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vZ2l2ZW4sIHBpcGVsaW5lIG5hbWUsIHJldHVybiBwaXBlbGluZSBpZFxuICBnZXRQaXBlbGluZUlkOiBmdW5jdGlvbiAoUGlwZWxpbmVOYW1lKSB7XG4gICAgbG9nKFwiZW50ZXJlZCBuYW1lIDogXCIgKyBQaXBlbGluZU5hbWUpXG4gICAgLy92YXIgUGlwZWxpbmVJZDtcbiAgICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9O1xuICAgIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGxvZyhcImNoZWNraW5nXCIpXG4gICAgICAgICAgaWYgKGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWUgPT09IFBpcGVsaW5lTmFtZSkge1xuICAgICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIiArIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiICsgZXJyKVxuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfSlcblxuICB9XG5cblxufTtcbiJdfQ==