import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const MeetingPlanner = () => {
  const [value, setValue] = useState(new Date());

  return (
    <div>
      <h2>Meeting Planner</h2>
      <Calendar onChange={setValue} value={value} />
      <p>Selected date: {value.toDateString()}</p>
    </div>
  );
};

export default MeetingPlanner;
