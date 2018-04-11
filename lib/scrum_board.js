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
      return rp('api.github.com').then(function (successdata) {
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
          }
          if (successdata[i].type === 'estimateIssue') {
            log("estimate change event " + i);
            Data += '\n *User ' + successdata[i].user_id + '* _changed estimate_ on this issue to  ' + successdata[i].to_estimate.value + ' on date : ' + dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
          } else {
            Data += "Do not recognize event type";
            log("do not recogise event type");
          }
        }
        Data += " ";
      }

      if (UrlType === 'GetPipeline') {

        Data = " ";
        Data += "That issue is currently in " + successdata.pipeline.name + " pipeline.";
      }

      if (UrlType === 'IssueEstimate') {
        Data = '';
        Data += 'Your Issue\'s estimate has been updated to ' + successdata.estimate;
      }

      if (UrlType === 'EpicIssues') {

        Data = "The following Epics are in your scrumboard: ";
        for (var i = 0; i < successdata.epic_issues.length; i++) {
          Data += /*istanbul ignore next*/'\n Epic ID:  ' + successdata.epic_issues[i].issue_number + ' Url : ' + successdata.epic_issues[i].issue_url + ' ';
        }
      }

      if (UrlType === 'IssueToPipelines') {
        Data = "";
        Data += 'Sucessfully Moved Issue';
      }

      log("Success Data : " + Data);
      return "Command parameters not accepted";
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

      return this.getPipelineId(CommandArr, function (err, res) {
        if (!err) log('moved issue');
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
  getPipelineId: function /*istanbul ignore next*/getPipelineId(CommandArr, cb) {
    var IssueNo = CommandArr[2];
    var PipelineName = CommandArr[4];
    var RespositroyId = CommandArr[1];
    var MoveBody = {
      pipeline_id: '5a088b638f464709cd2c77c5',
      //pipeline_id: newPID,
      position: '0'
    };
    var UrlObject = {

      IsValid: false,
      Url: 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves',
      Method: 'POST',
      Body: MoveBody,
      IsGit: false,
      UrlType: 'IssueToPipelines'
    };

    log("entered name : " + PipelineName);
    //var PipelineId;
    var pipelineIdRequest = {
      uri: 'https://api.zenhub.io/p1/repositories/' + repo_id + '/board',

      headers: {
        'X-Authentication-Token': process.env.ZENHUB_TOKEN
      },

      json: true
    };
    var data;
    request.get(pipelineIdRequest, function (err, res) {
      if (!err) {
        console.dir(res.body, { depth: null });
        return res.body;
        data = res.body;
        var newPID;

        log(data);
        for (var i = 0; i < data['pipelines'].length; i++) {
          log("checking");
          if (data['pipelines'][i].name === PipelineName) {
            log("found pipeline id : " + data['pipelines'][i].id);
            newPID = data['pipelines'][i].id;
          }
        }

        log("did not find id corresponding to pipe name");

        log("Pipeline got (using data): " + newPID);
        var PosNo = CommandArr[5] | 0;
        log("position: " + PosNo);
        var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';
        log("building move pipeline url..");

        MoveBody = {
          //pipeline_id: '5a088b638f464709cd2c77c5',
          pipeline_id: newPID,
          position: PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0
        };

        return UrlObject = {
          IsValid: true,
          Url: MoveIssuePipeLine,
          Method: 'POST',
          Body: MoveBody,
          IsGit: false,
          UrlType: 'IssueToPipelines'
        };

        log("url built.");

        cb(null, res.body);
      } else {
        log(err + res.statusCode);
        return;
      }
    });
    //.then((data) => {
    return UrlObject;

    /*})
    .catch((err) => {
      console.log("error = " + err)
      return err;
    })*/
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsIm9zIiwibG9nIiwicmVwb19pZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjYWxsTWUiLCJvcHRpb25zIiwicmVxIiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiYm9keSIsImtleSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJ1cmkiLCJxcyIsImFjY2Vzc190b2tlbiIsImhlYWRlcnMiLCJqc29uIiwidGhlbiIsInN1Y2Nlc3NkYXRhIiwiZXJyTWVzc2FnZSIsIkRhdGEiLCJKU09OIiwic3RyaW5naWZ5IiwiaSIsImxlbmd0aCIsInR5cGUiLCJ0b19waXBlbGluZSIsImZyb21fcGlwZWxpbmUiLCJ1c2VyX2lkIiwibmFtZSIsImNyZWF0ZWRfYXQiLCJ0b19lc3RpbWF0ZSIsInZhbHVlIiwicGlwZWxpbmUiLCJlc3RpbWF0ZSIsImVwaWNfaXNzdWVzIiwiaXNzdWVfbnVtYmVyIiwiaXNzdWVfdXJsIiwiY2F0Y2giLCJlcnIiLCJFcnJvciIsIlJlcG9zaXRvcnlOYW1lIiwiT3duZXJuYW1lIiwiUmVwb3NpdG9yeVVybCIsImlkIiwiaHRtbF91cmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiZ2V0UGlwZWxpbmVJZCIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkVzdGltYXRlVmFsIiwiU2V0RXN0aW1hdGUiLCJNb3ZlQm9keSIsIkJ1Z1JlZ2V4IiwiQnVnVXJsIiwiVXNlclJlZ2V4IiwiQmxvY2t1cmwiLCJFcGljVXJsIiwiY2IiLCJQaXBlbGluZU5hbWUiLCJwaXBlbGluZV9pZCIsInBvc2l0aW9uIiwicGlwZWxpbmVJZFJlcXVlc3QiLCJkYXRhIiwiZ2V0IiwibmV3UElEIiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsInN0YXR1c0NvZGUiXSwibWFwcGluZ3MiOiI7O0FBQUE7OzRCQUFZQSxPOztBQVFaOzs7Ozs7OztBQVBBLElBQUlDLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FB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a0JBQVEsTUFIUztBQUlqQkYsZ0JBQU0yRSxRQUpXO0FBS2pCckYsaUJBQU8sS0FMVTtBQU1qQmMsbUJBQVM7QUFOUSxTQUFuQjs7QUFTQXBELFlBQUksWUFBSjs7QUFFQWlJLFdBQUcsSUFBSCxFQUFTMUgsSUFBSW1FLElBQWI7QUFDRCxPQTFDRCxNQTBDTztBQUNMMUUsWUFBSXlHLE1BQU1sRyxJQUFJb0ksVUFBZDtBQUNBO0FBQ0Q7QUFDRixLQS9DRDtBQWdEQTtBQUNBLFdBQU8vRSxTQUFQOztBQUVBOzs7OztBQUtEOztBQXBzQmMsQ0FBakIiLCJmaWxlIjoic2NydW1fYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xudmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xudmFyIG9zID0gcmVxdWlyZShcIm9zXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgcmVwb19pZDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblxuICBjYWxsTWU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgdGVzdCA9IG9wdGlvbnMudGVzdDtcblxuICAgIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICBcIlVzZXJJZFwiOiBcIk1hcFwiLFxuICAgICAgXCJDaGVja1wiOiB0ZXN0XG4gICAgfTtcblxuICAgIHJldHVybiBGaW5hbERhdGE7XG4gIH0sXG5cbiAgZ2V0U2NydW1EYXRhKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVXNlcklucHV0O1xuXG4gICAgdmFyIEZpbmFsTWVzc2FnZSA9IG51bGw7XG4gICAgLy8gICBNZXNzYWdlIDogbnVsbCxcbiAgICAvLyAgIE9wdGlvbnMgOiBudWxsXG4gICAgLy8gfTtcblxuICAgIHZhciBDaGVja0lmVmFsaWRDb21tYW5kID0gdGhpcy5jaGVja1ZhbGlkSW5wdXQoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIFVDb21tYW5kOiBVc2VyQ29tbWFuZFxuICAgIH0pO1xuXG4gICAgaWYgKCFDaGVja0lmVmFsaWRDb21tYW5kKSB7XG4gICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kVmFsdWUgPSB0aGlzLmdldENvbW1hbmQoVXNlckNvbW1hbmQpO1xuXG4gICAgbG9nKFwiY29tbWFuZCB2YWwgOiBcIiArIENvbW1hbmRWYWx1ZSk7XG5cbiAgICBpZiAoQ29tbWFuZFZhbHVlID09PSAnJyB8fCBDb21tYW5kVmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIENvbW1hbmRWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGxvZyhcInJlcG8gaWQgMSA6IFwiICsgcmVwb19pZCk7XG5cbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gcmVwb19pZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuXG4gICAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0vKTtcblxuICAgICAgaWYgKCFSZXBvUmVnZXgudGVzdChDb21tYW5kVmFsdWUpKSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiICsgUmVwb0lkKTtcblxuICAgICAgICBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBNZXNzYWdlOiAnU3VjY2VzcycsXG4gICAgICAgICAgT3B0aW9uczoge1xuICAgICAgICAgICAgUmVzcG9zaXRvcnlJZDogUmVwb0lkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOiAneDAwMDY2OTQ5J1xuXG4gICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgbG9nKFwiZ2V0IHVybFwiKTtcbiAgICB2YXIgVmFsaWRVcmxPYmplY3QgPSB0aGlzLnZhbGlkYXRlQ29tbWFuZHMoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIENvbW1hbmQ6IENvbW1hbmRWYWx1ZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgQ29tbWFuZHMnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzR2l0KSB7XG4gICAgICBsb2coXCJpcyBHaXQgLi5cIilcbiAgICAgIHZhciBVQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgICAgdmFyIEdpdFJlcG9OYW1lID0gVUNvbW1hbmRBcnJbMV07XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBHaXRSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOiAneDAwMDY2OTQ5J1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBsb2coXCJub3QgZ2l0XCIpO1xuICAgICAgbG9nKFwidmlldyBvYmpcIiArIFZhbGlkVXJsT2JqZWN0KVxuICAgICAgY29uc29sZS5kaXIoVmFsaWRVcmxPYmplY3QsIHsgZGVwdGg6IG51bGwgfSlcbiAgICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgVVVybDogVmFsaWRVcmxPYmplY3QuVXJsLFxuICAgICAgICBVQm9keTogVmFsaWRVcmxPYmplY3QuQm9keSxcbiAgICAgICAgVU1ldGhvZDogVmFsaWRVcmxPYmplY3QuTWV0aG9kLFxuICAgICAgICBVVHlwZTogVmFsaWRVcmxPYmplY3QuVXJsVHlwZVxuICAgICAgfSk7XG4gICAgfVxuXG5cbiAgfSxcblxuICBjaGVja1ZhbGlkSW5wdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVmFsaWRCaXQgPSBmYWxzZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVDb21tYW5kO1xuICAgIGNvbnNvbGUubG9nKFwidXNlciBjb21tYW5kIDogXCIgKyBVc2VyQ29tbWFuZCk7XG5cbiAgICB2YXIgVmFsaWRDb21tYW5kcyA9IFsnQHNjcnVtYm90JywgJy9yZXBvJywgJy9pc3N1ZScsICcvZXBpYycsICcvYmxvY2tlZCddO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgVmFsaWRDb21tYWRSZWdleCA9IG5ldyBSZWdFeHAoL14oQHNjcnVtYm90KVxcc1tcXC9BLVphLXpdKi8pO1xuICAgIGNvbnNvbGUubG9nKFwicHJvY2Vzc2luZyBtZXNzYWdlIDogXCIgKyBVc2VyQ29tbWFuZCk7XG5cblxuICAgIGlmICghVmFsaWRDb21tYWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuICAgICAgbG9nKFwiRXJyb3Igbm90IHN0YXJ0aW5nIHdpdGggQHNjcnVtYm90XCIpXG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG5cblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICAvL2lmIC9yZXBvIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCwgbm8gcmVwbyBpZCBwcm92aWRlZCBlbHNlIHRha2Ugd2hhdGV2ZXIgY29tZXMgYWZ0ZXIgQHNjcnVtYm90IGFzIHJlcG9faWRcbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gVmFsaWRDb21tYW5kc1sxXSkge1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG5cbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG4gICAgbG9nKFwiRmluYWwgQ29tbWFuZCA6IFwiICsgRmluYWxDb21tYW5kKTtcblxuICAgIHJldHVybiBWYWxpZEJpdCA9IHRydWU7XG4gIH0sXG5cbiAgZ2V0Q29tbWFuZDogZnVuY3Rpb24gKFVDb21tYW5kKSB7XG4gICAgbG9nKFwiZ2V0Q29tbWFuZFwiKTtcbiAgICB2YXIgVmFsaWRCaXQgPSAnJztcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBVQ29tbWFuZDtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgdHlwZW9mIFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gJy9yZXBvJykge1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJmaXJzdGx5IGluaXRpYWxpc2lpbmcgcmVwb19pZCBhcyBcIiArIHJlcG9faWQgKyBcIiBmcm9tIG1lc3NhZ2UgYXJnIGF0IHBvcyAxID0gXCIgKyBDb21tYW5kQXJyWzFdKTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIGxvZyhcInJlcG8gaWQgMiA6IFwiICsgcmVwb19pZCk7XG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgcmV0dXJuIEZpbmFsQ29tbWFuZDtcbiAgfSxcblxuICB2YWxpZGF0ZUNvbW1hbmRzOiBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gICAgbG9nKFwidmFsaWRhdGVDb21tYW5kc1wiKTtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuQ29tbWFuZDtcbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGxcbiAgICB9O1xuXG4gICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBJc3N1ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9pc3N1ZV0qXFxzWzAtOV0qXFxzWzAtOV0qXFxzKC11fGJ1Z3xwaXBlbGluZXwtcHxldmVudHN8LWUpLyk7XG4gICAgdmFyIEVwaWNSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvZXBpY10qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIEJsb2NrZWRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9ibG9ja2VkLyk7XG5cbiAgICBpZiAoUmVwb1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0UmVwb1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycik7XG5cbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGlmIChCbG9ja2VkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRCbG9ja1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChJc3N1ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoRXBpY1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogJ3dyb25nQ29tbWFuZCcsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnNvbGUuZGlyKFVybE9iamVjdCwgeyBkZXB0aDogbnVsbCB9KTtcbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG5cbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgbG9nKFwibWFrZVJlcXVlc3RcIik7XG4gICAgbG9nKG9wdGlvbnMuVUJvZHkpXG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFRva2VuID0gcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby8nO1xuXG4gICAgdmFyIFVzZXJVcmwgPSBvcHRpb25zLlVVcmw7XG4gICAgdmFyIGJvZHk7XG5cbiAgICBpZiAob3B0aW9ucy5VQm9keSA9PSBudWxsKSB7XG4gICAgICBib2R5ID0geyBrZXk6ICd2YWx1ZScgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBib2R5ID0gb3B0aW9ucy5VQm9keTtcblxuICAgIH1cblxuICAgIHZhciBVTWV0aG9kID0gb3B0aW9ucy5VTWV0aG9kO1xuICAgIHZhciBVcmxUeXBlID0gb3B0aW9ucy5VVHlwZTtcblxuICAgIGNvbnNvbGUuZGlyKCdVcmxib2R5OiAnICsgYm9keSwgeyBkZXB0aDogbnVsbCB9KTtcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgbWV0aG9kOiBVTWV0aG9kLFxuICAgICAgdXJpOiBNYWluVXJsICsgVXNlclVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICAgICxcblxuICAgICAgLy9ib2R5OiB7XG4gICAgICBib2R5XG5cbiAgICAgIC8vfVxuICAgIH07XG5cbiAgICBjb25zb2xlLmRpcihVcmxPcHRpb25zLCB7IGRlcHRoOiBudWxsIH0pO1xuICAgIGlmIChVc2VyVXJsID09PSAnd3JvbmdDb21tYW5kJykge1xuICAgICAgbG9nKFVzZXJVcmwpXG4gICAgICByZXR1cm4gcnAoJ2FwaS5naXRodWIuY29tJykudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpe1xuICAgICAgICB2YXIgZXJyTWVzc2FnZSA9ICdXcm9uZyBDb21tYW5kJztcbiAgICAgICAgcmV0dXJuIGVyck1lc3NhZ2U7XG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgRGF0YSA9IHN1Y2Nlc3NkYXRhO1xuICAgICAgICBjb25zb2xlLmxvZygnRm9sbG93aW5nIERhdGEgPScgKyBKU09OLnN0cmluZ2lmeShEYXRhKSk7XG5cbiAgICAgICAgLy9QYXJzZSBKU09OIGFjY29yZGluZyB0byBvYmogcmV0dXJuZWRcbiAgICAgICAgaWYgKFVybFR5cGUgPT09ICdJc3N1ZUV2ZW50cycpIHtcbiAgICAgICAgICBsb2coXCJFdmVudHMgZm9yIGlzc3VlXCIpO1xuICAgICAgICAgIERhdGEgPSAnXFxuICAgICpIZXJlIGFyZSB0aGUgbW9zdCByZWNlbnQgZXZlbnRzIHJlZ2FyZGluZyB5b3VyIGlzc3VlOiogJztcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzc2RhdGEubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICd0cmFuc2Zlcklzc3VlJykge1xuICAgICAgICAgICAgICBsb2coXCJwaXBlbGluZSBtb3ZlIGV2ZW50XCIgKyBKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZSkgKyBzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lKTtcbiAgICAgICAgICAgICAgRGF0YSArPSAnXFxuKlVzZXIgJyArIHN1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQgKyAnKiBfbW92ZWRfIHRoaXMgaXNzdWUgZnJvbSAnICsgc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZS5uYW1lICsgJyB0byAnICsgc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUubmFtZSArICcgb24gZGF0ZSA6ICcgKyBkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICdlc3RpbWF0ZUlzc3VlJykge1xuICAgICAgICAgICAgICBsb2coXCJlc3RpbWF0ZSBjaGFuZ2UgZXZlbnQgXCIgKyBpKTtcbiAgICAgICAgICAgICAgRGF0YSArPSAnXFxuICpVc2VyICcgKyBzdWNjZXNzZGF0YVtpXS51c2VyX2lkICsgJyogX2NoYW5nZWQgZXN0aW1hdGVfIG9uIHRoaXMgaXNzdWUgdG8gICcgKyBzdWNjZXNzZGF0YVtpXS50b19lc3RpbWF0ZS52YWx1ZSArICcgb24gZGF0ZSA6ICcgKyBkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgRGF0YSArPSBcIkRvIG5vdCByZWNvZ25pemUgZXZlbnQgdHlwZVwiXG4gICAgICAgICAgICAgIGxvZyhcImRvIG5vdCByZWNvZ2lzZSBldmVudCB0eXBlXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgICAgIERhdGEgKz0gXCIgXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0dldFBpcGVsaW5lJykge1xuXG4gICAgICAgICAgRGF0YSA9IFwiIFwiO1xuICAgICAgICAgIERhdGEgKz0gXCJUaGF0IGlzc3VlIGlzIGN1cnJlbnRseSBpbiBcIiArIHN1Y2Nlc3NkYXRhLnBpcGVsaW5lLm5hbWUgKyBcIiBwaXBlbGluZS5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnSXNzdWVFc3RpbWF0ZScpIHtcbiAgICAgICAgICBEYXRhID0gJyc7XG4gICAgICAgICAgRGF0YSArPSAnWW91ciBJc3N1ZVxcJ3MgZXN0aW1hdGUgaGFzIGJlZW4gdXBkYXRlZCB0byAnICsgc3VjY2Vzc2RhdGEuZXN0aW1hdGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0VwaWNJc3N1ZXMnKSB7XG5cbiAgICAgICAgICBEYXRhID0gXCJUaGUgZm9sbG93aW5nIEVwaWNzIGFyZSBpbiB5b3VyIHNjcnVtYm9hcmQ6IFwiO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIERhdGEgKz0gYFxcbiBFcGljIElEOiAgJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV9udW1iZXJ9IFVybCA6ICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfdXJsfSBgXG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0lzc3VlVG9QaXBlbGluZXMnKSB7XG4gICAgICAgICAgRGF0YSA9IFwiXCI7XG4gICAgICAgICAgRGF0YSArPSAnU3VjZXNzZnVsbHkgTW92ZWQgSXNzdWUnXG4gICAgICAgIH1cblxuICAgICAgICBsb2coXCJTdWNjZXNzIERhdGEgOiBcIiArIERhdGEpXG4gICAgICAgIHJldHVybiBcIkNvbW1hbmQgcGFyYW1ldGVycyBub3QgYWNjZXB0ZWRcIjtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgZm9sbG93aW5nIGVycm9yID0nICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH0pO1xuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuICAgIHZhciBSZXBvc2l0b3J5VXJsID0gJ3JlcG9zLycgKyBPd25lcm5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tLyc7XG4gICAgbG9nKFJlcG9zaXRvcnlOYW1lKVxuICAgIC8vY29uc29sZS5kaXIob3B0aW9ucyx7ZGVwdGg6bmxsfSlcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgfTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBSZXBvSWQgPSBzdWNjZXNzZGF0YS5pZDtcblxuXG4gICAgICAgIHJlcG9faWQgPSBSZXBvSWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKHN1Y2Nlc3NkYXRhKTtcbiAgICAgICAgcmV0dXJuIFwiVGhlICpSZXBvc2l0b3J5IElkKiBmb3IgX1wiICsgUmVwb3NpdG9yeU5hbWUgKyBcIl8gaXMgXCIgKyBKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YS5pZCkgKyBcIiAqcmVwbyBsaW5rKiA6IFwiICsgc3VjY2Vzc2RhdGEuaHRtbF91cmw7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgbG9nKFwiQVBJIGNhbGwgZmFpbGVkLi4uXCIpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgJWQgcmVwb3MnLCBlcnIpO1xuICAgICAgICByZXR1cm4gXCJObyByZXBvc2l0b3J5IHdpdGggbmFtZSA6IFwiICsgUmVwb3NpdG9yeU5hbWUgKyBcIiBleGlzdHNcIlxuXG4gICAgICB9KTtcblxuICB9LFxuXG4gIC8vIFRvIEdldCBSZXBvIFVybFxuICBnZXRSZXBvVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpIHtcblxuICAgIGxvZyhcImdldFJlcG9VcmxcIik7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgR2l0T3duZXJOYW1lID0gJ3gwMDA2Njk0OSc7XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9ICdyZXBvcy8nICsgR2l0T3duZXJOYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogUmVwb3NpdG9yeUlkLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogdHJ1ZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IElzc3VlIHJlbGF0ZWQgVXJsXG4gIGdldElzc3VlVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldElzc3VlVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIC8vVG8gR2V0IFN0YXRlIG9mIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzcGlwZWxpbmUvKTtcblxuICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiICsgSXNzdWVObyk7XG4gICAgICB2YXIgUGlwZUxpbmV1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogUGlwZUxpbmV1cmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0dldFBpcGVsaW5lJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vIE1vdmUgUGlwZWxpbmVcbiAgICB2YXIgUGlwZWxpbmVNb3ZlUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLXBcXHNbQS1aYS16MC05XSovKTtcblxuXG4gICAgaWYgKFBpcGVsaW5lTW92ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFBpcGVsaW5lSWQoQ29tbWFuZEFycixcbiAgICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpXG4gICAgICAgICAgICBsb2coJ21vdmVkIGlzc3VlJyk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgIHZhciBFdmVudHNSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNldmVudHMvKTtcblxuICAgIGlmIChFdmVudHNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJpc3N1ZSBubyBldmVudHNyZWdleCBcIiArIElzc3VlTm8pO1xuICAgICAgdmFyIEV2ZW50c1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXZlbnRzJztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBFdmVudHNVcmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0lzc3VlRXZlbnRzJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vIFNldCB0aGUgZXN0aW1hdGUgZm9yIHRoZSBpc3N1ZS5cbiAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgdmFyIEVzdGltYXRlVmFsID0gQ29tbWFuZEFycls0XTtcbiAgICAgIGxvZyhcIkVzdGltYXRlVmFsIDogXCIgKyBFc3RpbWF0ZVZhbClcbiAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgIGVzdGltYXRlOiBFc3RpbWF0ZVZhbFxuICAgICAgfTtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBTZXRFc3RpbWF0ZSxcbiAgICAgICAgTWV0aG9kOiAnUFVUJyxcbiAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0lzc3VlRXN0aW1hdGUnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgdmFyIEJ1Z1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc2J1Zy8pO1xuXG4gICAgaWYgKEJ1Z1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIHZhciBCdWdVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogQnVnVXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdCdWdJc3N1ZXMnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuXG4gICAgLy9UbyBHZXQgVXNlciBJc3N1ZSBieSB1c2VyLCB1c2VySXNzdWVcbiAgICB2YXIgVXNlclJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy11XFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBVc2VyVXJsID0gJyc7XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogVXNlclVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnVXNlcklzc3VlcydcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuXG4gIC8vVG8gR2V0IEJsb2NrZWQgSXNzdWVzIFVybFxuICBnZXRCbG9ja1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcblxuICAgIGxvZyhcImdldEJsb2NrVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgQmxvY2t1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgVXJsOiBCbG9ja3VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTogJ0Jsb2NrZWRJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cblxuICAvL1RvIEdldCBlcGljcyBVcmxcbiAgZ2V0RXBpY1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcblxuICAgIGxvZyhcImdldEVwaWNVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIEVwaWNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9lcGljcyc7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTogJ0VwaWNJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9naXZlbiwgcGlwZWxpbmUgbmFtZSwgcmV0dXJuIHBpcGVsaW5lIGlkXG4gIGdldFBpcGVsaW5lSWQ6IGZ1bmN0aW9uIChDb21tYW5kQXJyLCBjYikge1xuICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICB2YXIgUGlwZWxpbmVOYW1lID0gQ29tbWFuZEFycls0XTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgcGlwZWxpbmVfaWQ6ICc1YTA4OGI2MzhmNDY0NzA5Y2QyYzc3YzUnLFxuICAgICAgLy9waXBlbGluZV9pZDogbmV3UElELFxuICAgICAgcG9zaXRpb246ICcwJ1xuICAgIH07XG4gICAgdmFyIFVybE9iamVjdCA9IHtcblxuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnLFxuICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6ICdJc3N1ZVRvUGlwZWxpbmVzJ1xuICAgIH1cblxuICAgIGxvZyhcImVudGVyZWQgbmFtZSA6IFwiICsgUGlwZWxpbmVOYW1lKVxuICAgIC8vdmFyIFBpcGVsaW5lSWQ7XG4gICAgdmFyIHBpcGVsaW5lSWRSZXF1ZXN0ID0ge1xuICAgICAgdXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nICsgcmVwb19pZCArICcvYm9hcmQnLFxuXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgICB9LFxuXG4gICAgICBqc29uOiB0cnVlXG4gICAgfTtcbiAgICB2YXIgZGF0YTtcbiAgICByZXF1ZXN0LmdldChwaXBlbGluZUlkUmVxdWVzdCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoIWVycikge1xuICAgICAgICBjb25zb2xlLmRpcihyZXMuYm9keSwgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgICByZXR1cm4gcmVzLmJvZHlcbiAgICAgICAgZGF0YSA9IHJlcy5ib2R5O1xuICAgICAgICB2YXIgbmV3UElEO1xuXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKSB7XG4gICAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgICAgbmV3UElEID0gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuXG4gICAgICAgIGxvZyhcIlBpcGVsaW5lIGdvdCAodXNpbmcgZGF0YSk6IFwiICsgbmV3UElEKTtcbiAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls1XSB8IDA7XG4gICAgICAgIGxvZyhcInBvc2l0aW9uOiBcIiArIFBvc05vKVxuICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuXG4gICAgICAgIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIC8vcGlwZWxpbmVfaWQ6ICc1YTA4OGI2MzhmNDY0NzA5Y2QyYzc3YzUnLFxuICAgICAgICAgIHBpcGVsaW5lX2lkOiBuZXdQSUQsXG4gICAgICAgICAgcG9zaXRpb246IChQb3NObyAhPT0gbnVsbCAmJiBQb3NObyAhPT0gJycgJiYgdHlwZW9mIFBvc05vICE9PSAndW5kZWZpbmVkJyA/IFBvc05vIDogMClcbiAgICAgICAgfTtcblxuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOiAnSXNzdWVUb1BpcGVsaW5lcydcbiAgICAgICAgfTtcblxuICAgICAgICBsb2coXCJ1cmwgYnVpbHQuXCIpO1xuXG4gICAgICAgIGNiKG51bGwsIHJlcy5ib2R5KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nKGVyciArIHJlcy5zdGF0dXNDb2RlKVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSlcbiAgICAvLy50aGVuKChkYXRhKSA9PiB7XG4gICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgIC8qfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiICsgZXJyKVxuICAgICAgcmV0dXJuIGVycjtcbiAgICB9KSovXG4gIH1cblxuXG59O1xuIl19