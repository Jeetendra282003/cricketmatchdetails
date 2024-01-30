const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const databasePath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const intializeDbAndServer = async (request, response) => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

intializeDbAndServer()

const convertPlayerDbObjectToRsponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertCricketDetailsDbObjectToRsponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/players/', async (request, response) => {
  const playerQuery = `SELECT * FROM player_details;`
  const playerArray = await db.all(playerQuery)
  response.send(
    playerArray.map(eachPlayer =>
      convertPlayerDbObjectToRsponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT  * FROM player_details WHERE player_id=${playerId};`
  const player = await db.get(getPlayerQuery)
  response.send(convertPlayerDbObjectToRsponseObject(player))
})

app.put('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`
  const matchDetails = await db.get(getMatchDetailsQuery)
  response.send(convertCricketDetailsDbObjectToRsponseObject(matchDetails))
})

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`
  const playerMatches = await db.all(getPlayerMatchQuery)
  response.send(
    playerMatches.map(eachPlayer =>
      convertCricketDetailsDbObjectToRsponseObject(eachPlayer),
    ),
  )
})

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `SELECT player_match_score.player_id AS playerId,player_name AS playerName FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE match_id=${matchId};`
  const matchPlayers = await db.all(getMatchPlayersQuery)
  response.send(matchPlayers)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getMatchPlayersQuery = `SELECT player_details.player_id AS PlayerId,player_details.player_name AS playerName,SUM(player_match_score.score) AS totalScore,SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_details.player_id=${playerId};`
  const playerMatchDetails = await db.get(getMatchPlayersQuery)
  response.send(playerMatchDetails)
})

module.exports = app
