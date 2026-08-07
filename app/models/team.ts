export interface Team {
  season: string;
  team_id: string;
  team_name: string;
  group_id: string;
  league_name: string;
  team_organisation_short: string;
}

export interface TeamsResponse {
  data: {
    teams_list: {
      club_teams: Team[];
    };
  };
}
