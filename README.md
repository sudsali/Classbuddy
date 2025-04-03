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
**One-time Setup Commands** (only need to run once when first setting up the project):

<pre># 1. Create and activate virtual environment:
python -m venv venv
source venv/bin/activate  # for macOS/Linux...might be different for windowns

# 2. Install dependencies:
pip install -r backend/requirements.txt

# 3. Set up the database:
cd backend
python manage.py makemigrations
python manage.py migrate

# 4. Create admin account:
python manage.py createsuperuser 
</pre>

The server will run on http://127.0.0.1:8000/ by default.
- Please use your superuser account that just created to log in on http://127.0.0.1:8000/admin.

---

**Regular Usage Commands** (run every time you work on the project):
<pre># 1. Activate virtual environment (if not already activated)
source venv/bin/activate  # On macOS/Linux

# 2. Start the development server
cd backend
python manage.py runserver
</pre>

*Noticed that if you make changes to models, add new apps, update database schema...you need to run makemigrations and migrate again.


## Tech Stack
Our project uses:
- Django 4.2.20 as the web framework
- Django REST framework for API endpoints
- PostgreSQL as the database
- Boto3 for AWS S3 integration
- GitHub Actions for CI/CD
  
