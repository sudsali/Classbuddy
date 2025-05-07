import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import TaskBoard from '../TaskBoard';

// Mock axios
jest.mock('axios');

// Mock DND Kit functionality
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }) => <div data-testid="drag-overlay">{children}</div>,
  useDroppable: () => ({
    setNodeRef: jest.fn(),
  }),
  closestCenter: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  PointerSensor: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
  arrayMove: jest.fn((arr, from, to) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  verticalListSortingStrategy: jest.fn(),
}));

describe('TaskBoard Component', () => {
  beforeEach(() => {
    // Mock sessionStorage
    const mockStorage = {
      getItem: jest.fn(() => 'fake-token'),
      setItem: jest.fn(),
      clear: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true,
    });

    // Mock axios responses
    axios.get.mockResolvedValue({ data: [] });
  });

  test('renders the create task form', async () => {
    await act(async () => {
      render(<TaskBoard groupId={1} />);
    });
    
    expect(screen.getByText('Create a New Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Create Task')).toBeInTheDocument();
  });

  test('renders all task columns', async () => {
    await act(async () => {
      render(<TaskBoard groupId={1} />);
    });
    
    // Use getAllByRole to find all h3 elements (column headers)
    const columnHeaders = screen.getAllByRole('heading', { level: 3 });
    expect(columnHeaders).toHaveLength(3);
    expect(columnHeaders[0]).toHaveTextContent('To Do');
    expect(columnHeaders[1]).toHaveTextContent('In Progress');
    expect(columnHeaders[2]).toHaveTextContent('Completed');
  });

  test('renders DND context', async () => {
    await act(async () => {
      render(<TaskBoard groupId={1} />);
    });
    
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });

  test('renders sortable contexts for each column', async () => {
    await act(async () => {
      render(<TaskBoard groupId={1} />);
    });
    
    const sortableContexts = screen.getAllByTestId('sortable-context');
    expect(sortableContexts).toHaveLength(3); // One for each column
  });

  test('renders empty state message when no tasks', async () => {
    await act(async () => {
      render(<TaskBoard groupId={1} />);
    });
    
    const emptyMessages = screen.getAllByText('Drop tasks here');
    expect(emptyMessages).toHaveLength(3); // One for each column
  });
});