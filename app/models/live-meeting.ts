export interface LiveMeeting {
  team_home: string;
  team_guest: string;
  matches_home: number;
  matches_guest: number;
  home_logo_id?: string;
  guest_logo_id?: string;
  is_completed: boolean;
  win_point_decision: string;
  play_mode: string;
}

export interface LiveMeetingsResponse {
  data: LiveMeeting;
}
