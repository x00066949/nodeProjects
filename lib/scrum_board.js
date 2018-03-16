/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');

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
        if (data['pipelines'][i].name === PipelineName) {
          log("found pipeline id : " + data['pipelines'][i].id);
          return data['pipelines'][i].id;
        }
      }

      log("did not find id corresponding to pipe name");
      //return data;
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
      //--
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
      //--
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
    //console.dir(options.request, {depth:null});

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

    console.dir(UrlOptions, { depth: null });

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
            console.dir(successdata[i], { depth: null });
            Data += "\n*User " + successdata[i].user_id + "* _moved_ this issue from " + successdata[i].from_pipeline.name + " to " + successdata[i].to_pipeline.name + "\n";
          }
          if (successdata[i].type === 'estimateIssue') {
            log("estimate change event " + i);
            console.dir(successdata[i], { depth: null });
            Data += "\n*User " + successdata[i].user_id + "* _changed estimate_ on this issue to  " + successdata[i].to_estimate.value + " on date : " + successdata[i].created_at + "\n";
          } else {
            log("do not recogise event type");
          }
          Data += "```";
        }
      }

      if (UrlType === 'GetPipeline') {

        Data = " ";
        Data += "That <br/>issue is currently in " + successdata.pipeline.name + " pipeline.";
      }

      if (UrlType === 'IssueEstimate') {
        Data = " ";
        Data += "Your Issue's estimate has been updated to " + successdata.estimate;
      }

      if (UrlType === 'EpicIssues') {

        Data = "The following Epics are in your scrumboard: ";
        for (var i = 0; i < successdata.epic_issues.length; i++) {
          Data += "*" + i + "* Epic ID: " + successdata.epic_issues[i].issue_number + " Url : " + successdata.epic_issues[i].issue_url;
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
      console.log('Repository Id =' + RepoId);
      return "The *Repository Id* for _" + RepositoryName + "_ is " + JSON.stringify(successdata.id);
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
      var PipeLineId = this.getPipelineId(CommandArr[3]).then(function (data) {

        log("Pipeline got (using data): " + data);

        var PosNo = CommandArr[4];

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
      //var PosNo = CommandArr[4];

      var SetEstimate = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/estimate';

      var MoveBody = {
        "estimate": EstimateVal
        //position: (PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsIlBpcGVsaW5lSWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsImhlYWRlcnMiLCJwcm9jZXNzIiwiZW52IiwiWkVOSFVCX1RPS0VOIiwianNvbiIsInRoZW4iLCJkYXRhIiwiaSIsImxlbmd0aCIsIm5hbWUiLCJpZCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIlZhbGlkQml0IiwiVmFsaWRDb21tYW5kcyIsIlZhbGlkQ29tbWFkUmVnZXgiLCJPcmlnaW5hbHNDb21tYW5kQXJyIiwic3BsaWNlIiwiRmluYWxDb21tYW5kIiwiam9pbiIsIlVybE9iamVjdCIsIklzc3VlUmVnZXgiLCJFcGljUmVnZXgiLCJCbG9ja2VkUmVnZXgiLCJnZXRSZXBvVXJsIiwiZ2V0QmxvY2tVcmwiLCJnZXRJc3N1ZVVybCIsImdldEVwaWNVcmwiLCJUb2tlbiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiVXJsQm9keSIsImVzdGltYXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJxcyIsImFjY2Vzc190b2tlbiIsImJvZHkiLCJkaXIiLCJkZXB0aCIsInN1Y2Nlc3NkYXRhIiwiRGF0YSIsInR5cGUiLCJ0b19waXBlbGluZSIsImZyb21fcGlwZWxpbmUiLCJ1c2VyX2lkIiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsImNyZWF0ZWRfYXQiLCJwaXBlbGluZSIsImVwaWNfaXNzdWVzIiwiaXNzdWVfbnVtYmVyIiwiaXNzdWVfdXJsIiwiRXJyb3IiLCJSZXBvc2l0b3J5TmFtZSIsIk93bmVybmFtZSIsIlJlcG9zaXRvcnlVcmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUGlwZUxpbmVJZCIsIlBvc05vIiwiTW92ZUlzc3VlUGlwZUxpbmUiLCJNb3ZlQm9keSIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJFdmVudHNSZWdleCIsIkV2ZW50c1VybCIsIkVzdGltYXRlQWRkUmVnZXgiLCJFc3RpbWF0ZVZhbCIsIlNldEVzdGltYXRlIiwiQnVnUmVnZXgiLCJCdWdVcmwiLCJVc2VyUmVnZXgiLCJCbG9ja3VybCIsIkVwaWNVcmwiXSwibWFwcGluZ3MiOiI7O0FBS0E7Ozs7OztBQUxBLElBQUlBLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FBS0QsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUUsUUFBUUYsUUFBUSxPQUFSLENBQVo7O0FBRUE7O0FBRUEs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REk7QUFFZE0sV0FBSzRGLE9BRlM7QUFHZHhGLGNBQVEsS0FITTtBQUlkRixZQUFNLElBSlE7QUFLZFAsYUFBTyxLQUxPO0FBTWRXLGVBQVE7QUFOTSxLQUFoQjs7QUFTQSxXQUFPMkIsU0FBUDtBQUNEOztBQW5yQmMsQ0FBakIiLCJmaWxlIjoic2NydW1fYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgcmVwb19pZDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblxuICBjYWxsTWU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgdGVzdCA9IG9wdGlvbnMudGVzdDtcblxuICAgIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICBcIlVzZXJJZFwiOiBcIk1hcFwiLFxuICAgICAgXCJDaGVja1wiOiB0ZXN0XG4gICAgfTtcblxuICAgIHJldHVybiBGaW5hbERhdGE7XG4gIH0sXG5cbiAgZ2V0U2NydW1EYXRhKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVXNlcklucHV0O1xuXG4gICAgIHZhciBGaW5hbE1lc3NhZ2U9bnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZFZhbHVlID0gdGhpcy5nZXRDb21tYW5kKFVzZXJDb21tYW5kKTtcblxuICAgIGxvZyhcImNvbW1hbmQgdmFsIDogXCIrQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGxvZyhcInJlcG8gaWQgMSA6IFwiK3JlcG9faWQpO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoUmVwb3NpdG9yeUlkID09PSBudWxsIHx8IFJlcG9zaXRvcnlJZCA9PT0gJycgfHwgdHlwZW9mIFJlcG9zaXRvcnlJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGxvZyhcInRyeWluZyB0byBnZXQgcmVwbyBpZFwiKTtcbiAgICAgIC8vdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKlxcc1swLTldKi8pO1xuXG4gICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldLyk7XG4gICAgXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiK1JlcG9JZCk7XG5cbiAgICAgICAgUmVwb0lkID0gcmVwb19pZDtcbiAgICAgICAgXG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgTWVzc2FnZTogJ1N1Y2Nlc3MnLFxuICAgICAgICAgIE9wdGlvbnM6IHtcbiAgICAgICAgICAgIFJlc3Bvc2l0b3J5SWQ6IFJlcG9JZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogUmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgICBcbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgbG9nKFwidXJsIGlzIG5vdCB2YWxpZFwiKTtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIENvbW1hbmRzJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIGxvZyhcInVybCBpcyB2YWxpZFwiKVxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgbG9nKFwiaXMgR2l0IC4uXCIpXG4gICAgICB2YXIgVUNvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBHaXRSZXBvTmFtZSA9IFVDb21tYW5kQXJyWzFdO1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogR2l0UmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBsb2cgKFwibm90IGdpdFwiKTtcbiAgICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgVVVybDogVmFsaWRVcmxPYmplY3QuVXJsLFxuICAgICAgICBVQm9keTogVmFsaWRVcmxPYmplY3QuQm9keSxcbiAgICAgICAgVU1ldGhvZDogVmFsaWRVcmxPYmplY3QuTWV0aG9kLFxuICAgICAgICBVVHlwZTpWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIC8vZ2l2ZW4sIHBpcGVsaW5lIG5hbWUsIHJldHVybiBwaXBlbGluZSBpZFxuICBnZXRQaXBlbGluZUlkKFBpcGVsaW5lTmFtZSl7XG4gICAgdmFyIFBpcGVsaW5lSWQ7XG5cbiAgICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9O1xuICAgIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKXtcbiAgICAgICAgXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBmb3IgKHZhciBpID0wOyBpPGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKXtcbiAgICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIrZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICAgICAgLy9yZXR1cm4gZGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIrZXJyKVxuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICBcbiAgICAgIFxuICAgICAgfSkgXG5cbiAgfSxcblxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIitVc2VyQ29tbWFuZCk7XG4gICAgXG4gICAgdmFyIFZhbGlkQ29tbWFuZHMgPSBbJ0BzY3J1bWJvdCcsICcvcmVwbycsICcvaXNzdWUnLCAnL2VwaWMnLCAnL2Jsb2NrZWQnXTtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIFZhbGlkQ29tbWFkUmVnZXggPSBuZXcgUmVnRXhwKC9eKEBzY3J1bWJvdClcXHNbXFwvQS1aYS16XSovKTtcbiAgICBjb25zb2xlLmxvZyhcInByb2Nlc3NpbmcgbWVzc2FnZSA6IFwiK1VzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKXtcbiAgICAgIGxvZyhcIkVycm9yIG5vdCBzdGFydGluZyB3aXRoIEBzY3J1bWJvdFwiKVxuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgICAgXG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgLy9pZiAvcmVwbyBjb21lcyBhZnRlciBAc2NydW1ib3QsIG5vIHJlcG8gaWQgcHJvdmlkZWQgZWxzZSB0YWtlIHdoYXRldmVyIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCBhcyByZXBvX2lkXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09IFZhbGlkQ29tbWFuZHNbMV0pe1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIC8vLS1cbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzJdO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgXG5cblxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIGxvZyhcIkZpbmFsIENvbW1hbmQgOiBcIitGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKXtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAvLy0tXG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyAoXCJmaXJzdGx5IGluaXRpYWxpc2lpbmcgcmVwb19pZCBhcyBcIityZXBvX2lkICtcIiBmcm9tIG1lc3NhZ2UgYXJnIGF0IHBvcyAxID0gXCIrQ29tbWFuZEFyclsxXSk7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBcbiAgICBsb2coXCJyZXBvIGlkIDIgOiBcIityZXBvX2lkKTtcbiAgICBcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gRmluYWxDb21tYW5kO1xuICB9LFxuXG4gIHZhbGlkYXRlQ29tbWFuZHM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICBsb2coXCJ2YWxpZGF0ZUNvbW1hbmRzXCIpO1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG5cbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLkNvbW1hbmQ7XG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuXG4gICAgaWYgKFJlcG9SZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldFJlcG9VcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpO1xuXG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICBpZiAoQmxvY2tlZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0QmxvY2tVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoSXNzdWVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG5cbiAgICBpZiAoRXBpY1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuXG4gICAgICBsb2coXCJVcmxPYmplY3QgPSBcIitVcmxPYmplY3QpO1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgfSxcbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgbG9nKFwibWFrZVJlcXVlc3RcIik7XG4gICAgbG9nKG9wdGlvbnMuVUJvZHkpXG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFRva2VuID0gcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby8nO1xuXG4gICAgdmFyIFVzZXJVcmwgPSBvcHRpb25zLlVVcmw7XG4gICAgdmFyIFVybEJvZHkgPSBvcHRpb25zLlVCb2R5O1xuICAgIHZhciBVcmxCb2R5O1xuICAgIGlmKG9wdGlvbnMuVUJvZHkgPT0gbnVsbCl7XG4gICAgICBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keTtcbiAgICAgIFxuICAgIH1lbHNle1xuICAgICAgVXJsQm9keSA9IG9wdGlvbnMuVUJvZHkuZXN0aW1hdGU7ICAgICAgICAgICAgXG5cbiAgICB9XG4gICAgdmFyIFVNZXRob2QgPSBvcHRpb25zLlVNZXRob2Q7XG4gICAgdmFyIFVybFR5cGUgPSBvcHRpb25zLlVUeXBlO1xuICAgIFxuXG4gICAgbG9nKFwiQm9keSA6IFwiK0pTT04uc3RyaW5naWZ5KFVybEJvZHkpKTtcbiAgICAvL2NvbnNvbGUuZGlyKG9wdGlvbnMucmVxdWVzdCwge2RlcHRoOm51bGx9KTtcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgbWV0aG9kOiBVTWV0aG9kLFxuICAgICAgdXJpOiBNYWluVXJsICsgVXNlclVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgLFxuICAgICAgICBcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZXN0aW1hdGU6IFVybEJvZHlcbiAgICAgICAgLy9VcmxCb2R5XG5cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc29sZS5kaXIoVXJsT3B0aW9ucywge2RlcHRoOm51bGx9KTtcbiAgICBcbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgRGF0YSA9IHN1Y2Nlc3NkYXRhO1xuICAgICAgICBjb25zb2xlLmxvZygnRm9sbG93aW5nIERhdGEgPScgKyBKU09OLnN0cmluZ2lmeShEYXRhKSk7XG5cbiAgICAgICAgLy9QYXJzZSBKU09OIGFjY29yZGluZyB0byBvYmogcmV0dXJuZWRcbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0lzc3VlRXZlbnRzJyl7XG4gICAgICAgICAgbG9nKFwiRXZlbnRzIGZvciBpc3N1ZVwiKTtcbiAgICAgICAgICBEYXRhID0gXCIqSGVyZSBhcmUgdGhlIG1vc3QgcmVjZW50IGV2ZW50cyByZWdhcmRpbmcgeW91ciBpc3N1ZToqIGBgYFwiO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9MDsgaTxzdWNjZXNzZGF0YS5sZW5ndGg7IGkrKyl7XG5cbiAgICAgICAgICAgIGlmKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICd0cmFuc2Zlcklzc3VlJyl7XG4gICAgICAgICAgICAgIGxvZyhcInBpcGVsaW5lIG1vdmUgZXZlbnRcIitKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZSkrc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZSk7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHN1Y2Nlc3NkYXRhW2ldLCB7ZGVwdGg6bnVsbH0pOyBcbiAgICAgICAgICAgICAgRGF0YSArPSBcIlxcbipVc2VyIFwiICtzdWNjZXNzZGF0YVtpXS51c2VyX2lkKyBcIiogX21vdmVkXyB0aGlzIGlzc3VlIGZyb20gXCIrc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZS5uYW1lK1wiIHRvIFwiK3N1Y2Nlc3NkYXRhW2ldLnRvX3BpcGVsaW5lLm5hbWUrXCJcXG5cIjtcbiAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihzdWNjZXNzZGF0YVtpXS50eXBlID09PSAnZXN0aW1hdGVJc3N1ZScpe1xuICAgICAgICAgICAgICBsb2coXCJlc3RpbWF0ZSBjaGFuZ2UgZXZlbnQgXCIraSk7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHN1Y2Nlc3NkYXRhW2ldLCB7ZGVwdGg6bnVsbH0pOyBcbiAgICAgICAgICAgICAgRGF0YSArPSBcIlxcbipVc2VyIFwiICtzdWNjZXNzZGF0YVtpXS51c2VyX2lkKyBcIiogX2NoYW5nZWQgZXN0aW1hdGVfIG9uIHRoaXMgaXNzdWUgdG8gIFwiK3N1Y2Nlc3NkYXRhW2ldLnRvX2VzdGltYXRlLnZhbHVlK1wiIG9uIGRhdGUgOiBcIitzdWNjZXNzZGF0YVtpXS5jcmVhdGVkX2F0K1wiXFxuXCI7XG4gIFxuICAgICAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgICBsb2coXCJkbyBub3QgcmVjb2dpc2UgZXZlbnQgdHlwZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIERhdGEgKz0gXCJgYGBcIjtcblxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0dldFBpcGVsaW5lJyl7XG5cbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIlRoYXQgPGJyLz5pc3N1ZSBpcyBjdXJyZW50bHkgaW4gXCIrc3VjY2Vzc2RhdGEucGlwZWxpbmUubmFtZStcIiBwaXBlbGluZS5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdJc3N1ZUVzdGltYXRlJyl7XG4gICAgICAgICAgRGF0YSA9IFwiIFwiO1xuICAgICAgICAgIERhdGEgKz0gXCJZb3VyIElzc3VlJ3MgZXN0aW1hdGUgaGFzIGJlZW4gdXBkYXRlZCB0byBcIitzdWNjZXNzZGF0YS5lc3RpbWF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKFVybFR5cGUgPT09ICdFcGljSXNzdWVzJyl7XG4gICAgICAgICAgXG4gICAgICAgICAgRGF0YSA9IFwiVGhlIGZvbGxvd2luZyBFcGljcyBhcmUgaW4geW91ciBzY3J1bWJvYXJkOiBcIjtcbiAgICAgICAgICBmb3IgKHZhciBpID0wOyBpPHN1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIERhdGEgKz0gXCIqXCIraStcIiogRXBpYyBJRDogXCIrc3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfbnVtYmVyK1wiIFVybCA6IFwiK3N1Y2Nlc3NkYXRhLmVwaWNfaXNzdWVzW2ldLmlzc3VlX3VybDtcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShEYXRhKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgZm9sbG93aW5nIGVycm9yID0nICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH0pO1xuXG5cbiAgfSxcblxuXG4gIC8vIFRvIEdldCBSZXBvc2l0b3J5IElkXG4gIGdldFJlc3Bvc2l0b3J5SWQ6IGZ1bmN0aW9uIChPcHRpb25zKSB7XG4gICAgbG9nKFwiZ2V0UmVwb3NpdG9yeUlkXCIpO1xuICAgIHZhciByZXMgPSBPcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciByZXEgPSBPcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gT3B0aW9ucy5yZXBvTmFtZTtcbiAgICB2YXIgT3duZXJuYW1lID0gT3B0aW9ucy5HaXRPd25lck5hbWU7XG5cbiAgICB2YXIgUmVwb3NpdG9yeVVybCA9ICdyZXBvcy8nICsgT3duZXJuYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICB1cmk6IE1haW5VcmwgKyBSZXBvc2l0b3J5VXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgLy9hY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgfTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBSZXBvSWQgPSBzdWNjZXNzZGF0YS5pZDtcblxuICAgICAgICByZXBvX2lkID0gUmVwb0lkO1xuICAgICAgICBjb25zb2xlLmxvZygnUmVwb3NpdG9yeSBJZCA9JyArIFJlcG9JZCk7XG4gICAgICAgIHJldHVybiBcIlRoZSAqUmVwb3NpdG9yeSBJZCogZm9yIF9cIitSZXBvc2l0b3J5TmFtZStcIl8gaXMgXCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGEuaWQpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGxvZyhcIkFQSSBjYWxsIGZhaWxlZC4uLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICAgIFVybDogJycsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgfTtcblxuXG5cblxuICAgICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuXG4gICAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiK0lzc3VlTm8pO1xuXG4gICAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0dldFBpcGVsaW5lJ1xuICAgICAgICAgIFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy8gTW92ZSBQaXBlbGluZVxuICAgICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIC8vaWYgbW92aW5nIHBpcGVsaW5lLCAzcmQgYXJnIGlzIGlzc3VlIG51bSwgIDR0aCA9IC1wLCA1dGggPSBwaXBlbGluZSwgNnQgcG9zaXRpb25cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgICB2YXIgUGlwZUxpbmVJZCA9IHRoaXMuZ2V0UGlwZWxpbmVJZChDb21tYW5kQXJyWzNdKS50aGVuKGZ1bmN0aW9uIChkYXRhKXtcblxuICAgICAgICAgIGxvZyhcIlBpcGVsaW5lIGdvdCAodXNpbmcgZGF0YSk6IFwiKyBkYXRhKTtcbiAgICAgICAgICBcbiAgICAgICAgICB2YXIgUG9zTm8gPSBDb21tYW5kQXJyWzRdO1xuICBcbiAgICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgXG4gICAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuICAgICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICAgIHBpcGVsaW5lX2lkOiBkYXRhLFxuICAgICAgICAgICAgcG9zaXRpb246IChQb3NObyAhPT0gbnVsbCAmJiBQb3NObyAhPT0gJycgJiYgdHlwZW9mIFBvc05vICE9PSAndW5kZWZpbmVkJyA/IFBvc05vIDogMClcbiAgICAgICAgICB9O1xuICBcbiAgICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgICAgVXJsVHlwZTonSXNzdWVUb1BpcGVsaW5lcydcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbG9nKFwidXJsIGJ1aWx0LlwiKTtcbiAgXG4gICAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgICAgICB9KTsgXG5cbiAgICAgICAgXG4gICAgICB9XG5cblxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG5cbiAgICAgICAgbG9nKFwiaXNzdWUgbm8gZXZlbnRzcmVnZXggXCIrSXNzdWVObyk7XG4gICAgICAgIFxuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXZlbnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuXG4gICAgICAvLyBTZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoRXN0aW1hdGVBZGRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgdmFyIEVzdGltYXRlVmFsID0gQ29tbWFuZEFycls0XTtcbiAgICAgICAgbG9nKFwiRXN0aW1hdGVWYWwgOiBcIitFc3RpbWF0ZVZhbClcbiAgICAgICAgLy92YXIgUG9zTm8gPSBDb21tYW5kQXJyWzRdO1xuXG4gICAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBcImVzdGltYXRlXCI6IEVzdGltYXRlVmFsXG4gICAgICAgICAgLy9wb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFNldEVzdGltYXRlLFxuICAgICAgICAgIE1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXN0aW1hdGUnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcblxuICAgICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0J1Z0lzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vVG8gR2V0IFVzZXIgSXNzdWUgYnkgdXNlciwgdXNlcklzc3VlXG4gICAgICB2YXIgVXNlclJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy11XFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChVc2VyUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgVXNlclVybCA9ICcnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFVzZXJVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidVc2VySXNzdWVzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgIH1cblxuICAgICxcbiAgLy9UbyBHZXQgQmxvY2tlZCBJc3N1ZXMgVXJsXG4gIGdldEJsb2NrVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldEJsb2NrVXJsXCIpO1xuXG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEJsb2NrdXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogQmxvY2t1cmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6J0Jsb2NrZWRJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG5cbiAgZ2V0RXBpY1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRFcGljVXJsXCIpO1xuXG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG4gICAgdmFyIEVwaWNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9lcGljcyc7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZCA6IHRydWUsXG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6J0VwaWNJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH1cblxufTtcbiJdfQ==