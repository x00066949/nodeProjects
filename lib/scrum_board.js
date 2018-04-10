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
      var PipelineName = CommandArr[4];
      var PipelineId;
      //get pipeline id
      //var PipelineId;
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
          log("checking");
          if (data['pipelines'][i].name === PipelineName) {
            log("found pipeline id : " + data['pipelines'][i].id);
            PipelineId = data['pipelines'][i].id;
            return PipelineId;
          }
        }

        log("did not find id corresponding to pipe name");
      }).then(function (data) {

        //if moving pipeline, 3rd arg is issue num,  4th = -p, 5th = pipeline, 6t position
        var IssueNo = CommandArr[2];
        log("name used " + CommandArr[4]);

        log("Pipeline got (using data): " + PipelineId);
        var PosNo = CommandArr[5] | 0;
        log("position: " + PosNo);
        var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';
        log("building move pipeline url..");

        var MoveBody = {
          //pipeline_id: '5a088b638f464709cd2c77c5',
          pipeline_id: PipelineId,
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
      /*
        .catch((err) => {
          console.log("error = " + err)
          return err;
        })*/
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
  }

};

//given, pipeline name, return pipeline id
var getPipelineId = function getPipelineId(PipelineName) {
  log("entered name : " + PipelineName);
  //var PipelineId;
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
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJyZXF1ZXN0IiwiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsIm9zIiwibG9nIiwicmVwb19pZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjYWxsTWUiLCJvcHRpb25zIiwicmVxIiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiYm9keSIsImtleSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJ1cmkiLCJxcyIsImFjY2Vzc190b2tlbiIsImhlYWRlcnMiLCJqc29uIiwidGhlbiIsInN1Y2Nlc3NkYXRhIiwiRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJpIiwibGVuZ3RoIiwidHlwZSIsInRvX3BpcGVsaW5lIiwiZnJvbV9waXBlbGluZSIsInVzZXJfaWQiLCJuYW1lIiwiY3JlYXRlZF9hdCIsInRvX2VzdGltYXRlIiwidmFsdWUiLCJwaXBlbGluZSIsImVzdGltYXRlIiwiZXBpY19pc3N1ZXMiLCJpc3N1ZV9udW1iZXIiLCJpc3N1ZV91cmwiLCJjYXRjaCIsImVyciIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaWQiLCJodG1sX3VybCIsIlJlc3Bvc2l0cm95SWQiLCJQaXBlbGluZVJlZ2V4IiwiSXNzdWVObyIsIlBpcGVMaW5ldXJsIiwiUGlwZWxpbmVNb3ZlUmVnZXgiLCJQaXBlbGluZU5hbWUiLCJQaXBlbGluZUlkIiwicGlwZWxpbmVJZFJlcXVlc3QiLCJkYXRhIiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkVzdGltYXRlVmFsIiwiU2V0RXN0aW1hdGUiLCJCdWdSZWdleCIsIkJ1Z1VybCIsIlVzZXJSZWdleCIsIkJsb2NrdXJsIiwiRXBpY1VybCIsImdldFBpcGVsaW5lSWQiXSwibWFwcGluZ3MiOiI7O0FBQUE7OzRCQUFZQSxPOztBQVFaOzs7Ozs7OztBQVBBLElBQUlDLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FBS0QsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUUsUUFB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IiwiZmlsZSI6InNjcnVtX2JvYXJkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcmVxdWVzdCBmcm9tICdyZXF1ZXN0JztcbnZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciBSZWdleCA9IHJlcXVpcmUoJ3JlZ2V4Jyk7XG52YXIgZGF0ZUZvcm1hdCA9IHJlcXVpcmUoJ2RhdGVmb3JtYXQnKTtcbnZhciBvcyA9IHJlcXVpcmUoXCJvc1wiKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIHJlcG9faWQ7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cbiAgY2FsbE1lOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHRlc3QgPSBvcHRpb25zLnRlc3Q7XG5cbiAgICB2YXIgRmluYWxEYXRhID0ge1xuICAgICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICAgIFwiQ2hlY2tcIjogdGVzdFxuICAgIH07XG5cbiAgICByZXR1cm4gRmluYWxEYXRhO1xuICB9LFxuXG4gIGdldFNjcnVtRGF0YShvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVzZXJJbnB1dDtcblxuICAgIHZhciBGaW5hbE1lc3NhZ2UgPSBudWxsO1xuICAgIC8vICAgTWVzc2FnZSA6IG51bGwsXG4gICAgLy8gICBPcHRpb25zIDogbnVsbFxuICAgIC8vIH07XG5cbiAgICB2YXIgQ2hlY2tJZlZhbGlkQ29tbWFuZCA9IHRoaXMuY2hlY2tWYWxpZElucHV0KHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBVQ29tbWFuZDogVXNlckNvbW1hbmRcbiAgICB9KTtcblxuICAgIGlmICghQ2hlY2tJZlZhbGlkQ29tbWFuZCkge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZFZhbHVlID0gdGhpcy5nZXRDb21tYW5kKFVzZXJDb21tYW5kKTtcblxuICAgIGxvZyhcImNvbW1hbmQgdmFsIDogXCIgKyBDb21tYW5kVmFsdWUpO1xuXG4gICAgaWYgKENvbW1hbmRWYWx1ZSA9PT0gJycgfHwgQ29tbWFuZFZhbHVlID09PSBudWxsIHx8IHR5cGVvZiBDb21tYW5kVmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIC8vZ2V0IHJlcG8gaWRcbiAgICB2YXIgQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgIHZhciBSZXBvTmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICBsb2coXCJyZXBvIGlkIDEgOiBcIiArIHJlcG9faWQpO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoUmVwb3NpdG9yeUlkID09PSBudWxsIHx8IFJlcG9zaXRvcnlJZCA9PT0gJycgfHwgdHlwZW9mIFJlcG9zaXRvcnlJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGxvZyhcInRyeWluZyB0byBnZXQgcmVwbyBpZFwiKTtcblxuICAgICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldLyk7XG5cbiAgICAgIGlmICghUmVwb1JlZ2V4LnRlc3QoQ29tbWFuZFZhbHVlKSkge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgICBNZXNzYWdlOiAnUmVwb3NpdG9yeSBJZCBOb3QgU3BlY2lmaWVkJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgUmVwb0lkICE9PSAndW5kZWZpbmVkJyAmJiBSZXBvSWQgIT09ICcnICYmIFJlcG9JZCAhPT0gbnVsbCkge1xuICAgICAgICBsb2coXCJyZXBvIGZvdW5kIGlkOiBcIiArIFJlcG9JZCk7XG5cbiAgICAgICAgUmVwb0lkID0gcmVwb19pZDtcblxuICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgTWVzc2FnZTogJ1N1Y2Nlc3MnLFxuICAgICAgICAgIE9wdGlvbnM6IHtcbiAgICAgICAgICAgIFJlc3Bvc2l0b3J5SWQ6IFJlcG9JZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogUmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZTogJ3gwMDA2Njk0OSdcblxuICAgICAgfSk7XG5cbiAgICB9XG5cblxuICAgIGxvZyhcImdldCB1cmxcIik7XG4gICAgdmFyIFZhbGlkVXJsT2JqZWN0ID0gdGhpcy52YWxpZGF0ZUNvbW1hbmRzKHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBDb21tYW5kOiBDb21tYW5kVmFsdWVcbiAgICB9KTtcblxuXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIENvbW1hbmRzJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgbG9nKFwiaXMgR2l0IC4uXCIpXG4gICAgICB2YXIgVUNvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBHaXRSZXBvTmFtZSA9IFVDb21tYW5kQXJyWzFdO1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogR2l0UmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZTogJ3gwMDA2Njk0OSdcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgbG9nKFwibm90IGdpdFwiKTtcbiAgICAgIGxvZyhcInZpZXcgb2JqXCIgKyBWYWxpZFVybE9iamVjdClcbiAgICAgIGNvbnNvbGUuZGlyKFZhbGlkVXJsT2JqZWN0LCB7IGRlcHRoOiBudWxsIH0pXG4gICAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdCh7XG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIFVVcmw6IFZhbGlkVXJsT2JqZWN0LlVybCxcbiAgICAgICAgVUJvZHk6IFZhbGlkVXJsT2JqZWN0LkJvZHksXG4gICAgICAgIFVNZXRob2Q6IFZhbGlkVXJsT2JqZWN0Lk1ldGhvZCxcbiAgICAgICAgVVR5cGU6IFZhbGlkVXJsT2JqZWN0LlVybFR5cGVcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIH0sXG5cbiAgY2hlY2tWYWxpZElucHV0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFZhbGlkQml0ID0gZmFsc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5VQ29tbWFuZDtcbiAgICBjb25zb2xlLmxvZyhcInVzZXIgY29tbWFuZCA6IFwiICsgVXNlckNvbW1hbmQpO1xuXG4gICAgdmFyIFZhbGlkQ29tbWFuZHMgPSBbJ0BzY3J1bWJvdCcsICcvcmVwbycsICcvaXNzdWUnLCAnL2VwaWMnLCAnL2Jsb2NrZWQnXTtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIFZhbGlkQ29tbWFkUmVnZXggPSBuZXcgUmVnRXhwKC9eKEBzY3J1bWJvdClcXHNbXFwvQS1aYS16XSovKTtcbiAgICBjb25zb2xlLmxvZyhcInByb2Nlc3NpbmcgbWVzc2FnZSA6IFwiICsgVXNlckNvbW1hbmQpO1xuXG5cbiAgICBpZiAoIVZhbGlkQ29tbWFkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcbiAgICAgIGxvZyhcIkVycm9yIG5vdCBzdGFydGluZyB3aXRoIEBzY3J1bWJvdFwiKVxuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuXG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgLy9pZiAvcmVwbyBjb21lcyBhZnRlciBAc2NydW1ib3QsIG5vIHJlcG8gaWQgcHJvdmlkZWQgZWxzZSB0YWtlIHdoYXRldmVyIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCBhcyByZXBvX2lkXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09IFZhbGlkQ29tbWFuZHNbMV0pIHtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzJdO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuXG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuICAgIGxvZyhcIkZpbmFsIENvbW1hbmQgOiBcIiArIEZpbmFsQ29tbWFuZCk7XG5cbiAgICByZXR1cm4gVmFsaWRCaXQgPSB0cnVlO1xuICB9LFxuXG4gIGdldENvbW1hbmQ6IGZ1bmN0aW9uIChVQ29tbWFuZCkge1xuICAgIGxvZyhcImdldENvbW1hbmRcIik7XG4gICAgdmFyIFZhbGlkQml0ID0gJyc7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gVUNvbW1hbmQ7XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IHR5cGVvZiBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09ICcvcmVwbycpIHtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiZmlyc3RseSBpbml0aWFsaXNpaW5nIHJlcG9faWQgYXMgXCIgKyByZXBvX2lkICsgXCIgZnJvbSBtZXNzYWdlIGFyZyBhdCBwb3MgMSA9IFwiICsgQ29tbWFuZEFyclsxXSk7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG5cbiAgICBsb2coXCJyZXBvIGlkIDIgOiBcIiArIHJlcG9faWQpO1xuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBGaW5hbENvbW1hbmQ7XG4gIH0sXG5cbiAgdmFsaWRhdGVDb21tYW5kczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIGxvZyhcInZhbGlkYXRlQ29tbWFuZHNcIik7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLkNvbW1hbmQ7XG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsXG4gICAgfTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgSXNzdWVSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvaXNzdWVdKlxcc1swLTldKlxcc1swLTldKlxccygtdXxidWd8cGlwZWxpbmV8LXB8ZXZlbnRzfC1lKS8pO1xuICAgIHZhciBFcGljUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2VwaWNdKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBCbG9ja2VkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvYmxvY2tlZC8pO1xuXG4gICAgaWYgKFJlcG9SZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldFJlcG9VcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpO1xuXG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoQmxvY2tlZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0QmxvY2tVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoSXNzdWVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKEVwaWNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEVwaWNVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBsb2coXCJVcmxPYmplY3QgPSBcIiArIFVybE9iamVjdCk7XG4gICAgcmV0dXJuIFVybE9iamVjdDtcblxuICB9LFxuXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGxvZyhcIm1ha2VSZXF1ZXN0XCIpO1xuICAgIGxvZyhvcHRpb25zLlVCb2R5KVxuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBUb2tlbiA9IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTjtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS56ZW5odWIuaW8vJztcblxuICAgIHZhciBVc2VyVXJsID0gb3B0aW9ucy5VVXJsO1xuICAgIHZhciBib2R5O1xuXG4gICAgaWYgKG9wdGlvbnMuVUJvZHkgPT0gbnVsbCkge1xuICAgICAgYm9keSA9IHsga2V5OiAndmFsdWUnIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgYm9keSA9IG9wdGlvbnMuVUJvZHk7XG5cbiAgICB9XG5cbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcbiAgICB2YXIgVXJsVHlwZSA9IG9wdGlvbnMuVVR5cGU7XG5cbiAgICBjb25zb2xlLmRpcignVXJsYm9keTogJyArIGJvZHksIHsgZGVwdGg6IG51bGwgfSk7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogVU1ldGhvZCxcbiAgICAgIHVyaTogTWFpblVybCArIFVzZXJVcmwsXG4gICAgICBxczoge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgICAsXG5cbiAgICAgIC8vYm9keToge1xuICAgICAgYm9keVxuXG4gICAgICAvL31cbiAgICB9O1xuXG4gICAgY29uc29sZS5kaXIoVXJsT3B0aW9ucywgeyBkZXB0aDogbnVsbCB9KTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcblxuICAgICAgICAvL1BhcnNlIEpTT04gYWNjb3JkaW5nIHRvIG9iaiByZXR1cm5lZFxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0lzc3VlRXZlbnRzJykge1xuICAgICAgICAgIGxvZyhcIkV2ZW50cyBmb3IgaXNzdWVcIik7XG4gICAgICAgICAgRGF0YSA9ICdcXG4gICAgKkhlcmUgYXJlIHRoZSBtb3N0IHJlY2VudCBldmVudHMgcmVnYXJkaW5nIHlvdXIgaXNzdWU6KiAnO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzZGF0YS5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgICBpZiAoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ3RyYW5zZmVySXNzdWUnKSB7XG4gICAgICAgICAgICAgIGxvZyhcInBpcGVsaW5lIG1vdmUgZXZlbnRcIiArIEpTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhW2ldLnRvX3BpcGVsaW5lKSArIHN1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4qVXNlciAnICsgc3VjY2Vzc2RhdGFbaV0udXNlcl9pZCArICcqIF9tb3ZlZF8gdGhpcyBpc3N1ZSBmcm9tICcgKyBzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lLm5hbWUgKyAnIHRvICcgKyBzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZS5uYW1lICsgJyBvbiBkYXRlIDogJyArIGRhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ2VzdGltYXRlSXNzdWUnKSB7XG4gICAgICAgICAgICAgIGxvZyhcImVzdGltYXRlIGNoYW5nZSBldmVudCBcIiArIGkpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4gKlVzZXIgJyArIHN1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQgKyAnKiBfY2hhbmdlZCBlc3RpbWF0ZV8gb24gdGhpcyBpc3N1ZSB0byAgJyArIHN1Y2Nlc3NkYXRhW2ldLnRvX2VzdGltYXRlLnZhbHVlICsgJyBvbiBkYXRlIDogJyArIGRhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBEYXRhICs9IFwiRG8gbm90IHJlY29nbml6ZSBldmVudCB0eXBlXCJcbiAgICAgICAgICAgICAgbG9nKFwiZG8gbm90IHJlY29naXNlIGV2ZW50IHR5cGVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgICAgRGF0YSArPSBcIiBcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnR2V0UGlwZWxpbmUnKSB7XG5cbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIlRoYXQgaXNzdWUgaXMgY3VycmVudGx5IGluIFwiICsgc3VjY2Vzc2RhdGEucGlwZWxpbmUubmFtZSArIFwiIHBpcGVsaW5lLlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFVybFR5cGUgPT09ICdJc3N1ZUVzdGltYXRlJykge1xuICAgICAgICAgIERhdGEgPSAnJztcbiAgICAgICAgICBEYXRhICs9ICdZb3VyIElzc3VlXFwncyBlc3RpbWF0ZSBoYXMgYmVlbiB1cGRhdGVkIHRvICcgKyBzdWNjZXNzZGF0YS5lc3RpbWF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnRXBpY0lzc3VlcycpIHtcblxuICAgICAgICAgIERhdGEgPSBcIlRoZSBmb2xsb3dpbmcgRXBpY3MgYXJlIGluIHlvdXIgc2NydW1ib2FyZDogXCI7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWNjZXNzZGF0YS5lcGljX2lzc3Vlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgRGF0YSArPSBgXFxuIEVwaWMgSUQ6ICAke3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX251bWJlcn0gVXJsIDogJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV91cmx9IGBcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnSXNzdWVUb1BpcGVsaW5lcycpIHtcbiAgICAgICAgICBEYXRhID0gXCJcIjtcbiAgICAgICAgICBEYXRhICs9ICdTdWNlc3NmdWxseSBNb3ZlZCBJc3N1ZSdcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZyhcIlN1Y2Nlc3MgRGF0YSA6IFwiICsgRGF0YSlcbiAgICAgICAgcmV0dXJuIFwiQ29tbWFuZCBwYXJhbWV0ZXJzIG5vdCBhY2NlcHRlZFwiO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyBmb2xsb3dpbmcgZXJyb3IgPScgKyBlcnIpO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfSk7XG5cbiAgfSxcblxuXG4gIC8vIFRvIEdldCBSZXBvc2l0b3J5IElkXG4gIGdldFJlc3Bvc2l0b3J5SWQ6IGZ1bmN0aW9uIChPcHRpb25zKSB7XG4gICAgbG9nKFwiZ2V0UmVwb3NpdG9yeUlkXCIpO1xuICAgIHZhciByZXMgPSBPcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciByZXEgPSBPcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gT3B0aW9ucy5yZXBvTmFtZTtcbiAgICB2YXIgT3duZXJuYW1lID0gT3B0aW9ucy5HaXRPd25lck5hbWU7XG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcbiAgICBsb2coUmVwb3NpdG9yeU5hbWUpXG4gICAgLy9jb25zb2xlLmRpcihvcHRpb25zLHtkZXB0aDpubGx9KVxuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICB1cmk6IE1haW5VcmwgKyBSZXBvc2l0b3J5VXJsLFxuICAgICAgcXM6IHtcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuXG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc2RhdGEpO1xuICAgICAgICByZXR1cm4gXCJUaGUgKlJlcG9zaXRvcnkgSWQqIGZvciBfXCIgKyBSZXBvc2l0b3J5TmFtZSArIFwiXyBpcyBcIiArIEpTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhLmlkKSArIFwiICpyZXBvIGxpbmsqIDogXCIgKyBzdWNjZXNzZGF0YS5odG1sX3VybDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBsb2coXCJBUEkgY2FsbCBmYWlsZWQuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICAgIHJldHVybiBcIk5vIHJlcG9zaXRvcnkgd2l0aCBuYW1lIDogXCIgKyBSZXBvc2l0b3J5TmFtZSArIFwiIGV4aXN0c1wiXG5cbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2VcbiAgICB9O1xuXG4gICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICB2YXIgUGlwZWxpbmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNwaXBlbGluZS8pO1xuXG4gICAgaWYgKFBpcGVsaW5lUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiaXNzdWUgTnVtIGluIGdldElTc3VlVXJsIDogXCIgKyBJc3N1ZU5vKTtcbiAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnR2V0UGlwZWxpbmUnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuXG4gICAgLy8gTW92ZSBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZU1vdmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtcFxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgaWYgKFBpcGVsaW5lTW92ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG4gICAgICB2YXIgUGlwZWxpbmVOYW1lID0gQ29tbWFuZEFycls0XTtcbiAgICAgIHZhciBQaXBlbGluZUlkO1xuICAgICAgLy9nZXQgcGlwZWxpbmUgaWRcbiAgICAgIC8vdmFyIFBpcGVsaW5lSWQ7XG4gICAgICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgICAgfSxcblxuICAgICAgICBqc29uOiB0cnVlXG4gICAgICB9O1xuICAgICAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgICAgIGlmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpIHtcbiAgICAgICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIiArIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICAgICAgUGlwZWxpbmVJZCA9IGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuICAgICAgICAgICAgICByZXR1cm4gUGlwZWxpbmVJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgICAgIH0pXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgIC8vaWYgbW92aW5nIHBpcGVsaW5lLCAzcmQgYXJnIGlzIGlzc3VlIG51bSwgIDR0aCA9IC1wLCA1dGggPSBwaXBlbGluZSwgNnQgcG9zaXRpb25cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgICBsb2coXCJuYW1lIHVzZWQgXCIgKyBDb21tYW5kQXJyWzRdKVxuXG5cbiAgICAgICAgbG9nKFwiUGlwZWxpbmUgZ290ICh1c2luZyBkYXRhKTogXCIgKyBQaXBlbGluZUlkKTtcbiAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls1XSB8IDA7XG4gICAgICAgIGxvZyhcInBvc2l0aW9uOiBcIiArIFBvc05vKVxuICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICAvL3BpcGVsaW5lX2lkOiAnNWEwODhiNjM4ZjQ2NDcwOWNkMmM3N2M1JyxcbiAgICAgICAgICBwaXBlbGluZV9pZDogUGlwZWxpbmVJZCxcbiAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOiAnSXNzdWVUb1BpcGVsaW5lcydcbiAgICAgICAgfTtcblxuICAgICAgICBsb2coXCJ1cmwgYnVpbHQuXCIpO1xuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfSk7XG4gICAgICAvKlxuICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIiArIGVycilcbiAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9KSovXG4gICAgfVxuXG4gICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgIHZhciBFdmVudHNSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNldmVudHMvKTtcblxuICAgIGlmIChFdmVudHNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJpc3N1ZSBubyBldmVudHNyZWdleCBcIiArIElzc3VlTm8pO1xuICAgICAgdmFyIEV2ZW50c1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXZlbnRzJztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBFdmVudHNVcmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0lzc3VlRXZlbnRzJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vIFNldCB0aGUgZXN0aW1hdGUgZm9yIHRoZSBpc3N1ZS5cbiAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgdmFyIEVzdGltYXRlVmFsID0gQ29tbWFuZEFycls0XTtcbiAgICAgIGxvZyhcIkVzdGltYXRlVmFsIDogXCIgKyBFc3RpbWF0ZVZhbClcbiAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgIGVzdGltYXRlOiBFc3RpbWF0ZVZhbFxuICAgICAgfTtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBTZXRFc3RpbWF0ZSxcbiAgICAgICAgTWV0aG9kOiAnUFVUJyxcbiAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0lzc3VlRXN0aW1hdGUnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgdmFyIEJ1Z1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc2J1Zy8pO1xuXG4gICAgaWYgKEJ1Z1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIHZhciBCdWdVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogQnVnVXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdCdWdJc3N1ZXMnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuXG4gICAgLy9UbyBHZXQgVXNlciBJc3N1ZSBieSB1c2VyLCB1c2VySXNzdWVcbiAgICB2YXIgVXNlclJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy11XFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBVc2VyVXJsID0gJyc7XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogVXNlclVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnVXNlcklzc3VlcydcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuXG4gIC8vVG8gR2V0IEJsb2NrZWQgSXNzdWVzIFVybFxuICBnZXRCbG9ja1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcblxuICAgIGxvZyhcImdldEJsb2NrVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgQmxvY2t1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgVXJsOiBCbG9ja3VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTogJ0Jsb2NrZWRJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cblxuICAvL1RvIEdldCBlcGljcyBVcmxcbiAgZ2V0RXBpY1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcblxuICAgIGxvZyhcImdldEVwaWNVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIEVwaWNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9lcGljcyc7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTogJ0VwaWNJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH1cblxufTtcblxuLy9naXZlbiwgcGlwZWxpbmUgbmFtZSwgcmV0dXJuIHBpcGVsaW5lIGlkXG52YXIgZ2V0UGlwZWxpbmVJZCA9IGZ1bmN0aW9uIChQaXBlbGluZU5hbWUpIHtcbiAgbG9nKFwiZW50ZXJlZCBuYW1lIDogXCIgKyBQaXBlbGluZU5hbWUpXG4gIC8vdmFyIFBpcGVsaW5lSWQ7XG4gIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICBoZWFkZXJzOiB7XG4gICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgIH0sXG5cbiAgICBqc29uOiB0cnVlXG4gIH07XG4gIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgaWYgKGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWUgPT09IFBpcGVsaW5lTmFtZSkge1xuICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIgKyBkYXRhWydwaXBlbGluZXMnXVtpXS5pZCk7XG4gICAgICAgICAgcmV0dXJuIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIgKyBlcnIpXG4gICAgICByZXR1cm4gZXJyO1xuICAgIH0pXG59XG4iXX0=