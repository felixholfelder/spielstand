export interface LiveMeeting {
  team_home: string;
  team_guest: string;
  matches_home: number;
  matches_guest: number;
  home_logo_id?: string;
  guest_logo_id?: string;
  is_completed: boolean;
  play_mode: string;
}

export interface LiveMeetingsResponse {
  data: LiveMeeting;
}
