var teacherModel = require('../models/Teacher');
var studentModel = require('../models/Student');
var classModel = require('../models/Class');
var topicModel = require('../models/Topic');
var exerciseModel = require('../models/Exercise');

exports.students = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher
                if (req.query.regNumber) { // Search for a specific student by Registration number in the Class of the Teacher
                    classModel.getClassByTeacher(USER)
                        .then(clas => {
                            let className = clas.records[0].get(0).properties.name;

                            topicModel.getTopicsOfClass(className)
                                .then(topics => {
                                    studentModel.getStudentsByRegNumber(req.query.regNumber, className)
                                        .then(students => {


                                            var studentUsernames = [];
                                            students.records.forEach(s => {
                                                let studentUsername = s.get(0).properties.username;
                                                studentUsernames.push(studentUsername);
                                            });
                                            exerciseModel.calcStudentsScoreProgress(topics.records.length, studentUsernames)
                                                .then(studentsScores => {
                                                    res.render('students', {
                                                        rootURL: global.rootURL,
                                                        user: teacher.records[0].get(0).properties,
                                                        isSearch: true,
                                                        searchQuery: req.query.regNumber,
                                                        students: students.records,
                                                        scores: studentsScores
                                                    });
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.send(err);
                                                });
                                            
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.send(err);
                                        });
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.send(err);
                                });
                            
                        })
                        .catch(err => {
                            console.log(err);
                            res.send(err);
                        });
                } else { // Return all students of the Class of the Teacher
                    classModel.getClassByTeacher(USER)
                        .then(clas => {
                            let className = clas.records[0].get(0).properties.name;

                            topicModel.getTopicsOfClass(className)
                                .then(topics => {
                                    studentModel.getStudentsOfClass(className)
                                        .then(students => {

                                            var studentUsernames = [];
                                            students.records.forEach(s => {
                                                let studentUsername = s.get(0).properties.username;
                                                studentUsernames.push(studentUsername);
                                            });
                                            exerciseModel.calcStudentsScoreProgress(topics.records.length, studentUsernames)
                                                .then(studentsScores => {
                                                    console.log(studentsScores);

                                                    res.render('students', {
                                                        rootURL: global.rootURL,
                                                        user: teacher.records[0].get(0).properties,
                                                        isSearch: false,
                                                        students: students.records,
                                                        scores: studentsScores
                                                    });
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.send(err);
                                                });
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.send(err);
                                        });
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.send(err);
                                });
                        })
                        .catch(err => {
                            console.log(err);
                            res.send(err);
                        });
                }
            } else {
                // Authorisation process failed!
                console.log("Authorisation process failed!");
                res.status(401).send("You are not authorised to use this application!");
            }
        })
        .catch(err => {
            if (err.code === "ServiceUnavailable") { // Handle Neo4j connection issues
                console.log("Server can't establish connection with Neo4j.");
                res.status(503).send("<h1>503 Service Unavailable</h1><hr><p>Server can't establish connection with Neo4j.</p>");
            } else {
                console.log(err);
                res.send(err);
            }
        });
}

exports.student = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher
                classModel.getClassByTeacher(USER)
                    .then(clas => {
                        let className = clas.records[0].get(0).properties.name;

                        studentModel.getStudentByRegNumber(req.params.regNumber, className)
                            .then(student => {
                                res.render('studentRecord', {
                                    rootURL: global.rootURL,
                                    user: teacher.records[0].get(0).properties,
                                    student: student
                                });
                            })
                            .catch(err => {
                                
                            });
                    })
                    .catch(err => {

                    });
            }
        })
        .catch(err => {
            if (err.code === "ServiceUnavailable") { // Handle Neo4j connection issues
                console.log("Server can't establish connection with Neo4j.");
                res.status(503).send("<h1>503 Service Unavailable</h1><hr><p>Server can't establish connection with Neo4j.</p>");
            } else {
                console.log(err);
                res.send(err);
            }
        });
}

exports.deleteAllStudents = (req, res) => {
    studentModel.deleteAllStudents(req.body.className)
        .then(result => {
            res.redirect(global.rootURL + '/');
        })
        .catch(err => {
            console.log(err);
            res.send(err);
        });
}

exports.deleteStudent = (req, res) => {
    const USER = "pwd04076";

    studentModel.deleteStudent(USER, req.params.regNumber)
        .then(result => {
            if (req.body.searchQuery) {
                res.redirect(global.rootURL + '/students?regNumber=' + req.body.searchQuery);
            } else {
                res.redirect(global.rootURL + '/students');
            }
        })
        .catch(err => {
            console.log(err);
            res.send(err);
        });
}