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
      request.post(pipelineIdRequest).then(function (data) {

        log(data);
        for (var i = 0; i < data['pipelines'].length; i++) {
          log("checking");
          if (data['pipelines'][i].name === PipelineName) {
            log("found pipeline id : " + data['pipelines'][i].id);
            PipelineId = data['pipelines'][i].id;
          }
        }

        log("did not find id corresponding to pipe name");
      }).catch(function (err) {
        console.log("error = " + err);
        return err;
      });

      //getPipelineId(CommandArr[4]).then((data) => {

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
      //});
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJkYXRlRm9ybWF0Iiwib3MiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsIk9wdGlvbnMiLCJSZXNwb3NpdG9yeUlkIiwiZ2V0UmVzcG9zaXRvcnlJZCIsInJlcG9OYW1lIiwiR2l0T3duZXJOYW1lIiwiVmFsaWRVcmxPYmplY3QiLCJ2YWxpZGF0ZUNvbW1hbmRzIiwiQ29tbWFuZCIsIklzVmFsaWQiLCJJc0dpdCIsIlVDb21tYW5kQXJyIiwiR2l0UmVwb05hbWUiLCJjb25zb2xlIiwiZGlyIiwiZGVwdGgiLCJtYWtlUmVxdWVzdCIsIlVVcmwiLCJVcmwiLCJVQm9keSIsIkJvZHkiLCJVTWV0aG9kIiwiTWV0aG9kIiwiVVR5cGUiLCJVcmxUeXBlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwicHJvY2VzcyIsImVudiIsIlpFTkhVQl9UT0tFTiIsIk1haW5VcmwiLCJVc2VyVXJsIiwiYm9keSIsImtleSIsIlVybE9wdGlvbnMiLCJtZXRob2QiLCJ1cmkiLCJxcyIsImFjY2Vzc190b2tlbiIsImhlYWRlcnMiLCJqc29uIiwidGhlbiIsInN1Y2Nlc3NkYXRhIiwiRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJpIiwibGVuZ3RoIiwidHlwZSIsInRvX3BpcGVsaW5lIiwiZnJvbV9waXBlbGluZSIsInVzZXJfaWQiLCJuYW1lIiwiY3JlYXRlZF9hdCIsInRvX2VzdGltYXRlIiwidmFsdWUiLCJwaXBlbGluZSIsImVzdGltYXRlIiwiZXBpY19pc3N1ZXMiLCJpc3N1ZV9udW1iZXIiLCJpc3N1ZV91cmwiLCJjYXRjaCIsImVyciIsIkVycm9yIiwiUmVwb3NpdG9yeU5hbWUiLCJPd25lcm5hbWUiLCJSZXBvc2l0b3J5VXJsIiwiaWQiLCJodG1sX3VybCIsIlJlc3Bvc2l0cm95SWQiLCJQaXBlbGluZVJlZ2V4IiwiSXNzdWVObyIsIlBpcGVMaW5ldXJsIiwiUGlwZWxpbmVNb3ZlUmVnZXgiLCJQaXBlbGluZU5hbWUiLCJQaXBlbGluZUlkIiwicGlwZWxpbmVJZFJlcXVlc3QiLCJwb3N0IiwiZGF0YSIsIlBvc05vIiwiTW92ZUlzc3VlUGlwZUxpbmUiLCJNb3ZlQm9keSIsInBpcGVsaW5lX2lkIiwicG9zaXRpb24iLCJFdmVudHNSZWdleCIsIkV2ZW50c1VybCIsIkVzdGltYXRlQWRkUmVnZXgiLCJFc3RpbWF0ZVZhbCIsIlNldEVzdGltYXRlIiwiQnVnUmVnZXgiLCJCdWdVcmwiLCJVc2VyUmVnZXgiLCJCbG9ja3VybCIsIkVwaWNVcmwiLCJnZXRQaXBlbGluZUlkIl0sIm1hcHBpbmdzIjoiOztBQU9BOzs7Ozs7QUFQQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLEtBQUtELFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlFLFFBQVFGLFFBQVEsT0FB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QUNELEdBakJJLENBQVA7QUFrQkQsQ0E5QkQiLCJmaWxlIjoic2NydW1fYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xudmFyIGRhdGVGb3JtYXQgPSByZXF1aXJlKCdkYXRlZm9ybWF0Jyk7XG52YXIgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbi8vIFNldHVwIGRlYnVnIGxvZ1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcbmNvbnN0IGxvZyA9IGRlYnVnKCd3YXRzb253b3JrLXNjcnVtYm90Jyk7XG5cbnZhciByZXBvX2lkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICB2YXIgRmluYWxNZXNzYWdlID0gbnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRWYWx1ZSA9IHRoaXMuZ2V0Q29tbWFuZChVc2VyQ29tbWFuZCk7XG5cbiAgICBsb2coXCJjb21tYW5kIHZhbCA6IFwiICsgQ29tbWFuZFZhbHVlKTtcblxuICAgIGlmIChDb21tYW5kVmFsdWUgPT09ICcnIHx8IENvbW1hbmRWYWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgQ29tbWFuZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIgKyByZXBvX2lkKTtcblxuICAgIHZhciBSZXBvc2l0b3J5SWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKFJlcG9zaXRvcnlJZCA9PT0gbnVsbCB8fCBSZXBvc2l0b3J5SWQgPT09ICcnIHx8IHR5cGVvZiBSZXBvc2l0b3J5SWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBsb2coXCJ0cnlpbmcgdG8gZ2V0IHJlcG8gaWRcIik7XG5cbiAgICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XS8pO1xuXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgICAgTWVzc2FnZTogJ1JlcG9zaXRvcnkgSWQgTm90IFNwZWNpZmllZCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIFJlcG9JZCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVwb0lkICE9PSAnJyAmJiBSZXBvSWQgIT09IG51bGwpIHtcbiAgICAgICAgbG9nKFwicmVwbyBmb3VuZCBpZDogXCIgKyBSZXBvSWQpO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG5cbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICAgIE1lc3NhZ2U6ICdTdWNjZXNzJyxcbiAgICAgICAgICBPcHRpb25zOiB7XG4gICAgICAgICAgICBSZXNwb3NpdG9yeUlkOiBSZXBvSWRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG5cbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNHaXQpIHtcbiAgICAgIGxvZyhcImlzIEdpdCAuLlwiKVxuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6ICd4MDAwNjY5NDknXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGxvZyhcIm5vdCBnaXRcIik7XG4gICAgICBsb2coXCJ2aWV3IG9ialwiICsgVmFsaWRVcmxPYmplY3QpXG4gICAgICBjb25zb2xlLmRpcihWYWxpZFVybE9iamVjdCwgeyBkZXB0aDogbnVsbCB9KVxuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2QsXG4gICAgICAgIFVUeXBlOiBWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuICAgIHZhciBWYWxpZENvbW1hbmRzID0gWydAc2NydW1ib3QnLCAnL3JlcG8nLCAnL2lzc3VlJywgJy9lcGljJywgJy9ibG9ja2VkJ107XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IFVzZXJDb21tYW5kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgIHZhciBWYWxpZENvbW1hZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXihAc2NydW1ib3QpXFxzW1xcL0EtWmEtel0qLyk7XG4gICAgY29uc29sZS5sb2coXCJwcm9jZXNzaW5nIG1lc3NhZ2UgOiBcIiArIFVzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG4gICAgICBsb2coXCJFcnJvciBub3Qgc3RhcnRpbmcgd2l0aCBAc2NydW1ib3RcIilcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cblxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIC8vaWYgL3JlcG8gY29tZXMgYWZ0ZXIgQHNjcnVtYm90LCBubyByZXBvIGlkIHByb3ZpZGVkIGVsc2UgdGFrZSB3aGF0ZXZlciBjb21lcyBhZnRlciBAc2NydW1ib3QgYXMgcmVwb19pZFxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSBWYWxpZENvbW1hbmRzWzFdKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIgKyBGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKSB7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiICsgcmVwb19pZCArIFwiIGZyb20gbWVzc2FnZSBhcmcgYXQgcG9zIDEgPSBcIiArIENvbW1hbmRBcnJbMV0pO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwgMSk7XG4gICAgfVxuXG4gICAgbG9nKFwicmVwbyBpZCAyIDogXCIgKyByZXBvX2lkKTtcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gRmluYWxDb21tYW5kO1xuICB9LFxuXG4gIHZhbGlkYXRlQ29tbWFuZHM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICBsb2coXCJ2YWxpZGF0ZUNvbW1hbmRzXCIpO1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Db21tYW5kO1xuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuICAgIGlmIChSZXBvUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRSZXBvVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKTtcblxuICAgIHZhciBSZXBvSWQgPSByZXBvX2lkO1xuXG4gICAgaWYgKEJsb2NrZWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEJsb2NrVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKElzc3VlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgbG9nKFwiVXJsT2JqZWN0ID0gXCIgKyBVcmxPYmplY3QpO1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgfSxcblxuICBtYWtlUmVxdWVzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBsb2coXCJtYWtlUmVxdWVzdFwiKTtcbiAgICBsb2cob3B0aW9ucy5VQm9keSlcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVG9rZW4gPSBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU47XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuemVuaHViLmlvLyc7XG5cbiAgICB2YXIgVXNlclVybCA9IG9wdGlvbnMuVVVybDtcbiAgICB2YXIgYm9keTtcblxuICAgIGlmIChvcHRpb25zLlVCb2R5ID09IG51bGwpIHtcbiAgICAgIGJvZHkgPSB7IGtleTogJ3ZhbHVlJyB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkgPSBvcHRpb25zLlVCb2R5O1xuXG4gICAgfVxuXG4gICAgdmFyIFVNZXRob2QgPSBvcHRpb25zLlVNZXRob2Q7XG4gICAgdmFyIFVybFR5cGUgPSBvcHRpb25zLlVUeXBlO1xuXG4gICAgY29uc29sZS5kaXIoJ1VybGJvZHk6ICcgKyBib2R5LCB7IGRlcHRoOiBudWxsIH0pO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICBtZXRob2Q6IFVNZXRob2QsXG4gICAgICB1cmk6IE1haW5VcmwgKyBVc2VyVXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgICAgLFxuXG4gICAgICAvL2JvZHk6IHtcbiAgICAgIGJvZHlcblxuICAgICAgLy99XG4gICAgfTtcblxuICAgIGNvbnNvbGUuZGlyKFVybE9wdGlvbnMsIHsgZGVwdGg6IG51bGwgfSk7XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgRGF0YSA9IHN1Y2Nlc3NkYXRhO1xuICAgICAgICBjb25zb2xlLmxvZygnRm9sbG93aW5nIERhdGEgPScgKyBKU09OLnN0cmluZ2lmeShEYXRhKSk7XG5cbiAgICAgICAgLy9QYXJzZSBKU09OIGFjY29yZGluZyB0byBvYmogcmV0dXJuZWRcbiAgICAgICAgaWYgKFVybFR5cGUgPT09ICdJc3N1ZUV2ZW50cycpIHtcbiAgICAgICAgICBsb2coXCJFdmVudHMgZm9yIGlzc3VlXCIpO1xuICAgICAgICAgIERhdGEgPSAnXFxuICAgICpIZXJlIGFyZSB0aGUgbW9zdCByZWNlbnQgZXZlbnRzIHJlZ2FyZGluZyB5b3VyIGlzc3VlOiogJztcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzc2RhdGEubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICd0cmFuc2Zlcklzc3VlJykge1xuICAgICAgICAgICAgICBsb2coXCJwaXBlbGluZSBtb3ZlIGV2ZW50XCIgKyBKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YVtpXS50b19waXBlbGluZSkgKyBzdWNjZXNzZGF0YVtpXS5mcm9tX3BpcGVsaW5lKTtcbiAgICAgICAgICAgICAgRGF0YSArPSAnXFxuKlVzZXIgJyArIHN1Y2Nlc3NkYXRhW2ldLnVzZXJfaWQgKyAnKiBfbW92ZWRfIHRoaXMgaXNzdWUgZnJvbSAnICsgc3VjY2Vzc2RhdGFbaV0uZnJvbV9waXBlbGluZS5uYW1lICsgJyB0byAnICsgc3VjY2Vzc2RhdGFbaV0udG9fcGlwZWxpbmUubmFtZSArICcgb24gZGF0ZSA6ICcgKyBkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICdlc3RpbWF0ZUlzc3VlJykge1xuICAgICAgICAgICAgICBsb2coXCJlc3RpbWF0ZSBjaGFuZ2UgZXZlbnQgXCIgKyBpKTtcbiAgICAgICAgICAgICAgRGF0YSArPSAnXFxuICpVc2VyICcgKyBzdWNjZXNzZGF0YVtpXS51c2VyX2lkICsgJyogX2NoYW5nZWQgZXN0aW1hdGVfIG9uIHRoaXMgaXNzdWUgdG8gICcgKyBzdWNjZXNzZGF0YVtpXS50b19lc3RpbWF0ZS52YWx1ZSArICcgb24gZGF0ZSA6ICcgKyBkYXRlRm9ybWF0KHN1Y2Nlc3NkYXRhW2ldLmNyZWF0ZWRfYXQsIFwiZGRkZCwgbW1tbSBkUywgeXl5eVwiKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgRGF0YSArPSBcIkRvIG5vdCByZWNvZ25pemUgZXZlbnQgdHlwZVwiXG4gICAgICAgICAgICAgIGxvZyhcImRvIG5vdCByZWNvZ2lzZSBldmVudCB0eXBlXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfVxuICAgICAgICAgIERhdGEgKz0gXCIgXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0dldFBpcGVsaW5lJykge1xuXG4gICAgICAgICAgRGF0YSA9IFwiIFwiO1xuICAgICAgICAgIERhdGEgKz0gXCJUaGF0IGlzc3VlIGlzIGN1cnJlbnRseSBpbiBcIiArIHN1Y2Nlc3NkYXRhLnBpcGVsaW5lLm5hbWUgKyBcIiBwaXBlbGluZS5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVcmxUeXBlID09PSAnSXNzdWVFc3RpbWF0ZScpIHtcbiAgICAgICAgICBEYXRhID0gJyc7XG4gICAgICAgICAgRGF0YSArPSAnWW91ciBJc3N1ZVxcJ3MgZXN0aW1hdGUgaGFzIGJlZW4gdXBkYXRlZCB0byAnICsgc3VjY2Vzc2RhdGEuZXN0aW1hdGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0VwaWNJc3N1ZXMnKSB7XG5cbiAgICAgICAgICBEYXRhID0gXCJUaGUgZm9sbG93aW5nIEVwaWNzIGFyZSBpbiB5b3VyIHNjcnVtYm9hcmQ6IFwiO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIERhdGEgKz0gYFxcbiBFcGljIElEOiAgJHtzdWNjZXNzZGF0YS5lcGljX2lzc3Vlc1tpXS5pc3N1ZV9udW1iZXJ9IFVybCA6ICR7c3VjY2Vzc2RhdGEuZXBpY19pc3N1ZXNbaV0uaXNzdWVfdXJsfSBgXG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVXJsVHlwZSA9PT0gJ0lzc3VlVG9QaXBlbGluZXMnKSB7XG4gICAgICAgICAgRGF0YSA9IFwiXCI7XG4gICAgICAgICAgRGF0YSArPSAnU3VjZXNzZnVsbHkgTW92ZWQgSXNzdWUnXG4gICAgICAgIH1cblxuICAgICAgICBsb2coXCJTdWNjZXNzIERhdGEgOiBcIiArIERhdGEpXG4gICAgICAgIHJldHVybiBcIkNvbW1hbmQgcGFyYW1ldGVycyBub3QgYWNjZXB0ZWRcIjtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgZm9sbG93aW5nIGVycm9yID0nICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH0pO1xuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuICAgIHZhciBSZXBvc2l0b3J5VXJsID0gJ3JlcG9zLycgKyBPd25lcm5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tLyc7XG4gICAgbG9nKFJlcG9zaXRvcnlOYW1lKVxuICAgIC8vY29uc29sZS5kaXIob3B0aW9ucyx7ZGVwdGg6bmxsfSlcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgfTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBSZXBvSWQgPSBzdWNjZXNzZGF0YS5pZDtcblxuXG4gICAgICAgIHJlcG9faWQgPSBSZXBvSWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKHN1Y2Nlc3NkYXRhKTtcbiAgICAgICAgcmV0dXJuIFwiVGhlICpSZXBvc2l0b3J5IElkKiBmb3IgX1wiICsgUmVwb3NpdG9yeU5hbWUgKyBcIl8gaXMgXCIgKyBKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YS5pZCkgKyBcIiAqcmVwbyBsaW5rKiA6IFwiICsgc3VjY2Vzc2RhdGEuaHRtbF91cmw7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgbG9nKFwiQVBJIGNhbGwgZmFpbGVkLi4uXCIpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgJWQgcmVwb3MnLCBlcnIpO1xuICAgICAgICByZXR1cm4gXCJObyByZXBvc2l0b3J5IHdpdGggbmFtZSA6IFwiICsgUmVwb3NpdG9yeU5hbWUgKyBcIiBleGlzdHNcIlxuXG4gICAgICB9KTtcblxuICB9LFxuXG4gIC8vIFRvIEdldCBSZXBvIFVybFxuICBnZXRSZXBvVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpIHtcblxuICAgIGxvZyhcImdldFJlcG9VcmxcIik7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgR2l0T3duZXJOYW1lID0gJ3gwMDA2Njk0OSc7XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9ICdyZXBvcy8nICsgR2l0T3duZXJOYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgIFVybDogUmVwb3NpdG9yeUlkLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogdHJ1ZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IElzc3VlIHJlbGF0ZWQgVXJsXG4gIGdldElzc3VlVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldElzc3VlVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIC8vVG8gR2V0IFN0YXRlIG9mIFBpcGVsaW5lXG4gICAgdmFyIFBpcGVsaW5lUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzcGlwZWxpbmUvKTtcblxuICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiICsgSXNzdWVObyk7XG4gICAgICB2YXIgUGlwZUxpbmV1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogUGlwZUxpbmV1cmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ0dldFBpcGVsaW5lJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vIE1vdmUgUGlwZWxpbmVcbiAgICB2YXIgUGlwZWxpbmVNb3ZlUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLXBcXHNbQS1aYS16MC05XSovKTtcblxuICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuICAgICAgdmFyIFBpcGVsaW5lTmFtZSA9IENvbW1hbmRBcnJbNF07XG4gICAgICB2YXIgUGlwZWxpbmVJZDtcbiAgICAgIC8vZ2V0IHBpcGVsaW5lIGlkXG4gICAgICAvL3ZhciBQaXBlbGluZUlkO1xuICAgICAgdmFyIHBpcGVsaW5lSWRSZXF1ZXN0ID0ge1xuICAgICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdYLUF1dGhlbnRpY2F0aW9uLVRva2VuJzogcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOXG4gICAgICAgIH0sXG5cbiAgICAgICAganNvbjogdHJ1ZVxuICAgICAgfTtcbiAgICAgIHJlcXVlc3QucG9zdChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICAgIGxvZyhkYXRhKVxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxvZyhcImNoZWNraW5nXCIpXG4gICAgICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKSB7XG4gICAgICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIgKyBkYXRhWydwaXBlbGluZXMnXVtpXS5pZCk7XG4gICAgICAgICAgICAgIFBpcGVsaW5lSWQgPSBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiICsgZXJyKVxuICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH0pXG5cbiAgICAgIC8vZ2V0UGlwZWxpbmVJZChDb21tYW5kQXJyWzRdKS50aGVuKChkYXRhKSA9PiB7XG5cbiAgICAgICAgLy9pZiBtb3ZpbmcgcGlwZWxpbmUsIDNyZCBhcmcgaXMgaXNzdWUgbnVtLCAgNHRoID0gLXAsIDV0aCA9IHBpcGVsaW5lLCA2dCBwb3NpdGlvblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICAgIGxvZyhcIm5hbWUgdXNlZCBcIiArIENvbW1hbmRBcnJbNF0pXG5cblxuICAgICAgICBsb2coXCJQaXBlbGluZSBnb3QgKHVzaW5nIGRhdGEpOiBcIiArIFBpcGVsaW5lSWQpO1xuICAgICAgICB2YXIgUG9zTm8gPSBDb21tYW5kQXJyWzVdIHwgMDtcbiAgICAgICAgbG9nKFwicG9zaXRpb246IFwiICsgUG9zTm8pXG4gICAgICAgIHZhciBNb3ZlSXNzdWVQaXBlTGluZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnO1xuICAgICAgICBsb2coXCJidWlsZGluZyBtb3ZlIHBpcGVsaW5lIHVybC4uXCIpXG5cbiAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIC8vcGlwZWxpbmVfaWQ6ICc1YTA4OGI2MzhmNDY0NzA5Y2QyYzc3YzUnLFxuICAgICAgICAgIHBpcGVsaW5lX2lkOiBQaXBlbGluZUlkLFxuICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6ICdJc3N1ZVRvUGlwZWxpbmVzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGxvZyhcInVybCBidWlsdC5cIik7XG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICAvL30pO1xuICAgIH1cblxuICAgIC8vIEdldCBldmVudHMgZm9yIHRoZSBJc3N1ZSBcbiAgICB2YXIgRXZlbnRzUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzZXZlbnRzLyk7XG5cbiAgICBpZiAoRXZlbnRzUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzJdO1xuICAgICAgbG9nKFwiaXNzdWUgbm8gZXZlbnRzcmVnZXggXCIgKyBJc3N1ZU5vKTtcbiAgICAgIHZhciBFdmVudHNVcmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2V2ZW50cyc7XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogRXZlbnRzVXJsLFxuICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdJc3N1ZUV2ZW50cydcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgfVxuXG5cbiAgICAvLyBTZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgdmFyIEVzdGltYXRlQWRkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzWzAtOV0qXFxzLWVcXHNbMC05XSovKTtcblxuICAgIGlmIChFc3RpbWF0ZUFkZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsyXTtcbiAgICAgIHZhciBFc3RpbWF0ZVZhbCA9IENvbW1hbmRBcnJbNF07XG4gICAgICBsb2coXCJFc3RpbWF0ZVZhbCA6IFwiICsgRXN0aW1hdGVWYWwpXG4gICAgICB2YXIgU2V0RXN0aW1hdGUgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm8gKyAnL2VzdGltYXRlJztcblxuICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICBlc3RpbWF0ZTogRXN0aW1hdGVWYWxcbiAgICAgIH07XG5cbiAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgIFVybDogU2V0RXN0aW1hdGUsXG4gICAgICAgIE1ldGhvZDogJ1BVVCcsXG4gICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgIFVybFR5cGU6ICdJc3N1ZUVzdGltYXRlJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cbiAgICAvLyBHZXQgQnVncyBieSB0aGUgdXNlclxuICAgIHZhciBCdWdSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHNidWcvKTtcblxuICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMl07XG4gICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICBVcmxUeXBlOiAnQnVnSXNzdWVzJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICB9XG5cblxuICAgIC8vVG8gR2V0IFVzZXIgSXNzdWUgYnkgdXNlciwgdXNlcklzc3VlXG4gICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgaWYgKFVzZXJSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICB2YXIgVXNlclVybCA9ICcnO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICBVcmw6IFVzZXJVcmwsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgVXJsVHlwZTogJ1VzZXJJc3N1ZXMnXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgIH1cblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cblxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICBsb2coXCJnZXRCbG9ja1VybFwiKTtcbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEJsb2NrdXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogQmxvY2t1cmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6ICdCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG5cbiAgLy9UbyBHZXQgZXBpY3MgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICBsb2coXCJnZXRFcGljVXJsXCIpO1xuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBFcGljVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvZXBpY3MnO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6ICdFcGljSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9XG5cbn07XG5cbi8vZ2l2ZW4sIHBpcGVsaW5lIG5hbWUsIHJldHVybiBwaXBlbGluZSBpZFxudmFyIGdldFBpcGVsaW5lSWQgPSBmdW5jdGlvbiAoUGlwZWxpbmVOYW1lKSB7XG4gIGxvZyhcImVudGVyZWQgbmFtZSA6IFwiICsgUGlwZWxpbmVOYW1lKVxuICAvL3ZhciBQaXBlbGluZUlkO1xuICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgdXJpOiAnaHR0cHM6Ly9hcGkuemVuaHViLmlvL3AxL3JlcG9zaXRvcmllcy8nICsgcmVwb19pZCArICcvYm9hcmQnLFxuXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICB9LFxuXG4gICAganNvbjogdHJ1ZVxuICB9O1xuICByZXR1cm4gcnAocGlwZWxpbmVJZFJlcXVlc3QpXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgbG9nKGRhdGEpXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxvZyhcImNoZWNraW5nXCIpXG4gICAgICAgIGlmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpIHtcbiAgICAgICAgICBsb2coXCJmb3VuZCBwaXBlbGluZSBpZCA6IFwiICsgZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgIHJldHVybiBkYXRhWydwaXBlbGluZXMnXVtpXS5pZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsb2coXCJkaWQgbm90IGZpbmQgaWQgY29ycmVzcG9uZGluZyB0byBwaXBlIG5hbWVcIik7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJlcnJvciA9IFwiICsgZXJyKVxuICAgICAgcmV0dXJuIGVycjtcbiAgICB9KVxufVxuIl19