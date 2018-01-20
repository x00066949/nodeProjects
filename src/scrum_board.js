var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');

// Setup debug log
import debug from 'debug';
const log = debug('watsonwork-scrumbot');

module.exports = {


  callMe: function (options) {
    var req = options.request;
    var res = options.response;
    var test = options.test;

    var FinalData = {
      "UserId": "Map",
      "Check": test
    };

    return FinalData;
  },

  getScrumData(options) {
    var req = options.request;
    var res = options.response;
    var UserCommand = options.UserInput;

     var FinalMessage=null;
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


    if (CommandValue === '' || CommandValue === null || typeof CommandValue === 'undefined') {
       FinalMessage = {
        Type: 'Error',
        Message: 'Invalid Input'
      };
      return res.json(FinalMessage);
    }


    var RepositoryId = req.session.RepositoryId;

    if (RepositoryId === null || RepositoryId === '' || typeof RepositoryId === 'undefined') {
      var RepoRegex = new RegExp(/^\/repo*\s[A-Za-z0-9]*\s[0-9]*/);

      if (!RepoRegex.test(CommandValue)) {
         FinalMessage = {
          Type: 'Error',
          Message: 'Repository Id Not Specified'
        };
        return res.json(FinalMessage);
      }

      var CommandArr = CommandValue.split(' ');
      var RepoName = CommandArr[1];
      var RepoId = CommandArr[2];

      if (typeof RepoId !== 'undefined' && RepoId !== '' && RepoId !== null) {
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


  checkValidInput: function (options) {
    var req = options.request;
    var res = options.response;
    var ValidBit = false;
    var UserCommand = options.UCommand;
    var ValidCommands = ['@scrumbot', '/repo', '/issue', '/epic', '/blocked'];

    if (UserCommand === null || UserCommand === '' || UserCommand === 'undefined') {
      return ValidBit;
    }

    var ValidCommadRegex = new RegExp(/^(@scrumbot)\s[\/A-Za-z]*/);
    console.log("processing message : "+UserCommand);


    if (!ValidCommadRegex.test(UserCommand)){
      log("Error not starting with regex")
      return ValidBit;
    }

      

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;
    CommandArr.splice(0,1);
    var FinalCommand = CommandArr.join(' ');

    log("Final Command : "+FinalCommand);

    return ValidBit = true;
  },

  getCommand: function (UCommand) {
    var ValidBit = '';
    var UserCommand = UCommand;

    if (UserCommand === null || UserCommand === '' || typeof UserCommand === 'undefined') {
      return ValidBit;
    }

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;
    CommandArr.splice(0,1);
    var FinalCommand = CommandArr.join(' ');

    return FinalCommand;
  },

  validateCommands: function (options) {
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


    if (RepoRegex.test(UserCommand))
      return UrlObject = this.getRepoUrl(UserCommand, CommandArr);

    var RepoId = req.session.RepositoryId;

    if (BlockedRegex.test(UserCommand))
      return UrlObject = this.getBlockUrl(UserCommand, CommandArr, RepoId);

    if (IssueRegex.test(UserCommand))
      return UrlObject = this.getIssueUrl(UserCommand, CommandArr, RepoId);


    if (EpicRegex.test(UserCommand))
      return UrlObject = this.getEpicUrl(UserCommand, CommandArr, RepoId);


    return UrlObject;

  },
  makeRequest: function (options) {
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
        ,
      body: {
        UrlBody
      }
    };

    return rp(UrlOptions)
      .then(function (successdata) {
        var Data = successdata;
        console.log('Following Data =' + JSON.stringify(Data));
        return res.json(Data);
      })
      .catch(function (err) {
        var Error = err;
        // API call failed...
        console.log('User has following error =' + err);
        res.json(err);
      });


  },


  // To Get Repository Id
  getRespositoryId: function (Options) {
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

    return rp(UrlOptions)
      .then(function (successdata) {
        var RepoId = successdata.id;
        req.session.RepositoryId = RepoId;
        console.log('Repository Id=' + RepoId);
      })
      .catch(function (err) {
        var Error = err;
        // API call failed...
        console.log('User has %d repos', err);
      });

  },

  // To Get Repo Url
  getRepoUrl: function (UserCommand, CommandArr) {

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
  getIssueUrl: function (UserCommand, CommandArr, RepoId) {
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
          position: (PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0)
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
          position: (PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0)
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

    }

    ,
  //To Get Blocked Issues Url
  getBlockUrl: function (UserCommand, CommandArr, RepoId) {

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
  getEpicUrl: function (UserCommand, CommandArr, RepoId) {

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
