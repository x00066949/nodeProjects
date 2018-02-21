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

    var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]*\s[0-9]*/);
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
    var res = options.response;
    var Token = process.env.ZENHUB_TOKEN;
    var MainUrl = 'https://api.zenhub.io/';

    var UserUrl = options.UUrl;
    //var UrlBody = options.UBody.estimate;
    var UMethod = options.UMethod;
    var UrlType = options.UType;

    //log("Body : "+JSON.stringify(UrlBody));
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
        //estimate: UrlBody

      }
    };

    console.dir(UrlOptions, { depth: null });

    return rp(UrlOptions).then(function (successdata) {
      var Data = successdata;
      console.log('Following Data =' + JSON.stringify(Data));

      //Parse JSON according to obj returned
      if (UrlType === 'IssueEvents') {
        log("Events for issue");
        Data = " ";

        for (var i = 0; i < successdata.length; i++) {

          if (successdata[i].type === 'transferIssue') {
            log("pipeline move event" + JSON.stringify(successdata[i].to_pipeline) + successdata[i].from_pipeline);
            console.dir(successdata[i], { depth: null });
            Data += "   User " + successdata[i].user_id + " moved issue from " + successdata[i].from_pipeline.name + " to " + successdata[i].to_pipeline.name;
          }
          if (successdata[i].type === 'estimateIssue') {
            log("estimate change event " + i);
            console.dir(successdata[i], { depth: null });
            Data += "   User " + successdata[i].user_id + " changed estimate on issue to  " + successdata[i].to_estimate.value + " on date : " + successdata[i].created_at;
          } else {
            log("do not recogise event type");
          }
        }
      }
      if (UrlType === 'GetPipeline') {

        Data = " ";
        Data += "That issue is currently in " + successdata.pipeline.name + " pipeline.";
      }

      if (UrlType === 'IssueEstimate') {
        Data = " ";
        Data += "Your Issue's estimate has been updated to " + successdata.estimate;
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
      return "The Repository Id for " + RepositoryName + " is " + JSON.stringify(successdata.id);
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
      Url: EpicUrl,
      Method: 'GET',
      Body: null,
      IsGit: false,
      UrlType: 'EpicIssues'
    };

    return UrlObject;
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiZ2V0UGlwZWxpbmVJZCIsIlBpcGVsaW5lTmFtZSIsIlBpcGVsaW5lSWQiLCJwaXBlbGluZUlkUmVxdWVzdCIsInVyaSIsImhlYWRlcnMiLCJwcm9jZXNzIiwiZW52IiwiWkVOSFVCX1RPS0VOIiwianNvbiIsInRoZW4iLCJkYXRhIiwiaSIsImxlbmd0aCIsIm5hbWUiLCJpZCIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIlZhbGlkQml0IiwiVmFsaWRDb21tYW5kcyIsIlZhbGlkQ29tbWFkUmVnZXgiLCJPcmlnaW5hbHNDb21tYW5kQXJyIiwic3BsaWNlIiwiRmluYWxDb21tYW5kIiwiam9pbiIsIlVybE9iamVjdCIsIklzc3VlUmVnZXgiLCJFcGljUmVnZXgiLCJCbG9ja2VkUmVnZXgiLCJnZXRSZXBvVXJsIiwiZ2V0QmxvY2tVcmwiLCJnZXRJc3N1ZVVybCIsImdldEVwaWNVcmwiLCJUb2tlbiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiVXJsT3B0aW9ucyIsIm1ldGhvZCIsInFzIiwiYWNjZXNzX3Rva2VuIiwiYm9keSIsImRpciIsImRlcHRoIiwic3VjY2Vzc2RhdGEiLCJEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsInR5cGUiLCJ0b19waXBlbGluZSIsImZyb21fcGlwZWxpbmUiLCJ1c2VyX2lkIiwidG9fZXN0aW1hdGUiLCJ2YWx1ZSIsImNyZWF0ZWRfYXQiLCJwaXBlbGluZSIsImVzdGltYXRlIiwiRXJyb3IiLCJSZXBvc2l0b3J5TmFtZSIsIk93bmVybmFtZSIsIlJlcG9zaXRvcnlVcmwiLCJSZXNwb3NpdHJveUlkIiwiUGlwZWxpbmVSZWdleCIsIklzc3VlTm8iLCJQaXBlTGluZXVybCIsIlBpcGVsaW5lTW92ZVJlZ2V4IiwiUGlwZUxpbmVJZCIsIlBvc05vIiwiTW92ZUlzc3VlUGlwZUxpbmUiLCJNb3ZlQm9keSIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJFdmVudHNSZWdleCIsIkV2ZW50c1VybCIsIkVzdGltYXRlQWRkUmVnZXgiLCJFc3RpbWF0ZVZhbCIsIlNldEVzdGltYXRlIiwiQnVnUmVnZXgiLCJCdWdVcmwiLCJVc2VyUmVnZXgiLCJCbG9ja3VybCIsIkVwaWNVcmwiXSwibWFwcGluZ3MiOiI7O0FBS0E7Ozs7OztBQUxBLElBQUlBLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsS0FBS0QsUUFBUSxpQkFBUixDQUFUO0FBQ0EsSUFBSUUsUUFBUUYsUUFBUSxPQUFSLENBQVo7O0FBRUE7O0FBRUEsSUFBTUcsTUFBTSw2Q0FBTSxxQkFBTixDQUFaOztBQUVBLElBQUlDLE9BQUo7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUI7O0FBR2ZDLFVBQVEsd0NBQVVDLE9BQVYsRUFBbUI7QUFDekIsUUFBSUMsTUFBTUQsUUFBUUUsT0FBbEI7QUFDQSxRQUFJQyxNQUFNSCxRQUFRSSxRQUFsQjtBQUNBLFFBQUlDLE9BQU9MLFFBQVFLLElBQW5COztBQUVBLFFBQUlDLFlBQVk7QUFDZCxnQkFBVSxLQURJO0FBRWQsZUFBU0Q7QUFGSyxLQUFoQjs7QUFLQSxXQUFPQyxTQUFQO0FBQ0QsR0FkYzs7QUFBQSwwQkFnQmZDLFlBaEJlLHdCQWdCRlAsT0FoQkUsRUFnQk87QUFDcEIsUUFBSUMsTUFBTUQsUUFBUUUsT0FBbEI7QUFDQSxRQUFJQyxNQUFNSCxRQUFRSSxRQUFsQjtBQUNBLFFBQUlJLGNBQWNSLFFBQVFTLFNBQTFCOztBQUVDLFFBQUlDLGVBQWEsSUFBakI7QUFDRDtBQUNBO0FBQ0E7O0FBRUEsUUFBSUMsc0JBQXNCLEtBQUtDLGVBQUwsQ0FBcUI7QUFDN0NWLGVBQVNELEdBRG9DO0FBRTdDRyxnQkFBVUQsR0FGbUM7QUFHN0NVLGdCQUFVTDtBQUhtQyxLQUFyQixDQUExQjs7QUFNQSxRQUFJLENBQUNHLG1CQUFMLEVBQTBCO0FBQ3RCRCxxQkFBZTtBQUNmSSxjQUFNLE9BRFM7QUFFZkMsaUJBQVM7QUFGTSxPQUFmOztBQUtGLGFBQU9MLGFBQWFLLE9BQXBCO0FBQ0Q7O0FBRUQsUUFBSUMsZUFBZSxLQUFLQyxVQUFMLENBQWdCVCxXQUFoQixDQUFuQjs7QUFFQWIsUUFBSSxtQkFBaUJxQixZQUFyQjs7QUFFQSxRQUFJQSxpQkFBaUIsRUFBakIsSUFBdUJBLGlCQUFpQixJQUF4QyxJQUFnRCxPQUFPQSxZQUFQLEtBQXdCLFdBQTVFLEVBQXlGO0FBQ3RGTixxQkFBZTtBQUNkSSxjQUFNLE9BRFE7QUFFZEMsaUJBQVM7QUFGSyxPQUFmO0FBSUQsYUFBT0wsYUFBYUssT0FBcEI7QUFDRDs7QUFHRDtBQUNBLFFBQUlHLGFBQWFGLGFBQWFHLEtBQWIsQ0FBbUIsR0FBbkIsQ0FBakI7QUFDQSxRQUFJQyxXQUFXRixXQUFXLENBQVgsQ0FBZjtBQUNBLFFBQUlHLFNBQVN6QixPQUFiOztBQUVBRCxRQUFJLGlCQUFlQyxPQUFuQjs7QUFFQSxRQUFJMEIsZUFBZTFCLE9BQW5COztBQUVBLFFBQUkwQixpQkFBaUIsSUFBakIsSUFBeUJBLGlCQUFpQixFQUExQyxJQUFnRCxPQUFPQSxZQUFQLEtBQXdCLFdBQTVFLEVBQXlGO0FBQ3ZGM0IsVUFBSSx1QkFBSjtBQUNBOztBQUVGLFVBQUk0QixZQUFZLElBQUlDLE1BQUosQ0FBVyx1QkFBWCxDQUFoQjs7QUFFRSxVQUFJLENBQUNELFVBQVVsQixJQUFWLENBQWVXLFlBQWYsQ0FBTCxFQUFtQztBQUNoQ04sdUJBQWU7QUFDZEksZ0JBQU0sT0FEUTtBQUVkQyxtQkFBUztBQUZLLFNBQWY7QUFJRCxlQUFPTCxhQUFhSyxPQUFwQjtBQUNEOztBQUVELFVBQUksT0FBT00sTUFBUCxLQUFrQixXQUFsQixJQUFpQ0EsV0FBVyxFQUE1QyxJQUFrREEsV0FBVyxJQUFqRSxFQUF1RTtBQUNyRTFCLFlBQUksb0JBQWtCMEIsTUFBdEI7O0FBRUFBLGlCQUFTekIsT0FBVDs7QUFFQ2MsdUJBQWU7QUFDZEssbUJBQVMsU0FESztBQUVkVSxtQkFBUztBQUNQQywyQkFBZUw7QUFEUjtBQUZLLFNBQWY7QUFNRCxlQUFPWCxhQUFhSyxPQUFwQjtBQUNEOztBQUVELGFBQU8sS0FBS1ksZ0JBQUwsQ0FBc0I7QUFDM0J6QixpQkFBU0QsR0FEa0I7QUFFM0JHLGtCQUFVRCxHQUZpQjtBQUczQnlCLGtCQUFVUixRQUhpQjtBQUkzQlMsc0JBQWE7O0FBSmMsT0FBdEIsQ0FBUDtBQVFEOztBQUdEbEMsUUFBSSxTQUFKO0FBQ0EsUUFBSW1DLGlCQUFpQixLQUFLQyxnQkFBTCxDQUFzQjtBQUN6QzdCLGVBQVNELEdBRGdDO0FBRXpDRyxnQkFBVUQsR0FGK0I7QUFHekM2QixlQUFTaEI7QUFIZ0MsS0FBdEIsQ0FBckI7O0FBT0EsUUFBSWMsZUFBZUcsT0FBZixLQUEyQixLQUEvQixFQUFzQztBQUNwQ3RDLFVBQUksa0JBQUo7QUFDQ2UscUJBQWU7QUFDZEksY0FBTSxPQURRO0FBRWRDLGlCQUFTO0FBRkssT0FBZjtBQUlELGFBQU9MLGFBQWFLLE9BQXBCO0FBQ0Q7O0FBR0RwQixRQUFJLGNBQUo7QUFDQSxRQUFJbUMsZUFBZUksS0FBbkIsRUFBMEI7QUFDeEJ2QyxVQUFJLFdBQUo7QUFDQSxVQUFJd0MsY0FBY25CLGFBQWFHLEtBQWIsQ0FBbUIsR0FBbkIsQ0FBbEI7QUFDQSxVQUFJaUIsY0FBY0QsWUFBWSxDQUFaLENBQWxCOztBQUVBLGFBQU8sS0FBS1IsZ0JBQUwsQ0FBc0I7QUFDM0J6QixpQkFBU0QsR0FEa0I7QUFFM0JHLGtCQUFVRCxHQUZpQjtBQUczQnlCLGtCQUFVUSxXQUhpQjtBQUkzQlAsc0JBQWE7QUFKYyxPQUF0QixDQUFQO0FBT0QsS0FaRCxNQVlPOztBQUVMbEMsVUFBSyxTQUFMO0FBQ0EsYUFBTyxLQUFLMEMsV0FBTCxDQUFpQjtBQUN0QmpDLGtCQUFVRCxHQURZO0FBRXRCbUMsY0FBTVIsZUFBZVMsR0FGQztBQUd0QkMsZUFBT1YsZUFBZVcsSUFIQTtBQUl0QkMsaUJBQVNaLGVBQWVhLE1BSkY7QUFLdEJDLGVBQU1kLGVBQWVlO0FBTEMsT0FBakIsQ0FBUDtBQU9EO0FBR0YsR0FsSmM7QUFBQTs7QUFvSmY7QUFDQUMsZUFySmUseUJBcUpEQyxZQXJKQyxFQXFKWTtBQUN6QixRQUFJQyxVQUFKOztBQUVBLFFBQUlDLG9CQUFvQjtBQUN0QkMsV0FBSywyQ0FBMkN0RCxPQUEzQyxHQUFxRCxRQURwQzs7QUFHdEJ1RCxlQUFTO0FBQ1Asa0NBQTBCQyxRQUFRQyxHQUFSLENBQVlDO0FBRC9CLE9BSGE7O0FBT3RCQyxZQUFNO0FBUGdCLEtBQXhCO0FBU0EsV0FBTzlELEdBQUd3RCxpQkFBSCxFQUNKTyxJQURJLENBQ0MsVUFBVUMsSUFBVixFQUFlOztBQUVuQjlELFVBQUk4RCxJQUFKO0FBQ0EsV0FBSyxJQUFJQyxJQUFHLENBQVosRUFBZUEsSUFBRUQsS0FBSyxXQUFMLEVBQWtCRSxNQUFuQyxFQUEyQ0QsR0FBM0MsRUFBK0M7QUFDN0MsWUFBSUQsS0FBSyxXQUFMLEVBQWtCQyxDQUFsQixFQUFxQkUsSUFBckIsS0FBOEJiLFlBQWxDLEVBQStDO0FBQzdDcEQsY0FBSSx5QkFBdUI4RCxLQUFLLFdBQUwsRUFBa0JDLENBQWxCLEVBQXFCRyxFQUFoRDtBQUNBLGlCQUFPSixLQUFLLFdBQUwsRUFBa0JDLENBQWxCLEVBQXFCRyxFQUE1QjtBQUNEO0FBQ0Y7O0FBRURsRSxVQUFJLDRDQUFKO0FBQ0E7QUFDRCxLQWJJLEVBY0ptRSxLQWRJLENBY0UsVUFBQ0MsR0FBRCxFQUFTO0FBQ2RDLGNBQVFyRSxHQUFSLENBQVksYUFBV29FLEdBQXZCO0FBQ0EsYUFBT0EsR0FBUDtBQUdELEtBbkJJLENBQVA7QUFxQkQsR0F0TGM7OztBQXlMZm5ELG1CQUFpQixpREFBVVosT0FBVixFQUFtQjtBQUNsQyxRQUFJQyxNQUFNRCxRQUFRRSxPQUFsQjtBQUNBLFFBQUlDLE1BQU1ILFFBQVFJLFFBQWxCO0FBQ0EsUUFBSTZELFdBQVcsS0FBZjtBQUNBLFFBQUl6RCxjQUFjUixRQUFRYSxRQUExQjtBQUNBbUQsWUFBUXJFLEdBQVIsQ0FBWSxvQkFBa0JhLFdBQTlCOztBQUVBLFFBQUkwRCxnQkFBZ0IsQ0FBQyxXQUFELEVBQWMsT0FBZCxFQUF1QixRQUF2QixFQUFpQyxPQUFqQyxFQUEwQyxVQUExQyxDQUFwQjs7QUFFQSxRQUFJMUQsZ0JBQWdCLElBQWhCLElBQXdCQSxnQkFBZ0IsRUFBeEMsSUFBOENBLGdCQUFnQixXQUFsRSxFQUErRTtBQUM3RSxhQUFPeUQsUUFBUDtBQUNEOztBQUVELFFBQUlFLG1CQUFtQixJQUFJM0MsTUFBSixDQUFXLDJCQUFYLENBQXZCO0FBQ0F3QyxZQUFRckUsR0FBUixDQUFZLDBCQUF3QmEsV0FBcEM7O0FBR0EsUUFBSSxDQUFDMkQsaUJBQWlCOUQsSUFBakIsQ0FBc0JHLFdBQXRCLENBQUwsRUFBd0M7QUFDdENiLFVBQUksbUNBQUo7QUFDQSxhQUFPc0UsUUFBUDtBQUNEOztBQUlELFFBQUkvQyxhQUFhVixZQUFZVyxLQUFaLENBQWtCLEdBQWxCLENBQWpCO0FBQ0EsUUFBSWlELHNCQUFzQmxELFVBQTFCOztBQUVBO0FBQ0EsUUFBSUEsV0FBVyxDQUFYLE1BQWtCZ0QsY0FBYyxDQUFkLENBQXRCLEVBQXVDO0FBQ3JDaEQsaUJBQVdtRCxNQUFYLENBQWtCLENBQWxCLEVBQW9CLENBQXBCO0FBQ0QsS0FGRCxNQUdJO0FBQ0Y7QUFDQXpFLGdCQUFVc0IsV0FBVyxDQUFYLENBQVY7QUFDQUEsaUJBQVdtRCxNQUFYLENBQWtCLENBQWxCLEVBQW9CLENBQXBCO0FBQ0Q7O0FBSUQsUUFBSUMsZUFBZXBELFdBQVdxRCxJQUFYLENBQWdCLEdBQWhCLENBQW5COztBQUVBNUUsUUFBSSxxQkFBbUIyRSxZQUF2Qjs7QUFFQSxXQUFPTCxXQUFXLElBQWxCO0FBQ0QsR0FyT2M7O0FBdU9maEQsY0FBWSw0Q0FBVUosUUFBVixFQUFvQjtBQUM5QmxCLFFBQUksWUFBSjtBQUNBLFFBQUlzRSxXQUFXLEVBQWY7QUFDQSxRQUFJekQsY0FBY0ssUUFBbEI7O0FBRUEsUUFBSUwsZ0JBQWdCLElBQWhCLElBQXdCQSxnQkFBZ0IsRUFBeEMsSUFBOEMsT0FBT0EsV0FBUCxLQUF1QixXQUF6RSxFQUFzRjtBQUNwRixhQUFPeUQsUUFBUDtBQUNEOztBQUVELFFBQUkvQyxhQUFhVixZQUFZVyxLQUFaLENBQWtCLEdBQWxCLENBQWpCO0FBQ0EsUUFBSWlELHNCQUFzQmxELFVBQTFCOztBQUVBLFFBQUlBLFdBQVcsQ0FBWCxNQUFrQixPQUF0QixFQUE4QjtBQUM1QkEsaUJBQVdtRCxNQUFYLENBQWtCLENBQWxCLEVBQW9CLENBQXBCO0FBQ0QsS0FGRCxNQUdJO0FBQ0Y7QUFDQXpFLGdCQUFVc0IsV0FBVyxDQUFYLENBQVY7QUFDQXZCLFVBQUssc0NBQW9DQyxPQUFwQyxHQUE2QywrQkFBN0MsR0FBNkVzQixXQUFXLENBQVgsQ0FBbEY7QUFDQUEsaUJBQVdtRCxNQUFYLENBQWtCLENBQWxCLEVBQW9CLENBQXBCO0FBQ0Q7O0FBRUQxRSxRQUFJLGlCQUFlQyxPQUFuQjs7QUFFQSxRQUFJMEUsZUFBZXBELFdBQVdxRCxJQUFYLENBQWdCLEdBQWhCLENBQW5COztBQUVBLFdBQU9ELFlBQVA7QUFDRCxHQWxRYzs7QUFvUWZ2QyxvQkFBa0Isa0RBQVUvQixPQUFWLEVBQW1COztBQUVuQ0wsUUFBSSxrQkFBSjtBQUNBLFFBQUlNLE1BQU1ELFFBQVFFLE9BQWxCO0FBQ0EsUUFBSUMsTUFBTUgsUUFBUUksUUFBbEI7O0FBRUEsUUFBSUksY0FBY1IsUUFBUWdDLE9BQTFCO0FBQ0EsUUFBSWQsYUFBYVYsWUFBWVcsS0FBWixDQUFrQixHQUFsQixDQUFqQjtBQUNBLFFBQUlxRCxZQUFZO0FBQ2R2QyxlQUFTLEtBREs7QUFFZE0sV0FBSyxFQUZTO0FBR2RJLGNBQVEsS0FITTtBQUlkRixZQUFNO0FBSlEsS0FBaEI7O0FBT0EsUUFBSWxCLFlBQVksSUFBSUMsTUFBSixDQUFXLGdDQUFYLENBQWhCO0FBQ0EsUUFBSWlELGFBQWEsSUFBSWpELE1BQUosQ0FBVyw2REFBWCxDQUFqQjtBQUNBLFFBQUlrRCxZQUFZLElBQUlsRCxNQUFKLENBQVcsMEJBQVgsQ0FBaEI7QUFDQSxRQUFJbUQsZUFBZSxJQUFJbkQsTUFBSixDQUFXLFlBQVgsQ0FBbkI7O0FBR0EsUUFBSUQsVUFBVWxCLElBQVYsQ0FBZUcsV0FBZixDQUFKLEVBQ0UsT0FBT2dFLFlBQVksS0FBS0ksVUFBTCxDQUFnQnBFLFdBQWhCLEVBQTZCVSxVQUE3QixDQUFuQjs7QUFFRixRQUFJRyxTQUFTekIsT0FBYjs7QUFFQSxRQUFJK0UsYUFBYXRFLElBQWIsQ0FBa0JHLFdBQWxCLENBQUosRUFDRSxPQUFPZ0UsWUFBWSxLQUFLSyxXQUFMLENBQWlCckUsV0FBakIsRUFBOEJVLFVBQTlCLEVBQTBDRyxNQUExQyxDQUFuQjs7QUFFRixRQUFJb0QsV0FBV3BFLElBQVgsQ0FBZ0JHLFdBQWhCLENBQUosRUFDRSxPQUFPZ0UsWUFBWSxLQUFLTSxXQUFMLENBQWlCdEUsV0FBakIsRUFBOEJVLFVBQTlCLEVBQTBDRyxNQUExQyxDQUFuQjs7QUFHRixRQUFJcUQsVUFBVXJFLElBQVYsQ0FBZUcsV0FBZixDQUFKLEVBQ0UsT0FBT2dFLFlBQVksS0FBS08sVUFBTCxDQUFnQnZFLFdBQWhCLEVBQTZCVSxVQUE3QixFQUF5Q0csTUFBekMsQ0FBbkI7O0FBR0ExQixRQUFJLGlCQUFlNkUsU0FBbkI7QUFDRixXQUFPQSxTQUFQO0FBRUQsR0E1U2M7QUE2U2ZuQyxlQUFhLDZDQUFVckMsT0FBVixFQUFtQjtBQUM5QkwsUUFBSSxhQUFKO0FBQ0EsUUFBSVEsTUFBTUgsUUFBUUksUUFBbEI7QUFDQSxRQUFJNEUsUUFBUTVCLFFBQVFDLEdBQVIsQ0FBWUMsWUFBeEI7QUFDQSxRQUFJMkIsVUFBVSx3QkFBZDs7QUFFQSxRQUFJQyxVQUFVbEYsUUFBUXNDLElBQXRCO0FBQ0E7QUFDQSxRQUFJSSxVQUFVMUMsUUFBUTBDLE9BQXRCO0FBQ0EsUUFBSUcsVUFBVTdDLFFBQVE0QyxLQUF0Qjs7QUFHQTtBQUNBOztBQUVBLFFBQUl1QyxhQUFhO0FBQ2ZDLGNBQVExQyxPQURPO0FBRWZRLFdBQUsrQixVQUFVQyxPQUZBO0FBR2ZHLFVBQUk7QUFDRkMsc0JBQWNOLEtBRFosQ0FDa0I7QUFEbEIsT0FIVztBQU1mN0IsZUFBUztBQUNQLHNCQUFjO0FBRFAsT0FOTTtBQVNmSSxZQUFNLElBVFMsQ0FTSjs7O0FBVEksUUFZZmdDLE1BQU07QUFDSjs7QUFESTtBQVpTLEtBQWpCOztBQWtCQXZCLFlBQVF3QixHQUFSLENBQVlMLFVBQVosRUFBd0IsRUFBQ00sT0FBTSxJQUFQLEVBQXhCOztBQUVBLFdBQU9oRyxHQUFHMEYsVUFBSCxFQUNKM0IsSUFESSxDQUNDLFVBQVVrQyxXQUFWLEVBQXVCO0FBQzNCLFVBQUlDLE9BQU9ELFdBQVg7QUFDQTFCLGNBQVFyRSxHQUFSLENBQVkscUJBQXFCaUcsS0FBS0MsU0FBTCxDQUFlRixJQUFmLENBQWpDOztBQUVBO0FBQ0EsVUFBRzlDLFlBQVksYUFBZixFQUE2QjtBQUMzQmxELFlBQUksa0JBQUo7QUFDQWdHLGVBQU8sR0FBUDs7QUFFQSxhQUFLLElBQUlqQyxJQUFHLENBQVosRUFBZUEsSUFBRWdDLFlBQVkvQixNQUE3QixFQUFxQ0QsR0FBckMsRUFBeUM7O0FBRXZDLGNBQUdnQyxZQUFZaEMsQ0FBWixFQUFlb0MsSUFBZixLQUF3QixlQUEzQixFQUEyQztBQUN6Q25HLGdCQUFJLHdCQUFzQmlHLEtBQUtDLFNBQUwsQ0FBZUgsWUFBWWhDLENBQVosRUFBZXFDLFdBQTlCLENBQXRCLEdBQWlFTCxZQUFZaEMsQ0FBWixFQUFlc0MsYUFBcEY7QUFDQWhDLG9CQUFRd0IsR0FBUixDQUFZRSxZQUFZaEMsQ0FBWixDQUFaLEVBQTRCLEVBQUMrQixPQUFNLElBQVAsRUFBNUI7QUFDQUUsb0JBQVEsYUFBWUQsWUFBWWhDLENBQVosRUFBZXVDLE9BQTNCLEdBQW9DLG9CQUFwQyxHQUF5RFAsWUFBWWhDLENBQVosRUFBZXNDLGFBQWYsQ0FBNkJwQyxJQUF0RixHQUEyRixNQUEzRixHQUFrRzhCLFlBQVloQyxDQUFaLEVBQWVxQyxXQUFmLENBQTJCbkMsSUFBckk7QUFFRDtBQUNELGNBQUc4QixZQUFZaEMsQ0FBWixFQUFlb0MsSUFBZixLQUF3QixlQUEzQixFQUEyQztBQUN6Q25HLGdCQUFJLDJCQUF5QitELENBQTdCO0FBQ0FNLG9CQUFRd0IsR0FBUixDQUFZRSxZQUFZaEMsQ0FBWixDQUFaLEVBQTRCLEVBQUMrQixPQUFNLElBQVAsRUFBNUI7QUFDQUUsb0JBQVEsYUFBWUQsWUFBWWhDLENBQVosRUFBZXVDLE9BQTNCLEdBQW9DLGlDQUFwQyxHQUFzRVAsWUFBWWhDLENBQVosRUFBZXdDLFdBQWYsQ0FBMkJDLEtBQWpHLEdBQXVHLGFBQXZHLEdBQXFIVCxZQUFZaEMsQ0FBWixFQUFlMEMsVUFBNUk7QUFFRCxXQUxELE1BS007QUFDSnpHLGdCQUFJLDRCQUFKO0FBQ0Q7QUFFRjtBQUtGO0FBQ0QsVUFBR2tELFlBQVksYUFBZixFQUE2Qjs7QUFFM0I4QyxlQUFPLEdBQVA7QUFDQUEsZ0JBQVEsZ0NBQThCRCxZQUFZVyxRQUFaLENBQXFCekMsSUFBbkQsR0FBd0QsWUFBaEU7QUFDRDs7QUFFRCxVQUFHZixZQUFZLGVBQWYsRUFBK0I7QUFDN0I4QyxlQUFPLEdBQVA7QUFDQUEsZ0JBQVEsK0NBQTZDRCxZQUFZWSxRQUFqRTtBQUNEOztBQUVELGFBQU9WLEtBQUtDLFNBQUwsQ0FBZUYsSUFBZixDQUFQO0FBQ0QsS0E3Q0ksRUE4Q0o3QixLQTlDSSxDQThDRSxVQUFVQyxHQUFWLEVBQWU7QUFDcEIsVUFBSXdDLFFBQVF4QyxHQUFaO0FBQ0E7QUFDQUMsY0FBUXJFLEdBQVIsQ0FBWSwrQkFBK0JvRSxHQUEzQztBQUNBLGFBQU9BLEdBQVA7QUFDRCxLQW5ESSxDQUFQO0FBc0RELEdBdFljOztBQXlZZjtBQUNBcEMsb0JBQWtCLGtEQUFVRixPQUFWLEVBQW1CO0FBQ25DOUIsUUFBSSxpQkFBSjtBQUNBLFFBQUlRLE1BQU1zQixRQUFRckIsUUFBbEI7QUFDQSxRQUFJSCxNQUFNd0IsUUFBUXZCLE9BQWxCO0FBQ0EsUUFBSXNHLGlCQUFpQi9FLFFBQVFHLFFBQTdCO0FBQ0EsUUFBSTZFLFlBQVloRixRQUFRSSxZQUF4Qjs7QUFFQSxRQUFJNkUsZ0JBQWdCLFdBQVdELFNBQVgsR0FBdUIsR0FBdkIsR0FBNkJELGNBQWpEO0FBQ0EsUUFBSXZCLFVBQVUseUJBQWQ7O0FBRUEsUUFBSUUsYUFBYTtBQUNmakMsV0FBSytCLFVBQVV5QixhQURBO0FBRWZyQixVQUFJO0FBQ0Y7QUFERSxPQUZXO0FBS2ZsQyxlQUFTO0FBQ1Asc0JBQWM7QUFEUCxPQUxNO0FBUWZJLFlBQU0sSUFSUyxDQVFKO0FBUkksS0FBakI7O0FBV0EsV0FBTzlELEdBQUcwRixVQUFILEVBQ0ozQixJQURJLENBQ0MsVUFBVWtDLFdBQVYsRUFBdUI7QUFDM0IsVUFBSXJFLFNBQVNxRSxZQUFZN0IsRUFBekI7O0FBRUFqRSxnQkFBVXlCLE1BQVY7QUFDQTJDLGNBQVFyRSxHQUFSLENBQVksb0JBQW9CMEIsTUFBaEM7QUFDQSxhQUFPLDJCQUF5Qm1GLGNBQXpCLEdBQXdDLE1BQXhDLEdBQStDWixLQUFLQyxTQUFMLENBQWVILFlBQVk3QixFQUEzQixDQUF0RDtBQUNELEtBUEksRUFRSkMsS0FSSSxDQVFFLFVBQVVDLEdBQVYsRUFBZTtBQUNwQixVQUFJd0MsUUFBUXhDLEdBQVo7QUFDQTtBQUNBcEUsVUFBSSxvQkFBSjtBQUNBcUUsY0FBUXJFLEdBQVIsQ0FBWSxtQkFBWixFQUFpQ29FLEdBQWpDO0FBQ0QsS0FiSSxDQUFQO0FBZUQsR0E5YWM7O0FBZ2JmO0FBQ0FhLGNBQVksNENBQVVwRSxXQUFWLEVBQXVCVSxVQUF2QixFQUFtQzs7QUFFN0N2QixRQUFJLFlBQUo7QUFDQSxRQUFJNkcsaUJBQWlCdEYsV0FBVyxDQUFYLENBQXJCO0FBQ0EsUUFBSVcsZUFBZSxXQUFuQjtBQUNBLFFBQUlQLGVBQWUsV0FBV08sWUFBWCxHQUEwQixHQUExQixHQUFnQzJFLGNBQW5EOztBQUVBLFFBQUloQyxZQUFZO0FBQ2R2QyxlQUFTLElBREs7QUFFZE0sV0FBS2pCLFlBRlM7QUFHZHFCLGNBQVEsS0FITTtBQUlkRixZQUFNLElBSlE7QUFLZFAsYUFBTztBQUxPLEtBQWhCOztBQVFBLFdBQU9zQyxTQUFQO0FBQ0QsR0FqY2M7O0FBbWNmO0FBQ0FNLGVBQWEsNkNBQVV0RSxXQUFWLEVBQXVCVSxVQUF2QixFQUFtQ0csTUFBbkMsRUFBMkM7QUFDdEQxQixRQUFJLGFBQUo7QUFDRSxRQUFJZ0gsZ0JBQWdCdEYsTUFBcEI7O0FBRUEsUUFBSW1ELFlBQVk7QUFDZHZDLGVBQVMsS0FESztBQUVkTSxXQUFLLEVBRlM7QUFHZEksY0FBUSxLQUhNO0FBSWRGLFlBQU0sSUFKUTtBQUtkUCxhQUFPO0FBTE8sS0FBaEI7O0FBV0E7QUFDQSxRQUFJMEUsZ0JBQWdCLElBQUlwRixNQUFKLENBQVcscUNBQVgsQ0FBcEI7O0FBRUEsUUFBSW9GLGNBQWN2RyxJQUFkLENBQW1CRyxXQUFuQixDQUFKLEVBQXFDOztBQUVuQyxVQUFJcUcsVUFBVTNGLFdBQVcsQ0FBWCxDQUFkOztBQUVBdkIsVUFBSSxnQ0FBOEJrSCxPQUFsQzs7QUFFQSxVQUFJQyxjQUFjLHFCQUFxQkgsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQXBFOztBQUVBLFVBQUlyQyxZQUFZO0FBQ2R2QyxpQkFBUyxJQURLO0FBRWRNLGFBQUt1RSxXQUZTO0FBR2RuRSxnQkFBUSxLQUhNO0FBSWRGLGNBQU0sSUFKUTtBQUtkUCxlQUFPLEtBTE87QUFNZFcsaUJBQVE7O0FBTk0sT0FBaEI7O0FBVUEsYUFBTzJCLFNBQVA7QUFDRDs7QUFHRDtBQUNBLFFBQUl1QyxvQkFBb0IsSUFBSXZGLE1BQUosQ0FBVyw2Q0FBWCxDQUF4Qjs7QUFFQSxRQUFJdUYsa0JBQWtCMUcsSUFBbEIsQ0FBdUJHLFdBQXZCLENBQUosRUFBeUM7O0FBRXZDO0FBQ0EsVUFBSXFHLFVBQVUzRixXQUFXLENBQVgsQ0FBZDtBQUNBLFVBQUk4RixhQUFhLEtBQUtsRSxhQUFMLENBQW1CNUIsV0FBVyxDQUFYLENBQW5CLEVBQWtDc0MsSUFBbEMsQ0FBdUMsVUFBVUMsSUFBVixFQUFlOztBQUVyRTlELFlBQUksZ0NBQStCOEQsSUFBbkM7O0FBRUEsWUFBSXdELFFBQVEvRixXQUFXLENBQVgsQ0FBWjs7QUFFQSxZQUFJZ0csb0JBQW9CLHFCQUFxQlAsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQWxELEdBQTRELFFBQXBGOztBQUVBbEgsWUFBSSw4QkFBSjtBQUNBLFlBQUl3SCxXQUFXO0FBQ2JDLHVCQUFhM0QsSUFEQTtBQUViNEQsb0JBQVdKLFVBQVUsSUFBVixJQUFrQkEsVUFBVSxFQUE1QixJQUFrQyxPQUFPQSxLQUFQLEtBQWlCLFdBQW5ELEdBQWlFQSxLQUFqRSxHQUF5RTtBQUZ2RSxTQUFmOztBQUtBLFlBQUl6QyxZQUFZO0FBQ2R2QyxtQkFBUyxJQURLO0FBRWRNLGVBQUsyRSxpQkFGUztBQUdkdkUsa0JBQVEsTUFITTtBQUlkRixnQkFBTTBFLFFBSlE7QUFLZGpGLGlCQUFPLEtBTE87QUFNZFcsbUJBQVE7QUFOTSxTQUFoQjs7QUFTQWxELFlBQUksWUFBSjs7QUFFQSxlQUFPNkUsU0FBUDtBQUVELE9BM0JnQixDQUFqQjtBQThCRDs7QUFHRDtBQUNBLFFBQUk4QyxjQUFjLElBQUk5RixNQUFKLENBQVcsbUNBQVgsQ0FBbEI7O0FBRUEsUUFBSThGLFlBQVlqSCxJQUFaLENBQWlCRyxXQUFqQixDQUFKLEVBQW1DOztBQUVqQyxVQUFJcUcsVUFBVTNGLFdBQVcsQ0FBWCxDQUFkOztBQUVBdkIsVUFBSSwwQkFBd0JrSCxPQUE1Qjs7QUFFQSxVQUFJVSxZQUFZLHFCQUFxQlosYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQWxELEdBQTRELFNBQTVFOztBQUVBLFVBQUlyQyxZQUFZO0FBQ2R2QyxpQkFBUyxJQURLO0FBRWRNLGFBQUtnRixTQUZTO0FBR2Q1RSxnQkFBUSxLQUhNO0FBSWRGLGNBQU0sSUFKUTtBQUtkUCxlQUFPLEtBTE87QUFNZFcsaUJBQVE7QUFOTSxPQUFoQjs7QUFTQSxhQUFPMkIsU0FBUDtBQUNEOztBQUlEO0FBQ0EsUUFBSWdELG1CQUFtQixJQUFJaEcsTUFBSixDQUFXLHVDQUFYLENBQXZCOztBQUVBLFFBQUlnRyxpQkFBaUJuSCxJQUFqQixDQUFzQkcsV0FBdEIsQ0FBSixFQUF3Qzs7QUFFdEMsVUFBSXFHLFVBQVUzRixXQUFXLENBQVgsQ0FBZDtBQUNBLFVBQUl1RyxjQUFjdkcsV0FBVyxDQUFYLENBQWxCO0FBQ0F2QixVQUFJLG1CQUFpQjhILFdBQXJCO0FBQ0E7O0FBRUEsVUFBSUMsY0FBYyxxQkFBcUJmLGFBQXJCLEdBQXFDLFVBQXJDLEdBQWtERSxPQUFsRCxHQUE0RCxXQUE5RTs7QUFFQSxVQUFJTSxXQUFXO0FBQ2Isb0JBQVlNO0FBQ1o7QUFGYSxPQUFmOztBQUtBLFVBQUlqRCxZQUFZO0FBQ2R2QyxpQkFBUyxJQURLO0FBRWRNLGFBQUttRixXQUZTO0FBR2QvRSxnQkFBUSxLQUhNO0FBSWRGLGNBQU0wRSxRQUpRO0FBS2RqRixlQUFPLEtBTE87QUFNZFcsaUJBQVE7QUFOTSxPQUFoQjs7QUFTQSxhQUFPMkIsU0FBUDtBQUNEOztBQUlEO0FBQ0EsUUFBSW1ELFdBQVcsSUFBSW5HLE1BQUosQ0FBVyx3QkFBWCxDQUFmOztBQUVBLFFBQUltRyxTQUFTdEgsSUFBVCxDQUFjRyxXQUFkLENBQUosRUFBZ0M7O0FBRTlCLFVBQUlxRyxVQUFVM0YsV0FBVyxDQUFYLENBQWQ7O0FBRUEsVUFBSTBHLFNBQVMscUJBQXFCakIsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQS9EOztBQUVBLFVBQUlyQyxZQUFZO0FBQ2R2QyxpQkFBUyxJQURLO0FBRWRNLGFBQUtxRixNQUZTO0FBR2RqRixnQkFBUSxLQUhNO0FBSWRGLGNBQU0sSUFKUTtBQUtkUCxlQUFPLEtBTE87QUFNZFcsaUJBQVE7QUFOTSxPQUFoQjs7QUFTQSxhQUFPMkIsU0FBUDtBQUNEOztBQUdEO0FBQ0EsUUFBSXFELFlBQVksSUFBSXJHLE1BQUosQ0FBVyxxQ0FBWCxDQUFoQjs7QUFFQSxRQUFJcUcsVUFBVXhILElBQVYsQ0FBZUcsV0FBZixDQUFKLEVBQWlDOztBQUUvQixVQUFJMEUsVUFBVSxFQUFkOztBQUVBLFVBQUlWLFlBQVk7QUFDZHZDLGlCQUFTLElBREs7QUFFZE0sYUFBSzJDLE9BRlM7QUFHZHZDLGdCQUFRLEtBSE07QUFJZEYsY0FBTSxJQUpRO0FBS2RQLGVBQU8sS0FMTztBQU1kVyxpQkFBUTtBQU5NLE9BQWhCOztBQVNBLGFBQU8yQixTQUFQO0FBQ0Q7O0FBR0QsV0FBT0EsU0FBUDtBQUVELEdBeG5CWTs7QUEybkJmO0FBQ0FLLGVBQWEsNkNBQVVyRSxXQUFWLEVBQXVCVSxVQUF2QixFQUFtQ0csTUFBbkMsRUFBMkM7QUFDdEQxQixRQUFJLGFBQUo7O0FBRUEsUUFBSWdILGdCQUFnQnRGLE1BQXBCOztBQUVBLFFBQUl3RixVQUFVM0YsV0FBVyxDQUFYLENBQWQ7QUFDQSxRQUFJNEcsV0FBVyxxQkFBcUJuQixhQUFyQixHQUFxQyxVQUFyQyxHQUFrREUsT0FBakU7O0FBRUEsUUFBSXJDLFlBQVk7QUFDZGpDLFdBQUt1RixRQURTO0FBRWRuRixjQUFRLEtBRk07QUFHZEYsWUFBTSxJQUhRO0FBSWRQLGFBQU8sS0FKTztBQUtkVyxlQUFRO0FBTE0sS0FBaEI7O0FBUUEsV0FBTzJCLFNBQVA7QUFDRCxHQTdvQmM7O0FBK29CZjtBQUNBTyxjQUFZLDRDQUFVdkUsV0FBVixFQUF1QlUsVUFBdkIsRUFBbUNHLE1BQW5DLEVBQTJDO0FBQ3JEMUIsUUFBSSxZQUFKOztBQUVBLFFBQUlnSCxnQkFBZ0J0RixNQUFwQjtBQUNBLFFBQUkwRyxVQUFVLHFCQUFxQnBCLGFBQXJCLEdBQXFDLFFBQW5EOztBQUVBLFFBQUluQyxZQUFZO0FBQ2RqQyxXQUFLd0YsT0FEUztBQUVkcEYsY0FBUSxLQUZNO0FBR2RGLFlBQU0sSUFIUTtBQUlkUCxhQUFPLEtBSk87QUFLZFcsZUFBUTtBQUxNLEtBQWhCOztBQVFBLFdBQU8yQixTQUFQO0FBQ0Q7O0FBL3BCYyxDQUFqQiIsImZpbGUiOiJzY3J1bV9ib2FyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgcnAgPSByZXF1aXJlKCdyZXF1ZXN0LXByb21pc2UnKTtcbnZhciBSZWdleCA9IHJlcXVpcmUoJ3JlZ2V4Jyk7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICAgdmFyIEZpbmFsTWVzc2FnZT1udWxsO1xuICAgIC8vICAgTWVzc2FnZSA6IG51bGwsXG4gICAgLy8gICBPcHRpb25zIDogbnVsbFxuICAgIC8vIH07XG5cbiAgICB2YXIgQ2hlY2tJZlZhbGlkQ29tbWFuZCA9IHRoaXMuY2hlY2tWYWxpZElucHV0KHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBVQ29tbWFuZDogVXNlckNvbW1hbmRcbiAgICB9KTtcblxuICAgIGlmICghQ2hlY2tJZlZhbGlkQ29tbWFuZCkge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kVmFsdWUgPSB0aGlzLmdldENvbW1hbmQoVXNlckNvbW1hbmQpO1xuXG4gICAgbG9nKFwiY29tbWFuZCB2YWwgOiBcIitDb21tYW5kVmFsdWUpO1xuXG4gICAgaWYgKENvbW1hbmRWYWx1ZSA9PT0gJycgfHwgQ29tbWFuZFZhbHVlID09PSBudWxsIHx8IHR5cGVvZiBDb21tYW5kVmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIrcmVwb19pZCk7XG5cbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gcmVwb19pZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuICAgICAgLy92YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qXFxzWzAtOV0qLyk7XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0vKTtcbiAgICBcbiAgICAgIGlmICghUmVwb1JlZ2V4LnRlc3QoQ29tbWFuZFZhbHVlKSkge1xuICAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgTWVzc2FnZTogJ1JlcG9zaXRvcnkgSWQgTm90IFNwZWNpZmllZCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIFJlcG9JZCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVwb0lkICE9PSAnJyAmJiBSZXBvSWQgIT09IG51bGwpIHtcbiAgICAgICAgbG9nKFwicmVwbyBmb3VuZCBpZDogXCIrUmVwb0lkKTtcblxuICAgICAgICBSZXBvSWQgPSByZXBvX2lkO1xuICAgICAgICBcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBNZXNzYWdlOiAnU3VjY2VzcycsXG4gICAgICAgICAgT3B0aW9uczoge1xuICAgICAgICAgICAgUmVzcG9zaXRvcnlJZDogUmVwb0lkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOid4MDAwNjY5NDknXG4gICAgICAgIFxuICAgICAgfSk7XG5cbiAgICB9XG5cblxuICAgIGxvZyhcImdldCB1cmxcIik7XG4gICAgdmFyIFZhbGlkVXJsT2JqZWN0ID0gdGhpcy52YWxpZGF0ZUNvbW1hbmRzKHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBDb21tYW5kOiBDb21tYW5kVmFsdWVcbiAgICB9KTtcblxuXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICBsb2coXCJ1cmwgaXMgbm90IHZhbGlkXCIpO1xuICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgQ29tbWFuZHMnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuXG4gICAgbG9nKFwidXJsIGlzIHZhbGlkXCIpXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzR2l0KSB7XG4gICAgICBsb2coXCJpcyBHaXQgLi5cIilcbiAgICAgIHZhciBVQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgICAgdmFyIEdpdFJlcG9OYW1lID0gVUNvbW1hbmRBcnJbMV07XG5cbiAgICAgIHJldHVybiB0aGlzLmdldFJlc3Bvc2l0b3J5SWQoe1xuICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgIHJlcG9OYW1lOiBHaXRSZXBvTmFtZSxcbiAgICAgICAgR2l0T3duZXJOYW1lOid4MDAwNjY5NDknXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGxvZyAoXCJub3QgZ2l0XCIpO1xuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2QsXG4gICAgICAgIFVUeXBlOlZhbGlkVXJsT2JqZWN0LlVybFR5cGVcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIH0sXG5cbiAgLy9naXZlbiwgcGlwZWxpbmUgbmFtZSwgcmV0dXJuIHBpcGVsaW5lIGlkXG4gIGdldFBpcGVsaW5lSWQoUGlwZWxpbmVOYW1lKXtcbiAgICB2YXIgUGlwZWxpbmVJZDtcblxuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuICAgICAgICBcbiAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIGZvciAodmFyIGkgPTA7IGk8ZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspe1xuICAgICAgICAgIGlmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpe1xuICAgICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIitkYXRhWydwaXBlbGluZXMnXVtpXS5pZCk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgICAgICAvL3JldHVybiBkYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIitlcnIpXG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIFxuICAgICAgXG4gICAgICB9KSBcblxuICB9LFxuXG5cbiAgY2hlY2tWYWxpZElucHV0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFZhbGlkQml0ID0gZmFsc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5VQ29tbWFuZDtcbiAgICBjb25zb2xlLmxvZyhcInVzZXIgY29tbWFuZCA6IFwiK1VzZXJDb21tYW5kKTtcbiAgICBcbiAgICB2YXIgVmFsaWRDb21tYW5kcyA9IFsnQHNjcnVtYm90JywgJy9yZXBvJywgJy9pc3N1ZScsICcvZXBpYycsICcvYmxvY2tlZCddO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgVmFsaWRDb21tYWRSZWdleCA9IG5ldyBSZWdFeHAoL14oQHNjcnVtYm90KVxcc1tcXC9BLVphLXpdKi8pO1xuICAgIGNvbnNvbGUubG9nKFwicHJvY2Vzc2luZyBtZXNzYWdlIDogXCIrVXNlckNvbW1hbmQpO1xuXG5cbiAgICBpZiAoIVZhbGlkQ29tbWFkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpe1xuICAgICAgbG9nKFwiRXJyb3Igbm90IHN0YXJ0aW5nIHdpdGggQHNjcnVtYm90XCIpXG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgICBcblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICAvL2lmIC9yZXBvIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCwgbm8gcmVwbyBpZCBwcm92aWRlZCBlbHNlIHRha2Ugd2hhdGV2ZXIgY29tZXMgYWZ0ZXIgQHNjcnVtYm90IGFzIHJlcG9faWRcbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gVmFsaWRDb21tYW5kc1sxXSl7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgLy8tLVxuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMl07XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBcblxuXG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgbG9nKFwiRmluYWwgQ29tbWFuZCA6IFwiK0ZpbmFsQ29tbWFuZCk7XG5cbiAgICByZXR1cm4gVmFsaWRCaXQgPSB0cnVlO1xuICB9LFxuXG4gIGdldENvbW1hbmQ6IGZ1bmN0aW9uIChVQ29tbWFuZCkge1xuICAgIGxvZyhcImdldENvbW1hbmRcIik7XG4gICAgdmFyIFZhbGlkQml0ID0gJyc7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gVUNvbW1hbmQ7XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IHR5cGVvZiBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09ICcvcmVwbycpe1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIC8vLS1cbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nIChcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiK3JlcG9faWQgK1wiIGZyb20gbWVzc2FnZSBhcmcgYXQgcG9zIDEgPSBcIitDb21tYW5kQXJyWzFdKTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIFxuICAgIGxvZyhcInJlcG8gaWQgMiA6IFwiK3JlcG9faWQpO1xuICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBGaW5hbENvbW1hbmQ7XG4gIH0sXG5cbiAgdmFsaWRhdGVDb21tYW5kczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIGxvZyhcInZhbGlkYXRlQ29tbWFuZHNcIik7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcblxuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuQ29tbWFuZDtcbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsXG4gICAgfTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSpcXHNbMC05XSovKTtcbiAgICB2YXIgSXNzdWVSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvaXNzdWVdKlxcc1swLTldKlxcc1swLTldKlxccygtdXxidWd8cGlwZWxpbmV8LXB8ZXZlbnRzfC1lKS8pO1xuICAgIHZhciBFcGljUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2VwaWNdKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBCbG9ja2VkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvYmxvY2tlZC8pO1xuXG5cbiAgICBpZiAoUmVwb1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0UmVwb1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycik7XG5cbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcblxuICAgIGlmIChCbG9ja2VkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRCbG9ja1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChJc3N1ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG5cbiAgICAgIGxvZyhcIlVybE9iamVjdCA9IFwiK1VybE9iamVjdCk7XG4gICAgcmV0dXJuIFVybE9iamVjdDtcblxuICB9LFxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBsb2coXCJtYWtlUmVxdWVzdFwiKTtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVG9rZW4gPSBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU47XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuemVuaHViLmlvLyc7XG5cbiAgICB2YXIgVXNlclVybCA9IG9wdGlvbnMuVVVybDtcbiAgICAvL3ZhciBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keS5lc3RpbWF0ZTtcbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcbiAgICB2YXIgVXJsVHlwZSA9IG9wdGlvbnMuVVR5cGU7XG4gICAgXG5cbiAgICAvL2xvZyhcIkJvZHkgOiBcIitKU09OLnN0cmluZ2lmeShVcmxCb2R5KSk7XG4gICAgLy9jb25zb2xlLmRpcihvcHRpb25zLnJlcXVlc3QsIHtkZXB0aDpudWxsfSk7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogVU1ldGhvZCxcbiAgICAgIHVyaTogTWFpblVybCArIFVzZXJVcmwsXG4gICAgICBxczoge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgICAgICxcbiAgICAgICAgXG4gICAgICBib2R5OiB7XG4gICAgICAgIC8vZXN0aW1hdGU6IFVybEJvZHlcbiAgICAgIFxuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zb2xlLmRpcihVcmxPcHRpb25zLCB7ZGVwdGg6bnVsbH0pO1xuICAgIFxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcblxuICAgICAgICAvL1BhcnNlIEpTT04gYWNjb3JkaW5nIHRvIG9iaiByZXR1cm5lZFxuICAgICAgICBpZihVcmxUeXBlID09PSAnSXNzdWVFdmVudHMnKXtcbiAgICAgICAgICBsb2coXCJFdmVudHMgZm9yIGlzc3VlXCIpO1xuICAgICAgICAgIERhdGEgPSBcIiBcIjtcblxuICAgICAgICAgIGZvciAodmFyIGkgPTA7IGk8c3VjY2Vzc2RhdGEubGVuZ3RoOyBpKyspe1xuXG4gICAgICAgICAgICBpZihzdWNjZXNzZGF0YVtpXS50eXBlID09PSAndHJhbnNmZXJJc3N1ZScpe1xuICAgICAgICAgICAgICBsb2coXCJwaXBlbGluZSBtb3ZlIGV2ZW50XCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUpK3N1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUpO1xuICAgICAgICAgICAgICBjb25zb2xlLmRpcihzdWNjZXNzZGF0YVtpXSwge2RlcHRoOm51bGx9KTsgXG4gICAgICAgICAgICAgIERhdGEgKz0gXCIgICBVc2VyIFwiICtzdWNjZXNzZGF0YVtpXS51c2VyX2lkKyBcIiBtb3ZlZCBpc3N1ZSBmcm9tIFwiK3N1Y2Nlc3NkYXRhW2ldLmZyb21fcGlwZWxpbmUubmFtZStcIiB0byBcIitzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZS5uYW1lO1xuICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICdlc3RpbWF0ZUlzc3VlJyl7XG4gICAgICAgICAgICAgIGxvZyhcImVzdGltYXRlIGNoYW5nZSBldmVudCBcIitpKTtcbiAgICAgICAgICAgICAgY29uc29sZS5kaXIoc3VjY2Vzc2RhdGFbaV0sIHtkZXB0aDpudWxsfSk7IFxuICAgICAgICAgICAgICBEYXRhICs9IFwiICAgVXNlciBcIiArc3VjY2Vzc2RhdGFbaV0udXNlcl9pZCsgXCIgY2hhbmdlZCBlc3RpbWF0ZSBvbiBpc3N1ZSB0byAgXCIrc3VjY2Vzc2RhdGFbaV0udG9fZXN0aW1hdGUudmFsdWUrXCIgb24gZGF0ZSA6IFwiK3N1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQ7XG4gIFxuICAgICAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgICBsb2coXCJkbyBub3QgcmVjb2dpc2UgZXZlbnQgdHlwZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1cblxuICAgICAgICAgIFxuXG4gICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgaWYoVXJsVHlwZSA9PT0gJ0dldFBpcGVsaW5lJyl7XG5cbiAgICAgICAgICBEYXRhID0gXCIgXCI7XG4gICAgICAgICAgRGF0YSArPSBcIlRoYXQgaXNzdWUgaXMgY3VycmVudGx5IGluIFwiK3N1Y2Nlc3NkYXRhLnBpcGVsaW5lLm5hbWUrXCIgcGlwZWxpbmUuXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZihVcmxUeXBlID09PSAnSXNzdWVFc3RpbWF0ZScpe1xuICAgICAgICAgIERhdGEgPSBcIiBcIjtcbiAgICAgICAgICBEYXRhICs9IFwiWW91ciBJc3N1ZSdzIGVzdGltYXRlIGhhcyBiZWVuIHVwZGF0ZWQgdG8gXCIrc3VjY2Vzc2RhdGEuZXN0aW1hdGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRGF0YSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzIGZvbGxvd2luZyBlcnJvciA9JyArIGVycik7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9KTtcblxuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIC8vYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgUmVwb0lkID0gc3VjY2Vzc2RhdGEuaWQ7XG5cbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlcG9zaXRvcnkgSWQgPScgKyBSZXBvSWQpO1xuICAgICAgICByZXR1cm4gXCJUaGUgUmVwb3NpdG9yeSBJZCBmb3IgXCIrUmVwb3NpdG9yeU5hbWUrXCIgaXMgXCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGEuaWQpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGxvZyhcIkFQSSBjYWxsIGZhaWxlZC4uLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICAgIFVybDogJycsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgfTtcblxuXG5cblxuICAgICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuXG4gICAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiK0lzc3VlTm8pO1xuXG4gICAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0dldFBpcGVsaW5lJ1xuICAgICAgICAgIFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy8gTW92ZSBQaXBlbGluZVxuICAgICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIC8vaWYgbW92aW5nIHBpcGVsaW5lLCAzcmQgYXJnIGlzIGlzc3VlIG51bSwgIDR0aCA9IC1wLCA1dGggPSBwaXBlbGluZSwgNnQgcG9zaXRpb25cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgICB2YXIgUGlwZUxpbmVJZCA9IHRoaXMuZ2V0UGlwZWxpbmVJZChDb21tYW5kQXJyWzNdKS50aGVuKGZ1bmN0aW9uIChkYXRhKXtcblxuICAgICAgICAgIGxvZyhcIlBpcGVsaW5lIGdvdCAodXNpbmcgZGF0YSk6IFwiKyBkYXRhKTtcbiAgICAgICAgICBcbiAgICAgICAgICB2YXIgUG9zTm8gPSBDb21tYW5kQXJyWzRdO1xuICBcbiAgICAgICAgICB2YXIgTW92ZUlzc3VlUGlwZUxpbmUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL21vdmVzJztcbiAgXG4gICAgICAgICAgbG9nKFwiYnVpbGRpbmcgbW92ZSBwaXBlbGluZSB1cmwuLlwiKVxuICAgICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICAgIHBpcGVsaW5lX2lkOiBkYXRhLFxuICAgICAgICAgICAgcG9zaXRpb246IChQb3NObyAhPT0gbnVsbCAmJiBQb3NObyAhPT0gJycgJiYgdHlwZW9mIFBvc05vICE9PSAndW5kZWZpbmVkJyA/IFBvc05vIDogMClcbiAgICAgICAgICB9O1xuICBcbiAgICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgICBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgICAgVXJsVHlwZTonSXNzdWVUb1BpcGVsaW5lcydcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbG9nKFwidXJsIGJ1aWx0LlwiKTtcbiAgXG4gICAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgICAgICB9KTsgXG5cbiAgICAgICAgXG4gICAgICB9XG5cblxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlIFxuICAgICAgdmFyIEV2ZW50c1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc1swLTldKlxcc2V2ZW50cy8pO1xuXG4gICAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG5cbiAgICAgICAgbG9nKFwiaXNzdWUgbm8gZXZlbnRzcmVnZXggXCIrSXNzdWVObyk7XG4gICAgICAgIFxuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXZlbnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuXG4gICAgICAvLyBTZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoRXN0aW1hdGVBZGRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgICAgdmFyIEVzdGltYXRlVmFsID0gQ29tbWFuZEFycls0XTtcbiAgICAgICAgbG9nKFwiRXN0aW1hdGVWYWwgOiBcIitFc3RpbWF0ZVZhbClcbiAgICAgICAgLy92YXIgUG9zTm8gPSBDb21tYW5kQXJyWzRdO1xuXG4gICAgICAgIHZhciBTZXRFc3RpbWF0ZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvZXN0aW1hdGUnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBcImVzdGltYXRlXCI6IEVzdGltYXRlVmFsXG4gICAgICAgICAgLy9wb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFNldEVzdGltYXRlLFxuICAgICAgICAgIE1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXN0aW1hdGUnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcblxuICAgICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0J1Z0lzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vVG8gR2V0IFVzZXIgSXNzdWUgYnkgdXNlciwgdXNlcklzc3VlXG4gICAgICB2YXIgVXNlclJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy11XFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChVc2VyUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgVXNlclVybCA9ICcnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFVzZXJVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidVc2VySXNzdWVzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcblxuICAgIH1cblxuICAgICxcbiAgLy9UbyBHZXQgQmxvY2tlZCBJc3N1ZXMgVXJsXG4gIGdldEJsb2NrVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldEJsb2NrVXJsXCIpO1xuXG4gICAgdmFyIFJlc3Bvc2l0cm95SWQgPSBSZXBvSWQ7XG5cbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEJsb2NrdXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogQmxvY2t1cmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6J0Jsb2NrZWRJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0RXBpY1VybFwiKTtcblxuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBFcGljVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvZXBpY3MnO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgVXJsVHlwZTonRXBpY0lzc3VlcydcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfVxuXG59O1xuIl19