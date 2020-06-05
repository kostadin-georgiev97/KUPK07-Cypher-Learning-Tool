var db = require('../../config/db');

exports.updateExerciseData = (teacherUsername, topicOrderNumber, exerciseOrderId, data) => {
    console.log(teacherUsername + ' ' + topicOrderNumber + ' ' + exerciseOrderId + ' ' + data);
    var session = db.session();
    
    return session
        .run(
            'MATCH (:Teacher {username: $username})-[:TEACHES]->(:Class)<-[:PART_OF]-(:Topic {orderNumber: $orderNumber}) '+
            'MATCH (exercise:Exercise {orderId: $orderId})-[:FROM]->(topic) '+
            'SET exercise.data = $data',
            {
                username: teacherUsername,
                orderNumber: parseInt(topicOrderNumber),
                orderId: parseInt(exerciseOrderId),
                data: data
            }
        ).then(() => {
            session.close();
        });
}

exports.updateExerciseTask = (teacherUsername, topicOrderNumber, exerciseOrderId, task) => {
    console.log(teacherUsername + ' ' + topicOrderNumber + ' ' + exerciseOrderId + ' ' + task);
    var session = db.session();
    
    return session
        .run(
            'MATCH (:Teacher {username: $username})-[:TEACHES]->(:Class)<-[:PART_OF]-(:Topic {orderNumber: $orderNumber}) '+
            'MATCH (exercise:Exercise {orderId: $orderId})-[:FROM]->(topic) '+
            'SET exercise.task = $task',
            {
                username: teacherUsername,
                orderNumber: parseInt(topicOrderNumber),
                orderId: parseInt(exerciseOrderId),
                task: task
            }
        ).then(() => {
            session.close();
        });
}

exports.updateExerciseSolution = (teacherUsername, topicOrderNumber, exerciseOrderId, solution) => {
    console.log(teacherUsername + ' ' + topicOrderNumber + ' ' + exerciseOrderId + ' ' + solution);
    var session = db.session();
    
    return session
        .run(
            'MATCH (:Teacher {username: $username})-[:TEACHES]->(:Class)<-[:PART_OF]-(:Topic {orderNumber: $orderNumber}) '+
            'MATCH (exercise:Exercise {orderId: $orderId})-[:FROM]->(topic) '+
            'SET exercise.solution = $solution',
            {
                username: teacherUsername,
                orderNumber: parseInt(topicOrderNumber),
                orderId: parseInt(exerciseOrderId),
                solution: solution
            }
        ).then(() => {
            session.close();
        });
}

exports.getDataLabels = (data) => {
    return this.createTempGraph(data)
        .then(sessionId => {
            var session = db.session();
            return session
                .run(
                    'MATCH ({sid: $sessionId})-[r]->({sid: $sessionId}) '+
                    'WITH collect(TYPE(r)) AS relationships '+
                    'MATCH (n {sid: $sessionId}) '+
                    'WITH collect(labels(n)) AS nodes, relationships '+
                    'RETURN nodes, relationships',
                    {
                        sessionId: sessionId.toString()
                    }
                )
                .then(labels => {
                    session.close();

                    return this.deleteTempGraph(sessionId)
                        .then(() => {
                            var nLabels = labels.records[0].get('nodes').toString().split(',');
                            var rLabels = labels.records[0].get('relationships').toString().split(',');
                            
                            var nCounts = [];
                            var rCounts = [];
                            
                            for (let i = 0; i < nLabels.length; i++) {
                                nCounts[nLabels[i]] = 1 + (nCounts[nLabels[i]] || 0);
                            }
                            for (let i = 0; i < rLabels.length; i++) {
                                rCounts[rLabels[i]] = 1 + (rCounts[rLabels[i]] || 0);
                            }
                            var nodes = Object.entries(nCounts);
                            var relationships = Object.entries(rCounts);
                            let nodesObject = [];
                            let relationshipsObject = [];
                            nodes.forEach(n => {
                                let label = n[0];
                                let count = n[1];
                                nodesObject.push({label: label, count: count});
                            });
                            relationships.forEach(r => {
                                let label = r[0];
                                let count = r[1];
                                relationshipsObject.push({label: label, count: count});
                            });
                            let labelsObject = {
                                nodeLabels: nodesObject,
                                relationshipLabels: relationshipsObject
                            };
                            return labelsObject;
                        });
                });
        });
}

exports.createTempGraph = (data) => {
    var sessionId = process.hrtime.bigint();
    var statements = this.getStatements(data);
    var createDataQuery = 'WITH $sessionId AS sid\r\n' + this.insertSessionId(statements);
    console.log(createDataQuery);

    var session = db.session();
    
    return session
        .run(
            createDataQuery,
            {
                sessionId: sessionId.toString()
            }
        ).then(() => {
            session.close();
            return sessionId;
        });
}

exports.runQuery = (studentQuery, sessionId) => {
    var statements = this.getStatements(studentQuery);
    console.log('\statements:\n'+statements);
    var query = this.insertSessionId(statements);
    console.log('\nquery:\n'+query);

    var session = db.session();
            
    return session
        .run(
            query,
            {
                sessionId: sessionId.toString()
            }
        )
        .then(queryResult => {
            session.close();
            return queryResult;
        });
}

this.insertSessionId = (statements) => {
    var query = '';

    for (let i = 0; i < statements.length; i++) {
        let statement = statements[i];
        if (statement.toUpperCase().startsWith('MATCH') || statement.toUpperCase().startsWith('OPTIONAL MATCH') || statement.toUpperCase().startsWith('CREATE')) {
            var nodes = statement.match(/\(.*?\)/g);
            if (nodes) {
                nodes.forEach(n => {
                    let temp = '';
                    if (n.charAt(n.length-2) !== '}') {
                        temp = (n.substring(0, n.length - 1) + ' {sid: $sessionId}' + n.substring(n.length - 1));
                    } else {
                        temp = (n.substring(0, n.length - 2) + ', sid: $sessionId' + n.substring(n.length - 2));
                    }
                    statement = statement.replace(n, temp);
                });
            }
        }
        if (i != statements.length - 1) {
            query += statement + '\r\n';
        } else {
            query += statement;
        }
    }
    return query;
}

this.getStatements = (query) => {
    var clauses = [
        'MATCH','OPTIONAL MATCH','RETURN','WITH','UNWIND','WHERE','ORDER BY','SKIP',
        'LIMIT','CREATE','DELETE','SET','REMOVE','FOREACH','MERGE','UNION','USE'
    ];
    tokens = query.split(/(match)|(optional match)|(return)|(with)|(unwind)|(where)|(order by)|(skip)|(limit)|(create)|(delete)|(set)|(remove)|(foreach)|(merge)|(union)|(use)/ig);
    tokens = tokens.filter(e => {
        if (e !== undefined) {
            return e.trim();
        }
    });
    var statements = [];
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        if (clauses.includes(token.toUpperCase())) {
            let statement = token + tokens[i + 1];
            statements.push(statement.replace('\r', '').replace('\n', '').trim());
        }
    }
    if (statements.length == 0) {
        return [query];
    } else {
        return statements;
    }
}

exports.compareQueryResults = (result1, result2) => {
    console.log(result1);
    console.log(result2);
    var r1 = [];
    var r2 = [];
    var len1 = 0;
    var len2 = 0;
    for (let i = 0; i < result1.length; i++) {
        let fields = [];
        result1[i]._fields.forEach(field => {
            fields.push(field);
        });
        r1.push(JSON.stringify(fields));
        if (i == result1.length - 1) {
            len1 = i + 1;
        }
    }
    for (let i = 0; i < result2.length; i++) {
        let fields = [];
        result2[i]._fields.forEach(field => {
            fields.push(field);
        });
        r2.push(JSON.stringify(fields));
        if (i == result2.length - 1) {
            len2 = i + 1;
        }
    }
    console.log(r1);
    console.log('--------------------------------------------------------------');
    console.log(r2);

    var matches = 0;
    var differences = 0;

    r2.forEach(record => {
        var i = r1.indexOf(record);
        if (i != -1) {
            matches++;
            r1.splice(i, 1);
        } else {
            differences++;
        }
    });

    console.log('matches: '+matches);
    console.log('differences: '+differences);
    var similarity = -1;
    if (len1 > len2) {
        console.log('case 1');
        similarity = matches * (100/(len1));
    } else {
        console.log('case 2');
        similarity = matches * (100/(matches+differences));
    }
    console.log('similarity: '+similarity);
    /*if (r2.toString() === r1.toString()) {
        console.log('results are in correct order');
    } else {
        console.log('results are not in correct order');
    }*/
    return similarity.toFixed(2);
}

exports.getAttempt = (studentUsername, topicOrderNumber, exerciseOrderId) => {
    var session = db.session();
    
    return session
        .run(
            'MATCH (student:Student {username: $username})-[:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $topicOrderNumber}) '+
            'MATCH (student)-[attempt:ATTEMPTED]->(exercise:Exercise {orderId: $exerciseOrderId})-[:FROM]->(topic) '+
            'RETURN attempt',
            {
                username: studentUsername,
                topicOrderNumber: parseInt(topicOrderNumber),
                exerciseOrderId: parseInt(exerciseOrderId)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.attempt = (studentUsername, topicOrderNumber, exerciseOrderId, studentQuery, similarity) => {

    let newSimilarity = parseFloat(similarity);
    let score = 0;
    if (newSimilarity == 100) {
        score = 2;
    } else if (newSimilarity >= 90) {
        score = 1;
    }

    return this.hasAttempted(studentUsername, topicOrderNumber, exerciseOrderId)
        .then(result => {
            let hasAttempted = result.records[0].get(0);
            if (!hasAttempted) {
                console.log('no attempt exists');
                // Create attempt
                return this.createAttempt(studentUsername, topicOrderNumber, exerciseOrderId, studentQuery, newSimilarity, score)
                    .then(() => {
                        console.log('attempt created!');
                    });
            } else {
                console.log('attempt exists');
                return this.getAttemptSimilarity(studentUsername, topicOrderNumber, exerciseOrderId)
                    .then(similarity => {
                        let oldSimilarity = parseFloat(similarity.records[0].get('similarity'));
                        console.log(oldSimilarity);
                        console.log(newSimilarity);
                        if (oldSimilarity <= newSimilarity) {
                            // update attempt
                            return this.updateAttempt(studentUsername, topicOrderNumber, exerciseOrderId, studentQuery, newSimilarity, score)
                                .then(() => {
                                    console.log('attempt updated!');
                                });
                        } else {
                            console.log('keep the same');
                        }
                    });
            }
        });

}

this.hasAttempted = (studentUsername, topicOrderNumber, exerciseOrderId) => {
    var session = db.session();
    
    return session
        .run(
            'MATCH (student:Student {username: $username})-[:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $topicOrderNumber}) '+
            'MATCH (exercise:Exercise {orderId: $exerciseOrderId})-[:FROM]->(topic) '+
            'WITH EXISTS( (student)-[:ATTEMPTED]->(exercise) ) AS hasAttempted '+
            'RETURN hasAttempted',
            {
                username: studentUsername,
                topicOrderNumber: parseInt(topicOrderNumber),
                exerciseOrderId: parseInt(exerciseOrderId)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

this.createAttempt = (studentUsername, topicOrderNumber, exerciseOrderId, studentQuery, similarityPercent, score) => {
    var session = db.session();
    
    return session
        .run(
            'WITH datetime() AS currDateTime '+
            'MATCH (student:Student {username: $username})-[:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $topicOrderNumber}) '+
            'MATCH (exercise:Exercise {orderId: $exerciseOrderId})-[:FROM]->(topic) '+
            'CREATE (student)-[:ATTEMPTED {dateTimeCreated: currDateTime, query: $query, similarity: $similarity, score: $score}]->(exercise) ',
            {
                username: studentUsername,
                topicOrderNumber: parseInt(topicOrderNumber),
                exerciseOrderId: parseInt(exerciseOrderId),
                query: studentQuery,
                similarity: similarityPercent,
                score: score
            }
        ).then(result => {
            session.close();
            return result;
        });
}

this.getAttemptSimilarity = (studentUsername, topicOrderNumber, exerciseOrderId) => {
    var session = db.session();
    
    return session
        .run(
            'MATCH (student:Student {username: $username})-[:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $topicOrderNumber}) '+
            'MATCH (student)-[attempt:ATTEMPTED]->(exercise:Exercise {orderId: $exerciseOrderId})-[:FROM]->(topic) '+
            'RETURN attempt.similarity AS similarity',
            {
                username: studentUsername,
                topicOrderNumber: parseInt(topicOrderNumber),
                exerciseOrderId: parseInt(exerciseOrderId)
            }
        ).then(result => {
            session.close();
            return result;
        });
}

this.updateAttempt = (studentUsername, topicOrderNumber, exerciseOrderId, studentQuery, similarityPercent, score) => {
    var session = db.session();
    
    return session
        .run(
            'WITH datetime() AS currDateTime '+
            'MATCH (student:Student {username: $username})-[:ENROLLED_IN]->(:Class)<-[:PART_OF]-(topic:Topic {orderNumber: $topicOrderNumber}) '+
            'MATCH (student)-[attempt:ATTEMPTED]->(exercise:Exercise {orderId: $exerciseOrderId})-[:FROM]->(topic) '+
            'SET attempt.dateTimeCreated = currDateTime, attempt.query = $query, attempt.similarity = $similarity, attempt.score = $score',
            {
                username: studentUsername,
                topicOrderNumber: parseInt(topicOrderNumber),
                exerciseOrderId: parseInt(exerciseOrderId),
                query: studentQuery,
                similarity: similarityPercent,
                score: score
            }
        ).then(result => {
            session.close();
            return result;
        });
}

exports.deleteTempGraph = (sessionId) => {
    var session = db.session();
    
    return session
        .run(
            'MATCH (n {sid: $sessionId}) '+
            'DETACH DELETE n',
            {
                sessionId: sessionId.toString()
            }
        ).then(result => {
            session.close();
            return result;
        });
}