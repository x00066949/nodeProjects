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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsIm9zIiwibG9nIiwicmVwb19pZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjYWxsTWUiLCJvcHRpb25zIiwicmVxIiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiYm9keSIsImtleSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJ1cmkiLCJxcyIsImFjY2Vzc190b2tlbiIsImhlYWRlcnMiLCJqc29uIiwiY2xpZW50X2lkIiwiR0lUX0NMSUVOVF9JRCIsImNsaWVudF9zZWNyZXQiLCJHSVRfQ0xJRU5UX1NFQ1JFVCIsInRoZW4iLCJzdWNjZXNzZGF0YSIsImVyck1lc3NhZ2UiLCJEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsImkiLCJsZW5ndGgiLCJ0eXBlIiwidG9fcGlwZWxpbmUiLCJmcm9tX3BpcGVsaW5lIiwidXNlcl9pZCIsIm5hbWUiLCJjcmVhdGVkX2F0IiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsInBpcGVsaW5lIiwiZXN0aW1hdGUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsImNhdGNoIiwiZXJyIiwiRXJyb3IiLCJSZXBvc2l0b3J5TmFtZSIsIk93bmVybmFtZSIsIlJlcG9zaXRvcnlVcmwiLCJpZCIsImh0bWxfdXJsIiwiUmVzcG9zaXRyb3lJZCIsIlBpcGVsaW5lUmVnZXgiLCJJc3N1ZU5vIiwiUGlwZUxpbmV1cmwiLCJQaXBlbGluZU1vdmVSZWdleCIsImdldFBpcGVsaW5lSWQiLCJFdmVudHNSZWdleCIsIkV2ZW50c1VybCIsIkVzdGltYXRlQWRkUmVnZXgiLCJFc3RpbWF0ZVZhbCIsIlNldEVzdGltYXRlIiwiTW92ZUJvZHkiLCJCdWdSZWdleCIsIkJ1Z1VybCIsIlVzZXJSZWdleCIsIkJsb2NrdXJsIiwiRXBpY1VybCIsImNiIiwiUGlwZWxpbmVOYW1lIiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsInBpcGVsaW5lSWRSZXF1ZXN0IiwiZGF0YSIsImdldCIsIm5ld1BJRCIsIlBvc05vIiwiTW92ZUlzc3VlUGlwZUxpbmUiLCJzdGF0dXNDb2RlIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs0QkFB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S0FBbkI7QUFDQSxZQUFJQyxvQkFBb0IscUJBQXFCMUIsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQWxELEdBQTRELFFBQXBGO0FBQ0F0SCxZQUFJLDhCQUFKOztBQUVBK0gsbUJBQVc7QUFDVDtBQUNBUSx1QkFBYUssTUFGSjtBQUdUSixvQkFBV0ssVUFBVSxJQUFWLElBQWtCQSxVQUFVLEVBQTVCLElBQWtDLE9BQU9BLEtBQVAsS0FBaUIsV0FBbkQsR0FBaUVBLEtBQWpFLEdBQXlFO0FBSDNFLFNBQVg7O0FBT0EsZUFBT2pGLFlBQVk7QUFDakJ2QixtQkFBUyxJQURRO0FBRWpCUyxlQUFLZ0csaUJBRlk7QUFHakI1RixrQkFBUSxNQUhTO0FBSWpCRixnQkFBTStFLFFBSlc7QUFLakJ6RixpQkFBTyxLQUxVO0FBTWpCYyxtQkFBUztBQU5RLFNBQW5COztBQVNBcEQsWUFBSSxZQUFKOztBQUVBcUksV0FBRyxJQUFILEVBQVM5SCxJQUFJbUUsSUFBYjtBQUNELE9BMUNELE1BMENPO0FBQ0wxRSxZQUFJNkcsTUFBTXRHLElBQUl3SSxVQUFkO0FBQ0E7QUFDRDtBQUNGLEtBL0NEO0FBZ0RBO0FBQ0EsV0FBT25GLFNBQVA7O0FBRUE7Ozs7O0FBS0Q7O0FBbnRCYyxDQUFqQiIsImZpbGUiOiJzY3J1bV9ib2FyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG52YXIgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICB2YXIgRmluYWxNZXNzYWdlID0gbnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRWYWx1ZSA9IHRoaXMuZ2V0Q29tbWFuZChVc2VyQ29tbWFuZCk7XG5cbiAgICBsb2coXCJjb21tYW5kIHZhbCA6IFwiICsgQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIgKyByZXBvX2lkKTtcblxuICAgIHZhciBSZXBvc2l0b3J5SWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKFJlcG9zaXRvcnlJZCA9PT0gbnVsbCB8fCBSZXBvc2l0b3J5SWQgPT09ICcnIHx8IHR5cGVvZiBSZXBvc2l0b3J5SWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsb2coXCJ0cnlpbmcgdG8gZ2V0IHJlcG8gaWRcIik7XG5cbiAgICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XS8pO1xuXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgTWVzc2FnZTogJ1JlcG9zaXRvcnkgSWQgTm90IFNwZWNpZmllZCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIFJlcG9JZCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVwb0lkICE9PSAnJyAmJiBSZXBvSWQgIT09IG51bGwpIHtcbiAgICAgICAgbG9nKFwicmVwbyBmb3VuZCBpZDogXCIgKyBSZXBvSWQpO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIE1lc3NhZ2U6ICdTdWNjZXNzJyxcbiAgICAgICAgICBPcHRpb25zOiB7XG4gICAgICAgICAgICBSZXNwb3NpdG9yeUlkOiBSZXBvSWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG5cbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNHaXQpIHtcbiAgICAgIGxvZyhcImlzIEdpdCAuLlwiKVxuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGxvZyhcIm5vdCBnaXRcIik7XG4gICAgICBsb2coXCJ2aWV3IG9ialwiICsgVmFsaWRVcmxPYmplY3QpXG4gICAgICBjb25zb2xlLmRpcihWYWxpZFVybE9iamVjdCwgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2QsXG4gICAgICAgIFVUeXBlOiBWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cblxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIC8vaWYgL3JlcG8gY29tZXMgYWZ0ZXIgQHNjcnVtYm90LCBubyByZXBvIGlkIHByb3ZpZGVkIGVsc2UgdGFrZSB3aGF0ZXZlciBjb21lcyBhZnRlciBAc2NydW1ib3QgYXMgcmVwb19pZFxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSBWYWxpZENvbW1hbmRzWzFdKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIgKyBGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiICsgcmVwb19pZCArIFwiIGZyb20gbWVzc2FnZSBhcmcgYXQgcG9zIDEgPSBcIiArIENvbW1hbmRBcnJbMV0pO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuXG4gICAgbG9nKFwicmVwbyBpZCAyIDogXCIgKyByZXBvX2lkKTtcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gRmluYWxDb21tYW5kO1xuICB9LFxuXG4gIHZhbGlkYXRlQ29tbWFuZHM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICBsb2coXCJ2YWxpZGF0ZUNvbW1hbmRzXCIpO1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Db21tYW5kO1xuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuICAgIGlmIChSZXBvUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKTtcblxuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKEJsb2NrZWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEJsb2NrVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKElzc3VlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiAnd3JvbmdDb21tYW5kJyxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbFxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc29sZS5kaXIoVXJsT2JqZWN0LCB7IGRlcHRoOiBudWxsIH0pO1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgfSxcblxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBsb2coXCJtYWtlUmVxdWVzdFwiKTtcbiAgICBsb2cob3B0aW9ucy5VQm9keSlcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVG9rZW4gPSBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU47XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuemVuaHViLmlvLyc7XG5cbiAgICB2YXIgVXNlclVybCA9IG9wdGlvbnMuVVVybDtcbiAgICB2YXIgYm9keTtcblxuICAgIGlmIChvcHRpb25zLlVCb2R5ID09IG51bGwpIHtcbiAgICAgIGJvZHkgPSB7IGtleTogJ3ZhbHVlJyB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkgPSBvcHRpb25zLlVCb2R5O1xuXG4gICAgfVxuXG4gICAgdmFyIFVNZXRob2QgPSBvcHRpb25zLlVNZXRob2Q7XG4gICAgdmFyIFVybFR5cGUgPSBvcHRpb25zLlVUeXBlO1xuICAgIGxvZyhcInVybHR5cGUgOiBcIitVcmxUeXBlKVxuXG4gICAgY29uc29sZS5kaXIoJ1VybGJvZHk6ICcgKyBib2R5LCB7IGRlcHRoOiBudWxsIH0pO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICBtZXRob2Q6IFVNZXRob2QsXG4gICAgICB1cmk6IE1haW5VcmwgKyBVc2VyVXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgICAgLFxuXG4gICAgICAvL2JvZHk6IHtcbiAgICAgIGJvZHlcblxuICAgICAgLy99XG4gICAgfTtcblxuICAgIGNvbnNvbGUuZGlyKFVybE9wdGlvbnMsIHsgZGVwdGg6IG51bGwgfSk7XG4gICAgaWYgKFVzZXJVcmwgPT09ICd3cm9uZ0NvbW1hbmQnKSB7XG4gICAgICBsb2coVXNlclVybClcbiAgICAgIHJldHVybiBycCh7XG4gICAgICAgIHVyaTogJ2FwaS5naXRodWIuY29tJyxcbiAgICBcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdVc2VyLUFnZW50JzogJ3NpbXBsZV9yZXN0X2FwcCcsXG4gICAgICAgIH0sXG4gICAgICAgIHFzOiB7XG4gICAgICAgICAgY2xpZW50X2lkOiBwcm9jZXNzLmVudi5HSVRfQ0xJRU5UX0lELFxuICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHByb2Nlc3MuZW52LkdJVF9DTElFTlRfU0VDUkVUXG4gICAgICAgIH0sXG4gICAgICAgIGpzb246IHRydWVcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKXtcbiAgICAgICAgdmFyIGVyck1lc3NhZ2UgPSAnV3JvbmcgQ29tbWFuZCc7XG4gICAgICAgIHJldHVybiBlcnJNZXNzYWdlO1xuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIERhdGEgPSBzdWNjZXNzZGF0YTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvbGxvd2luZyBEYXRhID0nICsgSlNPTi5zdHJpbmdpZnkoRGF0YSkpO1xuXG4gICAgICAgIC8vUGFyc2UgSlNPTiBhY2NvcmRpbmcgdG8gb2JqIHJldHVybmVkXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnSXNzdWVFdmVudHMnKSB7XG4gICAgICAgICAgbG9nKFwiRXZlbnRzIGZvciBpc3N1ZVwiKTtcbiAgICAgICAgICBEYXRhID0gJ1xcbiAgICAqSGVyZSBhcmUgdGhlIG1vc3QgcmVjZW50IGV2ZW50cyByZWdhcmRpbmcgeW91ciBpc3N1ZToqICc7XG5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1Y2Nlc3NkYXRhLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgICAgIGlmIChzdWNjZXNzZGF0YVtpXS50eXBlID09PSAndHJhbnNmZXJJc3N1ZScpIHtcbiAgICAgICAgICAgICAgbG9nKFwicGlwZWxpbmUgbW92ZSBldmVudFwiICsgSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUpICsgc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZSk7XG4gICAgICAgICAgICAgIERhdGEgKz0gJ1xcbipVc2VyICcgKyBzdWNjZXNzZGF0YVtpXS51c2VyX2lkICsgJyogX21vdmVkXyB0aGlzIGlzc3VlIGZyb20gJyArIHN1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUubmFtZSArICcgdG8gJyArIHN1Y2Nlc3NkYXRhW2ldLnRvX3BpcGVsaW5lLm5hbWUgKyAnIG9uIGRhdGUgOiAnICsgZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICdlc3RpbWF0ZUlzc3VlJykge1xuICAgICAgICAgICAgICBsb2coXCJlc3RpbWF0ZSBjaGFuZ2UgZXZlbnQgXCIgKyBpKTtcbiAgICAgICAgICAgICAgRGF0YSArPSAnXFxuICpVc2VyICcgKyBzdWNjZXNzZGF0YVtpXS51c2VyX2lkICsgJyogX2NoYW5nZWQgZXN0aW1hdGVfIG9uIHRoaXMgaXNzdWUgdG8gICcgKyBzdWNjZXNzZGF0YVtpXS50b19lc3RpbWF0ZS52YWx1ZSArICcgb24gZGF0ZSA6ICcgKyBkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgRGF0YSArPSBcIkRvIG5vdCByZWNvZ25pemUgZXZlbnQgdHlwZVwiXG4gICAgICAgICAgICAgIGxvZyhcImRvIG5vdCByZWNvZ2lzZSBldmVudCB0eXBlXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgICAgIERhdGEgKz0gXCIgXCI7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChVcmxUeXBlID09PSAnR2V0UGlwZWxpbmUnKSB7XG5cbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIlRoYXQgaXNzdWUgaXMgY3VycmVudGx5IGluIFwiICsgc3VjY2Vzc2RhdGEucGlwZWxpbmUubmFtZSArIFwiIHBpcGVsaW5lLlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoVXJsVHlwZSA9PT0gJ0lzc3VlRXN0aW1hdGUnKSB7XG4gICAgICAgICAgRGF0YSA9ICcnO1xuICAgICAgICAgIERhdGEgKz0gJ1lvdXIgSXNzdWVcXCdzIGVzdGltYXRlIGhhcyBiZWVuIHVwZGF0ZWQgdG8gJyArIHN1Y2Nlc3NkYXRhLmVzdGltYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoVXJsVHlwZSA9PT0gJ0VwaWNJc3N1ZXMnKSB7XG5cbiAgICAgICAgICBEYXRhID0gXCJUaGUgZm9sbG93aW5nIEVwaWNzIGFyZSBpbiB5b3VyIHNjcnVtYm9hcmQ6IFwiO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIERhdGEgKz0gYFxcbiBFcGljIElEOiAgJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV9udW1iZXJ9IFVybCA6ICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfdXJsfSBgXG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChVcmxUeXBlID09PSAnSXNzdWVUb1BpcGVsaW5lcycpIHtcbiAgICAgICAgICBEYXRhID0gXCJcIjtcbiAgICAgICAgICBEYXRhICs9ICdTdWNlc3NmdWxseSBNb3ZlZCBJc3N1ZSdcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgRGF0YSA9IFwiQ29tbWFuZCBwYXJhbWV0ZXJzIG5vdCBhY2NlcHRlZFwiO1xuICAgICAgICB9XG4gICAgICAgIGxvZyhcIlN1Y2Nlc3MgRGF0YSA6IFwiICsgRGF0YSlcbiAgICAgICAgcmV0dXJuIERhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzIGZvbGxvd2luZyBlcnJvciA9JyArIGVycik7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9KTtcblxuICB9LFxuXG5cbiAgLy8gVG8gR2V0IFJlcG9zaXRvcnkgSWRcbiAgZ2V0UmVzcG9zaXRvcnlJZDogZnVuY3Rpb24gKE9wdGlvbnMpIHtcbiAgICBsb2coXCJnZXRSZXBvc2l0b3J5SWRcIik7XG4gICAgdmFyIHJlcyA9IE9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHJlcSA9IE9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBPcHRpb25zLnJlcG9OYW1lO1xuICAgIHZhciBPd25lcm5hbWUgPSBPcHRpb25zLkdpdE93bmVyTmFtZTtcbiAgICB2YXIgUmVwb3NpdG9yeVVybCA9ICdyZXBvcy8nICsgT3duZXJuYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nO1xuICAgIGxvZyhSZXBvc2l0b3J5TmFtZSlcbiAgICAvL2NvbnNvbGUuZGlyKG9wdGlvbnMse2RlcHRoOm5sbH0pXG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIHVyaTogTWFpblVybCArIFJlcG9zaXRvcnlVcmwsXG4gICAgICBxczoge1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgUmVwb0lkID0gc3VjY2Vzc2RhdGEuaWQ7XG5cblxuICAgICAgICByZXBvX2lkID0gUmVwb0lkO1xuICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzZGF0YSk7XG4gICAgICAgIHJldHVybiBcIlRoZSAqUmVwb3NpdG9yeSBJZCogZm9yIF9cIiArIFJlcG9zaXRvcnlOYW1lICsgXCJfIGlzIFwiICsgSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGEuaWQpICsgXCIgKnJlcG8gbGluayogOiBcIiArIHN1Y2Nlc3NkYXRhLmh0bWxfdXJsO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGxvZyhcIkFQSSBjYWxsIGZhaWxlZC4uLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgICAgcmV0dXJuIFwiTm8gcmVwb3NpdG9yeSB3aXRoIG5hbWUgOiBcIiArIFJlcG9zaXRvcnlOYW1lICsgXCIgZXhpc3RzXCJcblxuICAgICAgfSk7XG5cbiAgfSxcblxuICAvLyBUbyBHZXQgUmVwbyBVcmxcbiAgZ2V0UmVwb1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKSB7XG5cbiAgICBsb2coXCJnZXRSZXBvVXJsXCIpO1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEdpdE93bmVyTmFtZSA9ICd4MDAwNjY5NDknO1xuICAgIHZhciBSZXBvc2l0b3J5SWQgPSAncmVwb3MvJyArIEdpdE93bmVyTmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IFJlcG9zaXRvcnlJZCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IHRydWVcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuICAvL1RvIEdldCBJc3N1ZSByZWxhdGVkIFVybFxuICBnZXRJc3N1ZVVybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRJc3N1ZVVybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZVxuICAgIH07XG5cbiAgICAvL1RvIEdldCBTdGF0ZSBvZiBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICBpZiAoUGlwZWxpbmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJpc3N1ZSBOdW0gaW4gZ2V0SVNzdWVVcmwgOiBcIiArIElzc3VlTm8pO1xuICAgICAgdmFyIFBpcGVMaW5ldXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFBpcGVMaW5ldXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdHZXRQaXBlbGluZSdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG5cbiAgICAvLyBNb3ZlIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cblxuICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRQaXBlbGluZUlkKENvbW1hbmRBcnIsXG4gICAgICAgIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgbG9nKCdtb3ZlZCBpc3N1ZScpO1xuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIC8vIEdldCBldmVudHMgZm9yIHRoZSBJc3N1ZSBcbiAgICB2YXIgRXZlbnRzUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzZXZlbnRzLyk7XG5cbiAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiaXNzdWUgbm8gZXZlbnRzcmVnZXggXCIgKyBJc3N1ZU5vKTtcbiAgICAgIHZhciBFdmVudHNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2V2ZW50cyc7XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogRXZlbnRzVXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdJc3N1ZUV2ZW50cydcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG5cbiAgICAvLyBTZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgIGlmIChFc3RpbWF0ZUFkZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIHZhciBFc3RpbWF0ZVZhbCA9IENvbW1hbmRBcnJbNF07XG4gICAgICBsb2coXCJFc3RpbWF0ZVZhbCA6IFwiICsgRXN0aW1hdGVWYWwpXG4gICAgICB2YXIgU2V0RXN0aW1hdGUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2VzdGltYXRlJztcblxuICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICBlc3RpbWF0ZTogRXN0aW1hdGVWYWxcbiAgICAgIH07XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogU2V0RXN0aW1hdGUsXG4gICAgICAgIE1ldGhvZDogJ1BVVCcsXG4gICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdJc3N1ZUVzdGltYXRlJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cbiAgICAvLyBHZXQgQnVncyBieSB0aGUgdXNlclxuICAgIHZhciBCdWdSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNidWcvKTtcblxuICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnQnVnSXNzdWVzJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vVG8gR2V0IFVzZXIgSXNzdWUgYnkgdXNlciwgdXNlcklzc3VlXG4gICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgaWYgKFVzZXJSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgVXNlclVybCA9ICcnO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFVzZXJVcmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ1VzZXJJc3N1ZXMnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICBsb2coXCJnZXRCbG9ja1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEJsb2NrdXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogQmxvY2t1cmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6ICdCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICBsb2coXCJnZXRFcGljVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBFcGljVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvZXBpY3MnO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6ICdFcGljSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vZ2l2ZW4sIHBpcGVsaW5lIG5hbWUsIHJldHVybiBwaXBlbGluZSBpZFxuICBnZXRQaXBlbGluZUlkOiBmdW5jdGlvbiAoQ29tbWFuZEFyciwgY2IpIHtcbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgdmFyIFBpcGVsaW5lTmFtZSA9IENvbW1hbmRBcnJbNF07XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgIHBpcGVsaW5lX2lkOiAnNWEwODhiNjM4ZjQ2NDcwOWNkMmM3N2M1JyxcbiAgICAgIC8vcGlwZWxpbmVfaWQ6IG5ld1BJRCxcbiAgICAgIHBvc2l0aW9uOiAnMCdcbiAgICB9O1xuICAgIHZhciBVcmxPYmplY3QgPSB7XG5cbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJyxcbiAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOiAnSXNzdWVUb1BpcGVsaW5lcydcbiAgICB9XG5cbiAgICBsb2coXCJlbnRlcmVkIG5hbWUgOiBcIiArIFBpcGVsaW5lTmFtZSlcbiAgICAvL3ZhciBQaXBlbGluZUlkO1xuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgdmFyIGRhdGE7XG4gICAgcmVxdWVzdC5nZXQocGlwZWxpbmVJZFJlcXVlc3QsIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgY29uc29sZS5kaXIocmVzLmJvZHksIHsgZGVwdGg6IG51bGwgfSlcbiAgICAgICAgcmV0dXJuIHJlcy5ib2R5XG4gICAgICAgIGRhdGEgPSByZXMuYm9keTtcbiAgICAgICAgdmFyIG5ld1BJRDtcblxuICAgICAgICBsb2coZGF0YSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGxvZyhcImNoZWNraW5nXCIpXG4gICAgICAgICAgaWYgKGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWUgPT09IFBpcGVsaW5lTmFtZSkge1xuICAgICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIiArIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICAgIG5ld1BJRCA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcblxuICAgICAgICBsb2coXCJQaXBlbGluZSBnb3QgKHVzaW5nIGRhdGEpOiBcIiArIG5ld1BJRCk7XG4gICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNV0gfCAwO1xuICAgICAgICBsb2coXCJwb3NpdGlvbjogXCIgKyBQb3NObylcbiAgICAgICAgdmFyIE1vdmVJc3N1ZVBpcGVMaW5lID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3Zlcyc7XG4gICAgICAgIGxvZyhcImJ1aWxkaW5nIG1vdmUgcGlwZWxpbmUgdXJsLi5cIilcblxuICAgICAgICBNb3ZlQm9keSA9IHtcbiAgICAgICAgICAvL3BpcGVsaW5lX2lkOiAnNWEwODhiNjM4ZjQ2NDcwOWNkMmM3N2M1JyxcbiAgICAgICAgICBwaXBlbGluZV9pZDogbmV3UElELFxuICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgIH07XG5cblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBNb3ZlSXNzdWVQaXBlTGluZSxcbiAgICAgICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTogJ0lzc3VlVG9QaXBlbGluZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgbG9nKFwidXJsIGJ1aWx0LlwiKTtcblxuICAgICAgICBjYihudWxsLCByZXMuYm9keSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZyhlcnIgKyByZXMuc3RhdHVzQ29kZSlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0pXG4gICAgLy8udGhlbigoZGF0YSkgPT4ge1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgICAvKn0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIiArIGVycilcbiAgICAgIHJldHVybiBlcnI7XG4gICAgfSkqL1xuICB9XG5cblxufTtcbiJdfQ==