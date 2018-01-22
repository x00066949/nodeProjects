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

      //return res.json(FinalMessage);
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
    var RepoId = CommandArr[2];
    //repo_id = RepoId;

    log("repo id 1 : " + repo_id);

    var RepositoryId = RepoId;

    if (RepositoryId === null || RepositoryId === '' || typeof RepositoryId === 'undefined') {
      log("trying to get repo id");
      var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]*\s[0-9]*/);

      if (!RepoRegex.test(CommandValue)) {
        FinalMessage = {
          Type: 'Error',
          Message: 'Repository Id Not Specified'
        };
        return FinalMessage.Message;
      }

      /*var CommandArr = CommandValue.split(' ');
      var RepoName = CommandArr[1];
      var RepoId = CommandArr[2];*/se;

      if (typeof RepoId !== 'undefined' && RepoId !== '' && RepoId !== null) {
        log("repo found id: " + RepoId);
        //req.session.RepositoryId = RepoId;

        RepoId = repo_id;
        //repo_id = RepoId;

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
      var UCommandArr = CommandValue.split(' ');
      var GitRepoName = UCommandArr[1];

      return this.getRespositoryId({
        request: req,
        response: res,
        repoName: GitRepoName,
        GitOwnerName: 'x00066949'
      });
    } else {

      return this.makeRequest({
        response: res,
        UUrl: ValidUrlObject.Url,
        UBody: ValidUrlObject.Body,
        UMethod: ValidUrlObject.Method
      });
    }
  },
  /*istanbul ignore next*/

  //the method
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
      repo_id = CommandArr[1];
      CommandArr.splice(0, 2);
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
      repo_id = CommandArr[1];
      log("firstly initialisiing repo_id as " + repo_id + " from message arg at pos 1 = " + CommandArr[1]);
      CommandArr.splice(0, 2);
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
    var IssueRegex = new RegExp(/^[\/issue]*\s[0-9]*\s(-u|bug|pipeline|-p|events|-e)/);
    var EpicRegex = new RegExp(/^[\/epic]*\s[A-Za-z0-9]*/);
    var BlockedRegex = new RegExp(/^\/blocked/);

    if (RepoRegex.test(UserCommand)) return UrlObject = this.getRepoUrl(UserCommand, CommandArr);

    var RepoId = repo_id;
    //var RepoId = req.session.RepositoryId;

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
    var UrlBody = options.UBody;
    var UMethod = options.UMethod;

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

    rp(UrlOptions).then(function (successdata) {
      var Data = successdata;
      console.log('Following Data =' + JSON.stringify(Data));
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
      //log("using repoid: "+repo_id);
      var RepoId = successdata.id;
      log("Repo Id 2" + RepoId);
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
    var PipelineRegex = new RegExp(/^\/issue*\s[0-9]*\spipeline/);

    if (PipelineRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];

      log("issue Num in getISsueUrl : " + IssueNo);

      var PipeLineurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        IsValid: true,
        Url: PipeLineurl,
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      return UrlObject;
    }

    // Move Pipeline
    var PipelineMoveRegex = new RegExp(/^\/issue*\s[0-9]*\s-p\s[A-Za-z0-9]*/);

    if (PipelineMoveRegex.test(UserCommand)) {

      //if moving pipeline, 3rd arg is issue num,  4th = -p, 5th = pipeline, 6t position
      var IssueNo = CommandArr[1];
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
          IsGit: false
        };

        log("url built.");

        return UrlObject;
      }); //this is where i try to call the method that gets the pipeline id from name

    }

    // Get events for the Issue
    var EventsRegex = new RegExp(/^\/issue*\s[0-9]*\sevents/);

    if (EventsRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];

      var EventsUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/events';

      var UrlObject = {
        IsValid: true,
        Url: EventsUrl,
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      return UrlObject;
    }

    // Get the estimate for the issue.
    var EstimateAddRegex = new RegExp(/^\/issue*\s[0-9]*\s-e\s[0-9]*/);

    if (EstimateAddRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];
      var PipeLineId = CommandArr[3];
      var PosNo = CommandArr[4];

      var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';

      var MoveBody = {
        pipeline_id: PipeLineId,
        position: PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0
      };

      var UrlObject = {
        IsValid: true,
        Url: MoveIssuePipeLine,
        Method: 'POST',
        Body: MoveBody,
        IsGit: false
      };

      return UrlObject;
    }

    // Get Bugs by the user
    var BugRegex = new RegExp(/^\/issue*\s[0-9]*\sbug/);

    if (BugRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];

      var BugUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        IsValid: true,
        Url: BugUrl,
        Method: 'GET',
        Body: null,
        IsGit: false
      };

      return UrlObject;
    }

    //To Get User Issue by user
    var UserRegex = new RegExp(/^\/issue*\s[0-9]*\s-u\s[A-Za-z0-9]*/);

    if (UserRegex.test(UserCommand)) {

      var UserUrl = '';

      var UrlObject = {
        IsValid: true,
        Url: UserUrl,
        Method: 'GET',
        Body: null,
        IsGit: false
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
      IsGit: false
    };

    return UrlObject;
  },

  //To Get Blocked Issues Url
  getEpicUrl: function /*istanbul ignore next*/getEpicUrl(UserCommand, CommandArr, RepoId) {
    log("getEpicUrl");

    var RespositroyId = RepoId;
    var EpicUrl = 'p1/repositories/' + RespositroyId + '/epics';

    var UrlObject = {
      Url: EpicUrl,
      Method: 'GET',
      Body: null,
      IsGit: false
    };

    return UrlObject;
  }

};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsInNlIiwiT3B0aW9ucyIsIlJlc3Bvc2l0b3J5SWQiLCJnZXRSZXNwb3NpdG9yeUlkIiwicmVwb05hbWUiLCJHaXRPd25lck5hbWUiLCJWYWxpZFVybE9iamVjdCIsInZhbGlkYXRlQ29tbWFuZHMiLCJDb21tYW5kIiwiSXNWYWxpZCIsIklzR2l0IiwiVUNvbW1hbmRBcnIiLCJHaXRSZXBvTmFtZSIsIm1ha2VSZXF1ZXN0IiwiVVVybCIsIlVybCIsIlVCb2R5IiwiQm9keSIsIlVNZXRob2QiLCJNZXRob2QiLCJnZXRQaXBlbGluZUlkIiwiUGlwZWxpbmVOYW1lIiwiUGlwZWxpbmVJZCIsInBpcGVsaW5lSWRSZXF1ZXN0IiwidXJpIiwiaGVhZGVycyIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJqc29uIiwidGhlbiIsImRhdGEiLCJpIiwibGVuZ3RoIiwibmFtZSIsImlkIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwiTWFpblVybCIsIlVzZXJVcmwiLCJVcmxCb2R5IiwiVXJsT3B0aW9ucyIsIm1ldGhvZCIsInFzIiwiYWNjZXNzX3Rva2VuIiwiYm9keSIsInN1Y2Nlc3NkYXRhIiwiRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJFcnJvciIsIlJlcG9zaXRvcnlOYW1lIiwiT3duZXJuYW1lIiwiUmVwb3NpdG9yeVVybCIsIlJlc3Bvc2l0cm95SWQiLCJQaXBlbGluZVJlZ2V4IiwiSXNzdWVObyIsIlBpcGVMaW5ldXJsIiwiUGlwZWxpbmVNb3ZlUmVnZXgiLCJQaXBlTGluZUlkIiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkJ1Z1JlZ2V4IiwiQnVnVXJsIiwiVXNlclJlZ2V4IiwiQmxvY2t1cmwiLCJFcGljVXJsIl0sIm1hcHBpbmdzIjoiOztBQUtBOzs7Ozs7QUFMQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLEtBQUtELFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlFLFFBQVFGLFFBQVEsT0FBUixDQUFaOztBQUVBOztBQUVBLElBQU1HLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjs7QUFFQSxJQUFJQyxPQUFKOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCOztBQUdmQyxVQUFRLHdDQUFVQyxPQUFWLEVBQW1CO0FBQ3pCLFFBQUlDLE1BQU1ELFFBQVFFLE9BQWxCO0FBQ0EsUUFBSUMsTUFBTUgsUUFBUUksUUFBbEI7QUFDQSxRQUFJQyxPQUFPTCxRQUFRSyxJQUFuQjs7QUFFQSxRQUFJQyxZ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QVk7QUFDZHJDLGlCQUFTLElBREs7QUFFZE0sYUFBS3lDLE9BRlM7QUFHZHJDLGdCQUFRLEtBSE07QUFJZEYsY0FBTSxJQUpRO0FBS2RQLGVBQU87QUFMTyxPQUFoQjs7QUFRQSxhQUFPb0MsU0FBUDtBQUNEOztBQUdELFdBQU9BLFNBQVA7QUFFRCxHQTdqQlk7O0FBZ2tCZjtBQUNBSyxlQUFhLDZDQUFVcEUsV0FBVixFQUF1QlUsVUFBdkIsRUFBbUNHLE1BQW5DLEVBQTJDO0FBQ3REMUIsUUFBSSxhQUFKOztBQUVBLFFBQUlxRyxnQkFBZ0IzRSxNQUFwQjs7QUFFQSxRQUFJNkUsVUFBVWhGLFdBQVcsQ0FBWCxDQUFkO0FBQ0EsUUFBSStGLFdBQVcscUJBQXFCakIsYUFBckIsR0FBcUMsVUFBckMsR0FBa0RFLE9BQWpFOztBQUVBLFFBQUkzQixZQUFZO0FBQ2QvQixXQUFLeUUsUUFEUztBQUVkckUsY0FBUSxLQUZNO0FBR2RGLFlBQU0sSUFIUTtBQUlkUCxhQUFPO0FBSk8sS0FBaEI7O0FBT0EsV0FBT29DLFNBQVA7QUFDRCxHQWpsQmM7O0FBbWxCZjtBQUNBTyxjQUFZLDRDQUFVdEUsV0FBVixFQUF1QlUsVUFBdkIsRUFBbUNHLE1BQW5DLEVBQTJDO0FBQ3JEMUIsUUFBSSxZQUFKOztBQUVBLFFBQUlxRyxnQkFBZ0IzRSxNQUFwQjtBQUNBLFFBQUk2RixVQUFVLHFCQUFxQmxCLGFBQXJCLEdBQXFDLFFBQW5EOztBQUVBLFFBQUl6QixZQUFZO0FBQ2QvQixXQUFLMEUsT0FEUztBQUVkdEUsY0FBUSxLQUZNO0FBR2RGLFlBQU0sSUFIUTtBQUlkUCxhQUFPO0FBSk8sS0FBaEI7O0FBT0EsV0FBT29DLFNBQVA7QUFDRDs7QUFsbUJjLENBQWpCIiwiZmlsZSI6InNjcnVtX2JvYXJkLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcblxuLy8gU2V0dXAgZGVidWcgbG9nXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuY29uc3QgbG9nID0gZGVidWcoJ3dhdHNvbndvcmstc2NydW1ib3QnKTtcblxudmFyIHJlcG9faWQ7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cbiAgY2FsbE1lOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIHRlc3QgPSBvcHRpb25zLnRlc3Q7XG5cbiAgICB2YXIgRmluYWxEYXRhID0ge1xuICAgICAgXCJVc2VySWRcIjogXCJNYXBcIixcbiAgICAgIFwiQ2hlY2tcIjogdGVzdFxuICAgIH07XG5cbiAgICByZXR1cm4gRmluYWxEYXRhO1xuICB9LFxuXG4gIGdldFNjcnVtRGF0YShvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLlVzZXJJbnB1dDtcblxuICAgICB2YXIgRmluYWxNZXNzYWdlPW51bGw7XG4gICAgLy8gICBNZXNzYWdlIDogbnVsbCxcbiAgICAvLyAgIE9wdGlvbnMgOiBudWxsXG4gICAgLy8gfTtcblxuICAgIHZhciBDaGVja0lmVmFsaWRDb21tYW5kID0gdGhpcy5jaGVja1ZhbGlkSW5wdXQoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIFVDb21tYW5kOiBVc2VyQ29tbWFuZFxuICAgIH0pO1xuXG4gICAgaWYgKCFDaGVja0lmVmFsaWRDb21tYW5kKSB7XG4gICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgTWVzc2FnZTogJ0ludmFsaWQgSW5wdXQnXG4gICAgICB9O1xuXG4gICAgICAvL3JldHVybiByZXMuanNvbihGaW5hbE1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgIH1cblxuICAgIHZhciBDb21tYW5kVmFsdWUgPSB0aGlzLmdldENvbW1hbmQoVXNlckNvbW1hbmQpO1xuXG4gICAgbG9nKFwiY29tbWFuZCB2YWwgOiBcIitDb21tYW5kVmFsdWUpO1xuXG4gICAgaWYgKENvbW1hbmRWYWx1ZSA9PT0gJycgfHwgQ29tbWFuZFZhbHVlID09PSBudWxsIHx8IHR5cGVvZiBDb21tYW5kVmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG5cbiAgICAvL2dldCByZXBvIGlkXG4gICAgdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgUmVwb05hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBSZXBvSWQgPSBDb21tYW5kQXJyWzJdO1xuICAgIC8vcmVwb19pZCA9IFJlcG9JZDtcblxuICAgIGxvZyhcInJlcG8gaWQgMSA6IFwiK3JlcG9faWQpO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9IFJlcG9JZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuICAgICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKlxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgLyp2YXIgQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICAgIHZhciBSZXBvSWQgPSBDb21tYW5kQXJyWzJdOyovc2VcblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiK1JlcG9JZCk7XG4gICAgICAgIC8vcmVxLnNlc3Npb24uUmVwb3NpdG9yeUlkID0gUmVwb0lkO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG4gICAgICAgIC8vcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgXG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgTWVzc2FnZTogJ1N1Y2Nlc3MnLFxuICAgICAgICAgIE9wdGlvbnM6IHtcbiAgICAgICAgICAgIFJlc3Bvc2l0b3J5SWQ6IFJlcG9JZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogUmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgICBcbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICB2YXIgVmFsaWRVcmxPYmplY3QgPSB0aGlzLnZhbGlkYXRlQ29tbWFuZHMoe1xuICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgIENvbW1hbmQ6IENvbW1hbmRWYWx1ZVxuICAgIH0pO1xuXG5cbiAgICBpZiAoVmFsaWRVcmxPYmplY3QuSXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIENvbW1hbmRzJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lLFxuICAgICAgICBHaXRPd25lck5hbWU6J3gwMDA2Njk0OSdcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3Qoe1xuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICBVVXJsOiBWYWxpZFVybE9iamVjdC5VcmwsXG4gICAgICAgIFVCb2R5OiBWYWxpZFVybE9iamVjdC5Cb2R5LFxuICAgICAgICBVTWV0aG9kOiBWYWxpZFVybE9iamVjdC5NZXRob2RcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIH0sXG5cbiAgLy90aGUgbWV0aG9kXG4gIGdldFBpcGVsaW5lSWQoUGlwZWxpbmVOYW1lKXtcbiAgICB2YXIgUGlwZWxpbmVJZDtcblxuICAgIHZhciBwaXBlbGluZUlkUmVxdWVzdCA9IHtcbiAgICAgIHVyaTogJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby9wMS9yZXBvc2l0b3JpZXMvJyArIHJlcG9faWQgKyAnL2JvYXJkJyxcblxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1BdXRoZW50aWNhdGlvbi1Ub2tlbic6IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTlxuICAgICAgfSxcblxuICAgICAganNvbjogdHJ1ZVxuICAgIH07XG4gICAgcmV0dXJuIHJwKHBpcGVsaW5lSWRSZXF1ZXN0KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuICAgICAgICBcbiAgICAgICAgbG9nKGRhdGEpXG4gICAgICAgIGZvciAodmFyIGkgPTA7IGk8ZGF0YVsncGlwZWxpbmVzJ10ubGVuZ3RoOyBpKyspe1xuICAgICAgICAgIGlmIChkYXRhWydwaXBlbGluZXMnXVtpXS5uYW1lID09PSBQaXBlbGluZU5hbWUpe1xuICAgICAgICAgICAgbG9nKFwiZm91bmQgcGlwZWxpbmUgaWQgOiBcIitkYXRhWydwaXBlbGluZXMnXVtpXS5pZCk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVsncGlwZWxpbmVzJ11baV0uaWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbG9nKFwiZGlkIG5vdCBmaW5kIGlkIGNvcnJlc3BvbmRpbmcgdG8gcGlwZSBuYW1lXCIpO1xuICAgICAgICAvL3JldHVybiBkYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgPSBcIitlcnIpXG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIFxuICAgICAgXG4gICAgICB9KSBcblxuICB9LFxuXG5cbiAgY2hlY2tWYWxpZElucHV0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFZhbGlkQml0ID0gZmFsc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5VQ29tbWFuZDtcbiAgICBjb25zb2xlLmxvZyhcInVzZXIgY29tbWFuZCA6IFwiK1VzZXJDb21tYW5kKTtcbiAgICBcbiAgICB2YXIgVmFsaWRDb21tYW5kcyA9IFsnQHNjcnVtYm90JywgJy9yZXBvJywgJy9pc3N1ZScsICcvZXBpYycsICcvYmxvY2tlZCddO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgVmFsaWRDb21tYWRSZWdleCA9IG5ldyBSZWdFeHAoL14oQHNjcnVtYm90KVxcc1tcXC9BLVphLXpdKi8pO1xuICAgIGNvbnNvbGUubG9nKFwicHJvY2Vzc2luZyBtZXNzYWdlIDogXCIrVXNlckNvbW1hbmQpO1xuXG5cbiAgICBpZiAoIVZhbGlkQ29tbWFkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpe1xuICAgICAgbG9nKFwiRXJyb3Igbm90IHN0YXJ0aW5nIHdpdGggQHNjcnVtYm90XCIpXG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgICBcblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG5cbiAgICAvL2lmIC9yZXBvIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCwgbm8gcmVwbyBpZCBwcm92aWRlZCBlbHNlIHRha2Ugd2hhdGV2ZXIgY29tZXMgYWZ0ZXIgQHNjcnVtYm90IGFzIHJlcG9faWRcbiAgICBpZiAoQ29tbWFuZEFyclsxXSA9PT0gVmFsaWRDb21tYW5kc1sxXSl7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDEpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgcmVwb19pZCA9IENvbW1hbmRBcnJbMV07XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDIpO1xuICAgIH1cbiAgICBcblxuXG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgbG9nKFwiRmluYWwgQ29tbWFuZCA6IFwiK0ZpbmFsQ29tbWFuZCk7XG5cbiAgICByZXR1cm4gVmFsaWRCaXQgPSB0cnVlO1xuICB9LFxuXG4gIGdldENvbW1hbmQ6IGZ1bmN0aW9uIChVQ29tbWFuZCkge1xuICAgIGxvZyhcImdldENvbW1hbmRcIik7XG4gICAgdmFyIFZhbGlkQml0ID0gJyc7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gVUNvbW1hbmQ7XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IHR5cGVvZiBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09ICcvcmVwbycpe1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzFdO1xuICAgICAgbG9nIChcImZpcnN0bHkgaW5pdGlhbGlzaWluZyByZXBvX2lkIGFzIFwiK3JlcG9faWQgK1wiIGZyb20gbWVzc2FnZSBhcmcgYXQgcG9zIDEgPSBcIitDb21tYW5kQXJyWzFdKTtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMik7XG4gICAgfVxuICAgIFxuICAgIGxvZyhcInJlcG8gaWQgMiA6IFwiK3JlcG9faWQpO1xuICAgIFxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIHJldHVybiBGaW5hbENvbW1hbmQ7XG4gIH0sXG5cbiAgdmFsaWRhdGVDb21tYW5kczogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIGxvZyhcInZhbGlkYXRlQ29tbWFuZHNcIik7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcblxuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuQ29tbWFuZDtcbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IGZhbHNlLFxuICAgICAgVXJsOiAnJyxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsXG4gICAgfTtcblxuICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSpcXHNbMC05XSovKTtcbiAgICB2YXIgSXNzdWVSZWdleCA9IG5ldyBSZWdFeHAoL15bXFwvaXNzdWVdKlxcc1swLTldKlxccygtdXxidWd8cGlwZWxpbmV8LXB8ZXZlbnRzfC1lKS8pO1xuICAgIHZhciBFcGljUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2VwaWNdKlxcc1tBLVphLXowLTldKi8pO1xuICAgIHZhciBCbG9ja2VkUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvYmxvY2tlZC8pO1xuXG5cbiAgICBpZiAoUmVwb1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0UmVwb1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycik7XG5cbiAgICB2YXIgUmVwb0lkID0gcmVwb19pZDtcbiAgICAvL3ZhciBSZXBvSWQgPSByZXEuc2Vzc2lvbi5SZXBvc2l0b3J5SWQ7XG5cbiAgICBpZiAoQmxvY2tlZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0QmxvY2tVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cbiAgICBpZiAoSXNzdWVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldElzc3VlVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG5cbiAgICBpZiAoRXBpY1JlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0RXBpY1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuXG4gICAgICBsb2coXCJVcmxPYmplY3QgPSBcIitVcmxPYmplY3QpO1xuICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgfSxcbiAgbWFrZVJlcXVlc3Q6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgbG9nKFwibWFrZVJlcXVlc3RcIik7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFRva2VuID0gcHJvY2Vzcy5lbnYuWkVOSFVCX1RPS0VOO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLnplbmh1Yi5pby8nO1xuXG4gICAgdmFyIFVzZXJVcmwgPSBvcHRpb25zLlVVcmw7XG4gICAgdmFyIFVybEJvZHkgPSBvcHRpb25zLlVCb2R5O1xuICAgIHZhciBVTWV0aG9kID0gb3B0aW9ucy5VTWV0aG9kO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICBtZXRob2Q6IFVNZXRob2QsXG4gICAgICB1cmk6IE1haW5VcmwgKyBVc2VyVXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgICAgICAsXG4gICAgICBib2R5OiB7XG4gICAgICAgIFVybEJvZHlcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgRGF0YSA9IHN1Y2Nlc3NkYXRhO1xuICAgICAgICBjb25zb2xlLmxvZygnRm9sbG93aW5nIERhdGEgPScgKyBKU09OLnN0cmluZ2lmeShEYXRhKSk7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShEYXRhKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgRXJyb3IgPSBlcnI7XG4gICAgICAgIC8vIEFQSSBjYWxsIGZhaWxlZC4uLlxuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgZm9sbG93aW5nIGVycm9yID0nICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgIH0pO1xuXG5cbiAgfSxcblxuXG4gIC8vIFRvIEdldCBSZXBvc2l0b3J5IElkXG4gIGdldFJlc3Bvc2l0b3J5SWQ6IGZ1bmN0aW9uIChPcHRpb25zKSB7XG4gICAgbG9nKFwiZ2V0UmVwb3NpdG9yeUlkXCIpO1xuICAgIHZhciByZXMgPSBPcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciByZXEgPSBPcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIFJlcG9zaXRvcnlOYW1lID0gT3B0aW9ucy5yZXBvTmFtZTtcbiAgICB2YXIgT3duZXJuYW1lID0gT3B0aW9ucy5HaXRPd25lck5hbWU7XG5cbiAgICB2YXIgUmVwb3NpdG9yeVVybCA9ICdyZXBvcy8nICsgT3duZXJuYW1lICsgJy8nICsgUmVwb3NpdG9yeU5hbWU7XG4gICAgdmFyIE1haW5VcmwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS8nO1xuXG4gICAgdmFyIFVybE9wdGlvbnMgPSB7XG4gICAgICB1cmk6IE1haW5VcmwgKyBSZXBvc2l0b3J5VXJsLFxuICAgICAgcXM6IHtcbiAgICAgICAgLy9hY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgfTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIC8vbG9nKFwidXNpbmcgcmVwb2lkOiBcIityZXBvX2lkKTtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuICAgICAgICBsb2coXCJSZXBvIElkIDJcIitSZXBvSWQpO1xuICAgICAgICByZXBvX2lkID0gUmVwb0lkO1xuICAgICAgICBjb25zb2xlLmxvZygnUmVwb3NpdG9yeSBJZCA9JyArIFJlcG9JZCk7XG4gICAgICAgIHJldHVybiBcIlRoZSBSZXBvc2l0b3J5IElkIGZvciBcIitSZXBvc2l0b3J5TmFtZStcIiBpcyBcIitKU09OLnN0cmluZ2lmeShzdWNjZXNzZGF0YS5pZCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgbG9nKFwiQVBJIGNhbGwgZmFpbGVkLi4uXCIpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlciBoYXMgJWQgcmVwb3MnLCBlcnIpO1xuICAgICAgfSk7XG5cbiAgfSxcblxuICAvLyBUbyBHZXQgUmVwbyBVcmxcbiAgZ2V0UmVwb1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyKSB7XG5cbiAgICBsb2coXCJnZXRSZXBvVXJsXCIpO1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIEdpdE93bmVyTmFtZSA9ICd4MDAwNjY5NDknO1xuICAgIHZhciBSZXBvc2l0b3J5SWQgPSAncmVwb3MvJyArIEdpdE93bmVyTmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICBVcmw6IFJlcG9zaXRvcnlJZCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IHRydWVcbiAgICB9O1xuXG4gICAgcmV0dXJuIFVybE9iamVjdDtcbiAgfSxcblxuICAvL1RvIEdldCBJc3N1ZSByZWxhdGVkIFVybFxuICBnZXRJc3N1ZVVybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRJc3N1ZVVybFwiKTtcbiAgICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgICAgVXJsOiAnJyxcbiAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICB9O1xuXG5cblxuXG4gICAgICAvL1RvIEdldCBTdGF0ZSBvZiBQaXBlbGluZVxuICAgICAgdmFyIFBpcGVsaW5lUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzcGlwZWxpbmUvKTtcblxuICAgICAgaWYgKFBpcGVsaW5lUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG5cbiAgICAgICAgbG9nKFwiaXNzdWUgTnVtIGluIGdldElTc3VlVXJsIDogXCIrSXNzdWVObyk7XG5cbiAgICAgICAgdmFyIFBpcGVMaW5ldXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IFBpcGVMaW5ldXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIC8vIE1vdmUgUGlwZWxpbmVcbiAgICAgIHZhciBQaXBlbGluZU1vdmVSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtcFxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoUGlwZWxpbmVNb3ZlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICAvL2lmIG1vdmluZyBwaXBlbGluZSwgM3JkIGFyZyBpcyBpc3N1ZSBudW0sICA0dGggPSAtcCwgNXRoID0gcGlwZWxpbmUsIDZ0IHBvc2l0aW9uXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICAgICAgdmFyIFBpcGVMaW5lSWQgPSB0aGlzLmdldFBpcGVsaW5lSWQoQ29tbWFuZEFyclszXSkudGhlbihmdW5jdGlvbiAoZGF0YSl7XG5cbiAgICAgICAgICBsb2coXCJQaXBlbGluZSBnb3QgKHVzaW5nIGRhdGEpOiBcIisgZGF0YSk7XG4gICAgICAgICAgXG4gICAgICAgICAgdmFyIFBvc05vID0gQ29tbWFuZEFycls0XTtcbiAgXG4gICAgICAgICAgdmFyIE1vdmVJc3N1ZVBpcGVMaW5lID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3Zlcyc7XG4gIFxuICAgICAgICAgIGxvZyhcImJ1aWxkaW5nIG1vdmUgcGlwZWxpbmUgdXJsLi5cIilcbiAgICAgICAgICB2YXIgTW92ZUJvZHkgPSB7XG4gICAgICAgICAgICBwaXBlbGluZV9pZDogZGF0YSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgICAgfTtcbiAgXG4gICAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBCb2R5OiBNb3ZlQm9keSxcbiAgICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBsb2coXCJ1cmwgYnVpbHQuXCIpO1xuICBcbiAgICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gICAgICAgIH0pOyAvL3RoaXMgaXMgd2hlcmUgaSB0cnkgdG8gY2FsbCB0aGUgbWV0aG9kIHRoYXQgZ2V0cyB0aGUgcGlwZWxpbmUgaWQgZnJvbSBuYW1lXG5cbiAgICAgICAgXG4gICAgICB9XG5cblxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlXG4gICAgICB2YXIgRXZlbnRzUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzZXZlbnRzLyk7XG5cbiAgICAgIGlmIChFdmVudHNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcblxuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG5cbiAgICAgIC8vIEdldCB0aGUgZXN0aW1hdGUgZm9yIHRoZSBpc3N1ZS5cbiAgICAgIHZhciBFc3RpbWF0ZUFkZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy1lXFxzWzAtOV0qLyk7XG5cbiAgICAgIGlmIChFc3RpbWF0ZUFkZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgICAgICB2YXIgUGlwZUxpbmVJZCA9IENvbW1hbmRBcnJbM107XG4gICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNF07XG5cbiAgICAgICAgdmFyIE1vdmVJc3N1ZVBpcGVMaW5lID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3Zlcyc7XG5cbiAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIHBpcGVsaW5lX2lkOiBQaXBlTGluZUlkLFxuICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcblxuICAgICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXJcbiAgICAgIHZhciBVc2VyUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzLXVcXHNbQS1aYS16MC05XSovKTtcblxuICAgICAgaWYgKFVzZXJSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBVc2VyVXJsID0gJyc7XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogVXNlclVybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gICAgfVxuXG4gICAgLFxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0QmxvY2tVcmxcIik7XG5cbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgQmxvY2t1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgVXJsOiBCbG9ja3VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgQmxvY2tlZCBJc3N1ZXMgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0RXBpY1VybFwiKTtcblxuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuICAgIHZhciBFcGljVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvZXBpY3MnO1xuXG4gICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgIFVybDogRXBpY1VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH1cblxufTtcbiJdfQ==