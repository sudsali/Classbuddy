import React from 'react';
import TaskCard from './TaskCard';

const TaskColumn = ({ title, tasks }) => {
  return (
    <div className="w-1/3 p-2">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="bg-gray-100 rounded p-2 min-h-[400px]">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default TaskColumn;