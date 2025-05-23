import React from 'react';

const TaskCard = ({ task }) => {
  return (
    <div className="p-3 bg-white shadow rounded mb-2">
      <h4 className="text-md font-bold">{task.title}</h4>
      <p className="text-sm text-gray-600">{task.description}</p>
    </div>
  );
};

export default TaskCard;