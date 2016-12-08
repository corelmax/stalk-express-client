"use strict";
var express = require('express');
var router = express.Router();
const StalkFactory = require("../src/stalk_node");
/* GET home page. */
router.get('/', function (req, res, next) {
    StalkFactory.testCall();
    res.render('index', { title: 'Express' });
});
module.exports = router;
