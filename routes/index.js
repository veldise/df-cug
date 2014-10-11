
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
