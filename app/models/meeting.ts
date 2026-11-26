export interface Meeting {
  date: string;
  live: boolean;
  team_home: string;
  team_away: string;
  team_home_id: string;
  team_away_id: string;
  meeting_id: string;
  round_name: string;
  round_type: string;
  is_meeting_complete: string;
  has_nu_live_push_data: string;
  matches_won: string;
  matches_lost: string;
  season: string;
  team_home_club_logo_id?: string;
  team_away_club_logo_id?: string;
  play_mode: string;
}

export interface MeetingGroup {
  roundType: string;
  meetings: Meeting[];
}

export interface MeetingResponseGroup {
  [date: string]: Meeting[];
}

export interface MeetingsResponse {
  data: {
    head_infos: {
      club_logo_id: string;
      season: string;
      play_mode: string;
    };
    meetings_excerpt: {
      meetings: MeetingResponseGroup[];
    };
  };
}
