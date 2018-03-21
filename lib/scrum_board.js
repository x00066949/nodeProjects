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
    //var body = options.UBody | {key:'value'};
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
      log("name used " + CommandArr[4]);
      //this.getPipelineId(CommandArr[4]).then(function (data){
      return rp(this.getPipelineId(CommandArr[4])).then(function (data) {

        log("Pipeline got (using data): " + data);
        var PosNo = CommandArr[5] | 0;
        log("position: " + PosNo);
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
      }).catch(function (err) {
        var Error = err;
        log("failed...");
        console.log('User has %d repos', err);
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
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJkYXRlRm9ybWF0Iiwib3MiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsInBpcGVsaW5lSWRSZXF1ZXN0IiwidXJpIiwiaGVhZGVycyIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJqc29uIiwidGhlbiIsImRhdGEiLCJpIiwibGVuZ3RoIiwibmFtZSIsImlkIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwiTWFpblVybCIsIlVzZXJVcmwiLCJib2R5Iiwia2V5IiwiZGlyIiwiZGVwdGgiLCJVcmxPcHRpb25zIiwibWV0aG9kIiwicXMiLCJhY2Nlc3NfdG9rZW4iLCJzdWNjZXNzZGF0YSIsIkRhdGEiLCJKU09OIiwic3RyaW5naWZ5IiwidHlwZSIsInRvX3BpcGVsaW5lIiwiZnJvbV9waXBlbGluZSIsInVzZXJfaWQiLCJjcmVhdGVkX2F0IiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsInBpcGVsaW5lIiwiZXN0aW1hdGUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaHRtbF91cmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkVzdGltYXRlVmFsIiwiU2V0RXN0aW1hdGUiLCJCdWdSZWdleCIsIkJ1Z1VybCIsIlVzZXJSZWdleCIsIkJsb2NrdXJsIiwiRXBpY1VybCJdLCJtYXBwaW5ncyI6Ijs7QUFPQTs7Ozs7O0FBUEEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlHLGFB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QixRQUFJLFlBQUo7QUFDQSxRQUFJb0gsZ0JBQWdCMUYsTUFBcEI7QUFDQSxRQUFJNkcsVUFBVSxxQkFBcUJuQixhQUFyQixHQUFxQyxRQUFuRDs7QUFFQSxRQUFJeEMsWUFBWTtBQUNkdEMsZUFBVSxJQURJO0FBRWRNLFdBQUsyRixPQUZTO0FBR2R2RixjQUFRLEtBSE07QUFJZEYsWUFBTSxJQUpRO0FBS2RQLGFBQU8sS0FMTztBQU1kVyxlQUFRO0FBTk0sS0FBaEI7O0FBU0EsV0FBTzBCLFNBQVA7QUFDRDs7QUFqcEJjLENBQWpCIiwiZmlsZSI6InNjcnVtX2JvYXJkLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xudmFyIG9zID0gcmVxdWlyZShcIm9zXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgcmVwb19pZDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblxuICBjYWxsTWU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgdGVzdCA9IG9wdGlvbnMudGVzdDtcblxuICAgIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICBcIlVzZXJJZFwiOiBcIk1hcFwiLFxuICAgICAgXCJDaGVja1wiOiB0ZXN0XG4gICAgfTtcblxuICAgIHJldHVybiBGaW5hbERhdGE7XG4gIH0sXG5cbiAgZ2V0U2NydW1EYXRhKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVXNlcklucHV0O1xuXG4gICAgIHZhciBGaW5hbE1lc3NhZ2U9bnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZFZhbHVlID0gdGhpcy5nZXRDb21tYW5kKFVzZXJDb21tYW5kKTtcblxuICAgIGxvZyhcImNvbW1hbmQgdmFsIDogXCIrQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGxvZyhcInJlcG8gaWQgMSA6IFwiK3JlcG9faWQpO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoUmVwb3NpdG9yeUlkID09PSBudWxsIHx8IFJlcG9zaXRvcnlJZCA9PT0gJycgfHwgdHlwZW9mIFJlcG9zaXRvcnlJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGxvZyhcInRyeWluZyB0byBnZXQgcmVwbyBpZFwiKTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XS8pO1xuICAgIFxuICAgICAgaWYgKCFSZXBvUmVnZXgudGVzdChDb21tYW5kVmFsdWUpKSB7XG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgICBNZXNzYWdlOiAnUmVwb3NpdG9yeSBJZCBOb3QgU3BlY2lmaWVkJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgUmVwb0lkICE9PSAndW5kZWZpbmVkJyAmJiBSZXBvSWQgIT09ICcnICYmIFJlcG9JZCAhPT0gbnVsbCkge1xuICAgICAgICBsb2coXCJyZXBvIGZvdW5kIGlkOiBcIitSZXBvSWQpO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG4gICAgICAgIFxuICAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIE1lc3NhZ2U6ICdTdWNjZXNzJyxcbiAgICAgICAgICBPcHRpb25zOiB7XG4gICAgICAgICAgICBSZXNwb3NpdG9yeUlkOiBSZXBvSWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgICAgXG4gICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgbG9nKFwiZ2V0IHVybFwiKTtcbiAgICB2YXIgVmFsaWRVcmxPYmplY3QgPSB0aGlzLnZhbGlkYXRlQ29tbWFuZHMoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIENvbW1hbmQ6IENvbW1hbmRWYWx1ZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgIGxvZyhcInVybCBpcyBub3QgdmFsaWRcIik7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICBsb2coXCJ1cmwgaXMgdmFsaWRcIilcbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNHaXQpIHtcbiAgICAgIGxvZyhcImlzIEdpdCAuLlwiKVxuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgbG9nIChcIm5vdCBnaXRcIik7XG4gICAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdCh7XG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIFVVcmw6IFZhbGlkVXJsT2JqZWN0LlVybCxcbiAgICAgICAgVUJvZHk6IFZhbGlkVXJsT2JqZWN0LkJvZHksXG4gICAgICAgIFVNZXRob2Q6IFZhbGlkVXJsT2JqZWN0Lk1ldGhvZCxcbiAgICAgICAgVVR5cGU6VmFsaWRVcmxPYmplY3QuVXJsVHlwZVxuICAgICAgfSk7XG4gICAgfVxuXG5cbiAgfSxcblxuICAvL2dpdmVuLCBwaXBlbGluZSBuYW1lLCByZXR1cm4gcGlwZWxpbmUgaWRcbiAgZ2V0UGlwZWxpbmVJZChQaXBlbGluZU5hbWUpe1xuICAgIGxvZyhcImVudGVyZWQgbmFtZSA6IFwiK1BpcGVsaW5lTmFtZSlcbiAgICAvL3ZhciBQaXBlbGluZUlkO1xuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKXtcbiAgICAgIFxuICAgICAgbG9nKGRhdGEpXG4gICAgICBmb3IgKHZhciBpID0wOyBpPGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgbG9nKFwiY2hlY2tpbmdcIilcbiAgICAgICAgaWYgKGRhdGFbJ3BpcGVsaW5lcyddW2ldLm5hbWUgPT09IFBpcGVsaW5lTmFtZSl7XG4gICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIitkYXRhWydwaXBlbGluZXMnXVtpXS5pZCk7XG4gICAgICAgICAgcmV0dXJuIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIrZXJyKVxuICAgICAgcmV0dXJuIGVycjsgICAgXG4gICAgfSkgXG4gIH0sXG5cbiAgY2hlY2tWYWxpZElucHV0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFZhbGlkQml0ID0gZmFsc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5VQ29tbWFuZDtcbiAgICBjb25zb2xlLmxvZyhcInVzZXIgY29tbWFuZCA6IFwiK1VzZXJDb21tYW5kKTtcbiAgICBcbiAgICB2YXIgVmFsaWRDb21tYW5kcyA9IFsnQHNjcnVtYm90JywgJy9yZXBvJywgJy9pc3N1ZScsICcvZXBpYycsICcvYmxvY2tlZCddO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgVmFsaWRDb21tYWRSZWdleCA9IG5ldyBSZWdFeHAoL14oQHNjcnVtYm90KVxcc1tcXC9BLVphLXpdKi8pO1xuICAgIGNvbnNvbGUubG9nKFwicHJvY2Vzc2luZyBtZXNzYWdlIDogXCIrVXNlckNvbW1hbmQpO1xuXG5cbiAgICBpZiAoIVZhbGlkQ29tbWFkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpe1xuICAgICAgbG9nKFwiRXJyb3Igbm90IHN0YXJ0aW5nIHdpdGggQHNjcnVtYm90XCIpXG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgICBcblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICAvL2lmIC9yZXBvIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCwgbm8gcmVwbyBpZCBwcm92aWRlZCBlbHNlIHRha2Ugd2hhdGV2ZXIgY29tZXMgYWZ0ZXIgQHNjcnVtYm90IGFzIHJlcG9faWRcbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gVmFsaWRDb21tYW5kc1sxXSl7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG4gICAgbG9nKFwiRmluYWwgQ29tbWFuZCA6IFwiK0ZpbmFsQ29tbWFuZCk7XG5cbiAgICByZXR1cm4gVmFsaWRCaXQgPSB0cnVlO1xuICB9LFxuXG4gIGdldENvbW1hbmQ6IGZ1bmN0aW9uIChVQ29tbWFuZCkge1xuICAgIGxvZyhcImdldENvbW1hbmRcIik7XG4gICAgdmFyIFZhbGlkQml0ID0gJyc7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gVUNvbW1hbmQ7XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IHR5cGVvZiBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09ICcvcmVwbycpe1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nIChcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiK3JlcG9faWQgK1wiIGZyb20gbWVzc2FnZSBhcmcgYXQgcG9zIDEgPSBcIitDb21tYW5kQXJyWzFdKTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIFxuICAgIGxvZyhcInJlcG8gaWQgMiA6IFwiK3JlcG9faWQpOyAgICBcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gRmluYWxDb21tYW5kO1xuICB9LFxuXG4gIHZhbGlkYXRlQ29tbWFuZHM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICBsb2coXCJ2YWxpZGF0ZUNvbW1hbmRzXCIpO1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Db21tYW5kO1xuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICBcbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGxcbiAgICB9O1xuXG4gICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBJc3N1ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9pc3N1ZV0qXFxzWzAtOV0qXFxzWzAtOV0qXFxzKC11fGJ1Z3xwaXBlbGluZXwtcHxldmVudHN8LWUpLyk7XG4gICAgdmFyIEVwaWNSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvZXBpY10qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIEJsb2NrZWRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9ibG9ja2VkLyk7XG5cbiAgICBpZiAoUmVwb1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0UmVwb1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycik7XG5cbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGlmIChCbG9ja2VkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRCbG9ja1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChJc3N1ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoRXBpY1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGxvZyhcIlVybE9iamVjdCA9IFwiK1VybE9iamVjdCk7XG4gICAgcmV0dXJuIFVybE9iamVjdDtcblxuICB9LFxuXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGxvZyhcIm1ha2VSZXF1ZXN0XCIpO1xuICAgIGxvZyhvcHRpb25zLlVCb2R5KVxuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBUb2tlbiA9IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTjtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS56ZW5odWIuaW8vJztcblxuICAgIHZhciBVc2VyVXJsID0gb3B0aW9ucy5VVXJsO1xuICAgIC8vdmFyIGJvZHkgPSBvcHRpb25zLlVCb2R5IHwge2tleTondmFsdWUnfTtcbiAgICB2YXIgYm9keTtcbiAgXG4gICAgaWYob3B0aW9ucy5VQm9keSA9PSBudWxsKXtcbiAgICAgIGJvZHkgPSB7a2V5Oid2YWx1ZSd9O1xuICAgICAgXG4gICAgfWVsc2V7XG4gICAgICBib2R5ID0gb3B0aW9ucy5VQm9keTsgICAgICAgICAgICBcblxuICAgIH1cbiAgXG4gICAgdmFyIFVNZXRob2QgPSBvcHRpb25zLlVNZXRob2Q7XG4gICAgdmFyIFVybFR5cGUgPSBvcHRpb25zLlVUeXBlO1xuICAgIFxuICAgIGNvbnNvbGUuZGlyKCdVcmxib2R5OiAnK2JvZHksIHtkZXB0aDpudWxsfSk7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogVU1ldGhvZCxcbiAgICAgIHVyaTogTWFpblVybCArIFVzZXJVcmwsXG4gICAgICBxczoge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgICAgICxcbiAgICAgICAgXG4gICAgICAvL2JvZHk6IHtcbiAgICAgICAgYm9keVxuXG4gICAgICAvL31cbiAgICB9O1xuXG4gICAgY29uc29sZS5kaXIoVXJsT3B0aW9ucyx7ZGVwdGg6bnVsbH0pO1xuICAgIFxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcblxuICAgICAgICAvL1BhcnNlIEpTT04gYWNjb3JkaW5nIHRvIG9iaiByZXR1cm5lZFxuICAgICAgICBpZihVcmxUeXBlID09PSAnSXNzdWVFdmVudHMnKXtcbiAgICAgICAgICBsb2coXCJFdmVudHMgZm9yIGlzc3VlXCIpO1xuICAgICAgICAgIERhdGEgPSAnXFxuICAgICpIZXJlIGFyZSB0aGUgbW9zdCByZWNlbnQgZXZlbnRzIHJlZ2FyZGluZyB5b3VyIGlzc3VlOiogJztcblxuICAgICAgICAgIGZvciAodmFyIGkgPTA7IGk8c3VjY2Vzc2RhdGEubGVuZ3RoOyBpKyspe1xuXG4gICAgICAgICAgICBpZihzdWNjZXNzZGF0YVtpXS50eXBlID09PSAndHJhbnNmZXJJc3N1ZScpe1xuICAgICAgICAgICAgICBsb2coXCJwaXBlbGluZSBtb3ZlIGV2ZW50XCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUpK3N1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4qVXNlciAnICtzdWNjZXNzZGF0YVtpXS51c2VyX2lkKyAnKiBfbW92ZWRfIHRoaXMgaXNzdWUgZnJvbSAnK3N1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUubmFtZSsnIHRvICcrc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUubmFtZSsnIG9uIGRhdGUgOiAnK2RhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICdlc3RpbWF0ZUlzc3VlJyl7XG4gICAgICAgICAgICAgIGxvZyhcImVzdGltYXRlIGNoYW5nZSBldmVudCBcIitpKTtcbiAgICAgICAgICAgICAgRGF0YSArPSAnXFxuICpVc2VyICcgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQrICcqIF9jaGFuZ2VkIGVzdGltYXRlXyBvbiB0aGlzIGlzc3VlIHRvICAnK3N1Y2Nlc3NkYXRhW2ldLnRvX2VzdGltYXRlLnZhbHVlKycgb24gZGF0ZSA6ICcrZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG4gIFxuICAgICAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgICBsb2coXCJkbyBub3QgcmVjb2dpc2UgZXZlbnQgdHlwZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgIH1cbiAgICAgICAgICBEYXRhICs9IFwiIFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0dldFBpcGVsaW5lJyl7XG5cbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIlRoYXQgaXNzdWUgaXMgY3VycmVudGx5IGluIFwiK3N1Y2Nlc3NkYXRhLnBpcGVsaW5lLm5hbWUrXCIgcGlwZWxpbmUuXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZihVcmxUeXBlID09PSAnSXNzdWVFc3RpbWF0ZScpe1xuICAgICAgICAgIERhdGEgPSAnJztcbiAgICAgICAgICBEYXRhICs9ICdZb3VyIElzc3VlXFwncyBlc3RpbWF0ZSBoYXMgYmVlbiB1cGRhdGVkIHRvICcrc3VjY2Vzc2RhdGEuZXN0aW1hdGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZihVcmxUeXBlID09PSAnRXBpY0lzc3Vlcycpe1xuICAgICAgICAgIFxuICAgICAgICAgIERhdGEgPSBcIlRoZSBmb2xsb3dpbmcgRXBpY3MgYXJlIGluIHlvdXIgc2NydW1ib2FyZDogXCI7XG4gICAgICAgICAgZm9yICh2YXIgaSA9MDsgaTxzdWNjZXNzZGF0YS5lcGljX2lzc3Vlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBEYXRhICs9IGBcXG4gRXBpYyBJRDogICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfbnVtYmVyfSBVcmwgOiAke3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX3VybH0gYFxuICAgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIERhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzIGZvbGxvd2luZyBlcnJvciA9JyArIGVycik7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9KTtcblxuICB9LFxuXG5cbiAgLy8gVG8gR2V0IFJlcG9zaXRvcnkgSWRcbiAgZ2V0UmVzcG9zaXRvcnlJZDogZnVuY3Rpb24gKE9wdGlvbnMpIHtcbiAgICBsb2coXCJnZXRSZXBvc2l0b3J5SWRcIik7XG4gICAgdmFyIHJlcyA9IE9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHJlcSA9IE9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBPcHRpb25zLnJlcG9OYW1lO1xuICAgIHZhciBPd25lcm5hbWUgPSBPcHRpb25zLkdpdE93bmVyTmFtZTtcbiAgICB2YXIgUmVwb3NpdG9yeVVybCA9ICdyZXBvcy8nICsgT3duZXJuYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICB1cmk6IE1haW5VcmwgKyBSZXBvc2l0b3J5VXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgLy9hY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgfTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBSZXBvSWQgPSBzdWNjZXNzZGF0YS5pZDtcblxuICAgICAgICByZXBvX2lkID0gUmVwb0lkO1xuICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzZGF0YSk7XG4gICAgICAgIHJldHVybiBcIlRoZSAqUmVwb3NpdG9yeSBJZCogZm9yIF9cIitSZXBvc2l0b3J5TmFtZStcIl8gaXMgXCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGEuaWQpK1wiIFZpZXcgcmVwbyBhdCA6IFwiK3N1Y2Nlc3NkYXRhLmh0bWxfdXJsO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGxvZyhcIkFQSSBjYWxsIGZhaWxlZC4uLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICBVcmw6ICcnLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2VcbiAgICB9O1xuXG4gICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICB2YXIgUGlwZWxpbmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNwaXBlbGluZS8pO1xuXG4gICAgaWYgKFBpcGVsaW5lUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiaXNzdWUgTnVtIGluIGdldElTc3VlVXJsIDogXCIrSXNzdWVObyk7XG4gICAgICB2YXIgUGlwZUxpbmV1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogUGlwZUxpbmV1cmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTonR2V0UGlwZWxpbmUnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuICAgIFxuICAgIC8vIE1vdmUgUGlwZWxpbmVcbiAgICB2YXIgUGlwZWxpbmVNb3ZlUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLXBcXHNbQS1aYS16MC05XSovKTtcblxuICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAvL2lmIG1vdmluZyBwaXBlbGluZSwgM3JkIGFyZyBpcyBpc3N1ZSBudW0sICA0dGggPSAtcCwgNXRoID0gcGlwZWxpbmUsIDZ0IHBvc2l0aW9uXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJuYW1lIHVzZWQgXCIrIENvbW1hbmRBcnJbNF0pXG4gICAgICAvL3RoaXMuZ2V0UGlwZWxpbmVJZChDb21tYW5kQXJyWzRdKS50aGVuKGZ1bmN0aW9uIChkYXRhKXtcbiAgICAgIHJldHVybiBycCh0aGlzLmdldFBpcGVsaW5lSWQoQ29tbWFuZEFycls0XSkpLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuICAgICAgICAgIFxuICAgICAgICBsb2coXCJQaXBlbGluZSBnb3QgKHVzaW5nIGRhdGEpOiBcIisgZGF0YSk7XG4gICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNV18MDtcbiAgICAgICAgbG9nKFwicG9zaXRpb246IFwiK1Bvc05vKVxuICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBwaXBlbGluZV9pZDogZGF0YSxcbiAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidJc3N1ZVRvUGlwZWxpbmVzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGxvZyhcInVybCBidWlsdC5cIik7XG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgICBsb2coXCJmYWlsZWQuLi5cIik7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgICAgfSk7IFxuICAgICAgfVxuXG4gICAgIFxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIGxvZyhcImlzc3VlIG5vIGV2ZW50c3JlZ2V4IFwiK0lzc3VlTm8pO1xuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXZlbnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIFxuICAgICAgLy8gU2V0IHRoZSBlc3RpbWF0ZSBmb3IgdGhlIGlzc3VlLlxuICAgICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIHZhciBFc3RpbWF0ZVZhbCA9IENvbW1hbmRBcnJbNF07XG4gICAgICAgIGxvZyhcIkVzdGltYXRlVmFsIDogXCIrRXN0aW1hdGVWYWwpXG4gICAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBlc3RpbWF0ZSA6IEVzdGltYXRlVmFsXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogU2V0RXN0aW1hdGUsXG4gICAgICAgICAgTWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonSXNzdWVFc3RpbWF0ZSdcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgdmFyIEJ1Z1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBCdWdVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidCdWdJc3N1ZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXIsIHVzZXJJc3N1ZVxuICAgICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIFVzZXJVcmwgPSAnJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBVc2VyVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonVXNlcklzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH0sXG5cblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0QmxvY2tVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBCbG9ja3VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEJsb2NrdXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOidCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0RXBpY1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkIDogdHJ1ZSxcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTonRXBpY0lzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfVxuXG59O1xuIl19