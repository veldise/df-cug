
/*
 * GET home page.
 */

var path = require('path');

exports.index = function(req, res){
    res.render('index');
};
exports.table = function(req, res){
    res.render('my_table');
};
exports.dftoday = function(req, res){
    res.render('df_today');
};

exports.template = function (req, res) {
    if (req.url.indexOf('..') !== -1) {
        res.status(404).send('error');
        return;
    }

    res.sendfile(path.join(rootpath, req.url));
};
