const express       = require('express');
const router        = express.Router();

/* GET main page. */
router.get('/', (req, res) =>{
    var viewfile = "home"; // views/home.pug
    var pageData = {
        "pagetitle": "FalaQui Server"
    };

    res.render(viewfile, pageData);
});

module.exports = router;