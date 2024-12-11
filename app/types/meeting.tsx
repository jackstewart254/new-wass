type Meeting = {
  id: number;
  created_at: Date;
  staff_id: string;
  student_id: string;
  start_time: number;
  end_time: number;
  meeting_purpose: string;
};

export default Meeting;
