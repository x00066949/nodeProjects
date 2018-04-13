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


      , //body: {
      body: body

      //}
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
    //console.dir(options,{depth:nll})

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsIm9zIiwibG9nIiwicmVwb19pZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjYWxsTWUiLCJvcHRpb25zIiwicmVxIiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiYm9keSIsImtleSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJ1cmkiLCJxcyIsImFjY2Vzc190b2tlbiIsImhlYWRlcnMiLCJqc29uIiwiY2xpZW50X2lkIiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsInRoZW4iLCJzdWNjZXNzZGF0YSIsImVyck1lc3NhZ2UiLCJEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsImkiLCJsZW5ndGgiLCJ0eXBlIiwidG9fcGlwZWxpbmUiLCJmcm9tX3BpcGVsaW5lIiwidXNlcl9pZCIsIm5hbWUiLCJjcmVhdGVkX2F0IiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsInBpcGVsaW5lIiwiZXN0aW1hdGUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsImNhdGNoIiwiZXJyIiwiRXJyb3IiLCJSZXBvc2l0b3J5TmFtZSIsIk93bmVybmFtZSIsIlJlcG9zaXRvcnlVcmwiLCJpZCIsImh0bWxfdXJsIiwiUmVzcG9zaXRyb3lJZCIsIlBpcGVsaW5lUmVnZXgiLCJJc3N1ZU5vIiwiUGlwZUxpbmV1cmwiLCJQaXBlbGluZU1vdmVSZWdleCIsInBpcGVfaWQiLCJQb3NObyIsIk1vdmVJc3N1ZVBpcGVMaW5lIiwiTW92ZUJvZHkiLCJwaXBlbGluZV9pZCIsInBvc2l0aW9uIiwiRXZlbnRzUmVnZXgiLCJFdmVudHNVcmwiLCJFc3RpbWF0ZUFkZFJlZ2V4IiwiRXN0aW1hdGVWYWwiLCJTZXRFc3RpbWF0ZSIsIkJ1Z1JlZ2V4IiwiQnVnVXJsIiwiVXNlclJlZ2V4IiwiQmxvY2t1cmwiLCJFcGljVXJsIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsInBpcGVsaW5lSWRSZXF1ZXN0IiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7NEJBQVlBLE87O0FBUVo7Ozs7Ozs7O0FBUEEs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LEtBTE87QUFNZGMsZUFBUztBQU5LLEtBQWhCOztBQVNBLFdBQU9RLFNBQVA7QUFDRCxHQS9vQmM7O0FBaXBCZjtBQUNBNkUsaUJBQWUsK0NBQVVDLFlBQVYsRUFBd0I7QUFDckMxSSxRQUFJLG9CQUFvQjBJLFlBQXhCO0FBQ0E7QUFDQSxRQUFJQyxvQkFBb0I7QUFDdEI3RCxXQUFLLDJDQUEyQzdFLE9BQTNDLEdBQXFELFFBRHBDOztBQUd0QmdGLGVBQVM7QUFDUCxrQ0FBMEJaLFFBQVFDLEdBQVIsQ0FBWUM7QUFEL0IsT0FIYTs7QUFPdEJXLFlBQU07QUFQZ0IsS0FBeEI7QUFTQXRGLE9BQUcrSSxpQkFBSCxFQUNHcEQsSUFESCxDQUNRLFVBQUNxRCxJQUFELEVBQVU7O0FBRWQ1SSxVQUFJNEksSUFBSjtBQUNBLFdBQUssSUFBSS9DLElBQUksQ0FBYixFQUFnQkEsSUFBSStDLEtBQUssV0FBTCxFQUFrQjlDLE1BQXRDLEVBQThDRCxHQUE5QyxFQUFtRDtBQUNqRDdGLFlBQUksVUFBSjtBQUNBLFlBQUk0SSxLQUFLLFdBQUwsRUFBa0IvQyxDQUFsQixFQUFxQk0sSUFBckIsS0FBOEJ1QyxZQUFsQyxFQUFnRDtBQUM5QzFJLGNBQUkseUJBQXlCNEksS0FBSyxXQUFMLEVBQWtCL0MsQ0FBbEIsRUFBcUJxQixFQUFsRDtBQUNBLGlCQUFPMEIsS0FBSyxXQUFMLEVBQWtCL0MsQ0FBbEIsRUFBcUJxQixFQUE1QjtBQUNEO0FBQ0Y7O0FBRURsSCxVQUFJLDRDQUFKO0FBQ0QsS0FiSCxFQWNHNEcsS0FkSCxDQWNTLFVBQUNDLEdBQUQsRUFBUztBQUNkcEUsY0FBUXpDLEdBQVIsQ0FBWSxhQUFhNkcsR0FBekI7QUFDQSxhQUFPQSxHQUFQO0FBQ0QsS0FqQkg7QUFtQkQ7O0FBanJCYyxDQUFqQiIsImZpbGUiOiJzY3J1bV9ib2FyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG52YXIgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICB2YXIgRmluYWxNZXNzYWdlID0gbnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRWYWx1ZSA9IHRoaXMuZ2V0Q29tbWFuZChVc2VyQ29tbWFuZCk7XG5cbiAgICBsb2coXCJjb21tYW5kIHZhbCA6IFwiICsgQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIgKyByZXBvX2lkKTtcblxuICAgIHZhciBSZXBvc2l0b3J5SWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKFJlcG9zaXRvcnlJZCA9PT0gbnVsbCB8fCBSZXBvc2l0b3J5SWQgPT09ICcnIHx8IHR5cGVvZiBSZXBvc2l0b3J5SWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsb2coXCJ0cnlpbmcgdG8gZ2V0IHJlcG8gaWRcIik7XG5cbiAgICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XS8pO1xuXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgTWVzc2FnZTogJ1JlcG9zaXRvcnkgSWQgTm90IFNwZWNpZmllZCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIFJlcG9JZCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVwb0lkICE9PSAnJyAmJiBSZXBvSWQgIT09IG51bGwpIHtcbiAgICAgICAgbG9nKFwicmVwbyBmb3VuZCBpZDogXCIgKyBSZXBvSWQpO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIE1lc3NhZ2U6ICdTdWNjZXNzJyxcbiAgICAgICAgICBPcHRpb25zOiB7XG4gICAgICAgICAgICBSZXNwb3NpdG9yeUlkOiBSZXBvSWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG5cbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNHaXQpIHtcbiAgICAgIGxvZyhcImlzIEdpdCAuLlwiKVxuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGxvZyhcIm5vdCBnaXRcIik7XG4gICAgICBsb2coXCJ2aWV3IG9ialwiICsgVmFsaWRVcmxPYmplY3QpXG4gICAgICBjb25zb2xlLmRpcihWYWxpZFVybE9iamVjdCwgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2QsXG4gICAgICAgIFVUeXBlOiBWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cblxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIC8vaWYgL3JlcG8gY29tZXMgYWZ0ZXIgQHNjcnVtYm90LCBubyByZXBvIGlkIHByb3ZpZGVkIGVsc2UgdGFrZSB3aGF0ZXZlciBjb21lcyBhZnRlciBAc2NydW1ib3QgYXMgcmVwb19pZFxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSBWYWxpZENvbW1hbmRzWzFdKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIgKyBGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiICsgcmVwb19pZCArIFwiIGZyb20gbWVzc2FnZSBhcmcgYXQgcG9zIDEgPSBcIiArIENvbW1hbmRBcnJbMV0pO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuXG4gICAgbG9nKFwicmVwbyBpZCAyIDogXCIgKyByZXBvX2lkKTtcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gRmluYWxDb21tYW5kO1xuICB9LFxuXG4gIHZhbGlkYXRlQ29tbWFuZHM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICBsb2coXCJ2YWxpZGF0ZUNvbW1hbmRzXCIpO1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Db21tYW5kO1xuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuICAgIGlmIChSZXBvUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKTtcblxuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKEJsb2NrZWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEJsb2NrVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKElzc3VlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiAnd3JvbmdDb21tYW5kJyxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbFxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc29sZS5kaXIoVXJsT2JqZWN0LCB7IGRlcHRoOiBudWxsIH0pO1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgfSxcblxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBsb2coXCJtYWtlUmVxdWVzdFwiKTtcbiAgICBsb2cob3B0aW9ucy5VQm9keSlcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVG9rZW4gPSBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU47XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuemVuaHViLmlvLyc7XG5cbiAgICB2YXIgVXNlclVybCA9IG9wdGlvbnMuVVVybDtcbiAgICB2YXIgYm9keTtcblxuICAgIGlmIChvcHRpb25zLlVCb2R5ID09IG51bGwpIHtcbiAgICAgIGJvZHkgPSB7IGtleTogJ3ZhbHVlJyB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkgPSBvcHRpb25zLlVCb2R5O1xuXG4gICAgfVxuXG4gICAgdmFyIFVNZXRob2QgPSBvcHRpb25zLlVNZXRob2Q7XG4gICAgdmFyIFVybFR5cGUgPSBvcHRpb25zLlVUeXBlO1xuICAgIGxvZyhcInVybHR5cGUgOiBcIiArIFVybFR5cGUpXG5cbiAgICBjb25zb2xlLmRpcignVXJsYm9keTogJyArIGJvZHksIHsgZGVwdGg6IG51bGwgfSk7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogVU1ldGhvZCxcbiAgICAgIHVyaTogTWFpblVybCArIFVzZXJVcmwsXG4gICAgICBxczoge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgICAsXG5cbiAgICAgIC8vYm9keToge1xuICAgICAgYm9keVxuXG4gICAgICAvL31cbiAgICB9O1xuXG4gICAgY29uc29sZS5kaXIoVXJsT3B0aW9ucywgeyBkZXB0aDogbnVsbCB9KTtcbiAgICBpZiAoVXNlclVybCA9PT0gJ3dyb25nQ29tbWFuZCcpIHtcbiAgICAgIGxvZyhVc2VyVXJsKVxuICAgICAgcmV0dXJuIHJwKHtcbiAgICAgICAgdXJpOiAnYXBpLmdpdGh1Yi5jb20nLFxuXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnVXNlci1BZ2VudCc6ICdzaW1wbGVfcmVzdF9hcHAnLFxuICAgICAgICB9LFxuICAgICAgICBxczoge1xuICAgICAgICAgIGNsaWVudF9pZDogcHJvY2Vzcy5lbnYuR0lUX0NMSUVOVF9JRCxcbiAgICAgICAgICBjbGllbnRfc2VjcmV0OiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX1NFQ1JFVFxuICAgICAgICB9LFxuICAgICAgICBqc29uOiB0cnVlXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgZXJyTWVzc2FnZSA9ICdXcm9uZyBDb21tYW5kJztcbiAgICAgICAgcmV0dXJuIGVyck1lc3NhZ2U7XG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgRGF0YSA9IHN1Y2Nlc3NkYXRhO1xuICAgICAgICBjb25zb2xlLmxvZygnRm9sbG93aW5nIERhdGEgPScgKyBKU09OLnN0cmluZ2lmeShEYXRhKSk7XG5cbiAgICAgICAgLy9QYXJzZSBKU09OIGFjY29yZGluZyB0byBvYmogcmV0dXJuZWRcbiAgICAgICAgaWYgKFVybFR5cGUgPT09ICdJc3N1ZUV2ZW50cycpIHtcbiAgICAgICAgICBsb2coXCJFdmVudHMgZm9yIGlzc3VlXCIpO1xuICAgICAgICAgIERhdGEgPSAnXFxuICAgICpIZXJlIGFyZSB0aGUgbW9zdCByZWNlbnQgZXZlbnRzIHJlZ2FyZGluZyB5b3VyIGlzc3VlOiogJztcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzc2RhdGEubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICd0cmFuc2Zlcklzc3VlJykge1xuICAgICAgICAgICAgICBsb2coXCJwaXBlbGluZSBtb3ZlIGV2ZW50XCIgKyBKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZSkgKyBzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lKTtcbiAgICAgICAgICAgICAgRGF0YSArPSAnXFxuKlVzZXIgJyArIHN1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQgKyAnKiBfbW92ZWRfIHRoaXMgaXNzdWUgZnJvbSAnICsgc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZS5uYW1lICsgJyB0byAnICsgc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUubmFtZSArICcgb24gZGF0ZSA6ICcgKyBkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ2VzdGltYXRlSXNzdWUnKSB7XG4gICAgICAgICAgICAgIGxvZyhcImVzdGltYXRlIGNoYW5nZSBldmVudCBcIiArIGkpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4gKlVzZXIgJyArIHN1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQgKyAnKiBfY2hhbmdlZCBlc3RpbWF0ZV8gb24gdGhpcyBpc3N1ZSB0byAgJyArIHN1Y2Nlc3NkYXRhW2ldLnRvX2VzdGltYXRlLnZhbHVlICsgJyBvbiBkYXRlIDogJyArIGRhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBEYXRhICs9IFwiRG8gbm90IHJlY29nbml6ZSBldmVudCB0eXBlXCJcbiAgICAgICAgICAgICAgbG9nKFwiZG8gbm90IHJlY29naXNlIGV2ZW50IHR5cGVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgICAgRGF0YSArPSBcIiBcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKFVybFR5cGUgPT09ICdHZXRQaXBlbGluZScpIHtcblxuICAgICAgICAgIERhdGEgPSBcIiBcIjtcbiAgICAgICAgICBEYXRhICs9IFwiVGhhdCBpc3N1ZSBpcyBjdXJyZW50bHkgaW4gXCIgKyBzdWNjZXNzZGF0YS5waXBlbGluZS5uYW1lICsgXCIgcGlwZWxpbmUuXCI7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChVcmxUeXBlID09PSAnSXNzdWVFc3RpbWF0ZScpIHtcbiAgICAgICAgICBEYXRhID0gJyc7XG4gICAgICAgICAgRGF0YSArPSAnWW91ciBJc3N1ZVxcJ3MgZXN0aW1hdGUgaGFzIGJlZW4gdXBkYXRlZCB0byAnICsgc3VjY2Vzc2RhdGEuZXN0aW1hdGU7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChVcmxUeXBlID09PSAnRXBpY0lzc3VlcycpIHtcblxuICAgICAgICAgIERhdGEgPSBcIlRoZSBmb2xsb3dpbmcgRXBpY3MgYXJlIGluIHlvdXIgc2NydW1ib2FyZDogXCI7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzZGF0YS5lcGljX2lzc3Vlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgRGF0YSArPSBgXFxuIEVwaWMgSUQ6ICAke3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX251bWJlcn0gVXJsIDogJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV91cmx9IGBcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKFVybFR5cGUgPT09ICdJc3N1ZVRvUGlwZWxpbmVzJykge1xuICAgICAgICAgIERhdGEgPSBcIlwiO1xuICAgICAgICAgIERhdGEgKz0gJ1N1Y2Vzc2Z1bGx5IE1vdmVkIElzc3VlJ1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgRGF0YSA9IFwiQ29tbWFuZCBwYXJhbWV0ZXJzIG5vdCBhY2NlcHRlZFwiO1xuICAgICAgICB9XG4gICAgICAgIGxvZyhcIlN1Y2Nlc3MgRGF0YSA6IFwiICsgRGF0YSlcbiAgICAgICAgcmV0dXJuIERhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzIGZvbGxvd2luZyBlcnJvciA9JyArIGVycik7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9KTtcblxuICB9LFxuXG5cbiAgLy8gVG8gR2V0IFJlcG9zaXRvcnkgSWRcbiAgZ2V0UmVzcG9zaXRvcnlJZDogZnVuY3Rpb24gKE9wdGlvbnMpIHtcbiAgICBsb2coXCJnZXRSZXBvc2l0b3J5SWRcIik7XG4gICAgdmFyIHJlcyA9IE9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHJlcSA9IE9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBPcHRpb25zLnJlcG9OYW1lO1xuICAgIHZhciBPd25lcm5hbWUgPSBPcHRpb25zLkdpdE93bmVyTmFtZTtcbiAgICB2YXIgUmVwb3NpdG9yeVVybCA9ICdyZXBvcy8nICsgT3duZXJuYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nO1xuICAgIGxvZyhSZXBvc2l0b3J5TmFtZSlcbiAgICAvL2NvbnNvbGUuZGlyKG9wdGlvbnMse2RlcHRoOm5sbH0pXG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIHVyaTogTWFpblVybCArIFJlcG9zaXRvcnlVcmwsXG4gICAgICBxczoge1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgUmVwb0lkID0gc3VjY2Vzc2RhdGEuaWQ7XG5cblxuICAgICAgICByZXBvX2lkID0gUmVwb0lkO1xuICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzZGF0YSk7XG4gICAgICAgIHJldHVybiBcIlRoZSAqUmVwb3NpdG9yeSBJZCogZm9yIF9cIiArIFJlcG9zaXRvcnlOYW1lICsgXCJfIGlzIFwiICsgSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGEuaWQpICsgXCIgKnJlcG8gbGluayogOiBcIiArIHN1Y2Nlc3NkYXRhLmh0bWxfdXJsO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGxvZyhcIkFQSSBjYWxsIGZhaWxlZC4uLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgICAgcmV0dXJuIFwiTm8gcmVwb3NpdG9yeSB3aXRoIG5hbWUgOiBcIiArIFJlcG9zaXRvcnlOYW1lICsgXCIgZXhpc3RzXCJcblxuICAgICAgfSk7XG5cbiAgfSxcblxuICAvLyBUbyBHZXQgUmVwbyBVcmxcbiAgZ2V0UmVwb1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKSB7XG5cbiAgICBsb2coXCJnZXRSZXBvVXJsXCIpO1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEdpdE93bmVyTmFtZSA9ICd4MDAwNjY5NDknO1xuICAgIHZhciBSZXBvc2l0b3J5SWQgPSAncmVwb3MvJyArIEdpdE93bmVyTmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IFJlcG9zaXRvcnlJZCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IHRydWVcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuICAvL1RvIEdldCBJc3N1ZSByZWxhdGVkIFVybFxuICBnZXRJc3N1ZVVybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRJc3N1ZVVybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZVxuICAgIH07XG5cbiAgICAvL1RvIEdldCBTdGF0ZSBvZiBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICBpZiAoUGlwZWxpbmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJpc3N1ZSBOdW0gaW4gZ2V0SVNzdWVVcmwgOiBcIiArIElzc3VlTm8pO1xuICAgICAgdmFyIFBpcGVMaW5ldXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFBpcGVMaW5ldXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdHZXRQaXBlbGluZSdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG5cbiAgICAvLyBNb3ZlIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cblxuICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgcGlwZV9pZCA9IENvbW1hbmRBcnJbNF07XG5cbiAgICAgIC8vaWYgbW92aW5nIHBpcGVsaW5lLCAzcmQgYXJnIGlzIGlzc3VlIG51bSwgIDR0aCA9IC1wLCA1dGggPSBwaXBlbGluZSwgNnQgcG9zaXRpb25cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcblxuXG4gICAgICBsb2coXCJQaXBlbGluZSBnb3QgKHVzaW5nIHBpcGVfaWQpOiBcIiArIHBpcGVfaWQpO1xuICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls1XSB8IDA7XG4gICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgICAgIGxvZyhcImJ1aWxkaW5nIG1vdmUgcGlwZWxpbmUgdXJsLi5cIilcblxuICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICBwaXBlbGluZV9pZDogcGlwZV9pZCxcbiAgICAgICAgcG9zaXRpb246IChQb3NObyAhPT0gbnVsbCAmJiBQb3NObyAhPT0gJycgJiYgdHlwZW9mIFBvc05vICE9PSAndW5kZWZpbmVkJyA/IFBvc05vIDogMClcbiAgICAgIH07XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnSXNzdWVUb1BpcGVsaW5lcydcbiAgICAgIH07XG5cbiAgICAgIGxvZyhcInVybCBidWlsdC5cIik7XG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gICAgfVxuXG4gICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgIHZhciBFdmVudHNSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNldmVudHMvKTtcblxuICAgIGlmIChFdmVudHNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJpc3N1ZSBubyBldmVudHNyZWdleCBcIiArIElzc3VlTm8pO1xuICAgICAgdmFyIEV2ZW50c1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXZlbnRzJztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBFdmVudHNVcmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0lzc3VlRXZlbnRzJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vIFNldCB0aGUgZXN0aW1hdGUgZm9yIHRoZSBpc3N1ZS5cbiAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgdmFyIEVzdGltYXRlVmFsID0gQ29tbWFuZEFycls0XTtcbiAgICAgIGxvZyhcIkVzdGltYXRlVmFsIDogXCIgKyBFc3RpbWF0ZVZhbClcbiAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgIGVzdGltYXRlOiBFc3RpbWF0ZVZhbFxuICAgICAgfTtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBTZXRFc3RpbWF0ZSxcbiAgICAgICAgTWV0aG9kOiAnUFVUJyxcbiAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0lzc3VlRXN0aW1hdGUnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgdmFyIEJ1Z1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc2J1Zy8pO1xuXG4gICAgaWYgKEJ1Z1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIHZhciBCdWdVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogQnVnVXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdCdWdJc3N1ZXMnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuXG4gICAgLy9UbyBHZXQgVXNlciBJc3N1ZSBieSB1c2VyLCB1c2VySXNzdWVcbiAgICB2YXIgVXNlclJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy11XFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBVc2VyVXJsID0gJyc7XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogVXNlclVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnVXNlcklzc3VlcydcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuXG4gIC8vVG8gR2V0IEJsb2NrZWQgSXNzdWVzIFVybFxuICBnZXRCbG9ja1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcblxuICAgIGxvZyhcImdldEJsb2NrVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgQmxvY2t1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgVXJsOiBCbG9ja3VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTogJ0Jsb2NrZWRJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cblxuICAvL1RvIEdldCBlcGljcyBVcmxcbiAgZ2V0RXBpY1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcblxuICAgIGxvZyhcImdldEVwaWNVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIEVwaWNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9lcGljcyc7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTogJ0VwaWNJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9naXZlbiwgcGlwZWxpbmUgbmFtZSwgcmV0dXJuIHBpcGVsaW5lIGlkXG4gIGdldFBpcGVsaW5lSWQ6IGZ1bmN0aW9uIChQaXBlbGluZU5hbWUpIHtcbiAgICBsb2coXCJlbnRlcmVkIG5hbWUgOiBcIiArIFBpcGVsaW5lTmFtZSlcbiAgICAvL3ZhciBQaXBlbGluZUlkO1xuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgcnAocGlwZWxpbmVJZFJlcXVlc3QpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKSB7XG4gICAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIgKyBlcnIpXG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9KVxuXG4gIH1cblxuXG59O1xuIl19