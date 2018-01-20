var _ = require('lodash');
var rp = require('request-promise');
var regex = require('regex');
var requireEnv = require("require-environment-variables");


var RepoRegex = new regex(/^\/repo*\s[A-Za-z0-9]*\s[0-9]*/);
var IssueRegex = new regex(/^[\/issue]*\s[0-9]*\s(-u|bug|pipeline|-p|events|-e)/);
var EpicRegex = new regex(/^[\/epic]*\s[A-Za-z0-9]*/);
var BlockedRegex = new regex(/^\/blocked/);


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

  checkValidInput: function (options) {
    var req = options.request;
    var res = options.response;
    var ValidBit = false;
    var UserCommand = req.param('command');
    var ValidCommands = ['@scrumbot', '/repo', '/issue', '/epic', '/blocked'];

    if (UserCommand === null || UserCommand === '' || UserCommand === 'undefined') {
      return ValidBit;
    }

    var ValidCommadRegex = new regex(/^(@scrumbot)\s[\/A-Za-z]*/);

    if (!ValidCommadRegex.test(UserCommand))
      return ValidBit;

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;
    CommandArr.splice(0);
    var FinalCommand = CommandArr.join(' ');

    return ValidBit = true;





    // for (var i = 0; i < CommandArr.length; i++) {
    //   var abc = CommandArr[i];
    //   if (_.includes(ValidCommands, CommandArr[i])) {
    //     ValidBit = true;
    //     //return true;
    //   } else if (i == 2) {
    //     return false;
    //   } else {
    //     ValidBit = true;
    //     return false;
    //   }

    // }

    // return ValidBit;
  },

  getCommand: function (options) {

    var req = options.request;
    var res = options.response;
    var ValidBit = false;
    var UserCommand = req.param('command');


    if (UserCommand === null || UserCommand === '' || UserCommand === 'undefined') {
      return ValidBit;
    }

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;
    CommandArr.splice(0);
    var FinalCommand = CommandArr.join(' ');

    return FinalCommand;
  },

  validateCommands: function (options) {
    var req = options.request;
    var res = options.response;
    var ValidBit = false;

    var RepoId=req.session.repoid;
    
    var UserCommand = options.Command;
    var CommandArr = UserCommand.split(' ');
    var UrlObject = {
      Url: '',
      Method: 'GET',
      Body : null
    };

  

    if (RepoRegex.test(UserCommand))
      return UrlObject = getRepoUrl(UserCommand, CommandArr);

    if (BlockedRegex.test(UserCommand))
      return Url = 'p1/repositories/';

    if (IssueRegex.test(UserCommand))
      return Url = getIssueUrl(UserCommand, CommandArr,RepoId);

  },
  makeRequest: function (options) {
    var res = options.response;
    var IssueNum = options.issue;
    var Token = process.env.ZENHUB_TOKEN;
    var MainUrl = 'https://api.zenhub.io/';
    var AccessToken = 'access_token=' + Token;
    var UserUrl = 'p1/repositories/117124053/issues/'+IssueNum;



    var UrlOptions = {
      uri: MainUrl + UserUrl,
      qs: {
        access_token: Token // -> uri + '?access_token=xxxxx%20xxxxx'
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response
    };

    return rp(UrlOptions)
      .then(function (repos) {
        var Data = repos;
        var IsEpic = Data.is_epic;
        var Pipelines = Data.pipeline;
        console.log('User has Pipelines=' + JSON.stringify(Pipelines));
        return res.json(Data);
      })
      .catch(function (err) {
        var Error = err;
        // API call failed...
        console.log('User has %d repos', err);
      });


  },

  prepareRequest: function (options) {
      var res = options.response;
      var Configval = sails.config.constants.walson;
      console.log(Configval);


    }

    ,

  getRespectiveUrl: function (CommandData) {

    var FinalUrl = '';

    var RepositoryId = 'repos/' + sails.config.constants.GitOwnerName + '/' + RepositoryName;

    var Issueurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;
    var PipeLineurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

    var IssueEventsurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/events';

    var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';
    var MoveBody = {
      pipeline_id: PipeLineId,
      position: (PosNo !== null && PosNo !== '' && PosNo !== 'undefined' ? PosNo : 0)
    };


    var EpicUrl = 'p1/repositories/' + RespositroyId + '/epics';

    var AddEstimateUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/estimate';
    var EstimateBody = {
      estimate: (EstimateNo !== null && PosNo !== '' && PosNo !== 'undefined' ? EstimateNo : 0)
    };



    switch (CommandData) {



      case '/blocked':
        FinalUrl = '';
        break;

      case '/epic':
        FinalUrl = '';
        break;

    }

  },

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

  getRepoUrl: function (UserCommand, CommandArr) {

    var RepositoryName = CommandArr[1];
    var RepositoryId = 'repos/' + sails.config.constants.GitOwnerName + '/' + RepositoryName;

    var UrlObject = {
      Url: RepositoryId,
      Method: 'GET',
      Body: null
    };

    return UrlObject;
  },

  getIssueUrl: function (UserCommand, CommandArr,RepoId) {
    var RespositroyId = RepoId;

    var UrlObject = {
      Url: '',
      Method: 'GET',
      Body: null
    };




    //To Get State of Pipeline
    var PipelineRegex = new regex(/^\/issue*\s[0-9]*\spipeline/);

    if (PipelineRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];
      var PipeLineurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        Url: PipeLineurl,
        Method: 'GET',
        Body: null
      };

      return UrlObject;
    }


    // Move Pipeline
    var PipelineMoveRegex = new regex(/^\/issue*\s[0-9]*\s-p\s[A-Za-z0-9]*/);

    if (PipelineMoveRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];
      var PipeLineId = CommandArr[3];
      var PosNo = CommandArr[4];

      var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';

      var MoveBody = {
        pipeline_id: PipeLineId,
        position: (PosNo !== null && PosNo !== '' && PosNo !== 'undefined' ? PosNo : 0)
      };

      var UrlObject = {
        Url: MoveIssuePipeLine,
        Method: 'POST',
        Body: MoveBody
      };

      return UrlObject;
    }


    // Get events for the Issue
    var EventsRegex = new regex(/^\/issue*\s[0-9]*\sevents/);

    if (EventsRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];
      var EstimateNo = CommandArr[3];

      var AddEstimateUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/estimate';
      var EstimateBody = {
        estimate: (EstimateNo !== null && EstimateNo !== '' && EstimateNo !== 'undefined' ? EstimateNo : 0)
      };

      var UrlObject = {
        Url: AddEstimateUrl,
        Method: 'PUT',
        Body: EstimateBody
      };

      return UrlObject;
    }



    // Get the estimate for the issue.
    var EstimateAddRegex = new regex(/^\/issue*\s[0-9]*\s-e\s[0-9]*/);

    if (EstimateAddRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];
      var PipeLineId = CommandArr[3];
      var PosNo = CommandArr[4];

      var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';

      var MoveBody = {
        pipeline_id: PipeLineId,
        position: (PosNo !== null && PosNo !== '' && PosNo !== 'undefined' ? PosNo : 0)
      };

      var UrlObject = {
        Url: MoveIssuePipeLine,
        Method: 'POST',
        Body: MoveBody
      };

      return UrlObject;
    }



    // Get Bugs by the user
    var BugRegex = new regex(/^\/issue*\s[0-9]*\sbug/);

    if (BugRegex.test(UserCommand)) {

      var IssueNo = CommandArr[1];

      var BugUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/estimate';

      var UrlObject = {
        Url: BugUrl,
        Method: 'GET',
        Body: null
      };

      return UrlObject;
    }


    //To Get User Issue by user
    var UserRegex = new regex(/^\/issue*\s[0-9]*\s-u\s[A-Za-z0-9]*/);

    if (UserRegex.test(UserCommand)) {

      var UserUrl = '';

      var UrlObject = {
        Url: UserUrl,
        Method: 'GET',
        Body: null
      };

      return UrlObject;
    }



  }

  ,

  getBlockUrl: function (UserCommand, CommandArr) {

    var RepositoryName = CommandArr[1];
    var RepositoryId = 'repos/' + sails.config.constants.GitOwnerName + '/' + RepositoryName;

    var UrlObject = {
      Url: RepositoryId,
      Method: 'GET',
      Body: null
    };

    return UrlObject;
  },



};
