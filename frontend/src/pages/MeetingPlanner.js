import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../context/AuthContext';

const MeetingPlanner = () => {
  const { user, loading } = useAuth();
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [earliestTime, setEarliestTime] = useState('09:00');
  const [latestTime, setLatestTime] = useState('17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleNextStep = () => {
    if (currentStep === 1 && !meetingTitle.trim()) {
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
    setIsSubmitting(true);

    try {
      const eventData = {
        title: meetingTitle,
        dates: selectedDates.map(date => ({
          date: date.toISOString().split('T')[0],
          timeRange: `${earliestTime} - ${latestTime}`
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the Meeting Planner</div>;
  }

  return (
    <div style={{ 
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          textAlign: 'center',
          color: '#333',
          marginBottom: '30px'
        }}>Meeting Planner</h2>

        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '30px',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#ddd',
            zIndex: 1
          }}></div>
          {[1, 2, 3].map((step) => (
            <div key={step} style={{ 
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'white',
              padding: '0 10px',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: currentStep >= step ? '#357abd' : '#ddd',
                color: currentStep >= step ? 'white' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 5px'
              }}>
                {step}
              </div>
              <div style={{ 
                fontSize: '14px',
                color: currentStep >= step ? '#357abd' : '#666'
              }}>
                {step === 1 ? 'Title' : step === 2 ? 'Schedule' : 'Review'}
              </div>
            </div>
          ))}
        </div>
        
        {currentStep === 1 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              color: '#333',
              marginBottom: '10px'
            }}>Step 1: What's the meeting about?</h3>
            <p style={{ 
              color: '#666',
              marginBottom: '15px',
              fontSize: '14px'
            }}>Enter a clear title that describes the purpose of the meeting</p>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="Enter meeting title"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              color: '#333',
              marginBottom: '10px'
            }}>Step 2: Select Available Dates and Times</h3>
            <p style={{ 
              color: '#666',
              marginBottom: '15px',
              fontSize: '14px'
            }}>Choose your available dates and preferred time range</p>
            
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <h4 style={{ 
                  color: '#333',
                  marginBottom: '10px'
                }}>Select Dates</h4>
                <Calendar
                  onChange={handleDateSelect}
                  value={selectedDates}
                  selectRange={false}
                  tileClassName={({ date }) => 
                    selectedDates.some(selectedDate => 
                      selectedDate.getTime() === date.getTime()
                    ) ? 'selected-date' : null
                  }
                  style={{
                    width: '100%',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                />
              </div>

              <div>
                <h4 style={{ 
                  color: '#333',
                  marginBottom: '10px'
                }}>Select Time Range</h4>
                <div style={{ 
                  display: 'flex',
                  gap: '20px'
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '5px',
                      color: '#666'
                    }}>No earlier than:</label>
                    <select
                      value={earliestTime}
                      onChange={(e) => setEarliestTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '5px',
                      color: '#666'
                    }}>No later than:</label>
                    <select
                      value={latestTime}
                      onChange={(e) => setLatestTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {selectedDates.length > 0 && (
                <div>
                  <h4 style={{ 
                    color: '#333',
                    marginBottom: '10px'
                  }}>Selected Dates:</h4>
                  <ul style={{ 
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {selectedDates.map((date, index) => (
                      <li key={index} style={{ 
                        padding: '8px',
                        backgroundColor: '#f8f9fa',
                        marginBottom: '5px',
                        borderRadius: '4px'
                      }}>
                        {formatDate(date)} ({earliestTime} - {latestTime})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              color: '#333',
              marginBottom: '20px'
            }}>Step 3: Review Your Meeting Details</h3>
            
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ 
                color: '#333',
                marginBottom: '15px'
              }}>Meeting Title</h4>
              <p style={{ 
                color: '#666',
                fontSize: '16px',
                marginBottom: '20px'
              }}>{meetingTitle}</p>

              <h4 style={{ 
                color: '#333',
                marginBottom: '15px'
              }}>Selected Dates and Times</h4>
              <ul style={{ 
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {selectedDates.map((date, index) => (
                  <li key={index} style={{ 
                    padding: '10px',
                    backgroundColor: 'white',
                    marginBottom: '10px',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        color: '#333',
                        fontSize: '16px'
                      }}>
                        {formatDate(date)}
                      </span>
                      <span style={{ 
                        color: '#357abd',
                        fontWeight: 'bold'
                      }}>
                        {earliestTime} - {latestTime}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p style={{ 
              color: '#666',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              Please review your meeting details before creating the event.
            </p>
          </div>
        )}

        <div style={{ 
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {currentStep > 1 && (
            <button
              onClick={handlePreviousStep}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button
              onClick={handleNextStep}
              style={{
                padding: '12px 24px',
                backgroundColor: '#357abd',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateEvent}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: '#357abd',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                marginLeft: 'auto'
              }}
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </button>
          )}
        </div>

        <style>
          {`
            .selected-date {
              background-color: #357abd;
              color: white;
            }
            .react-calendar__tile--now {
              background-color: #e6f7ff;
            }
            .react-calendar__tile--active {
              background-color: #357abd;
              color: white;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default MeetingPlanner; 