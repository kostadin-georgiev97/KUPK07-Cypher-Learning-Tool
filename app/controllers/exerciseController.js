var exerciseModel = require('../models/Exercise');
var teacherModel = require('../models/Teacher');
var studentModel = require('../models/Student');
var topicModel = require('../models/Topic');
var queryExerciseModel = require('../models/QueryExercise');

exports.createExercise = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher

                let teacherUsername = teacher.records[0].get(0).properties.username;

                exerciseModel.createExercise(teacherUsername, req.params.orderNumber)
                    .then(result => {
                        res.redirect(global.rootURL + '/topic/' + req.params.orderNumber);
                    })
                    .catch(err => {

                    });

            } else {
                // Exercise can't be created
            }
        })
        .catch(err => {

        });

}

exports.getExercise = (req, res) => {
    const USER = "pwd04076";

    let topicOrderNumber = req.params.orderNumber;
    let exerciseOrderId = req.params.orderId;

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher

                let teacherUsername = teacher.records[0].get(0).properties.username;

                topicModel.getTopic(teacherUsername, topicOrderNumber)
                    .then(topic => {
                        exerciseModel.getExercise(teacherUsername, topicOrderNumber, exerciseOrderId)
                        .then(exercise => {
                            res.render('exerciseTeacher', {
                                rootURL: global.rootURL,
                                user: teacher.records[0].get(0).properties,
                                topicOrderNumber: topicOrderNumber,
                                topicTitle: topic.records[0].get(0).properties.title,
                                exercise: exercise.records[0].get(0).properties
                            });
                        })
                        .catch(err => {
    
                        });
                    })
                    .catch(err => {

                    });
                
            } else {
                studentModel.getStudent(USER)
                    .then(student => {
                        if (student.records[0]) { // User is authenticated as a Student

                            let studentUsername = student.records[0].get(0).properties.username;

                            topicModel.getTopic(studentUsername, topicOrderNumber)
                                .then(topic => {
                                    exerciseModel.getExercise(studentUsername, topicOrderNumber, exerciseOrderId)
                                        .then(exercise => {
                                            queryExerciseModel.getDataLabels(exercise.records[0].get(0).properties.data)
                                                .then(labels => {

                                                    let passedQuery = req.session.query;
                                                    let passedResult = req.session.result;
                                                    let passedSimilarity = -1;
                                                    let passedErr = {
                                                        type: 'none',
                                                        message: ''
                                                    };
                                                    if (req.session.err) {
                                                        passedErr = req.session.err;
                                                    }
                                                    if (req.session.similarity || req.session.similarity == 0) { 
                                                        passedSimilarity = req.session.similarity;
                                                    }
                                                    req.session.destroy();

                                                    queryExerciseModel.getAttempt(studentUsername, topicOrderNumber, exerciseOrderId)
                                                        .then(attempt => {
                                                            console.log(passedQuery);
                                                            console.log(passedResult);
                                                            console.log(passedSimilarity);

                                                            if (passedQuery === undefined && passedResult === undefined && passedSimilarity == -1) {
                                                                console.log('show attempt');
                                                                if (attempt.records.length != 0) {
                                                                    passedQuery = attempt.records[0].get('attempt').properties.query;
                                                                    passedSimilarity = attempt.records[0].get('attempt').properties.similarity;
                                                                }
                                                            } else {
                                                                console.log('show run');
                                                            }

                                                            res.render('exerciseStudent', {
                                                                rootURL: global.rootURL,
                                                                user: student.records[0].get(0).properties,
                                                                topicOrderNumber: topicOrderNumber,
                                                                topicTitle: topic.records[0].get(0).properties.title,
                                                                exercise: exercise.records[0].get(0).properties,
                                                                labels: labels,
                                                                query: passedQuery,
                                                                result: passedResult,
                                                                similarity: passedSimilarity,
                                                                err: passedErr
                                                            });
                                                        })
                                                        .catch(err => {
                                                            console.log(err);
                                                            res.render('exerciseStudent', {
                                                                rootURL: global.rootURL,
                                                                user: student.records[0].get(0).properties,
                                                                topicOrderNumber: topicOrderNumber,
                                                                topicTitle: topic.records[0].get(0).properties.title,
                                                                exercise: exercise.records[0].get(0).properties,
                                                                labels: null,
                                                                query: null,
                                                                result: null,
                                                                similarity: -1,
                                                                err: {
                                                                    type: 'exercise-unavailable',
                                                                    title: '404 Exercise unavailable',
                                                                    message: 'The exercise is currently unavailable!'
                                                                }
                                                            });
                                                        });

                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.render('exerciseStudent', {
                                                        rootURL: global.rootURL,
                                                        user: student.records[0].get(0).properties,
                                                        topicOrderNumber: topicOrderNumber,
                                                        topicTitle: topic.records[0].get(0).properties.title,
                                                        exercise: exercise.records[0].get(0).properties,
                                                        labels: null,
                                                        query: null,
                                                        result: null,
                                                        similarity: -1,
                                                        err: {
                                                            type: 'exercise-unavailable',
                                                            title: '404 Exercise unavailable',
                                                            message: 'The exercise is currently unavailable!'
                                                        }
                                                    });
                                                });
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.render('exerciseStudent', {
                                                rootURL: global.rootURL,
                                                user: student.records[0].get(0).properties,
                                                topicOrderNumber: topicOrderNumber,
                                                topicTitle: topic.records[0].get(0).properties.title,
                                                exercise: exercise.records[0].get(0).properties,
                                                labels: null,
                                                query: null,
                                                result: null,
                                                similarity: -1,
                                                err: {
                                                    type: 'exercise-unavailable',
                                                    title: '404 Exercise unavailable',
                                                    message: 'The exercise is currently unavailable!'
                                                }
                                            });
                                        });
                                })
                                .catch(err => {
                                    console.log(err);
                                });

                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        })
        .catch(err => {
            console.log(err);
        });
}

exports.deleteExercise = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher

                let teacherUsername = teacher.records[0].get(0).properties.username;
                let topicOrderNumber = req.params.orderNumber;
                let exerciseOrderId = req.params.orderId;
                exerciseModel.deleteExercise(teacherUsername, topicOrderNumber, exerciseOrderId)
                    .then(result => {
                        exerciseModel.updateExerciseIds(teacherUsername, topicOrderNumber, exerciseOrderId)
                            .then(result2 => {
                                res.redirect(global.rootURL + '/topic/' + req.params.orderNumber);
                            })
                            .catch(err => {

                            });
                    })
                    .catch(err => {
                        
                    });

            } else {
                // Exercise can't be deleted
            }
        })
        .catch(err => {

        });

}

exports.updateExerciseData = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher

                let teacherUsername = teacher.records[0].get(0).properties.username;
                let topicOrderNumber = req.params.orderNumber;
                let exerciseOrderId = req.params.orderId;
                let data = req.body.data;

                queryExerciseModel.updateExerciseData(teacherUsername, topicOrderNumber, exerciseOrderId, data)
                    .then(() => {
                        res.redirect(global.rootURL + '/topic/' + topicOrderNumber + '/exercise/' + exerciseOrderId);
                    })
                    .catch(err => {
                        res.send(err.message);
                    });

            } else {
                // Exercise can't be deleted
            }
        })
        .catch(err => {
            res.send(err.message);
        });
}

exports.updateExerciseTask = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher

                let teacherUsername = teacher.records[0].get(0).properties.username;
                let topicOrderNumber = req.params.orderNumber;
                let exerciseOrderId = req.params.orderId;
                let task = req.body.task;

                queryExerciseModel.updateExerciseTask(teacherUsername, topicOrderNumber, exerciseOrderId, task)
                    .then(() => {
                        res.redirect(global.rootURL + '/topic/' + topicOrderNumber + '/exercise/' + exerciseOrderId);
                    })
                    .catch(err => {
                        res.send(err);
                    });

            } else {
                // Exercise can't be deleted
            }
        })
        .catch(err => {
            res.send(err.message);
        });
}

exports.updateExerciseSolution = (req, res) => {
    const USER = "pwd04076";

    teacherModel.getTeacher(USER)
        .then(teacher => {
            if (teacher.records[0]) { // User is authenticated as a Teacher

                let teacherUsername = teacher.records[0].get(0).properties.username;
                let topicOrderNumber = req.params.orderNumber;
                let exerciseOrderId = req.params.orderId;
                let solution = req.body.solution;

                queryExerciseModel.updateExerciseSolution(teacherUsername, topicOrderNumber, exerciseOrderId, solution)
                    .then(() => {
                        res.redirect(global.rootURL + '/topic/' + topicOrderNumber + '/exercise/' + exerciseOrderId);
                    })
                    .catch(err => {
                        res.send(err);
                    });

            } else {
                // Exercise can't be deleted
            }
        })
        .catch(err => {
            console.log(err);
        });
}

exports.run = (req, res) => {
    const USER = "gfb16165";

    let topicOrderNumber = req.params.orderNumber;
    let exerciseOrderId = req.params.orderId;

    studentModel.getStudent(USER)
        .then(student => {
            if (student.records[0]) { // User is authenticated as a Student

                let studentUsername = student.records[0].get(0).properties.username;

                topicModel.getTopic(studentUsername, topicOrderNumber)
                    .then(topic => {

                        exerciseModel.getExercise(studentUsername, topicOrderNumber, exerciseOrderId)
                            .then(exercise => {
                                let createDataQuery = exercise.records[0].get(0).properties.data;
                                let solutionQuery = exercise.records[0].get(0).properties.solution;
                                
                                let studentQuery = req.body.query;

                                console.log("Creating temporary data...");
                                queryExerciseModel.createTempGraph(createDataQuery) // Create temporary data
                                    .then(sessionId => {
                                        console.log('Temporary data created!');

                                        // ************** Run solution query **************
                                        queryExerciseModel.runQuery(solutionQuery, sessionId)
                                            .then(solutionResult => {

                                                // ************** Run student query **************
                                                queryExerciseModel.runQuery(studentQuery, sessionId)
                                                    .then(queryResult => {
                                                            
                                                        queryExerciseModel.deleteTempGraph(sessionId)
                                                            .then(() => {
                                                                    
                                                                // Compare queryResult to solutionResult --> similarityPercentage
                                                                let similarityPercent = queryExerciseModel.compareQueryResults(solutionResult.records, queryResult.records);
                                                                        
                                                                if (similarityPercent > 0) {
                                                                    queryExerciseModel.attempt(studentUsername, topicOrderNumber, exerciseOrderId, studentQuery, similarityPercent)
                                                                        .then(() => {
                                                                            req.session.query = studentQuery;
                                                                            req.session.result = queryResult.records;
                                                                            req.session.similarity = similarityPercent;
                                                                            req.session.err = {
                                                                                type: 'none',
                                                                                message: ''
                                                                            };
                                                                            res.redirect(global.rootURL + '/topic/' + topicOrderNumber + '/exercise/' + exerciseOrderId);
                                                                        })
                                                                        .catch(err => {

                                                                        });
                                                                } else {
                                                                    req.session.query = studentQuery;
                                                                    req.session.result = queryResult.records;
                                                                    req.session.similarity = similarityPercent;
                                                                    req.session.err = {
                                                                        type: 'none',
                                                                        message: ''
                                                                    };
                                                                    res.redirect(global.rootURL + '/topic/' + topicOrderNumber + '/exercise/' + exerciseOrderId);
                                                                }
                                                            })
                                                            .catch(err => {
                                                                console.log(err);
                                                                queryExerciseModel.deleteTempGraph(sessionId)
                                                                    .then(() => {
                                                                        this.renderNeo4jError(req, res, topicOrderNumber, exerciseOrderId, studentQuery, err);
                                                                    })
                                                                    .catch(err => {
                                                                        this.renderNeo4jError(req, res, topicOrderNumber, exerciseOrderId, studentQuery, err);
                                                                    });
                                                            });
                                                    })
                                                    .catch(err => {
                                                        console.log(err);
                                                        queryExerciseModel.deleteTempGraph(sessionId)
                                                            .then(() => {
                                                                this.renderNeo4jError(req, res, topicOrderNumber, exerciseOrderId, studentQuery, err);
                                                            })
                                                            .catch(err => {
                                                                this.renderNeo4jError(req, res, topicOrderNumber, exerciseOrderId, studentQuery, err);
                                                            });
                                                    });
                                                // ************** /Run student query **************

                                            })
                                            .catch(err => {
                                                this.renderNeo4jError(req, res, topicOrderNumber, exerciseOrderId, studentQuery, err);
                                            });
                                        // ************** /Run solution query **************
                                                
                                    })
                                    .catch(err => {
                                        console.log(err);
                                        this.renderNeo4jError(req, res, topicOrderNumber, exerciseOrderId, studentQuery, err);
                                    });
                            })
                            .catch(err => {
                                this.renderNeo4jError(req, res, topicOrderNumber, exerciseOrderId, studentQuery, err);
                            });
                    })
                    .catch(err => {
                        console.log(err);
                    });

            }
        })
        .catch(err => {
            console.log(err);
        });

}

this.renderNeo4jError = (req, res, topicOrderNumber, exerciseOrderId, studentQuery, err) => {
    req.session.query = studentQuery;
    req.session.result = null;
    req.session.similarity = -1;
    req.session.err = {
        type: err.code,
        title: err.name,
        message: err.message.replace(/\r/g, '').replace(/\n/g, '').replace(/\"/g, '')
    };
    res.redirect(global.rootURL + '/topic/' + topicOrderNumber + '/exercise/' + exerciseOrderId);
}