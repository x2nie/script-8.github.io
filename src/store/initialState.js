import _ from 'lodash'
import screenTypes from '../utils/screenTypes.js'
import blank from '../utils/blank.js'

const initialState = {
  // screen: screenTypes.CHAIN,
  // screen: screenTypes.PHRASE,
  // screen: screenTypes.SONG,
  screen: screenTypes.BOOT,
  // screen: screenTypes.SHELF,
  // screen: screenTypes.WORLD,
  booted: false,
  gist: {},
  game: blank,
  token: {},
  nextAction: null,
  sfxs: [],
  sprites: {},
  rooms: [],
  phrases: {},
  chains: {},
  songs: {},
  tutorial: false,
  newUser: null,
  sound: false,
  shelving: false
}

export default initialState
