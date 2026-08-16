export interface LiveMeeting {
  team_home: string;
  team_guest: string;
  matches_home: number;
  matches_guest: number;
}

export interface LiveMeetingsResponse {
  data: LiveMeeting;
}
