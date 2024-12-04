"use client";
import axios from "axios";

const fetchMeetings = async (email) => {
    const {data, error} = await axios.post("http://localhost:3001/api/meetings" ,{email: email});
    return {data, error}
};

const checkLogin = async (email, name) => {
  const {data, error} = await axios.post("http://localhost:3001/api/checkLogin", {
    email: email,
    name: name
  });
  return {data, error}
}

const fetchMeetingInfo = async (staff_id, student_id) => {
  const {data, error} = await axios.post('http://localhost:3001/api/fetchMeeting', {
    student_id: student_id,
    staff_id: staff_id 
  })
  return {data, error}
}

const insertBlock = async (type, date, start_time, end_time, appointment_duration, recurring_length, title, staff_email, room) => {
  const {data, error} = await axios.post('http://localhost:3001/api/insertBlock', {
    type: type, 
    date: date, 
    start_time: start_time, 
    end_time: end_time, 
    appointment_duration: appointment_duration, 
    recurring_length: recurring_length, 
    title: title, 
    staff_email: staff_email,
    room: room
  })
  return {data, error}
}

const fetchBlocks = async (email) => {
  const {data, error} = await axios.post('http://localhost:3001/api/fetchBlocks', {
    email: email
  })
  return {data, error}
}

const updateBlock = async (block) => {
  const {data, error} = await axios.post('http://localhost:3001/api/updateBlock', {
    type: block.type, 
    date: block.date, 
    start_time: block.start_time, 
    end_time: block.end_time, 
    appointment_duration: block.appointment_duration, 
    recurring_length: block.recurring_length, 
    title: block.title, 
    id: block.id, 
    staff_id: block.staff_id,
    room: block.room
  })
  return {data, error}
}

const deleteBlock = async (id) => {
  const {data, error} = await axios.post('http://localhost:3001/api/deleteBlock', {
    id: id
  })
  console.log("ldr", data, error)
  return {data}
}

const updateCancelEmail = async (text, email) => {
  const {data, error} = await axios.post('http://localhost:3001/api/updateCancelEmail', {
    text: text,
    email: email
  })
  return {data, error}
}

const fetchCancellationEmail = async (email) => {
  const {data, error} = await axios.post('http://localhost:3001/api/fetchCancellationEmail', {
    email: email
  })
  return {data, error}
}

const accountRouting = async (email) => {
  console.log(email)
  const response = await axios.post('http://localhost:3001/api/accountRouting', {
    email: email
  })
  return response;
}

const fetchLecturers = async (text) => {
  const {data, error} = await axios.post('http://localhost:3001/api/findLecturers', {
    text: text
  })
  return {data}
}

const fetchAvailableDates = async (id) => {
  const {data, error} = await axios.post('http://localhost:3001/api/fetchAvailableDates', {
    id: id
  })
  return data;
}

const insertMeeting = async (slot_id, staff_id, email, meeting_purpose) => {
  const {data} = await axios.post('http://localhost:3001/api/insertBooking' , {
    slot_id, 
    staff_id, 
    email, 
    meeting_purpose
  })
  if (data.message === true){
    const res = await fetchAvailableDates(staff_id)
    return res;
  }
}

const fetchOwnMeetings = async (email) => {
  const {data} = await axios.post('http://localhost:3001/api/fetchOwnMeetings', {
    email: email
  })
  return data.data
}

const deleteMeetings = async (meetings) => {
  const {data} = await axios.post('http://localhost:3001/api/deleteMeetings', {
    meetings: meetings
  })
  return data;
  }



export {fetchMeetings, checkLogin, fetchMeetingInfo, insertBlock, fetchBlocks, updateBlock, deleteBlock, updateCancelEmail, fetchCancellationEmail, accountRouting, fetchLecturers, fetchAvailableDates, insertMeeting, fetchOwnMeetings, deleteMeetings}
