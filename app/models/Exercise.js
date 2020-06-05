var db = require('../../config/db');

exports.getExercise = (username, topicOrderNumber, exerciseOrderId) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (:User {username: $username})-[:TEACHES|:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $topicOrderNumber}) '+
            'MATCH (exercises:Exercise {orderId: $exerciseOrderId})-[:FROM]->(topic) '+
            'RETURN exercises '+
            'ORDER BY exercises.orderId',
            {
                username: username,
                topicOrderNumber: parseInt(topicOrderNumber),
                exerciseOrderId: parseInt(exerciseOrderId)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.getExercisesOfTopic = (username, topicOrderNum) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (:User {username: $username})-[:TEACHES|:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $orderNumber}) '+
            'MATCH (exercises:Exercise)-[:FROM]->(topic) '+
            'RETURN exercises '+
            'ORDER BY exercises.orderId',
            {
                username: username,
                orderNumber: parseInt(topicOrderNum)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.createExercise = (teacherUsername, topicOrderNum) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (:Teacher {username: $username})-[:TEACHES]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $orderNumber}) '+
            'OPTIONAL MATCH (exercises:Exercise)-[:FROM]->(topic) '+
            'WITH COUNT(exercises) AS numExercises '+
            'MATCH (:Teacher {username: $username})-[:TEACHES]->(clas:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $orderNumber}) '+
            'CREATE (x:Exercise)-[:FROM]->(topic) '+
            'SET x.orderId = numExercises + 1, x.task = "", x.data = "", x.solution = "" '+
            'WITH x AS exercise '+
            'MATCH (:Teacher {username: $username})-[:TEACHES]->(clas:Class) '+
            'OPTIONAL MATCH (students:Student)-[:ENROLLED_IN]->(clas) '+
            'MERGE (exercise)-[:ASSIGNED_TO]->(students)',
            {
                username: teacherUsername,
                orderNumber: parseInt(topicOrderNum)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.deleteExercise = (teacherUsername, topicOrderNumber, exerciseOrderId) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (:User {username: $username})-[:TEACHES]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $orderNumber}) '+
            'MATCH (exercise:Exercise {orderId: $orderId})-[:FROM]->(topic) '+
            'DETACH DELETE exercise',
            {
                username: teacherUsername,
                orderNumber: parseInt(topicOrderNumber),
                orderId: parseInt(exerciseOrderId)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.updateExerciseIds = (teacherUsername, topicOrderNumber, deletedExerciseOrderId) => {
    const session = db.session();
    
    return session
        .run(
            'MATCH (:User {username: $username})-[:TEACHES]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $orderNumber}) '+
            'MATCH (exercise:Exercise)-[:FROM]->(topic) '+
            'WHERE exercise.orderId > $orderId '+
            'SET exercise.orderId = exercise.orderId - 1',
            {
                username: teacherUsername,
                orderNumber: parseInt(topicOrderNumber),
                orderId: parseInt(deletedExerciseOrderId)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

/*exports.getScoreOfExercises = (studentUsername, topicOrderNumber, exercises) => {
    var promises = [];
    exercises.forEach(exercise => {
        let orderId = exercise.get(0).properties.orderId;
        orderId = parseInt(orderId).toString();
        console.log(orderId);
        promises.push(this.getScore(studentUsername, topicOrderNumber, orderId));
    });
    promises.then(()=>{console.log('bla')});
    return promises;
}*/

exports.getScores = (studentUsername, topicOrderNumber) => {
    var session = db.session();
    
    return session
        .run(
            'MATCH (student:Student {username: $username})-[:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $topicOrderNumber}) '+
            'MATCH (student)-[attempt:ATTEMPTED]->(exercise:Exercise)-[:FROM]->(topic) '+
            'RETURN exercise.orderId as id, attempt.dateTimeCreated AS dateTime, attempt.score AS score, attempt.similarity AS similarity',
            {
                username: studentUsername,
                topicOrderNumber: parseInt(topicOrderNumber)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.calcTopicScoreProgress = (numExercises, attempts) => {
    let totalScore = 0;
    let progress = 0;
    attempts.records.forEach(attempt => {
        let a = attempt.toObject();
        totalScore += parseInt(a.score);
        progress += parseFloat(a.similarity);
    });
    progress /= numExercises;
    if (isNaN(progress)) {
        progress = 0;
    }
    //console.log(totalScore);
    //console.log(progress.toFixed(2));

    return { totalScore: totalScore, progress: progress };
}

exports.calcClassScoreProgress = (topicsNum, studentUsername) => {
    var attemptsArr = [];
    var promises = [];
    var exercisesLengths = [];
    var classRes = [];

    for (let i = 0; i < topicsNum; i++) {
        let topicOrderNumber = i + 1;

        promises.push(this.getExercisesOfTopic(studentUsername, topicOrderNumber)
            .then(exercises => {
                exercisesLengths.push({
                    orderNumber: topicOrderNumber,
                    numExercises: exercises.records.length
                });
            })
        );
    }
    return Promise.all(promises).then(() => {
        var promises2 = [];

        for (let i = 0; i < topicsNum; i++) {
            let topicOrderNumber = i + 1;

            promises2.push(this.getScores(studentUsername, topicOrderNumber)
                .then(attempts => {
                    attemptsArr.push({
                        orderNumber: topicOrderNumber,
                        attempts: attempts
                    });
                })
            );
        }

        return Promise.all(promises2).then(() => {
            exercisesLengths.forEach(ex => {
                attemptsArr.forEach(a => {
                    if (ex.orderNumber == a.orderNumber) {
                        let topicOrderNumber = ex.orderNumber;
                        let numExercises = ex.numExercises;
                        let attempts = a.attempts;

                        var topicRes = this.calcTopicScoreProgress(numExercises, attempts);
                        let totalScore = topicRes.totalScore;
                        let maxScore = ex.numExercises * 2;
                        let progress = topicRes.progress;

                        //console.log(topicOrderNumber+' score: '+totalScore+' progress: '+progress);
                        classRes.push({
                            orderNumber: topicOrderNumber,
                            totalScore: totalScore,
                            maxScore: maxScore,
                            progress: progress
                        });
                    }
                });
            });

            return classRes;
        });

    });
        
}

exports.calcStudentsScoreProgress = (topicsNum, students) => {
    console.log(students);
    var promises = [];
    var studentsScores = [];

    students.forEach(s => {
        promises.push(this.calcClassScoreProgress(topicsNum, s)
            .then(scores => {
                studentsScores.push({
                    student: s,
                    scores: scores
                });
            })
        );
    });

    return Promise.all(promises).then(() => {
        return studentsScores;
    });
}