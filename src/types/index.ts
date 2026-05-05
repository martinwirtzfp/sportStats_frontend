export interface User {
  userId: number
  username: string
  email: string
  token: string
}

export interface Competition {
  id: number
  name: string
  apiId: number
  type: string
  season: string
  logoUrl: string
}

export interface Team {
  id: number
  name: string
  shortName: string
  logoUrl: string
  apiId: number
  competitionId: number
  competitionName: string
}

export interface Match {
  id: number
  homeTeamId: number
  awayTeamId: number
  homeTeamName: string
  awayTeamName: string
  homeTeamLogo: string
  awayTeamLogo: string
  matchDate: string
  status: string
  homeGoals: number
  awayGoals: number
  htHomeGoals: number
  htAwayGoals: number
  competitionId: number
  competitionName: string
  season: string
}

export interface TeamStats {
  teamId: number
  teamName: string
  lastN: number
  totalMatches: number
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
  cleanSheets: number
  winPercentage: number
  drawPercentage: number
  lossPercentage: number
  goalsScoredAvg: number
  goalsConcededAvg: number
  homeWins: number
  homeDraws: number
  homeLosses: number
  awayWins: number
  awayDraws: number
  awayLosses: number
}

export interface Probability1X2 {
  homeWin: number
  draw: number
  awayWin: number
}

export interface RiskAnalysis {
  homeTeamId: number
  homeTeamName: string
  awayTeamId: number
  awayTeamName: string
  lastN: number
  probability1X2: Probability1X2
  overPercentage: number
  underPercentage: number
  avgTotalGoals: number
  bttsYesPercentage: number
  bttsNoPercentage: number
  halfTimeProbability: Probability1X2
}

export interface HeadToHead {
  team1Id: number
  team1Name: string
  team2Id: number
  team2Name: string
  totalMatches: number
  team1Wins: number
  draws: number
  team2Wins: number
  team1GoalsAvg: number
  team2GoalsAvg: number
  avgTotalGoals: number
  bttsCount: number
  bttsPercentage: number
  recentMatches: Match[]
}

export interface UserFavorite {
  id: number
  teamId: number
  teamName: string
  teamLogo: string
}
