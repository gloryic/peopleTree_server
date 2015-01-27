express = require 'express'
router = express.Router()

router.get '/', (req, res) ->
  res.render 'step3', { title: 'Express' }

module.exports = router;
