export interface Meeting {
  date: string;
  live: boolean;
  team_home: string;
  team_away: string;
  team_home_id: string;
  team_away_id: string;
  meeting_id: string;
  round_type: string;
  is_meeting_complete: string;
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
    meetings_excerpt: {
      meetings: MeetingResponseGroup[];
    };
  };
}
