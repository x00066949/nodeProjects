/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');

// Setup debug log

var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-scrumbot');

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
      return FinalMessage;
    }

    var CommandValue = this.getCommand(UserCommand);

    log("command val : " + CommandValue);

    if (CommandValue === '' || CommandValue === null || typeof CommandValue === 'undefined') {
      FinalMessage = {
        Type: 'Error',
        Message: 'Invalid Input'
      };
      return res.json(FinalMessage);
    }

    //get repo id
    var CommandArr = CommandValue.split(' ');
    var RepoName = CommandArr[1];
    var RepoId = CommandArr[2];

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
      var RepoId = CommandArr[2];*/

      if (typeof RepoId !== 'undefined' && RepoId !== '' && RepoId !== null) {
        log("repo id valid. id: " + RepoId);
        req.session.RepositoryId = RepoId;
        FinalMessage = {
          Message: 'Success',
          Options: {
            RespositoryId: RepoId
          }
        };
        return res.json(FinalMessage);
      }

      return this.getRespositoryId({
        request: req,
        response: res,
        repoName: RepoName
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
      return res.json(FinalMessage);
    }

    if (ValidUrlObject.IsGit) {
      var UCommandArr = CommandValue.split(' ');
      var GitRepoName = UCommandArr[1];

      return this.getRespositoryId({
        request: req,
        response: res,
        repoName: GitRepoName
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
    CommandArr.splice(0, 1);
    var FinalCommand = CommandArr.join(' ');

    log("Final Command : " + FinalCommand);

    return ValidBit = true;
  },

  getCommand: function /*istanbul ignore next*/getCommand(UCommand) {
    var ValidBit = '';
    var UserCommand = UCommand;

    if (UserCommand === null || UserCommand === '' || typeof UserCommand === 'undefined') {
      return ValidBit;
    }

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;
    CommandArr.splice(0, 1);
    var FinalCommand = CommandArr.join(' ');

    return FinalCommand;
  },

  validateCommands: function /*istanbul ignore next*/validateCommands(options) {
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

    var RepoId = req.session.RepositoryId;

    if (BlockedRegex.test(UserCommand)) return UrlObject = this.getBlockUrl(UserCommand, CommandArr, RepoId);

    if (IssueRegex.test(UserCommand)) return UrlObject = this.getIssueUrl(UserCommand, CommandArr, RepoId);

    if (EpicRegex.test(UserCommand)) return UrlObject = this.getEpicUrl(UserCommand, CommandArr, RepoId);

    return UrlObject;
  },
  makeRequest: function /*istanbul ignore next*/makeRequest(options) {
    var res = options.response;
    var SailsConfig = sails.config.constants;

    var Token = SailsConfig.Token;
    var MainUrl = SailsConfig.ZenHubUrl;

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

    return rp(UrlOptions).then(function (successdata) {
      var Data = successdata;
      console.log('Following Data =' + JSON.stringify(Data));
      return res.json(Data);
    }).catch(function (err) {
      var Error = err;
      // API call failed...
      console.log('User has following error =' + err);
      res.json(err);
    });
  },

  // To Get Repository Id
  getRespositoryId: function /*istanbul ignore next*/getRespositoryId(Options) {
    var res = Options.response;
    var req = Options.request;
    var RepositoryName = Options.repoName;
    var Ownername = sails.config.constants.GitOwnerName;

    var RepositoryUrl = 'repos/' + Ownername + '/' + RepositoryName;
    var MainUrl = sails.config.constants.GitHuburl;

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
      req.session.RepositoryId = RepoId;
      console.log('Repository Id=' + RepoId);
    }).catch(function (err) {
      var Error = err;
      // API call failed...
      console.log('User has %d repos', err);
    });
  },

  // To Get Repo Url
  getRepoUrl: function /*istanbul ignore next*/getRepoUrl(UserCommand, CommandArr) {

    var RepositoryName = CommandArr[1];
    var RepositoryId = 'repos/' + sails.config.constants.GitOwnerName + '/' + RepositoryName;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3J1bV9ib2FyZC5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInJwIiwiUmVnZXgiLCJsb2ciLCJtb2R1bGUiLCJleHBvcnRzIiwiY2FsbE1lIiwib3B0aW9ucyIsInJlcSIsInJlcXVlc3QiLCJyZXMiLCJyZXNwb25zZSIsInRlc3QiLCJGaW5hbERhdGEiLCJnZXRTY3J1bURhdGEiLCJVc2VyQ29tbWFuZCIsIlVzZXJJbnB1dCIsIkZpbmFsTWVzc2FnZSIsIkNoZWNrSWZWYWxpZENvbW1hbmQiLCJjaGVja1ZhbGlkSW5wdXQiLCJVQ29tbWFuZCIsIlR5cGUiLCJNZXNzYWdlIiwiQ29tbWFuZFZhbHVlIiwiZ2V0Q29tbWFuZCIsImpzb24iLCJDb21tYW5kQXJyIiwic3BsaXQiLCJSZXBvTmFtZSIsIlJlcG9JZCIsIlJlcG9zaXRvcnlJZCIsIlJlcG9SZWdleCIsIlJlZ0V4cCIsInNlc3Npb24iLCJPcHRpb25zIiwiUmVzcG9zaXRvcnlJZCIsImdldFJlc3Bvc2l0b3J5SWQiLCJyZXBvTmFtZSIsIlZhbGlkVXJsT2JqZWN0IiwidmFsaWRhdGVDb21tYW5kcyIsIkNvbW1hbmQiLCJJc1ZhbGlkIiwiSXNHaXQiLCJVQ29tbWFuZEFyciIsIkdpdFJlcG9OYW1lIiwibWFrZVJlcXVlc3QiLCJVVXJsIiwiVXJsIiwiVUJvZHkiLCJCb2R5IiwiVU1ldGhvZCIsIk1ldGhvZCIsIlZhbGlkQml0IiwiY29uc29sZSIsIlZhbGlkQ29tbWFuZHMiLCJWYWxpZENvbW1hZFJlZ2V4IiwiT3JpZ2luYWxzQ29tbWFuZEFyciIsInNwbGljZSIsIkZpbmFsQ29tbWFuZCIsImpvaW4iLCJVcmxPYmplY3QiLCJJc3N1ZVJlZ2V4IiwiRXBpY1JlZ2V4IiwiQmxvY2tlZFJlZ2V4IiwiZ2V0UmVwb1VybCIsImdldEJsb2NrVXJsIiwiZ2V0SXNzdWVVcmwiLCJnZXRFcGljVXJsIiwiU2FpbHNDb25maWciLCJzYWlscyIsImNvbmZpZyIsImNvbnN0YW50cyIsIlRva2VuIiwiTWFpblVybCIsIlplbkh1YlVybCIsIlVzZXJVcmwiLCJVcmxCb2R5IiwiVXJsT3B0aW9ucyIsIm1ldGhvZCIsInVyaSIsInFzIiwiYWNjZXNzX3Rva2VuIiwiaGVhZGVycyIsImJvZHkiLCJ0aGVuIiwic3VjY2Vzc2RhdGEiLCJEYXRhIiwiSlNPTiIsInN0cmluZ2lmeSIsImNhdGNoIiwiZXJyIiwiRXJyb3IiLCJSZXBvc2l0b3J5TmFtZSIsIk93bmVybmFtZSIsIkdpdE93bmVyTmFtZSIsIlJlcG9zaXRvcnlVcmwiLCJHaXRIdWJ1cmwiLCJpZCIsIlJlc3Bvc2l0cm95SWQiLCJQaXBlbGluZVJlZ2V4IiwiSXNzdWVObyIsIlBpcGVMaW5ldXJsIiwiUGlwZWxpbmVNb3ZlUmVnZXgiLCJQaXBlTGluZUlkIiwiUG9zTm8iLCJNb3ZlSXNzdWVQaXBlTGluZSIsIk1vdmVCb2R5IiwicGlwZWxpbmVfaWQiLCJwb3NpdGlvbiIsIkV2ZW50c1JlZ2V4IiwiRXZlbnRzVXJsIiwiRXN0aW1hdGVBZGRSZWdleCIsIkJ1Z1JlZ2V4IiwiQnVnVXJsIiwiVXNlclJlZ2V4IiwiQmxvY2t1cmwiLCJFcGljVXJsIl0sIm1hcHBpbmdzIjoiOztBQUtBOzs7Ozs7QUFMQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLEtBQUtELFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlFLFFBQVFGLFFBQVEsT0FBUixDQUFaOztBQUVBOztBQUVBLElBQU1HLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjs7QUFFQUMsT0FBT0MsT0FBUCxHQUFpQjs7QUFHZkMsVUFBUSx3Q0FBVUMsT0FBVixFQUFtQjtBQUN6QixRQUFJQyxNQUFNRCxRQUFRRSxPQUFsQjtBQUNBLFFBQUlDLE1BQU1ILFFBQVFJLFFBQWxCO0FBQ0EsUUFBSUMsT0FBT0wsUUFBUUssSUFBbkI7O0FBRUEsUUFBSUMsWUFBWTtBQUNkLGdCQUFVLEtBREk7QUFFZCxlQUFTRDtBQUZLLEtBQWhCOztBQUtBLFdBQU9DLFNBQVA7QUFDRCxHQWRjOztBQUFBLDBC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QUFxQmxCLGFBQXJCLEdBQXFDLFFBQW5EOztBQUVBLFFBQUl0QyxZQUFZO0FBQ2RiLFdBQUtxRSxPQURTO0FBRWRqRSxjQUFRLEtBRk07QUFHZEYsWUFBTSxJQUhRO0FBSWRQLGFBQU87QUFKTyxLQUFoQjs7QUFPQSxXQUFPa0IsU0FBUDtBQUNEOztBQWxnQmMsQ0FBakIiLCJmaWxlIjoic2NydW1fYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIHJwID0gcmVxdWlyZSgncmVxdWVzdC1wcm9taXNlJyk7XG52YXIgUmVnZXggPSByZXF1aXJlKCdyZWdleCcpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXG4gIGNhbGxNZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxID0gb3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciB0ZXN0ID0gb3B0aW9ucy50ZXN0O1xuXG4gICAgdmFyIEZpbmFsRGF0YSA9IHtcbiAgICAgIFwiVXNlcklkXCI6IFwiTWFwXCIsXG4gICAgICBcIkNoZWNrXCI6IHRlc3RcbiAgICB9O1xuXG4gICAgcmV0dXJuIEZpbmFsRGF0YTtcbiAgfSxcblxuICBnZXRTY3J1bURhdGEob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5Vc2VySW5wdXQ7XG5cbiAgICAgdmFyIEZpbmFsTWVzc2FnZT1udWxsO1xuICAgIC8vICAgTWVzc2FnZSA6IG51bGwsXG4gICAgLy8gICBPcHRpb25zIDogbnVsbFxuICAgIC8vIH07XG5cbiAgICB2YXIgQ2hlY2tJZlZhbGlkQ29tbWFuZCA9IHRoaXMuY2hlY2tWYWxpZElucHV0KHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBVQ29tbWFuZDogVXNlckNvbW1hbmRcbiAgICB9KTtcblxuICAgIGlmICghQ2hlY2tJZlZhbGlkQ29tbWFuZCkge1xuICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcblxuICAgICAgLy9yZXR1cm4gcmVzLmpzb24oRmluYWxNZXNzYWdlKTtcbiAgICAgIHJldHVybiBGaW5hbE1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdmFyIENvbW1hbmRWYWx1ZSA9IHRoaXMuZ2V0Q29tbWFuZChVc2VyQ29tbWFuZCk7XG5cbiAgICBsb2coXCJjb21tYW5kIHZhbCA6IFwiK0NvbW1hbmRWYWx1ZSk7XG5cbiAgICBpZiAoQ29tbWFuZFZhbHVlID09PSAnJyB8fCBDb21tYW5kVmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIENvbW1hbmRWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgIFR5cGU6ICdFcnJvcicsXG4gICAgICAgIE1lc3NhZ2U6ICdJbnZhbGlkIElucHV0J1xuICAgICAgfTtcbiAgICAgIHJldHVybiByZXMuanNvbihGaW5hbE1lc3NhZ2UpO1xuICAgIH1cblxuXG4gICAgLy9nZXQgcmVwbyBpZFxuICAgIHZhciBDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgdmFyIFJlcG9OYW1lID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgUmVwb0lkID0gQ29tbWFuZEFyclsyXTtcblxuICAgIHZhciBSZXBvc2l0b3J5SWQgPSBSZXBvSWQ7XG5cbiAgICBpZiAoUmVwb3NpdG9yeUlkID09PSBudWxsIHx8IFJlcG9zaXRvcnlJZCA9PT0gJycgfHwgdHlwZW9mIFJlcG9zaXRvcnlJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGxvZyhcInRyeWluZyB0byBnZXQgcmVwbyBpZFwiKTtcbiAgICAgIHZhciBSZXBvUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvcmVwbypcXHNbQS1aYS16MC05XSpcXHNbMC05XSovKTtcblxuICAgICAgaWYgKCFSZXBvUmVnZXgudGVzdChDb21tYW5kVmFsdWUpKSB7XG4gICAgICAgICBGaW5hbE1lc3NhZ2UgPSB7XG4gICAgICAgICAgVHlwZTogJ0Vycm9yJyxcbiAgICAgICAgICBNZXNzYWdlOiAnUmVwb3NpdG9yeSBJZCBOb3QgU3BlY2lmaWVkJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gRmluYWxNZXNzYWdlLk1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIC8qdmFyIENvbW1hbmRBcnIgPSBDb21tYW5kVmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBSZXBvTmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgICB2YXIgUmVwb0lkID0gQ29tbWFuZEFyclsyXTsqL1xuXG4gICAgICBpZiAodHlwZW9mIFJlcG9JZCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVwb0lkICE9PSAnJyAmJiBSZXBvSWQgIT09IG51bGwpIHtcbiAgICAgICAgbG9nKFwicmVwbyBpZCB2YWxpZC4gaWQ6IFwiK1JlcG9JZCk7XG4gICAgICAgIHJlcS5zZXNzaW9uLlJlcG9zaXRvcnlJZCA9IFJlcG9JZDtcbiAgICAgICAgIEZpbmFsTWVzc2FnZSA9IHtcbiAgICAgICAgICBNZXNzYWdlOiAnU3VjY2VzcycsXG4gICAgICAgICAgT3B0aW9uczoge1xuICAgICAgICAgICAgUmVzcG9zaXRvcnlJZDogUmVwb0lkXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcmVzLmpzb24oRmluYWxNZXNzYWdlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IFJlcG9OYW1lXG4gICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgdmFyIFZhbGlkVXJsT2JqZWN0ID0gdGhpcy52YWxpZGF0ZUNvbW1hbmRzKHtcbiAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICBDb21tYW5kOiBDb21tYW5kVmFsdWVcbiAgICB9KTtcblxuXG4gICAgaWYgKFZhbGlkVXJsT2JqZWN0LklzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgRmluYWxNZXNzYWdlID0ge1xuICAgICAgICBUeXBlOiAnRXJyb3InLFxuICAgICAgICBNZXNzYWdlOiAnSW52YWxpZCBDb21tYW5kcydcbiAgICAgIH07XG4gICAgICByZXR1cm4gcmVzLmpzb24oRmluYWxNZXNzYWdlKTtcbiAgICB9XG5cblxuICAgIGlmIChWYWxpZFVybE9iamVjdC5Jc0dpdCkge1xuICAgICAgdmFyIFVDb21tYW5kQXJyID0gQ29tbWFuZFZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICB2YXIgR2l0UmVwb05hbWUgPSBVQ29tbWFuZEFyclsxXTtcblxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzcG9zaXRvcnlJZCh7XG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgcmVwb05hbWU6IEdpdFJlcG9OYW1lXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIHJldHVybiB0aGlzLm1ha2VSZXF1ZXN0KHtcbiAgICAgICAgcmVzcG9uc2U6IHJlcyxcbiAgICAgICAgVVVybDogVmFsaWRVcmxPYmplY3QuVXJsLFxuICAgICAgICBVQm9keTogVmFsaWRVcmxPYmplY3QuQm9keSxcbiAgICAgICAgVU1ldGhvZDogVmFsaWRVcmxPYmplY3QuTWV0aG9kXG4gICAgICB9KTtcbiAgICB9XG5cblxuICB9LFxuXG5cbiAgY2hlY2tWYWxpZElucHV0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgdmFyIFZhbGlkQml0ID0gZmFsc2U7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gb3B0aW9ucy5VQ29tbWFuZDtcbiAgICBjb25zb2xlLmxvZyhcInVzZXIgY29tbWFuZCA6IFwiK1VzZXJDb21tYW5kKTtcbiAgICBcbiAgICB2YXIgVmFsaWRDb21tYW5kcyA9IFsnQHNjcnVtYm90JywgJy9yZXBvJywgJy9pc3N1ZScsICcvZXBpYycsICcvYmxvY2tlZCddO1xuXG4gICAgaWYgKFVzZXJDb21tYW5kID09PSBudWxsIHx8IFVzZXJDb21tYW5kID09PSAnJyB8fCBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgVmFsaWRDb21tYWRSZWdleCA9IG5ldyBSZWdFeHAoL14oQHNjcnVtYm90KVxcc1tcXC9BLVphLXpdKi8pO1xuICAgIGNvbnNvbGUubG9nKFwicHJvY2Vzc2luZyBtZXNzYWdlIDogXCIrVXNlckNvbW1hbmQpO1xuXG5cbiAgICBpZiAoIVZhbGlkQ29tbWFkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpe1xuICAgICAgbG9nKFwiRXJyb3Igbm90IHN0YXJ0aW5nIHdpdGggQHNjcnVtYm90XCIpXG4gICAgICByZXR1cm4gVmFsaWRCaXQ7XG4gICAgfVxuXG4gICAgICBcblxuICAgIHZhciBDb21tYW5kQXJyID0gVXNlckNvbW1hbmQuc3BsaXQoJyAnKTtcbiAgICB2YXIgT3JpZ2luYWxzQ29tbWFuZEFyciA9IENvbW1hbmRBcnI7XG4gICAgQ29tbWFuZEFyci5zcGxpY2UoMCwxKTtcbiAgICB2YXIgRmluYWxDb21tYW5kID0gQ29tbWFuZEFyci5qb2luKCcgJyk7XG5cbiAgICBsb2coXCJGaW5hbCBDb21tYW5kIDogXCIrRmluYWxDb21tYW5kKTtcblxuICAgIHJldHVybiBWYWxpZEJpdCA9IHRydWU7XG4gIH0sXG5cbiAgZ2V0Q29tbWFuZDogZnVuY3Rpb24gKFVDb21tYW5kKSB7XG4gICAgdmFyIFZhbGlkQml0ID0gJyc7XG4gICAgdmFyIFVzZXJDb21tYW5kID0gVUNvbW1hbmQ7XG5cbiAgICBpZiAoVXNlckNvbW1hbmQgPT09IG51bGwgfHwgVXNlckNvbW1hbmQgPT09ICcnIHx8IHR5cGVvZiBVc2VyQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBWYWxpZEJpdDtcbiAgICB9XG5cbiAgICB2YXIgQ29tbWFuZEFyciA9IFVzZXJDb21tYW5kLnNwbGl0KCcgJyk7XG4gICAgdmFyIE9yaWdpbmFsc0NvbW1hbmRBcnIgPSBDb21tYW5kQXJyO1xuICAgIENvbW1hbmRBcnIuc3BsaWNlKDAsMSk7XG4gICAgdmFyIEZpbmFsQ29tbWFuZCA9IENvbW1hbmRBcnIuam9pbignICcpO1xuXG4gICAgcmV0dXJuIEZpbmFsQ29tbWFuZDtcbiAgfSxcblxuICB2YWxpZGF0ZUNvbW1hbmRzOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXEgPSBvcHRpb25zLnJlcXVlc3Q7XG4gICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG5cbiAgICB2YXIgVXNlckNvbW1hbmQgPSBvcHRpb25zLkNvbW1hbmQ7XG4gICAgdmFyIENvbW1hbmRBcnIgPSBVc2VyQ29tbWFuZC5zcGxpdCgnICcpO1xuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiBmYWxzZSxcbiAgICAgIFVybDogJycsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbFxuICAgIH07XG5cbiAgICB2YXIgUmVwb1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL3JlcG8qXFxzW0EtWmEtejAtOV0qXFxzWzAtOV0qLyk7XG4gICAgdmFyIElzc3VlUmVnZXggPSBuZXcgUmVnRXhwKC9eW1xcL2lzc3VlXSpcXHNbMC05XSpcXHMoLXV8YnVnfHBpcGVsaW5lfC1wfGV2ZW50c3wtZSkvKTtcbiAgICB2YXIgRXBpY1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXltcXC9lcGljXSpcXHNbQS1aYS16MC05XSovKTtcbiAgICB2YXIgQmxvY2tlZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2Jsb2NrZWQvKTtcblxuXG4gICAgaWYgKFJlcG9SZWdleC50ZXN0KFVzZXJDb21tYW5kKSlcbiAgICAgIHJldHVybiBVcmxPYmplY3QgPSB0aGlzLmdldFJlcG9VcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpO1xuXG4gICAgdmFyIFJlcG9JZCA9IHJlcS5zZXNzaW9uLlJlcG9zaXRvcnlJZDtcblxuICAgIGlmIChCbG9ja2VkUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRCbG9ja1VybChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKTtcblxuICAgIGlmIChJc3N1ZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKVxuICAgICAgcmV0dXJuIFVybE9iamVjdCA9IHRoaXMuZ2V0SXNzdWVVcmwoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIsIFJlcG9JZCk7XG5cblxuICAgIGlmIChFcGljUmVnZXgudGVzdChVc2VyQ29tbWFuZCkpXG4gICAgICByZXR1cm4gVXJsT2JqZWN0ID0gdGhpcy5nZXRFcGljVXJsKFVzZXJDb21tYW5kLCBDb21tYW5kQXJyLCBSZXBvSWQpO1xuXG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gIH0sXG4gIG1ha2VSZXF1ZXN0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciByZXMgPSBvcHRpb25zLnJlc3BvbnNlO1xuICAgIHZhciBTYWlsc0NvbmZpZyA9IHNhaWxzLmNvbmZpZy5jb25zdGFudHM7XG5cbiAgICB2YXIgVG9rZW4gPSBTYWlsc0NvbmZpZy5Ub2tlbjtcbiAgICB2YXIgTWFpblVybCA9IFNhaWxzQ29uZmlnLlplbkh1YlVybDtcblxuICAgIHZhciBVc2VyVXJsID0gb3B0aW9ucy5VVXJsO1xuICAgIHZhciBVcmxCb2R5ID0gb3B0aW9ucy5VQm9keTtcbiAgICB2YXIgVU1ldGhvZCA9IG9wdGlvbnMuVU1ldGhvZDtcblxuICAgIHZhciBVcmxPcHRpb25zID0ge1xuICAgICAgbWV0aG9kOiBVTWV0aG9kLFxuICAgICAgdXJpOiBNYWluVXJsICsgVXNlclVybCxcbiAgICAgIHFzOiB7XG4gICAgICAgIGFjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICAgICAgLFxuICAgICAgYm9keToge1xuICAgICAgICBVcmxCb2R5XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBycChVcmxPcHRpb25zKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHN1Y2Nlc3NkYXRhKSB7XG4gICAgICAgIHZhciBEYXRhID0gc3VjY2Vzc2RhdGE7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGb2xsb3dpbmcgRGF0YSA9JyArIEpTT04uc3RyaW5naWZ5KERhdGEpKTtcbiAgICAgICAgcmV0dXJuIHJlcy5qc29uKERhdGEpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyBmb2xsb3dpbmcgZXJyb3IgPScgKyBlcnIpO1xuICAgICAgICByZXMuanNvbihlcnIpO1xuICAgICAgfSk7XG5cblxuICB9LFxuXG5cbiAgLy8gVG8gR2V0IFJlcG9zaXRvcnkgSWRcbiAgZ2V0UmVzcG9zaXRvcnlJZDogZnVuY3Rpb24gKE9wdGlvbnMpIHtcbiAgICB2YXIgcmVzID0gT3B0aW9ucy5yZXNwb25zZTtcbiAgICB2YXIgcmVxID0gT3B0aW9ucy5yZXF1ZXN0O1xuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IE9wdGlvbnMucmVwb05hbWU7XG4gICAgdmFyIE93bmVybmFtZSA9IHNhaWxzLmNvbmZpZy5jb25zdGFudHMuR2l0T3duZXJOYW1lO1xuXG4gICAgdmFyIFJlcG9zaXRvcnlVcmwgPSAncmVwb3MvJyArIE93bmVybmFtZSArICcvJyArIFJlcG9zaXRvcnlOYW1lO1xuICAgIHZhciBNYWluVXJsID0gc2FpbHMuY29uZmlnLmNvbnN0YW50cy5HaXRIdWJ1cmw7XG5cbiAgICB2YXIgVXJsT3B0aW9ucyA9IHtcbiAgICAgIHVyaTogTWFpblVybCArIFJlcG9zaXRvcnlVcmwsXG4gICAgICBxczoge1xuICAgICAgICAvL2FjY2Vzc190b2tlbjogVG9rZW4gLy8gLT4gdXJpICsgJz9hY2Nlc3NfdG9rZW49eHh4eHglMjB4eHh4eCdcbiAgICAgIH0sXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdVc2VyLUFnZW50JzogJ1JlcXVlc3QtUHJvbWlzZSdcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlIC8vIEF1dG9tYXRpY2FsbHkgcGFyc2VzIHRoZSBKU09OIHN0cmluZyBpbiB0aGUgcmVzcG9uc2VcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJwKFVybE9wdGlvbnMpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc3VjY2Vzc2RhdGEpIHtcbiAgICAgICAgdmFyIFJlcG9JZCA9IHN1Y2Nlc3NkYXRhLmlkO1xuICAgICAgICByZXEuc2Vzc2lvbi5SZXBvc2l0b3J5SWQgPSBSZXBvSWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSZXBvc2l0b3J5IElkPScgKyBSZXBvSWQpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBFcnJvciA9IGVycjtcbiAgICAgICAgLy8gQVBJIGNhbGwgZmFpbGVkLi4uXG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VyIGhhcyAlZCByZXBvcycsIGVycik7XG4gICAgICB9KTtcblxuICB9LFxuXG4gIC8vIFRvIEdldCBSZXBvIFVybFxuICBnZXRSZXBvVXJsOiBmdW5jdGlvbiAoVXNlckNvbW1hbmQsIENvbW1hbmRBcnIpIHtcblxuICAgIHZhciBSZXBvc2l0b3J5TmFtZSA9IENvbW1hbmRBcnJbMV07XG4gICAgdmFyIFJlcG9zaXRvcnlJZCA9ICdyZXBvcy8nICsgc2FpbHMuY29uZmlnLmNvbnN0YW50cy5HaXRPd25lck5hbWUgKyAnLycgKyBSZXBvc2l0b3J5TmFtZTtcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgVXJsOiBSZXBvc2l0b3J5SWQsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiB0cnVlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgSXNzdWUgcmVsYXRlZCBVcmxcbiAgZ2V0SXNzdWVVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG4gICAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgSXNWYWxpZDogZmFsc2UsXG4gICAgICAgIFVybDogJycsXG4gICAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgfTtcblxuXG5cblxuICAgICAgLy9UbyBHZXQgU3RhdGUgb2YgUGlwZWxpbmVcbiAgICAgIHZhciBQaXBlbGluZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxcc3BpcGVsaW5lLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZVJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgICAgICB2YXIgUGlwZUxpbmV1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogUGlwZUxpbmV1cmwsXG4gICAgICAgICAgTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBCb2R5OiBudWxsLFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy8gTW92ZSBQaXBlbGluZVxuICAgICAgdmFyIFBpcGVsaW5lTW92ZVJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy1wXFxzW0EtWmEtejAtOV0qLyk7XG5cbiAgICAgIGlmIChQaXBlbGluZU1vdmVSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICAgICAgdmFyIFBpcGVMaW5lSWQgPSBDb21tYW5kQXJyWzNdO1xuICAgICAgICB2YXIgUG9zTm8gPSBDb21tYW5kQXJyWzRdO1xuXG4gICAgICAgIHZhciBNb3ZlSXNzdWVQaXBlTGluZSA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2lzc3Vlcy8nICsgSXNzdWVObyArICcvbW92ZXMnO1xuXG4gICAgICAgIHZhciBNb3ZlQm9keSA9IHtcbiAgICAgICAgICBwaXBlbGluZV9pZDogUGlwZUxpbmVJZCxcbiAgICAgICAgICBwb3NpdGlvbjogKFBvc05vICE9PSBudWxsICYmIFBvc05vICE9PSAnJyAmJiB0eXBlb2YgUG9zTm8gIT09ICd1bmRlZmluZWQnID8gUG9zTm8gOiAwKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IE1vdmVJc3N1ZVBpcGVMaW5lLFxuICAgICAgICAgIE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIEJvZHk6IE1vdmVCb2R5LFxuICAgICAgICAgIElzR2l0OiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBVcmxPYmplY3Q7XG4gICAgICB9XG5cblxuICAgICAgLy8gR2V0IGV2ZW50cyBmb3IgdGhlIElzc3VlXG4gICAgICB2YXIgRXZlbnRzUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzZXZlbnRzLyk7XG5cbiAgICAgIGlmIChFdmVudHNSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcblxuICAgICAgICB2YXIgRXZlbnRzVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9ldmVudHMnO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEV2ZW50c1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG5cbiAgICAgIC8vIEdldCB0aGUgZXN0aW1hdGUgZm9yIHRoZSBpc3N1ZS5cbiAgICAgIHZhciBFc3RpbWF0ZUFkZFJlZ2V4ID0gbmV3IFJlZ0V4cCgvXlxcL2lzc3VlKlxcc1swLTldKlxccy1lXFxzWzAtOV0qLyk7XG5cbiAgICAgIGlmIChFc3RpbWF0ZUFkZFJlZ2V4LnRlc3QoVXNlckNvbW1hbmQpKSB7XG5cbiAgICAgICAgdmFyIElzc3VlTm8gPSBDb21tYW5kQXJyWzFdO1xuICAgICAgICB2YXIgUGlwZUxpbmVJZCA9IENvbW1hbmRBcnJbM107XG4gICAgICAgIHZhciBQb3NObyA9IENvbW1hbmRBcnJbNF07XG5cbiAgICAgICAgdmFyIE1vdmVJc3N1ZVBpcGVMaW5lID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vICsgJy9tb3Zlcyc7XG5cbiAgICAgICAgdmFyIE1vdmVCb2R5ID0ge1xuICAgICAgICAgIHBpcGVsaW5lX2lkOiBQaXBlTGluZUlkLFxuICAgICAgICAgIHBvc2l0aW9uOiAoUG9zTm8gIT09IG51bGwgJiYgUG9zTm8gIT09ICcnICYmIHR5cGVvZiBQb3NObyAhPT0gJ3VuZGVmaW5lZCcgPyBQb3NObyA6IDApXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogTW92ZUlzc3VlUGlwZUxpbmUsXG4gICAgICAgICAgTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgQm9keTogTW92ZUJvZHksXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG5cbiAgICAgIC8vIEdldCBCdWdzIGJ5IHRoZSB1c2VyXG4gICAgICB2YXIgQnVnUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzYnVnLyk7XG5cbiAgICAgIGlmIChCdWdSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcblxuICAgICAgICB2YXIgQnVnVXJsID0gJ3AxL3JlcG9zaXRvcmllcy8nICsgUmVzcG9zaXRyb3lJZCArICcvaXNzdWVzLycgKyBJc3N1ZU5vO1xuXG4gICAgICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICAgICAgSXNWYWxpZDogdHJ1ZSxcbiAgICAgICAgICBVcmw6IEJ1Z1VybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICAvL1RvIEdldCBVc2VyIElzc3VlIGJ5IHVzZXJcbiAgICAgIHZhciBVc2VyUmVnZXggPSBuZXcgUmVnRXhwKC9eXFwvaXNzdWUqXFxzWzAtOV0qXFxzLXVcXHNbQS1aYS16MC05XSovKTtcblxuICAgICAgaWYgKFVzZXJSZWdleC50ZXN0KFVzZXJDb21tYW5kKSkge1xuXG4gICAgICAgIHZhciBVc2VyVXJsID0gJyc7XG5cbiAgICAgICAgdmFyIFVybE9iamVjdCA9IHtcbiAgICAgICAgICBJc1ZhbGlkOiB0cnVlLFxuICAgICAgICAgIFVybDogVXNlclVybCxcbiAgICAgICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIEJvZHk6IG51bGwsXG4gICAgICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFVybE9iamVjdDtcbiAgICAgIH1cblxuXG4gICAgICByZXR1cm4gVXJsT2JqZWN0O1xuXG4gICAgfVxuXG4gICAgLFxuICAvL1RvIEdldCBCbG9ja2VkIElzc3VlcyBVcmxcbiAgZ2V0QmxvY2tVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcblxuICAgIHZhciBJc3N1ZU5vID0gQ29tbWFuZEFyclsxXTtcbiAgICB2YXIgQmxvY2t1cmwgPSAncDEvcmVwb3NpdG9yaWVzLycgKyBSZXNwb3NpdHJveUlkICsgJy9pc3N1ZXMvJyArIElzc3VlTm87XG5cbiAgICB2YXIgVXJsT2JqZWN0ID0ge1xuICAgICAgVXJsOiBCbG9ja3VybCxcbiAgICAgIE1ldGhvZDogJ0dFVCcsXG4gICAgICBCb2R5OiBudWxsLFxuICAgICAgSXNHaXQ6IGZhbHNlXG4gICAgfTtcblxuICAgIHJldHVybiBVcmxPYmplY3Q7XG4gIH0sXG5cbiAgLy9UbyBHZXQgQmxvY2tlZCBJc3N1ZXMgVXJsXG4gIGdldEVwaWNVcmw6IGZ1bmN0aW9uIChVc2VyQ29tbWFuZCwgQ29tbWFuZEFyciwgUmVwb0lkKSB7XG5cbiAgICB2YXIgUmVzcG9zaXRyb3lJZCA9IFJlcG9JZDtcbiAgICB2YXIgRXBpY1VybCA9ICdwMS9yZXBvc2l0b3JpZXMvJyArIFJlc3Bvc2l0cm95SWQgKyAnL2VwaWNzJztcblxuICAgIHZhciBVcmxPYmplY3QgPSB7XG4gICAgICBVcmw6IEVwaWNVcmwsXG4gICAgICBNZXRob2Q6ICdHRVQnLFxuICAgICAgQm9keTogbnVsbCxcbiAgICAgIElzR2l0OiBmYWxzZVxuICAgIH07XG5cbiAgICByZXR1cm4gVXJsT2JqZWN0O1xuICB9XG5cblxuXG5cbn07XG4iXX0=