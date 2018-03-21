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
    log("entered name : " + PipelineName);
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
      log("name used " + CommandArr[4]);
      var PipeLineId = this.getPipelineId(CommandArr[4]).then(function (data) {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJkYXRlRm9ybWF0Iiwib3MiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsIlBpcGVsaW5lSWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsImhlYWRlcnMiLCJwcm9jZXNzIiwiZW52IiwiWkVOSFVCX1RPS0VOIiwianNvbiIsInRoZW4iLCJkYXRhIiwiaSIsImxlbmd0aCIsIm5hbWUiLCJpZCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIlZhbGlkQml0IiwiVmFsaWRDb21tYW5kcyIsIlZhbGlkQ29tbWFkUmVnZXgiLCJPcmlnaW5hbHNDb21tYW5kQXJyIiwic3BsaWNlIiwiRmluYWxDb21tYW5kIiwiam9pbiIsIlVybE9iamVjdCIsIklzc3VlUmVnZXgiLCJFcGljUmVnZXgiLCJCbG9ja2VkUmVnZXgiLCJnZXRSZXBvVXJsIiwiZ2V0QmxvY2tVcmwiLCJnZXRJc3N1ZVVybCIsImdldEVwaWNVcmwiLCJUb2tlbiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiVXJsQm9keSIsImVzdGltYXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJxcyIsImFjY2Vzc190b2tlbiIsImJvZHkiLCJzdWNjZXNzZGF0YSIsIkRhdGEiLCJ0eXBlIiwidG9fcGlwZWxpbmUiLCJmcm9tX3BpcGVsaW5lIiwidXNlcl9pZCIsImNyZWF0ZWRfYXQiLCJ0b19lc3RpbWF0ZSIsInZhbHVlIiwicGlwZWxpbmUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsIkVPTCIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaHRtbF91cmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUGlwZUxpbmVJZCIsIlBvc05vIiwiTW92ZUlzc3VlUGlwZUxpbmUiLCJNb3ZlQm9keSIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJFdmVudHNSZWdleCIsIkV2ZW50c1VybCIsIkVzdGltYXRlQWRkUmVnZXgiLCJFc3RpbWF0ZVZhbCIsIlNldEVzdGltYXRlIiwiQnVnUmVnZXgiLCJCdWdVcmwiLCJVc2VyUmVnZXgiLCJCbG9ja3VybCIsIkVwaWNVcmwiXSwibWFwcGluZ3MiOiI7O0FBT0E7Ozs7OztBQVBBLElBQUlBLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FBS0QsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUUsUUFBUUYsUUFBUSxP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QUNBLFFBQUlvSCxnQkFBZ0IxRixNQUFwQjtBQUNBLFFBQUk4RyxVQUFVLHFCQUFxQnBCLGFBQXJCLEdBQXFDLFFBQW5EOztBQUVBLFFBQUl2QyxZQUFZO0FBQ2R2QyxlQUFVLElBREk7QUFFZE0sV0FBSzRGLE9BRlM7QUFHZHhGLGNBQVEsS0FITTtBQUlkRixZQUFNLElBSlE7QUFLZFAsYUFBTyxLQUxPO0FBTWRXLGVBQVE7QUFOTSxLQUFoQjs7QUFTQSxXQUFPMkIsU0FBUDtBQUNEOztBQWhwQmMsQ0FBakIiLCJmaWxlIjoic2NydW1fYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG52YXIgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICAgdmFyIEZpbmFsTWVzc2FnZT1udWxsO1xuICAgIC8vICAgTWVzc2FnZSA6IG51bGwsXG4gICAgLy8gICBPcHRpb25zIDogbnVsbFxuICAgIC8vIH07XG5cbiAgICB2YXIgQ2hlY2tJZlZhbGlkQ29tbWFuZCA9IHRoaXMuY2hlY2tWYWxpZElucHV0KHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBVQ29tbWFuZDogVXNlckNvbW1hbmRcbiAgICB9KTtcblxuICAgIGlmICghQ2hlY2tJZlZhbGlkQ29tbWFuZCkge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kVmFsdWUgPSB0aGlzLmdldENvbW1hbmQoVXNlckNvbW1hbmQpO1xuXG4gICAgbG9nKFwiY29tbWFuZCB2YWwgOiBcIitDb21tYW5kVmFsdWUpO1xuXG4gICAgaWYgKENvbW1hbmRWYWx1ZSA9PT0gJycgfHwgQ29tbWFuZFZhbHVlID09PSBudWxsIHx8IHR5cGVvZiBDb21tYW5kVmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIrcmVwb19pZCk7XG5cbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gcmVwb19pZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuICAgICAgLy92YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qXFxzWzAtOV0qLyk7XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0vKTtcbiAgICBcbiAgICAgIGlmICghUmVwb1JlZ2V4LnRlc3QoQ29tbWFuZFZhbHVlKSkge1xuICAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgTWVzc2FnZTogJ1JlcG9zaXRvcnkgSWQgTm90IFNwZWNpZmllZCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIFJlcG9JZCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVwb0lkICE9PSAnJyAmJiBSZXBvSWQgIT09IG51bGwpIHtcbiAgICAgICAgbG9nKFwicmVwbyBmb3VuZCBpZDogXCIrUmVwb0lkKTtcblxuICAgICAgICBSZXBvSWQgPSByZXBvX2lkO1xuICAgICAgICBcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBNZXNzYWdlOiAnU3VjY2VzcycsXG4gICAgICAgICAgT3B0aW9uczoge1xuICAgICAgICAgICAgUmVzcG9zaXRvcnlJZDogUmVwb0lkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOid4MDAwNjY5NDknXG4gICAgICAgIFxuICAgICAgfSk7XG5cbiAgICB9XG5cblxuICAgIGxvZyhcImdldCB1cmxcIik7XG4gICAgdmFyIFZhbGlkVXJsT2JqZWN0ID0gdGhpcy52YWxpZGF0ZUNvbW1hbmRzKHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBDb21tYW5kOiBDb21tYW5kVmFsdWVcbiAgICB9KTtcblxuXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICBsb2coXCJ1cmwgaXMgbm90IHZhbGlkXCIpO1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgQ29tbWFuZHMnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgbG9nKFwidXJsIGlzIHZhbGlkXCIpXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzR2l0KSB7XG4gICAgICBsb2coXCJpcyBHaXQgLi5cIilcbiAgICAgIHZhciBVQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgICAgdmFyIEdpdFJlcG9OYW1lID0gVUNvbW1hbmRBcnJbMV07XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBHaXRSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOid4MDAwNjY5NDknXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGxvZyAoXCJub3QgZ2l0XCIpO1xuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2QsXG4gICAgICAgIFVUeXBlOlZhbGlkVXJsT2JqZWN0LlVybFR5cGVcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIH0sXG5cbiAgLy9naXZlbiwgcGlwZWxpbmUgbmFtZSwgcmV0dXJuIHBpcGVsaW5lIGlkXG4gIGdldFBpcGVsaW5lSWQoUGlwZWxpbmVOYW1lKXtcbiAgICBsb2coXCJlbnRlcmVkIG5hbWUgOiBcIitQaXBlbGluZU5hbWUpXG4gICAgdmFyIFBpcGVsaW5lSWQ7XG5cbiAgICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9O1xuICAgIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAudGhlbihmdW5jdGlvbiAoZGF0YSl7XG4gICAgICBcbiAgICAgIGxvZyhkYXRhKVxuICAgICAgZm9yICh2YXIgaSA9MDsgaTxkYXRhWydwaXBlbGluZXMnXS5sZW5ndGg7IGkrKyl7XG4gICAgICAgIGxvZyhcImNoZWNraW5nXCIpXG4gICAgICAgIGlmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpe1xuICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIrZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgIHJldHVybiBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiK2VycilcbiAgICAgIHJldHVybiBlcnI7ICAgIFxuICAgIH0pIFxuICB9LFxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIitVc2VyQ29tbWFuZCk7XG4gICAgXG4gICAgdmFyIFZhbGlkQ29tbWFuZHMgPSBbJ0BzY3J1bWJvdCcsICcvcmVwbycsICcvaXNzdWUnLCAnL2VwaWMnLCAnL2Jsb2NrZWQnXTtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIFZhbGlkQ29tbWFkUmVnZXggPSBuZXcgUmVnRXhwKC9eKEBzY3J1bWJvdClcXHNbXFwvQS1aYS16XSovKTtcbiAgICBjb25zb2xlLmxvZyhcInByb2Nlc3NpbmcgbWVzc2FnZSA6IFwiK1VzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKXtcbiAgICAgIGxvZyhcIkVycm9yIG5vdCBzdGFydGluZyB3aXRoIEBzY3J1bWJvdFwiKVxuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgICAgXG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgLy9pZiAvcmVwbyBjb21lcyBhZnRlciBAc2NydW1ib3QsIG5vIHJlcG8gaWQgcHJvdmlkZWQgZWxzZSB0YWtlIHdoYXRldmVyIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCBhcyByZXBvX2lkXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09IFZhbGlkQ29tbWFuZHNbMV0pe1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzJdO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgXG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuICAgIGxvZyhcIkZpbmFsIENvbW1hbmQgOiBcIitGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKXtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyAoXCJmaXJzdGx5IGluaXRpYWxpc2lpbmcgcmVwb19pZCBhcyBcIityZXBvX2lkICtcIiBmcm9tIG1lc3NhZ2UgYXJnIGF0IHBvcyAxID0gXCIrQ29tbWFuZEFyclsxXSk7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBcbiAgICBsb2coXCJyZXBvIGlkIDIgOiBcIityZXBvX2lkKTsgICAgXG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgcmV0dXJuIEZpbmFsQ29tbWFuZDtcbiAgfSxcblxuICB2YWxpZGF0ZUNvbW1hbmRzOiBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gICAgbG9nKFwidmFsaWRhdGVDb21tYW5kc1wiKTtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuQ29tbWFuZDtcbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsXG4gICAgfTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgSXNzdWVSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvaXNzdWVdKlxcc1swLTldKlxcc1swLTldKlxccygtdXxidWd8cGlwZWxpbmV8LXB8ZXZlbnRzfC1lKS8pO1xuICAgIHZhciBFcGljUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2VwaWNdKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBCbG9ja2VkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvYmxvY2tlZC8pO1xuXG4gICAgaWYgKFJlcG9SZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldFJlcG9VcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpO1xuXG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoQmxvY2tlZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0QmxvY2tVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoSXNzdWVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKEVwaWNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEVwaWNVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBsb2coXCJVcmxPYmplY3QgPSBcIitVcmxPYmplY3QpO1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgfSxcblxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBsb2coXCJtYWtlUmVxdWVzdFwiKTtcbiAgICBsb2cob3B0aW9ucy5VQm9keSlcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVG9rZW4gPSBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU47XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuemVuaHViLmlvLyc7XG5cbiAgICB2YXIgVXNlclVybCA9IG9wdGlvbnMuVVVybDtcbiAgICB2YXIgVXJsQm9keSA9IG9wdGlvbnMuVUJvZHk7XG4gICAgdmFyIFVybEJvZHk7XG4gIFxuICAgIGlmKG9wdGlvbnMuVUJvZHkgPT0gbnVsbCl7XG4gICAgICBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keTtcbiAgICAgIFxuICAgIH1lbHNle1xuICAgICAgVXJsQm9keSA9IG9wdGlvbnMuVUJvZHkuZXN0aW1hdGU7ICAgICAgICAgICAgXG5cbiAgICB9XG4gIFxuICAgIHZhciBVTWV0aG9kID0gb3B0aW9ucy5VTWV0aG9kO1xuICAgIHZhciBVcmxUeXBlID0gb3B0aW9ucy5VVHlwZTtcbiAgICBcbiAgICBsb2coXCJCb2R5IDogXCIrSlNPTi5zdHJpbmdpZnkoVXJsQm9keSkpO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICBtZXRob2Q6IFVNZXRob2QsXG4gICAgICB1cmk6IE1haW5VcmwgKyBVc2VyVXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgICAgICAsXG4gICAgICAgIFxuICAgICAgYm9keToge1xuICAgICAgICBlc3RpbWF0ZTogVXJsQm9keVxuICAgICAgICAvL1VybEJvZHlcblxuICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIERhdGEgPSBzdWNjZXNzZGF0YTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvbGxvd2luZyBEYXRhID0nICsgSlNPTi5zdHJpbmdpZnkoRGF0YSkpO1xuXG4gICAgICAgIC8vUGFyc2UgSlNPTiBhY2NvcmRpbmcgdG8gb2JqIHJldHVybmVkXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdJc3N1ZUV2ZW50cycpe1xuICAgICAgICAgIGxvZyhcIkV2ZW50cyBmb3IgaXNzdWVcIik7XG4gICAgICAgICAgRGF0YSA9IFwiKkhlcmUgYXJlIHRoZSBtb3N0IHJlY2VudCBldmVudHMgcmVnYXJkaW5nIHlvdXIgaXNzdWU6KiBgYGBcIjtcblxuICAgICAgICAgIGZvciAodmFyIGkgPTA7IGk8c3VjY2Vzc2RhdGEubGVuZ3RoOyBpKyspe1xuXG4gICAgICAgICAgICBpZihzdWNjZXNzZGF0YVtpXS50eXBlID09PSAndHJhbnNmZXJJc3N1ZScpe1xuICAgICAgICAgICAgICBsb2coXCJwaXBlbGluZSBtb3ZlIGV2ZW50XCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUpK3N1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUpO1xuICAgICAgICAgICAgICBEYXRhICs9IFwiXFxcbiAgICAgICAgICAgICAgKlVzZXIgXCIgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQrIFwiKiBfbW92ZWRfIHRoaXMgaXNzdWUgZnJvbSBcIitzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lLm5hbWUrXCIgdG8gXCIrc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUubmFtZStcIiBvbiBkYXRlIDogXCIrZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG4gIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ2VzdGltYXRlSXNzdWUnKXtcbiAgICAgICAgICAgICAgbG9nKFwiZXN0aW1hdGUgY2hhbmdlIGV2ZW50IFwiK2kpO1xuICAgICAgICAgICAgICBEYXRhICs9IFwiXFxcbiAgICAgICAgICAgICAgKlVzZXIgXCIgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQrIFwiKiBfY2hhbmdlZCBlc3RpbWF0ZV8gb24gdGhpcyBpc3N1ZSB0byAgXCIrc3VjY2Vzc2RhdGFbaV0udG9fZXN0aW1hdGUudmFsdWUrXCIgb24gZGF0ZSA6IFwiK2RhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuICBcbiAgICAgICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgICAgbG9nKFwiZG8gbm90IHJlY29naXNlIGV2ZW50IHR5cGVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICB9XG4gICAgICAgICAgRGF0YSArPSBcIiBgYGBcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdHZXRQaXBlbGluZScpe1xuXG4gICAgICAgICAgRGF0YSA9IFwiIFwiO1xuICAgICAgICAgIERhdGEgKz0gXCJUaGF0IGlzc3VlIGlzIGN1cnJlbnRseSBpbiBcIitzdWNjZXNzZGF0YS5waXBlbGluZS5uYW1lK1wiIHBpcGVsaW5lLlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0lzc3VlRXN0aW1hdGUnKXtcbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIllvdXIgSXNzdWUncyBlc3RpbWF0ZSBoYXMgYmVlbiB1cGRhdGVkIHRvIFwiK3N1Y2Nlc3NkYXRhLmVzdGltYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0VwaWNJc3N1ZXMnKXtcbiAgICAgICAgICBcbiAgICAgICAgICBEYXRhID0gXCJUaGUgZm9sbG93aW5nIEVwaWNzIGFyZSBpbiB5b3VyIHNjcnVtYm9hcmQ6IFwiO1xuICAgICAgICAgIGZvciAodmFyIGkgPTA7IGk8c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgRGF0YSArPSBcIiAgXFxcbiAgICAgICAgICAgICpcIisoaSsxKStcIiogRXBpYyBJRDogXCIrc3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfbnVtYmVyK1wiIFVybCA6IFwiK3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX3VybCtcIiBcIitvcy5FT0w7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KERhdGEpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyBmb2xsb3dpbmcgZXJyb3IgPScgKyBlcnIpO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfSk7XG5cbiAgfSxcblxuXG4gIC8vIFRvIEdldCBSZXBvc2l0b3J5IElkXG4gIGdldFJlc3Bvc2l0b3J5SWQ6IGZ1bmN0aW9uIChPcHRpb25zKSB7XG4gICAgbG9nKFwiZ2V0UmVwb3NpdG9yeUlkXCIpO1xuICAgIHZhciByZXMgPSBPcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciByZXEgPSBPcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gT3B0aW9ucy5yZXBvTmFtZTtcbiAgICB2YXIgT3duZXJuYW1lID0gT3B0aW9ucy5HaXRPd25lck5hbWU7XG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIC8vYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgUmVwb0lkID0gc3VjY2Vzc2RhdGEuaWQ7XG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc2RhdGEpO1xuICAgICAgICByZXR1cm4gXCJUaGUgKlJlcG9zaXRvcnkgSWQqIGZvciBfXCIrUmVwb3NpdG9yeU5hbWUrXCJfIGlzIFwiK0pTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhLmlkKStcIiBWaWV3IHJlcG8gYXQgOiBcIitzdWNjZXNzZGF0YS5odG1sX3VybDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBsb2coXCJBUEkgY2FsbCBmYWlsZWQuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICB9KTtcblxuICB9LFxuXG4gIC8vIFRvIEdldCBSZXBvIFVybFxuICBnZXRSZXBvVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpIHtcblxuICAgIGxvZyhcImdldFJlcG9VcmxcIik7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgR2l0T3duZXJOYW1lID0gJ3gwMDA2Njk0OSc7XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9ICdyZXBvcy8nICsgR2l0T3duZXJOYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogUmVwb3NpdG9yeUlkLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogdHJ1ZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IElzc3VlIHJlbGF0ZWQgVXJsXG4gIGdldElzc3VlVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldElzc3VlVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIC8vVG8gR2V0IFN0YXRlIG9mIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzcGlwZWxpbmUvKTtcblxuICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiK0lzc3VlTm8pO1xuICAgICAgdmFyIFBpcGVMaW5ldXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFBpcGVMaW5ldXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6J0dldFBpcGVsaW5lJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cbiAgICBcbiAgICAvLyBNb3ZlIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICBpZiAoUGlwZWxpbmVNb3ZlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgLy9pZiBtb3ZpbmcgcGlwZWxpbmUsIDNyZCBhcmcgaXMgaXNzdWUgbnVtLCAgNHRoID0gLXAsIDV0aCA9IHBpcGVsaW5lLCA2dCBwb3NpdGlvblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwibmFtZSB1c2VkIFwiKyBDb21tYW5kQXJyWzRdKVxuICAgICAgdmFyIFBpcGVMaW5lSWQgPSB0aGlzLmdldFBpcGVsaW5lSWQoQ29tbWFuZEFycls0XSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuXG4gICAgICAgICAgbG9nKFwiUGlwZWxpbmUgZ290ICh1c2luZyBkYXRhKTogXCIrIGRhdGEpO1xuICAgICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNV18MDtcbiAgICAgICAgICBsb2coXCJwb3NpdGlvbjogXCIrUG9zTm8pXG4gICAgICAgICAgdmFyIE1vdmVJc3N1ZVBpcGVMaW5lID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3Zlcyc7XG4gICAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuXG4gICAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgICAgcGlwZWxpbmVfaWQ6IGRhdGEsXG4gICAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgICAgVXJsVHlwZTonSXNzdWVUb1BpcGVsaW5lcydcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbG9nKFwidXJsIGJ1aWx0LlwiKTtcbiAgICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gICAgICAgIH0pOyBcbiAgICAgIH1cblxuICAgICBcbiAgICAgIC8vIEdldCBldmVudHMgZm9yIHRoZSBJc3N1ZSBcbiAgICAgIHZhciBFdmVudHNSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHNldmVudHMvKTtcblxuICAgICAgaWYgKEV2ZW50c1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgICBsb2coXCJpc3N1ZSBubyBldmVudHNyZWdleCBcIitJc3N1ZU5vKTtcbiAgICAgICAgdmFyIEV2ZW50c1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXZlbnRzJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBFdmVudHNVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidJc3N1ZUV2ZW50cydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG4gICAgICBcbiAgICAgIC8vIFNldCB0aGUgZXN0aW1hdGUgZm9yIHRoZSBpc3N1ZS5cbiAgICAgIHZhciBFc3RpbWF0ZUFkZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1lXFxzWzAtOV0qLyk7XG5cbiAgICAgIGlmIChFc3RpbWF0ZUFkZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgICB2YXIgRXN0aW1hdGVWYWwgPSBDb21tYW5kQXJyWzRdO1xuICAgICAgICBsb2coXCJFc3RpbWF0ZVZhbCA6IFwiK0VzdGltYXRlVmFsKVxuICAgICAgICB2YXIgU2V0RXN0aW1hdGUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2VzdGltYXRlJztcblxuICAgICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgICAgXCJlc3RpbWF0ZVwiOiBFc3RpbWF0ZVZhbFxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFNldEVzdGltYXRlLFxuICAgICAgICAgIE1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXN0aW1hdGUnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvLyBHZXQgQnVncyBieSB0aGUgdXNlclxuICAgICAgdmFyIEJ1Z1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc2J1Zy8pO1xuXG4gICAgICBpZiAoQnVnUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIHZhciBCdWdVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogQnVnVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonQnVnSXNzdWVzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy9UbyBHZXQgVXNlciBJc3N1ZSBieSB1c2VyLCB1c2VySXNzdWVcbiAgICAgIHZhciBVc2VyUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzLXVcXHNbQS1aYS16MC05XSovKTtcblxuICAgICAgaWYgKFVzZXJSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBVc2VyVXJsID0gJyc7XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogVXNlclVybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J1VzZXJJc3N1ZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9LFxuXG5cbiAgLy9UbyBHZXQgQmxvY2tlZCBJc3N1ZXMgVXJsXG4gIGdldEJsb2NrVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIFxuICAgIGxvZyhcImdldEJsb2NrVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgQmxvY2t1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgVXJsOiBCbG9ja3VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTonQmxvY2tlZElzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuXG4gIC8vVG8gR2V0IGVwaWNzIFVybFxuICBnZXRFcGljVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIFxuICAgIGxvZyhcImdldEVwaWNVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIEVwaWNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9lcGljcyc7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZCA6IHRydWUsXG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6J0VwaWNJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH1cblxufTtcbiJdfQ==