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
        Data = "*Here are the most recent events regarding your issue:* ";

        for (var i = 0; i < successdata.length; i++) {

          if (successdata[i].type === 'transferIssue') {
            log("pipeline move event" + JSON.stringify(successdata[i].to_pipeline) + successdata[i].from_pipeline);
            Data += "\
              *User " + successdata[i].user_id + "* _moved_ this issue from " + successdata[i].from_pipeline.name + " to " + successdata[i].to_pipeline.name + " on date : " + dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
          }
          if (successdata[i].type === 'estimateIssue') {
            log("estimate change event " + i);
            Data += "\
              *User " + successdata[i].user_id + "* _changed estimate_ on this \n issue \\n to  " + successdata[i].to_estimate.value + " on date : " + dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
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
        Data = " ";
        Data += "Your Issue's estimate has been updated to " + successdata.estimate;
      }

      if (UrlType === 'EpicIssues') {

        Data = "The following Epics are in your scrumboard: ";
        for (var i = 0; i < successdata.epic_issues.length; i++) {
          Data += /*istanbul ignore next*/'\n Epic ID:  ' + successdata.epic_issues[i].issue_number + ' Url : ' + successdata.epic_issues[i].issue_url + ' ';
          //" *"+(i+1)+"* Epic ID: "+successdata.epic_issues[i].issue_number+" Url : "+successdata.epic_issues[i].issue_url+" "+os.EOL;
        }
      }

      //return JSON.stringify(Data);
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
      this.getPipelineId(CommandArr[4]).then(function (data) {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJkYXRlRm9ybWF0Iiwib3MiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsIlBpcGVsaW5lSWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsImhlYWRlcnMiLCJwcm9jZXNzIiwiZW52IiwiWkVOSFVCX1RPS0VOIiwianNvbiIsInRoZW4iLCJkYXRhIiwiaSIsImxlbmd0aCIsIm5hbWUiLCJpZCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIlZhbGlkQml0IiwiVmFsaWRDb21tYW5kcyIsIlZhbGlkQ29tbWFkUmVnZXgiLCJPcmlnaW5hbHNDb21tYW5kQXJyIiwic3BsaWNlIiwiRmluYWxDb21tYW5kIiwiam9pbiIsIlVybE9iamVjdCIsIklzc3VlUmVnZXgiLCJFcGljUmVnZXgiLCJCbG9ja2VkUmVnZXgiLCJnZXRSZXBvVXJsIiwiZ2V0QmxvY2tVcmwiLCJnZXRJc3N1ZVVybCIsImdldEVwaWNVcmwiLCJUb2tlbiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiVXJsQm9keSIsImVzdGltYXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJxcyIsImFjY2Vzc190b2tlbiIsImJvZHkiLCJzdWNjZXNzZGF0YSIsIkRhdGEiLCJ0eXBlIiwidG9fcGlwZWxpbmUiLCJmcm9tX3BpcGVsaW5lIiwidXNlcl9pZCIsImNyZWF0ZWRfYXQiLCJ0b19lc3RpbWF0ZSIsInZhbHVlIiwicGlwZWxpbmUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaHRtbF91cmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkVzdGltYXRlVmFsIiwiU2V0RXN0aW1hdGUiLCJCdWdSZWdleCIsIkJ1Z1VybCIsIlVzZXJSZWdleCIsIkJsb2NrdXJsIiwiRXBpY1VybCJdLCJtYXBwaW5ncyI6Ijs7QUFPQTs7Ozs7O0FBUEEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlH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QUFJZEYsWUFBTSxJQUpRO0FBS2RQLGFBQU8sS0FMTztBQU1kVyxlQUFRO0FBTk0sS0FBaEI7O0FBU0EsV0FBTzJCLFNBQVA7QUFDRDs7QUFocEJjLENBQWpCIiwiZmlsZSI6InNjcnVtX2JvYXJkLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xudmFyIG9zID0gcmVxdWlyZShcIm9zXCIpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgcmVwb19pZDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblxuICBjYWxsTWU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgdGVzdCA9IG9wdGlvbnMudGVzdDtcblxuICAgIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICBcIlVzZXJJZFwiOiBcIk1hcFwiLFxuICAgICAgXCJDaGVja1wiOiB0ZXN0XG4gICAgfTtcblxuICAgIHJldHVybiBGaW5hbERhdGE7XG4gIH0sXG5cbiAgZ2V0U2NydW1EYXRhKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVXNlcklucHV0O1xuXG4gICAgIHZhciBGaW5hbE1lc3NhZ2U9bnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZFZhbHVlID0gdGhpcy5nZXRDb21tYW5kKFVzZXJDb21tYW5kKTtcblxuICAgIGxvZyhcImNvbW1hbmQgdmFsIDogXCIrQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGxvZyhcInJlcG8gaWQgMSA6IFwiK3JlcG9faWQpO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoUmVwb3NpdG9yeUlkID09PSBudWxsIHx8IFJlcG9zaXRvcnlJZCA9PT0gJycgfHwgdHlwZW9mIFJlcG9zaXRvcnlJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGxvZyhcInRyeWluZyB0byBnZXQgcmVwbyBpZFwiKTtcbiAgICAgIC8vdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKlxcc1swLTldKi8pO1xuXG4gICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldLyk7XG4gICAgXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiK1JlcG9JZCk7XG5cbiAgICAgICAgUmVwb0lkID0gcmVwb19pZDtcbiAgICAgICAgXG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgTWVzc2FnZTogJ1N1Y2Nlc3MnLFxuICAgICAgICAgIE9wdGlvbnM6IHtcbiAgICAgICAgICAgIFJlc3Bvc2l0b3J5SWQ6IFJlcG9JZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogUmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgICBcbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgbG9nKFwidXJsIGlzIG5vdCB2YWxpZFwiKTtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIENvbW1hbmRzJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIGxvZyhcInVybCBpcyB2YWxpZFwiKVxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgbG9nKFwiaXMgR2l0IC4uXCIpXG4gICAgICB2YXIgVUNvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBHaXRSZXBvTmFtZSA9IFVDb21tYW5kQXJyWzFdO1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogR2l0UmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBsb2cgKFwibm90IGdpdFwiKTtcbiAgICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgVVVybDogVmFsaWRVcmxPYmplY3QuVXJsLFxuICAgICAgICBVQm9keTogVmFsaWRVcmxPYmplY3QuQm9keSxcbiAgICAgICAgVU1ldGhvZDogVmFsaWRVcmxPYmplY3QuTWV0aG9kLFxuICAgICAgICBVVHlwZTpWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIC8vZ2l2ZW4sIHBpcGVsaW5lIG5hbWUsIHJldHVybiBwaXBlbGluZSBpZFxuICBnZXRQaXBlbGluZUlkKFBpcGVsaW5lTmFtZSl7XG4gICAgbG9nKFwiZW50ZXJlZCBuYW1lIDogXCIrUGlwZWxpbmVOYW1lKVxuICAgIHZhciBQaXBlbGluZUlkO1xuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgcnAocGlwZWxpbmVJZFJlcXVlc3QpXG4gICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuICAgICAgXG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPTA7IGk8ZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspe1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKXtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiK2RhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICByZXR1cm4gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIitlcnIpXG4gICAgICByZXR1cm4gZXJyOyAgICBcbiAgICB9KSBcbiAgfSxcblxuICBjaGVja1ZhbGlkSW5wdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVmFsaWRCaXQgPSBmYWxzZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVDb21tYW5kO1xuICAgIGNvbnNvbGUubG9nKFwidXNlciBjb21tYW5kIDogXCIrVXNlckNvbW1hbmQpO1xuICAgIFxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIitVc2VyQ29tbWFuZCk7XG5cblxuICAgIGlmICghVmFsaWRDb21tYWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSl7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICAgIFxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIC8vaWYgL3JlcG8gY29tZXMgYWZ0ZXIgQHNjcnVtYm90LCBubyByZXBvIGlkIHByb3ZpZGVkIGVsc2UgdGFrZSB3aGF0ZXZlciBjb21lcyBhZnRlciBAc2NydW1ib3QgYXMgcmVwb19pZFxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSBWYWxpZENvbW1hbmRzWzFdKXtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIrRmluYWxDb21tYW5kKTtcblxuICAgIHJldHVybiBWYWxpZEJpdCA9IHRydWU7XG4gIH0sXG5cbiAgZ2V0Q29tbWFuZDogZnVuY3Rpb24gKFVDb21tYW5kKSB7XG4gICAgbG9nKFwiZ2V0Q29tbWFuZFwiKTtcbiAgICB2YXIgVmFsaWRCaXQgPSAnJztcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBVQ29tbWFuZDtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgdHlwZW9mIFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gJy9yZXBvJyl7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2cgKFwiZmlyc3RseSBpbml0aWFsaXNpaW5nIHJlcG9faWQgYXMgXCIrcmVwb19pZCArXCIgZnJvbSBtZXNzYWdlIGFyZyBhdCBwb3MgMSA9IFwiK0NvbW1hbmRBcnJbMV0pO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgXG4gICAgbG9nKFwicmVwbyBpZCAyIDogXCIrcmVwb19pZCk7ICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBGaW5hbENvbW1hbmQ7XG4gIH0sXG5cbiAgdmFsaWRhdGVDb21tYW5kczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIGxvZyhcInZhbGlkYXRlQ29tbWFuZHNcIik7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLkNvbW1hbmQ7XG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIFxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuICAgIGlmIChSZXBvUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKTtcblxuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKEJsb2NrZWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEJsb2NrVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKElzc3VlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgbG9nKFwiVXJsT2JqZWN0ID0gXCIrVXJsT2JqZWN0KTtcbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG5cbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgbG9nKFwibWFrZVJlcXVlc3RcIik7XG4gICAgbG9nKG9wdGlvbnMuVUJvZHkpXG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFRva2VuID0gcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby8nO1xuXG4gICAgdmFyIFVzZXJVcmwgPSBvcHRpb25zLlVVcmw7XG4gICAgdmFyIFVybEJvZHkgPSBvcHRpb25zLlVCb2R5O1xuICAgIHZhciBVcmxCb2R5O1xuICBcbiAgICBpZihvcHRpb25zLlVCb2R5ID09IG51bGwpe1xuICAgICAgVXJsQm9keSA9IG9wdGlvbnMuVUJvZHk7XG4gICAgICBcbiAgICB9ZWxzZXtcbiAgICAgIFVybEJvZHkgPSBvcHRpb25zLlVCb2R5LmVzdGltYXRlOyAgICAgICAgICAgIFxuXG4gICAgfVxuICBcbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcbiAgICB2YXIgVXJsVHlwZSA9IG9wdGlvbnMuVVR5cGU7XG4gICAgXG4gICAgbG9nKFwiQm9keSA6IFwiK0pTT04uc3RyaW5naWZ5KFVybEJvZHkpKTtcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgbWV0aG9kOiBVTWV0aG9kLFxuICAgICAgdXJpOiBNYWluVXJsICsgVXNlclVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgLFxuICAgICAgICBcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZXN0aW1hdGU6IFVybEJvZHlcbiAgICAgICAgLy9VcmxCb2R5XG5cbiAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcblxuICAgICAgICAvL1BhcnNlIEpTT04gYWNjb3JkaW5nIHRvIG9iaiByZXR1cm5lZFxuICAgICAgICBpZihVcmxUeXBlID09PSAnSXNzdWVFdmVudHMnKXtcbiAgICAgICAgICBsb2coXCJFdmVudHMgZm9yIGlzc3VlXCIpO1xuICAgICAgICAgIERhdGEgPSBcIipIZXJlIGFyZSB0aGUgbW9zdCByZWNlbnQgZXZlbnRzIHJlZ2FyZGluZyB5b3VyIGlzc3VlOiogXCI7XG5cbiAgICAgICAgICBmb3IgKHZhciBpID0wOyBpPHN1Y2Nlc3NkYXRhLmxlbmd0aDsgaSsrKXtcblxuICAgICAgICAgICAgaWYoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ3RyYW5zZmVySXNzdWUnKXtcbiAgICAgICAgICAgICAgbG9nKFwicGlwZWxpbmUgbW92ZSBldmVudFwiK0pTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhW2ldLnRvX3BpcGVsaW5lKStzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lKTtcbiAgICAgICAgICAgICAgRGF0YSArPSBcIlxcXG4gICAgICAgICAgICAgICpVc2VyIFwiICtzdWNjZXNzZGF0YVtpXS51c2VyX2lkKyBcIiogX21vdmVkXyB0aGlzIGlzc3VlIGZyb20gXCIrc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZS5uYW1lK1wiIHRvIFwiK3N1Y2Nlc3NkYXRhW2ldLnRvX3BpcGVsaW5lLm5hbWUrXCIgb24gZGF0ZSA6IFwiK2RhdGVGb3JtYXQoc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZF9hdCwgXCJkZGRkLCBtbW1tIGRTLCB5eXl5XCIpO1xuICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICdlc3RpbWF0ZUlzc3VlJyl7XG4gICAgICAgICAgICAgIGxvZyhcImVzdGltYXRlIGNoYW5nZSBldmVudCBcIitpKTtcbiAgICAgICAgICAgICAgRGF0YSArPSBcIlxcXG4gICAgICAgICAgICAgICpVc2VyIFwiICtzdWNjZXNzZGF0YVtpXS51c2VyX2lkKyBcIiogX2NoYW5nZWQgZXN0aW1hdGVfIG9uIHRoaXMgXFxuIGlzc3VlIFxcXFxuIHRvICBcIitzdWNjZXNzZGF0YVtpXS50b19lc3RpbWF0ZS52YWx1ZStcIiBvbiBkYXRlIDogXCIrZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG4gIFxuICAgICAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgICBsb2coXCJkbyBub3QgcmVjb2dpc2UgZXZlbnQgdHlwZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgIH1cbiAgICAgICAgICBEYXRhICs9IFwiIFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0dldFBpcGVsaW5lJyl7XG5cbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIlRoYXQgaXNzdWUgaXMgY3VycmVudGx5IGluIFwiK3N1Y2Nlc3NkYXRhLnBpcGVsaW5lLm5hbWUrXCIgcGlwZWxpbmUuXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZihVcmxUeXBlID09PSAnSXNzdWVFc3RpbWF0ZScpe1xuICAgICAgICAgIERhdGEgPSBcIiBcIjtcbiAgICAgICAgICBEYXRhICs9IFwiWW91ciBJc3N1ZSdzIGVzdGltYXRlIGhhcyBiZWVuIHVwZGF0ZWQgdG8gXCIrc3VjY2Vzc2RhdGEuZXN0aW1hdGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZihVcmxUeXBlID09PSAnRXBpY0lzc3Vlcycpe1xuICAgICAgICAgIFxuICAgICAgICAgIERhdGEgPSBcIlRoZSBmb2xsb3dpbmcgRXBpY3MgYXJlIGluIHlvdXIgc2NydW1ib2FyZDogXCI7XG4gICAgICAgICAgZm9yICh2YXIgaSA9MDsgaTxzdWNjZXNzZGF0YS5lcGljX2lzc3Vlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBEYXRhICs9IGBcXG4gRXBpYyBJRDogICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfbnVtYmVyfSBVcmwgOiAke3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX3VybH0gYFxuICAgICAgICAgICAgLy9cIiAqXCIrKGkrMSkrXCIqIEVwaWMgSUQ6IFwiK3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX251bWJlcitcIiBVcmwgOiBcIitzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV91cmwrXCIgXCIrb3MuRU9MO1xuICAgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9yZXR1cm4gSlNPTi5zdHJpbmdpZnkoRGF0YSk7XG4gICAgICAgIHJldHVybiBEYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyBmb2xsb3dpbmcgZXJyb3IgPScgKyBlcnIpO1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgfSk7XG5cbiAgfSxcblxuXG4gIC8vIFRvIEdldCBSZXBvc2l0b3J5IElkXG4gIGdldFJlc3Bvc2l0b3J5SWQ6IGZ1bmN0aW9uIChPcHRpb25zKSB7XG4gICAgbG9nKFwiZ2V0UmVwb3NpdG9yeUlkXCIpO1xuICAgIHZhciByZXMgPSBPcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciByZXEgPSBPcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gT3B0aW9ucy5yZXBvTmFtZTtcbiAgICB2YXIgT3duZXJuYW1lID0gT3B0aW9ucy5HaXRPd25lck5hbWU7XG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIC8vYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgUmVwb0lkID0gc3VjY2Vzc2RhdGEuaWQ7XG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc2RhdGEpO1xuICAgICAgICByZXR1cm4gXCJUaGUgKlJlcG9zaXRvcnkgSWQqIGZvciBfXCIrUmVwb3NpdG9yeU5hbWUrXCJfIGlzIFwiK0pTT04uc3RyaW5naWZ5KHN1Y2Nlc3NkYXRhLmlkKStcIiBWaWV3IHJlcG8gYXQgOiBcIitzdWNjZXNzZGF0YS5odG1sX3VybDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBsb2coXCJBUEkgY2FsbCBmYWlsZWQuLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICB9KTtcblxuICB9LFxuXG4gIC8vIFRvIEdldCBSZXBvIFVybFxuICBnZXRSZXBvVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpIHtcblxuICAgIGxvZyhcImdldFJlcG9VcmxcIik7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgR2l0T3duZXJOYW1lID0gJ3gwMDA2Njk0OSc7XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9ICdyZXBvcy8nICsgR2l0T3duZXJOYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogUmVwb3NpdG9yeUlkLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogdHJ1ZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IElzc3VlIHJlbGF0ZWQgVXJsXG4gIGdldElzc3VlVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldElzc3VlVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIC8vVG8gR2V0IFN0YXRlIG9mIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzcGlwZWxpbmUvKTtcblxuICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiK0lzc3VlTm8pO1xuICAgICAgdmFyIFBpcGVMaW5ldXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFBpcGVMaW5ldXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6J0dldFBpcGVsaW5lJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cbiAgICBcbiAgICAvLyBNb3ZlIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICBpZiAoUGlwZWxpbmVNb3ZlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgLy9pZiBtb3ZpbmcgcGlwZWxpbmUsIDNyZCBhcmcgaXMgaXNzdWUgbnVtLCAgNHRoID0gLXAsIDV0aCA9IHBpcGVsaW5lLCA2dCBwb3NpdGlvblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwibmFtZSB1c2VkIFwiKyBDb21tYW5kQXJyWzRdKVxuICAgICAgdGhpcy5nZXRQaXBlbGluZUlkKENvbW1hbmRBcnJbNF0pLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuXG4gICAgICAgIGxvZyhcIlBpcGVsaW5lIGdvdCAodXNpbmcgZGF0YSk6IFwiKyBkYXRhKTtcbiAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls1XXwwO1xuICAgICAgICBsb2coXCJwb3NpdGlvbjogXCIrUG9zTm8pXG4gICAgICAgIHZhciBNb3ZlSXNzdWVQaXBlTGluZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnO1xuICAgICAgICBsb2coXCJidWlsZGluZyBtb3ZlIHBpcGVsaW5lIHVybC4uXCIpXG5cbiAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIHBpcGVsaW5lX2lkOiBkYXRhLFxuICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlVG9QaXBlbGluZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgbG9nKFwidXJsIGJ1aWx0LlwiKTtcbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgICAgICB9KTsgXG4gICAgICB9XG5cbiAgICAgXG4gICAgICAvLyBHZXQgZXZlbnRzIGZvciB0aGUgSXNzdWUgXG4gICAgICB2YXIgRXZlbnRzUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzZXZlbnRzLyk7XG5cbiAgICAgIGlmIChFdmVudHNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgbG9nKFwiaXNzdWUgbm8gZXZlbnRzcmVnZXggXCIrSXNzdWVObyk7XG4gICAgICAgIHZhciBFdmVudHNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2V2ZW50cyc7XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogRXZlbnRzVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonSXNzdWVFdmVudHMnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuICAgICAgXG4gICAgICAvLyBTZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoRXN0aW1hdGVBZGRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgdmFyIEVzdGltYXRlVmFsID0gQ29tbWFuZEFycls0XTtcbiAgICAgICAgbG9nKFwiRXN0aW1hdGVWYWwgOiBcIitFc3RpbWF0ZVZhbClcbiAgICAgICAgdmFyIFNldEVzdGltYXRlID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9lc3RpbWF0ZSc7XG5cbiAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIFwiZXN0aW1hdGVcIjogRXN0aW1hdGVWYWxcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBTZXRFc3RpbWF0ZSxcbiAgICAgICAgICBNZXRob2Q6ICdQVVQnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidJc3N1ZUVzdGltYXRlJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy8gR2V0IEJ1Z3MgYnkgdGhlIHVzZXJcbiAgICAgIHZhciBCdWdSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNidWcvKTtcblxuICAgICAgaWYgKEJ1Z1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0J1Z0lzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vVG8gR2V0IFVzZXIgSXNzdWUgYnkgdXNlciwgdXNlcklzc3VlXG4gICAgICB2YXIgVXNlclJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy11XFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChVc2VyUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgVXNlclVybCA9ICcnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFVzZXJVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidVc2VySXNzdWVzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfSxcblxuXG4gIC8vVG8gR2V0IEJsb2NrZWQgSXNzdWVzIFVybFxuICBnZXRCbG9ja1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBcbiAgICBsb2coXCJnZXRCbG9ja1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEJsb2NrdXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogQmxvY2t1cmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6J0Jsb2NrZWRJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cblxuICAvL1RvIEdldCBlcGljcyBVcmxcbiAgZ2V0RXBpY1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBcbiAgICBsb2coXCJnZXRFcGljVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBFcGljVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvZXBpY3MnO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQgOiB0cnVlLFxuICAgICAgVXJsOiBFcGljVXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOidFcGljSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9XG5cbn07XG4iXX0=