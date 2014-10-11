'use strict';

/**
*
*/

exports.results = function (req, res, callback) {
    
};

////////////////////////////// functions //////////////////////////////

var request = require('request'),
    jsdom = require('jsdom'),
    Iconv = require('iconv').Iconv,
    iconv = new Iconv('EUC-KR', 'UTF-8//TRANSLIT//IGNORE'),
    _ = require('underscore')

require('../lib/date.format.js');

var urlRuliweb = [
    'http://bbs1.ruliweb.daum.net/gaia/do/ruliweb/detail/pc/list?bbsId=G001',
    'pageIndex=1',
    'searchKey=userid',
    'searchValue=Ip7lhKDIGGU0',
    'searchName=%EC%9C%84%EC%95%84%EB%8D%94%EB%8A%A5%EB%A0%A5%EC%9E%90',
    'itemId=2230'
].join('&');

requestUrl(function () {

});

function requestUrl (callback) {
    console.log('request');
    request({ url: urlRuliweb/*, encoding: 'binary'*/ }, function (err, response, body) {
        if (err && response.statusCode !== 200) {
            callback(err || 'Request error.');
        }

        // var buf = new Buffer(body.length);
        // buf.write(body, 0, body.length, 'binary');

        // var newBody = iconv.convert(buf).toString('utf8');

        console.log('jsdom');
        jsdom.env({
            html: body,//newBody,
            scripts: [ 'http://code.jquery.com/jquery.js' ],
            done: function (errors, window) {
                if (errors) {
                    console.error(errors);
                    // return callback(errors);
                }

                var $ = window.$;
                var $trs = $('#mCenter').find('table.tbl.tbl_list_comm > tbody > tr');
                var texts = _.compact(_.map($trs, function (tr) {
                    var subject = $(tr).children('td.subject').text().split(/\s+/).join(''),
                        time = $(tr).children('td.time').text();

                    // parse
                    var cIdx = subject.indexOf(':'),
                        sIdx = subject.lastIndexOf('/'),
                        cIdx2 = subject.lastIndexOf(':'),
                        gIdx = subject.lastIndexOf('(');

                    if (cIdx === -1 || cIdx2 === -1) {
                        return null;
                    }
                    gIdx = (gIdx === -1) ? subject.length-1 : gIdx;

                    var dungeon = subject.substring(cIdx+1, sIdx),
                        rating = subject.substring(cIdx2+1, gIdx);

                    // remove spatial char
                    dungeon = dungeon.split(/\/|\:/).join('');
                    rating = rating.split(/\/|\:/).join('');

                    if (rating.indexOf('급') === -1) {
                        return null;
                    }

                    time = (/\d+\.\d+\.\d+/.test(time)) ? time : (new Date()).format('yy.mm.dd');

                    return {
                        dungeon: dungeon,
                        rating: rating,
                        time: time
                    };
                }));

                callback();
            }
        });
    });
}
