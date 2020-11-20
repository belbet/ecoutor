const {analyseResults, calculateProbabilities} = require("soccer-predictor")
const matches = require('./matches')

/*
 * Get probability
 */
module.exports.getProbability = (req, res, next) => {
  var filtered = matches.getMatches().filter(match => !isNaN(parseInt(match.Score.split("-")[0])))
  const teams = analyseResults(filtered, matches.getMatchDetails) 
  var teamHomeId = parseInt(req.params.teamHomeId)
  var teamAwayId = parseInt(req.params.teamAwayId)
  const probabilities = calculateProbabilities(teams[teamHomeId], teams[teamAwayId])
  res.json({probabilities: probabilities.result})
}
