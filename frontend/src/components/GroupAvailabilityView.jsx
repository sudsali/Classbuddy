import React from 'react';

const GroupAvailabilityView = () => {
  const mockData = [
    { date: '2025-04-10', time: '10:00 AM', count: 3 },
    { date: '2025-04-10', time: '11:00 AM', count: 5 },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold">Group Availability</h3>
      <ul>
        {mockData.map((slot, i) => (
          <li key={i}>
            {slot.date} at {slot.time} — {slot.count} people available
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupAvailabilityView;
