# ClassBuddy - Collaborative Study Platform

ClassBuddy is a web-based platform designed to enhance the study group experience by providing tools for group formation, meeting scheduling, and resource sharing.


## Features

- **Study Group Management**
  - Create and join study groups
  - Group member management
  - Real-time group chat
  - File sharing within groups

- **Smart Meeting Scheduler**
  - Interactive calendar interface
  - Automatic availability detection
  - Best time slot suggestions
  - Meeting reminders

- **File Sharing**
  - Secure file uploads
  - File organization by study groups
  - Download tracking
  - Access control

- **User Experience**
  - Responsive design
  - Real-time updates
  - Intuitive interface
  - Cross-platform compatibility

## Tech Stack

- **Frontend**
  - React.js
  - React Big Calendar
  - Axios for API calls
  - CSS3 for styling

- **Backend**
  - Django
  - Django REST Framework
  - PostgreSQL
  - Django Authentication

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

## Registration page:

<img src="https://drive.google.com/uc?export=view&id=1rSpQz_hPOmarxcfSILTFAUEz2uimsuQ0" alt="Image" width="700"/>

## Login page:

<img src="https://drive.google.com/uc?export=view&id=1oeBV6Lri8wqsSinR5Pgjt8KwXI8WVWOn" alt="Image" width="700"/>

## Study Group page:

<img src="[https://drive.google.com/uc?export=view&id=1ptqOJqDaKcMxvJaX1w6v03zKXsRo_65b](https://drive.google.com/file/d/183B9nZa0Dhzqxh6Hq0bAFHPIkzy0k7fa/view?usp=sharing)" alt="Image" width="700"/>
