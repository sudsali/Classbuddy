import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskCard = ({ task, id, isDragging, onDelete, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: task.title, description: task.description });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
    pointerEvents: isDragging ? 'none' : 'auto',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    position: 'relative',
  };

  const handleSave = () => {
    onEdit(task.id, editData);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle only on this span (optional) */}
      <div {...attributes} {...listeners} style={{ cursor: 'grab', marginBottom: '6px' }}>
        <strong>{task.title}</strong>
      </div>

      {isEditing ? (
        <>
          <input
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            style={{ width: '100%', marginBottom: '6px' }}
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            style={{ width: '100%', marginBottom: '6px' }}
          />
          <button onClick={handleSave} style={{ marginRight: '6px' }}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <p style={{ marginTop: '4px' }}>{task.description}</p>
          <div style={{ marginTop: '6px' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              style={{ marginRight: '6px' }}
            >
              Edit
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              style={{ color: 'red' }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};



const TaskColumn = ({ title, status, tasks, activeTask, onDelete, onEdit }) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div style={{ flex: 1, padding: '10px', minWidth: '300px' }}>
      <h3>{title}</h3>
      <div
        ref={setNodeRef}
        style={{
          backgroundColor: '#f4f4f4',
          borderRadius: '8px',
          padding: '10px',
          minHeight: '300px',
        }}
      >
        <SortableContext
          id={status}
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              id={task.id}
              task={task}
              isDragging={activeTask && activeTask.id === task.id}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div style={{ color: '#aaa', fontStyle: 'italic' }}>Drop tasks here</div>
        )}
      </div>
    </div>
  );
};

const TaskBoard = ({ groupId }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo' });
  const [activeTask, setActiveTask] = useState(null);
  const [columns] = useState(['todo', 'in_progress', 'completed']);

  const fetchTasks = async () => {
    const res = await axios.get(`http://localhost:8000/api/group_tasks/?group_id=${groupId}`, {
      headers: {
        Authorization: `Token ${sessionStorage.getItem('token')}`
      }
    });
    setTasks(res.data);
  };

  useEffect(() => {
    fetchTasks();
  }, [groupId]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    
    const activeTaskId = active.id;
    const activeTask = tasks.find(t => t.id === activeTaskId);
    
    // Get the column we're dragging to
    let targetColumnId;
    if (over.data?.current?.sortable?.containerId) {
      // We're hovering over another task
      const overTaskId = over.id;
      const overTask = tasks.find(t => t.id === overTaskId);
      targetColumnId = overTask.status;
    } else {
      // We're hovering over a column
      targetColumnId = over.id;
    }
    
    // If there's no status change, handle reordering within column
    if (activeTask.status === targetColumnId) {
      // Extract tasks in this column
      const columnTasks = tasks
        .filter(t => t.status === targetColumnId)
        .sort((a, b) => a.position - b.position);
      
      // Find indices
      const oldIndex = columnTasks.findIndex(t => t.id === activeTaskId);
      const newIndex = columnTasks.findIndex(t => t.id === over.id);
      
      // No change in position
      if (oldIndex === newIndex || newIndex === -1) return;
      
      // Reorder the tasks
      const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);
      
      // Prepare updates
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        position: index
      }));
      
      // Optimistically update UI
      const updatedTasks = [...tasks];
      for (const update of updates) {
        const taskIndex = updatedTasks.findIndex(t => t.id === update.id);
        if (taskIndex !== -1) {
          updatedTasks[taskIndex] = { 
            ...updatedTasks[taskIndex], 
            position: update.position 
          };
        }
      }
      setTasks(updatedTasks);
      
      // Update on server
      try {
        for (const update of updates) {
          await axios.patch(
            `http://localhost:8000/api/group_tasks/${update.id}/`,
            { position: update.position },
            {
              headers: {
                Authorization: `Token ${sessionStorage.getItem('token')}`
              }
            }
          );
        }
      } catch (err) {
        console.error("Error updating task positions:", err);
        fetchTasks(); // Revert to server state on error
      }
    } 
    // Handle moving to a different column (status change)
    else {
      const sourceColumnId = activeTask.status;
      
      // Extract tasks from source column (excluding the active task)
      const sourceColumnTasks = tasks
        .filter(t => t.status === sourceColumnId && t.id !== activeTaskId)
        .sort((a, b) => a.position - b.position);
      
      // Extract tasks from target column
      const targetColumnTasks = tasks
        .filter(t => t.status === targetColumnId)
        .sort((a, b) => a.position - b.position);
      
      let newPosition;
      
      // If dropping on another task, insert after that task
      if (over.data?.current?.sortable) {
        const overTaskId = over.id;
        const overTaskIndex = targetColumnTasks.findIndex(t => t.id === overTaskId);
        newPosition = overTaskIndex !== -1 ? overTaskIndex : targetColumnTasks.length;
      } 
      // If dropping directly on column, append to end
      else {
        newPosition = targetColumnTasks.length;
      }
      
      // Prepare updates for source column (compact all positions)
      const sourceUpdates = sourceColumnTasks.map((task, index) => ({
        id: task.id,
        position: index
      }));
      
      // Prepare updates for target column
      const targetUpdates = [
        ...targetColumnTasks.slice(0, newPosition).map((task, index) => ({
          id: task.id,
          position: index
        })),
        { id: activeTaskId, position: newPosition, status: targetColumnId },
        ...targetColumnTasks.slice(newPosition).map((task, index) => ({
          id: task.id,
          position: newPosition + index + 1
        }))
      ];
      
      // Combine all updates for optimistic UI update
      const allUpdates = [...sourceUpdates, ...targetUpdates];
      
      // Optimistically update UI
      const updatedTasks = tasks.map(task => {
        const update = allUpdates.find(u => u.id === task.id);
        if (update) {
          return { 
            ...task, 
            position: update.position,
            status: update.status || task.status
          };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      // Update on server
      try {
        // First move the active task to the new column and position
        await axios.post(
          `http://localhost:8000/api/group_tasks/${activeTaskId}/move/`,
          {
            status: targetColumnId,
            position: newPosition
          },
          {
            headers: {
              Authorization: `Token ${sessionStorage.getItem('token')}`
            }
          }
        );
        
        // Then update source column positions
        for (const update of sourceUpdates) {
          await axios.patch(
            `http://localhost:8000/api/group_tasks/${update.id}/`,
            { position: update.position },
            {
              headers: {
                Authorization: `Token ${sessionStorage.getItem('token')}`
              }
            }
          );
        }
        
        // Then update target column positions (excluding the active task which was already updated)
        for (const update of targetUpdates) {
          if (update.id !== activeTaskId) {
            await axios.patch(
              `http://localhost:8000/api/group_tasks/${update.id}/`,
              { position: update.position },
              {
                headers: {
                  Authorization: `Token ${sessionStorage.getItem('token')}`
                }
              }
            );
          }
        }
        
        // Refresh state from server to ensure consistency
        fetchTasks();
      } catch (err) {
        console.error("Error moving task:", err);
        fetchTasks(); // Revert to server state on error
      }
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
  
    try {
      await axios.delete(`http://localhost:8000/api/group_tasks/${taskId}/`, {
        headers: {
          Authorization: `Token ${sessionStorage.getItem('token')}`
        }
      });
      fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };
  
  const handleEdit = async (taskId, newData) => {
    try {
      await axios.patch(`http://localhost:8000/api/group_tasks/${taskId}/`, newData, {
        headers: {
          Authorization: `Token ${sessionStorage.getItem('token')}`
        }
      });
      fetchTasks();
    } catch (err) {
      console.error("Error editing task:", err);
    }
  };

  return (
    <div>
      <h4>Create a New Task</h4>
      <input
        type="text"
        placeholder="Title"
        value={newTask.title}
        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        style={{ marginRight: '10px' }}
      />
      <input
        type="text"
        placeholder="Description"
        value={newTask.description}
        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        style={{ marginRight: '10px' }}
      />
      <select
        value={newTask.status}
        onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      <button
        onClick={async () => {
          try {
            // Create new task at position 0
            await axios.post(
              'http://localhost:8000/api/group_tasks/',
              {
                ...newTask,
                group: groupId,
                position: 0
              },
              {
                headers: {
                  Authorization: `Token ${sessionStorage.getItem('token')}`
                }
              }
            );
            
            setNewTask({ title: '', description: '', status: 'todo' });
            fetchTasks();
          } catch (err) {
            console.error("Error creating task:", err);
          }
        }}        
        style={{ marginLeft: '10px' }}
      >
        Create Task
      </button>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={({ active }) => {
          const task = tasks.find(t => t.id === active.id);
          setActiveTask(task || null);
        }}
        onDragEnd={async (event) => {
          setActiveTask(null);
          await handleDragEnd(event);
        }} 
        onDragCancel={() => setActiveTask(null)}
      >
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {columns.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              title={status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Completed'}
              tasks={tasks.filter(task => task.status === status).sort((a, b) => a.position - b.position)}
              activeTask={activeTask}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.2)',
              cursor: 'grabbing'
            }}>
              <strong>{activeTask.title}</strong>
              <p style={{ marginTop: '4px' }}>{activeTask.description}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default TaskBoard;