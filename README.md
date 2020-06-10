# KUPK07 - Cypher Learning Tool
This project aims to produce software that supports the teaching of Neo4j (the leading graph database) and the standard query language for it - Cypher, in an interactive manner. The project will accommodate both students' and teacher's needs.

Prerequisites:
*  Have Node.js and NPM installed.
*  Have Neo4j Desktop installed on localhost.
*  Create new Graph and have it run on bolt://localhost:7687.

# Screenshots
<img src="public/img/1_log_in.png" alt="Shibboleth authentication" width="40%" align="left">
<img src="public/img/2_home_student.png" alt="Student Homepage" width="40%" align="right">
<img src="public/img/2_home_teacher.png" alt="Teacher Homepage" width="40%" align="left">
<img src="public/img/3_exercise_error.png" alt="Exercise Throws Error" width="40%" align="right">
<img src="public/img/4_exercise_result.png" alt="Exercise Returns Result" width="40%" align="left">
<img src="public/img/5_exercise.png" alt="Exercise" width="40%" align="right">

# To build the project:
1.  Navigate to the project root directory and open a shell.
2.  Execute `npm install`.
2.  Configure authentication token in ./config/db.js - `neo4j.auth.basic("user", "password")`.
	
# To run the app:
*  `npm run dev` - Development environment
*  `npm run start` - Production environment