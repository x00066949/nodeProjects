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
    //var BlockedRegex = new RegExp(/^\/blocked/);

    if (RepoRegex.test(UserCommand)) return UrlObject = this.getRepoUrl(UserCommand, CommandArr);

    var RepoId = repo_id;

    if (BlockedRegex.test(UserCommand)) return UrlObject = this.getBlockUrl(UserCommand, CommandArr, RepoId);

    if (IssueRegex.test(UserCommand)) return UrlObject = this.getIssueUrl(UserCommand, CommandArr, RepoId);

    if (EpicRegex.test(UserCommand)) return UrlObject = this.getEpicUrl(UserCommand, CommandArr, RepoId);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsIm9zIiwibG9nIiwicmVwb19pZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjYWxsTWUiLCJvcHRpb25zIiwicmVxIiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsImdldFJlcG9VcmwiLCJCbG9ja2VkUmVnZXgiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiYm9keSIsImtleSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJ1cmkiLCJxcyIsImFjY2Vzc190b2tlbiIsImhlYWRlcnMiLCJqc29uIiwidGhlbiIsInN1Y2Nlc3NkYXRhIiwiRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJpIiwibGVuZ3RoIiwidHlwZSIsInRvX3BpcGVsaW5lIiwiZnJvbV9waXBlbGluZSIsInVzZXJfaWQiLCJuYW1lIiwiY3JlYXRlZF9hdCIsInRvX2VzdGltYXRlIiwidmFsdWUiLCJwaXBlbGluZSIsImVzdGltYXRlIiwiZXBpY19pc3N1ZXMiLCJpc3N1ZV9udW1iZXIiLCJpc3N1ZV91cmwiLCJjYXRjaCIsImVyciIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaWQiLCJodG1sX3VybCIsIlJlc3Bvc2l0cm95SWQiLCJQaXBlbGluZVJlZ2V4IiwiSXNzdWVObyIsIlBpcGVMaW5ldXJsIiwiUGlwZWxpbmVNb3ZlUmVnZXgiLCJnZXRQaXBlbGluZUlkIiwiRXZlbnRzUmVnZXgiLCJFdmVudHNVcmwiLCJFc3RpbWF0ZUFkZFJlZ2V4IiwiRXN0aW1hdGVWYWwiLCJTZXRFc3RpbWF0ZSIsIk1vdmVCb2R5IiwiQnVnUmVnZXgiLCJCdWdVcmwiLCJVc2VyUmVnZXgiLCJCbG9ja3VybCIsIkVwaWNVcmwiLCJjYiIsIlBpcGVsaW5lTmFtZSIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJwaXBlbGluZUlkUmVxdWVzdCIsImRhdGEiLCJnZXQiLCJuZXdQSUQiLCJQb3NObyIsIk1vdmVJc3N1ZVBpcGVMaW5lIiwic3RhdHVzQ29kZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7NEJBQVlBLE87O0FBUVo7Ozs7Ozs7O0FBUEEsSUFBSUMsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFS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LEVBQWtCN0MsQ0FBbEIsRUFBcUJNLElBQXJCLEtBQThCbUMsWUFBbEMsRUFBZ0Q7QUFDOUNqSSxnQkFBSSx5QkFBeUJxSSxLQUFLLFdBQUwsRUFBa0I3QyxDQUFsQixFQUFxQnFCLEVBQWxEO0FBQ0EwQixxQkFBU0YsS0FBSyxXQUFMLEVBQWtCN0MsQ0FBbEIsRUFBcUJxQixFQUE5QjtBQUNEO0FBQ0Y7O0FBRUQ3RyxZQUFJLDRDQUFKOztBQUVBQSxZQUFJLGdDQUFnQ3VJLE1BQXBDO0FBQ0EsWUFBSUMsUUFBUWxILFdBQVcsQ0FBWCxJQUFnQixDQUE1QjtBQUNBdEIsWUFBSSxlQUFld0ksS0FBbkI7QUFDQSxZQUFJQyxvQkFBb0IscUJBQXFCMUIsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQWxELEdBQTRELFFBQXBGO0FBQ0FqSCxZQUFJLDhCQUFKOztBQUVBMEgsbUJBQVc7QUFDVDtBQUNBUSx1QkFBYUssTUFGSjtBQUdUSixvQkFBV0ssVUFBVSxJQUFWLElBQWtCQSxVQUFVLEVBQTVCLElBQWtDLE9BQU9BLEtBQVAsS0FBaUIsV0FBbkQsR0FBaUVBLEtBQWpFLEdBQXlFO0FBSDNFLFNBQVg7O0FBT0EsZUFBTzVFLFlBQVk7QUFDakJ2QixtQkFBUyxJQURRO0FBRWpCUyxlQUFLMkYsaUJBRlk7QUFHakJ2RixrQkFBUSxNQUhTO0FBSWpCRixnQkFBTTBFLFFBSlc7QUFLakJwRixpQkFBTyxLQUxVO0FBTWpCYyxtQkFBUztBQU5RLFNBQW5COztBQVNBcEQsWUFBSSxZQUFKOztBQUVBZ0ksV0FBRyxJQUFILEVBQVN6SCxJQUFJbUUsSUFBYjtBQUNELE9BMUNELE1BMENPO0FBQ0wxRSxZQUFJd0csTUFBTWpHLElBQUltSSxVQUFkO0FBQ0E7QUFDRDtBQUNGLEtBL0NBO0FBZ0REO0FBQ0EsV0FBTzlFLFNBQVA7O0FBRUE7Ozs7O0FBS0Q7O0FBdnJCYyxDQUFqQiIsImZpbGUiOiJzY3J1bV9ib2FyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG52YXIgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICB2YXIgRmluYWxNZXNzYWdlID0gbnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRWYWx1ZSA9IHRoaXMuZ2V0Q29tbWFuZChVc2VyQ29tbWFuZCk7XG5cbiAgICBsb2coXCJjb21tYW5kIHZhbCA6IFwiICsgQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIgKyByZXBvX2lkKTtcblxuICAgIHZhciBSZXBvc2l0b3J5SWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKFJlcG9zaXRvcnlJZCA9PT0gbnVsbCB8fCBSZXBvc2l0b3J5SWQgPT09ICcnIHx8IHR5cGVvZiBSZXBvc2l0b3J5SWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsb2coXCJ0cnlpbmcgdG8gZ2V0IHJlcG8gaWRcIik7XG5cbiAgICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XS8pO1xuXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgTWVzc2FnZTogJ1JlcG9zaXRvcnkgSWQgTm90IFNwZWNpZmllZCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIFJlcG9JZCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVwb0lkICE9PSAnJyAmJiBSZXBvSWQgIT09IG51bGwpIHtcbiAgICAgICAgbG9nKFwicmVwbyBmb3VuZCBpZDogXCIgKyBSZXBvSWQpO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIE1lc3NhZ2U6ICdTdWNjZXNzJyxcbiAgICAgICAgICBPcHRpb25zOiB7XG4gICAgICAgICAgICBSZXNwb3NpdG9yeUlkOiBSZXBvSWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG5cbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNHaXQpIHtcbiAgICAgIGxvZyhcImlzIEdpdCAuLlwiKVxuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGxvZyhcIm5vdCBnaXRcIik7XG4gICAgICBsb2coXCJ2aWV3IG9ialwiICsgVmFsaWRVcmxPYmplY3QpXG4gICAgICBjb25zb2xlLmRpcihWYWxpZFVybE9iamVjdCwgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2QsXG4gICAgICAgIFVUeXBlOiBWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cblxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIC8vaWYgL3JlcG8gY29tZXMgYWZ0ZXIgQHNjcnVtYm90LCBubyByZXBvIGlkIHByb3ZpZGVkIGVsc2UgdGFrZSB3aGF0ZXZlciBjb21lcyBhZnRlciBAc2NydW1ib3QgYXMgcmVwb19pZFxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSBWYWxpZENvbW1hbmRzWzFdKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIgKyBGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiICsgcmVwb19pZCArIFwiIGZyb20gbWVzc2FnZSBhcmcgYXQgcG9zIDEgPSBcIiArIENvbW1hbmRBcnJbMV0pO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuXG4gICAgbG9nKFwicmVwbyBpZCAyIDogXCIgKyByZXBvX2lkKTtcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gRmluYWxDb21tYW5kO1xuICB9LFxuXG4gIHZhbGlkYXRlQ29tbWFuZHM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICBsb2coXCJ2YWxpZGF0ZUNvbW1hbmRzXCIpO1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Db21tYW5kO1xuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICAvL3ZhciBCbG9ja2VkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvYmxvY2tlZC8pO1xuXG4gICAgaWYgKFJlcG9SZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldFJlcG9VcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpO1xuXG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoQmxvY2tlZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0QmxvY2tVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoSXNzdWVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKEVwaWNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEVwaWNVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBjb25zb2xlLmRpcihVcmxPYmplY3QsIHtkZXB0aDpudWxsfSk7XG4gICAgcmV0dXJuIFVybE9iamVjdDtcblxuICB9LFxuXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGxvZyhcIm1ha2VSZXF1ZXN0XCIpO1xuICAgIGxvZyhvcHRpb25zLlVCb2R5KVxuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBUb2tlbiA9IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTjtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS56ZW5odWIuaW8vJztcblxuICAgIHZhciBVc2VyVXJsID0gb3B0aW9ucy5VVXJsO1xuICAgIHZhciBib2R5O1xuXG4gICAgaWYgKG9wdGlvbnMuVUJvZHkgPT0gbnVsbCkge1xuICAgICAgYm9keSA9IHsga2V5OiAndmFsdWUnIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgYm9keSA9IG9wdGlvbnMuVUJvZHk7XG5cbiAgICB9XG5cbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcbiAgICB2YXIgVXJsVHlwZSA9IG9wdGlvbnMuVVR5cGU7XG5cbiAgICBjb25zb2xlLmRpcignVXJsYm9keTogJyArIGJvZHksIHsgZGVwdGg6IG51bGwgfSk7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogVU1ldGhvZCxcbiAgICAgIHVyaTogTWFpblVybCArIFVzZXJVcmwsXG4gICAgICBxczoge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgICAsXG5cbiAgICAgIC8vYm9keToge1xuICAgICAgYm9keVxuXG4gICAgICAvL31cbiAgICB9O1xuXG4gICAgY29uc29sZS5kaXIoVXJsT3B0aW9ucywgeyBkZXB0aDogbnVsbCB9KTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcblxuICAgICAgICAvL1BhcnNlIEpTT04gYWNjb3JkaW5nIHRvIG9iaiByZXR1cm5lZFxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0lzc3VlRXZlbnRzJykge1xuICAgICAgICAgIGxvZyhcIkV2ZW50cyBmb3IgaXNzdWVcIik7XG4gICAgICAgICAgRGF0YSA9ICdcXG4gICAgKkhlcmUgYXJlIHRoZSBtb3N0IHJlY2VudCBldmVudHMgcmVnYXJkaW5nIHlvdXIgaXNzdWU6KiAnO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzZGF0YS5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgICBpZiAoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ3RyYW5zZmVySXNzdWUnKSB7XG4gICAgICAgICAgICAgIGxvZyhcInBpcGVsaW5lIG1vdmUgZXZlbnRcIiArIEpTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhW2ldLnRvX3BpcGVsaW5lKSArIHN1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4qVXNlciAnICsgc3VjY2Vzc2RhdGFbaV0udXNlcl9pZCArICcqIF9tb3ZlZF8gdGhpcyBpc3N1ZSBmcm9tICcgKyBzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lLm5hbWUgKyAnIHRvICcgKyBzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZS5uYW1lICsgJyBvbiBkYXRlIDogJyArIGRhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ2VzdGltYXRlSXNzdWUnKSB7XG4gICAgICAgICAgICAgIGxvZyhcImVzdGltYXRlIGNoYW5nZSBldmVudCBcIiArIGkpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4gKlVzZXIgJyArIHN1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQgKyAnKiBfY2hhbmdlZCBlc3RpbWF0ZV8gb24gdGhpcyBpc3N1ZSB0byAgJyArIHN1Y2Nlc3NkYXRhW2ldLnRvX2VzdGltYXRlLnZhbHVlICsgJyBvbiBkYXRlIDogJyArIGRhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBEYXRhICs9IFwiRG8gbm90IHJlY29nbml6ZSBldmVudCB0eXBlXCJcbiAgICAgICAgICAgICAgbG9nKFwiZG8gbm90IHJlY29naXNlIGV2ZW50IHR5cGVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgICAgRGF0YSArPSBcIiBcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnR2V0UGlwZWxpbmUnKSB7XG5cbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIlRoYXQgaXNzdWUgaXMgY3VycmVudGx5IGluIFwiICsgc3VjY2Vzc2RhdGEucGlwZWxpbmUubmFtZSArIFwiIHBpcGVsaW5lLlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFVybFR5cGUgPT09ICdJc3N1ZUVzdGltYXRlJykge1xuICAgICAgICAgIERhdGEgPSAnJztcbiAgICAgICAgICBEYXRhICs9ICdZb3VyIElzc3VlXFwncyBlc3RpbWF0ZSBoYXMgYmVlbiB1cGRhdGVkIHRvICcgKyBzdWNjZXNzZGF0YS5lc3RpbWF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnRXBpY0lzc3VlcycpIHtcblxuICAgICAgICAgIERhdGEgPSBcIlRoZSBmb2xsb3dpbmcgRXBpY3MgYXJlIGluIHlvdXIgc2NydW1ib2FyZDogXCI7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzZGF0YS5lcGljX2lzc3Vlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgRGF0YSArPSBgXFxuIEVwaWMgSUQ6ICAke3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX251bWJlcn0gVXJsIDogJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV91cmx9IGBcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnSXNzdWVUb1BpcGVsaW5lcycpIHtcbiAgICAgICAgICBEYXRhID0gXCJcIjtcbiAgICAgICAgICBEYXRhICs9ICdTdWNlc3NmdWxseSBNb3ZlZCBJc3N1ZSdcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZyhcIlN1Y2Nlc3MgRGF0YSA6IFwiICsgRGF0YSlcbiAgICAgICAgcmV0dXJuIFwiQ29tbWFuZCBwYXJhbWV0ZXJzIG5vdCBhY2NlcHRlZFwiO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyBmb2xsb3dpbmcgZXJyb3IgPScgKyBlcnIpO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfSk7XG5cbiAgfSxcblxuXG4gIC8vIFRvIEdldCBSZXBvc2l0b3J5IElkXG4gIGdldFJlc3Bvc2l0b3J5SWQ6IGZ1bmN0aW9uIChPcHRpb25zKSB7XG4gICAgbG9nKFwiZ2V0UmVwb3NpdG9yeUlkXCIpO1xuICAgIHZhciByZXMgPSBPcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciByZXEgPSBPcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gT3B0aW9ucy5yZXBvTmFtZTtcbiAgICB2YXIgT3duZXJuYW1lID0gT3B0aW9ucy5HaXRPd25lck5hbWU7XG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcbiAgICBsb2coUmVwb3NpdG9yeU5hbWUpXG4gICAgLy9jb25zb2xlLmRpcihvcHRpb25zLHtkZXB0aDpubGx9KVxuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICB1cmk6IE1haW5VcmwgKyBSZXBvc2l0b3J5VXJsLFxuICAgICAgcXM6IHtcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuXG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc2RhdGEpO1xuICAgICAgICByZXR1cm4gXCJUaGUgKlJlcG9zaXRvcnkgSWQqIGZvciBfXCIgKyBSZXBvc2l0b3J5TmFtZSArIFwiXyBpcyBcIiArIEpTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhLmlkKSArIFwiICpyZXBvIGxpbmsqIDogXCIgKyBzdWNjZXNzZGF0YS5odG1sX3VybDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBsb2coXCJBUEkgY2FsbCBmYWlsZWQuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICAgIHJldHVybiBcIk5vIHJlcG9zaXRvcnkgd2l0aCBuYW1lIDogXCIgKyBSZXBvc2l0b3J5TmFtZSArIFwiIGV4aXN0c1wiXG5cbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2VcbiAgICB9O1xuXG4gICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICB2YXIgUGlwZWxpbmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNwaXBlbGluZS8pO1xuXG4gICAgaWYgKFBpcGVsaW5lUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiaXNzdWUgTnVtIGluIGdldElTc3VlVXJsIDogXCIgKyBJc3N1ZU5vKTtcbiAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnR2V0UGlwZWxpbmUnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuXG4gICAgLy8gTW92ZSBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZU1vdmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtcFxcc1tBLVphLXowLTldKi8pO1xuXG5cbiAgICBpZiAoUGlwZWxpbmVNb3ZlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UGlwZWxpbmVJZChDb21tYW5kQXJyLFxuICAgICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAoIWVycilcbiAgICAgICAgICAgIGxvZygnbW92ZWQgaXNzdWUnKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvLyBHZXQgZXZlbnRzIGZvciB0aGUgSXNzdWUgXG4gICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgaWYgKEV2ZW50c1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImlzc3VlIG5vIGV2ZW50c3JlZ2V4IFwiICsgSXNzdWVObyk7XG4gICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnSXNzdWVFdmVudHMnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuXG4gICAgLy8gU2V0IHRoZSBlc3RpbWF0ZSBmb3IgdGhlIGlzc3VlLlxuICAgIHZhciBFc3RpbWF0ZUFkZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1lXFxzWzAtOV0qLyk7XG5cbiAgICBpZiAoRXN0aW1hdGVBZGRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICB2YXIgRXN0aW1hdGVWYWwgPSBDb21tYW5kQXJyWzRdO1xuICAgICAgbG9nKFwiRXN0aW1hdGVWYWwgOiBcIiArIEVzdGltYXRlVmFsKVxuICAgICAgdmFyIFNldEVzdGltYXRlID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9lc3RpbWF0ZSc7XG5cbiAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgZXN0aW1hdGU6IEVzdGltYXRlVmFsXG4gICAgICB9O1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFNldEVzdGltYXRlLFxuICAgICAgICBNZXRob2Q6ICdQVVQnLFxuICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnSXNzdWVFc3RpbWF0ZSdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG4gICAgLy8gR2V0IEJ1Z3MgYnkgdGhlIHVzZXJcbiAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICBpZiAoQnVnUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgdmFyIEJ1Z1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBCdWdVcmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0J1Z0lzc3VlcydcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG5cbiAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXIsIHVzZXJJc3N1ZVxuICAgIHZhciBVc2VyUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzLXVcXHNbQS1aYS16MC05XSovKTtcblxuICAgIGlmIChVc2VyUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIFVzZXJVcmwgPSAnJztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBVc2VyVXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdVc2VySXNzdWVzJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgQmxvY2tlZCBJc3N1ZXMgVXJsXG4gIGdldEJsb2NrVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuXG4gICAgbG9nKFwiZ2V0QmxvY2tVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBCbG9ja3VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEJsb2NrdXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOiAnQmxvY2tlZElzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuXG4gIC8vVG8gR2V0IGVwaWNzIFVybFxuICBnZXRFcGljVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuXG4gICAgbG9nKFwiZ2V0RXBpY1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBFcGljVXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOiAnRXBpY0lzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuICAvL2dpdmVuLCBwaXBlbGluZSBuYW1lLCByZXR1cm4gcGlwZWxpbmUgaWRcbiAgZ2V0UGlwZWxpbmVJZDogZnVuY3Rpb24gKENvbW1hbmRBcnIsIGNiKSB7XG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgIHZhciBQaXBlbGluZU5hbWUgPSBDb21tYW5kQXJyWzRdO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICBwaXBlbGluZV9pZDogJzVhMDg4YjYzOGY0NjQ3MDljZDJjNzdjNScsXG4gICAgICAvL3BpcGVsaW5lX2lkOiBuZXdQSUQsXG4gICAgICBwb3NpdGlvbjogJzAnXG4gICAgfTtcbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuXG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3ZlcycsXG4gICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTogJ0lzc3VlVG9QaXBlbGluZXMnXG4gICAgfVxuXG4gICAgbG9nKFwiZW50ZXJlZCBuYW1lIDogXCIgKyBQaXBlbGluZU5hbWUpXG4gICAgLy92YXIgUGlwZWxpbmVJZDtcbiAgICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9O1xuICAgIHZhciBkYXRhO1xuICAgICByZXF1ZXN0LmdldChwaXBlbGluZUlkUmVxdWVzdCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoIWVycikge1xuICAgICAgICBjb25zb2xlLmRpcihyZXMuYm9keSwgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgICByZXR1cm4gcmVzLmJvZHlcbiAgICAgICAgZGF0YSA9IHJlcy5ib2R5O1xuICAgICAgICB2YXIgbmV3UElEO1xuXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKSB7XG4gICAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgICAgbmV3UElEID0gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuXG4gICAgICAgIGxvZyhcIlBpcGVsaW5lIGdvdCAodXNpbmcgZGF0YSk6IFwiICsgbmV3UElEKTtcbiAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls1XSB8IDA7XG4gICAgICAgIGxvZyhcInBvc2l0aW9uOiBcIiArIFBvc05vKVxuICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuXG4gICAgICAgIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIC8vcGlwZWxpbmVfaWQ6ICc1YTA4OGI2MzhmNDY0NzA5Y2QyYzc3YzUnLFxuICAgICAgICAgIHBpcGVsaW5lX2lkOiBuZXdQSUQsXG4gICAgICAgICAgcG9zaXRpb246IChQb3NObyAhPT0gbnVsbCAmJiBQb3NObyAhPT0gJycgJiYgdHlwZW9mIFBvc05vICE9PSAndW5kZWZpbmVkJyA/IFBvc05vIDogMClcbiAgICAgICAgfTtcblxuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOiAnSXNzdWVUb1BpcGVsaW5lcydcbiAgICAgICAgfTtcblxuICAgICAgICBsb2coXCJ1cmwgYnVpbHQuXCIpO1xuXG4gICAgICAgIGNiKG51bGwsIHJlcy5ib2R5KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nKGVyciArIHJlcy5zdGF0dXNDb2RlKVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSlcbiAgICAvLy50aGVuKChkYXRhKSA9PiB7XG4gICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgIC8qfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiICsgZXJyKVxuICAgICAgcmV0dXJuIGVycjtcbiAgICB9KSovXG4gIH1cblxuXG59O1xuIl19