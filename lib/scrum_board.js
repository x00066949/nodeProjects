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
    //var UrlBody;

    /*if(options.UBody == null){
      UrlBody = options.UBody;
      
    }else{
      UrlBody = options.UBody.estimate;            
     }*/

    var UMethod = options.UMethod;
    var UrlType = options.UType;

    log("Body : " + UrlBody);

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
        UrlBody: UrlBody

      }
    };

    log("UrlOpt : " + UrlOptions);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJkYXRlRm9ybWF0Iiwib3MiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsIlBpcGVsaW5lSWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsImhlYWRlcnMiLCJwcm9jZXNzIiwiZW52IiwiWkVOSFVCX1RPS0VOIiwianNvbiIsInRoZW4iLCJkYXRhIiwiaSIsImxlbmd0aCIsIm5hbWUiLCJpZCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIlZhbGlkQml0IiwiVmFsaWRDb21tYW5kcyIsIlZhbGlkQ29tbWFkUmVnZXgiLCJPcmlnaW5hbHNDb21tYW5kQXJyIiwic3BsaWNlIiwiRmluYWxDb21tYW5kIiwiam9pbiIsIlVybE9iamVjdCIsIklzc3VlUmVnZXgiLCJFcGljUmVnZXgiLCJCbG9ja2VkUmVnZXgiLCJnZXRSZXBvVXJsIiwiZ2V0QmxvY2tVcmwiLCJnZXRJc3N1ZVVybCIsImdldEVwaWNVcmwiLCJUb2tlbiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiVXJsQm9keSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJxcyIsImFjY2Vzc190b2tlbiIsImJvZHkiLCJzdWNjZXNzZGF0YSIsIkRhdGEiLCJKU09OIiwic3RyaW5naWZ5IiwidHlwZSIsInRvX3BpcGVsaW5lIiwiZnJvbV9waXBlbGluZSIsInVzZXJfaWQiLCJjcmVhdGVkX2F0IiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsInBpcGVsaW5lIiwiZXN0aW1hdGUiLCJlcGljX2lzc3VlcyIsImlzc3VlX251bWJlciIsImlzc3VlX3VybCIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaHRtbF91cmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkVzdGltYXRlVmFsIiwiU2V0RXN0aW1hdGUiLCJCdWdSZWdleCIsIkJ1Z1VybCIsIlVzZXJSZWdleCIsIkJsb2NrdXJsIiwiRXBpY1VybCJdLCJtYXBwaW5ncyI6Ijs7QUFPQTs7Ozs7O0FBUEEsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxLQUFLRCxRQUFRLGlCQUFSLENBQVQ7QUFDQSxJQUFJRSxRQUFRRixRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUlH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QUFJVixZQUFZO0FBQ2R2QyxpQkFBUyxJQURLO0FBRWRNLGFBQUsyQyxPQUZTO0FBR2R2QyxnQkFBUSxLQUhNO0FBSWRGLGNBQU0sSUFKUTtBQUtkUCxlQUFPLEtBTE87QUFNZFcsaUJBQVE7QUFOTSxPQUFoQjs7QUFTQSxhQUFPMkIsU0FBUDtBQUNEOztBQUVELFdBQU9BLFNBQVA7QUFDRCxHQXBtQlk7O0FBdW1CZjtBQUNBSyxlQUFhLDZDQUFVckUsV0FBVixFQUF1QlUsVUFBdkIsRUFBbUNHLE1BQW5DLEVBQTJDOztBQUV0RDFCLFFBQUksYUFBSjtBQUNBLFFBQUltSCxnQkFBZ0J6RixNQUFwQjtBQUNBLFFBQUkyRixVQUFVOUYsV0FBVyxDQUFYLENBQWQ7QUFDQSxRQUFJOEcsV0FBVyxxQkFBcUJsQixhQUFyQixHQUFxQyxVQUFyQyxHQUFrREUsT0FBakU7O0FBRUEsUUFBSXhDLFlBQVk7QUFDZGpDLFdBQUt5RixRQURTO0FBRWRyRixjQUFRLEtBRk07QUFHZEYsWUFBTSxJQUhRO0FBSWRQLGFBQU8sS0FKTztBQUtkVyxlQUFRO0FBTE0sS0FBaEI7O0FBUUEsV0FBTzJCLFNBQVA7QUFDRCxHQXhuQmM7O0FBMm5CZjtBQUNBTyxjQUFZLDRDQUFVdkUsV0FBVixFQUF1QlUsVUFBdkIsRUFBbUNHLE1BQW5DLEVBQTJDOztBQUVyRDFCLFFBQUksWUFBSjtBQUNBLFFBQUltSCxnQkFBZ0J6RixNQUFwQjtBQUNBLFFBQUk0RyxVQUFVLHFCQUFxQm5CLGFBQXJCLEdBQXFDLFFBQW5EOztBQUVBLFFBQUl0QyxZQUFZO0FBQ2R2QyxlQUFVLElBREk7QUFFZE0sV0FBSzBGLE9BRlM7QUFHZHRGLGNBQVEsS0FITTtBQUlkRixZQUFNLElBSlE7QUFLZFAsYUFBTyxLQUxPO0FBTWRXLGVBQVE7QUFOTSxLQUFoQjs7QUFTQSxXQUFPMkIsU0FBUDtBQUNEOztBQTVvQmMsQ0FBakIiLCJmaWxlIjoic2NydW1fYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG52YXIgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICAgdmFyIEZpbmFsTWVzc2FnZT1udWxsO1xuICAgIC8vICAgTWVzc2FnZSA6IG51bGwsXG4gICAgLy8gICBPcHRpb25zIDogbnVsbFxuICAgIC8vIH07XG5cbiAgICB2YXIgQ2hlY2tJZlZhbGlkQ29tbWFuZCA9IHRoaXMuY2hlY2tWYWxpZElucHV0KHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBVQ29tbWFuZDogVXNlckNvbW1hbmRcbiAgICB9KTtcblxuICAgIGlmICghQ2hlY2tJZlZhbGlkQ29tbWFuZCkge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kVmFsdWUgPSB0aGlzLmdldENvbW1hbmQoVXNlckNvbW1hbmQpO1xuXG4gICAgbG9nKFwiY29tbWFuZCB2YWwgOiBcIitDb21tYW5kVmFsdWUpO1xuXG4gICAgaWYgKENvbW1hbmRWYWx1ZSA9PT0gJycgfHwgQ29tbWFuZFZhbHVlID09PSBudWxsIHx8IHR5cGVvZiBDb21tYW5kVmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIrcmVwb19pZCk7XG5cbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gcmVwb19pZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuXG4gICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldLyk7XG4gICAgXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiK1JlcG9JZCk7XG5cbiAgICAgICAgUmVwb0lkID0gcmVwb19pZDtcbiAgICAgICAgXG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgTWVzc2FnZTogJ1N1Y2Nlc3MnLFxuICAgICAgICAgIE9wdGlvbnM6IHtcbiAgICAgICAgICAgIFJlc3Bvc2l0b3J5SWQ6IFJlcG9JZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogUmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgICBcbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgbG9nKFwidXJsIGlzIG5vdCB2YWxpZFwiKTtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIENvbW1hbmRzJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIGxvZyhcInVybCBpcyB2YWxpZFwiKVxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgbG9nKFwiaXMgR2l0IC4uXCIpXG4gICAgICB2YXIgVUNvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBHaXRSZXBvTmFtZSA9IFVDb21tYW5kQXJyWzFdO1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogR2l0UmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBsb2cgKFwibm90IGdpdFwiKTtcbiAgICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgVVVybDogVmFsaWRVcmxPYmplY3QuVXJsLFxuICAgICAgICBVQm9keTogVmFsaWRVcmxPYmplY3QuQm9keSxcbiAgICAgICAgVU1ldGhvZDogVmFsaWRVcmxPYmplY3QuTWV0aG9kLFxuICAgICAgICBVVHlwZTpWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIC8vZ2l2ZW4sIHBpcGVsaW5lIG5hbWUsIHJldHVybiBwaXBlbGluZSBpZFxuICBnZXRQaXBlbGluZUlkKFBpcGVsaW5lTmFtZSl7XG4gICAgbG9nKFwiZW50ZXJlZCBuYW1lIDogXCIrUGlwZWxpbmVOYW1lKVxuICAgIHZhciBQaXBlbGluZUlkO1xuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgcnAocGlwZWxpbmVJZFJlcXVlc3QpXG4gICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuICAgICAgXG4gICAgICBsb2coZGF0YSlcbiAgICAgIGZvciAodmFyIGkgPTA7IGk8ZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspe1xuICAgICAgICBsb2coXCJjaGVja2luZ1wiKVxuICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKXtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiK2RhdGFbJ3BpcGVsaW5lcyddW2ldLmlkKTtcbiAgICAgICAgICByZXR1cm4gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIitlcnIpXG4gICAgICByZXR1cm4gZXJyOyAgICBcbiAgICB9KSBcbiAgfSxcblxuICBjaGVja1ZhbGlkSW5wdXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVmFsaWRCaXQgPSBmYWxzZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVDb21tYW5kO1xuICAgIGNvbnNvbGUubG9nKFwidXNlciBjb21tYW5kIDogXCIrVXNlckNvbW1hbmQpO1xuICAgIFxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIitVc2VyQ29tbWFuZCk7XG5cblxuICAgIGlmICghVmFsaWRDb21tYWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSl7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICAgIFxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIC8vaWYgL3JlcG8gY29tZXMgYWZ0ZXIgQHNjcnVtYm90LCBubyByZXBvIGlkIHByb3ZpZGVkIGVsc2UgdGFrZSB3aGF0ZXZlciBjb21lcyBhZnRlciBAc2NydW1ib3QgYXMgcmVwb19pZFxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSBWYWxpZENvbW1hbmRzWzFdKXtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIrRmluYWxDb21tYW5kKTtcblxuICAgIHJldHVybiBWYWxpZEJpdCA9IHRydWU7XG4gIH0sXG5cbiAgZ2V0Q29tbWFuZDogZnVuY3Rpb24gKFVDb21tYW5kKSB7XG4gICAgbG9nKFwiZ2V0Q29tbWFuZFwiKTtcbiAgICB2YXIgVmFsaWRCaXQgPSAnJztcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBVQ29tbWFuZDtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgdHlwZW9mIFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gJy9yZXBvJyl7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2cgKFwiZmlyc3RseSBpbml0aWFsaXNpaW5nIHJlcG9faWQgYXMgXCIrcmVwb19pZCArXCIgZnJvbSBtZXNzYWdlIGFyZyBhdCBwb3MgMSA9IFwiK0NvbW1hbmRBcnJbMV0pO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgXG4gICAgbG9nKFwicmVwbyBpZCAyIDogXCIrcmVwb19pZCk7ICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBGaW5hbENvbW1hbmQ7XG4gIH0sXG5cbiAgdmFsaWRhdGVDb21tYW5kczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIGxvZyhcInZhbGlkYXRlQ29tbWFuZHNcIik7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLkNvbW1hbmQ7XG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIFxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuICAgIGlmIChSZXBvUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKTtcblxuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKEJsb2NrZWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEJsb2NrVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKElzc3VlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgbG9nKFwiVXJsT2JqZWN0ID0gXCIrVXJsT2JqZWN0KTtcbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG5cbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgbG9nKFwibWFrZVJlcXVlc3RcIik7XG4gICAgbG9nKG9wdGlvbnMuVUJvZHkpXG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFRva2VuID0gcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby8nO1xuXG4gICAgdmFyIFVzZXJVcmwgPSBvcHRpb25zLlVVcmw7XG4gICAgdmFyIFVybEJvZHkgPSBvcHRpb25zLlVCb2R5O1xuICAgIC8vdmFyIFVybEJvZHk7XG4gIFxuICAgIC8qaWYob3B0aW9ucy5VQm9keSA9PSBudWxsKXtcbiAgICAgIFVybEJvZHkgPSBvcHRpb25zLlVCb2R5O1xuICAgICAgXG4gICAgfWVsc2V7XG4gICAgICBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keS5lc3RpbWF0ZTsgICAgICAgICAgICBcblxuICAgIH0qL1xuICBcbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcbiAgICB2YXIgVXJsVHlwZSA9IG9wdGlvbnMuVVR5cGU7XG4gICAgXG4gICAgbG9nKFwiQm9keSA6IFwiK1VybEJvZHkpO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICBtZXRob2Q6IFVNZXRob2QsXG4gICAgICB1cmk6IE1haW5VcmwgKyBVc2VyVXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgICAgICAsXG4gICAgICAgIFxuICAgICAgYm9keToge1xuICAgICAgICBVcmxCb2R5XG5cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbG9nKFwiVXJsT3B0IDogXCIrVXJsT3B0aW9ucyk7XG4gICAgXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIERhdGEgPSBzdWNjZXNzZGF0YTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZvbGxvd2luZyBEYXRhID0nICsgSlNPTi5zdHJpbmdpZnkoRGF0YSkpO1xuXG4gICAgICAgIC8vUGFyc2UgSlNPTiBhY2NvcmRpbmcgdG8gb2JqIHJldHVybmVkXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdJc3N1ZUV2ZW50cycpe1xuICAgICAgICAgIGxvZyhcIkV2ZW50cyBmb3IgaXNzdWVcIik7XG4gICAgICAgICAgRGF0YSA9ICdcXG4gICAgKkhlcmUgYXJlIHRoZSBtb3N0IHJlY2VudCBldmVudHMgcmVnYXJkaW5nIHlvdXIgaXNzdWU6KiAnO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9MDsgaTxzdWNjZXNzZGF0YS5sZW5ndGg7IGkrKyl7XG5cbiAgICAgICAgICAgIGlmKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICd0cmFuc2Zlcklzc3VlJyl7XG4gICAgICAgICAgICAgIGxvZyhcInBpcGVsaW5lIG1vdmUgZXZlbnRcIitKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZSkrc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZSk7XG4gICAgICAgICAgICAgIERhdGEgKz0gJ1xcbipVc2VyICcgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQrICcqIF9tb3ZlZF8gdGhpcyBpc3N1ZSBmcm9tICcrc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZS5uYW1lKycgdG8gJytzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZS5uYW1lKycgb24gZGF0ZSA6ICcrZGF0ZUZvcm1hdChzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0LCBcImRkZGQsIG1tbW0gZFMsIHl5eXlcIik7XG4gIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoc3VjY2Vzc2RhdGFbaV0udHlwZSA9PT0gJ2VzdGltYXRlSXNzdWUnKXtcbiAgICAgICAgICAgICAgbG9nKFwiZXN0aW1hdGUgY2hhbmdlIGV2ZW50IFwiK2kpO1xuICAgICAgICAgICAgICBEYXRhICs9ICdcXG4gKlVzZXIgJyArc3VjY2Vzc2RhdGFbaV0udXNlcl9pZCsgJyogX2NoYW5nZWQgZXN0aW1hdGVfIG9uIHRoaXMgaXNzdWUgdG8gICcrc3VjY2Vzc2RhdGFbaV0udG9fZXN0aW1hdGUudmFsdWUrJyBvbiBkYXRlIDogJytkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcbiAgXG4gICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgIGxvZyhcImRvIG5vdCByZWNvZ2lzZSBldmVudCB0eXBlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICAgIERhdGEgKz0gXCIgXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZihVcmxUeXBlID09PSAnR2V0UGlwZWxpbmUnKXtcblxuICAgICAgICAgIERhdGEgPSBcIiBcIjtcbiAgICAgICAgICBEYXRhICs9IFwiVGhhdCBpc3N1ZSBpcyBjdXJyZW50bHkgaW4gXCIrc3VjY2Vzc2RhdGEucGlwZWxpbmUubmFtZStcIiBwaXBlbGluZS5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdJc3N1ZUVzdGltYXRlJyl7XG4gICAgICAgICAgRGF0YSA9ICcnO1xuICAgICAgICAgIERhdGEgKz0gJ1lvdXIgSXNzdWVcXCdzIGVzdGltYXRlIGhhcyBiZWVuIHVwZGF0ZWQgdG8gJytzdWNjZXNzZGF0YS5lc3RpbWF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdFcGljSXNzdWVzJyl7XG4gICAgICAgICAgXG4gICAgICAgICAgRGF0YSA9IFwiVGhlIGZvbGxvd2luZyBFcGljcyBhcmUgaW4geW91ciBzY3J1bWJvYXJkOiBcIjtcbiAgICAgICAgICBmb3IgKHZhciBpID0wOyBpPHN1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIERhdGEgKz0gYFxcbiBFcGljIElEOiAgJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV9udW1iZXJ9IFVybCA6ICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfdXJsfSBgXG4gICAgICAgICAgICBcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gRGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgZm9sbG93aW5nIGVycm9yID0nICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH0pO1xuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuICAgIHZhciBSZXBvc2l0b3J5VXJsID0gJ3JlcG9zLycgKyBPd25lcm5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tLyc7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIHVyaTogTWFpblVybCArIFJlcG9zaXRvcnlVcmwsXG4gICAgICBxczoge1xuICAgICAgICAvL2FjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuXG4gICAgICAgIHJlcG9faWQgPSBSZXBvSWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKHN1Y2Nlc3NkYXRhKTtcbiAgICAgICAgcmV0dXJuIFwiVGhlICpSZXBvc2l0b3J5IElkKiBmb3IgX1wiK1JlcG9zaXRvcnlOYW1lK1wiXyBpcyBcIitKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YS5pZCkrXCIgVmlldyByZXBvIGF0IDogXCIrc3VjY2Vzc2RhdGEuaHRtbF91cmw7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgbG9nKFwiQVBJIGNhbGwgZmFpbGVkLi4uXCIpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgJWQgcmVwb3MnLCBlcnIpO1xuICAgICAgfSk7XG5cbiAgfSxcblxuICAvLyBUbyBHZXQgUmVwbyBVcmxcbiAgZ2V0UmVwb1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKSB7XG5cbiAgICBsb2coXCJnZXRSZXBvVXJsXCIpO1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEdpdE93bmVyTmFtZSA9ICd4MDAwNjY5NDknO1xuICAgIHZhciBSZXBvc2l0b3J5SWQgPSAncmVwb3MvJyArIEdpdE93bmVyTmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IFJlcG9zaXRvcnlJZCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IHRydWVcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuICAvL1RvIEdldCBJc3N1ZSByZWxhdGVkIFVybFxuICBnZXRJc3N1ZVVybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRJc3N1ZVVybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZVxuICAgIH07XG5cbiAgICAvL1RvIEdldCBTdGF0ZSBvZiBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICBpZiAoUGlwZWxpbmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICBsb2coXCJpc3N1ZSBOdW0gaW4gZ2V0SVNzdWVVcmwgOiBcIitJc3N1ZU5vKTtcbiAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOidHZXRQaXBlbGluZSdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG4gICAgXG4gICAgLy8gTW92ZSBQaXBlbGluZVxuICAgIHZhciBQaXBlbGluZU1vdmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtcFxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgaWYgKFBpcGVsaW5lTW92ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIC8vaWYgbW92aW5nIHBpcGVsaW5lLCAzcmQgYXJnIGlzIGlzc3VlIG51bSwgIDR0aCA9IC1wLCA1dGggPSBwaXBlbGluZSwgNnQgcG9zaXRpb25cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcIm5hbWUgdXNlZCBcIisgQ29tbWFuZEFycls0XSlcbiAgICAgIHRoaXMuZ2V0UGlwZWxpbmVJZChDb21tYW5kQXJyWzRdKS50aGVuKGZ1bmN0aW9uIChkYXRhKXtcblxuICAgICAgICBsb2coXCJQaXBlbGluZSBnb3QgKHVzaW5nIGRhdGEpOiBcIisgZGF0YSk7XG4gICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNV18MDtcbiAgICAgICAgbG9nKFwicG9zaXRpb246IFwiK1Bvc05vKVxuICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBwaXBlbGluZV9pZDogZGF0YSxcbiAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidJc3N1ZVRvUGlwZWxpbmVzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGxvZyhcInVybCBidWlsdC5cIik7XG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgICAgICAgfSk7IFxuICAgICAgfVxuXG4gICAgIFxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIGxvZyhcImlzc3VlIG5vIGV2ZW50c3JlZ2V4IFwiK0lzc3VlTm8pO1xuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXZlbnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIFxuICAgICAgLy8gU2V0IHRoZSBlc3RpbWF0ZSBmb3IgdGhlIGlzc3VlLlxuICAgICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgICAgaWYgKEVzdGltYXRlQWRkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIHZhciBFc3RpbWF0ZVZhbCA9IENvbW1hbmRBcnJbNF07XG4gICAgICAgIGxvZyhcIkVzdGltYXRlVmFsIDogXCIrRXN0aW1hdGVWYWwpXG4gICAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBlc3RpbWF0ZSA6IEVzdGltYXRlVmFsXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogU2V0RXN0aW1hdGUsXG4gICAgICAgICAgTWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonSXNzdWVFc3RpbWF0ZSdcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgdmFyIEJ1Z1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBCdWdVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidCdWdJc3N1ZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXIsIHVzZXJJc3N1ZVxuICAgICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIFVzZXJVcmwgPSAnJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBVc2VyVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonVXNlcklzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH0sXG5cblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0QmxvY2tVcmxcIik7XG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBCbG9ja3VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEJsb2NrdXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOidCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgXG4gICAgbG9nKFwiZ2V0RXBpY1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkIDogdHJ1ZSxcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTonRXBpY0lzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfVxuXG59O1xuIl19