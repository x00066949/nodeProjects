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

      var data = this.getPipelineId(CommandArr[4]);

      //if moving pipeline, 3rd arg is issue num,  4th = -p, 5th = pipeline, 6t position
      var IssueNo = CommandArr[2];
      log("name used " + CommandArr[4]);
      //this.getPipelineId(CommandArr[4]).then(function (data){
      //rp(this.getPipelineId(CommandArr[4])).then((data)=>{


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

      /*}).catch(function (err) {
        var Error = err;
        log("failed...");
        console.log('User has %d repos', err);
      }); */

      //log(pipeMove)
      //console.dir(pipeMove, {depth:null})
      //return pipeMove;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJkYXRlRm9ybWF0Iiwib3MiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsInBpcGVsaW5lSWRSZXF1ZXN0IiwidXJpIiwiaGVhZGVycyIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJqc29uIiwidGhlbiIsImRhdGEiLCJpIiwibGVuZ3RoIiwibmFtZSIsImlkIiwiY2F0Y2giLCJlcnIiLCJWYWxpZEJpdCIsIlZhbGlkQ29tbWFuZHMiLCJWYWxpZENvbW1hZFJlZ2V4IiwiT3JpZ2luYWxzQ29tbWFuZEFyciIsInNwbGljZSIsIkZpbmFsQ29tbWFuZCIsImpvaW4iLCJVcmxPYmplY3QiLCJJc3N1ZVJlZ2V4IiwiRXBpY1JlZ2V4IiwiQmxvY2tlZFJlZ2V4IiwiZ2V0UmVwb1VybCIsImdldEJsb2NrVXJsIiwiZ2V0SXNzdWVVcmwiLCJnZXRFcGljVXJsIiwiVG9rZW4iLCJNYWluVXJsIiwiVXNlclVybCIsImJvZHkiLCJrZXkiLCJVcmxPcHRpb25zIiwibWV0aG9kIiwicXMiLCJhY2Nlc3NfdG9rZW4iLCJzdWNjZXNzZGF0YSIsIkRhdGEiLCJKU09OIiwic3RyaW5naWZ5IiwidHlwZSIsInRvX3BpcGVsaW5lIiwiZnJvbV9waXBlbGluZSIsInVzZXJfaWQiLCJjcmVhdGVkX2F0IiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsInBpcGVsaW5lIiwiZXN0aW1hdGUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaHRtbF91cmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkVzdGltYXRlVmFsIiwiU2V0RXN0aW1hdGUiLCJCdWdSZWdleCIsIkJ1Z1VybCIsIlVzZXJSZWdleCIsIkJsb2NrdXJsIiwiRXBpY1VybCJdLCJtYXBwaW5ncyI6Ijs7QUFPQTs7Ozs7O0FBUEEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlHLGFB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QUFJdEMsWUFBWTtBQUNkeEMsZUFBVSxJQURJO0FBRWRTLFdBQUt3RixPQUZTO0FBR2RwRixjQUFRLEtBSE07QUFJZEYsWUFBTSxJQUpRO0FBS2RWLGFBQU8sS0FMTztBQU1kYyxlQUFRO0FBTk0sS0FBaEI7O0FBU0EsV0FBT3lCLFNBQVA7QUFDRDs7QUExcEJjLENBQWpCIiwiZmlsZSI6InNjcnVtX2JvYXJkLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xudmFyIG9zID0gcmVxdWlyZShcIm9zXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgcmVwb19pZDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblxuICBjYWxsTWU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgdGVzdCA9IG9wdGlvbnMudGVzdDtcblxuICAgIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICBcIlVzZXJJZFwiOiBcIk1hcFwiLFxuICAgICAgXCJDaGVja1wiOiB0ZXN0XG4gICAgfTtcblxuICAgIHJldHVybiBGaW5hbERhdGE7XG4gIH0sXG5cbiAgZ2V0U2NydW1EYXRhKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVXNlcklucHV0O1xuXG4gICAgIHZhciBGaW5hbE1lc3NhZ2U9bnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZFZhbHVlID0gdGhpcy5nZXRDb21tYW5kKFVzZXJDb21tYW5kKTtcblxuICAgIGxvZyhcImNvbW1hbmQgdmFsIDogXCIrQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGxvZyhcInJlcG8gaWQgMSA6IFwiK3JlcG9faWQpO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoUmVwb3NpdG9yeUlkID09PSBudWxsIHx8IFJlcG9zaXRvcnlJZCA9PT0gJycgfHwgdHlwZW9mIFJlcG9zaXRvcnlJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGxvZyhcInRyeWluZyB0byBnZXQgcmVwbyBpZFwiKTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XS8pO1xuICAgIFxuICAgICAgaWYgKCFSZXBvUmVnZXgudGVzdChDb21tYW5kVmFsdWUpKSB7XG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgICBNZXNzYWdlOiAnUmVwb3NpdG9yeSBJZCBOb3QgU3BlY2lmaWVkJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgUmVwb0lkICE9PSAndW5kZWZpbmVkJyAmJiBSZXBvSWQgIT09ICcnICYmIFJlcG9JZCAhPT0gbnVsbCkge1xuICAgICAgICBsb2coXCJyZXBvIGZvdW5kIGlkOiBcIitSZXBvSWQpO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG4gICAgICAgIFxuICAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIE1lc3NhZ2U6ICdTdWNjZXNzJyxcbiAgICAgICAgICBPcHRpb25zOiB7XG4gICAgICAgICAgICBSZXNwb3NpdG9yeUlkOiBSZXBvSWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgICAgXG4gICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgbG9nKFwiZ2V0IHVybFwiKTtcbiAgICB2YXIgVmFsaWRVcmxPYmplY3QgPSB0aGlzLnZhbGlkYXRlQ29tbWFuZHMoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIENvbW1hbmQ6IENvbW1hbmRWYWx1ZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgIGxvZyhcInVybCBpcyBub3QgdmFsaWRcIik7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICBsb2coXCJ1cmwgaXMgdmFsaWRcIilcbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNHaXQpIHtcbiAgICAgIGxvZyhcImlzIEdpdCAuLlwiKVxuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgbG9nIChcIm5vdCBnaXRcIik7XG4gICAgICBsb2coXCJ2aWV3IG9ialwiK1ZhbGlkVXJsT2JqZWN0KVxuICAgICAgY29uc29sZS5kaXIoVmFsaWRVcmxPYmplY3Qse2RlcHRoOm51bGx9KVxuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2QsXG4gICAgICAgIFVUeXBlOlZhbGlkVXJsT2JqZWN0LlVybFR5cGVcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIH0sXG5cbiAgLy9naXZlbiwgcGlwZWxpbmUgbmFtZSwgcmV0dXJuIHBpcGVsaW5lIGlkXG4gIGdldFBpcGVsaW5lSWQ6IGZ1bmN0aW9uIChQaXBlbGluZU5hbWUpe1xuICAgIGxvZyhcImVudGVyZWQgbmFtZSA6IFwiK1BpcGVsaW5lTmFtZSlcbiAgICAvL3ZhciBQaXBlbGluZUlkO1xuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgcnAocGlwZWxpbmVJZFJlcXVlc3QpXG4gICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuICAgICAgXG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPTA7IGk8ZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspe1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKXtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiK2RhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICByZXR1cm4gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIitlcnIpXG4gICAgICByZXR1cm4gZXJyOyAgICBcbiAgICB9KSBcbiAgfSxcblxuICBjaGVja1ZhbGlkSW5wdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVmFsaWRCaXQgPSBmYWxzZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVDb21tYW5kO1xuICAgIGNvbnNvbGUubG9nKFwidXNlciBjb21tYW5kIDogXCIrVXNlckNvbW1hbmQpO1xuICAgIFxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIitVc2VyQ29tbWFuZCk7XG5cblxuICAgIGlmICghVmFsaWRDb21tYWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSl7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICAgIFxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIC8vaWYgL3JlcG8gY29tZXMgYWZ0ZXIgQHNjcnVtYm90LCBubyByZXBvIGlkIHByb3ZpZGVkIGVsc2UgdGFrZSB3aGF0ZXZlciBjb21lcyBhZnRlciBAc2NydW1ib3QgYXMgcmVwb19pZFxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSBWYWxpZENvbW1hbmRzWzFdKXtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIrRmluYWxDb21tYW5kKTtcblxuICAgIHJldHVybiBWYWxpZEJpdCA9IHRydWU7XG4gIH0sXG5cbiAgZ2V0Q29tbWFuZDogZnVuY3Rpb24gKFVDb21tYW5kKSB7XG4gICAgbG9nKFwiZ2V0Q29tbWFuZFwiKTtcbiAgICB2YXIgVmFsaWRCaXQgPSAnJztcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBVQ29tbWFuZDtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgdHlwZW9mIFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gJy9yZXBvJyl7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2cgKFwiZmlyc3RseSBpbml0aWFsaXNpaW5nIHJlcG9faWQgYXMgXCIrcmVwb19pZCArXCIgZnJvbSBtZXNzYWdlIGFyZyBhdCBwb3MgMSA9IFwiK0NvbW1hbmRBcnJbMV0pO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgXG4gICAgbG9nKFwicmVwbyBpZCAyIDogXCIrcmVwb19pZCk7ICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBGaW5hbENvbW1hbmQ7XG4gIH0sXG5cbiAgdmFsaWRhdGVDb21tYW5kczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIGxvZyhcInZhbGlkYXRlQ29tbWFuZHNcIik7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLkNvbW1hbmQ7XG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIFxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuICAgIGlmIChSZXBvUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKTtcblxuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKEJsb2NrZWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEJsb2NrVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKElzc3VlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgbG9nKFwiVXJsT2JqZWN0ID0gXCIrVXJsT2JqZWN0KTtcbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG5cbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgbG9nKFwibWFrZVJlcXVlc3RcIik7XG4gICAgbG9nKG9wdGlvbnMuVUJvZHkpXG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFRva2VuID0gcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby8nO1xuXG4gICAgdmFyIFVzZXJVcmwgPSBvcHRpb25zLlVVcmw7XG4gICAgLy92YXIgYm9keSA9IG9wdGlvbnMuVUJvZHkgfCB7a2V5Oid2YWx1ZSd9O1xuICAgIHZhciBib2R5O1xuICBcbiAgICBpZihvcHRpb25zLlVCb2R5ID09IG51bGwpe1xuICAgICAgYm9keSA9IHtrZXk6J3ZhbHVlJ307XG4gICAgICBcbiAgICB9ZWxzZXtcbiAgICAgIGJvZHkgPSBvcHRpb25zLlVCb2R5OyAgICAgICAgICAgIFxuXG4gICAgfVxuICBcbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcbiAgICB2YXIgVXJsVHlwZSA9IG9wdGlvbnMuVVR5cGU7XG4gICAgXG4gICAgY29uc29sZS5kaXIoJ1VybGJvZHk6ICcrYm9keSwge2RlcHRoOm51bGx9KTtcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgbWV0aG9kOiBVTWV0aG9kLFxuICAgICAgdXJpOiBNYWluVXJsICsgVXNlclVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgLFxuICAgICAgICBcbiAgICAgIC8vYm9keToge1xuICAgICAgICBib2R5XG5cbiAgICAgIC8vfVxuICAgIH07XG5cbiAgICBjb25zb2xlLmRpcihVcmxPcHRpb25zLHtkZXB0aDpudWxsfSk7XG4gICAgXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIERhdGEgPSBzdWNjZXNzZGF0YTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvbGxvd2luZyBEYXRhID0nICsgSlNPTi5zdHJpbmdpZnkoRGF0YSkpO1xuXG4gICAgICAgIC8vUGFyc2UgSlNPTiBhY2NvcmRpbmcgdG8gb2JqIHJldHVybmVkXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdJc3N1ZUV2ZW50cycpe1xuICAgICAgICAgIGxvZyhcIkV2ZW50cyBmb3IgaXNzdWVcIik7XG4gICAgICAgICAgRGF0YSA9ICdcXG4gICAgKkhlcmUgYXJlIHRoZSBtb3N0IHJlY2VudCBldmVudHMgcmVnYXJkaW5nIHlvdXIgaXNzdWU6KiAnO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9MDsgaTxzdWNjZXNzZGF0YS5sZW5ndGg7IGkrKyl7XG5cbiAgICAgICAgICAgIGlmKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICd0cmFuc2Zlcklzc3VlJyl7XG4gICAgICAgICAgICAgIGxvZyhcInBpcGVsaW5lIG1vdmUgZXZlbnRcIitKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZSkrc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZSk7XG4gICAgICAgICAgICAgIERhdGEgKz0gJ1xcbipVc2VyICcgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQrICcqIF9tb3ZlZF8gdGhpcyBpc3N1ZSBmcm9tICcrc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZS5uYW1lKycgdG8gJytzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZS5uYW1lKycgb24gZGF0ZSA6ICcrZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG4gIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ2VzdGltYXRlSXNzdWUnKXtcbiAgICAgICAgICAgICAgbG9nKFwiZXN0aW1hdGUgY2hhbmdlIGV2ZW50IFwiK2kpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4gKlVzZXIgJyArc3VjY2Vzc2RhdGFbaV0udXNlcl9pZCsgJyogX2NoYW5nZWQgZXN0aW1hdGVfIG9uIHRoaXMgaXNzdWUgdG8gICcrc3VjY2Vzc2RhdGFbaV0udG9fZXN0aW1hdGUudmFsdWUrJyBvbiBkYXRlIDogJytkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcbiAgXG4gICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgIGxvZyhcImRvIG5vdCByZWNvZ2lzZSBldmVudCB0eXBlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICAgIERhdGEgKz0gXCIgXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZihVcmxUeXBlID09PSAnR2V0UGlwZWxpbmUnKXtcblxuICAgICAgICAgIERhdGEgPSBcIiBcIjtcbiAgICAgICAgICBEYXRhICs9IFwiVGhhdCBpc3N1ZSBpcyBjdXJyZW50bHkgaW4gXCIrc3VjY2Vzc2RhdGEucGlwZWxpbmUubmFtZStcIiBwaXBlbGluZS5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdJc3N1ZUVzdGltYXRlJyl7XG4gICAgICAgICAgRGF0YSA9ICcnO1xuICAgICAgICAgIERhdGEgKz0gJ1lvdXIgSXNzdWVcXCdzIGVzdGltYXRlIGhhcyBiZWVuIHVwZGF0ZWQgdG8gJytzdWNjZXNzZGF0YS5lc3RpbWF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdFcGljSXNzdWVzJyl7XG4gICAgICAgICAgXG4gICAgICAgICAgRGF0YSA9IFwiVGhlIGZvbGxvd2luZyBFcGljcyBhcmUgaW4geW91ciBzY3J1bWJvYXJkOiBcIjtcbiAgICAgICAgICBmb3IgKHZhciBpID0wOyBpPHN1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIERhdGEgKz0gYFxcbiBFcGljIElEOiAgJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV9udW1iZXJ9IFVybCA6ICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfdXJsfSBgXG4gICAgICAgICAgICBcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gRGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgZm9sbG93aW5nIGVycm9yID0nICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH0pO1xuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuICAgIHZhciBSZXBvc2l0b3J5VXJsID0gJ3JlcG9zLycgKyBPd25lcm5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tLyc7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIHVyaTogTWFpblVybCArIFJlcG9zaXRvcnlVcmwsXG4gICAgICBxczoge1xuICAgICAgICAvL2FjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuXG4gICAgICAgIHJlcG9faWQgPSBSZXBvSWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKHN1Y2Nlc3NkYXRhKTtcbiAgICAgICAgcmV0dXJuIFwiVGhlICpSZXBvc2l0b3J5IElkKiBmb3IgX1wiK1JlcG9zaXRvcnlOYW1lK1wiXyBpcyBcIitKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YS5pZCkrXCIgVmlldyByZXBvIGF0IDogXCIrc3VjY2Vzc2RhdGEuaHRtbF91cmw7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgbG9nKFwiQVBJIGNhbGwgZmFpbGVkLi4uXCIpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgJWQgcmVwb3MnLCBlcnIpO1xuICAgICAgfSk7XG5cbiAgfSxcblxuICAvLyBUbyBHZXQgUmVwbyBVcmxcbiAgZ2V0UmVwb1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKSB7XG5cbiAgICBsb2coXCJnZXRSZXBvVXJsXCIpO1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEdpdE93bmVyTmFtZSA9ICd4MDAwNjY5NDknO1xuICAgIHZhciBSZXBvc2l0b3J5SWQgPSAncmVwb3MvJyArIEdpdE93bmVyTmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IFJlcG9zaXRvcnlJZCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IHRydWVcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuICAvL1RvIEdldCBJc3N1ZSByZWxhdGVkIFVybFxuICBnZXRJc3N1ZVVybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRJc3N1ZVVybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZVxuICAgIH07XG5cbiAgICAvL1RvIEdldCBTdGF0ZSBvZiBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICBpZiAoUGlwZWxpbmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJpc3N1ZSBOdW0gaW4gZ2V0SVNzdWVVcmwgOiBcIitJc3N1ZU5vKTtcbiAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOidHZXRQaXBlbGluZSdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG4gICAgXG4gICAgLy8gTW92ZSBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZU1vdmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtcFxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgaWYgKFBpcGVsaW5lTW92ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBkYXRhID0gdGhpcy5nZXRQaXBlbGluZUlkKENvbW1hbmRBcnJbNF0pO1xuICAgICAgXG4gICAgICAvL2lmIG1vdmluZyBwaXBlbGluZSwgM3JkIGFyZyBpcyBpc3N1ZSBudW0sICA0dGggPSAtcCwgNXRoID0gcGlwZWxpbmUsIDZ0IHBvc2l0aW9uXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJuYW1lIHVzZWQgXCIrIENvbW1hbmRBcnJbNF0pXG4gICAgICAvL3RoaXMuZ2V0UGlwZWxpbmVJZChDb21tYW5kQXJyWzRdKS50aGVuKGZ1bmN0aW9uIChkYXRhKXtcbiAgICAgIC8vcnAodGhpcy5nZXRQaXBlbGluZUlkKENvbW1hbmRBcnJbNF0pKS50aGVuKChkYXRhKT0+e1xuICAgICAgICAgIFxuICAgICAgXG4gICAgICAgIGxvZyhcIlBpcGVsaW5lIGdvdCAodXNpbmcgZGF0YSk6IFwiKyBkYXRhKTtcbiAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls1XXwwO1xuICAgICAgICBsb2coXCJwb3NpdGlvbjogXCIrUG9zTm8pXG4gICAgICAgIHZhciBNb3ZlSXNzdWVQaXBlTGluZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnO1xuICAgICAgICBsb2coXCJidWlsZGluZyBtb3ZlIHBpcGVsaW5lIHVybC4uXCIpXG5cbiAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIHBpcGVsaW5lX2lkOiBkYXRhLFxuICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlVG9QaXBlbGluZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgbG9nKFwidXJsIGJ1aWx0LlwiKTtcbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgICAgICAvKn0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgICAgbG9nKFwiZmFpbGVkLi4uXCIpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICAgIH0pOyAqL1xuXG4gICAgICAgIC8vbG9nKHBpcGVNb3ZlKVxuICAgICAgICAvL2NvbnNvbGUuZGlyKHBpcGVNb3ZlLCB7ZGVwdGg6bnVsbH0pXG4gICAgICAgIC8vcmV0dXJuIHBpcGVNb3ZlO1xuICAgICAgfVxuXG4gICAgIFxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIGxvZyhcImlzc3VlIG5vIGV2ZW50c3JlZ2V4IFwiK0lzc3VlTm8pO1xuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXZlbnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIFxuICAgICAgLy8gU2V0IHRoZSBlc3RpbWF0ZSBmb3IgdGhlIGlzc3VlLlxuICAgICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIHZhciBFc3RpbWF0ZVZhbCA9IENvbW1hbmRBcnJbNF07XG4gICAgICAgIGxvZyhcIkVzdGltYXRlVmFsIDogXCIrRXN0aW1hdGVWYWwpXG4gICAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBlc3RpbWF0ZSA6IEVzdGltYXRlVmFsXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogU2V0RXN0aW1hdGUsXG4gICAgICAgICAgTWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonSXNzdWVFc3RpbWF0ZSdcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgdmFyIEJ1Z1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBCdWdVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidCdWdJc3N1ZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXIsIHVzZXJJc3N1ZVxuICAgICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIFVzZXJVcmwgPSAnJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBVc2VyVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonVXNlcklzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH0sXG5cblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0QmxvY2tVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBCbG9ja3VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEJsb2NrdXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOidCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0RXBpY1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkIDogdHJ1ZSxcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTonRXBpY0lzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfVxuXG59O1xuIl19