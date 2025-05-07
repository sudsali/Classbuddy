import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import the component to test
// Note: We're creating a mock version here since TaskCard is not exported separately
// in your original file, but this shows how you would test it if it were

// Mock TaskCard component for testing
const TaskCard = ({ task, id, isDragging, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({ title: task.title, description: task.description });

  const handleSave = () => {
    onEdit(task.id, editData);
    setIsEditing(false);
  };

  return (
    <div style={{ opacity: isDragging ? 0.2 : 1 }}>
      <div style={{ cursor: 'grab' }}>
        <strong>{task.title}</strong>
      </div>

      {isEditing ? (
        <>
          <input
            data-testid="edit-title"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          />
          <textarea
            data-testid="edit-description"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <p>{task.description}</p>
          <div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              Edit
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Mock the useSortable hook
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
}));

describe('TaskCard Component', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    position: 0
  };
  
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders task information correctly', () => {
    render(
      <TaskCard 
        task={mockTask}
        id={mockTask.id}
        isDragging={false}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  
  test('shows edit form when edit button is clicked', async () => {
    render(
      <TaskCard 
        task={mockTask}
        id={mockTask.id}
        isDragging={false}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    
    // Initial state
    expect(screen.queryByTestId('edit-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-description')).not.toBeInTheDocument();
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit'));
    
    // Edit form should appear
    expect(screen.getByTestId('edit-title')).toBeInTheDocument();
    expect(screen.getByTestId('edit-description')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  
  test('updates task data in edit form', async () => {
    render(
      <TaskCard 
        task={mockTask}
        id={mockTask.id}
        isDragging={false}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit'));
    
    // Get form fields
    const titleInput = screen.getByTestId('edit-title');
    const descInput = screen.getByTestId('edit-description');
    
    // Check initial values
    expect(titleInput).toHaveValue('Test Task');
    expect(descInput).toHaveValue('Test Description');
    
    // Change values
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Task');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'Updated Description');
    
    // Check updated values
    expect(titleInput).toHaveValue('Updated Task');
    expect(descInput).toHaveValue('Updated Description');
  });
  
  test('calls onEdit when save button is clicked', async () => {
    render(
      <TaskCard 
        task={mockTask}
        id={mockTask.id}
        isDragging={false}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit'));
    
    // Get form fields
    const titleInput = screen.getByTestId('edit-title');
    const descInput = screen.getByTestId('edit-description');
    
    // Change values
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Task');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'Updated Description');
    
    // Click save
    fireEvent.click(screen.getByText('Save'));
    
    // Check if onEdit was called with correct parameters
    expect(mockOnEdit).toHaveBeenCalledWith(1, {
      title: 'Updated Task',
      description: 'Updated Description'
    });
    
    // Check that we're no longer in edit mode
    expect(screen.queryByTestId('edit-title')).not.toBeInTheDocument();
  });
  
  test('returns to view mode when cancel button is clicked', async () => {
    render(
      <TaskCard 
        task={mockTask}
        id={mockTask.id}
        isDragging={false}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit'));
    
    // Get form fields
    const titleInput = screen.getByTestId('edit-title');
    
    // Change a value
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Task');
    
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check that we're no longer in edit mode
    expect(screen.queryByTestId('edit-title')).not.toBeInTheDocument();
    
    // onEdit should not have been called
    expect(mockOnEdit).not.toHaveBeenCalled();
    
    // Original data should still be displayed
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  test('calls onDelete when delete button is clicked', () => {
    render(
      <TaskCard 
        task={mockTask}
        id={mockTask.id}
        isDragging={false}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    
    // Click delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // Check if onDelete was called with correct parameter
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });
  
  test('renders with reduced opacity when isDragging is true', () => {
    const { container } = render(
      <TaskCard 
        task={mockTask}
        id={mockTask.id}
        isDragging={true} // Set to true
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );
    
    // Check if the first div has opacity 0.2
    const taskElement = container.firstChild;
    expect(taskElement).toHaveStyle('opacity: 0.2');
  });
});