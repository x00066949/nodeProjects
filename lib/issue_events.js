/*istanbul ignore next*/'use strict';

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var rp = require('request-promise');
var Regex = require('regex');
var dateFormat = require('dateformat');

// Setup debug log

var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-scrumbot');

module.exports = {
    /*istanbul ignore next*/getIssueData: function getIssueData(options) {
        var req = options.request;
        var res = options.response;
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pc3N1ZV9ldmVudHMuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJycCIsIlJlZ2V4IiwiZGF0ZUZvcm1hdCIsImxvZyIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRJc3N1ZURhdGEiLCJvcHRpb25zIiwicmVxIiwicmVxdWVzdCIsInJlcyIsInJlc3BvbnNlIl0sIm1hcHBpbmdzIjoiOztBQU1BOzs7Ozs7QUFOQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLEtBQUtELFFBQVEsaUJBQVIsQ0FBVDtBQUNBLElBQUlFLFFBQVFGLFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBSUcsYUFBYUgsUUFBUSxZQUFSLENBQWpCOztBQUVBOztBQUVBLElBQU1JLE1BQU0sNkNBQU0scUJBQU4sQ0FBWjs7QUFFQUMsT0FBT0MsT0FBUCxHQUFpQjtBQUFBLDRCQUViQyxZQUZhLHdCQUVBQyxPQUZBLEVBRVE7QUFDakIsWUFBSUMsTUFBTUQsUUFBUUUsT0FBbEI7QUFDQSxZQUFJQyxNQUFNSCxRQUFRSSxRQUFsQjtBQUNIO0FBTFksQ0FBakIiLCJmaWxlIjoiaXNzdWVfZXZlbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbnZhciBycCA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZScpO1xudmFyIFJlZ2V4ID0gcmVxdWlyZSgncmVnZXgnKTtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnZGF0ZWZvcm1hdCcpO1xuXG4vLyBTZXR1cCBkZWJ1ZyBsb2dcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1zY3J1bWJvdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIGdldElzc3VlRGF0YShvcHRpb25zKXtcbiAgICAgICAgdmFyIHJlcSA9IG9wdGlvbnMucmVxdWVzdDtcbiAgICAgICAgdmFyIHJlcyA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgfVxufSJdfQ==