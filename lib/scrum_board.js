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
    var RepoId = repo_id;
    //repo_id = RepoId;

    log("repo id 1 : " + repo_id);

    var RepositoryId = repo_id;

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
    var UrlType = options.UType;

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

    return rp(UrlOptions).then(function (successdata) {
      var Data = successdata;
      //var message
      console.log('Following Data =' + JSON.stringify(Data));

      //Parse JSON according to obj returned
      if (UrlType === 'IssueEvents') {
        //var EventUser = successdata.userid;
        //var EventType = successdata.type;
        log("Events for issue");

        for (var i = 0; i < successdata.length; i++) {

          if (successdata[i].type === 'transferIssue') {
            log("pipeline move event" + successdata[i].userid + JSON.stringify(successdata[i].frompipeline) + successdata[i].topipeline);
            Data = "User " + successdata[i].userid + " moved issue from " + successdata[i].frompipeline.name + " to " + successdata[i].topipeline.name;
          }
          if (successdata[i].type === 'estimateIssue') {
            log("estimate change event");
            Data = "User " + successdata[i].userid + " changed estimate on issue to  " + successdata[i].to_estimate.value + "on date : " + successdata[i].createdat;
          } else {
            log("do not recogise event type");
          }
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
          IsGit: false,
          UrlType: 'IssueToPipelines'
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
        IsGit: false,
        UrlType: 'IssueEvents'
      };

      return UrlObject;
    }

    // Set the estimate for the issue.
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
        IsGit: false,
        UrlType: 'IssueEstimate'
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJsb2ciLCJyZXBvX2lkIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGxNZSIsIm9wdGlvbnMiLCJyZXEiLCJyZXF1ZXN0IiwicmVzIiwicmVzcG9uc2UiLCJ0ZXN0IiwiRmluYWxEYXRhIiwiZ2V0U2NydW1EYXRhIiwiVXNlckNvbW1hbmQiLCJVc2VySW5wdXQiLCJGaW5hbE1lc3NhZ2UiLCJDaGVja0lmVmFsaWRDb21tYW5kIiwiY2hlY2tWYWxpZElucHV0IiwiVUNvbW1hbmQiLCJUeXBlIiwiTWVzc2FnZSIsIkNvbW1hbmRWYWx1ZSIsImdldENvbW1hbmQiLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsInNlIiwiT3B0aW9ucyIsIlJlc3Bvc2l0b3J5SWQiLCJnZXRSZXNwb3NpdG9yeUlkIiwicmVwb05hbWUiLCJHaXRPd25lck5hbWUiLCJWYWxpZFVybE9iamVjdCIsInZhbGlkYXRlQ29tbWFuZHMiLCJDb21tYW5kIiwiSXNWYWxpZCIsIklzR2l0IiwiVUNvbW1hbmRBcnIiLCJHaXRSZXBvTmFtZSIsIm1ha2VSZXF1ZXN0IiwiVVVybCIsIlVybCIsIlVCb2R5IiwiQm9keSIsIlVNZXRob2QiLCJNZXRob2QiLCJVVHlwZSIsIlVybFR5cGUiLCJnZXRQaXBlbGluZUlkIiwiUGlwZWxpbmVOYW1lIiwiUGlwZWxpbmVJZCIsInBpcGVsaW5lSWRSZXF1ZXN0IiwidXJpIiwiaGVhZGVycyIsInByb2Nlc3MiLCJlbnYiLCJaRU5IVUJfVE9LRU4iLCJqc29uIiwidGhlbiIsImRhdGEiLCJpIiwibGVuZ3RoIiwibmFtZSIsImlkIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwiVmFsaWRCaXQiLCJWYWxpZENvbW1hbmRzIiwiVmFsaWRDb21tYWRSZWdleCIsIk9yaWdpbmFsc0NvbW1hbmRBcnIiLCJzcGxpY2UiLCJGaW5hbENvbW1hbmQiLCJqb2luIiwiVXJsT2JqZWN0IiwiSXNzdWVSZWdleCIsIkVwaWNSZWdleCIsIkJsb2NrZWRSZWdleCIsImdldFJlcG9VcmwiLCJnZXRCbG9ja1VybCIsImdldElzc3VlVXJsIiwiZ2V0RXBpY1VybCIsIlRva2VuIiwiTWFpblVybCIsIlVzZXJVcmwiLCJVcmxCb2R5IiwiVXJsT3B0aW9ucyIsIm1ldGhvZCIsInFzIiwiYWNjZXNzX3Rva2VuIiwiYm9keSIsInN1Y2Nlc3NkYXRhIiwiRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0eXBlIiwidXNlcmlkIiwiZnJvbXBpcGVsaW5lIiwidG9waXBlbGluZSIsInRvX2VzdGltYXRlIiwidmFsdWUiLCJjcmVhdGVkYXQiLCJFcnJvciIsIlJlcG9zaXRvcnlOYW1lIiwiT3duZXJuYW1lIiwiUmVwb3NpdG9yeVVybCIsIlJlc3Bvc2l0cm95SWQiLCJQaXBlbGluZVJlZ2V4IiwiSXNzdWVObyIsIlBpcGVMaW5ldXJsIiwiUGlwZWxpbmVNb3ZlUmVnZXgiLCJQaXBlTGluZUlkIiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkJ1Z1JlZ2V4IiwiQnVnVXJsIiwiVXNlclJlZ2V4IiwiQmxvY2t1cmwiLCJFcGljVXJsIl0sIm1hcHBpbmdzIjoiOztBQUtBOzs7Ozs7QUFMQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLEtBQUtELFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlFLFFBQVFGLFFBQVEsT0FBUixDQUFaOztBQUVBOztBQUVBLElBQU1HLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjs7QUFFQSxJQUFJQyxPQUFKOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCOztBQUdmQyxVQUFRLHdDQUFVQyxPQUFWLEVBQW1CO0FBQ3pC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RixZQUFNLElBSFE7QUFJZFAsYUFBTyxLQUpPO0FBS2RXLGVBQVE7QUFMTSxLQUFoQjs7QUFRQSxXQUFPMkIsU0FBUDtBQUNEOztBQS9vQmMsQ0FBakIiLCJmaWxlIjoic2NydW1fYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG52YXIgcmVwb19pZDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblxuICBjYWxsTWU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICB2YXIgcmVzID0gb3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgdGVzdCA9IG9wdGlvbnMudGVzdDtcblxuICAgIHZhciBGaW5hbERhdGEgPSB7XG4gICAgICBcIlVzZXJJZFwiOiBcIk1hcFwiLFxuICAgICAgXCJDaGVja1wiOiB0ZXN0XG4gICAgfTtcblxuICAgIHJldHVybiBGaW5hbERhdGE7XG4gIH0sXG5cbiAgZ2V0U2NydW1EYXRhKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVXNlcklucHV0O1xuXG4gICAgIHZhciBGaW5hbE1lc3NhZ2U9bnVsbDtcbiAgICAvLyAgIE1lc3NhZ2UgOiBudWxsLFxuICAgIC8vICAgT3B0aW9ucyA6IG51bGxcbiAgICAvLyB9O1xuXG4gICAgdmFyIENoZWNrSWZWYWxpZENvbW1hbmQgPSB0aGlzLmNoZWNrVmFsaWRJbnB1dCh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgVUNvbW1hbmQ6IFVzZXJDb21tYW5kXG4gICAgfSk7XG5cbiAgICBpZiAoIUNoZWNrSWZWYWxpZENvbW1hbmQpIHtcbiAgICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBJbnB1dCdcbiAgICAgIH07XG5cbiAgICAgIC8vcmV0dXJuIHJlcy5qc29uKEZpbmFsTWVzc2FnZSk7XG4gICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRWYWx1ZSA9IHRoaXMuZ2V0Q29tbWFuZChVc2VyQ29tbWFuZCk7XG5cbiAgICBsb2coXCJjb21tYW5kIHZhbCA6IFwiK0NvbW1hbmRWYWx1ZSk7XG5cbiAgICBpZiAoQ29tbWFuZFZhbHVlID09PSAnJyB8fCBDb21tYW5kVmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIENvbW1hbmRWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIC8vZ2V0IHJlcG8gaWRcbiAgICB2YXIgQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgIHZhciBSZXBvTmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG4gICAgLy9yZXBvX2lkID0gUmVwb0lkO1xuXG4gICAgbG9nKFwicmVwbyBpZCAxIDogXCIrcmVwb19pZCk7XG5cbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gcmVwb19pZDtcblxuICAgIGlmIChSZXBvc2l0b3J5SWQgPT09IG51bGwgfHwgUmVwb3NpdG9yeUlkID09PSAnJyB8fCB0eXBlb2YgUmVwb3NpdG9yeUlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgbG9nKFwidHJ5aW5nIHRvIGdldCByZXBvIGlkXCIpO1xuICAgICAgdmFyIFJlcG9SZWdleCA9IG5ldyBSZWdFeHAoL15cXC9yZXBvKlxcc1tBLVphLXowLTldKlxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoIVJlcG9SZWdleC50ZXN0KENvbW1hbmRWYWx1ZSkpIHtcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICAgIE1lc3NhZ2U6ICdSZXBvc2l0b3J5IElkIE5vdCBTcGVjaWZpZWQnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgLyp2YXIgQ29tbWFuZEFyciA9IENvbW1hbmRWYWx1ZS5zcGxpdCgnICcpO1xuICAgICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICAgIHZhciBSZXBvSWQgPSBDb21tYW5kQXJyWzJdOyovc2VcblxuICAgICAgaWYgKHR5cGVvZiBSZXBvSWQgIT09ICd1bmRlZmluZWQnICYmIFJlcG9JZCAhPT0gJycgJiYgUmVwb0lkICE9PSBudWxsKSB7XG4gICAgICAgIGxvZyhcInJlcG8gZm91bmQgaWQ6IFwiK1JlcG9JZCk7XG4gICAgICAgIC8vcmVxLnNlc3Npb24uUmVwb3NpdG9yeUlkID0gUmVwb0lkO1xuXG4gICAgICAgIFJlcG9JZCA9IHJlcG9faWQ7XG4gICAgICAgIC8vcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgXG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgTWVzc2FnZTogJ1N1Y2Nlc3MnLFxuICAgICAgICAgIE9wdGlvbnM6IHtcbiAgICAgICAgICAgIFJlc3Bvc2l0b3J5SWQ6IFJlcG9JZFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZpbmFsTWVzc2FnZS5NZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogUmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgICBcbiAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBsb2coXCJnZXQgdXJsXCIpO1xuICAgIHZhciBWYWxpZFVybE9iamVjdCA9IHRoaXMudmFsaWRhdGVDb21tYW5kcyh7XG4gICAgICByZXF1ZXN0OiByZXEsXG4gICAgICByZXNwb25zZTogcmVzLFxuICAgICAgQ29tbWFuZDogQ29tbWFuZFZhbHVlXG4gICAgfSk7XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgbG9nKFwidXJsIGlzIG5vdCB2YWxpZFwiKTtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIENvbW1hbmRzJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2UuTWVzc2FnZTtcbiAgICB9XG5cblxuICAgIGxvZyhcInVybCBpcyB2YWxpZFwiKVxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgbG9nKFwiaXMgR2l0IC4uXCIpXG4gICAgICB2YXIgVUNvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBHaXRSZXBvTmFtZSA9IFVDb21tYW5kQXJyWzFdO1xuXG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNwb3NpdG9yeUlkKHtcbiAgICAgICAgcmVxdWVzdDogcmVxLFxuICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICByZXBvTmFtZTogR2l0UmVwb05hbWUsXG4gICAgICAgIEdpdE93bmVyTmFtZToneDAwMDY2OTQ5J1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBsb2cgKFwibm90IGdpdFwiKTtcbiAgICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgVVVybDogVmFsaWRVcmxPYmplY3QuVXJsLFxuICAgICAgICBVQm9keTogVmFsaWRVcmxPYmplY3QuQm9keSxcbiAgICAgICAgVU1ldGhvZDogVmFsaWRVcmxPYmplY3QuTWV0aG9kLFxuICAgICAgICBVVHlwZTpWYWxpZFVybE9iamVjdC5VcmxUeXBlXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG4gIC8vdGhlIG1ldGhvZFxuICBnZXRQaXBlbGluZUlkKFBpcGVsaW5lTmFtZSl7XG4gICAgdmFyIFBpcGVsaW5lSWQ7XG5cbiAgICB2YXIgcGlwZWxpbmVJZFJlcXVlc3QgPSB7XG4gICAgICB1cmk6ICdodHRwczovL2FwaS56ZW5odWIuaW8vcDEvcmVwb3NpdG9yaWVzLycgKyByZXBvX2lkICsgJy9ib2FyZCcsXG5cbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtQXV0aGVudGljYXRpb24tVG9rZW4nOiBwcm9jZXNzLmVudi5aRU5IVUJfVE9LRU5cbiAgICAgIH0sXG5cbiAgICAgIGpzb246IHRydWVcbiAgICB9O1xuICAgIHJldHVybiBycChwaXBlbGluZUlkUmVxdWVzdClcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKXtcbiAgICAgICAgXG4gICAgICAgIGxvZyhkYXRhKVxuICAgICAgICBmb3IgKHZhciBpID0wOyBpPGRhdGFbJ3BpcGVsaW5lcyddLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICBpZiAoZGF0YVsncGlwZWxpbmVzJ11baV0ubmFtZSA9PT0gUGlwZWxpbmVOYW1lKXtcbiAgICAgICAgICAgIGxvZyhcImZvdW5kIHBpcGVsaW5lIGlkIDogXCIrZGF0YVsncGlwZWxpbmVzJ11baV0uaWQpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFbJ3BpcGVsaW5lcyddW2ldLmlkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZyhcImRpZCBub3QgZmluZCBpZCBjb3JyZXNwb25kaW5nIHRvIHBpcGUgbmFtZVwiKTtcbiAgICAgICAgLy9yZXR1cm4gZGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yID0gXCIrZXJyKVxuICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICBcbiAgICAgIFxuICAgICAgfSkgXG5cbiAgfSxcblxuXG4gIGNoZWNrVmFsaWRJbnB1dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBWYWxpZEJpdCA9IGZhbHNlO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IG9wdGlvbnMuVUNvbW1hbmQ7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyIGNvbW1hbmQgOiBcIitVc2VyQ29tbWFuZCk7XG4gICAgXG4gICAgdmFyIFZhbGlkQ29tbWFuZHMgPSBbJ0BzY3J1bWJvdCcsICcvcmVwbycsICcvaXNzdWUnLCAnL2VwaWMnLCAnL2Jsb2NrZWQnXTtcblxuICAgIGlmIChVc2VyQ29tbWFuZCA9PT0gbnVsbCB8fCBVc2VyQ29tbWFuZCA9PT0gJycgfHwgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIFZhbGlkQ29tbWFkUmVnZXggPSBuZXcgUmVnRXhwKC9eKEBzY3J1bWJvdClcXHNbXFwvQS1aYS16XSovKTtcbiAgICBjb25zb2xlLmxvZyhcInByb2Nlc3NpbmcgbWVzc2FnZSA6IFwiK1VzZXJDb21tYW5kKTtcblxuXG4gICAgaWYgKCFWYWxpZENvbW1hZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKXtcbiAgICAgIGxvZyhcIkVycm9yIG5vdCBzdGFydGluZyB3aXRoIEBzY3J1bWJvdFwiKVxuICAgICAgcmV0dXJuIFZhbGlkQml0O1xuICAgIH1cblxuICAgICAgXG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuXG4gICAgLy9pZiAvcmVwbyBjb21lcyBhZnRlciBAc2NydW1ib3QsIG5vIHJlcG8gaWQgcHJvdmlkZWQgZWxzZSB0YWtlIHdoYXRldmVyIGNvbWVzIGFmdGVyIEBzY3J1bWJvdCBhcyByZXBvX2lkXG4gICAgaWYgKENvbW1hbmRBcnJbMV0gPT09IFZhbGlkQ29tbWFuZHNbMV0pe1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHJlcG9faWQgPSBDb21tYW5kQXJyWzFdO1xuICAgICAgQ29tbWFuZEFyci5zcGxpY2UoMCwyKTtcbiAgICB9XG4gICAgXG5cblxuICAgIHZhciBGaW5hbENvbW1hbmQgPSBDb21tYW5kQXJyLmpvaW4oJyAnKTtcblxuICAgIGxvZyhcIkZpbmFsIENvbW1hbmQgOiBcIitGaW5hbENvbW1hbmQpO1xuXG4gICAgcmV0dXJuIFZhbGlkQml0ID0gdHJ1ZTtcbiAgfSxcblxuICBnZXRDb21tYW5kOiBmdW5jdGlvbiAoVUNvbW1hbmQpIHtcbiAgICBsb2coXCJnZXRDb21tYW5kXCIpO1xuICAgIHZhciBWYWxpZEJpdCA9ICcnO1xuICAgIHZhciBVc2VyQ29tbWFuZCA9IFVDb21tYW5kO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCB0eXBlb2YgVXNlckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBPcmlnaW5hbHNDb21tYW5kQXJyID0gQ29tbWFuZEFycjtcblxuICAgIGlmIChDb21tYW5kQXJyWzFdID09PSAnL3JlcG8nKXtcbiAgICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICByZXBvX2lkID0gQ29tbWFuZEFyclsxXTtcbiAgICAgIGxvZyAoXCJmaXJzdGx5IGluaXRpYWxpc2lpbmcgcmVwb19pZCBhcyBcIityZXBvX2lkICtcIiBmcm9tIG1lc3NhZ2UgYXJnIGF0IHBvcyAxID0gXCIrQ29tbWFuZEFyclsxXSk7XG4gICAgICBDb21tYW5kQXJyLnNwbGljZSgwLDIpO1xuICAgIH1cbiAgICBcbiAgICBsb2coXCJyZXBvIGlkIDIgOiBcIityZXBvX2lkKTtcbiAgICBcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICByZXR1cm4gRmluYWxDb21tYW5kO1xuICB9LFxuXG4gIHZhbGlkYXRlQ29tbWFuZHM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICBsb2coXCJ2YWxpZGF0ZUNvbW1hbmRzXCIpO1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG5cbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLkNvbW1hbmQ7XG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qXFxzWzAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuXG4gICAgaWYgKFJlcG9SZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldFJlcG9VcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpO1xuXG4gICAgdmFyIFJlcG9JZCA9IHJlcG9faWQ7XG4gICAgLy92YXIgUmVwb0lkID0gcmVxLnNlc3Npb24uUmVwb3NpdG9yeUlkO1xuXG4gICAgaWYgKEJsb2NrZWRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEJsb2NrVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG4gICAgaWYgKElzc3VlUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRJc3N1ZVVybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuXG4gICAgaWYgKEVwaWNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldEVwaWNVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cblxuICAgICAgbG9nKFwiVXJsT2JqZWN0ID0gXCIrVXJsT2JqZWN0KTtcbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGxvZyhcIm1ha2VSZXF1ZXN0XCIpO1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBUb2tlbiA9IHByb2Nlc3MuZW52LlpFTkhVQl9UT0tFTjtcbiAgICB2YXIgTWFpblVybCA9ICdodHRwczovL2FwaS56ZW5odWIuaW8vJztcblxuICAgIHZhciBVc2VyVXJsID0gb3B0aW9ucy5VVXJsO1xuICAgIHZhciBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keTtcbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcbiAgICB2YXIgVXJsVHlwZSA9IG9wdGlvbnMuVVR5cGU7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogVU1ldGhvZCxcbiAgICAgIHVyaTogTWFpblVybCArIFVzZXJVcmwsXG4gICAgICBxczoge1xuICAgICAgICBhY2Nlc3NfdG9rZW46IFRva2VuIC8vIC0+IHVyaSArICc/YWNjZXNzX3Rva2VuPXh4eHh4JTIweHh4eHgnXG4gICAgICB9LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdSZXF1ZXN0LVByb21pc2UnXG4gICAgICB9LFxuICAgICAganNvbjogdHJ1ZSAvLyBBdXRvbWF0aWNhbGx5IHBhcnNlcyB0aGUgSlNPTiBzdHJpbmcgaW4gdGhlIHJlc3BvbnNlXG4gICAgICAgICxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgVXJsQm9keVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICB2YXIgRGF0YSA9IHN1Y2Nlc3NkYXRhO1xuICAgICAgICAvL3ZhciBtZXNzYWdlXG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcblxuICAgICAgICAvL1BhcnNlIEpTT04gYWNjb3JkaW5nIHRvIG9iaiByZXR1cm5lZFxuICAgICAgICBpZihVcmxUeXBlID09PSAnSXNzdWVFdmVudHMnKXtcbiAgICAgICAgICAvL3ZhciBFdmVudFVzZXIgPSBzdWNjZXNzZGF0YS51c2VyaWQ7XG4gICAgICAgICAgLy92YXIgRXZlbnRUeXBlID0gc3VjY2Vzc2RhdGEudHlwZTtcbiAgICAgICAgICBsb2coXCJFdmVudHMgZm9yIGlzc3VlXCIpO1xuXG4gICAgICAgICAgZm9yICh2YXIgaSA9MDsgaTxzdWNjZXNzZGF0YS5sZW5ndGg7IGkrKyl7XG5cbiAgICAgICAgICAgIGlmKHN1Y2Nlc3NkYXRhW2ldLnR5cGUgPT09ICd0cmFuc2Zlcklzc3VlJyl7XG4gICAgICAgICAgICAgIGxvZyhcInBpcGVsaW5lIG1vdmUgZXZlbnRcIitzdWNjZXNzZGF0YVtpXS51c2VyaWQrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGFbaV0uZnJvbXBpcGVsaW5lKStzdWNjZXNzZGF0YVtpXS50b3BpcGVsaW5lKTtcbiAgICAgICAgICAgICAgRGF0YSA9IFwiVXNlciBcIiArc3VjY2Vzc2RhdGFbaV0udXNlcmlkKyBcIiBtb3ZlZCBpc3N1ZSBmcm9tIFwiK3N1Y2Nlc3NkYXRhW2ldLmZyb21waXBlbGluZS5uYW1lK1wiIHRvIFwiK3N1Y2Nlc3NkYXRhW2ldLnRvcGlwZWxpbmUubmFtZTtcbiAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihzdWNjZXNzZGF0YVtpXS50eXBlID09PSAnZXN0aW1hdGVJc3N1ZScpe1xuICAgICAgICAgICAgICBsb2coXCJlc3RpbWF0ZSBjaGFuZ2UgZXZlbnRcIik7XG4gICAgICAgICAgICAgIERhdGEgPSBcIlVzZXIgXCIgK3N1Y2Nlc3NkYXRhW2ldLnVzZXJpZCsgXCIgY2hhbmdlZCBlc3RpbWF0ZSBvbiBpc3N1ZSB0byAgXCIrc3VjY2Vzc2RhdGFbaV0udG9fZXN0aW1hdGUudmFsdWUrXCJvbiBkYXRlIDogXCIrc3VjY2Vzc2RhdGFbaV0uY3JlYXRlZGF0O1xuICBcbiAgICAgICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgICAgbG9nKFwiZG8gbm90IHJlY29naXNlIGV2ZW50IHR5cGVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBcblxuICAgICAgICAgIFxuICAgICAgICB9XG5cblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRGF0YSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIEVycm9yID0gZXJyO1xuICAgICAgICAvLyBBUEkgY2FsbCBmYWlsZWQuLi5cbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzIGZvbGxvd2luZyBlcnJvciA9JyArIGVycik7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgICB9KTtcblxuXG4gIH0sXG5cblxuICAvLyBUbyBHZXQgUmVwb3NpdG9yeSBJZFxuICBnZXRSZXNwb3NpdG9yeUlkOiBmdW5jdGlvbiAoT3B0aW9ucykge1xuICAgIGxvZyhcImdldFJlcG9zaXRvcnlJZFwiKTtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IE9wdGlvbnMuR2l0T3duZXJOYW1lO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vJztcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgdXJpOiBNYWluVXJsICsgUmVwb3NpdG9yeVVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIC8vYWNjZXNzX3Rva2VuOiBUb2tlbiAvLyAtPiB1cmkgKyAnP2FjY2Vzc190b2tlbj14eHh4eCUyMHh4eHh4J1xuICAgICAgfSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnUmVxdWVzdC1Qcm9taXNlJ1xuICAgICAgfSxcbiAgICAgIGpzb246IHRydWUgLy8gQXV0b21hdGljYWxseSBwYXJzZXMgdGhlIEpTT04gc3RyaW5nIGluIHRoZSByZXNwb25zZVxuICAgIH07XG5cbiAgICByZXR1cm4gcnAoVXJsT3B0aW9ucylcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChzdWNjZXNzZGF0YSkge1xuICAgICAgICAvL2xvZyhcInVzaW5nIHJlcG9pZDogXCIrcmVwb19pZCk7XG4gICAgICAgIHZhciBSZXBvSWQgPSBzdWNjZXNzZGF0YS5pZDtcbiAgICAgICAgbG9nKFwiUmVwbyBJZCAyXCIrUmVwb0lkKTtcbiAgICAgICAgcmVwb19pZCA9IFJlcG9JZDtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlcG9zaXRvcnkgSWQgPScgKyBSZXBvSWQpO1xuICAgICAgICByZXR1cm4gXCJUaGUgUmVwb3NpdG9yeSBJZCBmb3IgXCIrUmVwb3NpdG9yeU5hbWUrXCIgaXMgXCIrSlNPTi5zdHJpbmdpZnkoc3VjY2Vzc2RhdGEuaWQpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGxvZyhcIkFQSSBjYWxsIGZhaWxlZC4uLlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZXIgaGFzICVkIHJlcG9zJywgZXJyKTtcbiAgICAgIH0pO1xuXG4gIH0sXG5cbiAgLy8gVG8gR2V0IFJlcG8gVXJsXG4gIGdldFJlcG9Vcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFycikge1xuXG4gICAgbG9nKFwiZ2V0UmVwb1VybFwiKTtcbiAgICB2YXIgUmVwb3NpdG9yeU5hbWUgPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBHaXRPd25lck5hbWUgPSAneDAwMDY2OTQ5JztcbiAgICB2YXIgUmVwb3NpdG9yeUlkID0gJ3JlcG9zLycgKyBHaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgbG9nKFwiZ2V0SXNzdWVVcmxcIik7XG4gICAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICAgIFVybDogJycsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgfTtcblxuXG5cblxuICAgICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuXG4gICAgICAgIGxvZyhcImlzc3VlIE51bSBpbiBnZXRJU3N1ZVVybCA6IFwiK0lzc3VlTm8pO1xuXG4gICAgICAgIHZhciBQaXBlTGluZXVybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBQaXBlTGluZXVybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvLyBNb3ZlIFBpcGVsaW5lXG4gICAgICB2YXIgUGlwZWxpbmVNb3ZlUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzLXBcXHNbQS1aYS16MC05XSovKTtcblxuICAgICAgaWYgKFBpcGVsaW5lTW92ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgLy9pZiBtb3ZpbmcgcGlwZWxpbmUsIDNyZCBhcmcgaXMgaXNzdWUgbnVtLCAgNHRoID0gLXAsIDV0aCA9IHBpcGVsaW5lLCA2dCBwb3NpdGlvblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG4gICAgICAgIHZhciBQaXBlTGluZUlkID0gdGhpcy5nZXRQaXBlbGluZUlkKENvbW1hbmRBcnJbM10pLnRoZW4oZnVuY3Rpb24gKGRhdGEpe1xuXG4gICAgICAgICAgbG9nKFwiUGlwZWxpbmUgZ290ICh1c2luZyBkYXRhKTogXCIrIGRhdGEpO1xuICAgICAgICAgIFxuICAgICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNF07XG4gIFxuICAgICAgICAgIHZhciBNb3ZlSXNzdWVQaXBlTGluZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnO1xuICBcbiAgICAgICAgICBsb2coXCJidWlsZGluZyBtb3ZlIHBpcGVsaW5lIHVybC4uXCIpXG4gICAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgICAgcGlwZWxpbmVfaWQ6IGRhdGEsXG4gICAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICAgIH07XG4gIFxuICAgICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgICAgVXJsOiBNb3ZlSXNzdWVQaXBlTGluZSxcbiAgICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgICBVcmxUeXBlOidJc3N1ZVRvUGlwZWxpbmVzJ1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBsb2coXCJ1cmwgYnVpbHQuXCIpO1xuICBcbiAgICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gICAgICAgIH0pOyAvL3RoaXMgaXMgd2hlcmUgaSB0cnkgdG8gY2FsbCB0aGUgbWV0aG9kIHRoYXQgZ2V0cyB0aGUgcGlwZWxpbmUgaWQgZnJvbSBuYW1lXG5cbiAgICAgICAgXG4gICAgICB9XG5cblxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlXG4gICAgICB2YXIgRXZlbnRzUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzZXZlbnRzLyk7XG5cbiAgICAgIGlmIChFdmVudHNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcblxuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlLFxuICAgICAgICAgIFVybFR5cGU6J0lzc3VlRXZlbnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuXG4gICAgICAvLyBTZXQgdGhlIGVzdGltYXRlIGZvciB0aGUgaXNzdWUuXG4gICAgICB2YXIgRXN0aW1hdGVBZGRSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtZVxcc1swLTldKi8pO1xuXG4gICAgICBpZiAoRXN0aW1hdGVBZGRSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICAgICAgdmFyIFBpcGVMaW5lSWQgPSBDb21tYW5kQXJyWzNdO1xuICAgICAgICB2YXIgUG9zTm8gPSBDb21tYW5kQXJyWzRdO1xuXG4gICAgICAgIHZhciBNb3ZlSXNzdWVQaXBlTGluZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBwaXBlbGluZV9pZDogUGlwZUxpbmVJZCxcbiAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidJc3N1ZUVzdGltYXRlJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuXG4gICAgICAvLyBHZXQgQnVncyBieSB0aGUgdXNlclxuICAgICAgdmFyIEJ1Z1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc2J1Zy8pO1xuXG4gICAgICBpZiAoQnVnUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpIHtcblxuICAgICAgICB2YXIgSXNzdWVObyA9IENvbW1hbmRBcnJbMV07XG5cbiAgICAgICAgdmFyIEJ1Z1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBCdWdVcmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgICAgICBVcmxUeXBlOidCdWdJc3N1ZXMnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXIsIHVzZXJJc3N1ZVxuICAgICAgdmFyIFVzZXJSZWdleCA9IG5ldyBSZWdFeHAoL15cXC9pc3N1ZSpcXHNbMC05XSpcXHMtdVxcc1tBLVphLXowLTldKi8pO1xuXG4gICAgICBpZiAoVXNlclJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIFVzZXJVcmwgPSAnJztcblxuICAgICAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgICAgIElzVmFsaWQ6IHRydWUsXG4gICAgICAgICAgVXJsOiBVc2VyVXJsLFxuICAgICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgQm9keTogbnVsbCxcbiAgICAgICAgICBJc0dpdDogZmFsc2UsXG4gICAgICAgICAgVXJsVHlwZTonVXNlcklzc3VlcydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gVXJsT2JqZWN0O1xuICAgICAgfVxuXG5cbiAgICAgIHJldHVybiBVcmxPYmplY3Q7XG5cbiAgICB9XG5cbiAgICAsXG4gIC8vVG8gR2V0IEJsb2NrZWQgSXNzdWVzIFVybFxuICBnZXRCbG9ja1VybDogZnVuY3Rpb24gKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpIHtcbiAgICBsb2coXCJnZXRCbG9ja1VybFwiKTtcblxuICAgIHZhciBSZXNwb3NpdHJveUlkID0gUmVwb0lkO1xuXG4gICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgIHZhciBCbG9ja3VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEJsb2NrdXJsLFxuICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgIEJvZHk6IG51bGwsXG4gICAgICBJc0dpdDogZmFsc2UsXG4gICAgICBVcmxUeXBlOidCbG9ja2VkSXNzdWVzJ1xuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9LFxuXG4gIC8vVG8gR2V0IGVwaWNzIFVybFxuICBnZXRFcGljVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCkge1xuICAgIGxvZyhcImdldEVwaWNVcmxcIik7XG5cbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZSxcbiAgICAgIFVybFR5cGU6J0VwaWNJc3N1ZXMnXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH1cblxufTtcbiJdfQ==