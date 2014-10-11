'use strict';
/**
*
*/
var _ = require('underscore'),
    async = require('async');

var request = require('request'),
    jsdom = require('jsdom'),
    Iconv = require('iconv').Iconv,
    iconv = new Iconv('EUC-KR', 'UTF-8//TRANSLIT//IGNORE');

require('./lib/date.format.js');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var alarm = require('./alarm');

var DfToday = mongoose.model('DfToday', {
    dungeon: String,
    rating: String,
    time: Number
});

var urlRuliweb = [
    'http://bbs1.ruliweb.daum.net/gaia/do/ruliweb/detail/pc/list?bbsId=G001',
    'pageIndex=1',
    'searchKey=subject',
    'itemId=2230',
    'sortKey=depth',
    'searchValue=%EC%A7%84%EA%B3%A0%EB%8D%98'
].join('&');

var run = function () {
    getTodayInfo(urlRuliweb, function (err, data) {
        if (err) {
            console.error(err);
            return;
        }
        async.eachSeries(data, function (row, cb) {
            DfToday.findOne({ time: row.time }, function (err, dft) {
                if (err) {
                    return cb(err);
                }

                if (dft) {
                    cb();
                }
                else {
                    log('insert:', row);
                    var newDft = new DfToday(row);
                    newDft.save(cb);
                }
            });
        }, function done (err) {
            if (err) {
                console.error(err);
            }
            log('update done.');
            // process.exit(0);
        });
    });
};

if (process.argv[2] === 'run') {
    run();
}
else {
    alarm.every('08:50', run);
    alarm.every('11:50', run);
}

////////////////////////////// functions //////////////////////////////

// var defDgList = [ '왕유', '빌마', '비명', '노페', '유열', '레쉬', '카사' ];
// var defRtList = [ '최상급', '최하급', '상급', '중급', '하급', ];

function getTodayInfo (url, callback) {
    request({ url: url/*, encoding: 'binary'*/ }, function (err, response, body) {
        if (err || response.statusCode !== 200) {
            return callback(err || 'Request error.');
        }

        // var buf = new Buffer(body.length);
        // buf.write(body, 0, body.length, 'binary');

        // var newBody = iconv.convert(buf).toString('utf8');

        jsdom.env({
            html: body,//newBody,
            scripts: [ 'http://code.jquery.com/jquery.js' ],
            done: function (errors, window) {
                if (errors) {
                    // console.error(errors);
                    // return callback(errors);
                }

                var $ = window.$;
                var $trs = $('#mCenter').find('table.tbl.tbl_list_comm > tbody > tr');
                var texts = _.compact(_.map($trs, function (tr) {
                    var subject = $(tr).children('td.subject').text().trim(),
                        time = $(tr).children('td.time').text();

                    var m = /진고던(.+)등급(.+)/.exec(subject);
                    if (!m) {
                        return null;
                    }

                    var dungeon = m[1].split(/[^(가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s)]/gi).join('')
                                    .replace('아이템', '')
                                    .replace('상점', '')
                                    .trim();
                    var rating = m[2].split(/[^(가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s)]/gi).join('')
                                    .replace('아이템', '')
                                    .replace('상점', '')
                                    .trim();
                    console.log(subject.slice(0, -5).trim());
                    console.log({
                        dungeon: dungeon,
                        rating: rating
                    });
                    console.log('');

                    time = (/\d+\.\d+\.\d+/.test(time)) ? time : (new Date()).format('yy.mm.dd');
                    var sp = time.split('.');
                    var date = new Date(('20'+sp[0])*1, (sp[1]*1)-1, sp[2]*1);

                    return {
                        dungeon: dungeon,
                        rating: rating,
                        time: date.getTime()
                    };
                }));

                callback(null, texts);
            }
        });
    });
}

function log (str) {
	var now = new Date();
	console.log([ '[', now.format('yyyy/mm/dd HH:MM:dd'), ']', ' ', str ].join(''));
}

