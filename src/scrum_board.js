var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');
var dateFormat = require('dateformat');
var os = require("os");

// Setup debug log
import debug from 'debug';
const log = debug('watsonwork-scrumbot');

var repo_id;

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

      return FinalMessage.Message;
    }

    var CommandValue = this.getCommand(UserCommand);

    log("command val : "+CommandValue);

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

    log("repo id 1 : "+repo_id);

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
        log("repo found id: "+RepoId);

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
        GitOwnerName:'x00066949'
        
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


    log("url is valid")
    if (ValidUrlObject.IsGit) {
      log("is Git ..")
      var UCommandArr = CommandValue.split(' ');
      var GitRepoName = UCommandArr[1];

      return this.getRespositoryId({
        request: req,
        response: res,
        repoName: GitRepoName,
        GitOwnerName:'x00066949'
      });

    } else {

      log ("not git");
      return this.makeRequest({
        response: res,
        UUrl: ValidUrlObject.Url,
        UBody: ValidUrlObject.Body,
        UMethod: ValidUrlObject.Method,
        UType:ValidUrlObject.UrlType
      });
    }


  },

  //given, pipeline name, return pipeline id
  getPipelineId(PipelineName){
    log("entered name : "+PipelineName)
    var PipelineId;
    var pipelineIdRequest = {
      uri: 'https://api.zenhub.io/p1/repositories/' + repo_id + '/board',

      headers: {
        'X-Authentication-Token': process.env.ZENHUB_TOKEN
      },

      json: true
    };
    rp(pipelineIdRequest)
    .then(function (data){
      
      log(data)
      for (var i =0; i<data['pipelines'].length; i++){
        log("checking")
        if (data['pipelines'][i].name === PipelineName){
          log("found pipeline id : "+data['pipelines'][i].id);
          return data['pipelines'][i].id;
        }
      }

      log("did not find id corresponding to pipe name");
    })
    .catch((err) => {
      console.log("error = "+err)
      return err;    
    }) 
  },

  checkValidInput: function (options) {
    var req = options.request;
    var res = options.response;
    var ValidBit = false;
    var UserCommand = options.UCommand;
    console.log("user command : "+UserCommand);
    
    var ValidCommands = ['@scrumbot', '/repo', '/issue', '/epic', '/blocked'];

    if (UserCommand === null || UserCommand === '' || UserCommand === 'undefined') {
      return ValidBit;
    }

    var ValidCommadRegex = new RegExp(/^(@scrumbot)\s[\/A-Za-z]*/);
    console.log("processing message : "+UserCommand);


    if (!ValidCommadRegex.test(UserCommand)){
      log("Error not starting with @scrumbot")
      return ValidBit;
    }

      

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;

    //if /repo comes after @scrumbot, no repo id provided else take whatever comes after @scrumbot as repo_id
    if (CommandArr[1] === ValidCommands[1]){
      CommandArr.splice(0,1);
    }
    else{
      repo_id = CommandArr[2];
      CommandArr.splice(0,1);
    }
    
    var FinalCommand = CommandArr.join(' ');
    log("Final Command : "+FinalCommand);

    return ValidBit = true;
  },

  getCommand: function (UCommand) {
    log("getCommand");
    var ValidBit = '';
    var UserCommand = UCommand;

    if (UserCommand === null || UserCommand === '' || typeof UserCommand === 'undefined') {
      return ValidBit;
    }

    var CommandArr = UserCommand.split(' ');
    var OriginalsCommandArr = CommandArr;

    if (CommandArr[1] === '/repo'){
      CommandArr.splice(0,1);
    }
    else{
      repo_id = CommandArr[2];
      log ("firstly initialisiing repo_id as "+repo_id +" from message arg at pos 1 = "+CommandArr[1]);
      CommandArr.splice(0,1);
    }
    
    log("repo id 2 : "+repo_id);    
    var FinalCommand = CommandArr.join(' ');

    return FinalCommand;
  },

  validateCommands: function (options) {

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

    if (RepoRegex.test(UserCommand))
      return UrlObject = this.getRepoUrl(UserCommand, CommandArr);

    var RepoId = repo_id;

    if (BlockedRegex.test(UserCommand))
      return UrlObject = this.getBlockUrl(UserCommand, CommandArr, RepoId);

    if (IssueRegex.test(UserCommand))
      return UrlObject = this.getIssueUrl(UserCommand, CommandArr, RepoId);

    if (EpicRegex.test(UserCommand))
      return UrlObject = this.getEpicUrl(UserCommand, CommandArr, RepoId);

    log("UrlObject = "+UrlObject);
    return UrlObject;

  },

  makeRequest: function (options) {
    log("makeRequest");
    log(options.UBody)
    var res = options.response;
    var Token = process.env.ZENHUB_TOKEN;
    var MainUrl = 'https://api.zenhub.io/';

    var UserUrl = options.UUrl;
    var UrlBody = options.UBody;
    var UrlBody;
  
    if(options.UBody == null){
      UrlBody = options.UBody;
      
    }else{
      UrlBody = options.UBody.estimate;            

    }
  
    var UMethod = options.UMethod;
    var UrlType = options.UType;
    
    log("Body : "+JSON.stringify(UrlBody));

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
        estimate: UrlBody
        //UrlBody

      }
    };
    
    return rp(UrlOptions)
      .then(function (successdata) {
        var Data = successdata;
        console.log('Following Data =' + JSON.stringify(Data));

        //Parse JSON according to obj returned
        if(UrlType === 'IssueEvents'){
          log("Events for issue");
          Data = '*Here are the most recent events regarding your issue:* ';

          for (var i =0; i<successdata.length; i++){

            if(successdata[i].type === 'transferIssue'){
              log("pipeline move event"+JSON.stringify(successdata[i].to_pipeline)+successdata[i].from_pipeline);
              Data += '\n*User ' +successdata[i].user_id+ '* _moved_ this issue from '+successdata[i].from_pipeline.name+' to '+successdata[i].to_pipeline.name+' on date : '+dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
  
            }
            if(successdata[i].type === 'estimateIssue'){
              log("estimate change event "+i);
              Data += '\n *User ' +successdata[i].user_id+ '* _changed estimate_ on this issue to  '+successdata[i].to_estimate.value+' on date : '+dateFormat(successdata[i].created_at, "dddd, mmmm dS, yyyy");
  
            }else {
              log("do not recogise event type");
            }
            
          }
          Data += " ";
        }

        if(UrlType === 'GetPipeline'){

          Data = " ";
          Data += "That issue is currently in "+successdata.pipeline.name+" pipeline.";
        }

        if(UrlType === 'IssueEstimate'){
          Data = '';
          Data += 'Your Issue\'s estimate \n has been updated to '+successdata.estimate;
        }

        if(UrlType === 'EpicIssues'){
          
          Data = "The following Epics are in your scrumboard: ";
          for (var i =0; i<successdata.epic_issues.length; i++){
            Data += `\n Epic ID:  ${successdata.epic_issues[i].issue_number} Url : ${successdata.epic_issues[i].issue_url} `
            //" *"+(i+1)+"* Epic ID: "+successdata.epic_issues[i].issue_number+" Url : "+successdata.epic_issues[i].issue_url+" "+os.EOL;
            
          }
        }

        //return JSON.stringify(Data);
        return Data;
      })
      .catch(function (err) {
        var Error = err;
        // API call failed...
        console.log('User has following error =' + err);
        return err;
      });

  },


  // To Get Repository Id
  getRespositoryId: function (Options) {
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

    return rp(UrlOptions)
      .then(function (successdata) {
        var RepoId = successdata.id;

        repo_id = RepoId;
        console.log(successdata);
        return "The *Repository Id* for _"+RepositoryName+"_ is "+JSON.stringify(successdata.id)+" View repo at : "+successdata.html_url;
      })
      .catch(function (err) {
        var Error = err;
        // API call failed...
        log("API call failed...");
        console.log('User has %d repos', err);
      });

  },

  // To Get Repo Url
  getRepoUrl: function (UserCommand, CommandArr) {

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
  getIssueUrl: function (UserCommand, CommandArr, RepoId) {
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
      log("issue Num in getISsueUrl : "+IssueNo);
      var PipeLineurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

      var UrlObject = {
        IsValid: true,
        Url: PipeLineurl,
        Method: 'GET',
        Body: null,
        IsGit: false,
        UrlType:'GetPipeline'
      };

      return UrlObject;
    }

    
    // Move Pipeline
    var PipelineMoveRegex = new RegExp(/^\/issue*\s[0-9]*\s[0-9]*\s-p\s[A-Za-z0-9]*/);

    if (PipelineMoveRegex.test(UserCommand)) {

      //if moving pipeline, 3rd arg is issue num,  4th = -p, 5th = pipeline, 6t position
      var IssueNo = CommandArr[2];
      log("name used "+ CommandArr[4])
      this.getPipelineId(CommandArr[4]).then(function (data){

        log("Pipeline got (using data): "+ data);
        var PosNo = CommandArr[5]|0;
        log("position: "+PosNo)
        var MoveIssuePipeLine = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/moves';
        log("building move pipeline url..")

        var MoveBody = {
          pipeline_id: data,
          position: (PosNo !== null && PosNo !== '' && typeof PosNo !== 'undefined' ? PosNo : 0)
        };

        var UrlObject = {
          IsValid: true,
          Url: MoveIssuePipeLine,
          Method: 'POST',
          Body: MoveBody,
          IsGit: false,
          UrlType:'IssueToPipelines'
        };

        log("url built.");
        return UrlObject;

        }); 
      }

     
      // Get events for the Issue 
      var EventsRegex = new RegExp(/^\/issue*\s[0-9]*\s[0-9]*\sevents/);

      if (EventsRegex.test(UserCommand)) {

        var IssueNo = CommandArr[2];
        log("issue no eventsregex "+IssueNo);
        var EventsUrl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo + '/events';

        var UrlObject = {
          IsValid: true,
          Url: EventsUrl,
          Method: 'GET',
          Body: null,
          IsGit: false,
          UrlType:'IssueEvents'
        };

        return UrlObject;
      }

      
      // Set the estimate for the issue.
      var EstimateAddRegex = new RegExp(/^\/issue*\s[0-9]*\s[0-9]*\s-e\s[0-9]*/);

      if (EstimateAddRegex.test(UserCommand)) {

        var IssueNo = CommandArr[2];
        var EstimateVal = CommandArr[4];
        log("EstimateVal : "+EstimateVal)
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
          UrlType:'IssueEstimate'
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
          UrlType:'BugIssues'
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
          UrlType:'UserIssues'
        };

        return UrlObject;
      }

      return UrlObject;
    },


  //To Get Blocked Issues Url
  getBlockUrl: function (UserCommand, CommandArr, RepoId) {
    
    log("getBlockUrl");
    var RespositroyId = RepoId;
    var IssueNo = CommandArr[1];
    var Blockurl = 'p1/repositories/' + RespositroyId + '/issues/' + IssueNo;

    var UrlObject = {
      Url: Blockurl,
      Method: 'GET',
      Body: null,
      IsGit: false,
      UrlType:'BlockedIssues'
    };

    return UrlObject;
  },


  //To Get epics Url
  getEpicUrl: function (UserCommand, CommandArr, RepoId) {
    
    log("getEpicUrl");
    var RespositroyId = RepoId;
    var EpicUrl = 'p1/repositories/' + RespositroyId + '/epics';

    var UrlObject = {
      IsValid : true,
      Url: EpicUrl,
      Method: 'GET',
      Body: null,
      IsGit: false,
      UrlType:'EpicIssues'
    };

    return UrlObject;
  }

};
