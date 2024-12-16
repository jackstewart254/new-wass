"use client";
import axios from "axios";

const encryptData = async (data) => {
  console.log(data)
  const response = await fetch("api/encrypt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  const result = (await response.json()).encryptedData;
  return result
}


const apiConnection = async (payload, func) => {

  const res = await axios.get('/api/getAccess', {
    withCredentials: true,
  });
    const domain = process.env.NEXT_PUBLIC_DOMAIN + "/api/sanumberone";
    const method = await encryptData(func)
    const body = { payload: payload, method: method };
    const headers = {
      Authorization: `Bearer ${res.data.accessToken}`,
      'Content-Type': 'application/json',
    };
    
    switch (func) {
      case "authenticate":
        try {
          console.log("authenticate")
          // validate the input
          // if access/refresh/email/name = null = throw return {allow: false}.
          // have this function run in the popup screen as that screen is always on the DOM.  
          const response = await axios.post(domain, body, { headers });
          const admin = await axios.get('/api/getAdmin', {
            withCredentials: true,
          });
          console.log("AUTHENTICATED", response)
          if (response.data.allG === false) {
            if (admin.data.admin === null) {
                await axios.post('/api/setCookie', {method: "admin", value: response.data.payload.admin})
            } else {
              if (admin.data.admin !== response.data.payload.admin) {
                await axios.post('/api/setCookie', {method: "admin", value: response.data.payload.admin})
              }
            }
            if (response.data.payload.newToken === true) {
              await axios.post('/api/setCookie', {method: "access", value: response.data.payload.token})
            };
            return {allow: true, role: admin.data.admin};
          } else {
            return {allow: true, role: admin.data.admin};
          }
        } catch (error) {
          return {allow: false}
        }
          
      case "insertBlock":
        try {
          const response = await axios.post(domain, body, { headers });
          console.log(response.data.payload);
          return response.data.payload;
        } catch {
          return {instances: [], blocks: []}
        }
      case "fetchBMI":
        try {
          const response = await axios.post(domain, body, { headers });
          return response.data.payload
        } catch {
          return {instances: [], blocks: [], meetings: []}
        }
      }
  
}

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



export {fetchMeetings, checkLogin, fetchMeetingInfo, insertBlock, fetchBlocks, updateBlock, deleteBlock, updateCancelEmail, fetchCancellationEmail, accountRouting, fetchLecturers, fetchAvailableDates, insertMeeting, fetchOwnMeetings, deleteMeetings, encryptData, apiConnection}
