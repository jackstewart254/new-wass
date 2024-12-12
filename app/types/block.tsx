type Block = {
  id: string;
  created_at: Date;
  staff_id: string;
  type: boolean;
  date: Date;
  appointment_duration: number;
  recurring_length: number;
  title: string;
  start_time: number;
  end_time: number;
  room: string;
};

export default Block;
