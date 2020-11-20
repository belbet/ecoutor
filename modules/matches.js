var matches = []
var categories = []

module.exports.setMatches = (matches) => {
    this.matches = matches
}

module.exports.getMatches = () => {
   return this.matches
}

module.exports.setFootballCategories = (categories) => {
    this.categories = categories.filter(c => c < 10000000)
}

module.exports.getFootballCategories = () => {
    return this.categories
}