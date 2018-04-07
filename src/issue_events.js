var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');
var dateFormat = require('dateformat');

// Setup debug log
import debug from 'debug';
const log = debug('watsonwork-scrumbot');

module.exports = {

    getIssueData(options){
        var req = options.request;
        var res = options.response;

        var FinalMessage=null;

        if(req.get('X-Github-Event') === 'issue_comment' ){


            FinalMessage += 'A Comment has just been '
            if(req.body.action === 'created')
                FinalMessage += 'added to issue #'+req.body.issue.id+' in repository ' +req.body.repository.name+' with ID : '+req.body.repository.id+' by user '+req.body.comment.user.login+'\n The comment can be found here : '+req.body.comment.html_url+'. \n The content of the comment is : \n'+req.body.body;
            
            return FinalMessage;
        }
    }
}