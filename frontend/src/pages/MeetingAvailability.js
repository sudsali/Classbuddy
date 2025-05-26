import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './MeetingPlanner.css';

const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i); // 9am to 9pm
const SLOT_DURATION = 30; // minutes
const SLOTS_PER_HOUR = 60 / SLOT_DURATION;
const TOTAL_SLOTS = HOURS.length * SLOTS_PER_HOUR;

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatTime(hour, slot) {
  const mins = slot * SLOT_DURATION;
  const h = hour + Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const MeetingAvailability = () => {
  const { meetingId } = useParams();
  const [groupMembers, setGroupMembers] = useState([]);
  const [overlapGrid, setOverlapGrid] = useState([]); // [day][slot] = count
  const [selected, setSelected] = useState({}); // {"day-slot": true}
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(true);
  const gridRef = useRef(null);
  const [days] = useState(getNext7Days());

  // Fetch group members and all availabilities
  useEffect(() => {
    async function fetchData() {
      // 1. Get meeting info (to get groupId)
      const meetingRes = await axios.get(`/api/meetings/${meetingId}/`);
      const groupId = meetingRes.data.study_group.id;
      // 2. Get group members
      const membersRes = await axios.get(`/api/study-groups/${groupId}/members/`);
      setGroupMembers(membersRes.data);
      // 3. Get all availabilities for this meeting
      const availRes = await axios.get(`/api/meetings/${meetingId}/availability/`);
      // Build overlap grid
      const grid = Array(7).fill(0).map(() => Array(TOTAL_SLOTS).fill(0));
      availRes.data.forEach(slot => {
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        for (let d = 0; d < 7; d++) {
          const day = days[d];
          for (let s = 0; s < TOTAL_SLOTS; s++) {
            const slotStart = new Date(day);
            slotStart.setHours(HOURS[0] + Math.floor(s / SLOTS_PER_HOUR), (s % SLOTS_PER_HOUR) * SLOT_DURATION, 0, 0);
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + SLOT_DURATION);
            if (slotStart < end && slotEnd > start) {
              grid[d][s]++;
            }
          }
        }
      });
      setOverlapGrid(grid);
    }
    fetchData();
  }, [meetingId, days]);

  // Handle drag selection
  const handleMouseDown = (d, s) => {
    setDragging(true);
    const key = `${d}-${s}`;
    setDragValue(!selected[key]);
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const handleMouseEnter = (d, s) => {
    if (dragging) {
      const key = `${d}-${s}`;
      setSelected(prev => ({ ...prev, [key]: dragValue }));
    }
  };
  const handleMouseUp = () => setDragging(false);

  // Submit selected slots
  const handleSubmit = async () => {
    // Convert selected slots to time ranges
    const slots = Object.entries(selected)
      .filter(([_, v]) => v)
      .map(([key]) => {
        const [d, s] = key.split('-').map(Number);
        const day = days[d];
        const slotStart = new Date(day);
        slotStart.setHours(HOURS[0] + Math.floor(s / SLOTS_PER_HOUR), (s % SLOTS_PER_HOUR) * SLOT_DURATION, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + SLOT_DURATION);
        return { start_time: slotStart.toISOString(), end_time: slotEnd.toISOString() };
      });
    // POST all slots (could be batched or one-by-one)
    await axios.post(`/api/meetings/${meetingId}/availability/bulk/`, { slots });
    window.location.reload();
  };

  // Color intensity for overlap
  const getCellColor = (count) => {
    if (count === 0) return '#fff';
    const max = groupMembers.length || 1;
    const percent = count / max;
    const base = 220 - Math.round(percent * 120); // from light to dark
    return `rgb(${base},${255-base},${base})`;
  };

  return (
    <div className="meeting-availability" onMouseUp={handleMouseUp}>
      <h2 style={{textAlign:'center'}}>Select Your Availability</h2>
      <div style={{overflowX:'auto'}}>
        <table className="when2meet-grid" ref={gridRef} style={{margin:'0 auto',borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th></th>
              {days.map((d, i) => (
                <th key={i} style={{padding:'4px 8px',fontWeight:'bold'}}>
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: TOTAL_SLOTS }).map((_, s) => (
              <tr key={s}>
                <td style={{fontSize:'0.9em',textAlign:'right',paddingRight:4}}>{formatTime(HOURS[0], s)}</td>
                {days.map((_, d) => {
                  const key = `${d}-${s}`;
                  const overlap = overlapGrid[d]?.[s] || 0;
                  const isSelected = selected[key];
                  return (
                    <td
                      key={key}
                      style={{
                        width: 24,
                        height: 24,
                        background: isSelected ? '#1976d2' : getCellColor(overlap),
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseDown={() => handleMouseDown(d, s)}
                      onMouseEnter={() => handleMouseEnter(d, s)}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{textAlign:'center',marginTop:24}}>
        <button className="btn-primary" onClick={handleSubmit}>Submit Availability</button>
      </div>
    </div>
  );
};

export default MeetingAvailability; 