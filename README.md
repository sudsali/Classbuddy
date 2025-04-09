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
**1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)**

**2. use the following One-time Setup Commands** (only need to run once when first setting up the project):

First open two terminal tabs for backend & frontend, then execute the following commands:

**Backend terminal**
<pre># 1. Build and start backend containers:
cd backend
docker-compose up --build -d

# 2. Run migrations inside container:
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate

# 3. Create admin account (if you have not created one):
docker-compose exec web python manage.py createsuperuser
</pre>

The server will run on http://127.0.0.1:8000/ by default.
- Please use your superuser account that you just created to log in on http://127.0.0.1:8000/admin.


**Frontend terminal**
<pre># 1. Navigate to the frontend directory:
cd frontend
  
# 2. Install dependencies (required when running for the first time or after pulling new changes):
npm install
  
# 3. Start the development server:
npm start
</pre>

The frontend should then be accessible in your browser. By default, Create React App starts the development server on http://localhost:3000.

---

***Regular Usage Commands** (run every time you work on the project):
<pre>
# 1. (OPTIONAL) Run migrations if you make changes to models, add new apps, update database schema etc. 
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate

# 2. Start the development server
docker-compose up --build -d
</pre>


## Tech Stack
Our project uses:
- Django 4.2.20 as the web framework
- Django REST framework for API endpoints
- PostgreSQL as the database
- Boto3 for AWS S3 integration
- GitHub Actions for CI/CD
  
