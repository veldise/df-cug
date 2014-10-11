'use strict';

/**
*
*/

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var DfToday = mongoose.model('DfToday', {
    dungeon: String,
    rating: String,
    time: Number
});

exports.read = function (req, res) {
    var id = req.params._id;

    if (id) {
        DfToday.findById(id, function (err, dft) {
            if (err) {
                return res.send(400, err);
            }
            if (!dft) {
                return res.send(404, 'not found: ' + id);
            }

            res.send(dft);
        });
    }
    else {
        DfToday.find(function (err, dfts) {
            if (err) {
                return res.send(400, err);
            }

            res.send(dfts);
        });
    }
};

exports.create = function (req, res) {
    var newDft = new DfToday(req.body);
    newDft.save(function (err) {
        if (err) {
            return res.send(400, err);
        }
        DfToday.findOne(req.body, function (err, dft) {
            if (err) {
                return res.send(401, err);
            }

            res.send(dft);
        });
    });
};

exports.update = function (req, res) {
    var id = req.params._id;
    var data = {
        dungeon: req.body.dungeon,
        rating: req.body.rating,
        time: req.body.time
    };
    console.log(data);

    DfToday.findByIdAndUpdate(id, { $set: data }, function (err, dft) {
        if (err) {
            return res.send(400, err);
        }
        if (!dft) {
            return res.send(404, 'not found: ' + id);
        }

        res.send(dft);
    });
};

exports.delete = function (req, res) {
    var id = req.params._id;

    DfToday.findByIdAndRemove(id, function (err, dft) {
        if (err) {
            return res.send(400, err);
        }
        if (!dft) {
            return res.send(404, 'not found: ' + id);
        }

        res.send(dft);
    });
};
