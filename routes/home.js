const express = require("express");
const router = express.Router();


//hime page router
router.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

module.exports = router;
