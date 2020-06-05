var teacherModel = require('../models/Teacher');
var studentModel = require('../models/Student');
var topicModel = require('../models/Topic');
var classModel = require('../models/Class');
var exerciseModel = require('../models/Exercise');

exports.getTopic = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher
                topicModel.getTopic(teacher.records[0].get(0).properties.username, req.params.orderNumber)
                    .then(topic => {
                        exerciseModel.getExercisesOfTopic(teacher.records[0].get(0).properties.username, topic.records[0].get(0).properties.orderNumber)
                            .then(exercises => {
                                res.render('topicTeacher', {
                                    rootURL: global.rootURL,
                                    user: teacher.records[0].get(0).properties,
                                    topic: topic,
                                    exercises: exercises
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

                            classModel.getClassByStudent(studentUsername)
                                .then(clas => {
                                    topicModel.getTopicByClass(clas.records[0].get(0).properties.name, req.params.orderNumber)
                                        .then(topic => {

                                            let topicOrderNumber = topic.records[0].get(0).properties.orderNumber;

                                            exerciseModel.getExercisesOfTopic(studentUsername, topicOrderNumber)
                                                .then(exercises => {

                                                    exerciseModel.getScores(studentUsername, topicOrderNumber)
                                                        .then(attempts => {

                                                            var topicRes = exerciseModel.calcTopicScoreProgress(exercises.records.length, attempts);
                                                            let totalScore = topicRes.totalScore;
                                                            let progress = topicRes.progress;

                                                            res.render('topicStudent', {
                                                                rootURL: global.rootURL,
                                                                user: student.records[0].get(0).properties,
                                                                topic: topic,
                                                                exercises: exercises,
                                                                attempts: attempts,
                                                                topicScore: totalScore,
                                                                topicProgress: progress.toFixed(2)
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
                    })
                    .catch(err => {
                        console.log(err);
                        res.send(err);
                    });
            }
        })
        .catch(err => {
            console.log(err);
            res.send(err);
        });
}

exports.updateTopicContent = (req, res) => {
    let topicOrderNum = req.params.orderNumber;
    let topicContent = req.body.content;
    topicModel.updateTopicContent(topicOrderNum, topicContent)
        .then(() => {
            res.status(200).send("200 OK");
        })
        .catch(err => {
            res.status(500).send(err);
        });
}

exports.updateTopicsOrder = (req, res) => {
    let newTopicsOrder = req.body.positions;
    topicModel.updateTopicsOrder(newTopicsOrder)
        .then(() => {
            res.status(200).send("200 OK");
        })
        .catch(err => {
            res.status(500).send(err);
        });
}

exports.createTopic = (req, res) => {
    let topicName = req.body.newTopicName.trim();
    let className = req.body.clas;
    topicModel.createTopic(topicName, className)
        .then(result => {
            res.redirect(global.rootURL + '/');
        })
        .catch(err => {
            console.log(err.message);
            if (err.message === "UniqueConstraintViolation") {
                res.redirect(global.rootURL + '/err/There is already a topic with name "' + topicName + '"');
            } else {
                res.send(err);
            }
        });
}

exports.updateTopicTitle = (req, res) => {
    let className = req.body.className;
    let oldTitle = req.body.topicTitle;
    let newTitle = req.body.newTopicTitle.trim();
    topicModel.updateTopicTitle(className, oldTitle, newTitle)
        .then(result => {
            res.status(200).json({status:"ok"});
        })
        .catch(err => {
            if (err.message === "UniqueConstraintViolation") {
                res.status(500).json({code:"UniqueConstraintViolation"});
            } else {
                res.send(err);
            }
        });
}

exports.deleteTopic = (req, res) => {
    let className = req.body.className;
    let topicName = req.body.topicTitle;
    topicModel.deleteTopic(className, topicName)
        .then(result => {
            res.status(200).send("200 OK");
        })
        .catch(err => {
            res.status(500).send(err);
        });
}