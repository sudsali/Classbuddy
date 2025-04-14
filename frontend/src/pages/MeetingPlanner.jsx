import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './MeetingPlanner.css';

const MeetingPlanner = () => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [earliestTime, setEarliestTime] = useState('09:00');
  const [latestTime, setLatestTime] = useState('17:00');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate time options from 6:00 AM to 11:00 PM in 30-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(time);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleDateSelect = (date) => {
    const isSelected = selectedDates.some(
      selectedDate => selectedDate.getTime() === date.getTime()
    );

    if (isSelected) {
      setSelectedDates(selectedDates.filter(
        selectedDate => selectedDate.getTime() !== date.getTime()
      ));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeRange = () => {
    return `${earliestTime} - ${latestTime}`;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !meetingTitle) {
      alert('Please enter a meeting title');
      return;
    }
    if (currentStep === 2 && selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreateEvent = async () => {
    if (!meetingTitle) {
      alert('Please enter a meeting title');
      return;
    }

    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        title: meetingTitle,
        dates: selectedDates.map(date => ({
          date: date.toISOString().split('T')[0],
          timeRange: formatTimeRange()
        }))
      };

      console.log('Creating event:', eventData);
      // TODO: Add API call to create event
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Event created successfully!');
      // Reset form
      setMeetingTitle('');
      setSelectedDates([]);
      setCurrentStep(1);
    } catch (error) {
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="meeting-planner">
      <h2>Meeting Planner</h2>
      
      <div className="meeting-form">
        {currentStep === 1 && (
          <div className="step-content">
            <h3>Step 1: Enter Meeting Title</h3>
            <div className="form-group">
              <label htmlFor="meetingTitle">What's the meeting about?</label>
              <input
                type="text"
                id="meetingTitle"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title"
                className="meeting-title-input"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-content">
            <h3>Step 2: Select Available Dates</h3>
            <p className="step-instruction">Click on the dates you're available for the meeting</p>
            <Calendar
              onChange={handleDateSelect}
              value={selectedDates}
              selectRange={false}
              tileClassName={({ date }) => 
                selectedDates.some(selectedDate => 
                  selectedDate.getTime() === date.getTime()
                ) ? 'selected-date' : null
              }
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="step-content">
            <h3>Step 3: Set Available Times</h3>
            <p className="step-instruction">Select your preferred time range for the meeting</p>
            <div className="time-selection">
              <div className="form-group">
                <label htmlFor="earliestTime">No earlier than:</label>
                <select
                  id="earliestTime"
                  value={earliestTime}
                  onChange={(e) => setEarliestTime(e.target.value)}
                  className="time-select"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="latestTime">No later than:</label>
                <select
                  id="latestTime"
                  value={latestTime}
                  onChange={(e) => setLatestTime(e.target.value)}
                  className="time-select"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="step-content">
            <h3>Step 4: Review Your Selection</h3>
            <div className="review-section">
              <div className="review-item">
                <h4>Meeting Title:</h4>
                <p>{meetingTitle}</p>
              </div>
              <div className="review-item">
                <h4>Selected Dates and Times:</h4>
                <ul>
                  {selectedDates.map((date, index) => (
                    <li key={index}>
                      <span className="date">{formatDate(date)}</span>
                      <span className="time-range">{formatTimeRange()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button 
              className="nav-button prev-button"
              onClick={handlePreviousStep}
            >
              Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              className="nav-button next-button"
              onClick={handleNextStep}
            >
              Next
            </button>
          ) : (
            <button 
              className="create-event-button"
              onClick={handleCreateEvent}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingPlanner;
