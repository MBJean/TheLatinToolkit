const graphql = require('graphql')
const { GraphQLList, GraphQLString } = graphql
const TextType = require('../types/text_type')
const Text = require('../../persistence/texts')

const AUTHORS = ['ovid', 'vergil']
const TITLES = ['amores', 'metamorphoses']

const VALID_TEXTS = {
  ovid: ['amores', 'metamorphoses'],
  vergil: ['aeneid']
}

const inputGuard = function(author, title, book, poem) {
  const poemFormatIsLegitimate =
    poem == null || poem == 'ep' || parseInt(poem)
  const bookFormatIsLegitimate =
    book == null || parseInt(book)
  return poemFormatIsLegitimate &&
         bookFormatIsLegitimate &&
         !!VALID_TEXTS[author] &&
         VALID_TEXTS[author].includes(title)
}

const Texts = {
  type: TextType,
  args: {
    author: { type: GraphQLString },
    title: { type: GraphQLString },
    book: { type: GraphQLString },
    poem: { type: GraphQLString },
  },
  resolve: async (source, { author, title, book, poem }) => {
    const isInputSafe = inputGuard(author, title, book, poem)
    if (!isInputSafe) return {
      xml: null, errors: ['input guard']
    }
    try {
      const text = await Text.search(author, title)
      if (!text) {
        return {
          xml: null,
          errors: ['no match on text']
        }
      }
      let query = '//'
      if (book) {
        query += `div[@type=\"textpart\" and @subtype=\"book\" and @n=\"${book}\"]`
      }
      if (poem) {
        query += `/div[@type=\"textpart\" and @subtype=\"poem\" and @n=\"${poem}\"]`
      }
      const response = await Text.query(text.id, query)
      if (!response) {
        return {
          xml: null,
          errors: ['no match on query']
        }
      }
      return {
        xml: response,
        errors: null,
      }
    } catch(error) {
      return {
        xml: null,
        errors: ['unknown error']
      }
    }
  },
}

module.exports = Texts
