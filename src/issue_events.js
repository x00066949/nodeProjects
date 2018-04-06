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
    }
}