import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AvailabilitySelector = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlot, setTimeSlot] = useState('');

  const handleSubmit = () => {
    // Send to backend using axios
    alert(`Selected ${selectedDate.toDateString()} at ${timeSlot}`);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold">Select Your Availability</h3>
      <Calendar onChange={setSelectedDate} value={selectedDate} />
      <input
        type="time"
        value={timeSlot}
        onChange={(e) => setTimeSlot(e.target.value)}
        className="mt-2 border p-1"
      />
      <button
        onClick={handleSubmit}
        className="block mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Save Availability
      </button>
    </div>
  );
};

export default AvailabilitySelector;
