import * as Tone from 'tone'
import _ from 'lodash'
import toLetter from '../toLetter.js'
import normalize from '../normalize.js'
import settings from '../settings.js'

const createSynth = () => {
  const synth = new Tone.Synth().toMaster()
  return synth
}

const playNote = ({
  note,
  octave,
  volume,
  time = Tone.context.currentTime,
  synth
}) => {
  // If time is not provided, we want to play the note right now - use currentTime.
  // If time is provided,
  // if it is in the past (smaller than currentTime),
  // don't play the note.
  // Otherwise play the note.
  if (time >= Tone.context.currentTime) {
    const normalizedVolume = normalize.volume(volume)
    const letter = toLetter(note + octave * 12, true, true)
    synth.triggerAttackRelease(letter, '32n', time, normalizedVolume)
  }
}

const soundAPI = () => {
  const synths = _.range(settings.chainChannels).map(createSynth)

  Tone.Transport.bpm.value = settings.bpm
  Tone.Transport.start(settings.startOffset)

  const songSequencePool = []

  const stopSequence = () => {
    _.range(songSequencePool.length).forEach(() => {
      const s = songSequencePool.pop()
      s.stop()
    })
  }

  const makeSequences = ({ songs, chains, phrases }) => {
    const sequences = _.mapValues(songs, song =>
      makeSequence({ song, chains, phrases })
    )
    return sequences
  }

  const makeSequence = ({ song, chains, phrases }) => {
    // create an array of note positions. There's a lot going on here,
    // but the gist: create an array of all the notes, but remove nulls from the end,
    // so that we can make a Tone Sequence that is the right length and no more.
    // This is good for performance.

    // For matrixLength cubed (chains * phrases * notes),
    const notePositions = _(_.range(Math.pow(settings.matrixLength, 3)))
      .map(index => {
        // Get the chain, phrase and note positions by using base math.
        const [chainPosition, phrasePosition, notePosition] = _.padStart(
          index.toString(settings.matrixLength),
          3,
          0
        )
          .split('')
          .map(d => parseInt(d, settings.matrixLength))

        // Get the chain index for this position.
        const chainIndex = _.get(song, chainPosition)

        // Get the chain.
        const chain = _.get(chains, chainIndex)

        // Get the phrase indices for this position, e.g. { 0: 0, 1: 11, 2: 2 }
        const phrasesIndices = _.get(chain, phrasePosition)

        // For each channel,
        return (
          _.range(settings.chainChannels)
            .map(channel => {
              // Get the phrase index for this channel.
              const phraseIndex = _.get(phrasesIndices, channel)
              let result

              // If the phrase index exists,
              if (!_.isNil(phraseIndex)) {
                // get the phrase assigned to this channel.
                const phrase = _.get(phrases, phraseIndex)

                // Get the note element for this position.
                const noteElement = _.get(phrase, notePosition)

                // If we have a note,
                if (!_.isNil(noteElement)) {
                  // add it to the result.
                  result = {
                    channel,
                    noteElement
                  }
                }
              }
              return result
            })
            // Only keep non-null elements.
            .filter(d => d)
        )
      })
      // NOW we can drop from right.
      .dropRightWhile(_.isEmpty)
      .value()

    const sequence = new Tone.Sequence(
      (time, position) => {
        notePositions[position].forEach(d => {
          const { channel, noteElement } = d
          playNote({
            ...noteElement,
            time: time,
            synth: synths[channel]
          })
        })
      },
      _.range(notePositions.length),
      settings.subdivision
    )

    return sequence
  }

  const playSequence = sequences => (number, loop = false) => {
    // Get this sequence.
    const sequence = _.get(sequences, number)

    // If the sequence exists,
    if (!_.isNil(sequence)) {
      // stop all sequences.
      stopSequence()

      // Loop it if requested.
      sequence.loop = loop

      // Start it,
      sequence.start()

      // and add it to the pool.
      songSequencePool.push(sequence)
    }
  }

  return {
    playSequence,
    makeSequences,
    stopSequence
  }
}

export { createSynth, playNote }

export default soundAPI
