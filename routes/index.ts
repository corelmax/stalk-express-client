var express = require('express');
var router = express.Router();

import * as StalkFactory from "../src/stalk_node";

/* GET home page. */
router.get('/', function (req, res, next) {
  StalkFactory.testCall();

  res.render('index', { title: 'Express' });
});

module.exports = router;
