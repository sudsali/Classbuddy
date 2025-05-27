# ClassBuddy - Collaborative Study Platform

ClassBuddy is a web-based platform designed to enhance the study group experience by providing tools for group formation, meeting scheduling, and resource sharing.

## Features

- **Study Group Management**
  - Create and join study groups
  - Group member management
  - Group search functionality
  - Group member roles and permissions

- **Smart Meeting Scheduler**
  - Interactive calendar interface
  - Availability selection and visualization
  - Meeting creation and management
  - Real-time availability updates

- **Task Management**
  - Drag-and-drop task board
  - Task status tracking (To Do, In Progress, Completed)
  - Task editing and deletion
  - Task position management

- **File Sharing**
  - Secure file uploads (up to 25MB)
  - File organization by study groups
  - File sharing with specific group members
  - Download tracking

- **User Experience**
  - Responsive design with light/dark theme support
  - Real-time updates
  - Intuitive interface
  - Cross-platform compatibility

## Tech Stack

### Frontend
- React.js with React Router and React Big Calendar
- Axios for API communication
- React Hooks and Context API for state management
- CSS3 with responsive design and theme support

### Backend
- Django with Django REST Framework
- PostgreSQL database with Django ORM
- Token-based authentication and email verification
- CORS configuration for API security

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/classbuddy.git
cd classbuddy
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use this: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

3. Set up the frontend
```bash
cd frontend
npm install
npm start
```

4. Configure environment variables
Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:8000
```

## Team Members

- Sudhanshu Sali (ss17526)
- Harsh Jalutharia (hj2607)
- Soham Moghe (sm11882)
- Clely Fernandes (cvf9554)
- Rachit Mehul Pathak (rmp10015)
- Frank Fan (lf2606)

## Registration Page:

<img src="https://drive.google.com/uc?export=view&id=1rSpQz_hPOmarxcfSILTFAUEz2uimsuQ0" alt="Image" width="700"/>

## Login Page:

<img src="https://drive.google.com/uc?export=view&id=1oeBV6Lri8wqsSinR5Pgjt8KwXI8WVWOn" alt="Image" width="700"/>

## Study Group Page:

<img src="https://drive.google.com/uc?export=view&id=183B9nZa0Dhzqxh6Hq0bAFHPIkzy0k7fa" alt="Image" width="700"/>

## Meeting Page:

<img src="https://drive.google.com/uc?export=view&id=1NoiQ6ugbp-pyr-rX5Nt0yiP1oiLHkEJ4" alt="Image" width="700"/>

## Direct Messaging Page:

<img src="https://drive.google.com/uc?export=view&id=1mpVsaG6585UrfRk7Eu8Oyf4Qj07YyOuP" alt="Image" width="700"/>




