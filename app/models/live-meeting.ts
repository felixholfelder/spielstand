export interface LiveMeeting {
  team_home: string;
  team_guest: string;
  games_home: number;
  games_guest: number;
}

export interface LiveMeetingsResponse {
  data: LiveMeeting;
}
