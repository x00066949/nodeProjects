var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');
var dateFormat = require('dateformat');

// Setup debug log
import debug from 'debug';
const log = debug('watsonwork-scrumbot');

module.exports = {

    parseResponse: (function (req, res) {
        log('parseresponse')
        
        var UrlOptions = {
            uri: 'https://api.github.com/',
            qs: {
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };

        return rp(UrlOptions).then(function () {

            var FinalMessage = '';

            //COMMENTS
            if (req.get('X-Github-Event') === 'issue_comment') {
                log('action: ' + req.body.action)

                FinalMessage = 'A Comment has just been '

                if (req.body.action === 'created') {
                    FinalMessage += 'added to issue #' + req.body.issue.number + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.comment.body;
                }
                else if (req.body.action === 'edited') {
                    FinalMessage += 'edited under issue #' + req.body.issue.number + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id + ' by user ' + req.body.comment.user.login + '\n The comment can be found here : ' + req.body.comment.html_url + '. \n The content of the comment is : \n' + req.body.comment.body;
                }
                else if (req.body.action === 'deleted') {
                    FinalMessage = 'Comment content : _"' + req.body.comment.body + '"_\nThe above comment was deleted under issue #' + req.body.issue.number + ' by user ' + req.body.comment.user.login + ' in repository ' + req.body.repository.name + ' with ID : ' + req.body.repository.id;
                }
                else {
                    FinalMessage += req.body.action + ' action not coded yet...coming soon'
                }
            }
            //ISSUES
            else if (req.get('X-Github-Event') === 'issues') {
                log('action: ' + req.body.action)

                FinalMessage = 'An issue has just been '

                if (req.body.action === 'opened') {
                    FinalMessage += 'opened in repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\nIssue Details:\nIssue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title;
                    for (var i = 0; i < req.body.issue.labels.length; i++) {
                        FinalMessage += '\nThe following labels were added: '
                        FinalMessage += '\n\t' + req.body.issue.labels[i].name + '\n'
                    }
                    FinalMessage += '\n Issue opened by : ' + req.body.issue.user.login + '\n The Issue can be found here : ' + req.body.issue.html_url + '.';
                } else if (req.body.action === 'closed') {
                    FinalMessage += 'closed. ' + '\nIssue Details:\nIssue Number : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n Issue closed by : ' + req.body.issue.user.login + '\nIn repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '.';
                } else if (req.body.action === 'reopened') {
                    FinalMessage += 'reopened in repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\n Issue Re-opened by : ' + req.body.issue.user.login + '\nIssue Details:\nIssue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + '\n The Issue can be found here : ' + req.body.issue.html_url + '.';
                } else if (req.body.action === 'labeled') {
                    FinalMessage = 'Issue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title + ' has been updated with the following labels: ';
                    for (var i = 0; i < req.body.issue.labels.length; i++) {
                        FinalMessage += '\n\t' + req.body.issue.labels[i].name + '\n'
                    }
                    FinalMessage += 'In repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\n Label added by : ' + req.body.issue.user.login + '\n The Issue can be found here : ' + req.body.issue.html_url + ' .';
                } else if (req.body.action === 'unlabeled') {
                    FinalMessage = 'The following label : \n\t' + req.body.label.name;

                    FinalMessage += '\n Has been removed from Issue ID : #' + req.body.issue.number + '\nIssue Title: ' + req.body.issue.title;
                    FinalMessage += 'In repository ' + req.body.repository.name + ' with repo id: ' + req.body.repository.id + '\n Label removed by : ' + req.body.issue.user.login + '\n The Issue can be found here : ' + req.body.issue.html_url + ' .';
                }
                else {
                    FinalMessage = req.body.action + ' action not coded yet...coming soon'
                }
            }
            else {
                log('Event type: ' + req.get('X-Github-Event'))
                FinalMessage = 'Event type : ' + req.get('X-Github-Event') + ' in board. (NOT coded yet...Coming soon)'
            }
            log(FinalMessage)
            return FinalMessage;
        });
    })
};
