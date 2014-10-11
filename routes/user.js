'use strict';
/*
 * GET users listing.
 */
var exec = require('child_process').exec;

exports.list = function (req, res) {
    var postno = req.params.postno,
        seps = req.query.seps || [ '/' ];

    if (!postno) {
        res.status(404).send('missing postno.');
        return;
    }

    requestComments(postno, function (err, names, comments) {
        if (err) {
            res.status(400).send(err);
            return;
        }

        res.send(parseList(names, comments, seps));
    });
};

exports.version = function (req, res) {
    exec('git describe --tag', function (err, stdout) {
        if (err) {
            return res.send(404, err);
        }
        res.send(stdout);
    });
};

////////////////////////////// functions //////////////////////////////

var request = require('request'),
    jsdom = require('jsdom'),
    Iconv = require('iconv').Iconv,
    iconv = new Iconv('EUC-KR', 'UTF-8//TRANSLIT//IGNORE'),
    _ = require('underscore');

function requestComments (no, callback) {
    request({
        url: 'http://www.fancug.com/bbs/view.php?id=dnf&no=' + no,
        encoding: 'binary'
    }, function (err, response, body) {
        if (err && response.statusCode !== 200) {
            callback(err || 'Request error.');
        }

        var buf = new Buffer(body.length);
        buf.write(body, 0, body.length, 'binary');

        var newBody = iconv.convert(buf).toString('utf8');

        jsdom.env({
            html: newBody,
            scripts: [ 'http://code.jquery.com/jquery.js' ],
            done: function (errors, window) {
                if (errors) {
                    console.error(errors);
                    // return callback(errors);
                }

                var $ = window.$;
                var $cmt = $('table.bbs_list').eq(1);

                var $info2 = $cmt.find('td.view_info2 > .view_name > b > span:first-child');
                var $comment = $cmt.find('td.view_comment');

                var names = _.map($info2, function (el) {
                    return $(el).text().trim();
                });
                var comments = _.map($comment, function (el) {
                    return $(el).text();
                });

                callback(null, names, comments);
            }
        });
    });
}

/**
* 분석 내용
* 1. 캐릭터-커그닉 매칭 리스트
* ex) 뮤세린 - 유테디어
*
* 2. 유저 정보
* ex) 유테디어: 우수길드원, 등록 캐릭터 4개
*
* 3. 총합 정보(길마/우수/일반 각각 수, 캐릭터 수)
* 길마: 1 명
* 부길마: 2 명
* 우수길드원: xx 명
* 일반길드원: xx 명
*/

function parseList (names, comments, seps) {
    var matchupList = [];
    var memberInfoList = [];
    var sumInfo = {
        master: 0,
        sub_master: 0,
        ex_member: 0,
        gen_member: 0
    };
    var wrongCommants = [];

    // 중복 제거
    var oList = {};
    _.each(comments, function (str, i) {
        var sp = str;
        _.each(seps, function (sep) {
            sp = _.flatten(sp.split(sep));
        });
        sp = sp.trim(); 

        // get cug name
        var cugName = sp[0],
            list = _.compact(sp.slice(1));

        // check charactor name length
        // var wrongItem = _.find(list, function (item) { return item.length > 12; });
        // if (wrongItem) {
        //  wrongCommants.push({ cugName: names[i], comments: str });
        // }

        // split failed
        if (!list.length) {
            wrongCommants.push({ writer: names[i], comments: str });
            return;
        }

        oList[cugName] = { name: names[i], list: list };
    });

    _.each(oList, function (item, cugName) {
        var list = item.list,
            writer = item.name;

        var last = list[list.length-1],
            rank = '일반길드원';

        // set rank
        if (last.indexOf('우수') !== -1) {
            sumInfo.ex_member += 1;
            rank = '우수길드원';
            list = list.slice(0, -1);
        }
        else if (last.indexOf('부길마') !== -1 || last.indexOf('부길드마스터') !== -1) {
            sumInfo.sub_master += 1;
            rank = '부길드마스터';
            list = list.slice(0, -1);
        }
        else if (last.indexOf('길마') !== -1 || last.indexOf('길드마스터') !== -1) {
            sumInfo.master += 1;
            rank = '길드마스터';
            list = list.slice(0, -1);
        }
        else if (last.indexOf('일반') !== -1) {
            sumInfo.gen_member += 1;
            // rank = '일반';
            list = list.slice(0, -1);
        }
        else {
            sumInfo.gen_member += 1;
        }

        _.each(list, function (name) {
            matchupList.push({ charName: name, cugName: cugName });
        });

        memberInfoList.push({
            cugName: cugName,
            chars: list.join(', '),
            charLen: list.length,
            rank: rank,
            writer: writer
        });
    });

    // matchupList.sort(function (l, r) {
    //     if (l.charName < r.charName) return -1;
    //     if (l.charName > r.charName) return 1;
    //     return 0;
    // });

    // memberInfoList = memberInfoList.sort(function (l, r) {
    //     if (l.rank < r.rank) return -1;
    //     if (l.rank > r.rank) return 1;
    //     return 0;
    // });

    return {
        matchup: matchupList,
        members: memberInfoList,
        wrongs: wrongCommants,
        total: sumInfo
    };
}
