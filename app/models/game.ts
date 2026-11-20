export class Game {
    winner: string;
    teamHome: string;
    teamAway: string;
    scoreHome: number;
    scoreAway: number;
    winnerLogoId?: string | null;

    constructor(winner: string, teamHome: string, teamAway: string, scoreHome: number, scoreAway: number, winnerLogoId?: string) {
        this.winner = winner;
        this.teamHome = teamHome;
        this.teamAway = teamAway;
        this.scoreHome = scoreHome;
        this.scoreAway = scoreAway;
        this.winnerLogoId = winnerLogoId;
    }

    isDraw(): boolean {
        return this.scoreHome === this.scoreAway;
    }
}
