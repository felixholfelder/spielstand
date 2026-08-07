export interface Meeting {
  date: string;
  live: boolean;
  team_home: string;
  team_away: string;
  team_home_id: string;
  team_away_id: string;
  meeting_id: string;
  is_meeting_completed: string;
}

export interface MeetingGroup {
  [date: string]: Meeting[];
}

export interface MeetingsResponse {
  data: {
    meetings_excerpt: {
      meetings: MeetingGroup[];
    };
  };
}
