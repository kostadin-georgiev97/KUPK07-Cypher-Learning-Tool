var teacherModel = require('../models/Teacher');
var studentModel = require('../models/Student');
var classModel = require('../models/Class');
var topicModel = require('../models/Topic');
var exerciseModel = require('../models/Exercise');

exports.index = (req, res) => {
    const USER = "pwd04076";

    if (USER) {

        teacherModel.getTeacher(USER)
            .then(teacher => {
                if (teacher.records[0]) { // User is authenticated as a Teacher
                    classModel.getClassByTeacher(USER)
                        .then(clas => {
                            let className = clas.records[0].get(0).properties.name;
                            topicModel.getTopicsOfClass(className)
                                .then(topics => {
                                    res.render('homeTeacher', {
                                        rootURL: global.rootURL,
                                        user: teacher.records[0].get(0).properties,
                                        clas: clas.records[0].get(0).properties,
                                        topics: topics,
                                        errorMessage: req.params.errMsg
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
                } else {
                    studentModel.getStudent(USER)
                        .then(student => {
                            if (student.records[0]) { // User is authenticated as a Student

                                let studentUsername = student.records[0].get(0).properties.username;

                                classModel.getClassByStudent(USER)
                                    .then(clas => {
                                        let className = clas.records[0].get(0).properties.name;
                                        topicModel.getTopicsOfClass(className)
                                            .then(topics => {

                                                //console.log(topics.records[0].toObject().topic.properties.orderNumber);
                                                exerciseModel.calcClassScoreProgress(topics.records.length, studentUsername)
                                                    .then(scores => {
                                                        console.log(scores);

                                                        res.render('homeStudent', {
                                                            rootURL: global.rootURL,
                                                            user: student.records[0].get(0).properties,
                                                            clas: clas.records[0].get(0).properties,
                                                            topics: topics,
                                                            topicScores: scores
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
                            } else {
                                // Authorisation process failed!
                                console.log("Authorisation process failed!");
                                res.status(401).send("You are not authorised to use this application!");
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            res.send(err);
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

    } else {
        // Authentication with Shibboleth failed!
        console.log("Authentication with Shibboleth failed!");
        res.status(401).send("<h1>401 Unauthorized</h1><hr><p>Secure authentication with Shibboleth failed!</p>");
    }
}