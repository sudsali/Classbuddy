# SE-Spring25-Group2

## Team Members
- Sudhanshu Sali (ss17526)
- Harsh Jalutharia (hj2607)
- Soham Moghe (sm11882)
- Clely Fernandes (cvf9554)
- Rachit Mehul Pathak (rmp10015)
- Frank Fan (lf2606)

## Selected Project: ClassBuddy

- ClassBuddy is a web application designed to enhance collaborative learning for students by helping them form study groups, share resources, and organize projects. The platform enables students to connect with peers based on shared academic goals, class enrollment, and interests, making group study and collaboration easier and more efficient. It integrates tools for file sharing, scheduling, and real-time collaboration to ensure a streamlined group learning experience. By offering features like AI-generated study aids, gamified rewards, and calendar synchronization, the app encourages productivity and fosters academic success.

## Steps to run Backend
1. Set up a Python virtual environment and install the dependencies(once):
    <pre> python -m venv venv </pre>
    <pre> source venv/bin/activate' on mac/Linux </pre>
    <pre> pip install -r backend/requirements.txt </pre>
  
2. Set up the database:
    <pre> cd backend </pre>
    <pre> python manage.py makemigrations </pre>
    <pre> python manage.py migrate </pre>
  
3. Create a superuser (admin) account:
    <pre> python manage.py createsuperuser </pre>
  
4. Run the development server:
    <pre> 'python manage.py runserver' </pre>

## Tech Stack
Our project uses:
- Django 4.2.20 as the web framework
- Django REST framework for API endpoints
- PostgreSQL as the database
- Boto3 for AWS S3 integration
- GitHub Actions for CI/CD
  
