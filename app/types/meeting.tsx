type Meeting = {
  id: number;
  created_at: Date;
  staff_id: string;
  student_id: string;
  start_time: Date;
  end_time: Date;
  meeting_purpose: string;
};

export default Meeting;
